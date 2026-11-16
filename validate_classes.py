"""Fase 6 del plan: validacion del metodo con clases de terreno documentadas (decision del equipo 15-nov).

Lee validacion_clases.csv (sitios lunares de mar y de tierras altas, clase fijada ANTES de correr por nombre
IAU y confirmada con FeO de Kaguya). Extrae su relieve con el mismo procedimiento que ingest.py, calcula las
mismas distribuciones de pendiente que distributions.py y evalua las predicciones congeladas en el CSV:

  P1 (agrupamiento): con pesos desconocidos entre escalas (uniformes en el simplex, como SMAA), el vecino mas
     cercano de cada sitio es de su misma clase con probabilidad mayor que el azar.
  P2 (escala, Kreslavsky EPSC-DPS 2011 / Icarus 2013): mares y tierras altas se separan mas a escala
     kilometrica que hectometrica -> la razon (distancia entre clases / distancia dentro de clase) es mayor en
     la escala mas gruesa (3186 m) que en la mas fina (118 m).

No ajusta nada del modelo: solo reporta si las predicciones se cumplen.
Uso:   python validate_classes.py
Salida: out/validacion_clases.json  (relieves en out/validation/)
"""
import json, os
import numpy as np
import pandas as pd
import rasterio

import distributions as dist
from ingest import read_planetary, GDAL_ENV, PAIR_CFG

N_W = 10000
SEED = 20261115
OUT_DIR = "out/validation"


def get_dem(site_id, lat, lon):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = f"{OUT_DIR}/MOON_{site_id}_dem.npy"
    if site_id == "MOON_TRANQ":                     # ya extraido por ingest.py
        return np.load("out/hillshade/MOON_MOON_TRANQ_dem.npy")
    if os.path.exists(path):
        return np.load(path)
    cfg = PAIR_CFG["MOON"]
    with rasterio.Env(**GDAL_ENV):
        z = read_planetary("MOON", lat, lon, cfg["size_km"], cfg["res"])
    np.save(path, z)
    return z


def quantiles(z):
    return np.stack([np.quantile(dist.slope_at_lag(z.astype("float64"), dist.RES["MOON"], L), dist.QUANTILES)
                     for L in dist.LAGS])


def main():
    v = pd.read_csv("validacion_clases.csv", comment="#")
    q = {}
    for r in v.itertuples():
        print(f"  relieve {r.site_id} ...", flush=True)
        q[r.site_id] = quantiles(get_dem(r.site_id, r.lat, r.lon))
    ids = v.site_id.tolist()
    cls = dict(zip(v.site_id, v.clase))
    n, K = len(ids), len(dist.LAGS)
    D = np.zeros((n, n, K))
    for i, a in enumerate(ids):
        for j, b in enumerate(ids):
            D[i, j] = np.mean(np.abs(q[a] - q[b]), axis=-1)
    # P1: vecino mas cercano con pesos desconocidos
    rng = np.random.default_rng(SEED)
    w = rng.dirichlet(np.ones(K), size=N_W)
    p_same = {}
    for i, a in enumerate(ids):
        others = [j for j in range(n) if j != i]
        score = np.einsum("wk,jk->wj", w, D[i, others])
        nn = np.array(others)[score.argmin(axis=1)]
        p_same[a] = float(np.mean([cls[ids[j]] == cls[a] for j in nn]))
    chance = {a: (sum(cls[b] == cls[a] for b in ids) - 1) / (n - 1) for a in ids}
    p1_mean, chance_mean = float(np.mean(list(p_same.values()))), float(np.mean(list(chance.values())))
    # P2: razon de separacion por escala
    ratios = {}
    for k, L in enumerate(dist.LAGS):
        between = [D[i, j, k] for i in range(n) for j in range(n) if i < j and cls[ids[i]] != cls[ids[j]]]
        within = [D[i, j, k] for i in range(n) for j in range(n) if i < j and cls[ids[i]] == cls[ids[j]]]
        ratios[f"slope_{int(L * dist.RES['MOON'])}m"] = {"between_mean": float(np.mean(between)),
                                                          "within_mean": float(np.mean(within)),
                                                          "ratio": float(np.mean(between) / np.mean(within))}
    keys = list(ratios)
    out = {
        "P1_agrupamiento": {"p_vecino_misma_clase_por_sitio": p_same, "media": p1_mean,
                            "azar_media": chance_mean, "se_cumple": p1_mean > chance_mean},
        "P2_escala": {"por_escala": ratios, "se_cumple": ratios[keys[-1]]["ratio"] > ratios[keys[0]]["ratio"]},
        "sitios": v.to_dict(orient="records"),
        "distancias_deg": {a: {b: dict(zip(keys, map(float, D[i, j]))) for j, b in enumerate(ids)}
                           for i, a in enumerate(ids)},
        "nota": "Valida que la metrica distingue clases de terreno documentadas en la Luna. NO valida la "
                "comparacion Tierra-Luna ni Tierra-Marte (no hay pares de relieve publicados para nuestros sitios).",
    }
    with open("out/validacion_clases.json", "w", encoding="utf-8") as fo:
        json.dump(out, fo, ensure_ascii=False, indent=2)
    print("\nP1 vecino de la misma clase:")
    for a in ids:
        print(f"  {a:22s} {cls[a]:8s} P={p_same[a]:.2f} (azar {chance[a]:.2f})")
    print(f"  media {p1_mean:.2f} frente a azar {chance_mean:.2f} -> {'SE CUMPLE' if out['P1_agrupamiento']['se_cumple'] else 'NO SE CUMPLE'}")
    print("P2 razon entre/dentro de clase por escala:")
    for kname, r in ratios.items():
        print(f"  {kname:12s} entre={r['between_mean']:.2f} dentro={r['within_mean']:.2f} razon={r['ratio']:.2f}")
    print(f"  -> {'SE CUMPLE' if out['P2_escala']['se_cumple'] else 'NO SE CUMPLE'}")


if __name__ == "__main__":
    main()

"""Fase 3 del plan: distribuciones de relieve por sitio y distancias entre sitios.

En vez de resumir cada sitio con un promedio, se guarda la DISTRIBUCION completa de la
pendiente por pixel a varias escalas, y se mide cuanto se parecen dos sitios con la
distancia de Wasserstein-1 (en grados): el promedio de la diferencia entre sus curvas
de cuantiles. Dos sitios identicos dan 0.

Solo usa relieve porque es la unica dimension que se mide igual en los tres cuerpos
(misma variable, mismo metodo y misma resolucion dentro de cada par; la Tierra ya esta
degradada a la resolucion del cuerpo planetario por ingest.py).

Adaptacion declarada: comparar distribuciones de pendiente entre cuerpos con Wasserstein
es una decision nuestra. Las escalas multiples siguen la idea de pendiente diferencial
de Kreslavsky y Head (2000), pero no su formula exacta.

Uso:   python distributions.py      (lee out/hillshade/{PAIR}_{site}_dem.npy)
Salida: out/distancias_{PAIR}.json
"""
import json
import numpy as np
import pandas as pd

RES = {"MOON": 118.0, "MARS": 463.0}   # m/pixel (ingest.py, PAIR_CFG)
LAGS = (1, 3, 9, 27)                    # separacion en pixeles -> baseline = L * res
QUANTILES = np.linspace(0.0005, 0.9995, 1000)
# Umbrales con fuente en requisitos.csv (R03, R01, R04, R02). Se evaluan a la escala mas fina.
REQ_THRESHOLDS = {"R03_lt5": 5.0, "R01_lt10": 10.0, "R04_lt15": 15.0, "R02_lt20": 20.0}


def load_dem(pair, site_id, body):
    """Carga el recorte de elevacion. En la Tierra enmascara el mar.
    Copernicus GLO-30 pone el oceano en elevacion exactamente 0; se marca como hueco junto
    con 1 pixel de borde (celdas de costa mezcla de mar y tierra). Si no se enmascara, el mar
    (perfectamente plano) infla la fraccion llana de los sitios costeros."""
    z = np.load(f"out/hillshade/{pair}_{site_id}_dem.npy").astype("float64")
    sea_frac, plateau_frac = 0.0, 0.0
    if body == "EARTH":
        # Mesetas editadas: Copernicus aplana cuerpos de agua a una cota fija (en Lake Gairdner
        # 119.00 m en >30 % de la ventana). Tras promediar >=16 pixeles de 30 m por celda, el
        # terreno natural no repite la misma cota (al mm) en >=1 % del area (max observado 0.1 %).
        # Solo en la Tierra: LOLA y MOLA cuantizan a 0.5 m / 1 m y repiten cotas de forma natural.
        v = np.round(z[np.isfinite(z)], 3)
        vals, cnt = np.unique(v, return_counts=True)
        flat_vals = vals[(cnt >= 0.01 * v.size) & (vals != 0.0)]
        if flat_vals.size:
            plateau = np.isin(np.round(z, 3), flat_vals)
            plateau_frac = float(plateau.mean())
            z[plateau] = np.nan
        sea = z == 0.0
        if sea.any():
            p = np.pad(sea, 1, mode="constant", constant_values=False)
            grown = sea.copy()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    grown |= p[1 + dy:1 + dy + z.shape[0], 1 + dx:1 + dx + z.shape[1]]
            sea_frac = float(grown.mean())
            z[grown] = np.nan
    return z, sea_frac, plateau_frac


def slope_at_lag(z, res, lag):
    """Pendiente (grados) en celdas de lag x lag pixeles: diferencias promediadas en los dos
    lados de la celda. Baseline = lag * res metros. Las celdas que tocan un hueco quedan NaN."""
    L = lag
    a, b = z[:-L, :-L], z[:-L, L:]      # arriba-izq, arriba-der
    c, d = z[L:, :-L], z[L:, L:]        # abajo-izq,  abajo-der
    dzdx = ((b - a) + (d - c)) / (2 * L * res)
    dzdy = ((c - a) + (d - b)) / (2 * L * res)
    s = np.degrees(np.arctan(np.hypot(dzdx, dzdy)))
    return s[np.isfinite(s)]


def site_distribution(pair, site_id, body):
    z, sea_frac, plateau_frac = load_dem(pair, site_id, body)
    res = RES[pair]
    feats, summary = {}, {"sea_frac_masked": round(sea_frac, 4),
                          "edited_plateau_frac_masked": round(plateau_frac, 4),
                          "valid_frac": round(float(np.isfinite(z).mean()), 4)}
    for L in LAGS:
        s = slope_at_lag(z, res, L)
        name = f"slope_{int(L * res)}m"
        feats[name] = np.quantile(s, QUANTILES)
        summary[name] = {"n": int(s.size), "p10": float(np.percentile(s, 10)),
                         "median": float(np.median(s)), "p90": float(np.percentile(s, 90))}
        if L == 1:
            summary["requirement_fractions"] = {k: float(np.mean(s < v))
                                                for k, v in REQ_THRESHOLDS.items()}
            summary["requirement_scale_m"] = res
    return feats, summary


def wasserstein1(qa, qb):
    """Wasserstein-1 entre dos distribuciones 1D dadas por sus cuantiles en la misma rejilla."""
    return float(np.mean(np.abs(qa - qb)))


def run(pair):
    sites = pd.read_csv("sites.csv")
    sites = sites[sites.body.isin([pair, "EARTH"])]
    dists, summaries = {}, {}
    for r in sites.itertuples():
        dists[r.site_id], summaries[r.site_id] = site_distribution(pair, r.site_id, r.body)
    refs = sites[sites.body == pair].site_id.tolist()
    earth = sites[sites.body == "EARTH"].site_id.tolist()
    features = list(next(iter(dists.values())).keys())
    pairs = {}
    for ref in refs:
        pairs[ref] = {e: {f: wasserstein1(dists[ref][f], dists[e][f]) for f in features}
                      for e in earth}
    # control: cada sitio contra si mismo debe dar 0
    self_check = max(wasserstein1(dists[s][f], dists[s][f]) for s in dists for f in features)
    out = {
        "target_body": pair, "resolution_m": RES[pair], "features": features,
        "units": "grados (Wasserstein-1 entre distribuciones de pendiente)",
        "method": ("Pendiente por celdas de LxL pixeles, L en " + str(LAGS)
                   + "; distancia = media de |diferencia de cuantiles| en 1000 cuantiles"),
        "self_distance_max": self_check,
        "site_summaries": summaries,
        "distances": pairs,
    }
    with open(f"out/distancias_{pair}.json", "w", encoding="utf-8") as fo:
        json.dump(out, fo, ensure_ascii=False, indent=2)
    return out


if __name__ == "__main__":
    for pair in ["MOON", "MARS"]:
        o = run(pair)
        print(f"\n===== {pair} (resolucion {o['resolution_m']:.0f} m) | autodistancia max = {o['self_distance_max']}")
        for s, sm in o["site_summaries"].items():
            f0 = o["features"][0]
            print(f"  {s:16s} mar={sm['sea_frac_masked']:.3f} meseta_editada={sm['edited_plateau_frac_masked']:.3f} "
                  f"valido={sm['valid_frac']:.3f} "
                  f"pendiente {f0}: mediana={sm[f0]['median']:.2f} p90={sm[f0]['p90']:.2f}")
    print("\nOK -> out/distancias_MOON.json y out/distancias_MARS.json")

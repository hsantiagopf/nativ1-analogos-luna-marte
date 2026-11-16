"""Modelo v1 (metodo confirmado por el equipo el 15-nov; ver PLAN_IMPLEMENTACION.md).

Ranking = SMAA-2 sobre distancias entre distribuciones de pendiente a 4 escalas (relieve).
- Inercia termica y mineralogia: DESCRIPTIVAS, fuera del ranking (decision del equipo): no hay
  una magnitud comun entre cuerpos. Aparecen en las explicaciones.
- Relieve sombreado (hillshade): descriptivo, solo para el dashboard.
- Marte: se excluyen sitios NOT_ARID (filtro de aridez UNEP, requisitos.csv R08/P03).
- Lenguaje: "mas parecido en el relieve medido", nunca "el mejor analogo".
La linea base anterior esta en model_v0.py (no es resultado).

Uso:    python model.py                 (10 000 iteraciones, 200 replicas de ruido)
Salida: out/ranking_{PAIR}.json/.csv y out/all_rankings.json
"""
import json, sys
import numpy as np
import pandas as pd

import distributions as dist
import smaa

TOP_K = 3
N_ITER = 10000
N_NOISE = 200
SEED = 20261115
# Un candidato es "robusto" si su probabilidad de Top-K casi no cambia al anadir el error de
# medicion. 10 puntos es un umbral de reporte del proyecto (sin fuente); solo etiqueta, no ordena.
ROBUST_TOL_PTS = 10.0

BODY_BREAKDOWN = {
    "MOON": ("Fisica del cuerpo: la Luna no tiene atmosfera, su gravedad es ~0.17 g y su regolito "
             "no tiene agua ni oxidacion; nada de eso se reproduce en la Tierra."),
    "MARS": ("Fisica del cuerpo: Marte tiene una atmosfera de ~0.6 % de la presion terrestre, gravedad "
             "~0.38 g y mas radiacion en superficie; el transporte de polvo y el ambiente termico difieren."),
}


def load_csv(path):
    try:
        return pd.read_csv(path, comment="#").set_index("site_id")
    except FileNotFoundError:
        return pd.DataFrame()


def fmt(x, nd=2):
    return "s/d" if x is None or (isinstance(x, float) and np.isnan(x)) else f"{x:.{nd}f}"


# Fase 5: requisitos citados (requisitos.csv). Umbrales por punto: se compara la fraccion de area
# apta (intervalo del 90 % sobre las replicas con ruido). R03 si es pasa/no pasa con area minima citada.
REQS = [("R01", 10.0, "aterrizaje (pendiente < 10 grados, Artemis III)"),
        ("R04", 15.0, "rover (pendiente <= 15 grados, VIPER)"),
        ("R02", 20.0, "caminata (pendiente < 20 grados, EVA Artemis III)")]
R03_DEG, R03_MIN_AREA = 5.0, 0.25


BLOCK_M = 4000.0   # bloque del bootstrap = diametro de la zona de exploracion de R03 (circulo de 2 km de radio)
N_BOOT = 2000


def slope_map(pair, site_id, body):
    """Pendiente 2D (grados) a la escala mas fina, con NaN en mar/mesetas editadas."""
    z, _, _ = dist.load_dem(pair, site_id, body)
    a, b, c, d = z[:-1, :-1], z[:-1, 1:], z[1:, :-1], z[1:, 1:]
    res = dist.RES[pair]
    dzdx = ((b - a) + (d - c)) / (2 * res)
    dzdy = ((c - a) + (d - b)) / (2 * res)
    return np.degrees(np.arctan(np.hypot(dzdx, dzdy)))


def block_bootstrap_fracs(s, res, thresholds, seed):
    """Variabilidad espacial: fraccion del area con pendiente < t, remuestreando bloques de BLOCK_M.
    Responde: cuanto cambiaria la fraccion si se midiera otra porcion del mismo terreno."""
    bs = max(1, int(round(BLOCK_M / res)))
    nby, nbx = s.shape[0] // bs, s.shape[1] // bs
    valid, below = [], {t: [] for t in thresholds}
    for i in range(nby):
        for j in range(nbx):
            blk = s[i * bs:(i + 1) * bs, j * bs:(j + 1) * bs]
            v = np.isfinite(blk)
            valid.append(v.sum())
            for t in thresholds:
                below[t].append(np.sum(blk[v] < t))
    valid = np.array(valid, float)
    keep = valid > 0
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, keep.sum(), size=(N_BOOT, keep.sum()))
    vk = valid[keep]
    return {t: np.array(below[t], float)[keep][idx].sum(axis=1) / vk[idx].sum(axis=1) for t in thresholds}


def requirement_assessment(ref_map, cand_map, res):
    """Fraccion de area apta con intervalo del 90 % por bootstrap espacial.
    'coincide' = los intervalos se solapan: la diferencia no supera la variabilidad dentro del propio terreno."""
    th = [t for _, t, _ in REQS] + [R03_DEG]
    br = block_bootstrap_fracs(ref_map, res, th, SEED)
    bc = block_bootstrap_fracs(cand_map, res, th, SEED + 1)
    out = {"method": f"bootstrap espacial por bloques de {BLOCK_M/1000:.0f} km ({N_BOOT} remuestreos), escala {res:.0f} m"}
    for rid, t, label in REQS:
        fr, fc = br[t], bc[t]
        # se compara con la precision de reporte de las fichas (porcentajes enteros = 0.01): cerca del 100 % el
        # intervalo de la referencia es degenerado y diferencias de decimas de punto no tienen sentido practico
        ir = (round(float(np.percentile(fr, 5)), 2), round(float(np.percentile(fr, 95)), 2))
        ic = (round(float(np.percentile(fc, 5)), 2), round(float(np.percentile(fc, 95)), 2))
        overlap = ir[0] <= ic[1] and ic[0] <= ir[1]
        verdict = "coincide" if overlap else ("candidato_mas_apto" if ic[0] > ir[1] else "candidato_menos_apto")
        out[rid] = {"threshold_deg": t, "label": label, "verdict": verdict,
                    "ref_area_frac": {"median": round(float(np.median(fr)), 4), "p05": round(ir[0], 4), "p95": round(ir[1], 4)},
                    "cand_area_frac": {"median": round(float(np.median(fc)), 4), "p05": round(ic[0], 4), "p95": round(ic[1], 4)}}
    f5r, f5c = br[R03_DEG], bc[R03_DEG]
    out["R03"] = {"threshold_deg": R03_DEG, "min_area_frac": R03_MIN_AREA,
                  "p_pass_ref": round(float(np.mean(f5r >= R03_MIN_AREA)), 4),
                  "p_pass_cand": round(float(np.mean(f5c >= R03_MIN_AREA)), 4)}
    return out


def explanations(pair, ref, cand, d_clean, summ, feats, minerals, ti_ref, mean_elev, req=None):
    scales = list(d_clean.keys())
    order = sorted(scales, key=lambda s: d_clean[s])
    med = lambda site, s: summ[site][s]["median"]
    strongest = [f"pendiente a {s.split('_')[1]}: distancia {d_clean[s]:.2f} grados "
                 f"(mediana {med(ref, s):.1f} frente a {med(cand, s):.1f})" for s in order[:2]]
    worst = order[-1]
    breaks = [f"Relieve: la escala menos parecida es {worst.split('_')[1]} "
              f"(distancia {d_clean[worst]:.2f} grados; mediana {med(ref, worst):.1f} frente a {med(cand, worst):.1f})."]
    # termica descriptiva
    ti_c = feats.loc[cand, "thermal_inertia"] if cand in feats.index else np.nan
    t = (f"Inercia termica (descriptiva, fuera del ranking): referencia {fmt(ti_ref, 1)} J m-2 K-1 s-1/2; "
         f"candidato indice aparente {fmt(ti_c, 3)} (1/K). No son comparables: la presion atmosferica cambia "
         f"la inercia del mismo material.")
    if mean_elev is not None and mean_elev > 3000:
        t += f" Ademas este sitio esta a ~{mean_elev:.0f} m: la oscilacion dia-noche se amplifica por la atmosfera delgada."
    breaks.append(t)
    # mineralogia descriptiva
    em = minerals["EARTH"].loc[cand] if cand in minerals["EARTH"].index else None
    s2 = (f"Sentinel-2 en el candidato: indice de oxido de hierro {fmt(em['iron_oxide_idx'])}, "
          f"arcilla/sulfato {fmt(em['clay_sulfate_idx'])} (cocientes de reflectancia)") if em is not None else "sin datos Sentinel-2"
    if pair == "MOON":
        mm = minerals["MOON"].loc[ref] if ref in minerals["MOON"].index else None
        feo = fmt(mm["feo_wt_pct"], 1) if mm is not None else "s/d"
        breaks.append(f"Mineralogia (descriptiva): la Luna no tiene oxidos ferricos, sulfatos, arcillas ni carbonatos "
                      f"(sin agua ni oxidacion); FeO de la referencia {feo} % (Kaguya). {s2}. Composicion no comparable.")
    else:
        mm = minerals["MARS"].loc[ref] if ref in minerals["MARS"].index else None
        lit = (f"ferrico {fmt(mm['min_ferric_oxide'],1)}, sulfato {fmt(mm['min_sulfate'],1)}, arcilla {fmt(mm['min_clay'],1)}, "
               f"carbonato {fmt(mm['min_carbonate'],1)} (presencia 0-1 segun literatura)") if mm is not None else "s/d"
        breaks.append(f"Mineralogia (descriptiva): referencia {lit}. {s2}. Son magnitudes distintas; no se puntua.")
    # artefactos de datos
    sc = summ[cand]
    if sc["sea_frac_masked"] > 0:
        breaks.append(f"Datos: se excluyo {sc['sea_frac_masked']*100:.0f} % de la ventana por ser mar.")
    if sc["edited_plateau_frac_masked"] > 0:
        breaks.append(f"Datos: se excluyo {sc['edited_plateau_frac_masked']*100:.0f} % por cotas editadas (cuerpo de agua aplanado "
                      f"en Copernicus); el relieve se mide solo en el entorno.")
    breaks.append(BODY_BREAKDOWN[pair])
    # utilidad de mision (Fase 5: cumplimiento de requisitos citados bajo error de medicion)
    if pair == "MOON" and req is not None:
        same, more, less = [], [], []
        for rid, _, label in REQS:
            r = req[rid]
            (same if r["verdict"] == "coincide" else more if r["verdict"] == "candidato_mas_apto" else less).append(label)
        parts = []
        if same:
            parts.append("El area apta coincide con la referencia dentro de la variabilidad del propio terreno para: "
                         + "; ".join(same) + ".")
        if more:
            parts.append("El candidato tiene MAS terreno apto que la referencia (ensayo menos exigente que el sitio real) para: "
                         + "; ".join(more) + ".")
        if less:
            parts.append("El candidato tiene MENOS terreno apto que la referencia (ensayo mas exigente) para: " + "; ".join(less) + ".")
        r3 = req["R03"]
        parts.append(f"Criterio R03 (<= 5 grados en >= 25 % del area): probabilidad de cumplirlo {r3['p_pass_ref']*100:.0f} % "
                     f"en la referencia y {r3['p_pass_cand']*100:.0f} % en el candidato.")
        parts.append("Limites: pendiente medida a 118 m (requisitos a 100 m); R03 evaluado sobre la ventana de 30 km, "
                     "no sobre un circulo de 2 km; no dice nada de rocas, polvo ni carga del suelo.")
        util = " ".join(parts)
    else:
        util = ("No demostrado para aterrizaje ni movilidad: esos requisitos en Marte estan definidos a escala de metros "
                "(InSight 2-84 m) y estas pendientes son a 463 m. Sirve como parecido de relieve a escala regional.")
    return strongest, breaks, util


def run_pair(pair):
    sites = pd.read_csv("sites.csv")
    sites = sites[sites.body.isin([pair, "EARTH"])]
    feats = pd.read_parquet(f"out/features_{pair}.parquet").set_index("site_id")
    minerals = {"EARTH": load_csv("earth_minerals.csv"), "MARS": load_csv("mars_minerals.csv"),
                "MOON": load_csv("moon_minerals.csv")}
    dist_out = dist.run(pair)                      # distribuciones limpias + out/distancias_{pair}.json
    summ, features = dist_out["site_summaries"], dist_out["features"]
    excluded = []
    earth = sites[sites.body == "EARTH"]
    if pair == "MARS":
        cls = feats["aridity_class"]
        excluded = [s for s in earth.site_id if cls.get(s) == "NOT_ARID"]
        earth = earth[~earth.site_id.isin(excluded)]
    refs = sites[sites.body == pair]
    alts = earth.site_id.tolist()
    bodies = {r.site_id: r.body for r in pd.concat([refs, earth]).itertuples()}
    clean = {s: smaa.clean_quantiles(pair, s, b) for s, b in bodies.items()}
    print(f"[{pair}] replicas con ruido ({N_NOISE} por sitio; se guardan en {smaa.CACHE_DIR}/ruido_{pair}.npz)...", flush=True)
    noisy = smaa.noise_cache(pair, bodies, n_real=N_NOISE, seed=SEED)
    slope_maps = {s: slope_map(pair, s, b) for s, b in bodies.items()} if pair == "MOON" else {}
    mean_elev = {}
    for s in alts:
        z, _, _ = dist.load_dem(pair, s, "EARTH")
        mean_elev[s] = float(np.nanmean(z))
    result = {"target_body": pair, "excluded_by_aridity": excluded, "references": []}
    for ref in refs.itertuples():
        D_clean = smaa.distance_tensor(clean[ref.site_id][None], [clean[a][None] for a in alts])
        D_noisy = smaa.distance_tensor(noisy[ref.site_id], [noisy[a] for a in alts])
        w_only = smaa.smaa2(D_clean, N_ITER, SEED, TOP_K)
        full = smaa.smaa2(D_noisy, N_ITER, SEED, TOP_K)
        ti_ref = feats.loc[ref.site_id, "thermal_inertia"] if ref.site_id in feats.index else np.nan
        cands = []
        for i, a in enumerate(alts):
            d = {f: float(D_clean[0, i, k]) for k, f in enumerate(features)}
            req = (requirement_assessment(slope_maps[ref.site_id], slope_maps[a], dist.RES[pair])
                   if pair == "MOON" else None)
            strongest, breaks, util = explanations(pair, ref.site_id, a, d, summ, feats, minerals, ti_ref, mean_elev[a], req)
            p_n, p_w = float(full["p_top_k"][i]) * 100, float(w_only["p_top_k"][i]) * 100
            robust = "robusto" if abs(p_n - p_w) < ROBUST_TOL_PTS else "sensible al error de medicion"
            if robust != "robusto":
                breaks.insert(0, (f"Resultado no resuelto con estos datos: la probabilidad de Top-{TOP_K} cambia de "
                                  f"{p_w:.0f} % a {p_n:.0f} % al incluir el error de los modelos de elevacion. "
                                  f"En terreno muy llano la pendiente medida esta cerca del nivel de ruido."))
            cands.append({
                "robustness": robust,
                "requirement_assessment": req if req is not None else
                    "no evaluable: requisitos de Marte definidos a escala de metros; pendiente medida a 463 m",
                "site_id": a, "name": sites.set_index("site_id").loc[a, "name"],
                "role": sites.set_index("site_id").loc[a, "role"],
                "score_global": round(float(full["p_top_k"][i]) * 100, 1),
                "score_global_meaning": f"probabilidad (%) de quedar entre los {TOP_K} mas parecidos en relieve, "
                                        f"con pesos desconocidos y error de medicion",
                "p_top_k_solo_pesos": round(float(w_only["p_top_k"][i]) * 100, 1),
                "expected_rank": round(float(full["expected_rank"][i]), 2),
                "rank_acceptability": [round(float(x), 4) for x in full["rank_acceptability"][i]],
                "central_weights": {f: (None if np.isnan(full["central_weights"][i, k]) else round(float(full["central_weights"][i, k]), 3))
                                    for k, f in enumerate(features)},
                "weighted_distance_deg": {"median": round(float(full["weighted_distance_median"][i]), 3),
                                          "p05": round(float(full["weighted_distance_p05"][i]), 3),
                                          "p95": round(float(full["weighted_distance_p95"][i]), 3)},
                "scores": {"relieve_multiescala_distancia_deg": {k: round(v, 3) for k, v in d.items()},
                           "inercia_termica": None, "mineralogia": None, "visual": None},
                "scores_note": "Solo el relieve entra al ranking; termica, mineralogia y visual son descriptivas (decision del equipo).",
                "strongest_matches": strongest, "where_it_breaks_down": breaks, "mission_utility": util,
            })
        cands.sort(key=lambda c: (-c["score_global"], c["expected_rank"]))
        result["references"].append({"ref_site_id": ref.site_id, "ref_name": ref.name,
                                     "ref_relief_summary": summ[ref.site_id], "candidates": cands})
    with open(f"out/ranking_{pair}.json", "w", encoding="utf-8") as fo:
        json.dump(result, fo, ensure_ascii=False, indent=2)
    rows = [{"target": pair, "ref": r["ref_site_id"], "candidate": c["site_id"], "role": c["role"],
             "p_top3_pct": c["score_global"], "p_top3_solo_pesos_pct": c["p_top_k_solo_pesos"],
             "expected_rank": c["expected_rank"], "robustness": c["robustness"],
             "weighted_distance_deg_median": c["weighted_distance_deg"]["median"],
             **{f"w1_{k}": v for k, v in c["scores"]["relieve_multiescala_distancia_deg"].items()}}
            for r in result["references"] for c in r["candidates"]]
    pd.DataFrame(rows).to_csv(f"out/ranking_{pair}.csv", index=False)
    return result


META = {
    "version": "v1",
    "method": "SMAA-2 (Lahdelma y Salminen 2001) sobre distancias Wasserstein-1 entre distribuciones de pendiente a 4 escalas",
    "top_k": TOP_K, "n_iter": N_ITER, "n_noise_replicas": N_NOISE, "seed": SEED,
    "weights": "desconocidos: uniformes sobre el simplex",
    "measurement_error": "requisitos.csv E01 (Copernicus, primaria), E02-E03 (LOLA/MOLA, secundaria)",
    "ranked_dimensions": ["relieve_multiescala"],
    "descriptive_dimensions": ["inercia_termica", "mineralogia", "visual_hillshade"],
    "profiles": {
        "general": "este ranking",
        "aterrizaje/movilidad (Luna)": "mismo ranking; requisitos R01/R03/R04/R02 en mission_utility",
        "aterrizaje/movilidad (Marte)": "mismo ranking; requisitos no evaluables a 463 m (no demostrado)",
        "recursos_in_situ": "sin ranking: sus dimensiones (mineralogia, termica) son descriptivas",
    },
    "language": "mas parecido en el relieve medido; nunca 'el mejor analogo'",
}

if __name__ == "__main__":
    out = {"meta": META}
    for pair in ["MOON", "MARS"]:
        res = run_pair(pair)
        out[pair] = res
        print(f"\n================= {pair} =================")
        if res["excluded_by_aridity"]:
            print("Excluidos por aridez:", res["excluded_by_aridity"])
        for r in res["references"]:
            print(f"\n{r['ref_site_id']}: P(Top-{TOP_K}) con pesos+ruido [solo pesos] | posicion esperada | robustez")
            for c in r["candidates"][:5]:
                print(f"   {c['site_id']:16s} {c['score_global']:5.1f} % [{c['p_top_k_solo_pesos']:5.1f} %] | "
                      f"{c['expected_rank']:.2f} | {c['robustness']}")
    with open("out/all_rankings.json", "w", encoding="utf-8") as fo:
        json.dump(out, fo, ensure_ascii=False, indent=2)
    print("\nOK -> out/ranking_MOON.json/.csv, out/ranking_MARS.json/.csv, out/all_rankings.json")

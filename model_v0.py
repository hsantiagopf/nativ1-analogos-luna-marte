"""LINEA BASE v0 (NO es resultado; ver PLAN_IMPLEMENTACION.md). Modelo de similitud "One Core, Two Outputs" (MOON / MARS).
Compara CARACTER FISICO, no numeros crudos: cada variable se mapea a 0-1 con el MISMO
significado fisico en los 3 cuerpos (perfil fisico normalizado), para que la comparacion
Tierra <-> Luna/Marte sea honesta pese a unidades distintas (tiu vs ATI, FeO% vs indices).

Por cada sitio planetario de referencia: ranking Top-K de sitios terrestres, score global 0-100
y por dimension, mas explicaciones obligatorias (strongest_matches, where_it_breaks_down,
mission_utility). Para MARTE se aplica el filtro de aridez (excluye sitios NOT_ARID).

Uso:  python model.py            (lee out/features_{MOON,MARS}.parquet)
Salida: out/ranking_v0_{PAIR}.json  y  out/ranking_v0_{PAIR}.csv
"""
import json
import numpy as np, pandas as pd

K = 5  # Top-K

def clip01(x):
    return float(np.clip(x, 0.0, 1.0))

# ---- Mapeos a caracter fisico 0-1 (documentados; mismo eje para los 3 cuerpos) ----
def ti_coarseness(val, body):
    """Inercia termica -> 0 (fino/polvoriento, baja inercia) .. 1 (rocoso, alta inercia).
    Rangos fisicos por cuerpo (literatura): Marte 50-400 tiu; Luna 30-150 tiu; Tierra ATI 0.02-0.17 (1/K)."""
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    if body == "MARS":  return clip01((val - 50) / (400 - 50))
    if body == "MOON":  return clip01((val - 30) / (150 - 30))
    return clip01((val - 0.02) / (0.17 - 0.02))  # EARTH (ATI)

def earth_minerals_to_axes(row):
    """Indices Sentinel-2 (cocientes) -> ejes minerales 0-1 comparables con Luna/Marte.
    ferric via log (el cociente rojo/azul se dispara en dunas rojas). S2 no separa bien
    arcilla de sulfato, asi que para la Tierra solo se puntuan ferric/sulfate/mafic."""
    io = row.get("iron_oxide_idx"); cs = row.get("clay_sulfate_idx"); fe = row.get("ferrous_idx")
    ax = {}
    if io and io > 0: ax["min_ferric_oxide"] = clip01((np.log2(io) - 0.5) / (4.5 - 0.5))
    if cs: ax["min_sulfate"] = clip01((cs - 1.0) / 1.3)
    if fe: ax["min_mafic"] = clip01((fe - 0.8) / 1.0)
    return ax

# ---- Dimensiones: features y como se vuelven 0-1 comparables ----
def site_scores(row, body):
    """Devuelve, por dimension, un vector de puntajes 0-1 (caracter fisico) del sitio."""
    s = {}
    # Topografia (grados y fracciones: ya comparables; se normalizan por rango fisico)
    s["topografia"] = {
        "llano": clip01(1 - row["slope_mean_deg"] / 20.0),          # 1 = muy llano
        "apto_aterrizaje": clip01(row.get("frac_slope_lt_8", np.nan)),
        "apto_rover": clip01(row.get("frac_slope_lt_15", np.nan)),
    }
    # Rugosidad multiescala (Hurst y RMS slope: mismo metodo/res dentro del par)
    rms_cols = sorted([c for c in row.index if c.startswith("rms_slope_")],
                      key=lambda c: int(c.split("_")[2].replace("m", "")))
    rough = {"hurst": clip01(row.get("hurst_exponent", np.nan))}
    if rms_cols:
        rough["aspereza_fina"] = clip01(row[rms_cols[0]] / 30.0)     # RMS slope escala mas fina
    s["rugosidad"] = rough
    # Inercia termica (caracter grano fino<->rocoso)
    tc = ti_coarseness(row.get("thermal_inertia"), body)
    s["inercia_termica"] = {"grano_rocoso": tc} if tc is not None else {}
    # Mineralogia (ejes 0-1; Tierra desde indices, planetarios desde min_*)
    if body == "EARTH":
        s["mineralogia"] = earth_minerals_to_axes(row)
    else:
        s["mineralogia"] = {k: float(row[k]) for k in
                            ["min_ferric_oxide", "min_sulfate", "min_mafic"]
                            if k in row.index and pd.notna(row[k])}
    return s

def dim_similarity(a, b):
    """Similitud 0-1 entre dos vectores de dimension = 1 - error absoluto medio en claves comunes."""
    keys = set(a) & set(b)
    if not keys:
        return None
    err = np.mean([abs(a[k] - b[k]) for k in keys])
    return clip01(1 - err)

# ---- Explicaciones ----
BREAKDOWN = {
    "MOON": "La Luna no tiene atmosfera (vacio), su gravedad es 1/6 g y su regolito es polvo fino "
            "sin oxidacion ni agua: la mineralogia hidratada/oxidada y el ambiente termico extremo no "
            "se reproducen en la Tierra.",
    "MARS": "Marte tiene atmosfera muy tenue (~0.6% de la terrestre), gravedad 0.38 g y radiacion alta: "
            "la presion, el transporte eolico y el ambiente termico difieren de la Tierra.",
}
UTIL = {
    "topografia": "ensayo de aterrizaje y seleccion de zona segura",
    "rugosidad": "pruebas de movilidad y traccion de rovers",
    "inercia_termica": "manejo de regolito/polvo y diseno termico de habitats",
    "mineralogia": "calibracion de instrumentos y prospeccion de recursos (ISRU)",
}

def explain(dims, body):
    ok = {d: v for d, v in dims.items() if v is not None}
    best = sorted(ok, key=ok.get, reverse=True)
    strongest = [d for d in best if ok[d] >= 0.75][:2] or best[:1]
    weakest = [d for d in sorted(ok, key=ok.get) if ok[d] < 0.6][:2]
    util = "; ".join(UTIL[d] for d in strongest if d in UTIL)
    return {
        "strongest_matches": [f"{d} ({ok[d]*100:.0f}%)" for d in strongest],
        "where_it_breaks_down": ([f"{d} ({ok[d]*100:.0f}%)" for d in weakest] or ["ninguna dimension < 60%"])
                                + [BREAKDOWN[body]],
        "mission_utility": util or "caracterizacion general de sitio analogo",
    }

def run(pair):
    df = pd.read_parquet(f"out/features_{pair}.parquet")
    refs = df[df.body == pair]
    earth = df[df.body == "EARTH"].copy()
    # Filtro de aridez para Marte (zonas aridas/hiperaridas/semiaridas de suelo desnudo)
    excluded = []
    if pair == "MARS" and "aridity_class" in earth.columns:
        mask = earth["aridity_class"] == "NOT_ARID"
        excluded = earth[mask]["site_id"].tolist()
        earth = earth[~mask]
    earth_sc = {r.site_id: site_scores(r, "EARTH") for _, r in earth.iterrows()}
    dims_order = ["topografia", "rugosidad", "inercia_termica", "mineralogia"]
    out = {"target_body": pair, "excluded_by_aridity": excluded, "references": []}
    for _, rref in refs.iterrows():
        rsc = site_scores(rref, pair)
        ranking = []
        for _, re_ in earth.iterrows():
            esc = earth_sc[re_.site_id]
            dims = {d: dim_similarity(rsc.get(d, {}), esc.get(d, {})) for d in dims_order}
            scored = {d: v for d, v in dims.items() if v is not None}
            glob = float(np.mean(list(scored.values()))) * 100 if scored else 0.0
            ranking.append({
                "site_id": re_.site_id, "name": re_["name"],
                "score_global": round(glob, 1),
                "scores": {d: (round(v * 100, 1) if v is not None else None) for d, v in dims.items()},
                **explain(dims, pair),
            })
        ranking.sort(key=lambda x: x["score_global"], reverse=True)
        out["references"].append({
            "ref_site_id": rref.site_id, "ref_name": rref["name"],
            "ref_thermal_inertia": None if pd.isna(rref.get("thermal_inertia")) else float(rref["thermal_inertia"]),
            "top_k": ranking[:K],
        })
    json.dump(out, open(f"out/ranking_v0_{pair}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    # CSV plano: una fila por (ref, candidato)
    rows = []
    for ref in out["references"]:
        for rk, c in enumerate(ref["top_k"], 1):
            rows.append({"target": pair, "ref": ref["ref_site_id"], "rank": rk,
                         "candidate": c["site_id"], "score_global": c["score_global"],
                         **{f"score_{d}": c["scores"][d] for d in dims_order}})
    pd.DataFrame(rows).to_csv(f"out/ranking_v0_{pair}.csv", index=False)
    return out

if __name__ == "__main__":
    for pair in ["MOON", "MARS"]:
        o = run(pair)
        print(f"\n================= {pair} =================")
        if o["excluded_by_aridity"]:
            print("Excluidos por aridez:", o["excluded_by_aridity"])
        for ref in o["references"]:
            top = ref["top_k"]
            print(f"\n{ref['ref_site_id']} ({ref['ref_name']}):")
            for rk, c in enumerate(top[:3], 1):
                print(f"  {rk}. {c['site_id']:16s} {c['score_global']:5.1f}/100  "
                      f"fuerte={','.join(c['strongest_matches'])}")
    print("\nOK -> out/ranking_v0_MOON.json/.csv y out/ranking_v0_MARS.json/.csv")

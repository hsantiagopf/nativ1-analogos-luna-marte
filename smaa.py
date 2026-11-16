"""Fase 4 del plan: ranking con SMAA-2 (analisis estocastico de aceptabilidad multicriterio;
Lahdelma y Salminen 2001, Operations Research 49:444-454).

Idea: no sabemos cuanto pesa cada criterio (cada escala de pendiente), asi que no elegimos
pesos. Se simulan miles de combinaciones de pesos al azar (uniformes sobre el simplex) y,
opcionalmente, el error de medicion de los modelos de elevacion. Para cada candidato se
cuenta en que posicion queda: el resultado es una PROBABILIDAD (p. ej. de quedar en el Top-3),
no un puntaje inventado.

Criterios: distancia Wasserstein-1 (grados) entre distribuciones de pendiente a 4 escalas
(distributions.py). Todos en grados -> la suma ponderada es una distancia media en grados.

Error de medicion (requisitos.csv E01-E03): ruido gaussiano por pixel con sigma = LE90/(1.645*raiz(2))
para Copernicus (0.86 m si pendiente <= 20 %, 1.72 m si > 20 %), y 1 m para LOLA y MOLA.
Simplificaciones declaradas: (1) ruido independiente entre pixeles: sobreestima el ruido de
pendiente respecto a un error espacialmente correlado; (2) no se reduce el error de Copernicus por
promediar 30 m -> 118/463 m (conservador); (3) para LOLA/MOLA no se incluye el error de
interpolacion entre pasadas (subestima); (4) en terreno muy llano el ruido sesga la pendiente hacia
arriba: la corrida con ruido mide ROBUSTEZ del ranking, no es una estimacion insesgada.
"""
import os
import numpy as np
from distributions import load_dem, slope_at_lag, RES, LAGS, QUANTILES

SIGMA_COP_LOW = 2.0 / (1.645 * np.sqrt(2))    # m, pendiente <= 20 %
SIGMA_COP_HIGH = 4.0 / (1.645 * np.sqrt(2))   # m, pendiente > 20 %
SIGMA_LASER = {"MOON": 1.0, "MARS": 1.0}      # m
SLOPE_20PCT_DEG = float(np.degrees(np.arctan(0.20)))


def sigma_map(z, res, body):
    if body != "EARTH":
        return np.full(z.shape, SIGMA_LASER[body])
    gy, gx = np.gradient(z, res)
    s = np.degrees(np.arctan(np.hypot(gx, gy)))
    return np.where(s > SLOPE_20PCT_DEG, SIGMA_COP_HIGH, SIGMA_COP_LOW)


def clean_quantiles(pair, site_id, body):
    z, _, _ = load_dem(pair, site_id, body)
    return np.stack([np.quantile(slope_at_lag(z, RES[pair], L), QUANTILES) for L in LAGS])


def noisy_quantiles(pair, site_id, body, n_real, rng):
    """(n_real, n_lags, n_quantiles): cuantiles de pendiente de n_real replicas con ruido."""
    z, _, _ = load_dem(pair, site_id, body)
    sig = sigma_map(z, RES[pair], body)
    out = np.empty((n_real, len(LAGS), QUANTILES.size))
    for r in range(n_real):
        zn = z + rng.standard_normal(z.shape) * sig
        for k, L in enumerate(LAGS):
            out[r, k] = np.quantile(slope_at_lag(zn, RES[pair], L), QUANTILES)
    return out


CACHE_DIR = "C:/Users/hsant/NASA_SpaceApps_data/cache"   # fuera de OneDrive (~60-75 MB por par)


def noise_cache(pair, site_bodies, n_real=200, seed=20261115):
    """Replicas con ruido por sitio, guardadas en CACHE_DIR/ruido_{pair}.npz para no recalcular.
    Si cambian los sitios o el numero de replicas se recalcula sola."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    path = f"{CACHE_DIR}/ruido_{pair}.npz"
    if os.path.exists(path):
        d = np.load(path, allow_pickle=False)
        if list(d["sites"]) == list(site_bodies) and d["q"].shape[1] == n_real:
            return {s: d["q"][i] for i, s in enumerate(d["sites"])}
    rng = np.random.default_rng(seed)
    q = np.stack([noisy_quantiles(pair, s, b, n_real, rng) for s, b in site_bodies.items()])
    np.savez_compressed(path, sites=np.array(list(site_bodies)), q=q)
    return {s: q[i] for i, s in enumerate(site_bodies)}


def distance_tensor(ref_q, alt_qs):
    """ref_q: (R, K, Q); alt_qs: lista de (R, K, Q). Devuelve D (R, n_alt, K) en grados."""
    return np.stack([np.mean(np.abs(ref_q - a), axis=-1) for a in alt_qs], axis=1)


def smaa2(D, n_iter=10000, seed=20261115, top_k=3, chunk=5000):
    """SMAA-2 con pesos uniformes en el simplex y, si D tiene varias replicas, error de medicion.
    D: (R, n_alt, n_crit), menor = mas parecido.
    Devuelve aceptabilidad por posicion (n_alt x n_alt), posicion esperada (1 = mas parecido),
    probabilidad de Top-K y vector de pesos central (pesos medios cuando el candidato queda 1.o)."""
    rng = np.random.default_rng(seed)
    R, n_alt, n_crit = D.shape
    rank_counts = np.zeros((n_alt, n_alt))
    central = np.zeros((n_alt, n_crit))
    wdist = []
    done = 0
    while done < n_iter:
        m = min(chunk, n_iter - done)
        w = rng.dirichlet(np.ones(n_crit), size=m)
        r = rng.integers(0, R, size=m)
        score = np.einsum("ik,iak->ia", w, D[r])                 # distancia ponderada (grados)
        ranks = np.argsort(np.argsort(score, axis=1), axis=1)    # 0 = mas parecido
        for a in range(n_alt):
            rank_counts[a] += np.bincount(ranks[:, a], minlength=n_alt)
            central[a] += w[ranks[:, a] == 0].sum(axis=0)
        wdist.append(score)
        done += m
    acc = rank_counts / n_iter
    firsts = rank_counts[:, 0][:, None]
    central = np.divide(central, firsts, out=np.full_like(central, np.nan), where=firsts > 0)
    wdist = np.concatenate(wdist)
    return {
        "rank_acceptability": acc,
        "expected_rank": acc @ (np.arange(n_alt) + 1),
        "p_top_k": acc[:, :top_k].sum(axis=1),
        "central_weights": central,
        "weighted_distance_median": np.median(wdist, axis=0),
        "weighted_distance_p05": np.percentile(wdist, 5, axis=0),
        "weighted_distance_p95": np.percentile(wdist, 95, axis=0),
    }

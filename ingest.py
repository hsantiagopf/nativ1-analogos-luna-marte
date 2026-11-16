"""
Ingesta multimodal NASA Space Apps 26 - "One Core, Two Outputs".
Extrae, por sitio, una ventana de DEM SIN descargar el raster global (lecturas
por rango HTTP con GDAL /vsicurl/), la remuestrea a una resolucion comun por
par (MOON / MARS), calcula features topologicas y genera un hillshade PNG para
embeddings. Para sitios EARTH agrega suelo (SoilGrids) y geologia (Macrostrat).

Uso:
    pip install -r requirements.txt
    python ingest.py --sites sites.csv --out out/ --pair MOON
    python ingest.py --sites sites.csv --out out/ --pair MARS --aridity global_ai_yearly.tif

Salida: out/features_<PAIR>.parquet (+ .csv) y out/hillshade/<site_id>.png
"""
import argparse, math, os, time, json, glob
import numpy as np, pandas as pd, requests
import rasterio
from rasterio.windows import from_bounds
from rasterio.enums import Resampling
from rasterio.merge import merge as rio_merge
from PIL import Image

# --- Fuentes verificadas (USGS Astrogeology, dominio publico, sin login) ---
DEM = {
    "MOON": dict(url="/vsicurl/https://planetarymaps.usgs.gov/mosaic/Lunar_LRO_LOLA_Global_LDEM_118m_Mar2014.tif",
                 radius=1737400.0, scale=0.5),   # pixel * 0.5 = metros
    "MARS": dict(url="/vsicurl/https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif",
                 radius=3396190.0, scale=1.0),
}
# Copernicus GLO-30 en AWS Open Data (COG, sin login). NO verificado en vivo aun.
COP_URL = ("/vsicurl/https://copernicus-dem-30m.s3.amazonaws.com/"
           "Copernicus_DSM_COG_10_{ns}{lat:02d}_00_{ew}{lon:03d}_00_DEM/"
           "Copernicus_DSM_COG_10_{ns}{lat:02d}_00_{ew}{lon:03d}_00_DEM.tif")

# Resolucion comun de comparacion (m/px) y tamano de ventana por par.
# Regla: la Tierra se degrada a la resolucion del cuerpo planetario, nunca al reves.
PAIR_CFG = {"MOON": dict(res=118.0, size_km=30.0), "MARS": dict(res=463.0, size_km=90.0)}

GDAL_ENV = dict(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif",
                GDAL_HTTP_MAX_RETRY="4", GDAL_HTTP_RETRY_DELAY="2", VSI_CACHE="TRUE")


# ------------------------------- DEM ---------------------------------------
def read_planetary(body, lat, lon, size_km, res):
    """Ventana en Simple Cylindrical planetocentrica: x = R*lon, y = R*lat (rad)."""
    cfg = DEM[body]; R = cfg["radius"]
    x, y = R * math.radians(lon), R * math.radians(lat)
    half = size_km * 500.0
    # compensar la contraccion de longitud con la latitud para que la ventana sea cuadrada en suelo
    half_x = half / max(math.cos(math.radians(lat)), 0.2)
    n = int(round(size_km * 1000 / res))
    with rasterio.open(cfg["url"]) as src:
        win = from_bounds(x - half_x, y - half, x + half_x, y + half, src.transform)
        z = src.read(1, window=win, out_shape=(n, n), resampling=Resampling.bilinear,
                     boundless=True, fill_value=src.nodata or -32768).astype("float32")
        nodata = src.nodata
    if nodata is not None:
        z[z == nodata] = np.nan
    return z * cfg["scale"]


def _cop_url(ilat, ilon):
    """URL del tile Copernicus GLO-30 cuyo vertice inferior-izquierdo es (ilat, ilon) enteros."""
    ns, ew = ("N" if ilat >= 0 else "S"), ("E" if ilon >= 0 else "W")
    return COP_URL.format(ns=ns, lat=abs(ilat), ew=ew, lon=abs(ilon))


def read_earth(lat, lon, size_km, res):
    """Copernicus GLO-30 (tiles de 1x1 grado). Mosaica TODOS los tiles vecinos que toca
    la ventana: son la misma tierra contigua del mismo dataset (mismo satelite, 30 m),
    no una fuente distinta. Tiles inexistentes (oceano) se dejan como hueco. La Tierra se
    remuestrea (promedio) a la resolucion del cuerpo planetario: degradar, nunca al reves."""
    half_lat = (size_km / 2) / 111.32
    half_lon = half_lat / max(math.cos(math.radians(lat)), 0.2)
    n = int(round(size_km * 1000 / res))
    min_lon, max_lon = lon - half_lon, lon + half_lon
    min_lat, max_lat = lat - half_lat, lat + half_lat
    # enumerar los tiles de 1 grado que cubren la ventana y abrir los que existen
    srcs, missing = [], []
    for ilat in range(math.floor(min_lat), math.floor(max_lat) + 1):
        for ilon in range(math.floor(min_lon), math.floor(max_lon) + 1):
            url = _cop_url(ilat, ilon)
            try:
                srcs.append(rasterio.open(url))  # EPSG:4326
            except Exception:
                missing.append((ilat, ilon))  # tile sin dato (tipicamente oceano)
    if not srcs:
        raise RuntimeError(f"ningun tile Copernicus disponible (faltan {missing})")
    try:
        dlon, dlat = (max_lon - min_lon) / n, (max_lat - min_lat) / n
        mosaic, _ = rio_merge(srcs, bounds=(min_lon, min_lat, max_lon, max_lat),
                              res=(dlon, dlat), resampling=Resampling.average,
                              nodata=-32767.0)
    finally:
        for s in srcs:
            s.close()
    z = mosaic[0].astype("float32")
    z[z <= -32767] = np.nan
    return z


# --------------------------- Features topologicas --------------------------
def topo_features(z, res):
    zf = np.where(np.isnan(z), np.nanmean(z), z)
    gy, gx = np.gradient(zf, res)
    slope = np.degrees(np.arctan(np.hypot(gx, gy)))
    # rugosidad: desviacion estandar del residuo tras quitar plano de tendencia
    yy, xx = np.mgrid[:zf.shape[0], :zf.shape[1]]
    A = np.c_[xx.ravel(), yy.ravel(), np.ones(zf.size)]
    coef, *_ = np.linalg.lstsq(A, zf.ravel(), rcond=None)
    resid = zf - (A @ coef).reshape(zf.shape)
    # TRI (Riley): diferencia media con los 8 vecinos
    p = np.pad(zf, 1, mode="edge")
    tri = np.mean([np.abs(zf - p[1 + dy:1 + dy + zf.shape[0], 1 + dx:1 + dx + zf.shape[1]])
                   for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy, dx) != (0, 0)], axis=0)
    lap = np.gradient(gx, res, axis=1) + np.gradient(gy, res, axis=0)
    return {
        "elev_range_m": float(np.nanmax(z) - np.nanmin(z)),
        "slope_mean_deg": float(slope.mean()), "slope_p90_deg": float(np.percentile(slope, 90)),
        "frac_slope_lt_8": float((slope < 8).mean()),    # aterrizaje (umbral tipico de lander)
        "frac_slope_lt_15": float((slope < 15).mean()),  # traversabilidad rover
        "roughness_detrended_m": float(resid.std()),
        "tri_mean_m": float(tri.mean()),
        "curvature_std": float(lap.std()),
        "nan_frac": float(np.isnan(z).mean()),
    }


def multiscale_roughness(z, res, baselines_px=(1, 3, 9, 27)):
    """Firma de rugosidad a varias escalas (estilo Kreslavsky & Head 2000 con MOLA).
    Para cada baseline L (en pixeles, a la resolucion comun del par): desviacion RMS
    de las diferencias de altura a ese lag (nu_L, en metros) y la RMS slope a esa escala.
    El exponente de Hurst (pendiente log-log de nu vs L) resume COMO cambia la aspereza
    con la escala: una huella escalar del terreno, comparable 1:1 entre Tierra/Luna/Marte
    porque es el mismo calculo sobre el mismo tipo de dato (elevacion) a la misma resolucion.
    Variable fuerte para peligro de aterrizaje (escala grande) y transitabilidad (escala rover)."""
    zf = np.where(np.isnan(z), np.nanmean(z), z)
    out, Ls, nus = {}, [], []
    for L in baselines_px:
        if L >= min(zf.shape):
            continue
        d = np.concatenate([(zf[L:, :] - zf[:-L, :]).ravel(),
                            (zf[:, L:] - zf[:, :-L]).ravel()])
        nu = float(np.sqrt(np.mean(d ** 2)))           # desviacion RMS de altura al lag L (m)
        m = int(round(L * res))
        out[f"rough_rms_{m}m"] = nu
        out[f"rms_slope_{m}m_deg"] = float(np.degrees(np.arctan(nu / (L * res))))
        Ls.append(L * res); nus.append(max(nu, 1e-6))
    if len(Ls) >= 2:
        H = float(np.polyfit(np.log(Ls), np.log(nus), 1)[0])
        out["hurst_exponent"] = H                      # ~0 aspero a toda escala; ~1 suave/ondulado
    return out


def hillshade(z, res, az=315.0, alt=45.0):
    """Hillshade normalizado: entrada de embeddings comparable entre cuerpos (sin albedo/color)."""
    zf = np.where(np.isnan(z), np.nanmean(z), z)
    gy, gx = np.gradient(zf, res)
    slope = np.arctan(np.hypot(gx, gy)); aspect = np.arctan2(-gx, gy)
    a, b = math.radians(360 - az + 90), math.radians(alt)
    hs = np.sin(b) * np.cos(slope) + np.cos(b) * np.sin(slope) * np.cos(a - aspect)
    hs = (hs - hs.min()) / (np.ptp(hs) + 1e-9)
    return (hs * 255).astype("uint8")


# ------------------------------ Tierra: suelo, geologia, aridez ------------
SOIL_PROPS = ["clay", "sand", "silt", "bdod", "cfvo", "phh2o", "soc"]

def soilgrids(lat, lon, retries=3):
    url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    params = [("lon", lon), ("lat", lat), ("depth", "0-5cm"), ("value", "mean")] + \
             [("property", p) for p in SOIL_PROPS]
    for i in range(retries):
        try:
            r = requests.get(url, params=params, timeout=30); r.raise_for_status()
            out = {}
            for layer in r.json()["properties"]["layers"]:
                d = layer["unit_measure"]["d_factor"]
                v = layer["depths"][0]["values"]["mean"]
                out[f"soil_{layer['name']}"] = None if v is None else v / d
            return out
        except Exception as e:
            err = str(e); time.sleep(2 * (i + 1))
    return {"soil_error": err}  # el API estaba con error de servidor en la verificacion


def macrostrat(lat, lon):
    try:  # parametros lat/lng: confirmar en https://macrostrat.org/api
        r = requests.get("https://macrostrat.org/api/v2/geologic_units/map",
                         params={"lat": lat, "lng": lon}, timeout=30)
        d = r.json()["success"]["data"]
        if not d: return {}
        u = d[0]
        return {"geo_name": u.get("name"), "geo_lith": u.get("lith"),
                "geo_age_top_ma": u.get("t_age"), "geo_age_bot_ma": u.get("b_age")}
    except Exception as e:
        return {"geo_error": str(e)}


def sample_raster(path, lat, lon, scale=1.0):
    if not path: return None
    with rasterio.open(path) as src:
        v = next(src.sample([(lon, lat)]))[0]
        nd = src.nodata
    # En Global-AI (uint16) el 0 es mascara de mar/sin dato, NO aridez cero.
    # Los desiertos mas secos (Atacama) tienen valores > 0. Tratar 0/nodata como faltante.
    if v == 0 or (nd is not None and v == nd):
        return None
    return float(v) * scale


def sample_mars_ti(ti_dir, lat, lon):
    """Inercia termica THEMIS 1km (tiles MC, Huang 2026). Proyeccion equirectangular
    de Marte (R=3396190), banda 1 = TI * 0.1 J m^-2 K^-1 s^-1/2, nodata 65535.
    Es la MISMA magnitud fisica que medira la Tierra (inercia termica): grano/roca/polvo."""
    if not ti_dir:
        return None
    R = 3396190.0
    x, y = R * math.radians(lon), R * math.radians(lat)
    for f in glob.glob(os.path.join(ti_dir, "*.tif")):
        with rasterio.open(f) as t:
            b = t.bounds
            if b.left <= x <= b.right and b.bottom <= y <= b.top:
                r, c = t.index(x, y)
                dn = t.read(1, window=((r, r + 1), (c, c + 1)))[0, 0]
                return None if int(dn) == 65535 else float(dn) * 0.1
    return None


def aridity_class(ai):
    if ai is None: return None
    return ("hyper_arid" if ai < 0.03 else "arid" if ai < 0.2 else
            "semi_arid" if ai < 0.5 else "NOT_ARID")


# ------------------------------------ main --------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sites", default="sites.csv"); ap.add_argument("--out", default="out")
    ap.add_argument("--pair", choices=["MOON", "MARS"], required=True)
    ap.add_argument("--aridity", default=None, help="GeoTIFF Global-AI_PET_v3 (figshare) local")
    ap.add_argument("--mars_ti", default=None, help="Carpeta con tiles THEMIS TI 1km (Zenodo) para sitios MARS")
    ap.add_argument("--moon_ti", default="moon_ti_ref.csv", help="CSV site_id,thermal_inertia (Diviner/Hayne) para sitios MOON de referencia")
    ap.add_argument("--earth_ti", default="earth_ti.csv", help="CSV site_id,thermal_inertia (ATI MODIS dia/noche) para sitios EARTH")
    ap.add_argument("--earth_minerals", default="earth_minerals.csv", help="CSV indices minerales Sentinel-2 (EARTH)")
    ap.add_argument("--mars_minerals", default="mars_minerals.csv", help="CSV perfil mineral literatura (MARS)")
    ap.add_argument("--moon_minerals", default="moon_minerals.csv", help="CSV perfil mineral FeO (MOON)")
    ap.add_argument("--skip-soilgrids", action="store_true", help="Omitir consulta a SoilGrids API (ahorro de tiempo)")
    a = ap.parse_args()

    cfg = PAIR_CFG[a.pair]
    sites = pd.read_csv(a.sites)
    sites = sites[sites.body.isin([a.pair, "EARTH"])]
    moon_ti_ref = {}
    if a.pair == "MOON" and a.moon_ti and os.path.exists(a.moon_ti):
        mt = pd.read_csv(a.moon_ti, comment="#")
        moon_ti_ref = dict(zip(mt.site_id, mt.thermal_inertia.astype(float)))
    earth_ti_ref = {}
    if a.earth_ti and os.path.exists(a.earth_ti):
        et = pd.read_csv(a.earth_ti, comment="#")
        earth_ti_ref = dict(zip(et.site_id, et.thermal_inertia.astype(float)))

    def load_site_csv(path):
        """CSV con columna site_id -> dict site_id: {resto de columnas}."""
        if not (path and os.path.exists(path)):
            return {}
        d = pd.read_csv(path, comment="#")
        cols = [c for c in d.columns if c != "site_id"]
        return {r.site_id: {c: getattr(r, c) for c in cols} for r in d.itertuples()}

    minerals = {"EARTH": load_site_csv(a.earth_minerals),
                "MARS": load_site_csv(a.mars_minerals),
                "MOON": load_site_csv(a.moon_minerals)}
    os.makedirs(f"{a.out}/hillshade", exist_ok=True)
    rows = []
    with rasterio.Env(**GDAL_ENV):
        for s in sites.itertuples():
            t0 = time.time(); row = {"target_body": a.pair, **s._asdict()}; row.pop("Index")
            try:
                z = (read_earth(s.lat, s.lon, cfg["size_km"], cfg["res"]) if s.body == "EARTH"
                     else read_planetary(s.body, s.lat, s.lon, cfg["size_km"], cfg["res"]))
                row.update(topo_features(z, cfg["res"]))
                row.update(multiscale_roughness(z, cfg["res"]))
                Image.fromarray(hillshade(z, cfg["res"])).save(f"{a.out}/hillshade/{a.pair}_{s.site_id}.png")
                np.save(f"{a.out}/hillshade/{a.pair}_{s.site_id}_dem.npy", z)
            except Exception as e:
                row["dem_error"] = str(e)
            # Inercia termica: misma magnitud fisica del regolito en los 3 cuerpos
            if s.body == "MARS":
                row["thermal_inertia"] = sample_mars_ti(a.mars_ti, s.lat, s.lon)
                row["ti_source"] = "THEMIS_1km" if a.mars_ti else None
            elif s.body == "MOON":
                row["thermal_inertia"] = moon_ti_ref.get(s.site_id)
                row["ti_source"] = "Diviner_Hayne_10ppd" if row["thermal_inertia"] is not None else None
            if s.body == "EARTH":
                if not a.skip_soilgrids:
                    row.update(soilgrids(s.lat, s.lon))
                row.update(macrostrat(s.lat, s.lon))
                ai = sample_raster(a.aridity, s.lat, s.lon, scale=1e-4)
                row["aridity_index"] = ai; row["aridity_class"] = aridity_class(ai)
                if a.pair == "MARS" and row["aridity_class"] == "NOT_ARID":
                    row["excluded_reason"] = "filtro aridez polimodal (AI >= 0.5)"
                row["thermal_inertia"] = earth_ti_ref.get(s.site_id)
                row["ti_source"] = "MODIS_ATI" if row["thermal_inertia"] is not None else None
            # Mineralogia / materiales de superficie (datos por cuerpo; el modelo normaliza)
            mdata = minerals.get(s.body, {}).get(s.site_id)
            if mdata:
                row.update(mdata)
            row["elapsed_s"] = round(time.time() - t0, 1)
            print(json.dumps({k: row.get(k) for k in ("site_id", "slope_mean_deg", "dem_error", "elapsed_s")}))
            rows.append(row)
    df = pd.DataFrame(rows)
    df.to_parquet(f"{a.out}/features_{a.pair}.parquet", index=False)
    df.to_csv(f"{a.out}/features_{a.pair}.csv", index=False)
    print(f"OK -> {a.out}/features_{a.pair}.parquet ({len(df)} sitios)")


if __name__ == "__main__":
    main()

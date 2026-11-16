"""Indices minerales de superficie (Tierra) desde Sentinel-2 L2A (STAC AWS, sin login).
Mismo tipo de dato que los productos espectrales planetarios: composicion por reflectancia.
Para cada sitio EARTH toma la escena mas despejada, enmascara nube/agua/vegetacion (SCL+NDVI)
sobre suelo desnudo y calcula la mediana de:
  - iron_oxide   = Red/Blue      (B04/B02)  -> superficies oxidadas/rojas (clave Marte)
  - clay_sulfate = SWIR1/SWIR2   (B11/B12)  -> filosilicatos y sulfatos
  - ferrous      = SWIR1/NIR     (B11/B08)  -> minerales ferrosos
Salida: earth_minerals.csv
"""
import csv, math
import numpy as np, requests, rasterio
from rasterio.warp import transform_bounds
from rasterio.windows import from_bounds
from rasterio.enums import Resampling

STAC = "https://earth-search.aws.element84.com/v1/search"
GDAL_ENV = dict(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",
                CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif",
                GDAL_HTTP_MAX_RETRY="3", GDAL_HTTP_RETRY_DELAY="2", VSI_CACHE="TRUE")
def load_earth_sites(path="sites.csv"):
    import pandas as pd
    d = pd.read_csv(path)
    d = d[d.body == "EARTH"]
    return {r.site_id: (float(r.lat), float(r.lon)) for r in d.itertuples()}

SITES = load_earth_sites()
OFF, SCALE = 1000.0, 10000.0   # baseline >=04.00: refl = (DN-OFF)/SCALE
BANDS = ["blue", "red", "nir", "swir16", "swir22", "scl"]
HALF_DEG = 0.025               # ventana ~5 km


def best_scene(lat, lon):
    body = {"collections": ["sentinel-2-l2a"],
            "bbox": [lon - 0.02, lat - 0.02, lon + 0.02, lat + 0.02],
            "datetime": "2022-01-01T00:00:00Z/2024-12-31T23:59:59Z",
            "query": {"eo:cloud_cover": {"lt": 8}}, "limit": 20}
    feats = requests.post(STAC, json=body, timeout=60).json().get("features", [])
    if not feats:
        return None
    feats.sort(key=lambda f: f["properties"].get("eo:cloud_cover", 100))
    return feats[0]


def read_band(href, crs, bounds_utm, n=240, resamp=Resampling.bilinear):
    with rasterio.open(href) as src:
        win = from_bounds(*bounds_utm, src.transform)
        a = src.read(1, window=win, out_shape=(n, n), resampling=resamp,
                     boundless=True, fill_value=0).astype("float32")
    return a


def extract(site, lat, lon):
    f = best_scene(lat, lon)
    if f is None:
        return {"site_id": site, "mineral_error": "sin escena S2 <8% nube"}
    a = f["assets"]
    with rasterio.open(a["red"]["href"]) as src:
        crs = src.crs
    b = transform_bounds("EPSG:4326", crs, lon - HALF_DEG, lat - HALF_DEG,
                         lon + HALF_DEG, lat + HALF_DEG)
    bl, rd, ni, s1, s2 = (read_band(a[k]["href"], crs, b) for k in ["blue", "red", "nir", "swir16", "swir22"])
    scl = read_band(a["scl"]["href"], crs, b, resamp=Resampling.nearest)
    # reflectancia
    refl = lambda x: np.clip((x - OFF) / SCALE, 0, 1.2)
    bl, rd, ni, s1, s2 = map(refl, (bl, rd, ni, s1, s2))
    ndvi = (ni - rd) / (ni + rd + 1e-6)
    # mascara: SCL 4=veg,5=suelo,6=agua,7=sin clasif,8-10=nube,11=nieve. Suelo desnudo:
    bare = np.isin(scl.astype(int), [5, 7]) & (ndvi < 0.25) & (rd > 0.02)
    if bare.sum() < 50:
        bare = (ndvi < 0.3) & (rd > 0.02) & ~np.isin(scl.astype(int), [6, 8, 9, 10, 11])
    if bare.sum() < 20:
        return {"site_id": site, "mineral_error": f"muy pocos pixeles desnudos ({int(bare.sum())})"}
    def med(num, den):
        # exigir denominador con senal real (>0.01 reflectancia) para que el cociente no explote
        m = bare & (den > 0.01) & (num > 0)
        if m.sum() < 20:
            return float("nan")
        r = num[m] / den[m]
        r = r[np.isfinite(r)]
        return float(np.median(r))
    return {"site_id": site,
            "iron_oxide_idx": med(rd, bl), "clay_sulfate_idx": med(s1, s2),
            "ferrous_idx": med(s1, ni), "ndvi_median": float(np.median(ndvi[bare])),
            "mineral_n_px": int(bare.sum()), "s2_scene": f["id"],
            "s2_cloud_pct": round(f["properties"].get("eo:cloud_cover", -1), 1)}


def main():
    rows = []
    with rasterio.Env(**GDAL_ENV):
        for site, (lat, lon) in SITES.items():
            try:
                r = extract(site, lat, lon)
            except Exception as e:
                r = {"site_id": site, "mineral_error": f"{type(e).__name__}: {str(e)[:120]}"}
            rows.append(r)
            print(r.get("site_id"), "iron=%.3f" % r["iron_oxide_idx"] if "iron_oxide_idx" in r else r.get("mineral_error"),
                  r.get("s2_scene", ""))
    keys = ["site_id", "iron_oxide_idx", "clay_sulfate_idx", "ferrous_idx",
            "ndvi_median", "mineral_n_px", "s2_scene", "s2_cloud_pct", "mineral_error"]
    with open("earth_minerals.csv", "w", newline="") as fo:
        fo.write("# Indices minerales de superficie Sentinel-2 L2A (STAC AWS). "
                 "iron_oxide=B04/B02, clay_sulfate=B11/B12, ferrous=B11/B08; mediana sobre suelo desnudo.\n")
        w = csv.DictWriter(fo, fieldnames=keys); w.writeheader()
        for r in rows: w.writerow({k: r.get(k) for k in keys})
    print("guardado earth_minerals.csv")


if __name__ == "__main__":
    main()

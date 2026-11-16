"""Texturas de globo 3D para el frontend, hechas con NUESTRAS fuentes de elevacion.

No usa imagenes de internet: lee los mosaicos globales de elevacion (LOLA para la Luna,
MOLA para Marte) por franjas de filas y construye:
  - {cuerpo}_hillshade_{W}.png : relieve sombreado en gris (textura principal del globo)
  - {cuerpo}_elev_{W}.png      : elevacion normalizada 0-255 (para tintar o desplazar)
  - {cuerpo}_elev_meta.json    : minimo y maximo reales en metros, para rotular leyendas

Los mosaicos no tienen vistas reducidas (overviews) y estan guardados por filas completas,
asi que se piden solo las filas que hacen falta, en paralelo. Equirectangular simple
(la misma proyeccion del archivo de origen), que es lo que espera una esfera de three.js.

Uso: python make_globe_textures.py [--width 2048]
"""
import argparse, json, threading, time
import numpy as np
import rasterio
from rasterio.windows import Window
from concurrent.futures import ThreadPoolExecutor

SRC = {
    "moon": dict(
        url="https://planetarymaps.usgs.gov/mosaic/Lunar_LRO_LOLA_Global_LDEM_118m_Mar2014.tif",
        scale=0.5,          # LOLA: el pixel esta en unidades de 0.5 m (CLAUDE.md)
        radius_m=1737400.0,
    ),
    "mars": dict(
        url="https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif",
        scale=1.0,
        radius_m=3389500.0,
    ),
}
OUTDIR = "frontend/public/textures"
_local = threading.local()


def ds_for(url):
    """Un dataset abierto por hilo: GDAL no permite compartirlo entre hilos."""
    if getattr(_local, "url", None) != url:
        _local.ds = rasterio.open("/vsicurl/" + url)
        _local.url = url
    return _local.ds


def read_row(url, r, W, out_w):
    a = ds_for(url).read(1, window=Window(0, int(r), W, 1))[0].astype("float32")
    idx = (np.arange(out_w) * (W / out_w)).astype(int)        # muestreo por columnas
    step = max(1, W // out_w)
    # promedio de 'step' columnas alrededor de cada muestra: evita el aliasing de muestrear a secas
    acc = np.zeros(out_w, dtype="float64")
    for k in range(step):
        acc += a[np.minimum(idx + k, W - 1)]
    return acc / step


def grab(body, out_w):
    cfg = SRC[body]
    out_h = out_w // 2
    with rasterio.open("/vsicurl/" + cfg["url"]) as ds:
        H, W = ds.height, ds.width
    rows = (np.arange(out_h) * (H / out_h)).astype(int)
    grid = np.empty((out_h, out_w), dtype="float64")
    done = [0]
    t0 = time.time()

    def job(i):
        grid[i] = read_row(cfg["url"], rows[i], W, out_w)
        done[0] += 1
        if done[0] % 64 == 0:
            el = time.time() - t0
            print(f"  {body}: {done[0]}/{out_h} filas  {el:.0f}s  (faltan ~{el/done[0]*(out_h-done[0]):.0f}s)", flush=True)

    with ThreadPoolExecutor(max_workers=24) as ex:
        list(ex.map(job, range(out_h)))
    return grid * cfg["scale"], cfg["radius_m"]


def hillshade(z, radius_m, out_w, az=315.0, alt=45.0, zf=3.0):
    """Relieve sombreado sobre rejilla equirectangular.
    El espaciado en x se encoge con el coseno de la latitud; si no se corrige, los polos
    salen con pendientes absurdas."""
    out_h = z.shape[0]
    dy = np.pi * radius_m / out_h                       # metros por fila
    lat = np.deg2rad(90.0 - (np.arange(out_h) + 0.5) * 180.0 / out_h)
    dx = (2 * np.pi * radius_m / out_w) * np.cos(lat)
    dx = np.maximum(dx, dy * 0.05)[:, None]             # tope cerca de los polos
    zx = np.gradient(z, axis=1) / dx * zf
    zy = np.gradient(z, axis=0) / dy * zf
    slope = np.arctan(np.hypot(zx, zy))
    aspect = np.arctan2(-zx, zy)
    a, A = np.deg2rad(alt), np.deg2rad(az)
    sh = np.sin(a) * np.cos(slope) + np.cos(a) * np.sin(slope) * np.cos(A - aspect)
    return np.clip(sh, 0, 1)


def save_png(path, arr8):
    from PIL import Image
    Image.fromarray(arr8, mode="L").save(path, optimize=True)
    print("  ->", path, arr8.shape, flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--width", type=int, default=2048)
    ap.add_argument("--bodies", default="moon,mars")
    args = ap.parse_args()
    import os
    os.makedirs(OUTDIR, exist_ok=True)
    for body in args.bodies.split(","):
        t = time.time()
        z, radius = grab(body, args.width)
        sh = hillshade(z, radius, args.width)
        save_png(f"{OUTDIR}/{body}_hillshade_{args.width}.png", (sh * 255).astype("uint8"))
        lo, hi = float(np.nanmin(z)), float(np.nanmax(z))
        save_png(f"{OUTDIR}/{body}_elev_{args.width}.png",
                 ((z - lo) / (hi - lo) * 255).astype("uint8"))
        with open(f"{OUTDIR}/{body}_elev_meta.json", "w", encoding="utf-8") as f:
            json.dump({"body": body, "width": args.width, "height": args.width // 2,
                       "projection": "equirectangular (simple cylindrical)",
                       "elev_min_m": round(lo, 1), "elev_max_m": round(hi, 1),
                       "radius_m": radius, "source": SRC[body]["url"]}, f, indent=1)
        print(f"{body} listo en {time.time()-t:.0f}s  (elevacion {lo:.0f} a {hi:.0f} m)", flush=True)


if __name__ == "__main__":
    main()

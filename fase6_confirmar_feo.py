"""Fase 6, paso 1: confirmar la clase (mar / tierras altas) de los sitios lunares de prueba con FeO de Kaguya,
un dato independiente del relieve. Se corre ANTES de calcular distancias y de congelar validacion_clases.csv.

Criterio de confirmacion (rangos de literatura, aproximados): mares basalticos ~14-22 % FeO; tierras altas
anortositicas ~3-8 % FeO. Un candidato que no cae claramente en su rango se reemplaza por otro punto.
Lento: lee por red el mapa de Kaguya (512 pixeles/grado); puede tardar 5-15 min.

Uso:   python fase6_confirmar_feo.py
"""
import numpy as np
import rasterio
from rasterio.windows import from_bounds

URL = ("/vsicurl/https://planetarymaps.usgs.gov/mosaic/Lunar_MI_mineral_maps/"
       "Lunar_Kaguya_MIMap_MineralDeconv_FeOWeightPercent_50N50S.tif")
ENV = dict(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif",
           VSI_CACHE="TRUE", GDAL_HTTP_MAX_RETRY="4")
# Candidatos (lat, lon este). Mares por nombre IAU; tierras altas en zonas de terra.
CANDIDATOS = {
    "MARE_SERENITATIS": (28.0, 17.5), "MARE_IMBRIUM": (33.0, -16.0),
    "MARE_CRISIUM": (17.0, 59.1), "MARE_FECUNDITATIS": (-8.0, 51.0),
    "TERRA_FARSIDE_A": (10.0, 170.0), "TERRA_FARSIDE_B": (-5.0, -150.0),
    "TERRA_NEARSIDE_SUR": (-30.0, 5.0), "TERRA_FARSIDE_C": (20.0, -165.0),
}

if __name__ == "__main__":
    with rasterio.Env(**ENV), rasterio.open(URL) as s:
        for n, (la, lo) in CANDIDATOS.items():
            w = from_bounds(lo - 0.25, la - 0.25, lo + 0.25, la + 0.25, s.transform)   # ~15 km
            a = s.read(1, window=w, out_shape=(60, 60)).astype(float)
            a[a < -1e30] = np.nan
            med = np.nanmedian(a)
            clase = "mar" if med >= 14 else "tierras_altas" if med <= 8 else "AMBIGUO"
            print(f"{n:20s} ({la:+.1f},{lo:+.1f}) FeO mediana={med:5.1f} %  "
                  f"p10={np.nanpercentile(a, 10):5.1f} p90={np.nanpercentile(a, 90):5.1f} -> {clase}", flush=True)

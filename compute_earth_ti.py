"""Inercia termica aparente (ATI = (1-albedo)/dT) de TODOS los sitios EARTH de sites.csv,
desde los MOD11C3 (LST dia/noche, jun-ago) y MCD43C3 (albedo WSA) globales ya descargados.
No descarga nada nuevo (los CMG son globales). Salida: earth_ti.csv
"""
from pyhdf.SD import SD, SDC
import glob, csv, numpy as np, pandas as pd

LST_DIR = "C:/Users/hsant/NASA_SpaceApps_data/earth_lst"
ALB_DIR = "C:/Users/hsant/NASA_SpaceApps_data/earth_albedo"
sites = {r.site_id: (float(r.lat), float(r.lon))
         for r in pd.read_csv("sites.csv").itertuples() if r.body == "EARTH"}

def rc(lat, lon):  # grilla CMG 0.05 grados, lat 90..-90, lon -180..180
    return int((90 - lat) / 0.05), int((lon + 180) / 0.05)

# dT promedio de los meses MOD11C3
dT = {k: [] for k in sites}
for f in sorted(glob.glob(f"{LST_DIR}/MOD11C3*.hdf")):
    h = SD(f, SDC.READ); D = h.select("LST_Day_CMG").get(); N = h.select("LST_Night_CMG").get()
    for k, (la, lo) in sites.items():
        r, c = rc(la, lo); d = D[r, c] * 0.02; n = N[r, c] * 0.02
        if d > 0 and n > 0:
            dT[k].append(d - n)

A = SD(glob.glob(f"{ALB_DIR}/MCD43C3*.hdf")[0], SDC.READ).select("Albedo_WSA_shortwave").get()

rows = []
for k, (la, lo) in sites.items():
    r, c = rc(la, lo); alb = A[r, c] * 0.001
    alb = float(alb) if 0 < alb < 1 else np.nan
    if not dT[k]:
        rows.append((k, np.nan, np.nan, alb)); continue
    dt = float(np.mean(dT[k])); ati = (1 - alb) / dt
    rows.append((k, round(ati, 4), round(dt, 1), round(alb, 3)))

with open("earth_ti.csv", "w", newline="") as fo:
    fo.write("# Inercia termica aparente (ATI = (1-albedo)/dT, indice relativo 1/K). "
             "Fuente: MODIS MOD11C3 LST dia/noche (jun-ago 2023) + MCD43C3 albedo WSA shortwave.\n")
    w = csv.writer(fo); w.writerow(["site_id", "thermal_inertia", "dT_day_night_K", "albedo_wsa"])
    for row in rows:
        w.writerow(row)
        print(f"{row[0]:16s} ATI={row[1]} dT={row[2]} alb={row[3]}")
print("guardado earth_ti.csv")

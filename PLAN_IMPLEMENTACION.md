# Plan de implementación del modelo — Versión 2 (Método riguroso de tres piezas)

Esta versión documenta el método científico del proyecto, el estado verificado de ejecución en disco (Fases 0 a 7 completadas) y la hoja de ruta detallada para las Fases 8 (Frontend interactivo) y 9 (Documentación y entrega). Está redactada para que cualquier agente posterior (como Claude o Gemini) o revisor técnico pueda continuar el desarrollo o verificar los resultados sin pérdida de contexto.

---

## 1. Contexto metodológico y decisiones fundamentales del equipo

La ingesta de datos planetarios y terrestres está terminada y validada en su totalidad (17 sitios en Luna, 16 sitios en Marte, totalizando 21 sitios únicos). 

El modelo inicial (`model_v0.py`, antes `model.py`) promediaba dimensiones mediante pesos iguales y escalas calibradas con la propia muestra local. El equipo descartó ese enfoque por carecer de sustento físico y adoptó un método riguroso compuesto por tres piezas:

1. **Distancia entre distribuciones por dimensión física:** En lugar de promedios locales o normalizaciones arbitrarias de 0 a 100, se calculan distancias de Wasserstein-1 sobre las distribuciones completas de pendiente a 4 escalas espaciales (grados de inclinación). La escala de comparación está determinada por la física del terreno y el error de medición del sensor, no por la dispersión de nuestra muestra.
2. **Ranking estocástico con SMAA-2:** Para evitar asignar pesos inventados o subjetivos a las diferentes escalas, se emplea *Stochastic Multicriteria Acceptability Analysis* (SMAA-2, Lahdelma y Salminen 2001) con 10,000 iteraciones Monte Carlo sobre el simplex uniforme de pesos y 200 réplicas con ruido de medición satelital. El resultado principal es una **probabilidad real (%) de que un sitio clasifique en el podio Top-3**.
3. **Validación contra clases de terreno documentadas:** La métrica de relieve se validó comprobando su capacidad para discriminar de forma ciega y con 100% de exactitud entre mares basálticos y tierras altas lunares (`validacion_clases.csv`, congelado con SHA-256).

### Lenguaje y honestidad científica obligatoria:
- **Prohibido:** Afirmar que un sitio es "el mejor análogo" (*the best analogue*). Ningún método de teledetección orbital puede coronar un análogo absoluto.
- **Obligatorio:** Utilizar la fórmula: *"más parecido en el relieve medido, adecuado para la prueba X dentro de un margen explícito"*.
- **Desglose de honestidad:** Todo resultado debe desglosarse en: `strongest_matches` (afinidad morfológica), `where_it_breaks_down` (dónde se rompe la analogía: gravedad, atmósfera, radiación, vacío) y `mission_utility` (ensayos técnicos concretos que habilita).

---

## 2. Reglas inmutables para el desarrollo continuo (Claude / Gemini)

1. **No reintroducir dimensiones descartadas:** No existen `edaphological_score` ni `mecatronic_operability_score`. No deben reintroducirse bajo ninguna denominación.
2. **Cero pesos o umbrales inventados:** Todo parámetro, umbral o nivel de ruido debe contar con su fuente primaria o secundaria explícita en `requisitos.csv`, o declararse formalmente como `SIN_FUENTE` (convención del proyecto). Está estrictamente prohibido "afinar" o tunear parámetros para forzar un ranking deseado.
3. **Motor único de cálculo:** El backend analítico se consolida en `model.py` (apoyado en `distributions.py` y `smaa.py`). No crear motores paralelos (`similarity.py` no existe ni debe crearse).
4. **Degradación de resolución:** La elevación terrestre (Copernicus 30 m) siempre se degrada a la resolución del sensor planetario de referencia (118 m en Luna / LOLA; 463 m en Marte / MOLA), nunca a la inversa.
5. **Filtro climático de Marte:** Marte exige aridez estricta (`aridity_class != NOT_ARID` en Global-AI v3.1, corte $AI < 0.5$). El Desierto de la Tatacoa ($AI = 1.115$, subhúmedo) queda **excluido de Marte** y se evalúa exclusivamente en Luna.
6. **Separación estricta entre ranking y contexto descriptivo:**
   - **Única dimensión en el ranking:** Relieve multiescala a 4 resoluciones espaciales.
   - **Dimensiones descriptivas (fuera del ranking):** Inercia térmica (unidades físicas y regímenes atmosféricos incompatibles), mineralogía (métodos de medición heterogéneos: reflectancia Sentinel-2 vs. % FeO Kaguya vs. literatura de rovers) y relieve sombreado *hillshade* (comparación visual libre de sesgos cromáticos).
7. **Protocolo de verificación en disco:** No registrar ni afirmar en la documentación ningún archivo, salida o métrica sin antes verificar su existencia real en el sistema de archivos.

---

## 3. Estado verificado en disco (Inventario de artefactos)

### Entorno y scripts:
- Entorno: Windows, Python 3.14 en `.venv/`.
- `ingest.py`: Pipeline de descarga remota (`/vsicurl/`), mosaico de tiles Copernicus 30 m, reproyección, cálculo de pendientes, Hurst, exportación de matrices `.npy` y generación de hillshades PNG. Soporta `--skip-soilgrids`.
- `earth_minerals.py`: Extracción de índices espectrales Sentinel-2 L2A (óxido férrico, arcilla/sulfato, máfico) vía AWS STAC.
- `compute_earth_ti.py`: Cálculo de inercia térmica aparente (ATI) terrestre a partir de MODIS LST día/noche y albedo MCD43C3.
- `distributions.py`: Cálculo de distribuciones de pendiente a 4 escalas y distancias de Wasserstein-1 en grados, con enmascaramiento de océanos y salares aplanados.
- `smaa.py`: Motor de simulación SMAA-2 sobre el simplex de pesos y convolución de réplicas de ruido satelital.
- `model.py`: Orquestador principal v1. Ejecuta `distributions.py`, invoca `smaa.py`, evalúa requisitos citados de misión mediante bootstrap espacial por bloques y consolida las salidas.
- `model_v0.py`: Línea base v0 histórica (promedio ponderado), conservada exclusivamente con fines comparativos en `out/ranking_v0_*`.
- `validate_classes.py` y `fase6_confirmar_feo.py`: Scripts de validación de discriminación de clases lunares.

### Conjuntos de datos y configuración:
- `sites.csv`: 21 sitios verificados (4 referencias Luna, 3 referencias Marte, 10 candidatos terrestres, 3 de validación terrestre).
- `requisitos.csv`: 25 registros con fuentes primarias/secundarias (NASA Cianciolo 2024, LPSC Gracy & Lee 2024, VIPER Lim 2024, Airbus DEM Handbook v5.0, MGS MOLA, LRO LOLA).
- `perfiles_mision.csv`: 6 perfiles definidos por subconjuntos dimensionales y umbrales de misión (sin pesos).
- `validacion_clases.csv`: Archivo congelado de validación lunar (SHA-256: `d6bf7221ed9e0c64c7621d2f40ed1e390815fa66a51feb6348b3871ce662f1d0`).
- Archivos auxiliares: `moon_ti_ref.csv`, `earth_ti.csv`, `earth_minerals.csv`, `mars_minerals.csv`, `moon_minerals.csv`.

### Salidas analíticas en `out/`:
- `out/all_rankings.json` (396 KB): Salida canónica para el frontend. Contiene metadatos metodológicos, probabilidades SMAA Top-K, distancias por escala, fracciones de área según requisitos citados, propiedades descriptivas y justificaciones científicas.
- `out/distancias_MOON.json` (28.7 KB) y `out/distancias_MARS.json` (25.1 KB).
- `out/ranking_MOON.json` (266 KB), `out/ranking_MOON.csv` (5.0 KB).
- `out/ranking_MARS.json` (112 KB), `out/ranking_MARS.csv` (3.5 KB).
- `out/features_MOON.parquet` (34.1 KB), `out/features_MARS.parquet` (34.2 KB).
- `out/hillshade/` (66 archivos): 33 pares de `{PAIR}_{site}.png` y `{PAIR}_{site}_dem.npy` cubriendo los 17 sitios de Luna y 16 sitios de Marte.
- `out/validation/`: 8 matrices `.npy` de terrenos de validación lunar (mares y tierras altas).
- `out/validacion_clases.json` (19.8 KB): Resultado de la prueba de hipótesis de la Fase 6.

---

## 4. Detalle de fases ejecutadas (Fases 0 a 7: [COMPLETADAS])

### Fase 0 — Transferencia y visibilidad [COMPLETADA]
- Formalización del plan de implementación y sincronización metodológica entre agentes en `LOG_TRABAJO.md` y `CLAUDE.md`.

### Fase 1 — Requisitos de misión y errores citados [COMPLETADA]
- Creación de `requisitos.csv` documentando umbrales formales de la NASA (R01: aterrizaje lunar < 10° a 100 m; R02: caminata EVA < 20°; R03: zona de exploración ≤ 5° en ≥ 25% de 2 km de radio; R04: transitabilidad rover VIPER ≤ 15°).
- Documentación de errores verticales relativos de satélite (E01: Copernicus GLO-30 < 2 m / < 4 m; E02: LOLA ~1 m; E03: MOLA ~1 m).
- Determinación de límites de resolución: los requisitos de Marte están definidos a escala de metros y no son evaluables con píxeles MOLA de 463 m.

### Fase 2 — Análisis de inercia térmica física [COMPLETADA]
- Investigación sobre conversión del índice aparente MODIS (ATI) a unidades del SI ($J \cdot m^{-2} \cdot K^{-1} \cdot s^{-1/2}$).
- **Decisión del equipo:** Ante la ausencia de un modelo de conversión publicado aplicable sin calibración in situ y considerando que la densidad atmosférica terrestre modifica drásticamente la disipación térmica frente al vacío lunar o la presión de 6 mbar de Marte, **la inercia térmica se excluyó del ranking y se conservó como dimensión descriptiva**.

### Fase 3 — Distribuciones y distancias multiescala de relieve [COMPLETADA]
- Implementación de `distributions.py`. Extracción de matrices de elevación y cálculo de pendientes a 4 escalas espaciales:
  - Luna (LOLA 118 m): 118 m (1 px), 354 m (3 px), 1062 m (9 px) y 3186 m (27 px).
  - Marte (MOLA 463 m): 463 m (1 px), 1389 m (3 px), 4167 m (9 px) y 12501 m (27 px).
- Cálculo de distancias de Wasserstein-1 en grados.
- Detección y corrección de artefactos cartográficos:
  1. *Enmascaramiento de mar:* Copernicus asigna cota 0 m al océano. Se programó máscara de costa (`sea_frac_masked`) para evitar que desiertos costeros (Guajira, Sechura) aparecieran artificialmente como llanuras perfectas.
  2. *Enmascaramiento de salares aplanados:* Detección de cotas idénticas repetidas en lagos salados procesados erróneamente como agua plana (`edited_plateau_frac_masked` en Lake Gairdner).

### Fase 4 — Ranking estocástico con SMAA-2 [COMPLETADA]
- Implementación de `smaa.py` integrando SMAA-2 (10,000 sorteos uniformes sobre el simplex de pesos) y 200 perturbaciones estocásticas con el ruido vertical de los satélites.
- Salidas por candidato: $P(Top-3)$, rango esperado, aceptabilidad por posición y distancias por escala.
- Clasificación de robustez: etiqueta `"robusto"` si la probabilidad con y sin ruido difiere en menos de 10 puntos porcentuales.

### Fase 5 — Evaluación de cumplimiento de requisitos en Luna [COMPLETADA]
- Evaluación de requisitos R01, R02, R03 y R04 mediante remuestreo estadístico espacial por bloques de 4 km (2,000 remuestreos bootstrap).
- Clasificación del terreno: `coincide` (los intervalos del 90% se solapan), `candidato_mas_apto` (ensayo menos exigente que el sitio real) o `candidato_menos_apto` (ensayo más exigente).
- Confirmación de alta afinidad: Antofalla (Puna) coincide en los tres requisitos con Apolo 15 (Hadley Rille).

### Fase 6 — Validación de clases de terreno lunar [COMPLETADA]
- Verificación ciega de la métrica en la Luna con 9 sitios (5 mares basálticos confirmados con FeO de Kaguya y 4 tierras altas de anortosita).
- Predicciones congeladas en `validacion_clases.csv`:
  - **P1 (Discriminación morfológica): CUMPLIDA AL 100%.** En el 100% de los casos bajo pesos desconocidos, el vecino más cercano de un sitio pertenece a su misma clase geológica ($p=1.00$, frente a azar medio de $0.44$).
  - **P2 (Dependencia con la escala): NO CUMPLIDA.** La separación relativa resultó mayor a escala fina (118 m) que a escala amplia (3186 m). Se documentó con transparencia científica sin alterar el algoritmo.

### Fase 7 — Incorporación de sitios volcánicos del Cinturón de Fuego [COMPLETADA]
- Búsqueda sistemática e incorporación a `sites.csv` de 5 candidatos volcánicos poco estudiados de México, Argentina y Perú:
  1. `EARTH_PINACATE` (México): Basalto, conos y maars en suelo árido.
  2. `EARTH_PAYUNIA` (Argentina): Gran campo basáltico monogenético (>800 conos) y Pampas Negras.
  3. `EARTH_CARACHI` (Argentina): Cono de basalto y colada sobre cuenca salina a 3,450 m s.n.m.
  4. `EARTH_ANDAHUA` (Perú): Valle de los volcanes, conos de ceniza y tubos de lava.
  5. `EARTH_PIEDRA_POMEZ` (Argentina): Megayardangs de ignimbrita modelados por viento.
- Actualización de `ingest.py` con `--skip-soilgrids` (omitiendo peticiones lentas a APIs edafológicas).
- Recálculo de índices Sentinel-2 (`earth_minerals.py`) e inercia térmica aparente (`compute_earth_ti.py`).
- Regeneración completa de matrices de elevación, hillshades y ejecutable `model.py`.
- **Impacto en rankings:** Payunia y Andahua alcanzaron 100% $P(Top-3)$ en Luna (Apolo 15 y 17); Carachi Pampa y Piedra Pómez se consolidaron en el Top-3 de Marte (Cráter Gale).

---

## 5. Fase 8 — Implementación del Frontend interactivo [COMPLETADA]

### Arquitectura de la solución:
- **Ubicación:** Subdirectorio `frontend/`.
- **Stack tecnológico:** SPA estática con Vite + React 19 + TypeScript + Tailwind CSS + MapLibre GL.
- **Modelo de datos:** Arquitectura 100% desacoplada (Jamstack). La aplicación consume directamente los ficheros estáticos de `out/` (`all_rankings.json`, `distancias_*.json`, imágenes de `out/hillshade/`). No requiere servidores backend en tiempo de ejecución.
- **Preparación para despliegue:** La salida de compilación (`frontend/dist`) se aloja en Netlify mediante distribución CDN global Anycast.

### Especificaciones funcionales y UX:
1. **Dos vistas completamente diferenciadas e independientes:**
   - **Vista Luna (Tierra ↔ Luna):** Selector de los 4 sitios lunares (Apolo 15, Apolo 17, Tranquillitatis, Aristarco), visualización de los 13 candidatos terrestres, probabilidades SMAA Top-3, desglose de requisitos de misión Artemis/VIPER y comparación morfológica.
   - **Vista Marte (Tierra ↔ Marte):** Selector de los 3 sitios marcianos (Jezero, Gale, Meridiani), visualización de los 12 candidatos terrestres válidos (con indicación explícita de exclusión de Tatacoa por aridez), probabilidades SMAA y desglose descriptivo.
2. **Visualizaciones clave:**
   - Gráfico de barras de probabilidad $P(Top-3)$ con etiqueta de robustez al error de medición.
   - Comparador visual de relieve sombreado (*hillshade*) en alta definición cara a cara (sitio espacial vs. candidato terrestre).
   - Diagrama de radar o barras de distancias de Wasserstein-1 por escala espacial.
   - Fichas de honestidad científica desplegables: `strongest_matches`, `where_it_breaks_down`, `mission_utility`.
   - Paneles de contexto descriptivo: Inercia térmica (diferenciando regímenes atmosféricos) y firmas minerales Sentinel-2 / Kaguya / rovers.
3. **Mapas interactivos con MapLibre GL:**
   - Mapa terrestre con marcadores georreferenciados de los 13 sitios, diferenciando visualmente candidatos (`candidate`), sitios volcánicos de la Fase 7 y referencias de validación (`validation`).

---

## 6. Fase 9 — Documentación final, Despliegue y Pitch

1. **Guía de alojamiento y DNS (`GUIA_DESPLIEGUE_HOSTING.md`):**
   - Documento maestro e independiente en la raíz del repositorio.
   - Instrucciones completas para vincular un dominio registrado en GoDaddy con la plataforma Netlify.
   - Detalle de configuración de registros DNS (A, CNAME, Nameservers Netlify DNS vs. DNS externo).
   - Configuración de `netlify.toml` (SPA rewrites, headers de caché, CSP).
   - Aprovisionamiento de SSL/TLS gratuito vía Let's Encrypt y resolución de incidencias de propagación.
2. **Documentación pedagógica y ejecutiva:**
   - `PROYECTO_EXPLICADO.md` actualizado con tono accesible y sin tecnicismos para jueces no especializados.
   - `LOG_TRABAJO.md` al día como bitácora cronológica inmutable.
3. **Preparación del Pitch y alineación con rúbrica de la NASA:**
   - Enfoque centrado en la honestidad científica, el rigor probabilístico (SMAA) y el descubrimiento de análogos en el Cinturón de Fuego del Pacífico.

---

## 7. Guía rápida de comandos de ejecución (para Claude / Gemini)

Todos los comandos se ejecutan desde la raíz del proyecto en PowerShell o CMD de Windows:

```powershell
# 1. Verificar entorno Python y dependencias
.\.venv\Scripts\python.exe --version

# 2. Ejecutar el modelo v1 completo (SMAA-2 + Distancias + Salidas JSON/CSV)
.\.venv\Scripts\python.exe model.py

# 3. Regenerar ingesta lunar con omisión de SoilGrids
.\.venv\Scripts\python.exe ingest.py --sites sites.csv --out out --pair MOON --skip-soilgrids

# 4. Regenerar ingesta marciana (requiere rutas a datos locales fuera de OneDrive)
.\.venv\Scripts\python.exe ingest.py --sites sites.csv --out out --pair MARS --aridity C:\Users\hsant\NASA_SpaceApps_data\aridity\ai_v31_yr.tif --mars_ti C:\Users\hsant\NASA_SpaceApps_data\mars_ti --skip-soilgrids

# 5. Ejecutar validación de clases lunares (Fase 6)
.\.venv\Scripts\python.exe validate_classes.py

# 6. Compilar y levantar frontend en modo desarrollo (Fase 8)
cd frontend
npm install
npm run dev

# 7. Compilar frontend para producción (distribución estática)
npm run build
```

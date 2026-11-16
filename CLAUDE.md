# NASA Space Apps Challenge 2026 — Análogos terrestres de la Luna y Marte

## Cómo trabajar con este equipo (obligatorio)
- Hablar en español, **sin jerga técnica pero sin perder rigor**. Si un término técnico es inevitable, explicarlo en una frase.
- **Tú haces el trabajo.** El equipo no hace tareas manuales: descarga, instala, ejecuta, corrige y vuelve a ejecutar tú mismo.
- Si no sabes qué hacer o hay una decisión científica o de diseño, **presenta 2-3 opciones con pros y contras** y espera la decisión. No inventes.
- Señala las dudas con transparencia; luego respeta la decisión del equipo y sigue.
- Hay poco tiempo (hackathon). Prioriza lo que genera el 80% del resultado.
- Cierra cada respuesta con: `[LISTO]: ... | [DECISIÓN/PENDIENTE]: ... | [SIGUIENTE]: ...`

## Equipo
- **Integrante A (Data Science / ML / Cloud):** datos, preprocesamiento, modelo de similitud, backend.
- **Integrante B (Mecatrónica / Full-stack / Negocio):** criterios de ingeniería (aterrizaje, rovers, polvo), interfaz de visualización, informe y pitch.
- Sistema operativo: **Windows**.

## El reto
Encontrar y caracterizar **sitios en la Tierra parecidos a lugares de la Luna o de Marte**, priorizando sitios poco estudiados (no los clásicos Atacama, Hawái, Islandia, Antártida), para probar tecnología de futuras bases lunares o misiones marcianas.

Dimensiones: geología y minerales; topografía (elevación, pendiente, rugosidad, cráteres); suelo/regolito; temperatura, iluminación y radiación; viento y polvo; condiciones para aterrizar, moverse y construir.

**Honestidad científica obligatoria:** ningún sitio terrestre reproduce todo. Cada resultado debe decir qué se parece, **dónde se rompe la analogía** (gravedad, vacío lunar, atmósfera marciana, radiación) y **para qué prueba de misión sirve**.

## Arquitectura: un núcleo, dos resultados independientes
- **MOON (Tierra ↔ Luna):** foco principal, 70% del esfuerzo, mayor profundidad.
- **MARS (Tierra ↔ Marte):** 30% del esfuerzo, 100% de rigor. **Solo zonas áridas, hiperáridas y semiáridas de suelo desnudo**: (a) desiertos cálidos con dunas, yardangs y afloramientos de sulfatos/óxidos; (b) desiertos fríos de altura y salares secos. **Prohibido:** glaciares, agua líquida, vegetación densa, sistemas hidrotermales activos.

## Contrato de datos (cada resultado)
- `target_body`: `"MOON"` | `"MARS"` (se generan y muestran por separado)
- Sitio planetario de referencia + ranking Top-K de sitios terrestres
- ~~Score global 0-100 y por dimensión: `geological_score`, `edaphological_score`, `topological_score`, `visual_embedding_score`, `mecatronic_operability_score`~~ (contrato original, **reemplazado el 15-nov**; ver abajo)
- Explicación obligatoria: `strongest_matches`, `where_it_breaks_down`, `mission_utility`

### Contrato vigente (v1, 15-nov, decisiones del equipo) — implementado en `model.py`
- `score_global` = **probabilidad (%) de quedar en el Top-3** más parecido en relieve, calculada con SMAA-2 (pesos desconocidos + error de medición). No es un puntaje inventado.
- También por candidato: `p_top_k_solo_pesos`, `expected_rank`, `rank_acceptability`, `robustness` ("robusto" / "sensible al error de medicion"), `weighted_distance_deg`, y distancias por escala en `scores.relieve_multiescala_distancia_deg`.
- **Única dimensión en el ranking: relieve multiescala** (distribuciones de pendiente a 4 escalas, Wasserstein-1 en grados), porque es la única que se mide igual en los tres cuerpos.
- **Desviaciones aceptadas por el equipo y su motivo:**
  - Se quitaron `edaphological_score` y `mecatronic_operability_score`.
  - `geological_score` / mineralogía: **descriptiva**, fuera del ranking (Tierra, Luna y Marte miden magnitudes distintas).
  - Inercia térmica: **descriptiva**, fuera del ranking (no hay conversión publicada del índice terrestre a unidades físicas, y la presión atmosférica cambia la inercia del mismo material).
  - `visual_embedding_score`: no existe; el hillshade es **solo descriptivo** (comparar por SSIM no tiene sustento científico establecido).
- Salidas: `out/ranking_{MOON,MARS}.json/.csv` y `out/all_rankings.json`. La línea base anterior es `model_v0.py` → `out/ranking_v0_*` (no es resultado).
- Lenguaje obligatorio: "más parecido en el relieve medido / adecuado para la prueba X dentro de un margen", nunca "el mejor análogo".

## Correcciones científicas decididas
1. ~~`edaphological_score` con propiedades físicas comparables~~ — **superado (15-nov):** la dimensión edafológica se eliminó y la inercia térmica es solo descriptiva (ver "Contrato vigente").
2. ~~`visual_embedding_score` con hillshade~~ — **superado (15-nov):** el hillshade se genera desde el modelo de elevación (nunca fotos satelitales crudas), pero es **solo descriptivo**, fuera del ranking.
3. **Sigue vigente:** la Tierra se degrada a la resolución del cuerpo planetario (118 m Luna, 463 m Marte), nunca al revés.

## Estado y documentos de trabajo (leer primero)
- **`LOG_TRABAJO.md`**: estado vivo, decisiones del equipo y resultados verificados. Su bloque inicial "TRASPASO Y ESTADO VIGENTE" dice por dónde seguir.
- **`PLAN_IMPLEMENTACION.md`**: método v1 (distancias entre distribuciones + SMAA + validación) y fases 0-9. Fases 0 a 7 terminadas; 8 (frontend interactivo Jamstack) y 9 (pitch y entrega) en desarrollo.
- **`GUIA_DESPLIEGUE_HOSTING.md`**: guía técnica completa para despliegue en Netlify y configuración de dominio en GoDaddy.
- **`PROYECTO_EXPLICADO.md`**: explicación pedagógica sin tecnicismos del proyecto hasta la Fase 7.

## Archivos en esta carpeta
- `ingest.py` — por sitio, ventana del modelo de elevación leída en remoto (GDAL `/vsicurl/`; en la Tierra mosaica los tiles de 1° de Copernicus), pendiente, rugosidad multiescala (exponente de Hurst), fracciones de pendiente, hillshade PNG; inercia térmica y mineralogía por cuerpo; para la Tierra suelo, geología y aridez. Salida: `out/features_{MOON,MARS}.*`, `out/hillshade/`. Soporta `--skip-soilgrids`.
- `earth_minerals.py`, `compute_earth_ti.py` — índices Sentinel-2 e inercia térmica aparente MODIS de la Tierra (leen `sites.csv`).
- `distributions.py`, `smaa.py`, `model.py` — motor v1 (ver "Contrato vigente"). `model_v0.py` es la línea base descartada.
- `validate_classes.py`, `fase6_confirmar_feo.py`, `validacion_clases.csv` — validación de la Fase 6 (clases de terreno lunar, hash congelado).
- `requisitos.csv` — todo umbral o error usado, con fuente y nivel de verificación. `perfiles_mision.csv` — perfiles de misión sin pesos.
- `sites.csv` — 21 sitios: 7 referencias (4 Luna, 3 Marte), 10 candidatos (5 originales + 5 volcánicos del Cinturón de Fuego de Fase 7) y 3 de validación (Namib, Erg Chebbi, Lake Gairdner). Coordenadas y aridez verificadas.
- Auxiliares: `moon_ti_ref.csv`, `earth_ti.csv`, `earth_minerals.csv`, `mars_minerals.csv`, `moon_minerals.csv`.
- Datos grandes fuera de OneDrive: `C:\Users\hsant\NASA_SpaceApps_data\` (aridez, THEMIS, MODIS, caché de ruido).

## Fuentes de datos (todas verificadas y en uso)
- Luna, elevación LOLA 118 m: `https://planetarymaps.usgs.gov/mosaic/Lunar_LRO_LOLA_Global_LDEM_118m_Mar2014.tif` — **multiplicar píxel × 0.5 para metros**
- Marte, elevación MOLA 463 m: `https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif`
- Tierra, elevación Copernicus GLO-30: `https://copernicus-dem-30m.s3.amazonaws.com/` (sin cuenta). Ojo: pone el mar en cota 0 y aplana cuerpos de agua (p. ej. Lake Gairdner); `distributions.py` lo enmascara.
- Luna, FeO: Kaguya MI en `planetarymaps.usgs.gov/mosaic/Lunar_MI_mineral_maps/`. Luna, inercia térmica: Diviner/Hayne 2017 (en `moon_ti_ref.csv`; el archivo original está en un SharePoint que solo abre con navegador).
- Marte, inercia térmica: THEMIS 1 km (Huang 2026, Zenodo 23527756; mapa nuevo de terceros, no el producto oficial USGS/ASU). Marte, mineralogía: literatura por sitio (los mapas OMEGA de la ESA no fueron accesibles).
- Tierra: Sentinel-2 (STAC `https://earth-search.aws.element84.com/v1/`, sin cuenta), SoilGrids y Macrostrat (funcionan; SoilGrids es lento e intermitente y el suelo es solo contexto), aridez Global-AI v3.1 (figshare `10.6084/m9.figshare.7504448`, ya descargada).
- MODIS (inercia térmica aparente de la Tierra) **sí** requirió cuenta NASA Earthdata (la creó el equipo; credenciales en el `.netrc` del usuario, se usa con `earthaccess`). Los HDF4 de MODIS se leen con `pyhdf`, no con rasterio.

## Primeros pasos — HECHOS (14 y 15-nov)
Entorno `.venv` (Python 3.14), prueba de red, ingesta de Marte y Luna, aridez, revisión de resultados y tabla resumen: todo terminado. Para regenerar resultados basta `./.venv/Scripts/python.exe model.py`.

## Limitaciones conocidas
- No sirve para sitios polares (p. ej. Shackleton): la proyección se deforma; se necesita el producto LOLA polar estereográfico.
- Requisitos de aterrizaje y movilidad de Marte (escala de metros) no son evaluables con pendientes a 463 m.
- El ranking solo mide relieve; la validación de la Fase 6 confirma que distingue terrenos lunares, no la comparación Tierra-planeta.

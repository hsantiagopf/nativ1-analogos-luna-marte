# El proyecto explicado de principio a fin
### Análogos terrestres de la Luna y Marte — NASA Space Apps 2026

> Documento para entender el proyecto **sin tecnicismos**. Cada vez que aparece un término necesario, se explica en una frase. Pensado para que cualquiera del equipo —o un juez de la NASA— entienda qué hacemos, por qué, cómo funciona el modelo y qué hemos logrado hasta la Fase 7.

---

## 1. ¿Qué estamos buscando? (el reto en una frase)

Queremos encontrar **lugares en la Tierra que se parezcan a sitios específicos de la Luna o de Marte**, para que las futuras misiones espaciales puedan **ensayar aquí en la Tierra** su tecnología (aterrizajes de naves, vehículos exploradores tipo rover, instrumentos científicos y construcción de bases) antes de viajar al espacio.

La gracia principal está en buscar **sitios poco estudiados** —evitando los clásicos que todo el mundo repite como Atacama central, Hawái, Islandia o la Antártida— y en Latinoamérica y el Cinturón de Fuego tenemos candidatos excepcionales que nunca antes se habían medido con este nivel de rigor.

---

## 2. La idea central: un motor, dos resultados independientes

Construimos **un solo sistema de cálculo**, pero que genera **dos resultados completamente separados e independientes**:

- 🌙 **LUNA (Tierra ↔ Luna):** qué lugares de la Tierra se parecen más a terrenos lunares clave. *(Es nuestro foco principal, con mayor profundidad de datos y evaluación de requisitos de aterrizaje y caminata).*
- 🔴 **MARTE (Tierra ↔ Marte):** qué lugares de la Tierra se parecen más a zonas marcianas exploradas por rovers. *(Con una regla estricta: solo zonas áridas, hiperáridas y desiertos secos de suelo desnudo; quedan totalmente prohibidos glaciares, lagos con agua líquida o selvas).*

No mezclamos peras con manzanas: la Luna no tiene atmósfera y Marte tiene una atmósfera tenue de dióxido de carbono y viento. Por eso, cada cuerpo celeste tiene su propia ventana de análisis, su propio ranking y su propia comparación.

---

## 3. La regla de oro: honestidad científica

**Ningún lugar de la Tierra es idéntico a la Luna o a Marte.** La Tierra tiene aire denso, agua, vida vegetal y menor radiación cósmica. Además, un desierto puede parecerse mucho en lo plano pero nada en sus minerales, o parecerse en sus rocas volcánicas pero estar a nivel del mar.

Por eso, nuestro sistema **prohíbe tajantemente coronar a ningún lugar como "el mejor análogo"**. En su lugar, el sistema dice con total transparencia:

1. **"El más parecido en el relieve medido":** qué candidato tiene las formas de colinas, pendientes y llanuras más parecidas a las del sitio espacial.
2. **Dónde se rompe el parecido (`where_it_breaks_down`):** por ejemplo, la Tierra tiene atmósfera que frena el polvo y cambia el calor, mientras que en la Luna hay vacío absoluto; o que en la Luna no existen arcillas ni óxidos hidratados porque nunca hubo ríos.
3. **Para qué prueba de misión sirve (`mission_utility`):** especifica con exactitud si el sitio sirve para probar tracción de ruedas de rovers, navegación autónoma en pendientes, sensores de descenso o simulaciones de caminata con traje espacial.

---

## 4. ¿Cómo medimos el parecido? (lo que entra al ranking y lo que es descriptivo)

Imagina que a cada lugar le tomamos una serie de "huellas físicas". Sin embargo, aprendimos que **no todas las huellas se pueden mezclar en un solo número matemático** sin caer en inventos arbitrarios.

Por eso, el equipo tomó una decisión científica impecable: **separar lo que entra al ranking numérico de lo que se muestra como contexto descriptivo**.

### A. La única huella que define el ranking: el relieve multiescala 🏔️
El **relieve** (la forma tridimensional del suelo: si es plano, escarpado, con lomas suaves o acantilados) es **la única propiedad física que se mide con el mismo método e idéntica magnitud matemática en los tres mundos** gracias a los satélites de elevación (Copernicus en la Tierra, LOLA en la Luna y MOLA en Marte).
- **¿Qué significa "multiescala"?** Es como mirar el terreno con cuatro lupas diferentes:
  1. Con lupa de cerca (100 a 400 metros): vemos si el suelo tiene baches o inclinaciones locales.
  2. Con lupa media (300 a 1,000 metros): vemos pequeñas lomas y bordes de cráteres.
  3. Con lupa amplia (1 a 4 kilómetros): vemos colinas y valles enteros.
  4. Con lupa panorámica (3 a 12 kilómetros): vemos la gran llanura o la cordillera completa.
- **¿Cómo se compara?** No usamos un simple promedio engañoso. Comparamos la **distancia entre distribuciones completas de pendiente** (usando la distancia de Wasserstein, que mide cuánto "esfuerzo geométrico" cuesta transformar la curva de pendientes de un terreno en la del otro). Si la distancia es cero, los terrenos tienen exactamente las mismas pendientes en todas las direcciones.

### B. Huellas de contexto descriptivo (fuera del ranking) 🔬
Para no engañar con números artificiales, las siguientes propiedades no se suman a los puntos de relieve, sino que se muestran como fichas de contexto científico para los especialistas:
- **Inercia térmica (cómo retiene el calor el suelo):** Nos dice cuánto tarda el terreno en calentarse de día y enfriarse de noche. El polvo fino cambia de temperatura en minutos; la roca maciza tarda horas. Es clave para saber si un vehículo se va a hundir en polvo o rodará sobre piedra. *¿Por qué no entra al ranking numérico?* Porque la presión del aire terrestre cambia físicamente cómo se transmite el calor en comparación con el vacío lunar o la delgada atmósfera de Marte, y los satélites terrestres entregan un índice relativo mientras que las sondas espaciales entregan unidades térmicas absolutas.
- **Mineralogía y composición química:** Qué minerales hay en la superficie (óxidos de hierro, basaltos, sulfatos, carbonatos). *¿Por qué no entra al ranking numérico?* Porque en la Tierra usamos satélites Sentinel-2 de la Agencia Espacial Europea (reflectancia de luz), en la Luna usamos el sensor Kaguya de Japón (porcentaje de óxido de hierro FeO en roca) y en Marte usamos la literatura científica de rovers. Sería deshonesto sumar porcentajes con cocientes de luz.
- **Relieve sombreado (Hillshade):** Es una representación en blanco y negro del terreno iluminado por un sol virtual a 45 grados de altura. Muestra las sombras y la textura real del relieve sin que el color visual (el marrón terrestre frente al rojo marciano o el gris lunar) confunda la vista. Se utiliza para que los jueces puedan ver los dos paisajes cara a cara.

---

## 5. El método matemático sin dolor de cabeza: ¿Cómo evitamos inventar números?

En los proyectos típicos de hackathon, la gente suele inventar "pesos": *"le pongo 40% a la pendiente fina, 30% a la pendiente media y 30% a la amplia"*. Pero, ¿por qué 40% y no 25%? Nadie lo sabe.

Para ser rigurosos, adoptamos un método de análisis multicriterio llamado **SMAA-2 (Análisis Estocástico de Aceptabilidad Multicriterio)**:

1. **Pesos desconocidos (exploración justa):** En lugar de elegir pesos a dedo, el computador corre **10,000 simulaciones** probando todas las combinaciones posibles de importancia entre las 4 escalas de relieve.
2. **Ruido y error de los satélites:** Ningún satélite mide con exactitud infinita. Agregamos **200 réplicas con ruido de medición real** basado en los manuales de la NASA y la Agencia Espacial Europea (por ejemplo, el satélite Copernicus tiene un error vertical de 1 a 2 metros).
3. **El resultado no es un puntaje inventado, es una probabilidad real:** Al final, el sistema cuenta cuántas veces cada candidato quedó entre los 3 mejores lugares más parecidos. Si un sitio tiene un **95% de probabilidad de Top-3**, significa que es parecido al sitio espacial sin importar qué escala prefieras y aun si los satélites tuvieron pequeñas fallas de medición.

---

## 6. Los lugares que estamos evaluando

Ampliamos nuestra red de sitios para tener una cobertura verdaderamente representativa:

### Referencias espaciales (los lugares de destino)
- 🌙 **Luna (4 sitios de aterrizaje y exploración):**
  - **Apolo 15 (Hadley Rille):** llanura volcánica atravesada por una profunda garganta de lava y flanqueada por los escarpados Montes Apeninos.
  - **Apolo 17 (Taurus-Littrow):** valle encajonado entre macizos montañosos con depósitos oscuros volcánicos.
  - **Mar de la Tranquilidad (Apolo 11):** llanura basáltica extraordinariamente plana y antigua.
  - **Meseta de Aristarco:** meseta volcánica elevada con coladas piroclásticas y fracturas de lava.
- 🔴 **Marte (3 sitios de rovers históricos):**
  - **Cráter Jezero:** cuenca de impacto con un antiguo delta fluvial y bordes montañosos (donde opera el rover Perseverance).
  - **Cráter Gale:** gran cuenca con un monte central de 5 km de altura (Mount Sharp) explorado por el rover Curiosity.
  - **Meridiani Planum:** llanura arenosa hiperárida con nódulos minerales y dunas (donde operó Opportunity).

### Candidatos terrestres (13 sitios en total: 10 candidatos + 3 de validación)
1. 🇨🇴 **Desierto de la Tatacoa (Colombia):** terreno quebrado de badlands y cárcavas sedimentarias. *(Por su clima semi-húmedo no califica para Marte, pero sí se evalúa para la Luna).*
2. 🇨🇴 **Alta Guajira árida interior (Colombia):** planicie desértica y pedregosa en el extremo norte de Sudamérica.
3. 🇦🇷 **Puna – Salar de Antofalla (Argentina):** altiplano desértico a gran altitud, frío, seco y rodeado de volcanes.
4. 🇦🇷 **Salinas Grandes (Argentina):** inmensa costra de sal blanca y lisa a más de 3,400 metros de altura.
5. 🇵🇪 **Desierto de Sechura (Perú):** desierto costero hiperárido de arena y mesetas suaves.
6. 🇲🇽 **Campo Volcánico El Pinacate (México) — *Fase 7*:** campo basáltico con gigantescos cráteres de explosión (maars) y conos de ceniza en pleno desierto de Sonora. Históricamente usado para entrenar a los astronautas del programa Apolo.
7. 🇦🇷 **La Payunia / Pampas Negras (Argentina) — *Fase 7*:** uno de los campos de volcanes monogenéticos y coladas de basalto más densos del planeta (>800 conos), con planicies de arena volcánica negra casi sin vegetación.
8. 🇦🇷 **Cono y Salar Carachi Pampa (Argentina) — *Fase 7*:** cono volcánico de basalto negro puro derramado sobre una cuenca salina blanca a 3,450 m de altura.
9. 🇵🇪 **Valle de los Volcanes de Andahua (Perú) — *Fase 7*:** valle interandino árido con conos de ceniza jóvenes y campos de lavas en bloque con tubos volcánicos subterráneos.
10. 🇦🇷 **Campo de Piedra Pómez (Argentina) — *Fase 7*:** laberinto de ignimbritas blancas talladas por vientos violentos en forma de crestas gigantescas (megayardangs), idéntico a las formaciones eólicas de Marte.
11. 🇳🇦 **Desierto de Namib - Sossusvlei (Namibia) — *Sitio de validación internacional*:** grandes dunas y planicies áridas.
12. 🇲🇦 **Erg Chebbi - Sahara (Marruecos) — *Sitio de validación internacional*:** mar de arena y dunas de óxido de hierro.
13. 🇦🇺 **Lake Gairdner (Australia) — *Sitio de validación internacional*:** lago salado continental seco con relieve circundante.

---

## 7. El camino recorrido: qué logramos fase por fase (Fases 0 a 7)

### Fase 0 y 1 — Requisitos oficiales de la NASA en mano
En lugar de inventar qué pendiente es peligrosa, revisamos directamente las presentaciones técnicas y conferencias oficiales de la NASA (LPSC 2024, presentaciones del Human Landing System Artemis III, especificaciones del rover lunar VIPER):
- **Aterrizaje lunar seguro (R01):** pendientes menores a 10 grados a escala de 100 metros.
- **Transitabilidad de rover (R04):** pendientes menores o iguales a 15 grados.
- **Caminata de astronautas con traje EVA (R02):** pendientes menores a 20 grados.
- **Área plana accesible (R03):** al menos 25% del terreno con pendiente menor a 5 grados en una zona circular de 2 km de radio.
- *Nota de rigor:* en Marte, como las pendientes se midieron con satélite a 463 metros por píxel, declaramos con honestidad que los requisitos a escala humana de 2 metros no se pueden asegurar con teledetección orbital; en Marte solo se evalúa la similitud global de relieve.

### Fase 2 y 3 — El salto al relieve multiescala y la limpieza de datos
- Descubrimos y corregimos trampas satelitales: los satélites marcaban el océano en cota cero y algunos salares habían sido aplanados artificialmente como "cuerpos de agua" por el algoritmo de Copernicus (como Lake Gairdner). Creamos máscaras para eliminar el agua y calcular el relieve exclusivamente sobre roca y tierra firme.
- Extrajimos las pendientes a 4 niveles de detalle para cada uno de los sitios.

### Fase 4 — El motor de probabilidades SMAA-2
- Programamos el motor estocástico con 10,000 iteraciones y 200 réplicas con ruido. Los resultados son completamente reproducibles (misma semilla da el mismo número con precisión de decimales).

### Fase 5 — Evaluación de misiones espaciales en la Luna
- Comparamos estadísticamente si los terrenos terrestres cumplen con la misma proporción de terreno seguro que los sitios lunares.
- **Gran hallazgo:** El altiplano de **Antofalla (Puna argentina) coincide estadísticamente en aterrizaje, rover y caminata con la zona del Apolo 15 (Hadley Rille)**. Es el análogo morfológico más sólido del hemisferio occidental.

### Fase 6 — Validación con el propio terreno lunar
- ¿Cómo saber si la matemática del modelo funciona de verdad? Hicimos una prueba ciega en la Luna: tomamos 5 mares lunares (llanuras volcánicas) y 4 zonas de tierras altas (montañas escarpadas).
- **Resultado impecable (P1 cumplida al 100%):** El modelo agrupó el 100% de los sitios con sus pares de la misma clase sin cometer ni un solo error. La matemática distingue perfectamente entre llanuras lisas y montañas abruptas.

### Fase 7 — Los volcanes del Cinturón de Fuego del Pacífico
- Incorporamos 5 joyas volcánicas poco estudiadas de México, Argentina y Perú con suelo desnudo y aridez verificada (El Pinacate, La Payunia, Carachi Pampa, Andahua y Piedra Pómez).
- **Resultados espectaculares:**
  - En la **Luna**, los terrenos basálticos de **La Payunia** y **Andahua** alcanzaron un 100% de probabilidad Top-3 para Apolo 15 y Apolo 17, empatando en la cima con Antofalla.
  - En **Marte**, para el **Cráter Gale**, el cono y salar de **Carachi Pampa (100%)** y el **Campo de Piedra Pómez (83.5%)** demostraron que los paisajes volcánicos y eólicos de la Puna andina reproducen el relieve del cráter marciano mucho mejor que los desiertos de dunas tradicionales.

---

## 8. ¿Dónde estamos hoy y qué sigue?

### ✅ Completado con éxito (Fases 0 a 7):
- 21 sitios procesados (7 referencias planetarias, 10 candidatos terrestres, 3 de validación y 1 excluido por aridez en Marte).
- Matrices de elevación y 66 imágenes de relieve sombreado en alta resolución en `out/hillshade/`.
- Motor probabilístico SMAA-2 y evaluación de misiones operando en `model.py`.
- Base de datos consolidada y lista en `out/all_rankings.json` (396 KB).

### 🚀 Lo que estamos construyendo ahora (Fase 8):
- **La interfaz web interactiva (Frontend Jamstack):**
  Una aplicación visual, moderna y elegante desarrollada en React, Vite y MapLibre GL en la carpeta `frontend/`. Esta aplicación permitirá a los jueces de la NASA:
  - Navegar de forma intuitiva entre dos vistas completamente dedicadas: **Análisis Tierra-Luna** y **Análisis Tierra-Marte**.
  - Explorar el mapa global y seleccionar los sitios para ver sus probabilidades en el podio Top-3.
  - Ver los relieves sombreados (hillshades) cara a cara.
  - Consultar la ficha de honestidad científica (`strongest_matches`, `where_it_breaks_down`, `mission_utility`) y los datos térmicos y minerales descriptivos.

### 📝 Lo que cierra el proyecto (Fase 9):
- Guía completa de alojamiento y despliegue del dominio web en GoDaddy y Netlify (`GUIA_DESPLIEGUE_HOSTING.md`).
- Revisión y auditoría final del diseño y narrativa técnica para el pitch a los jueces.

---

## 9. En una frase

> Demostramos que la cordillera andina y los desiertos volcánicos de América Latina albergan los análogos de relieve más precisos para ensayar aterrizajes y rovers de la Luna y Marte, evaluados no con puntajes inventados, sino con probabilidades matemáticas honestas y datos satelitales de vanguardia.

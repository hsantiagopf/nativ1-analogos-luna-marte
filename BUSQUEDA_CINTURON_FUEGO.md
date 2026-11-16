# Búsqueda de análogos en el Cinturón de Fuego del Pacífico

> Guía enfocada para encontrar lugares terrestres **interesantes** —parecidos a la Luna o Marte— a lo largo del Cinturón de Fuego del Pacífico. Pensada para investigar con apoyo de Gemini.

---

## Por qué el Cinturón de Fuego

El Cinturón de Fuego es el arco de volcanes que rodea el océano Pacífico. Es el mejor lugar para buscar análogos por tres razones:

1. **Composición parecida.** Las superficies de la Luna (mares de basalto) y de Marte (llanuras volcánicas) son **volcánicas**. Las rocas volcánicas del Cinturón de Fuego —sobre todo las coladas de basalto— se parecen químicamente mucho más a esos mundos que un desierto de arena o un badland sedimentario.
2. **Formas del terreno útiles.** Coladas de lava, conos de ceniza, cráteres de explosión (maars), tubos de lava, calderas y campos de piedra pómez reproducen formas reales de la Luna y Marte.
3. **Sitios poco estudiados.** El reto pide evitar los clásicos (Atacama, Hawái, Islandia). El Cinturón de Fuego —en especial la **Puna andina** y los campos volcánicos de México— tiene zonas áridas volcánicas muy poco documentadas.

**Doble filtro según el cuerpo:**

- **Para Marte** → solo sitios **áridos** (seco, suelo desnudo): tramo andino (Perú, Bolivia, Chile, Argentina) y México árido. Marte necesita desierto.
- **Para la Luna** → la aridez importa menos; manda la **forma y la composición volcánica**. Aquí también sirven sitios volcánicos más húmedos (Ecuador, Centroamérica) por su relieve basáltico.

---

## Qué hace a un sitio "interesante" (criterios de selección)

Un buen candidato cumple varios de estos:

- **Volcánico y de suelo desnudo** (basalto, ceniza, lava, pómez), con poca o ninguna vegetación.
- **Árido** (clave para Marte): poca lluvia, superficie seca.
- **Poco estudiado**: no aparece en los papers clásicos de análogos.
- **Con una forma distintiva**: colada de lava, maar, campo de dunas sobre lava, yardangs (crestas talladas por el viento), salar, tubo de lava.
- **Accesible** para una futura campaña de campo (que exista alguna ruta o pueblo cercano).

---

## Qué buscar y para qué sirve

| Forma del terreno | Se parece a… | Para qué prueba de misión |
| --- | --- | --- |
| Coladas de basalto | Mares de la Luna / llanuras de Marte | Movilidad de rover sobre roca volcánica |
| Conos de ceniza y maars | Cráteres de impacto (por la forma) | Ensayo de aterrizaje y navegación en cráteres |
| Tubos de lava | Cuevas lunares/marcianas | Refugio y construcción de base bajo tierra |
| Campos de pómez e ignimbritas | Regolito suelto y polvoriento | Manejo de polvo, tracción, perforación |
| Salares (evaporitas) | Depósitos de sulfatos de Marte | Astrobiología y química de superficie |
| Dunas y yardangs | Terreno modelado por viento en Marte | Erosión eólica, anclaje de equipos |

---

## Regiones y sitios candidatos (margen pacífico de América)

Priorizadas para un equipo latinoamericano. **Verificar coordenadas y aridez antes de usar.**

| Sitio | País | Tipo | Por qué es interesante | Cuerpo |
| --- | --- | --- | --- | --- |
| Campo volcánico El Pinacate | México | Basalto, maars, conos | Árido; astronautas del Apolo entrenaron cerca; cráter Elegante | Luna y Marte |
| Puna – Antofalla / Carachi Pampa | Argentina | Lava, salar, pómez | Altiplano hiperárido, volcánico, muy poco estudiado | Marte |
| Antofagasta de la Sierra / Galán | Argentina | Ignimbritas, conos | Campos de pómez y lava a gran altura, árido | Marte |
| Valle de los Volcanes (Andahua) | Perú | Conos y coladas jóvenes | Volcanismo reciente en zona seca, poco documentado | Luna y Marte |
| Altiplano de Uyuni (Tunupa) | Bolivia | Salar + volcanes | Salar enorme junto a volcanes; sulfatos | Marte |
| Payún Matrú / La Payunia | Argentina | Basalto, conos, malpaís | Uno de los mayores campos basálticos; árido; poco turístico | Luna y Marte |
| Campos volcánicos de Michoacán | México | Conos, lava | Volcanismo monogenético joven (p. ej. Paricutín) | Luna |

> **Evitar** por ser "clásicos" o inadecuados: núcleo de Atacama, Hawái, Islandia; y zonas con selva densa, glaciares o agua líquida permanente.

---

## Cómo encontrarlos (método)

1. **Partir de una base de volcanes** (p. ej. el catálogo del Smithsonian, *Global Volcanism Program*) y filtrar por el margen pacífico de América.
2. **Cruzar con aridez**: quedarse con los que estén en zona seca (para Marte) usando mapas de clima/aridez.
3. **Mirar en Google Earth**: confirmar que el suelo esté **desnudo** (sin vegetación), buscar coladas, conos, dunas o salares visibles.
4. **Filtrar por "poco estudiado"**: buscar en Google Scholar; si casi no hay papers de análogo planetario sobre ese sitio, es buen candidato.
5. **Anotar** por sitio: coordenadas, tipo de volcanismo, qué forma distintiva tiene y para qué cuerpo/misión serviría.

---

## Prompts listos para Gemini

Copia y pega; reemplaza lo que está en MAYÚSCULAS.

**Encontrar sitios en una región:**

```text
Actúa como geólogo planetario. Dame 5 sitios volcánicos ÁRIDOS y poco estudiados en [PAÍS/REGIÓN del Cinturón de Fuego] que sirvan como análogos de Marte o la Luna. Evita Atacama, Hawái e Islandia. Para cada uno: nombre, coordenadas aproximadas, tipo de volcanismo, forma distintiva (lava, maar, salar, dunas) y por qué está poco estudiado. Cita fuentes con enlaces.
```

**Evaluar un sitio concreto:**

```text
Evalúa [SITIO, PAÍS] como análogo terrestre de Marte y de la Luna. Cubre: composición volcánica, aridez/clima, formas del terreno, qué prueba de misión permitiría ensayar (aterrizaje, rover, polvo, tubos de lava, base) y en qué se rompe la analogía. Marca lo incierto y cita fuentes.
```

**Buscar tubos de lava (para bases):**

```text
Lista campos volcánicos del margen pacífico de América con tubos de lava conocidos y accesibles, que puedan servir para ensayar refugios/bases lunares o marcianas. Incluye país, nombre del campo y una fuente por cada uno.
```

---

## Nota para el equipo

Esto **reenfoca la búsqueda** hacia lo volcánico. De nuestros candidatos actuales, el único plenamente volcánico del Cinturón de Fuego es **Antofalla (Puna)**; Tatacoa, Guajira y Sechura no son volcánicos (son sedimentarios/costeros). Vale la pena decidir si **cambiamos o ampliamos** la lista con sitios de esta guía antes de cerrar el análisis.

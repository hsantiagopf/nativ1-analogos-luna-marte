import { Database, Eye, FlaskConical, Layers, ShieldAlert } from 'lucide-react';
import { useL, type Bi } from '../lib/i18n';

interface Item { t: Bi; d: Bi }
interface Block { Icon: typeof Eye; title: Bi; intro: Bi; items: Item[] }

const BLOCKS: Block[] = [
  {
    Icon: Eye,
    title: { en: 'What the ranking measures', es: 'Qué mide el ranking' },
    intro: {
      en: 'Only one thing: how similar the shape of the ground is. It is the one property measured the same way on the Moon, Mars and Earth.',
      es: 'Solo una cosa: qué tan parecida es la forma del suelo. Es la única propiedad que se mide igual en la Luna, Marte y la Tierra.',
    },
    items: [
      { t: { en: 'Slopes at four scales', es: 'Pendientes a cuatro escalas' }, d: { en: 'From small bumps to wide hills, we compare how much of the terrain is flat, gentle or steep.', es: 'Desde pequeños desniveles hasta lomas amplias, comparamos cuánto del terreno es llano, suave o empinado.' } },
      { t: { en: 'Same sharpness for everyone', es: 'La misma nitidez para todos' }, d: { en: 'Earth is always blurred down to the detail level of the Moon (118 m) or Mars (463 m), never the other way round.', es: 'La Tierra se degrada siempre al nivel de detalle de la Luna (118 m) o Marte (463 m), nunca al revés.' } },
      { t: { en: 'Many possible priorities', es: 'Muchas prioridades posibles' }, d: { en: 'We do not know how much each scale matters for each mission, so we try thousands of combinations and also simulate measurement error.', es: 'No sabemos cuánto importa cada escala en cada misión, así que probamos miles de combinaciones y simulamos también el error de medición.' } },
    ],
  },
  {
    Icon: ShieldAlert,
    title: { en: 'What it does not measure', es: 'Qué no mide, y dónde se rompe la analogía' },
    intro: {
      en: 'No place on Earth reproduces everything. A very similar relief does not make a desert a replica of the Moon or Mars.',
      es: 'Ningún lugar de la Tierra reproduce todo. Un relieve muy parecido no convierte a un desierto en una réplica de la Luna o de Marte.',
    },
    items: [
      { t: { en: 'Gravity, air and radiation', es: 'Gravedad, aire y radiación' }, d: { en: 'The Moon has no atmosphere and about 1/6 of Earth’s gravity; Mars has very thin air and about 0.38 g. None of that can be reproduced in a desert.', es: 'La Luna no tiene atmósfera y tiene cerca de 1/6 de la gravedad terrestre; Marte tiene aire muy fino y unos 0,38 g. Nada de eso se reproduce en un desierto.' } },
      { t: { en: 'Soil, dust and minerals', es: 'Suelo, polvo y minerales' }, d: { en: 'Lunar dust is sharper, and minerals are measured with different quantities on each body, so they are shown as context but never scored.', es: 'El polvo lunar es más afilado y los minerales se miden con magnitudes distintas en cada cuerpo, por eso se muestran como contexto y nunca se puntúan.' } },
      { t: { en: 'Mars landing and rovers', es: 'Aterrizaje y rovers en Marte' }, d: { en: 'Those requirements are defined in meters, and our Mars data has one point every 463 m. We report the regional similarity only, and say so.', es: 'Esos requisitos se definen en metros y nuestros datos de Marte tienen un punto cada 463 m. Solo reportamos el parecido regional, y lo decimos.' } },
      { t: { en: 'Polar sites', es: 'Sitios polares' }, d: { en: 'The method distorts near the poles, so polar landing sites such as Shackleton are out of scope for now.', es: 'El método se deforma cerca de los polos, así que los sitios polares como Shackleton quedan fuera por ahora.' } },
      { t: { en: 'What validation shows', es: 'Qué demuestra la validación' }, d: { en: 'We checked that the method tells apart different lunar terrains. That is not a proof of the Earth–planet comparison itself, so we say “most similar in the measured relief”, never “the best analog”.', es: 'Comprobamos que el método distingue terrenos lunares distintos. Eso no prueba la comparación Tierra–planeta en sí, por eso decimos “más parecido en el relieve medido”, nunca “el mejor análogo”.' } },
      { t: { en: 'Mars: dry ground only', es: 'Marte: solo suelo seco' }, d: { en: 'For Mars we only consider arid and hyper-arid bare-ground deserts. Humid sites such as Tatacoa (Colombia) are ruled out.', es: 'Para Marte solo consideramos desiertos áridos e hiperáridos de suelo desnudo. Se descartan sitios húmedos como la Tatacoa (Colombia).' } },
    ],
  },
  {
    Icon: Database,
    title: { en: 'Data that decides the ranking', es: 'Datos que deciden el ranking' },
    intro: {
      en: 'Three public, openly accessible elevation datasets, one per world. Everything in the score comes from them.',
      es: 'Tres conjuntos de elevación públicos y de acceso abierto, uno por mundo. Todo el puntaje sale de ellos.',
    },
    items: [
      { t: { en: 'Moon elevation', es: 'Elevación de la Luna' }, d: { en: 'NASA Lunar Reconnaissance Orbiter laser altimeter (LOLA), global map at 118 m.', es: 'Altímetro láser LOLA de la sonda LRO de NASA, mapa global a 118 m.' } },
      { t: { en: 'Mars elevation', es: 'Elevación de Marte' }, d: { en: 'Mars Global Surveyor laser altimeter (MOLA), global map at 463 m.', es: 'Altímetro láser MOLA de Mars Global Surveyor, mapa global a 463 m.' } },
      { t: { en: 'Earth elevation', es: 'Elevación de la Tierra' }, d: { en: 'Copernicus GLO-30 digital elevation model at 30 m.', es: 'Modelo digital de elevación Copernicus GLO-30 a 30 m.' } },
      { t: { en: 'Globes and relief maps', es: 'Globos y mapas de relieve' }, d: { en: 'The 3D globes and shaded-relief maps are computed from these same elevation data, not from photos.', es: 'Los globos 3D y los mapas de relieve sombreado se calculan con estos mismos datos de elevación, no con fotos.' } },
    ],
  },
  {
    Icon: Layers,
    title: { en: 'Data used to choose and place sites', es: 'Datos para elegir y ubicar los sitios' },
    intro: {
      en: 'They do not change the score, but they decide which deserts are valid candidates and where they are.',
      es: 'No cambian el puntaje, pero deciden qué desiertos son candidatos válidos y dónde están.',
    },
    items: [
      { t: { en: 'Aridity', es: 'Aridez' }, d: { en: 'Global Aridity Index v3.1 (Global-AI). For Mars it filters out any site that is not arid or hyper-arid, and the sidebar lists the ones excluded.', es: 'Índice Global de Aridez v3.1 (Global-AI). Para Marte descarta todo sitio que no sea árido o hiperárido, y la barra lateral lista los excluidos.' } },
      { t: { en: 'Satellite map', es: 'Mapa satelital' }, d: { en: 'Esri World Imagery, shown on each site page to locate it on Earth.', es: 'Esri World Imagery, en la ficha de cada sitio para ubicarlo en la Tierra.' } },
    ],
  },
  {
    Icon: FlaskConical,
    title: { en: 'Scientific context we gathered', es: 'Contexto científico que reunimos' },
    intro: {
      en: 'We processed and checked these datasets and kept them in our technical files. They are not in the score because each body measures them in different quantities; they are the base for future, deeper comparisons.',
      es: 'Procesamos y verificamos estos conjuntos y los guardamos en nuestros archivos técnicos. No entran al puntaje porque cada cuerpo los mide con magnitudes distintas; son la base para comparaciones futuras más profundas.',
    },
    items: [
      { t: { en: 'Moon minerals', es: 'Minerales de la Luna' }, d: { en: 'Iron oxide (FeO) map from the Kaguya Multiband Imager (JAXA), distributed by USGS.', es: 'Mapa de óxido de hierro (FeO) del Multiband Imager de Kaguya (JAXA), distribuido por USGS.' } },
      { t: { en: 'Moon thermal inertia', es: 'Inercia térmica de la Luna' }, d: { en: 'Diviner radiometer on LRO, from Hayne et al. (2017).', es: 'Radiómetro Diviner de la sonda LRO, según Hayne y colaboradores (2017).' } },
      { t: { en: 'Mars thermal inertia', es: 'Inercia térmica de Marte' }, d: { en: 'THEMIS 1 km map from Huang (2026, Zenodo 23527756). It is a recent third-party map, not the official USGS/ASU product.', es: 'Mapa THEMIS de 1 km de Huang (2026, Zenodo 23527756). Es un mapa reciente de terceros, no el producto oficial de USGS/ASU.' } },
      { t: { en: 'Mars minerals', es: 'Minerales de Marte' }, d: { en: 'Taken from published studies, site by site. The ESA OMEGA maps could not be accessed.', es: 'Tomados de estudios publicados, sitio por sitio. Los mapas OMEGA de la ESA no fueron accesibles.' } },
      { t: { en: 'Earth minerals', es: 'Minerales de la Tierra' }, d: { en: 'Mineral indices computed from Sentinel-2 imagery.', es: 'Índices de minerales calculados con imágenes Sentinel-2.' } },
      { t: { en: 'Earth thermal inertia', es: 'Inercia térmica de la Tierra' }, d: { en: 'Apparent thermal inertia computed from NASA MODIS land-surface temperature (free NASA Earthdata account).', es: 'Inercia térmica aparente calculada con la temperatura de superficie de MODIS de NASA (cuenta gratuita de NASA Earthdata).' } },
      { t: { en: 'Earth geology', es: 'Geología de la Tierra' }, d: { en: 'Rock type of each desert from Macrostrat.', es: 'Tipo de roca de cada desierto, de Macrostrat.' } },
    ],
  },
];

export function SourcesPage() {
  const L = useL();
  return (
    <main className="fade-in relative z-10 mx-auto max-w-4xl px-6 pb-24 pt-14">
      <h1 className="font-display text-center text-3xl font-semibold text-white sm:text-4xl">{L({ en: 'Sources and limits', es: 'Fuentes y límites' })}</h1>
      <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
        {L({ en: 'What this platform measures, what it cannot tell you, and where the data comes from.', es: 'Qué mide esta plataforma, qué no puede decirte y de dónde salen los datos.' })}
      </p>
      <div className="mt-12 space-y-6">
        {BLOCKS.map(({ Icon, title, intro, items }) => (
          <section key={title.en} className="panel lift p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Icon size={20} className="text-slate-300" />
              <h2 className="font-display text-lg font-semibold text-white">{L(title)}</h2>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">{L(intro)}</p>
            <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {items.map((it) => (
                <div key={it.t.en}>
                  <dt className="text-sm font-medium text-white">{L(it.t)}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-slate-400">{L(it.d)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </main>
  );
}

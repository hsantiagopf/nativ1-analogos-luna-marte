import type { PlanetaryBody } from '../types';
import type { Bi } from '../lib/i18n';

export const PROJECT_NAME: Bi = { en: 'Project Nativ-1', es: 'Proyecto Nativ-1' };

export interface BodyCopy {
  slug: 'luna' | 'marte';
  tabLabel: Bi;
  heroTitle: Bi;
  heroText: Bi;
  chooseTitle: Bi;
  chooseHint: Bi;
  groupsTitle: Bi;
  rankingTitle: Bi;
  zoneWord: Bi;
  accent: string;
  limits: Bi[];
}

export const BODY_COPY: Record<PlanetaryBody, BodyCopy> = {
  MOON: {
    slug: 'luna',
    tabLabel: { en: 'Moon', es: 'Luna' },
    heroTitle: { en: 'Where on Earth can we rehearse the Moon?', es: '¿Dónde en la Tierra podemos ensayar la Luna?' },
    heroText: {
      en: 'We look for real terrains with the relief of lunar landing sites, so spacecraft and vehicles can be tested here without leaving the planet.',
      es: 'Buscamos terrenos reales con el relieve de los sitios de aterrizaje lunares, para probar naves y vehículos aquí, sin salir del planeta.',
    },
    chooseTitle: { en: 'Which area of the Moon do you want to simulate?', es: '¿Qué zona de la Luna quieres simular?' },
    chooseHint: { en: 'Tap a point on the globe or pick an area in the menu.', es: 'Toca un punto del globo o elige una zona en el menú.' },
    groupsTitle: { en: 'Lunar areas', es: 'Zonas de la Luna' },
    rankingTitle: { en: 'Ranking of the most similar Earth deserts', es: 'Ranking de desiertos terrestres más parecidos' },
    zoneWord: { en: 'Lunar area', es: 'Zona lunar' },
    accent: '#6cc9e6',
    limits: [
      { en: 'Earth has air, water and gravity six times stronger: none of that can be removed in a desert.', es: 'La Tierra tiene aire, agua y gravedad seis veces mayor: nada de eso se puede quitar en un desierto.' },
      { en: 'Lunar dust is much sharper and sticks to everything; no Earth soil imitates it.', es: 'El polvo lunar es mucho más afilado y se pega a todo; ningún suelo terrestre lo imita.' },
      { en: 'The Moon has no atmosphere: day and night temperatures are more extreme and radiation is higher.', es: 'La Luna no tiene atmósfera: el calor y el frío del día y la noche son más extremos y la radiación es mayor.' },
    ],
  },
  MARS: {
    slug: 'marte',
    tabLabel: { en: 'Mars', es: 'Marte' },
    heroTitle: { en: 'Where on Earth can we rehearse Mars?', es: '¿Dónde en la Tierra podemos ensayar Marte?' },
    heroText: {
      en: 'We look for real deserts whose terrain resembles Mars, so rovers and landings can be tested without leaving Earth.',
      es: 'Buscamos desiertos reales cuyo terreno se parece al de Marte, para probar rovers y aterrizajes sin salir de la Tierra.',
    },
    chooseTitle: { en: 'Which area of Mars do you want to simulate?', es: '¿Qué zona de Marte quieres simular?' },
    chooseHint: { en: 'Tap a point on the globe or pick an area in the menu.', es: 'Toca un punto del globo o elige una zona en el menú.' },
    groupsTitle: { en: 'Martian areas', es: 'Zonas de Marte' },
    rankingTitle: { en: 'Ranking of the most similar Earth deserts', es: 'Ranking de desiertos terrestres más parecidos' },
    zoneWord: { en: 'Martian area', es: 'Zona de Marte' },
    accent: '#e58a5c',
    limits: [
      { en: 'Martian air is about 160 times thinner than Earth’s: dust and wind do not behave the same.', es: 'El aire de Marte es unas 160 veces más fino que el de la Tierra: el polvo y el viento no se comportan igual.' },
      { en: 'Mars gravity is a little over a third of Earth’s.', es: 'La gravedad de Marte es poco más de un tercio de la terrestre.' },
      { en: 'Mars receives more radiation at the surface; a desert on Earth cannot repeat that.', es: 'Marte recibe más radiación en superficie; en un desierto de la Tierra no se puede repetir.' },
    ],
  },
};

export interface RefCopy { short: Bi; tagline: Bi; description: Bi }
const same = (s: string): Bi => ({ en: s, es: s });

export const REF_COPY: Record<string, RefCopy> = {
  MOON_A15: { short: same('Apollo 15 · Hadley Rille'), tagline: { en: 'Winding valley beside mountains', es: 'Valle sinuoso junto a montañas' }, description: { en: 'An ancient lava channel winding beside a lunar mountain range. A mix of plain and steep slopes.', es: 'Un antiguo canal de lava que serpentea junto a una cordillera lunar. Mezcla llanura y laderas empinadas.' } },
  MOON_A17: { short: same('Apollo 17 · Taurus-Littrow'), tagline: { en: 'Narrow valley between massifs', es: 'Valle estrecho entre macizos' }, description: { en: 'A valley squeezed between tall mountains, covered in dark volcanic ash.', es: 'Un valle encajonado entre grandes montañas, cubierto de ceniza volcánica oscura.' } },
  MOON_TRANQ: { short: { en: 'Sea of Tranquility', es: 'Mar de la Tranquilidad' }, tagline: { en: 'Dark, smooth plain', es: 'Llanura oscura y suave' }, description: { en: 'A vast plain of hardened lava, almost flat. Apollo 11 landed here.', es: 'Una gran llanura de lava endurecida, casi lisa. Aquí aterrizó el Apolo 11.' } },
  MOON_ARIS: { short: { en: 'Aristarchus Plateau', es: 'Meseta de Aristarco' }, tagline: { en: 'Volcanic plateau with a canyon', es: 'Meseta volcánica con cañón' }, description: { en: 'A raised plateau covered in volcanic ash and cut by a winding canyon.', es: 'Una meseta elevada cubierta de ceniza volcánica y cruzada por un cañón sinuoso.' } },
  MARS_JEZERO: { short: { en: 'Jezero Crater', es: 'Cráter Jezero' }, tagline: { en: 'Ancient dry lake', es: 'Antiguo lago seco' }, description: { en: 'A crater that once held a lake and a river delta, now dry. The Perseverance rover works here.', es: 'Un cráter que tuvo un lago y un delta de río, hoy secos. Aquí trabaja el rover Perseverance.' } },
  MARS_GALE: { short: { en: 'Gale Crater', es: 'Cráter Gale' }, tagline: { en: 'Central mountain and dunes', es: 'Montaña central y dunas' }, description: { en: 'A crater with a roughly 5 km mountain at its center and dune fields. The Curiosity rover works here.', es: 'Un cráter con una montaña de unos 5 km en el centro y campos de dunas. Aquí trabaja el rover Curiosity.' } },
  MARS_MERID: { short: same('Meridiani Planum'), tagline: { en: 'Huge, very smooth plain', es: 'Llanura enorme y muy lisa' }, description: { en: 'An almost flat equatorial plain with salt and iron minerals. The Opportunity rover worked here.', es: 'Una llanura ecuatorial casi plana, con minerales de sal y hierro. Aquí trabajó el rover Opportunity.' } },
};

export interface EarthCopy { name: Bi; country: Bi; tagline: Bi; description: Bi; control?: boolean }
const AR: Bi = { en: 'Argentina', es: 'Argentina' };
const PE: Bi = { en: 'Peru', es: 'Perú' };
const CO: Bi = { en: 'Colombia', es: 'Colombia' };

export const EARTH_COPY: Record<string, EarthCopy> = {
  EARTH_ANTOFALLA: { name: same('Puna de Antofalla'), country: AR, tagline: { en: 'Dry highland with volcanoes and salt flat', es: 'Altiplano seco con volcanes y salar' }, description: { en: 'A plateau at almost 3,850 m, with gullies, stony fans and ancient lava flows. It almost never rains.', es: 'Meseta a casi 3.850 m de altura, con quebradas, abanicos de piedras y antiguas coladas de lava. Casi nunca llueve.' } },
  EARTH_SALINAS: { name: same('Salinas Grandes'), country: AR, tagline: { en: 'Huge, flat dry salt lake', es: 'Lago de sal seco, enorme y plano' }, description: { en: 'A white salt plain at 3,450 m, almost without slopes.', es: 'Una planicie blanca de sal a 3.450 m de altura, casi sin desniveles.' } },
  EARTH_SECHURA: { name: { en: 'Sechura Desert', es: 'Desierto de Sechura' }, country: PE, tagline: { en: 'Dunes and dry plains by the sea', es: 'Dunas y llanuras secas junto al mar' }, description: { en: 'A coastal desert with dunes, sand and rock plains, and extreme dryness.', es: 'Desierto costero con dunas, llanuras de arena y roca, y una sequedad extrema.' } },
  EARTH_PINACATE: { name: { en: 'El Pinacate volcanic field', es: 'Campo volcánico El Pinacate' }, country: { en: 'Mexico', es: 'México' }, tagline: { en: 'Ash cones and wide craters', es: 'Conos de ceniza y grandes cráteres' }, description: { en: 'Over 400 dark ash volcanic cones and wide craters in the middle of the desert.', es: 'Más de 400 conos volcánicos de ceniza oscura y cráteres anchos en pleno desierto.' } },
  EARTH_PAYUNIA: { name: same('La Payunia · Pampas Negras'), country: AR, tagline: { en: 'Plain of black lava and ash', es: 'Llanura de lava y ceniza negra' }, description: { en: 'A broad plain of dark lava and ash, with hundreds of small volcanic cones.', es: 'Una extensa llanura de lava y ceniza oscura, con cientos de conos volcánicos pequeños.' } },
  EARTH_CARACHI: { name: same('Cono y Salar Carachi Pampa'), country: AR, tagline: { en: 'Lone volcano on a plain', es: 'Volcán solitario sobre una llanura' }, description: { en: 'An isolated lava cone rising above a plain of salt and sand.', es: 'Un cono de lava aislado que se levanta sobre una planicie de sal y arena.' } },
  EARTH_ANDAHUA: { name: same('Valle de los Volcanes · Andahua'), country: PE, tagline: { en: 'Valley with dozens of cones', es: 'Valle con decenas de conos' }, description: { en: 'A high valley dotted with small volcanic cones and lava flows.', es: 'Un valle de altura salpicado de conos volcánicos pequeños y coladas de lava.' } },
  EARTH_PIEDRA_POMEZ: { name: same('Campo de Piedra Pómez'), country: AR, tagline: { en: 'White rocks carved by the wind', es: 'Rocas blancas talladas por el viento' }, description: { en: 'A field of pale volcanic rock sculpted by the wind into curious shapes.', es: 'Un campo de roca volcánica clara, esculpida por el viento en formas curiosas.' } },
  EARTH_GUAJIRA: { name: same('Alta Guajira'), country: CO, tagline: { en: 'Dry plain by the Caribbean', es: 'Llanura seca junto al Caribe' }, description: { en: 'A coastal plain of sand and low hills, with very little rain.', es: 'Llanura costera de arena y colinas bajas, con muy poca lluvia.' } },
  EARTH_TATACOA: { name: { en: 'Tatacoa Desert', es: 'Desierto de la Tatacoa' }, country: CO, tagline: { en: 'Red and grey gullies', es: 'Barrancos rojos y grises' }, description: { en: 'Gullied terrain carved by rain, with vegetation and humidity.', es: 'Terreno de cárcavas tallado por la lluvia, con vegetación y humedad.' } },
  EARTH_NAMIB: { name: same('Namib · Sossusvlei'), country: { en: 'Namibia', es: 'Namibia' }, tagline: { en: 'Sea of red dunes', es: 'Mar de dunas rojas' }, description: { en: 'One of the oldest deserts in the world, with huge red dunes.', es: 'Uno de los desiertos más antiguos del mundo, con enormes dunas rojas.' }, control: true },
  EARTH_SAHARA: { name: same('Erg Chebbi · Sahara'), country: { en: 'Morocco', es: 'Marruecos' }, tagline: { en: 'Giant dunes', es: 'Dunas gigantes' }, description: { en: 'Very tall dunes at the edge of the Sahara.', es: 'Dunas muy altas en el borde del Sahara.' }, control: true },
  EARTH_GAIRDNER: { name: { en: 'Lake Gairdner', es: 'Lago Gairdner' }, country: { en: 'Australia', es: 'Australia' }, tagline: { en: 'Flat, dry salt lake', es: 'Lago de sal seco y plano' }, description: { en: 'A salt lake that is almost always dry and perfectly flat.', es: 'Un lago salado casi siempre seco y totalmente plano.' }, control: true },
};

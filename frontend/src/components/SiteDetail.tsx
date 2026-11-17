import { Suspense, useState } from 'react';
import { ArrowLeft, Footprints, Pickaxe, Rocket, ShieldCheck, Truck, X, type LucideIcon } from 'lucide-react';
import type { CandidateRanking, PlanetaryBody, ReferenceRanking } from '../types';
import { getHillshadePath, isMoonRequirementAssessment } from '../types';
import { BODY_COPY, EARTH_COPY, REF_COPY } from '../data/copy';
import { SITES_METADATA } from '../data/sites';
import { go } from '../lib/route';
import { useL, useLang, type Bi } from '../lib/i18n';
import { matchTier, medianDist, similaritySentence } from '../lib/rankings';
import { EarthMiniGlobe } from './lazy';
type Status = 'ok' | 'better' | 'worse' | 'na';
interface Mission { id: string; label: Bi; Icon: LucideIcon; status: Status; headline: Bi; text: Bi }

const pct = (x: number) => `${Math.round(x * 100)}%`;
const STATUS_TEXT: Record<Status, Bi> = {
  ok: { en: 'Equivalent to the target area', es: 'Equivalente a la zona de destino' },
  better: { en: 'Here it is even easier', es: 'Aquí resulta aún más fácil' },
  worse: { en: 'Here it is harder', es: 'Aquí resulta más difícil' },
  na: { en: 'Cannot be evaluated yet', es: 'Aún no se puede evaluar' },
};
/** Título de sección, igual al de las tarjetas de la columna derecha. */
const HEADING = 'text-xs font-medium uppercase tracking-[0.18em] text-slate-500';
const DESCRIPTIVE: Bi = { en: 'Descriptive only', es: 'Solo descriptivo' };

function missionsFor(body: PlanetaryBody, c: CandidateRanking): Mission[] {
  const a = c.requirement_assessment;
  if (body === 'MOON' && isMoonRequirementAssessment(a)) {
    const mk = (id: string, label: Bi, Icon: LucideIcon, key: 'R01' | 'R04' | 'R02', what: Bi): Mission => {
      const r = a[key];
      const status: Status = r.verdict === 'coincide' ? 'ok' : r.verdict === 'candidato_mas_apto' ? 'better' : 'worse';
      const c1 = pct(r.cand_area_frac.median);
      const c2 = pct(r.ref_area_frac.median);
      return {
        id, label, Icon, status, headline: STATUS_TEXT[status],
        text: {
          en: `${what.en} In this desert ${c1} of the terrain qualifies; in the lunar area, ${c2}.`,
          es: `${what.es} En este desierto el ${c1} del terreno es apto; en la zona lunar, el ${c2}.`,
        },
      };
    };
    return [
      mk('land', { en: 'Safe landing zone', es: 'Zona de aterrizaje seguro' }, Rocket, 'R01', { en: 'Measures how much of the terrain is flat enough (under 10° tilt) to set a spacecraft down.', es: 'Mide qué parte del terreno es lo bastante llana (menos de 10° de inclinación) para posar una nave.' }),
      mk('roll', { en: 'Ease of rolling (rovers)', es: 'Facilidad para rodar (rovers)' }, Truck, 'R04', { en: 'Measures how much of the terrain a vehicle can cross (up to 15° tilt).', es: 'Mide qué parte del terreno puede recorrer un vehículo (hasta 15° de inclinación).' }),
      mk('walk', { en: 'Astronaut walks', es: 'Caminata de astronautas' }, Footprints, 'R02', { en: 'Measures how much of the terrain allows walking in a suit (under 20° tilt).', es: 'Mide qué parte del terreno permite caminar con traje (menos de 20° de inclinación).' }),
      { id: 'res', label: { en: 'Resource search', es: 'Búsqueda de recursos' }, Icon: Pickaxe, status: 'na', headline: DESCRIPTIVE,
        text: { en: 'The Moon has no water or oxidized minerals like Earth, so the soil cannot be compared. This platform compares only the shape of the terrain.', es: 'La Luna no tiene agua ni minerales oxidados como la Tierra, así que el suelo no se puede comparar. Esta plataforma compara solo la forma del terreno.' } },
    ];
  }
  return [
    { id: 'land', label: { en: 'Safe landing zone', es: 'Zona de aterrizaje seguro' }, Icon: Rocket, status: 'na', headline: STATUS_TEXT.na,
      text: { en: 'Landing requirements on Mars are measured in meters, and our Mars data has one point every 463 m. With it, nothing can be claimed about landing.', es: 'Los requisitos de aterrizaje en Marte se miden en metros, y nuestros datos de Marte tienen un punto cada 463 m. Con ellos no se puede afirmar nada para aterrizar.' } },
    { id: 'roll', label: { en: 'Ease of rolling (rovers)', es: 'Facilidad para rodar (rovers)' }, Icon: Truck, status: 'ok', headline: { en: 'Similar at regional scale', es: 'Parecido a escala de región' },
      text: { en: 'The general shape of the terrain is similar. Fine testing of wheels, rocks and local slopes needs more detailed data.', es: 'La forma general del terreno es parecida. La prueba fina de ruedas, rocas y pendientes locales necesita datos más detallados.' } },
    { id: 'res', label: { en: 'Resource search', es: 'Búsqueda de recursos' }, Icon: Pickaxe, status: 'na', headline: DESCRIPTIVE,
      text: { en: 'Martian minerals come from published studies and are not compared with Earth soil; here we compare only the shape of the terrain.', es: 'Los minerales de Marte vienen de estudios publicados y no se comparan con el suelo terrestre; aquí solo comparamos la forma del terreno.' } },
  ];
}

function Ring({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <svg width="92" height="92" viewBox="0 0 92 92" role="img" aria-label={label}>
      <circle cx="46" cy="46" r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="6" />
      <circle cx="46" cy="46" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 46 46)" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <path d="M34 47 l9 9 l17 -19" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function coordText(lat: number, lon: number, west: string) {
  return `${Math.abs(lat).toFixed(2)}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(lon).toFixed(2)}° ${lon < 0 ? west : 'E'}`;
}

function TerrainCompare({ body, earthId, refId, earthLabel, refLabel, accent }: { body: PlanetaryBody; earthId: string; refId: string; earthLabel: string; refLabel: string; accent: string }) {
  const L = useL();
  const [mode, setMode] = useState<'side' | 'blend'>('side');
  const [pos, setPos] = useState(50);
  const earthSrc = getHillshadePath(body, earthId);
  const refSrc = getHillshadePath(body, refId);
  const img = 'h-full w-full object-cover';
  return (
    <section aria-label={L({ en: '3D relief map', es: 'Mapa de relieve 3D' })}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className={HEADING}>{L({ en: '3D relief map', es: 'Mapa de relieve 3D' })}</h3>
        <div className="flex rounded-full border border-white/10 p-0.5 text-xs">
          {(['side', 'blend'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-full px-3 py-1 transition-colors ${mode === m ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
              {m === 'side' ? L({ en: 'Side by side', es: 'Lado a lado' }) : L({ en: 'Slide', es: 'Deslizar' })}
            </button>
          ))}
        </div>
      </div>
      {mode === 'side' ? (
        <div className="grid grid-cols-2 gap-3">
          {[{ s: earthSrc, l: earthLabel }, { s: refSrc, l: refLabel }].map((x) => (
            <figure key={x.l} className="panel overflow-hidden">
              <div className="aspect-square bg-black"><img src={x.s} alt={`${L({ en: 'Shaded relief of', es: 'Relieve sombreado de' })} ${x.l}`} className={img} style={{ imageRendering: 'auto' }} /></div>
              <figcaption className="px-3 py-2 text-xs text-slate-300">{x.l}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="relative aspect-square max-h-[420px] w-full select-none bg-black sm:aspect-[4/3]">
            <img src={refSrc} alt={`${L({ en: 'Relief of', es: 'Relieve de' })} ${refLabel}`} className={`${img} absolute inset-0`} />
            <img src={earthSrc} alt={`${L({ en: 'Relief of', es: 'Relieve de' })} ${earthLabel}`} className={`${img} absolute inset-0`} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
            <div className="pointer-events-none absolute inset-y-0 w-px" style={{ left: `${pos}%`, background: accent }} />
            <span className="absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs">{earthLabel}</span>
            <span className="absolute right-3 top-3 rounded bg-black/60 px-2 py-1 text-xs">{refLabel}</span>
          </div>
          <div className="px-4 py-3">
            <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label={L({ en: 'Slide to compare the two terrains', es: 'Deslizar para comparar los dos terrenos' })} className="w-full" style={{ accentColor: accent }} />
          </div>
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">{L({ en: 'Shaded relief computed from elevation measurements; these are not photos.', es: 'Relieve sombreado calculado desde mediciones de altura; no son fotos.' })}</p>
    </section>
  );
}

interface Props { body: PlanetaryBody; refRank: ReferenceRanking; cand: CandidateRanking }

export function SiteDetail({ body, refRank, cand }: Props) {
  const copy = BODY_COPY[body];
  const L = useL();
  const lang = useLang();
  const ec = EARTH_COPY[cand.site_id];
  const meta = SITES_METADATA[cand.site_id];
  const rc = REF_COPY[refRank.ref_site_id];
  const earthName = ec ? L(ec.name) : cand.name;
  const refName = rc ? L(rc.short) : refRank.ref_name;
  const missions = missionsFor(body, cand);
  const [openMission, setOpenMission] = useState<string | null>(null);
  const active = missions.find((m) => m.id === openMission);
  const rank = refRank.candidates.findIndex((x) => x.site_id === cand.site_id) + 1;
  const strong = cand.robustness === 'robusto';

  return (
    <div className="scroll-thin fade-in relative h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-5 pb-40 pt-6 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => go({ body, ref: refRank.ref_site_id, cand: null })} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ArrowLeft size={16} /> {L({ en: 'Back to the globe', es: 'Volver al globo' })}
          </button>
          <div className="rounded-full border px-4 py-1.5 text-sm" style={{ borderColor: `${copy.accent}66`, color: copy.accent }}>
            {L(copy.zoneWord)}: {refName}
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-8">
            <header>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {L({ en: `Rank ${rank} of ${refRank.candidates.length} evaluated deserts`, es: `Puesto ${rank} de ${refRank.candidates.length} desiertos evaluados` })}{ec?.control ? ` · ${L({ en: 'control site', es: 'sitio de control' })}` : ''}
              </p>
              <h1 className="font-display mt-2 text-3xl font-semibold text-white sm:text-4xl">{earthName}</h1>
              <p className="mt-1 text-slate-400">{ec && `${L(ec.country)} · ${L(ec.tagline)}`}</p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-200">
                {similaritySentence(lang, earthName, refName, medianDist(cand.weighted_distance_deg))}
              </p>
              <dl style={{ background: `linear-gradient(135deg, ${copy.accent}14, transparent 60%)`, borderColor: `${copy.accent}40` }} className="panel mt-6 grid gap-x-10 gap-y-5 p-5 sm:grid-cols-[auto_1fr_1fr] sm:items-center">
                <div className="flex items-center gap-4">
                  <Ring value={cand.score_global} color={copy.accent} label={L(matchTier(cand.score_global))} />
                  <div>
                    <dt className="text-xs text-slate-500">{L({ en: 'Terrain match', es: 'Parecido del terreno' })}</dt>
                    <dd className="font-display mt-0.5 text-xl font-semibold" style={{ color: copy.accent }}>{L(matchTier(cand.score_global))}</dd>
                    <dd className="mt-0.5 max-w-[190px] text-xs leading-snug text-slate-400">{L({ en: 'how often it ranked among the 3 most similar across our tests', es: 'qué tan seguido quedó entre los 3 más parecidos en nuestras pruebas' })}</dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">{L({ en: 'Ground tilt difference', es: 'Diferencia de inclinación del suelo' })}</dt>
                  <dd className="font-display mt-0.5 text-2xl font-semibold text-white">{medianDist(cand.weighted_distance_deg).toFixed(1)}°</dd>
                  <dd className="text-xs text-slate-500">{L({ en: 'on average, vs. the target area', es: 'en promedio, frente a la zona de destino' })}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">{L({ en: 'Reliability', es: 'Confiabilidad' })}</dt>
                  <dd className="mt-1 flex items-center gap-2 text-sm text-slate-100">
                    <ShieldCheck size={18} className="shrink-0" style={{ color: strong ? copy.accent : '#94a3b8' }} />
                    {strong ? L({ en: 'Very high (verified satellite data)', es: 'Muy alta (datos satelitales verificados)' }) : L({ en: 'Medium: shifts slightly with satellite accuracy', es: 'Media: cambia un poco según la precisión del satélite' })}
                  </dd>
                </div>
              </dl>
            </header>

            <TerrainCompare body={body} earthId={cand.site_id} refId={refRank.ref_site_id} earthLabel={earthName} refLabel={refName} accent={copy.accent} />

            <section>
              <h3 className={`mb-3 ${HEADING}`}>{L({ en: 'About these places', es: 'Sobre estos lugares' })}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="panel lift p-5">
                  <p className="font-display text-base font-semibold text-white">{earthName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{L({ en: 'On Earth', es: 'En la Tierra' })}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{ec && L(ec.description)}</p>
                </div>
                <div className="panel lift p-5">
                  <p className="font-display text-base font-semibold text-white">{refName}</p>
                  <p className="mt-0.5 text-xs" style={{ color: copy.accent }}>{L(copy.zoneWord)}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{rc && L(rc.description)}</p>
                </div>
              </div>
            </section>

            <section className="panel border-l-2 p-5" style={{ borderLeftColor: `${copy.accent}99` }}>
              <h3 className={`mb-3 ${HEADING}`}>{L({ en: 'Limits and differences', es: 'Límites y diferencias' })}</h3>
              <ul className="max-w-2xl space-y-2 text-sm leading-relaxed text-slate-400">
                {copy.limits.map((l) => (
                  <li key={l.en} className="flex gap-3"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-500" />{L(l)}</li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="panel overflow-hidden">
              <div className="h-[300px] bg-black sm:h-[340px]">
                {meta && <Suspense fallback={null}><EarthMiniGlobe lat={meta.lat} lon={meta.lon} accent={copy.accent} /></Suspense>}
              </div>
              <div className="p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{L({ en: 'Where it is on Earth', es: 'Dónde está en la Tierra' })}</p>
                <p className="mt-1 text-sm text-white">{earthName}, {ec && L(ec.country)}</p>
                {meta && (
                  <p className="mt-1 text-xs tabular-nums text-slate-400">
                    {coordText(meta.lat, meta.lon, lang === 'es' ? 'O' : 'W')}{meta.elevation_m != null ? ` · ${meta.elevation_m.toLocaleString(lang)} ${L({ en: 'm elevation', es: 'm de altura' })}` : ''}
                  </p>
                )}
              </div>
            </div>
            <section className="panel mt-4 p-5" aria-label={L({ en: 'What it is good for testing', es: 'Para qué prueba sirve' })}>
              <h3 className="mb-4 text-xs uppercase tracking-[0.18em] text-slate-500">{L({ en: 'What it is good for testing', es: 'Para qué prueba sirve' })}</h3>
              <div className="grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-4 xl:grid-cols-2">
                {missions.map((m) => {
                  const on = openMission === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setOpenMission(on ? null : m.id)}
                      aria-pressed={on}
                      className="group flex flex-col items-center gap-2.5 text-center"
                    >
                      <span
                        className="grid h-[68px] w-[68px] place-items-center rounded-full border transition-all group-hover:scale-105"
                        style={{ borderColor: on ? copy.accent : 'rgba(255,255,255,.2)', background: on ? `${copy.accent}26` : 'rgba(255,255,255,.03)', color: on ? copy.accent : '#e2e8f0', boxShadow: on ? `0 0 24px ${copy.accent}44` : 'none' }}
                      >
                        <m.Icon size={28} />
                      </span>
                      <span className="text-xs leading-tight text-slate-200">{L(m.label)}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-center text-[11px] text-slate-500">{L({ en: 'Tap an icon for details', es: 'Toca un ícono para ver el detalle' })}</p>
            </section>
          </aside>
        </div>
      </div>

      {active && (
        <div role="dialog" aria-label={L(active.label)} className="fade-in fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#0b0e15]/95 px-5 py-5 backdrop-blur sm:px-8">
          <div className="mx-auto flex max-w-3xl items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border" style={{ borderColor: copy.accent, color: copy.accent }}>
              <active.Icon size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">{L(active.label)}</p>
              <p className="mt-0.5 text-sm" style={{ color: active.status === 'na' ? '#94a3b8' : copy.accent }}>{L(active.headline)}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{L(active.text)}</p>
            </div>
            <button onClick={() => setOpenMission(null)} aria-label={L({ en: 'Close', es: 'Cerrar' })} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

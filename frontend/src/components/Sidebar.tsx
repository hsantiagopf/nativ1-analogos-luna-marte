import { useState } from 'react';
import { ChevronDown, Droplets, MapPin, Sigma } from 'lucide-react';
import type { AllRankingsData, PlanetaryBody } from '../types';
import { BODY_COPY, EARTH_COPY, REF_COPY } from '../data/copy';
import { useL } from '../lib/i18n';
import { go, type Route } from '../lib/route';
import { matchTier, medianDist, refsOf } from '../lib/rankings';

interface Props { data: AllRankingsData; body: PlanetaryBody; route: Route; onNavigate?: () => void; onMath?: () => void }

export function Sidebar({ data, body, route, onNavigate, onMath }: Props) {
  const copy = BODY_COPY[body];
  const L = useL();
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});
  const refs = refsOf(data, body);

  return (
    <nav aria-label={L(copy.groupsTitle)} className="flex h-full flex-col">
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-5">
      <h2 className="px-2 pb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">{L(copy.groupsTitle)}</h2>
      <div className="space-y-1">
        {refs.map((r) => {
          const rc = REF_COPY[r.ref_site_id];
          const open = route.ref === r.ref_site_id;
          // Solo se muestran los que tienen alguna probabilidad; los de 0% quedan tras el botón.
          const visible = r.candidates.filter((c) => Math.round(c.score_global) > 0);
          const shown = visible.length > 0 ? visible : r.candidates.slice(0, 1);
          const hiddenCount = r.candidates.length - shown.length;
          const list = showAll[r.ref_site_id] ? r.candidates : shown;
          return (
            <div key={r.ref_site_id} className={`rounded-xl transition-all duration-300 ${open ? 'bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-white/10' : ''}`}>
              <button
                onClick={() => go({ body, ref: r.ref_site_id, cand: null })}
                aria-expanded={open}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-white/[0.04]"
              >
                <MapPin size={16} style={{ color: copy.accent }} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{rc ? L(rc.short) : r.ref_name}</span>
                  <span className="block truncate text-xs text-slate-500">{rc && L(rc.tagline)}</span>
                </span>
                <ChevronDown size={16} className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && (
                <div className="fade-in px-2 pb-3">
                  <p className="px-2 pb-2 pt-1 text-xs leading-snug text-slate-400">
                    {L(copy.rankingTitle)}. {L({ en: 'The label says how similar each terrain is; below it, the average ground tilt difference.', es: 'La etiqueta dice qué tan parecido es cada terreno; debajo, la diferencia promedio de inclinación del suelo.' })}
                  </p>
                  <ol>
                    {list.map((c) => {
                      const rank = r.candidates.indexOf(c) + 1;
                      const zero = Math.round(c.score_global) === 0;
                      const ec = EARTH_COPY[c.site_id];
                      const sel = route.cand === c.site_id;
                      return (
                        <li key={c.site_id}>
                          <button
                            onClick={() => { go({ body, ref: r.ref_site_id, cand: c.site_id }); onNavigate?.(); }}
                            aria-current={sel ? 'true' : undefined}
                            className={`grid w-full grid-cols-[1.5rem_1fr_5.25rem] items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.06] ${sel ? 'bg-white/[0.08]' : ''}`}
                            style={sel ? { boxShadow: `inset 2px 0 0 ${copy.accent}` } : undefined}
                          >
                            <span className="text-xs tabular-nums text-slate-500">{rank}</span>
                            <span className="min-w-0">
                              <span className="block text-sm leading-snug text-slate-100">{ec ? L(ec.name) : c.name}</span>
                              <span className="mt-1 block h-[3px] w-full overflow-hidden rounded bg-white/10">
                                <span className="block h-full rounded" style={{ width: `${Math.max(2, c.score_global)}%`, background: `linear-gradient(90deg, ${copy.accent}, ${copy.accent}88)`, opacity: c.score_global >= 50 ? 1 : 0.45 }} />
                              </span>
                              <span className="mt-1 block text-xs text-slate-500">
                                {ec && L(ec.country)}{ec?.control ? ` · ${L({ en: 'control site', es: 'sitio de control' })}` : ''} · {L({ en: 'tilt differs', es: 'inclinación difiere' })} {medianDist(c.weighted_distance_deg).toFixed(1)}°
                              </span>
                            </span>
                            <span className="inline-flex items-center justify-end gap-1.5 text-right text-xs font-medium" style={{ color: c.score_global >= 50 ? copy.accent : '#64748b' }}>
                              {!zero && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c.score_global >= 50 ? copy.accent : '#64748b' }} />}
                              {zero ? '—' : L(matchTier(c.score_global))}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                  {hiddenCount > 0 && (
                    <button
                      onClick={() => setShowAll((s) => ({ ...s, [r.ref_site_id]: !s[r.ref_site_id] }))}
                      className="mt-1 w-full rounded-lg px-2 py-2 text-left text-xs text-slate-400 hover:text-white"
                    >
                      {showAll[r.ref_site_id] ? L({ en: 'Show fewer', es: 'Mostrar menos' }) : L({ en: `See the other ${hiddenCount} evaluated deserts`, es: `Ver los otros ${hiddenCount} desiertos evaluados` })}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {body === 'MARS' && data.MARS.excluded_by_aridity.length > 0 && (
        <aside className="panel mt-6 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-200">
            <Droplets size={14} style={{ color: copy.accent }} /> {L({ en: 'Why we ruled out humid sites', es: 'Por qué descartamos sitios húmedos' })}
          </div>
          <p className="text-sm font-medium text-white">{L(EARTH_COPY.EARTH_TATACOA.name)} ({L(EARTH_COPY.EARTH_TATACOA.country)})</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {L({ en: 'Ruled out: too much humidity and vegetation. Mars needs extreme deserts with completely dry ground.', es: 'Descartado: demasiada humedad y vegetación. Marte requiere desiertos extremos de suelo totalmente seco.' })}
          </p>
        </aside>
      )}
      </div>
      {onMath && (
        <div className="shrink-0 border-t border-white/10 bg-[#07090e] px-3 py-3">
          <button
            onClick={onMath}
            className="group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors hover:bg-white/[0.05]"
            style={{ borderColor: `${copy.accent}66` }}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${copy.accent}22`, color: copy.accent }}>
              <Sigma size={16} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-white">{L({ en: 'Mathematical backup', es: 'Respaldo matemático' })}</span>
              <span className="block text-xs text-slate-400">{L({ en: 'How the results were computed', es: 'Cómo se calcularon los resultados' })}</span>
            </span>
          </button>
        </div>
      )}
    </nav>
  );
}

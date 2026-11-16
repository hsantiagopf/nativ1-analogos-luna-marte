import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { AllRankingsData, PlanetaryBody, ReferenceRanking } from '../types';
import { BODY_COPY, EARTH_COPY } from '../data/copy';
import { useL, useLang } from '../lib/i18n';

interface Props { data: AllRankingsData; body: PlanetaryBody; refRank: ReferenceRanking | null; onClose: () => void }

const fmt = (n: number, d = 2) => n.toFixed(d);

export function MathModal({ data, body, refRank, onClose }: Props) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const rows = refRank?.candidates ?? [];
  const L = useL();
  const lang = useLang();
  const scales = rows[0] ? Object.keys(rows[0].scores.relieve_multiescala_distancia_deg) : [];
  const accent = BODY_COPY[body].accent;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={L({ en: 'Mathematical backup', es: 'Respaldo matemático' })} onClick={(e) => e.stopPropagation()}
        className="scroll-thin max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0e15] p-6 sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">{L({ en: 'Mathematical backup', es: 'Respaldo matemático' })}</h2>
            <p className="mt-1 text-sm text-slate-400">{L({ en: 'Technical detail for anyone who wants to check how the results were computed.', es: 'Detalle técnico para quien quiera revisar cómo se calcularon los resultados.' })}</p>
          </div>
          <button onClick={onClose} aria-label={L({ en: 'Close', es: 'Cerrar' })} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={18} /></button>
        </div>

        <div className="space-y-2 text-sm leading-relaxed text-slate-300">
          <p><span className="text-slate-500">{L({ en: 'Method', es: 'Método' })}:</span> {L({ en: 'SMAA-2 (Lahdelma and Salminen 2001) over Wasserstein-1 distances between slope distributions at 4 scales', es: 'SMAA-2 (Lahdelma y Salminen 2001) sobre distancias Wasserstein-1 entre distribuciones de pendiente a 4 escalas' })}.</p>
          <p><span className="text-slate-500">{L({ en: 'Simulations', es: 'Simulaciones' })}:</span> {L({ en: `${data.meta.n_iter.toLocaleString(lang)} priority combinations × ${data.meta.n_noise_replicas} measurement-error replicas; we count how often the site ranks among the ${data.meta.top_k} most similar.`, es: `${data.meta.n_iter.toLocaleString(lang)} combinaciones de prioridades × ${data.meta.n_noise_replicas} réplicas de error de medición; se cuenta cuántas veces el sitio queda entre los ${data.meta.top_k} más parecidos.` })}</p>
          <p><span className="text-slate-500">{L({ en: 'Only ranked dimension', es: 'Única dimensión en el ranking' })}:</span> {L({ en: 'multiscale relief (slope distributions at 4 scales, Wasserstein-1 distance in degrees). Thermal, mineralogy and shaded relief are descriptive only.', es: 'relieve multiescala (distribuciones de pendiente a 4 escalas, distancia de Wasserstein-1 en grados). Térmica, mineralogía y relieve sombreado son solo descriptivos.' })}</p>
          <p><span className="text-slate-500">{L({ en: 'Measurement error', es: 'Error de medición' })}:</span> {String(data.meta.measurement_error)}.</p>
        </div>

        {refRank ? (
          <div className="mt-6 overflow-x-auto">
            <h3 className="mb-2 text-sm font-medium text-white">{refRank.ref_name}</h3>
            <table className="w-full min-w-[640px] text-left text-xs tabular-nums">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">{L({ en: 'Site', es: 'Sitio' })}</th>
                  <th className="px-2 font-medium">P(Top-{data.meta.top_k}) %</th>
                  <th className="px-2 font-medium">{L({ en: 'Weights only %', es: 'Solo pesos %' })}</th>
                  <th className="px-2 font-medium">{L({ en: 'Expected rank', es: 'Posición esperada' })}</th>
                  <th className="px-2 font-medium">{L({ en: 'Weighted distance [P05–P95] °', es: 'Distancia ponderada [P05–P95] °' })}</th>
                  {scales.map((s) => <th key={s} className="px-2 font-medium">W1 {s.replace('slope_', '')} °</th>)}
                  <th className="px-2 font-medium">{L({ en: 'Robustness', es: 'Robustez' })}</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {rows.map((c) => {
                  const d = c.weighted_distance_deg;
                  return (
                    <tr key={c.site_id} className="border-t border-white/5">
                      <td className="py-2 pr-3">{EARTH_COPY[c.site_id] ? L(EARTH_COPY[c.site_id].name) : c.name}{c.role === 'validation' ? ` (${L({ en: 'control', es: 'control' })})` : ''}</td>
                      <td className="px-2" style={{ color: accent }}>{fmt(c.score_global, 1)}</td>
                      <td className="px-2">{fmt(c.p_top_k_solo_pesos, 1)}</td>
                      <td className="px-2">{fmt(c.expected_rank)}</td>
                      <td className="px-2">{typeof d === 'number' ? fmt(d) : `${fmt(d.median)} [${fmt(d.p05)}–${fmt(d.p95)}]`}</td>
                      {scales.map((s) => <td key={s} className="px-2">{fmt(c.scores.relieve_multiescala_distancia_deg[s] ?? NaN)}</td>)}
                      <td className="px-2">{c.robustness === 'robusto' ? L({ en: 'robust', es: 'robusto' }) : L({ en: 'sensitive to measurement error', es: 'sensible al error de medicion' })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 text-sm text-slate-500">{L({ en: 'Pick an area to see its full table.', es: 'Elige una zona para ver la tabla completa de esa zona.' })}</p>
        )}
        <p className="mt-6 text-xs text-slate-500">
          {L({ en: 'Honest reading: the ranking measures similarity in measured relief, not “the best analog”. Validation confirms it tells lunar terrains apart, not the Earth–planet comparison itself.', es: 'Lectura honesta: el ranking mide parecido en el relieve medido, no “el mejor análogo”. La validación confirma que distingue terrenos lunares, no la comparación Tierra–planeta.' })}
        </p>
      </div>
    </div>
  );
}

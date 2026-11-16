import { Suspense, useEffect, useRef, useState } from 'react';
import { ArrowRight, Sigma } from 'lucide-react';
import type { AllRankingsData, PlanetaryBody } from '../types';
import { BODY_COPY, EARTH_COPY, REF_COPY } from '../data/copy';
import { useL } from '../lib/i18n';
import { go, type Route } from '../lib/route';
import { markersOf, matchTier, medianDist, refsOf } from '../lib/rankings';
import { Globe3D } from './lazy';
import { Sidebar } from './Sidebar';
import { SiteDetail } from './SiteDetail';
import { TopNav } from './TopNav';
import { MathModal } from './MathModal';

interface Props { data: AllRankingsData; body: PlanetaryBody; route: Route }

export function BodyPage({ data, body, route }: Props) {
  const copy = BODY_COPY[body];
  const L = useL();
  const [drawer, setDrawer] = useState(false);
  const [mathOpen, setMathOpen] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMathOpen(false), [route.ref, route.cand]);

  const refs = refsOf(data, body);
  const refRank = refs.find((r) => r.ref_site_id === route.ref) ?? null;
  const cand = refRank?.candidates.find((c) => c.site_id === route.cand) ?? null;
  const markers = markersOf(data, body);
  const top = refRank?.candidates.find((c) => !EARTH_COPY[c.site_id]?.control) ?? refRank?.candidates[0];

  return (
    <div data-body={body} className="relative z-10 flex h-screen flex-col">
      <TopNav route={route} onMenu={() => setDrawer((d) => !d)} />
      <div className="relative flex min-h-0 flex-1">
        {drawer && <div className="absolute inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setDrawer(false)} />}
        <aside className={`absolute inset-y-0 left-0 z-30 w-[300px] border-r border-white/10 bg-[#07090e]/70 backdrop-blur-md transition-transform lg:static lg:translate-x-0 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar data={data} body={body} route={route} onNavigate={() => setDrawer(false)} />
        </aside>

        <main className="relative min-w-0 flex-1">
          {cand && refRank ? (
            <SiteDetail key={`${body}-${refRank.ref_site_id}-${cand.site_id}`} body={body} refRank={refRank} cand={cand} />
          ) : (
            <div className="relative flex h-full flex-col overflow-hidden lg:block">
              <div className="pointer-events-none relative z-10 shrink-0 p-6 sm:p-10 lg:absolute lg:inset-x-0 lg:top-0">
                <h1 className="font-display fade-in max-w-md text-2xl font-semibold leading-tight text-white sm:text-4xl">{refRank ? L(REF_COPY[refRank.ref_site_id].short) : L(copy.heroTitle)}</h1>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
                  {refRank ? L(REF_COPY[refRank.ref_site_id].description) : L(copy.heroText)}
                </p>
                {!refRank && <p className="mt-4 text-sm font-medium" style={{ color: copy.accent }}>{L(copy.chooseTitle)}</p>}
                {!refRank && <p className="mt-1 text-xs text-slate-500">{L(copy.chooseHint)}</p>}
              </div>

              <div className="relative min-h-0 flex-1 lg:absolute lg:inset-0 lg:left-[24%] lg:pt-6">
                <Suspense fallback={null}>
                <Globe3D
                  key={body}
                  body={body}
                  markers={markers}
                  activeId={route.ref}
                  onPick={(id) => go({ body, ref: id, cand: null })}
                  labelRef={labelRef}
                  accent={copy.accent}
                  fit={1.05}
                />
                </Suspense>
                <div ref={labelRef} className="pointer-events-none absolute left-0 top-0 z-10 opacity-0 transition-opacity" style={{ willChange: 'transform' }}>
                  {refRank && (
                    <div className="-translate-y-[120%] translate-x-4">
                      <div className="rounded-lg border bg-[#07090e]/90 px-3 py-2 text-sm backdrop-blur" style={{ borderColor: `${copy.accent}88` }}>
                        <span className="whitespace-nowrap font-medium text-white">{L(REF_COPY[refRank.ref_site_id].short)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {refRank && top && (
                <div className="fade-in absolute inset-x-4 bottom-4 z-10 sm:inset-x-auto sm:bottom-8 sm:left-10 sm:w-[380px]">
                  <div className="panel overflow-hidden bg-[#0b0e15]/90 p-5 shadow-2xl backdrop-blur" style={{ borderColor: `${copy.accent}55`, boxShadow: `0 18px 50px -20px ${copy.accent}55` }}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{L({ en: 'Its closest Earth twin', es: 'Su gemelo en la Tierra' })}</p>
                      <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: `${copy.accent}22`, color: copy.accent }}>{L(matchTier(top.score_global))}</span>
                    </div>
                    <p className="font-display text-xl font-semibold text-white">{EARTH_COPY[top.site_id] ? L(EARTH_COPY[top.site_id].name) : top.name}</p>
                    <p className="text-sm text-slate-400">{EARTH_COPY[top.site_id] && `${L(EARTH_COPY[top.site_id].country)} · ${L(EARTH_COPY[top.site_id].tagline)}`}</p>
                    <p className="mt-3 border-t border-white/10 pt-3 text-xs text-slate-400">
                      {L({ en: 'Ground tilt differs by', es: 'La inclinación del suelo difiere' })} <span className="font-medium tabular-nums text-slate-200">{medianDist(top.weighted_distance_deg).toFixed(1)}°</span> {L({ en: 'on average · little-studied desert', es: 'en promedio · desierto poco estudiado' })}
                    </p>
                    <button
                      onClick={() => go({ body, ref: refRank.ref_site_id, cand: top.site_id })}
                      className="group mt-3 flex items-center gap-2 text-sm font-medium"
                      style={{ color: copy.accent }}
                    >
                      {L({ en: 'See why they are alike', es: 'Ver por qué se parecen' })} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <button
        onClick={() => setMathOpen(true)}
        className="fixed bottom-3 right-3 z-30 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#07090e]/80 px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur transition-colors hover:text-slate-100"
      >
        <Sigma size={12} /> {L({ en: 'View mathematical backup', es: 'Ver respaldo matemático' })}
      </button>
      {mathOpen && <MathModal data={data} body={body} refRank={refRank} onClose={() => setMathOpen(false)} />}
    </div>
  );
}

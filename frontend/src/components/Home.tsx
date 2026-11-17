import { Suspense, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Globe3D } from './lazy';
import { BODY_COPY, PROJECT_NAME } from '../data/copy';
import { go } from '../lib/route';
import { useL } from '../lib/i18n';
import { HomeBackdrop } from './HomeBackdrop';
import type { PlanetaryBody } from '../types';

function BodyDoor({ body, side }: { body: PlanetaryBody; side: 'left' | 'right' }) {
  const c = BODY_COPY[body];
  const L = useL();
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={() => go({ body, ref: null, cand: null })}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-label={`${L({ en: 'Explore', es: 'Explorar' })} ${L(c.tabLabel)}`}
      className={`group relative h-[42vh] min-h-[260px] flex-1 overflow-hidden lg:h-auto ${side === 'left' ? 'lg:-mr-[2vw]' : 'lg:-ml-[2vw]'}`}
    >
      <div
        className={`absolute top-1/2 aspect-square w-[min(92vw,78vh)] -translate-y-1/2 transition-transform duration-700 lg:w-[min(40vw,86vh)] ${
          side === 'left' ? 'lg:-left-[24%] left-1/2 -translate-x-1/2 lg:translate-x-0' : 'lg:-right-[24%] left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto'
        } ${hover ? 'scale-[1.04]' : ''}`}
      >
        <Suspense fallback={null}>
          <Globe3D body={body} interactive={false} spin={side === 'left' ? 0.06 : -0.06} accent={c.accent} fit={1.3} />
        </Suspense>
      </div>
      <div
        className={`absolute bottom-6 z-10 flex items-center gap-2 text-sm font-medium tracking-wide transition-opacity lg:bottom-10 ${
          side === 'left' ? 'left-6 lg:left-10' : 'right-6 lg:right-10'
        }`}
        style={{ color: c.accent }}
      >
        {L({ en: 'Explore', es: 'Explorar' })} {L(c.tabLabel)} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}

export function Home() {
  const L = useL();
  return (
    <div className="relative flex min-h-[calc(100vh-112px)] flex-col lg:flex-row">
      <HomeBackdrop />
      <div className="order-2 flex flex-1 lg:order-none"><BodyDoor body="MOON" side="left" /></div>
      <section className="fade-in relative z-10 order-1 mx-auto flex max-w-xl flex-col items-center justify-center px-6 py-10 text-center lg:order-none lg:w-[38vw] lg:max-w-none lg:shrink-0">
        <p className="eyebrow mb-5">NASA Space Apps Challenge 2026</p>
        <h1 className="font-display bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-4xl font-semibold leading-tight text-transparent sm:text-6xl">{L(PROJECT_NAME)}</h1>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
          {L({
            en: 'Before traveling to the Moon or Mars, spacecraft and rovers must be tested on Earth. We look for real deserts whose terrain resembles each destination, and show you how similar they are, what they are good for, and where the comparison stops being valid.',
            es: 'Antes de viajar a la Luna o a Marte, hay que probar las naves y los rovers en la Tierra. Buscamos desiertos reales cuyo terreno se parezca al de cada lugar de destino, y te mostramos qué tan parecidos son, para qué sirven y dónde la comparación deja de valer.',
          })}
        </p>
        <dl className="mt-8 flex items-stretch gap-0 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3 backdrop-blur-sm">
          {([
            { n: '2', t: { en: 'worlds', es: 'mundos' } },
            { n: '7', t: { en: 'target zones', es: 'zonas de destino' } },
            { n: '13', t: { en: 'deserts evaluated', es: 'desiertos evaluados' } },
          ] as const).map((s, i) => (
            <div key={s.n} className={`flex flex-col items-center px-5 sm:px-6 ${i > 0 ? 'border-l border-white/10' : ''}`}>
              <dt className="order-2 mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">{L(s.t)}</dt>
              <dd className="font-display order-1 text-2xl font-semibold text-white">{s.n}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-sm text-slate-500">{L({ en: 'Choose a world to begin', es: 'Elige un mundo para empezar' })}</p>
        <div className="mt-3 flex gap-3">
          {(['MOON', 'MARS'] as const).map((b) => (
            <button
              key={b}
              onClick={() => go({ body: b, ref: null, cand: null })}
              className="group relative overflow-hidden rounded-full border px-6 py-2.5 text-sm font-medium transition-colors duration-300"
              style={{ borderColor: `${BODY_COPY[b].accent}99`, color: BODY_COPY[b].accent }}
            >
              <span className="absolute inset-0 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" style={{ background: `${BODY_COPY[b].accent}1f` }} />
              <span className="relative">{L(BODY_COPY[b].tabLabel)}</span>
            </button>
          ))}
        </div>
      </section>
      <div className="order-3 flex flex-1 lg:order-none"><BodyDoor body="MARS" side="right" /></div>
    </div>
  );
}

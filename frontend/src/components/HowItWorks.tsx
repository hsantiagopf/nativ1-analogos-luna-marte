import { Globe2, Layers, MapPinned } from 'lucide-react';
import { go } from '../lib/route';
import { useL, type Bi } from '../lib/i18n';
import { BODY_COPY } from '../data/copy';

const STEPS: { Icon: typeof Layers; t: Bi; d: Bi }[] = [
  { Icon: MapPinned, t: { en: '1 · Pick a place', es: '1 · Elige un lugar' }, d: { en: 'Choose an area of the Moon or Mars, for example where a mission landed.', es: 'Escoge una zona de la Luna o de Marte, por ejemplo donde aterrizó una misión.' } },
  { Icon: Globe2, t: { en: '2 · Meet its Earth twin', es: '2 · Mira su gemelo terrestre' }, d: { en: 'We show the Earth desert with the most similar terrain and why it is useful to test spacecraft or rovers.', es: 'Te mostramos el desierto de la Tierra con el terreno más parecido y por qué sirve para probar naves o rovers.' } },
  { Icon: Layers, t: { en: '3 · Compare the terrain', es: '3 · Compara el terreno' }, d: { en: 'Put both relief maps side by side and see where the comparison stops being valid.', es: 'Pon los dos mapas de relieve frente a frente y conoce dónde la comparación deja de valer.' } },
];

export function HowItWorks() {
  const L = useL();
  return (
    <main className="fade-in relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-14">
      <h1 className="font-display text-center text-3xl font-semibold text-white sm:text-4xl">{L({ en: 'How it works', es: 'Cómo funciona' })}</h1>
      <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
        {L({ en: 'Three steps to find where on Earth we can rehearse a mission to the Moon or Mars.', es: 'Tres pasos para encontrar dónde en la Tierra podemos ensayar una misión a la Luna o a Marte.' })}
      </p>
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {STEPS.map(({ Icon, t, d }) => (
          <div key={t.en} className="panel p-6 transition-colors hover:bg-white/[0.06]">
            <Icon size={22} className="mb-4 text-slate-300" />
            <h2 className="font-display text-base font-semibold text-white">{L(t)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{L(d)}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 flex justify-center gap-3">
        {(['MOON', 'MARS'] as const).map((b) => (
          <button
            key={b}
            onClick={() => go({ body: b, ref: null, cand: null })}
            className="rounded-full border px-5 py-2 text-sm font-medium transition hover:bg-white/5"
            style={{ borderColor: BODY_COPY[b].accent, color: BODY_COPY[b].accent }}
          >
            {L({ en: 'Start with', es: 'Empezar con' })} {L(BODY_COPY[b].tabLabel)}
          </button>
        ))}
      </div>
    </main>
  );
}

import { Home, Menu } from 'lucide-react';
import { go, type Route } from '../lib/route';
import { BODY_COPY, PROJECT_NAME } from '../data/copy';
import { setLang, useL, useLang } from '../lib/i18n';

function Logo({ className = 'h-12 w-12 sm:h-[84px] sm:w-[84px] drop-shadow-[0_0_14px_rgba(255,255,255,0.12)]' }: { className?: string }) {
  const L = useL();
  return <img src="/logo-nativ1-v2.webp" alt={L(PROJECT_NAME)} className={`${className} object-contain`} />;
}
export { Logo };

function LangSwitch() {
  const lang = useLang();
  return (
    <div role="group" aria-label="Language / Idioma" className="flex rounded-full border border-white/10 p-0.5 text-[11px] font-medium">
      {(['en', 'es'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 uppercase tracking-wide transition-colors ${lang === l ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

interface Props { route: Route; onMenu?: () => void }

export function TopNav({ route, onMenu }: Props) {
  const L = useL();
  const tab = (active: boolean) =>
    `relative h-10 shrink-0 whitespace-nowrap rounded-lg px-2 sm:px-5 flex items-center text-xs sm:text-sm font-medium tracking-wide transition-colors hover:bg-white/[0.04] ${active ? 'text-white' : 'text-slate-400 hover:text-white'}`;
  return (
    <header className="relative z-30 flex shrink-0 flex-wrap items-center gap-x-1 border-b border-white/10 bg-[#07090e]/80 px-3 py-2 shadow-[0_12px_32px_-18px_rgba(0,0,0,0.9)] backdrop-blur sm:h-[112px] sm:flex-nowrap sm:px-5 sm:py-0">
      {onMenu && (
        <button onClick={onMenu} aria-label={L({ en: 'Open areas menu', es: 'Abrir menú de zonas' })} className="mr-1 rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden">
          <Menu size={20} />
        </button>
      )}
      <nav className="order-3 flex w-full flex-wrap items-center pb-2 sm:order-none sm:w-auto sm:flex-nowrap sm:pb-0" aria-label={L({ en: 'Main', es: 'Principal' })}>
        <button onClick={() => go({ body: null, ref: null, cand: null })} className={tab(!route.body && !route.page)} aria-label={L({ en: 'Home', es: 'Inicio' })}>
          <Home size={18} />
          {!route.body && !route.page && <span className="absolute inset-x-3 -bottom-[9px] h-[2px] rounded bg-white" />}
        </button>
        {(['MOON', 'MARS'] as const).map((b) => {
          const active = route.body === b;
          return (
            <button key={b} onClick={() => go({ body: b, ref: null, cand: null })} className={tab(active)}>
              {L(BODY_COPY[b].tabLabel)}
              {active && <span className="absolute inset-x-3 -bottom-[9px] h-[2px] rounded" style={{ background: BODY_COPY[b].accent }} />}
            </button>
          );
        })}
        <button onClick={() => go({ body: null, ref: null, cand: null, page: 'how' })} className={tab(route.page === 'how')}>
          {L({ en: 'How it works', es: 'Cómo funciona' })}
          {route.page === 'how' && <span className="absolute inset-x-3 -bottom-[9px] h-[2px] rounded bg-white" />}
        </button>
        <button onClick={() => go({ body: null, ref: null, cand: null, page: 'sources' })} className={tab(route.page === 'sources')}>
          {L({ en: 'Sources & limits', es: 'Fuentes y límites' })}
          {route.page === 'sources' && <span className="absolute inset-x-3 -bottom-[9px] h-[2px] rounded bg-white" />}
        </button>
      </nav>
      <div className="order-2 ml-auto flex shrink-0 items-center gap-2 pl-2 sm:order-none sm:gap-3">
        <span className="hidden text-[11px] uppercase tracking-[0.2em] text-slate-500 xl:block">NASA Space Apps Challenge 2026</span>
        <LangSwitch />
        <Logo className="h-12 w-12 sm:h-[101px] sm:w-[101px] drop-shadow-[0_0_14px_rgba(255,255,255,0.12)]" />
      </div>
    </header>
  );
}

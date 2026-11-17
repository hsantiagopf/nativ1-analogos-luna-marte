import { useEffect } from 'react';
import { useL, useLang } from './lib/i18n';
import { BODY_COPY, PROJECT_NAME } from './data/copy';
import { useRoute } from './lib/route';
import { useRankings } from './lib/rankings';
import { TopNav } from './components/TopNav';
import { Home } from './components/Home';
import { Stars } from './components/Stars';
import { HowItWorks } from './components/HowItWorks';
import { SourcesPage } from './components/SourcesPage';
import { BodyPage } from './components/BodyPage';

export default function App() {
  const route = useRoute();
  const L = useL();
  const lang = useLang();
  useEffect(() => { document.title = `${PROJECT_NAME[lang]} — NASA Space Apps 2026`; }, [lang]);
  const { data, error } = useRankings();

  let content: React.ReactNode;
  if (error) {
    content = <div className="grid h-screen place-items-center px-6 text-center text-slate-300">{L({ en: 'Could not load the data. Reload the page.', es: 'No se pudieron cargar los datos. Recarga la página.' })}</div>;
  } else if (route.page === 'how') {
    content = (<><TopNav route={route} /><HowItWorks /></>);
  } else if (route.page === 'sources') {
    content = (<><TopNav route={route} /><SourcesPage /></>);
  } else if (!route.body) {
    content = (<><TopNav route={route} /><Home /></>);
  } else if (!data) {
    content = <div className="grid h-screen place-items-center text-sm text-slate-500">{L({ en: 'Loading…', es: 'Cargando…' })}</div>;
  } else {
    content = <BodyPage data={data} body={route.body} route={route} />;
  }

  // La transición se dispara solo al cambiar de pestaña (Inicio, Luna, Marte, Cómo funciona), no al elegir una zona.
  const pageKey = route.page ?? route.body ?? 'home';
  const wash = route.body ? BODY_COPY[route.body].accent : null;

  return (
    <div className="relative min-h-screen">
      <Stars />
      <div aria-hidden className="vignette" />
      <div aria-hidden className="film-grain" />
      <div key={pageKey} className="page-enter relative z-10">
        {wash && <div aria-hidden className="page-wash pointer-events-none fixed inset-0 z-0" style={{ background: `radial-gradient(ellipse at 50% 45%, ${wash}38, transparent 65%)` }} />}
        {content}
      </div>
    </div>
  );
}

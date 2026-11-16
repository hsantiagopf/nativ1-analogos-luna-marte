import { useSyncExternalStore } from 'react';

export type Lang = 'en' | 'es';
export type Bi = { en: string; es: string };

const KEY = 'nativ1-lang';
let current: Lang = 'en';
try {
  const saved = localStorage.getItem(KEY);
  if (saved === 'es' || saved === 'en') current = saved;
} catch { /* sin almacenamiento: queda en inglés */ }
if (typeof document !== 'undefined') document.documentElement.lang = current;

const listeners = new Set<() => void>();

export function setLang(l: Lang) {
  current = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignorar */ }
  document.documentElement.lang = l;
  listeners.forEach((f) => f());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, () => current, () => 'en' as Lang);
}

/** Devuelve una función que elige el texto en el idioma activo. */
export function useL() {
  const lang = useLang();
  return (v: Bi | string) => (typeof v === 'string' ? v : v[lang]);
}

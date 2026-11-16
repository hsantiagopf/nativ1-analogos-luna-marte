import { useSyncExternalStore } from 'react';
import type { PlanetaryBody } from '../types';

export interface Route { body: PlanetaryBody | null; ref: string | null; cand: string | null; page?: 'how' | 'sources' }

const SLUG: Record<string, PlanetaryBody> = { luna: 'MOON', marte: 'MARS' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'how') return { body: null, ref: null, cand: null, page: 'how' };
  if (parts[0] === 'sources') return { body: null, ref: null, cand: null, page: 'sources' };
  const body = SLUG[parts[0]] ?? null;
  if (!body) return { body: null, ref: null, cand: null };
  return { body, ref: parts[1] ?? null, cand: parts[2] ?? null };
}

export function href(route: Route): string {
  if (route.page === 'how') return '#/how';
  if (route.page === 'sources') return '#/sources';
  if (!route.body) return '#/';
  const slug = route.body === 'MOON' ? 'luna' : 'marte';
  return ['#', slug, route.ref, route.cand].filter(Boolean).join('/');
}

export function go(route: Route) {
  window.location.hash = href(route);
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}
const snapshot = () => window.location.hash;

export function useRoute(): Route {
  return parseHash(useSyncExternalStore(subscribe, snapshot, () => ''));
}

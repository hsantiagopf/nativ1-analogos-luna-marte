import { lazy } from 'react';

/**
 * Three.js y MapLibre pesan cientos de KB. Se cargan bajo demanda, para que el texto y la
 * navegación aparezcan primero y los globos lleguen en paralelo (cada uno hace su propio fundido).
 */
export const Globe3D = lazy(() => import('./Globe3D').then((m) => ({ default: m.Globe3D })));
export const EarthMiniGlobe = lazy(() => import('./EarthMiniGlobe').then((m) => ({ default: m.EarthMiniGlobe })));

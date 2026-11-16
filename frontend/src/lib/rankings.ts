import { useEffect, useState } from 'react';
import type { AllRankingsData, CandidateRanking, PlanetaryBody, ReferenceRanking } from '../types';
import { SITES_METADATA } from '../data/sites';

let cache: Promise<AllRankingsData> | null = null;
export function loadRankings(): Promise<AllRankingsData> {
  cache ??= fetch('/data/all_rankings.json').then((r) => {
    if (!r.ok) throw new Error('No se pudieron cargar los datos');
    return r.json();
  });
  return cache;
}

export function useRankings() {
  const [data, setData] = useState<AllRankingsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadRankings().then(setData).catch((e) => setError(String(e.message ?? e)));
  }, []);
  return { data, error };
}

export function refsOf(data: AllRankingsData, body: PlanetaryBody): ReferenceRanking[] {
  return data[body].references;
}

export function candidatesOf(ref: ReferenceRanking): CandidateRanking[] {
  return ref.candidates;
}

export function markersOf(data: AllRankingsData, body: PlanetaryBody) {
  return refsOf(data, body).flatMap((r) => {
    const m = SITES_METADATA[r.ref_site_id];
    return m ? [{ id: r.ref_site_id, lat: m.lat, lon: m.lon }] : [];
  });
}

/** Etiqueta cualitativa en vez de porcentaje exacto (evita el "100%" que suena a idéntico). */
export function matchTier(score: number): { en: string; es: string } {
  if (score >= 90) return { en: 'Very similar', es: 'Muy parecido' };
  if (score >= 50) return { en: 'Similar', es: 'Parecido' };
  return { en: 'Partly similar', es: 'Algo parecido' };
}

export const medianDist = (d: CandidateRanking['weighted_distance_deg']) => (typeof d === 'number' ? d : d.median);

/** Frase de parecido, sin jerga: depende de la diferencia media de inclinación del suelo. */
export function similaritySentence(lang: 'en' | 'es', cand: string, refName: string, diffDeg: number): string {
  const d = diffDeg.toFixed(1);
  if (lang === 'en') {
    if (diffDeg < 0.5) return `The slopes and plains of ${cand} are almost identical to those of ${refName}: ground tilt differs by about ${d}° on average.`;
    if (diffDeg < 1.5) return `The terrain of ${cand} closely resembles ${refName}: ground tilt differs by about ${d}° on average.`;
    if (diffDeg < 3.5) return `The terrain of ${cand} resembles ${refName}, though with visible differences: ground tilt differs by about ${d}° on average.`;
    return `${cand} only partly resembles ${refName}: ground tilt differs by about ${d}° on average.`;
  }
  if (diffDeg < 0.5) return `Las pendientes y llanuras de ${cand} son casi idénticas a las de ${refName}: la inclinación del suelo difiere unos ${d}° en promedio.`;
  if (diffDeg < 1.5) return `El terreno de ${cand} se parece mucho al de ${refName}: la inclinación del suelo difiere unos ${d}° en promedio.`;
  if (diffDeg < 3.5) return `El terreno de ${cand} se parece al de ${refName}, aunque con diferencias visibles: la inclinación del suelo difiere unos ${d}° en promedio.`;
  return `${cand} solo se parece en parte a ${refName}: la inclinación del suelo difiere unos ${d}° en promedio.`;
}

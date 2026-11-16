import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Vite no copia solo el worker de MapLibre al compilar (lo busca con una ruta dinámica):
// se importa como archivo para que salga en dist/assets y se le indica su ruta.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

maplibregl.setWorkerUrl(workerUrl);

interface Props { lat: number; lon: number; accent: string }

/** Globo terrestre pequeño que vuela hasta el desierto elegido. */
export function EarthMiniGlobe({ lat, lon, accent }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const m = new maplibregl.Map({
      container: ref.current,
      style: {
        version: 8,
        projection: { type: 'globe' },
        sources: {
          sat: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            maxzoom: 17,
            attribution: 'Imágenes © Esri',
          },
        },
        layers: [
          { id: 'bg', type: 'background', paint: { 'background-color': '#07090e' } },
          { id: 'sat', type: 'raster', source: 'sat' },
        ],
      } as maplibregl.StyleSpecification,
      center: [lon, lat],
      zoom: 1.2,
      attributionControl: { compact: true },
    });
    const el = document.createElement('div');
    el.style.cssText = `width:16px;height:16px;border-radius:50%;background:${accent};box-shadow:0 0 0 4px ${accent}55, 0 0 18px ${accent}`;
    marker.current = new maplibregl.Marker({ element: el }).setLngLat([lon, lat]).addTo(m);
    map.current = m;
    m.on('style.load', () => { try { m.setProjection({ type: 'globe' }); } catch { /* sin globo: queda plano */ } });
    m.on('load', () => m.flyTo({ center: [lon, lat], zoom: 3.4, duration: 2200 }));
    return () => { m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    marker.current?.setLngLat([lon, lat]);
    m.flyTo({ center: [lon, lat], zoom: 3.4, duration: 2200 });
  }, [lat, lon]);

  return <div ref={ref} className="h-full w-full" />;
}

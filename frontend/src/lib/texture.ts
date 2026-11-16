import * as THREE from 'three';
import type { PlanetaryBody } from '../types';

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error(src));
    i.src = src;
  });
}

function pixels(img: HTMLImageElement) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return { c, ctx, data: ctx.getImageData(0, 0, c.width, c.height) };
}

const RAMPS: Record<PlanetaryBody, [number[], number[], number[]]> = {
  MOON: [[10, 16, 24], [96, 128, 146], [226, 240, 248]],
  MARS: [[26, 10, 5], [140, 66, 38], [244, 190, 142]],
};

/** Textura del globo: relieve sombreado real (altimetría láser) con contraste y color propios de cada cuerpo. */
export async function buildGlobeTexture(body: PlanetaryBody): Promise<THREE.Texture> {
  const name = body === 'MOON' ? 'moon' : 'mars';
  const [hs, el] = await Promise.all([
    loadImg(`/textures/${name}_hillshade_2048.webp`),
    loadImg(`/textures/${name}_elev_2048.webp`),
  ]);
  const a = pixels(hs);
  const b = pixels(el);
  const [lo, mid, hi] = RAMPS[body];
  const out = a.data;
  for (let i = 0; i < out.data.length; i += 4) {
    const shade = out.data[i] / 255;
    const elev = b.data.data[i] / 255;
    let v = 0.5 + (shade - 0.74) * 5.5;
    v = Math.min(1, Math.max(0, v)) * (0.78 + 0.34 * elev);
    v = Math.min(1, v);
    const t = v < 0.5 ? v * 2 : (v - 0.5) * 2;
    const c0 = v < 0.5 ? lo : mid;
    const c1 = v < 0.5 ? mid : hi;
    out.data[i] = c0[0] + (c1[0] - c0[0]) * t;
    out.data[i + 1] = c0[1] + (c1[1] - c0[1]) * t;
    out.data[i + 2] = c0[2] + (c1[2] - c0[2]) * t;
    out.data[i + 3] = 255;
  }
  a.ctx.putImageData(out, 0, 0);
  const tex = new THREE.CanvasTexture(a.c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

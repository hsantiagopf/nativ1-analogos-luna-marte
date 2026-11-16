import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildGlobeTexture } from '../lib/texture';
import type { PlanetaryBody } from '../types';

export interface GlobeMarker { id: string; lat: number; lon: number }

interface Props {
  body: PlanetaryBody;
  markers?: GlobeMarker[];
  activeId?: string | null;
  onPick?: (id: string) => void;
  interactive?: boolean;
  /** Giro automático en radianes por segundo (solo cuando no hay punto elegido). */
  spin?: number;
  /** Elemento HTML que sigue al punto activo (la etiqueta del lugar). */
  labelRef?: React.RefObject<HTMLDivElement | null>;
  /** Cuánto del lienzo ocupa el globo (1 = justo). */
  fit?: number;
  accent: string;
  className?: string;
}

const R = 1;
export function latLonToVec(lat: number, lon: number, r = R) {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo));
}

export function Globe3D({ body, markers = [], activeId = null, onPick, interactive = true, spin = 0.05, labelRef, fit = 1.12, accent, className }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ markers, activeId, onPick, spin, interactive, labelRef });
  live.current = { markers, activeId, onPick, spin, interactive, labelRef };
  const apiRef = useRef<{ refreshMarkers: () => void } | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'pan-y';
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    const globe = new THREE.Group();
    scene.add(globe);

    // Globo con luz lateral y oscurecimiento hacia el borde, para que el limbo se funda con el espacio.
    const globeMat = new THREE.ShaderMaterial({
      uniforms: { map: { value: null as THREE.Texture | null } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `
        uniform sampler2D map; varying vec2 vUv; varying vec3 vN;
        void main(){
          vec3 tex = texture2D(map, vUv).rgb;
          float ndv = clamp(dot(normalize(vN), vec3(0.0,0.0,1.0)), 0.0, 1.0);
          float lit = dot(normalize(vN), normalize(vec3(-0.45, 0.30, 0.84)));
          float shade = 0.34 + 0.66 * smoothstep(-0.45, 0.80, lit);
          float limb = 0.18 + 0.82 * smoothstep(0.0, 0.55, ndv);
          gl_FragColor = vec4(tex * shade * limb, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), globeMat);
    globe.add(sphere);
    let disposed = false;
    // El globo aparece con un fundido cuando la textura está lista, en vez de un hueco vacío.
    el.style.opacity = '0';
    el.style.transition = reduce ? 'none' : 'opacity .9s ease';
    const reveal = () => { if (!disposed) el.style.opacity = '1'; };
    buildGlobeTexture(body).then((tex) => {
      if (disposed) return;
      globeMat.uniforms.map.value = tex;
      requestAnimationFrame(reveal);
    }).catch(reveal);

    // Halo suave alrededor del globo
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.07, 64, 48),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        uniforms: { c: { value: new THREE.Color(accent) } },
        vertexShader: 'varying vec3 n; void main(){ n = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader: 'uniform vec3 c; varying vec3 n; void main(){ float i = pow(max(0.0, 0.58 - dot(n, vec3(0,0,1.0))), 3.2); gl_FragColor = vec4(c, clamp(i,0.0,1.0)*0.32);}',
      }),
    );
    scene.add(halo);

    // Marcadores
    const markerGroup = new THREE.Group();
    globe.add(markerGroup);
    const hits: THREE.Mesh[] = [];
    const rings = new Map<string, THREE.Mesh>();
    const cores = new Map<string, THREE.Mesh>();
    function rebuildMarkers() {
      markerGroup.clear();
      hits.length = 0;
      rings.clear();
      cores.clear();
      for (const m of live.current.markers) {
        const pos = latLonToVec(m.lat, m.lon, R * 1.004);
        const g = new THREE.Group();
        g.position.copy(pos);
        g.lookAt(pos.clone().multiplyScalar(2));
        const back = new THREE.Mesh(new THREE.CircleGeometry(0.042, 32), new THREE.MeshBasicMaterial({ color: 0x05070b, transparent: true, opacity: 0.75, depthWrite: false }));
        back.position.z = -0.0005;
        const core = new THREE.Mesh(new THREE.CircleGeometry(0.02, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.034, 0.042, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
        const hit = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
        hit.userData.id = m.id;
        g.add(back, core, ring, hit);
        markerGroup.add(g);
        hits.push(hit);
        rings.set(m.id, ring);
        cores.set(m.id, core);
      }
    }
    rebuildMarkers();
    apiRef.current = { refreshMarkers: rebuildMarkers };

    // Tamaño
    function resize() {
      const w = el!.clientWidth || 1;
      const h = el!.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      const fov = (camera.fov * Math.PI) / 180;
      const limiting = Math.min(1, camera.aspect);
      camera.position.set(0, 0, (R * fit) / Math.tan(fov / 2) / limiting);
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    // Orientación inicial y enfoque
    globe.quaternion.setFromEuler(new THREE.Euler(0.35, -0.6, 0));
    const target = new THREE.Quaternion();
    let focusing = false;
    let lastActive: string | null = null;
    function setFocus(id: string | null) {
      lastActive = id;
      const m = live.current.markers.find((x) => x.id === id);
      if (!m) { focusing = false; return; }
      const dir = latLonToVec(m.lat, m.lon, 1).normalize();
      target.setFromUnitVectors(dir, new THREE.Vector3(0, 0, 1));
      focusing = true;
    }

    // Interacción
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let down: { x: number; y: number; moved: number } | null = null;
    let dragging = false;
    const camDir = new THREE.Vector3();
    function visibleSide(obj: THREE.Object3D) {
      const p = obj.getWorldPosition(new THREE.Vector3()).normalize();
      camDir.copy(camera.position).normalize();
      return p.dot(camDir) > 0.15;
    }
    function onDown(e: PointerEvent) {
      if (!live.current.interactive) return;
      down = { x: e.clientX, y: e.clientY, moved: 0 };
      dragging = true;
      renderer.domElement.setPointerCapture(e.pointerId);
    }
    function onMove(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      if (down && dragging) {
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        down.moved += Math.abs(dx) + Math.abs(dy);
        down.x = e.clientX;
        down.y = e.clientY;
        if (down.moved > 4) {
          focusing = false;
          const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.006);
          const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.006);
          globe.quaternion.premultiply(qy).premultiply(qx);
        }
      } else if (live.current.interactive) {
        ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const hit = ray.intersectObjects(hits, false).find((h) => visibleSide(h.object));
        renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
      }
    }
    function onUp(e: PointerEvent) {
      const wasClick = down && down.moved <= 4;
      dragging = false;
      down = null;
      if (!wasClick) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(hits, false).find((h) => visibleSide(h.object));
      if (hit) live.current.onPick?.(hit.object.userData.id as string);
    }
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointercancel', onUp);

    // Bucle
    let raf = 0;
    let prev = performance.now();
    const v = new THREE.Vector3();
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const { activeId: act, spin: sp, labelRef: lab } = live.current;
      if (act !== lastActive) setFocus(act);
      if (focusing) {
        globe.quaternion.slerp(target, reduce ? 1 : 1 - Math.pow(0.002, dt));
      } else if (!act && !dragging && sp && !reduce) {
        globe.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), sp * dt));
      }
      const t = now / 1000;
      rings.forEach((ring, id) => {
        const active = id === act;
        const s = active ? 1.5 + Math.sin(t * 3) * 0.2 : 1;
        ring.scale.setScalar(s);
        (ring.material as THREE.MeshBasicMaterial).opacity = active ? 1 : 0.85;
        (ring.material as THREE.MeshBasicMaterial).color.set(active ? 0xffd84d : 0xffffff);
      });
      cores.forEach((c, id) => { c.scale.setScalar(id === act ? 1.5 : 1); (c.material as THREE.MeshBasicMaterial).color.set(id === act ? 0xffd84d : 0xffffff); });
      // Etiqueta pegada al punto activo
      const labelEl = lab?.current;
      if (labelEl) {
        const m = live.current.markers.find((x) => x.id === act);
        if (m) {
          v.copy(latLonToVec(m.lat, m.lon, R * 1.004)).applyQuaternion(globe.quaternion);
          const facing = v.clone().normalize().dot(camera.position.clone().normalize()) > 0.2;
          v.project(camera);
          const w = el!.clientWidth;
          const h = el!.clientHeight;
          labelEl.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
          labelEl.style.opacity = facing ? '1' : '0';
          labelEl.style.pointerEvents = facing ? 'auto' : 'none';
        } else {
          labelEl.style.opacity = '0';
          labelEl.style.pointerEvents = 'none';
        }
      }
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointercancel', onUp);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
          (x as THREE.MeshBasicMaterial).map?.dispose?.();
          x.dispose();
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
      apiRef.current = null;
    };
    // El globo se reconstruye solo si cambia el cuerpo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, accent, fit]);

  // Si cambian los puntos (otro cuerpo/datos), se redibujan sin recrear el globo.
  const key = markers.map((m) => m.id).join(',');
  useEffect(() => {
    apiRef.current?.refreshMarkers();
  }, [key]);

  return <div ref={host} className={className} style={{ position: 'relative', width: '100%', height: '100%' }} />;
}

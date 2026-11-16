import { useEffect, useRef } from 'react';

/** Campo de estrellas fijo detrás de toda la app, con un leve parpadeo. */
export function Stars() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars: { x: number; y: number; r: number; a: number; s: number }[] = [];
    let raf = 0;
    function size() {
      const dpr = Math.min(devicePixelRatio, 2);
      cv!.width = innerWidth * dpr;
      cv!.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((innerWidth * innerHeight) / 5500);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * innerWidth, y: Math.random() * innerHeight,
        r: Math.random() * 1.1 + 0.2, a: Math.random() * 0.6 + 0.15, s: Math.random() * 2 + 0.5,
      }));
    }
    function draw(t: number) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const s of stars) {
        const tw = reduce ? 1 : 0.65 + 0.35 * Math.sin(t / 1000 * s.s + s.x);
        ctx.fillStyle = `rgba(220,230,255,${s.a * tw})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.283);
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    }
    size();
    draw(0);
    if (!reduce) raf = requestAnimationFrame(draw);
    addEventListener('resize', size);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); };
  }, []);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(108,201,230,.07), transparent 55%), radial-gradient(ellipse at 90% 100%, rgba(229,138,92,.07), transparent 55%)' }} />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

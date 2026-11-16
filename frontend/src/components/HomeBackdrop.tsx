/** Nebulosa suave: cian a la izquierda (Luna), terracota a la derecha (Marte), con una mezcla violeta al centro. */
export function HomeBackdrop() {
  const blob = (style: React.CSSProperties) => (
    <div className="absolute rounded-full" style={{ filter: 'blur(60px)', ...style }} />
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {blob({ left: '-8%', top: '-6%', width: '62vw', height: '80vh', background: 'radial-gradient(closest-side, rgba(60,170,230,0.40), rgba(60,170,230,0.16) 55%, transparent 100%)' })}
      {blob({ right: '-8%', top: '-4%', width: '62vw', height: '82vh', background: 'radial-gradient(closest-side, rgba(235,110,50,0.38), rgba(235,110,50,0.15) 55%, transparent 100%)' })}
      {blob({ left: '28%', top: '30%', width: '44vw', height: '56vh', background: 'radial-gradient(closest-side, rgba(120,90,220,0.20), rgba(120,90,220,0.06) 60%, transparent 100%)' })}
      {blob({ left: '-6%', bottom: '-18%', width: '48vw', height: '48vh', background: 'radial-gradient(closest-side, rgba(70,110,235,0.22), transparent 100%)' })}
      {blob({ right: '-6%', bottom: '-18%', width: '48vw', height: '48vh', background: 'radial-gradient(closest-side, rgba(210,70,90,0.20), transparent 100%)' })}
    </div>
  );
}

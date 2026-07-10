/**
 * Banderas dibujadas en SVG en vez de emoji: los emojis de bandera dependen de que el
 * sistema operativo tenga una fuente que sepa renderizarlos como imagen — Windows
 * (Segoe UI Emoji) históricamente no lo hace bien y muestra solo las letras sueltas o nada,
 * mientras que en Mac sí se ven. Un SVG propio se ve igual en cualquier lado.
 */

export function FlagAR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={className} role="img" aria-label="Argentina">
      <rect width="20" height="14" fill="#74ACDF" />
      <rect y="4.67" width="20" height="4.67" fill="#FFFFFF" />
      <g transform="translate(10 7)">
        <circle r="1.7" fill="#F6B40E" stroke="#85340A" strokeWidth="0.15" />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8;
          return (
            <rect
              key={i}
              x="-0.18"
              y="-2.5"
              width="0.36"
              height="0.8"
              fill="#F6B40E"
              transform={`rotate(${angle})`}
            />
          );
        })}
      </g>
    </svg>
  );
}

export function FlagUS({ className }: { className?: string }) {
  const stripeH = 14 / 7;
  return (
    <svg viewBox="0 0 20 14" className={className} role="img" aria-label="United States">
      <rect width="20" height="14" fill="#FFFFFF" />
      {[0, 2, 4, 6].map((i) => (
        <rect key={i} y={i * stripeH} width="20" height={stripeH} fill="#B22234" />
      ))}
      <rect width="9" height={stripeH * 4} fill="#3C3B6E" />
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: row % 2 === 0 ? 3 : 2 }).map((_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={1.3 + col * 2.2 + (row % 2 === 0 ? 0 : 1.1)}
            cy={0.9 + row * 1.35}
            r="0.35"
            fill="#FFFFFF"
          />
        ))
      )}
    </svg>
  );
}

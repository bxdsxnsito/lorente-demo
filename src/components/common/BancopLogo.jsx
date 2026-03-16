import React from 'react';

/**
 * Logo Bancop: 3 sectores de pie chart (naranja, azul, verde)
 * Exactamente igual al logo original - círculo dividido en 3 partes iguales de 120° cada una
 */
export default function BancopLogo({ size = 32, className = '' }) {
  // Radio del círculo
  const cx = 50;
  const cy = 50;
  const r = 46;

  // Ángulos de inicio para cada sector (120° cada uno)
  // Sector naranja: 270° → 30° (arriba-izquierda)
  // Sector azul: 30° → 150° (arriba-derecha)
  // Sector verde: 150° → 270° (abajo)

  const toRad = (deg) => (deg * Math.PI) / 180;

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const angle = toRad(angleDeg);
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const sectorPath = (startDeg, endDeg) => {
    const start = polarToCartesian(cx, cy, r, startDeg);
    const end = polarToCartesian(cx, cy, r, endDeg);
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y} Z`;
  };

  // Sector naranja: de -90° a 30° (arriba-izquierda, como en el logo)
  const orangePath = sectorPath(-90, 30);
  // Sector azul: de 30° a 150° (derecha)
  const bluePath = sectorPath(30, 150);
  // Sector verde: de 150° a 270° (abajo-izquierda)
  const greenPath = sectorPath(150, 270);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Fondo circular blanco */}
      <circle cx={cx} cy={cy} r={r + 2} fill="white" />

      {/* Sector naranja - arriba izquierda */}
      <path d={orangePath} fill="#F57C00" />

      {/* Sector azul - derecha */}
      <path d={bluePath} fill="#1565C0" />

      {/* Sector verde - abajo izquierda */}
      <path d={greenPath} fill="#4CAF50" />

      {/* Líneas divisorias blancas para separar sectores */}
      <line x1={cx} y1={cy} x2={polarToCartesian(cx, cy, r, -90).x} y2={polarToCartesian(cx, cy, r, -90).y} stroke="white" strokeWidth="3" />
      <line x1={cx} y1={cy} x2={polarToCartesian(cx, cy, r, 30).x} y2={polarToCartesian(cx, cy, r, 30).y} stroke="white" strokeWidth="3" />
      <line x1={cx} y1={cy} x2={polarToCartesian(cx, cy, r, 150).x} y2={polarToCartesian(cx, cy, r, 150).y} stroke="white" strokeWidth="3" />

      {/* Borde circular exterior blanco */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth="3" />
    </svg>
  );
}
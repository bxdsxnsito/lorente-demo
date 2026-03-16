import React from 'react';

/**
 * Logo Bancop: pie chart de 3 segmentos
 * - Naranja (#F4811F): sector superior-izquierdo (~120°)
 * - Azul (#1E6FBF): sector superior-derecho (~120°)
 * - Verde (#5DB94F): sector inferior (~120°)
 * Centro del círculo en (50,50), radio 46
 */
export default function BancopLogo({ size = 32, className = '' }) {
  const cx = 50;
  const cy = 50;
  const r = 46;
  const gap = 2.5; // grados de separación entre sectores

  // Función para convertir grados a coordenadas en el círculo
  const toXY = (angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  // Genera un path de sector con pequeño gap
  const sector = (startDeg, endDeg) => {
    const s = toXY(startDeg + gap);
    const e = toXY(endDeg - gap);
    // punto interior ligeramente alejado del centro para el gap
    const si = {
      x: cx + 4 * Math.cos(((startDeg + gap - 90) * Math.PI) / 180),
      y: cy + 4 * Math.sin(((startDeg + gap - 90) * Math.PI) / 180),
    };
    const ei = {
      x: cx + 4 * Math.cos(((endDeg - gap - 90) * Math.PI) / 180),
      y: cy + 4 * Math.sin(((endDeg - gap - 90) * Math.PI) / 180),
    };
    return `M ${si.x} ${si.y} L ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y} L ${ei.x} ${ei.y} Z`;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Naranja - sector superior izquierdo: 210° a 330° (aprox) */}
      <path d={sector(210, 330)} fill="#F4811F" />
      {/* Azul - sector superior derecho: 330° a 90° */}
      <path d={sector(330, 450)} fill="#1E6FBF" />
      {/* Verde - sector inferior: 90° a 210° */}
      <path d={sector(90, 210)} fill="#5DB94F" />
    </svg>
  );
}
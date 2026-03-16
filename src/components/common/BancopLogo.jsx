import React from 'react';

/**
 * Logo Bancop - tres pétalos en pinwheel centrados perfectamente
 */
export default function BancopLogo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Pétalo naranja - parte superior */}
      <ellipse
        cx="50" cy="30"
        rx="14" ry="26"
        fill="#F57C00"
        transform="rotate(-30 50 50)"
      />
      {/* Pétalo azul - parte inferior derecha */}
      <ellipse
        cx="50" cy="30"
        rx="14" ry="26"
        fill="#1565C0"
        transform="rotate(90 50 50)"
      />
      {/* Pétalo verde - parte inferior izquierda */}
      <ellipse
        cx="50" cy="30"
        rx="14" ry="26"
        fill="#4CAF50"
        transform="rotate(210 50 50)"
      />
      {/* Círculo central blanco */}
      <circle cx="50" cy="50" r="9" fill="white" />
    </svg>
  );
}
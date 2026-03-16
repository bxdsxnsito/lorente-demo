import React from 'react';

/**
 * Logo Bancop: 3 pétalos/hojas curvos en pinwheel (naranja, azul, verde)
 * Cada pétalo es una forma orgánica curva tipo "hoja", rotados 120° entre sí
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
      {/* Pétalo naranja - arriba izquierda, apunta hacia arriba-derecha */}
      <path
        d="M50 50
           C 50 50, 28 44, 22 28
           C 18 16, 26 6, 38 8
           C 52 10, 58 26, 56 36
           C 54 44, 50 50, 50 50 Z"
        fill="#F5891A"
      />

      {/* Pétalo azul - derecha, apunta hacia abajo-derecha */}
      <path
        d="M50 50
           C 50 50, 68 38, 82 44
           C 92 48, 94 60, 86 68
           C 76 78, 60 72, 56 62
           C 52 54, 50 50, 50 50 Z"
        fill="#1A6BBF"
      />

      {/* Pétalo verde - abajo izquierda, apunta hacia abajo-izquierda */}
      <path
        d="M50 50
           C 50 50, 40 68, 26 72
           C 14 76, 4 66, 8 54
           C 12 40, 28 36, 38 40
           C 46 44, 50 50, 50 50 Z"
        fill="#4CAF50"
      />

      {/* Punto central blanco para unir pétalos */}
      <circle cx="50" cy="50" r="5" fill="white" />
    </svg>
  );
}
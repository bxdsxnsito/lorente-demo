import React from 'react';

/**
 * Logo de Bancop: tres pétalos en pinwheel (naranja, azul, verde)
 * Igual al logo original con hojas/pétalos superpuestos
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
      {/* Pétalo naranja - arriba izquierda */}
      <path
        d="M50 50 C30 35 15 20 20 5 C25 -5 45 0 55 15 C65 30 60 45 50 50Z"
        fill="#F57C00"
        opacity="0.95"
      />
      {/* Pétalo azul - arriba derecha */}
      <path
        d="M50 50 C65 30 80 20 90 30 C100 42 88 60 72 62 C55 64 48 58 50 50Z"
        fill="#1565C0"
        opacity="0.95"
      />
      {/* Pétalo verde - abajo */}
      <path
        d="M50 50 C55 70 52 90 40 95 C28 100 15 88 20 73 C25 58 38 52 50 50Z"
        fill="#4CAF50"
        opacity="0.95"
      />
      {/* Centro blanco para unificar */}
      <circle cx="50" cy="50" r="8" fill="white" opacity="0.6" />
    </svg>
  );
}
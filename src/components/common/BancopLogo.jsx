import React from 'react';

/**
 * Logo Bancop: hoja estilizada con una planta brotando desde la base.
 * Inspirado en el logo original "Crece desde la raíz".
 * SVG perfectamente centrado en su viewBox.
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
      {/* Fondo redondeado verde-teal */}
      <rect width="100" height="100" rx="22" fill="#0BA37F" />

      {/* Hoja izquierda */}
      <path
        d="M50 72 C50 72 20 65 18 42 C16 22 38 18 50 35 C50 35 50 72 50 72Z"
        fill="white"
        opacity="0.95"
      />

      {/* Hoja derecha */}
      <path
        d="M50 72 C50 72 80 65 82 42 C84 22 62 18 50 35 C50 35 50 72 50 72Z"
        fill="white"
        opacity="0.75"
      />

      {/* Tallo central */}
      <line
        x1="50" y1="72"
        x2="50" y2="85"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Raíz izquierda */}
      <path
        d="M50 85 Q38 85 32 90"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />

      {/* Raíz derecha */}
      <path
        d="M50 85 Q62 85 68 90"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
    </svg>
  );
}
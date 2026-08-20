// src/components/Mascota.jsx
//
// Para usar la mascota oficial, deja el archivo en:
//     public/mascota-preventiva.png
// (fondo transparente, cuadrada, idealmente 512x512)
//
// Se toma sola. Mientras no exista, se dibuja el personaje de abajo,
// hecho con los colores del logo.
import { useState } from "react";

const RUTA = "/mascota-preventiva.png";

export default function Mascota({ className = "w-12 h-12" }) {
  const [falla, setFalla] = useState(false);

  if (!falla) {
    return (
      <img
        src={RUTA}
        alt=""
        className={`${className} object-contain`}
        onError={() => setFalla(true)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Tu guía"
    >
      {/* orejas */}
      <path d="M14 20 L18 8 L28 15 Z" fill="#00489C" />
      <path d="M50 20 L46 8 L36 15 Z" fill="#00489C" />
      <path d="M17 18 L19 12 L25 16 Z" fill="#009CB4" />
      <path d="M47 18 L45 12 L39 16 Z" fill="#009CB4" />

      {/* cabeza */}
      <circle cx="32" cy="28" r="16" fill="#00489C" />
      <ellipse cx="32" cy="32" rx="11" ry="9" fill="#fff" opacity="0.95" />

      {/* ojos */}
      <circle cx="26" cy="25" r="2.6" fill="#0B1420" />
      <circle cx="38" cy="25" r="2.6" fill="#0B1420" />
      <circle cx="27" cy="24" r="0.9" fill="#fff" />
      <circle cx="39" cy="24" r="0.9" fill="#fff" />

      {/* nariz y sonrisa */}
      <path d="M30.5 30 h3 l-1.5 2 Z" fill="#F0840C" />
      <path
        d="M28 33 q4 3.5 8 0"
        stroke="#0B1420"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />

      {/* cuerpo con bata */}
      <path d="M18 62 q0-14 14-14 t14 14 Z" fill="#fff" stroke="#DDE1E8" />
      <path d="M32 48 v14" stroke="#DDE1E8" strokeWidth="1" />

      {/* escudo con visto: el motivo del logo */}
      <path
        d="M32 50 l7 2.4 v4.6 q0 4.4-7 6.6 q-7-2.2-7-6.6 v-4.6 Z"
        fill="#009CB4"
      />
      <path
        d="M28.8 56.6 l2.2 2.2 l4.4-4.6"
        stroke="#fff"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

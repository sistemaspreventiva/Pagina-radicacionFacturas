// src/components/Mascota.jsx
//
// Previ, la mascota de Preventiva Salud IPS.
//
// Se usa el recorte de medio cuerpo (cabeza, puño levantado, bata y
// carné). El cuerpo entero se descartó por dos razones: a 60px no se
// lee, y al ser tan vertical chocaba con la zona resaltada y obligaba a
// Previ a replegarse dentro del globo casi siempre.
//
// Si el archivo no existe se dibuja el personaje SVG de reemplazo, así
// el componente nunca se ve roto.
import { useState } from "react";

const PREVI = "/previ-busto.png";

const NAVY = "#002460";
const AZUL = "#00489C";
const TEAL = "#009CB4";
const NARANJA = "#F0840C";
const CREMA = "#FDF6EC";
const SOMBRA = "#E8DFD0";

export default function Mascota({ className = "w-12 h-12", animada = true, style }) {
  const [falla, setFalla] = useState(false);

  if (!falla) {
    return (
      <img
        src={PREVI}
        alt=""
        className={`${className} object-contain`}
        style={style}
        onError={() => setFalla(true)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} ${animada ? "mascota" : ""}`}
      style={style}
      role="img"
      aria-label="Previ, tu guía"
    >
      <defs>
        <clipPath id="m-escudo">
          <path d="M50 70 l11 3.6 v7.2 q0 7.4-11 10.6 q-11-3.2-11-10.6 v-7.2 Z" />
        </clipPath>
        <linearGradient id="m-bata" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#EEF2F7" />
        </linearGradient>
      </defs>

      <g className="m-cuerpo">
        {/* ── Cola: a la izquierda y por detrás del cuerpo ─────── */}
        <g className="m-cola">
          <path
            d="M34 88 q-14 3-16-8 q-2-9 6-10"
            fill="none"
            stroke={NARANJA}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M20 71 q-3 1-3 5"
            fill="none"
            stroke={NAVY}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </g>

        {/* ── Bata ─────────────────────────────────────────────── */}
        <path
          d="M50 64 q-16 1-19 12 l-4 20 h46 l-4-20 q-3-11-19-12 Z"
          fill="url(#m-bata)"
          stroke={SOMBRA}
          strokeWidth="1"
        />
        {/* solapas de la bata */}
        <path d="M41 66 L50 80 L59 66" fill="none" stroke={SOMBRA} strokeWidth="1.8" />
        {/* cuello turquesa */}
        <path d="M39 65 q11 8 22 0 l-3.5-4.5 q-7.5 4.5-15 0 Z" fill={TEAL} />

        {/* ── Brazo izquierdo, en reposo ───────────────────────── */}
        <path
          d="M32 78 q-4 7-3 14"
          fill="none"
          stroke={NARANJA}
          strokeWidth="7.5"
          strokeLinecap="round"
        />
        <circle cx="29" cy="93" r="4.6" fill={NARANJA} />

        {/* ── Brazo derecho, saludando ─────────────────────────── */}
        <g className="m-brazo">
          <path
            d="M68 78 q9-4 12-14"
            fill="none"
            stroke={NARANJA}
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          <g>
            <circle cx="81" cy="61" r="6" fill={NARANJA} />
            <circle cx="78.5" cy="56.5" r="1.9" fill="#FFC98A" />
            <circle cx="82.5" cy="55.8" r="1.9" fill="#FFC98A" />
            <circle cx="85.5" cy="58.5" r="1.8" fill="#FFC98A" />
            <ellipse cx="81" cy="62.5" rx="3" ry="2.4" fill="#FFC98A" />
          </g>
        </g>

        {/* ── Escudo sobre el pecho ────────────────────────────── */}
        <path
          d="M50 70 l11 3.6 v7.2 q0 7.4-11 10.6 q-11-3.2-11-10.6 v-7.2 Z"
          fill={TEAL}
        />
        <path
          d="M45 81.5 l3.6 3.6 l7-7.4"
          fill="none"
          stroke="#fff"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* destello que recorre el escudo */}
        <g clipPath="url(#m-escudo)">
          <rect
            className="m-brillo"
            x="34"
            y="66"
            width="7"
            height="32"
            fill="#fff"
            transform="skewX(-18)"
          />
        </g>

        {/* ── Orejas ───────────────────────────────────────────── */}
        <g className="m-oreja-i">
          <path d="M24 30 q-4-14 6-16 q5 5 6 13 Z" fill={NARANJA} />
          <path d="M27 27 q-2-8 3-9 q2 3 3 8 Z" fill="#FFC98A" />
        </g>
        <g className="m-oreja-d">
          <path d="M76 30 q4-14-6-16 q-5 5-6 13 Z" fill={NARANJA} />
          <path d="M73 27 q2-8-3-9 q-2 3-3 8 Z" fill="#FFC98A" />
        </g>

        {/* ── Cabeza ───────────────────────────────────────────── */}
        <ellipse cx="50" cy="40" rx="27" ry="24" fill={NARANJA} />
        {/* rayas */}
        <path d="M32 26 q4 4 5 9" stroke={NAVY} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M25 36 q5 2 7 5" stroke={NAVY} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M68 26 q-4 4-5 9" stroke={NAVY} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M75 36 q-5 2-7 5" stroke={NAVY} strokeWidth="2.6" fill="none" strokeLinecap="round" />

        {/* hocico */}
        <ellipse cx="50" cy="47" rx="18" ry="14" fill={CREMA} />

        {/* ── Ojos ─────────────────────────────────────────────── */}
        <g>
          <ellipse cx="40" cy="37" rx="5.4" ry="6" fill="#fff" />
          <ellipse cx="60" cy="37" rx="5.4" ry="6" fill="#fff" />
          <circle cx="40.6" cy="37.6" r="3.5" fill={NAVY} />
          <circle cx="60.6" cy="37.6" r="3.5" fill={NAVY} />
          <circle cx="42" cy="36" r="1.4" fill="#fff" />
          <circle cx="62" cy="36" r="1.4" fill="#fff" />
          {/* parpados: normalmente aplastados, bajan al parpadear */}
          <g className="m-parpados">
            <ellipse cx="40" cy="37" rx="5.6" ry="6.2" fill={NARANJA} />
            <ellipse cx="60" cy="37" rx="5.6" ry="6.2" fill={NARANJA} />
          </g>
        </g>

        {/* cejas: le dan expresion amable */}
        <path d="M35 29 q5-2.5 9-0.5" stroke={NAVY} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M65 29 q-5-2.5-9-0.5" stroke={NAVY} strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* nariz y boca */}
        <path d="M46.5 44 h7 q0 4-3.5 5.5 Q46.5 48 46.5 44 Z" fill={AZUL} />
        <path
          d="M50 50 v2.5 M50 52.5 q-4.5 4-8.5 0 M50 52.5 q4.5 4 8.5 0"
          stroke={NAVY}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />

        {/* bigotes */}
        <path d="M32 46 h-8 M32 50 h-7" stroke={SOMBRA} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M68 46 h8 M68 50 h7" stroke={SOMBRA} strokeWidth="1.4" strokeLinecap="round" />

        {/* mejillas */}
        <ellipse cx="33" cy="47" rx="4" ry="2.6" fill={NARANJA} opacity="0.35" />
        <ellipse cx="67" cy="47" rx="4" ry="2.6" fill={NARANJA} opacity="0.35" />
      </g>
    </svg>
  );
}

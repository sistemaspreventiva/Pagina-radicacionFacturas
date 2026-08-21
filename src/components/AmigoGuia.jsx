// src/components/AmigoGuia.jsx
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { recorridoDe } from "../lib/guia.js";
import Mascota from "./Mascota.jsx";

const MARGEN = 8; // aire alrededor del elemento resaltado
const ANCHO_GLOBO = 340;

const clave = (ruta) => `guia-vista:${ruta}`;

export default function AmigoGuia() {
  const { pathname } = useLocation();
  const recorrido = recorridoDe(pathname);

  const [abierta, setAbierta] = useState(false);
  const [i, setI] = useState(0);
  const [caja, setCaja] = useState(null); // recuadro del objetivo
  const [saluda, setSaluda] = useState(false);
  const globoRef = useRef(null);

  // Pasos cuyo objetivo existe realmente en esta pantalla
  const pasos = (recorrido?.pasos || []).filter(
    (p) => !p.objetivo || document.querySelector(`[data-guia="${p.objetivo}"]`)
  );
  const paso = pasos[i];

  // Al cambiar de página: cerrar y ofrecer la guía si nunca se vio
  useEffect(() => {
    setAbierta(false);
    setI(0);
    if (!recorrido) return;
    const vista = localStorage.getItem(clave(pathname));
    setSaluda(!vista);
  }, [pathname, recorrido]);

  const cerrar = useCallback(() => {
    setAbierta(false);
    setI(0);
    setCaja(null);
    try {
      localStorage.setItem(clave(pathname), "1");
    } catch {
      /* modo privado: no pasa nada */
    }
    setSaluda(false);
  }, [pathname]);

  const abrir = () => {
    setI(0);
    setAbierta(true);
    setSaluda(false);
  };

  // Posicionar el foco sobre el objetivo del paso actual
  const medir = useCallback(() => {
    if (!abierta || !paso) return;
    if (!paso.objetivo) return setCaja(null);
    const el = document.querySelector(`[data-guia="${paso.objetivo}"]`);
    if (!el) return setCaja(null);
    const r = el.getBoundingClientRect();
    setCaja({
      top: r.top - MARGEN,
      left: r.left - MARGEN,
      width: r.width + MARGEN * 2,
      height: r.height + MARGEN * 2,
    });
  }, [abierta, paso]);

  useLayoutEffect(() => {
    if (!abierta || !paso) return;
    if (paso.objetivo) {
      const el = document.querySelector(`[data-guia="${paso.objetivo}"]`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    // tras el desplazamiento suave, volver a medir
    const t = setTimeout(medir, 320);
    medir();
    return () => clearTimeout(t);
  }, [abierta, paso, medir]);

  useEffect(() => {
    if (!abierta) return;
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [abierta, medir]);

  // Teclado: Esc sale, flechas navegan
  useEffect(() => {
    if (!abierta) return;
    const onKey = (e) => {
      if (e.key === "Escape") cerrar();
      if (e.key === "ArrowRight") setI((v) => Math.min(v + 1, pasos.length - 1));
      if (e.key === "ArrowLeft") setI((v) => Math.max(v - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierta, cerrar, pasos.length]);

  useEffect(() => {
    if (abierta) globoRef.current?.focus();
  }, [abierta, i]);

  if (!recorrido) return null;

  const ultimo = i >= pasos.length - 1;

  return (
    <>
      {/* ── Botón flotante ─────────────────────────────────────── */}
      {!abierta && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-3">
          {saluda && (
            <p className="hidden sm:block bg-ps-navy text-white text-sm px-3 py-2 shadow-lg">
              ¿Te muestro cómo funciona?
            </p>
          )}
          <button
            onClick={abrir}
            className={`relative isolate grid place-items-center w-16 h-16 rounded-full bg-white border-2 border-ps-blue shadow-lg hover:scale-105 transition-transform ${
              saluda ? "halo-guia" : ""
            }`}
            aria-label="Abrir la guía"
            title="¿Necesitas ayuda?"
          >
            <Mascota className="w-12 h-12" />
            <span className="absolute -top-1 -right-1 grid place-items-center w-6 h-6 rounded-full bg-ps-accent text-white text-xs font-bold">
              ?
            </span>
          </button>
        </div>
      )}

      {/* ── Recorrido ──────────────────────────────────────────── */}
      {abierta && paso && (
        <div
          className="fixed inset-0 z-[80]"
          role="dialog"
          aria-modal="true"
          aria-label={recorrido.titulo}
        >
          {/* Velo con hueco sobre el objetivo */}
          {caja ? (
            <div
              className="absolute pointer-events-none transition-all duration-200"
              style={{
                top: caja.top,
                left: caja.left,
                width: caja.width,
                height: caja.height,
                boxShadow: "0 0 0 9999px rgba(0, 12, 32, 0.55)",
                outline: "2px solid var(--color-ps-accent)",
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-[rgba(0,12,32,0.55)]" />
          )}

          {/* Capa para cerrar tocando fuera */}
          <button
            className="absolute inset-0 w-full h-full cursor-default"
            onClick={cerrar}
            tabIndex={-1}
            aria-label="Cerrar la guía"
          />

          <Globo
            ref={globoRef}
            caja={caja}
            paso={paso}
            indice={i}
            total={pasos.length}
            ultimo={ultimo}
            onAtras={() => setI((v) => Math.max(v - 1, 0))}
            onSiguiente={() =>
              ultimo ? cerrar() : setI((v) => Math.min(v + 1, pasos.length - 1))
            }
            onCerrar={cerrar}
          />
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Globo de diálogo.

   Se mide a sí mismo y luego busca dónde cabe entero: debajo, encima,
   a la derecha o a la izquierda del elemento resaltado. Si nada cabe,
   se queda donde menos estorbe, pero SIEMPRE recortado al viewport:
   antes, con un elemento alto, el globo se iba fuera de la pantalla y
   solo se veían los botones.
   ══════════════════════════════════════════════════════════════════ */
const M = 12;   // margen contra el borde de la pantalla
const AIRE = 16; // separación respecto al elemento resaltado

const acotar = (v, min, max) => Math.max(min, Math.min(v, max));

function ubicar(caja, ancho, alto) {
  const VW = window.innerWidth;
  const VH = window.innerHeight;

  if (VW < 640) return { left: M, right: M, bottom: M };

  if (!caja) {
    return {
      left: acotar(VW / 2 - ancho / 2, M, VW - ancho - M),
      top: acotar(VH / 2 - alto / 2, M, VH - alto - M),
      width: ancho,
    };
  }

  const centroX = caja.left + caja.width / 2 - ancho / 2;
  const centroY = caja.top + caja.height / 2 - alto / 2;

  const opciones = [
    // debajo
    {
      top: caja.top + caja.height + AIRE,
      left: centroX,
      cabe: caja.top + caja.height + AIRE + alto + M <= VH,
    },
    // encima
    {
      top: caja.top - AIRE - alto,
      left: centroX,
      cabe: caja.top - AIRE - alto >= M,
    },
    // a la derecha
    {
      top: centroY,
      left: caja.left + caja.width + AIRE,
      cabe: caja.left + caja.width + AIRE + ancho + M <= VW,
    },
    // a la izquierda
    {
      top: centroY,
      left: caja.left - AIRE - ancho,
      cabe: caja.left - AIRE - ancho >= M,
    },
  ];

  const elegida = opciones.find((o) => o.cabe) || opciones[0];

  return {
    top: acotar(elegida.top, M, Math.max(M, VH - alto - M)),
    left: acotar(elegida.left, M, Math.max(M, VW - ancho - M)),
    width: ancho,
  };
}

/* ══════════════════════════════════════════════════════════════════
   Globo de diálogo. En móvil se ancla abajo; en escritorio se coloca
   junto al elemento resaltado, arriba o abajo según haya espacio.
   ══════════════════════════════════════════════════════════════════ */
function Globo({
  caja,
  paso,
  indice,
  total,
  ultimo,
  onAtras,
  onSiguiente,
  onCerrar,
  ref,
}) {
  const propio = useRef(null);
  const [dim, setDim] = useState(null);

  // Medir el globo ya renderizado para poder ubicarlo con su alto real
  useLayoutEffect(() => {
    const el = propio.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setDim({ ancho: r.width, alto: r.height });
  }, [paso, caja]);

  const ancho = Math.min(ANCHO_GLOBO, window.innerWidth - M * 2);
  const estilo = dim
    ? ubicar(caja, ancho, dim.alto)
    : { left: -9999, top: 0, width: ancho }; // primer render: fuera de vista

  return (
    <div
      ref={(n) => {
        propio.current = n;
        if (typeof ref === "function") ref(n);
        else if (ref) ref.current = n;
      }}
      tabIndex={-1}
      className={`absolute bg-white shadow-2xl border-t-4 border-ps-accent outline-none transition-opacity ${
        dim ? "opacity-100" : "opacity-0"
      }`}
      style={estilo}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <Mascota className="w-11 h-11 shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="text-section font-semibold text-ps-navy">
              {paso.titulo}
            </h3>
            <p className="mt-2 text-sm text-ps-muted leading-relaxed">
              {paso.texto}
            </p>
          </div>
        </div>

        {/* Progreso */}
        <div className="mt-5 flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: total }, (_, n) => (
            <span
              key={n}
              className={`h-1 flex-1 transition-colors ${
                n <= indice ? "bg-ps-accent" : "bg-ps-line"
              }`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={onCerrar}
            className="text-xs text-ps-muted hover:text-ps-ink transition-colors"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-ps-muted tabular-nums">
              {indice + 1}/{total}
            </span>
            {indice > 0 && (
              <button onClick={onAtras} className="btn-ghost !py-1.5 !px-3 !text-xs">
                Atrás
              </button>
            )}
            <button onClick={onSiguiente} className="btn-primary !py-1.5 !px-4 !text-xs">
              {ultimo ? "Entendido" : "Siguiente"}
              {!ultimo && <span aria-hidden="true">→</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

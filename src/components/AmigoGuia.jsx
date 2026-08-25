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
              Soy Previ, ¿te muestro cómo funciona?
            </p>
          )}
          <button
            onClick={abrir}
            className={`relative isolate grid place-items-center w-16 h-16 rounded-full bg-white border-2 border-ps-blue shadow-lg hover:scale-105 transition-transform ${
              saluda ? "halo-guia" : ""
            }`}
            aria-label="Abrir la guía de Previ"
            title="Previ · ¿necesitas ayuda?"
          >
            <Mascota className="w-16 h-16" busto />
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
            aria-label="Cerrar la guía de Previ"
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
// Previ sobresale por los lados, no por arriba ni por abajo, asi que el
// margen horizontal es grande y el vertical no. De pie mide 112px de
// ancho y se desplaza un 108%: 121px fuera del globo, mas la patita.
const M_H = 168;
// Previ de pie mide mas que el globo y se empuja un 20% hacia afuera,
// asi que sobresale unos 50px por arriba o por abajo. Sin este margen
// se salia de pantalla en monitores bajos (1366x650).
const M_V = 60;
const AIRE = 16; // separación respecto al elemento resaltado

const acotar = (v, min, max) => Math.max(min, Math.min(v, max));

const ANCHO_MASCOTA = 150; // 112px de figura + la patita + aire

/**
 * ¿Queda sitio para plantar a Previ sin que se monte sobre el elemento?
 *
 * Ojo: no basta con mirar los bordes de la pantalla. Previ se coloca
 * junto al GLOBO, y cuando el globo va arriba o abajo queda centrado
 * sobre el elemento; si el elemento es ancho (una rejilla de tarjetas),
 * Previ aterriza dentro de él por muy grande que sea la pantalla.
 */
function hayHueco(caja, lado) {
  if (lado === "derecha" || lado === "izquierda") {
    // el globo va al lado del elemento, así que Previ queda por fuera
    return true;
  }
  // el globo va centrado sobre el elemento: Previ tiene que sobresalir
  const alcance = ANCHO_GLOBO / 2 + ANCHO_MASCOTA;
  return alcance > caja.width / 2;
}

function ubicar(caja, ancho, alto) {
  // devuelve { estilo, lado }: 'lado' dice donde quedo el globo respecto
  // al elemento, y con eso se coloca la mascota mirando hacia el.
  const VW = window.innerWidth;
  const VH = window.innerHeight;

  if (VW < 640) return { estilo: { left: M_V, right: M_V, bottom: M_V }, lado: "arriba" };

  if (!caja) {
    return {
      estilo: {
        left: acotar(VW / 2 - ancho / 2, M_H, VW - ancho - M_H),
        top: acotar(VH / 2 - alto / 2, M_V, VH - alto - M_V),
        width: ancho,
      },
      lado: null,
    };
  }

  const centroX = caja.left + caja.width / 2 - ancho / 2;
  const centroY = caja.top + caja.height / 2 - alto / 2;

  const opciones = [
    // debajo
    {
      lado: "abajo",
      top: caja.top + caja.height + AIRE,
      left: centroX,
      cabe: caja.top + caja.height + AIRE + alto + M_V <= VH,
    },
    // encima
    {
      lado: "arriba",
      top: caja.top - AIRE - alto,
      left: centroX,
      cabe: caja.top - AIRE - alto >= M_V,
    },
    // a la derecha
    {
      lado: "derecha",
      top: centroY,
      left: caja.left + caja.width + AIRE,
      cabe: caja.left + caja.width + AIRE + ancho + M_H <= VW,
    },
    // a la izquierda
    {
      lado: "izquierda",
      top: centroY,
      left: caja.left - AIRE - ancho,
      cabe: caja.left - AIRE - ancho >= M_H,
    },
  ];

  const elegida = opciones.find((o) => o.cabe) || opciones[0];

  return {
    estilo: {
      top: acotar(elegida.top, M_V, Math.max(M_V, VH - alto - M_V)),
      left: acotar(elegida.left, M_H, Math.max(M_V, VW - ancho - M_H)),
      width: ancho,
    },
    lado: elegida.lado,
  };
}

/* La mascota se planta FUERA del globo, del lado contrario al elemento
   resaltado, para no taparlo ni estorbar los botones.

   No se le dibuja ninguna patita postiza: la figura YA tiene una patita
   levantada. Se voltea y se inclina para que ese brazo apunte hacia lo
   que hay que mirar, y del brazo sale un rastro de puntitos que remata
   el gesto. Así siempre concuerda con el cuerpo. */
/* Inclinación de la figura según hacia dónde queda el elemento. */
const COLOCACION = {
  abajo: { giro: -6 },
  arriba: { giro: -6 },
  derecha: { giro: -14 },
  izquierda: { giro: -14 },
};

function Senalador({ lado, caja, onNoCabe }) {
  const c = COLOCACION[lado];
  const ref = useRef(null);
  const [alterno, setAlterno] = useState(false);

  useLayoutEffect(() => {
    setAlterno(false);
  }, [lado]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !caja) return;
    const b = el.getBoundingClientRect();
    // Se exige un solape real: un roce de pocos pixeles no molesta y
    // antes bastaba para hacerla replegarse.
    const ROCE = 14;
    const choca =
      b.right - ROCE > caja.left && b.left + ROCE < caja.left + caja.width &&
      b.bottom - ROCE > caja.top && b.top + ROCE < caja.top + caja.height;
    if (!choca) return;
    // primero el otro lado; si tampoco cabe, se repliega dentro del globo
    if (!alterno) setAlterno(true);
    else onNoCabe?.();
  }, [caja, alterno, lado, onNoCabe]);

  if (!c) return null;

  const aLaIzquierda = lado === "derecha" ? alterno : !alterno;

  // Regla única y siempre coherente: Previ se planta a un lado del globo
  // y se voltea para MIRAR hacia él, con su puño levantado del lado del
  // elemento que se está explicando.
  // Previ de pie es alto (unas 2,2 veces su ancho). Centrarlo sobre el
  // globo le metia la cabeza en la zona resaltada cuando esta queda justo
  // encima, y acababa replegandose. Se ancla al borde del globo que se
  // ALEJA del elemento: si el elemento esta arriba, Previ se apoya en el
  // borde de abajo y crece hacia abajo.
  // Ademas del anclaje hace falta empujarla hacia afuera: Previ es mas
  // alto que el globo, asi que apoyado en el borde de abajo todavia le
  // sobresale la cabeza por arriba, justo donde esta el elemento.
  const anclaje =
    lado === "abajo"
      ? { bottom: 0, desplazaY: "20%" }
      : lado === "arriba"
      ? { top: 0, desplazaY: "-20%" }
      : { top: "50%", desplazaY: "-50%" };

  const { desplazaY, ...bordeY } = anclaje;
  const posicion = aLaIzquierda
    ? { left: 0, ...bordeY, "--pos": `translate(-108%, ${desplazaY}) rotate(${c.giro}deg)` }
    : { right: 0, ...bordeY, "--pos": `translate(108%, ${desplazaY}) rotate(${-c.giro}deg)` };

  return (
    <div
      ref={ref}
      className="guia-mascota w-24 sm:w-28"
      style={posicion}
    >
      {/* halo: la mascota es casi blanca y sin esto se deslavaba */}
      <div
        aria-hidden="true"
        className="absolute inset-x-[-15%] inset-y-[8%] rounded-[50%] blur-xl"
        style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0))" }}
      />
      <Mascota
        className="relative w-full h-auto drop-shadow-2xl"
        style={aLaIzquierda ? { transform: "scaleX(-1)" } : undefined}
      />

    </div>
  );
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
  // Solo depende del paso: 'caja' cambia en cada scroll y reiniciaría
  // la decisión continuamente.
  useLayoutEffect(() => setSinSitio(false), [paso]);

  useLayoutEffect(() => {
    const el = propio.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setDim({ ancho: r.width, alto: r.height });
  }, [paso, caja]);

  const movil = window.innerWidth < 640;
  const [sinSitio, setSinSitio] = useState(false);
  const ancho = Math.min(ANCHO_GLOBO, window.innerWidth - M_H * 2);
  const ubicacion = dim ? ubicar(caja, ancho, dim.alto) : null;
  const estilo = ubicacion?.estilo ?? { left: -9999, top: 0, width: ancho };

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
      {/* Si el elemento resaltado ocupa casi todo el ancho no queda hueco
          libre a ningún lado, así que la mascota va dentro del globo. */}
      {dim && caja && !movil && !sinSitio && hayHueco(caja, ubicacion.lado) && (
        <Senalador
          lado={ubicacion.lado}
          caja={caja}
          onNoCabe={() => setSinSitio(true)}
        />
      )}

      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* En móvil la mascota va aquí dentro: fuera taparía el campo */}
          {(movil || sinSitio || !caja || !hayHueco(caja, ubicacion?.lado)) && (
            <Mascota className="w-14 h-14 shrink-0 -mt-1" busto />
          )}
          <div className="min-w-0">
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

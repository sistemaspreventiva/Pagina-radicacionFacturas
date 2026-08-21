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
            <Mascota className="w-16 h-16" />
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
// La mascota sobresale por los lados, no por arriba ni por abajo,
// asi que el margen horizontal es grande y el vertical no.
// La mascota mide 160px y se desplaza un 108%, o sea 173px fuera del
// globo: el margen horizontal tiene que superar esa cifra.
const M_H = 192;
const M_V = 12;
const AIRE = 16; // separación respecto al elemento resaltado

const acotar = (v, min, max) => Math.max(min, Math.min(v, max));

/** ¿Queda sitio libre a algún lado del elemento para plantar la mascota? */
function hayHueco(caja) {
  const ANCHO_MASCOTA = 176; // 160px + aire
  return (
    caja.left >= ANCHO_MASCOTA ||
    window.innerWidth - (caja.left + caja.width) >= ANCHO_MASCOTA
  );
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
const COLOCACION = {
  // globo debajo -> el elemento queda ARRIBA
  abajo: { espejo: false, giro: -6, rastro: "arriba" },
  // globo encima -> el elemento queda ABAJO
  arriba: { espejo: false, giro: -6, rastro: "abajo" },
  // globo a la derecha -> el elemento queda a la IZQUIERDA
  derecha: { espejo: false, giro: -14, rastro: "izquierda" },
  // globo a la izquierda -> el elemento queda a la DERECHA
  izquierda: { espejo: true, giro: -14, rastro: "derecha" },
};

// Dónde nace el rastro (junto a la patita levantada) y hacia dónde va
const RASTRO = {
  arriba: { left: "50%", top: -6, dir: "translateY(-16px)", fila: "column-reverse" },
  abajo: { left: "50%", bottom: -6, dir: "translateY(16px)", fila: "column" },
  izquierda: { left: -8, top: "34%", dir: "translateX(-16px)", fila: "row-reverse" },
  derecha: { right: -8, top: "34%", dir: "translateX(16px)", fila: "row" },
};

function Senalador({ lado, caja, onNoCabe }) {
  const c = COLOCACION[lado];
  const ref = useRef(null);
  const [alterno, setAlterno] = useState(false);

  // Si la mascota se monta sobre la zona resaltada, se cambia de lado
  useLayoutEffect(() => {
    setAlterno(false);
  }, [lado]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !caja) return;
    const b = el.getBoundingClientRect();
    const choca =
      b.right > caja.left && b.left < caja.left + caja.width &&
      b.bottom > caja.top && b.top < caja.top + caja.height;
    if (!choca) return;
    // primero se prueba el otro lado; si tampoco cabe (elementos que
    // ocupan todo el ancho) se repliega dentro del globo.
    if (!alterno) setAlterno(true);
    else onNoCabe?.();
  }, [caja, alterno, lado, onNoCabe]);

  if (!c) return null;

  // Lado por defecto: el contrario al elemento. Si choca, el otro.
  const posicion = (lado === "derecha" ? alterno : !alterno)
    ? { left: 0, top: "50%", "--pos": `translate(-108%, -50%) rotate(${c.giro}deg)` }
    : { right: 0, top: "50%", "--pos": `translate(108%, -50%) rotate(${-c.giro}deg)` };

  const r = RASTRO[c.rastro];
  const { dir, fila, ...anclaje } = r;

  return (
    <div ref={ref} className="guia-mascota" style={posicion}>
      {/* halo blanco: la mascota es casi blanca y sin esto se deslavaba */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full blur-xl"
        style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0))" }}
      />
      <Mascota
        className="relative w-32 h-32 sm:w-40 sm:h-40 drop-shadow-2xl"
        style={c.espejo ? { transform: "scaleX(-1)" } : undefined}
      />

      {/* rastro que sale de la patita hacia lo señalado */}
      <span
        aria-hidden="true"
        className="absolute flex items-center gap-1.5"
        style={{ ...anclaje, flexDirection: fila }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="guia-punto rounded-full bg-ps-accent"
            style={{
              width: 9 - i * 2,
              height: 9 - i * 2,
              "--ida": dir,
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </span>
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
      {dim && caja && !movil && !sinSitio && hayHueco(caja) && (
        <Senalador
          lado={ubicacion.lado}
          caja={caja}
          onNoCabe={() => setSinSitio(true)}
        />
      )}

      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* En móvil la mascota va aquí dentro: fuera taparía el campo */}
          {(movil || sinSitio || !caja || !hayHueco(caja)) && (
            <Mascota className="w-14 h-14 shrink-0 -mt-1" />
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

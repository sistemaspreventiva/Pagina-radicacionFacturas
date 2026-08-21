# Asistente guiado con mascota

Cómo está construido el recorrido guiado que explica cada pantalla, y qué
hay que tener en cuenta para tocarlo o llevarlo a otro proyecto.

---

## Qué hace

Un botón flotante abre un recorrido paso a paso. Cada paso oscurece la
pantalla, deja iluminada solo la zona de la que habla y muestra un globo
con la explicación. La mascota se planta al lado del globo y estira su
patita hacia la zona resaltada.

- La primera visita a cada pantalla ofrece la guía con un halo que late.
  Una vez vista, no vuelve a insistir (queda en `localStorage` por ruta).
- Se sale con `Escape`, tocando fuera o con «Cerrar». Las flechas navegan.
- Los pasos cuyo objetivo no está en pantalla se omiten solos, así que el
  recorrido no se rompe en móvil.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `src/lib/guia.js` | Los textos de cada paso, por ruta |
| `src/components/AmigoGuia.jsx` | El recorrido: foco, globo, colocación |
| `src/components/Mascota.jsx` | La figura, con reemplazo SVG si falta el PNG |
| `src/index.css` | Las animaciones (bloque `GUÍA — …`) |
| `public/mascota-preventiva.png` | La mascota, 512×512 con transparencia |

Se monta una sola vez, en `src/App.jsx`, dentro del `BrowserRouter`:

```jsx
<BrowserRouter>
  <Header />
  <AppRoutes />
  <Footer />
  <AmigoGuia />
</BrowserRouter>
```

---

## 1. Marcar las zonas en el JSX

Cada paso apunta a un elemento marcado con `data-guia`:

```jsx
<div data-guia="dash-periodo">
  <label htmlFor="periodo">Periodo que radica</label>
  <input id="periodo" type="month" />
</div>
```

## 2. Escribir los pasos

`src/lib/guia.js` es solo datos. Un paso sin `objetivo` sale centrado,
como bienvenida:

```js
export const RECORRIDOS = {
  "/dashboard": {
    titulo: "Radicar paso a paso",
    pasos: [
      {
        objetivo: null,
        titulo: "Te acompaño en el envío",
        texto: "Radicar son cuatro datos: el periodo, el valor, los archivos y enviar.",
      },
      {
        objetivo: "dash-periodo",
        titulo: "El periodo que estás cobrando",
        texto:
          "Ojo con este: es el mes del trabajo que cobras, NO el mes actual.",
      },
    ],
  },
};
```

---

## 3. Las animaciones

Van en `src/index.css`. Son cuatro y todas se desactivan si el sistema
pide menos movimiento.

```css
/* Entra dando un saltito */
@keyframes g-entra {
  0%   { opacity: 0; transform: var(--pos) scale(0.4) translateY(14px); }
  60%  { opacity: 1; transform: var(--pos) scale(1.08) translateY(-4px); }
  100% { opacity: 1; transform: var(--pos) scale(1) translateY(0); }
}

/* Y después flota despacio */
@keyframes g-flota {
  0%, 100% { transform: var(--pos) translateY(0); }
  50%      { transform: var(--pos) translateY(-5px); }
}

.guia-mascota {
  position: absolute;
  pointer-events: none;
  isolation: isolate;
  animation: g-entra 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) both,
             g-flota 3s ease-in-out 0.45s infinite;
}

/* La patita estirada late suavemente hacia lo que señala */
@keyframes g-patita {
  0%, 100% { transform: var(--giro, rotate(0deg)) translateX(0); }
  50%      { transform: var(--giro, rotate(0deg)) translateX(5px); }
}
.guia-patita {
  transform: var(--giro, rotate(0deg));
  transform-origin: 25% 50%;
  animation: g-patita 1.2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .guia-mascota { animation: none; transform: var(--pos); opacity: 1; }
  .guia-patita  { animation: none; }
}
```

### El detalle que cuesta descubrir

Las keyframes usan `transform`, y la posición y el giro también. Si se
ponen ambos, **la animación gana y borra la colocación**: la mascota
aparece en la esquina superior izquierda y la patita sin girar.

La solución es pasar la parte fija en una variable CSS que las keyframes
componen. Por eso `g-entra` empieza por `var(--pos)` y `g-patita` por
`var(--giro)`, y desde React se envía la variable, nunca `transform`:

```jsx
// mal: la animación lo pisa
<PatitaSenala style={{ transform: "scaleX(-1)" }} />

// bien: la animación lo compone
<PatitaSenala style={{ "--giro": "scaleX(-1)" }} />
```

---

## 4. Dónde se coloca el globo

Se mide a sí mismo después de renderizar y busca el primer sitio donde
cabe **entero**: debajo, encima, a la derecha o a la izquierda. Con un
elemento alto acaba al lado, centrado. Siempre se acota al viewport.

```js
const M_H = 192; // margen horizontal: la mascota sobresale ~173px
const M_V = 12;  // vertical: la mascota no sobresale por arriba ni abajo

const acotar = (v, min, max) => Math.max(min, Math.min(v, max));

function ubicar(caja, ancho, alto) {
  const VW = window.innerWidth;
  const VH = window.innerHeight;
  if (VW < 640) return { estilo: { left: M_V, right: M_V, bottom: M_V }, lado: "arriba" };

  const centroX = caja.left + caja.width / 2 - ancho / 2;
  const centroY = caja.top + caja.height / 2 - alto / 2;

  const opciones = [
    { lado: "abajo",     top: caja.top + caja.height + AIRE, left: centroX,
      cabe: caja.top + caja.height + AIRE + alto + M_V <= VH },
    { lado: "arriba",    top: caja.top - AIRE - alto, left: centroX,
      cabe: caja.top - AIRE - alto >= M_V },
    { lado: "derecha",   top: centroY, left: caja.left + caja.width + AIRE,
      cabe: caja.left + caja.width + AIRE + ancho + M_H <= VW },
    { lado: "izquierda", top: centroY, left: caja.left - AIRE - ancho,
      cabe: caja.left - AIRE - ancho >= M_H },
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
```

Medir antes de colocar exige dos pasadas. Durante la primera el globo se
mantiene invisible para que no se vea saltar:

```jsx
const [dim, setDim] = useState(null);

useLayoutEffect(() => {
  const el = propio.current;
  if (!el) return;
  const r = el.getBoundingClientRect();
  setDim({ ancho: r.width, alto: r.height });
}, [paso, caja]);

const ubicacion = dim ? ubicar(caja, ancho, dim.alto) : null;
const estilo = ubicacion?.estilo ?? { left: -9999, top: 0, width: ancho };
```

---

## 5. Dónde se planta la mascota

Una sola regla, y por eso siempre es coherente: **se planta a un lado del
globo, se voltea para mirar hacia él y estira la patita en esa dirección.**

```jsx
const aLaIzquierda = lado === "derecha" ? alterno : !alterno;

const posicion = aLaIzquierda
  ? { left: 0,  top: "50%", "--pos": `translate(-108%, -50%) rotate(${giro}deg)` }
  : { right: 0, top: "50%", "--pos": `translate(108%, -50%) rotate(${-giro}deg)` };

<div className="guia-mascota w-32 h-32 sm:w-40 sm:h-40" style={posicion}>
  {/* halo: la figura es casi blanca y sin esto se deslava */}
  <div
    className="absolute inset-0 rounded-full blur-xl"
    style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0))" }}
  />
  <Mascota
    className="relative w-full h-full drop-shadow-2xl"
    style={aLaIzquierda ? { transform: "scaleX(-1)" } : undefined}
  />
  {/* la patita sale del brazo levantado, que tras el volteo queda
      siempre del lado del globo */}
  <PatitaSenala
    style={{
      top: "20%",
      ...(aLaIzquierda ? { right: "-20%" } : { left: "-20%" }),
      "--giro": aLaIzquierda ? "rotate(0deg)" : "scaleX(-1)",
    }}
  />
</div>
```

La patita se dibuja **anclada a la punta del brazo levantado de la
figura**, no flotando aparte. Ese fue el error de los primeros intentos:
una patita suelta al lado se lee como un bulto, no como un gesto.

### Cuando no cabe

Hay dos casos en los que la mascota no puede ir fuera sin tapar lo que
explica. En ambos se repliega pequeña dentro del globo:

```js
/** ¿Queda sitio libre a algún lado del elemento para plantar la mascota? */
function hayHueco(caja) {
  const ANCHO_MASCOTA = 176; // 160px + aire
  return (
    caja.left >= ANCHO_MASCOTA ||
    window.innerWidth - (caja.left + caja.width) >= ANCHO_MASCOTA
  );
}
```

1. **El elemento ocupa casi todo el ancho** (una rejilla de tarjetas, por
   ejemplo): no queda hueco a ningún lado.
2. **Móvil** (`< 640px`): el globo ocupa toda la pantalla.

Además hay una comprobación medida: si la mascota se solapa con la zona
resaltada, primero prueba el otro lado del globo y, si tampoco cabe, se
repliega.

```jsx
{dim && caja && !movil && !sinSitio && hayHueco(caja) && (
  <Senalador lado={ubicacion.lado} caja={caja} onNoCabe={() => setSinSitio(true)} />
)}

{/* dentro del globo */}
{(movil || sinSitio || !caja || !hayHueco(caja)) && (
  <Mascota className="w-14 h-14 shrink-0 -mt-1" />
)}
```

**Ojo con las dependencias.** `caja` se recalcula en cada scroll y resize.
Si la decisión de replegarse depende de ella, se reinicia en bucle y nunca
llega a aplicarse. Tiene que depender solo del paso:

```jsx
useLayoutEffect(() => setSinSitio(false), [paso]); // NO [paso, caja]
```

---

## 6. El foco sobre la zona

Un solo `div` colocado sobre el elemento, con una sombra enorme que
oscurece todo lo demás. Sale más barato que recortar una máscara:

```jsx
<div
  className="absolute pointer-events-none transition-all duration-200"
  style={{
    top: caja.top, left: caja.left,
    width: caja.width, height: caja.height,
    boxShadow: "0 0 0 9999px rgba(0, 12, 32, 0.55)",
    outline: "2px solid var(--color-ps-accent)",
  }}
/>
```

---

## 7. La mascota

`Mascota.jsx` intenta cargar `public/mascota-preventiva.png` y, si no
existe, dibuja un personaje SVG de reemplazo. Así el componente nunca se
ve roto y cambiar la figura es soltar el archivo.

```jsx
const [falla, setFalla] = useState(false);

if (!falla) {
  return <img src="/mascota-preventiva.png" onError={() => setFalla(true)} … />;
}
return <svg …>{/* personaje de reemplazo */}</svg>;
```

### Preparar la imagen

La imagen original venía con fondo naranja y azul sin transparencia.
Recortar por color plano se comía el pelaje difuso, así que el recorte se
hace por **inundación desde los bordes con transparencia gradual**:

1. Inundar desde el borde, aceptando lo que se parezca al fondo. Como
   avanza solo por lo contiguo, los turquesas interiores (escudo, ojos)
   quedan intactos.
2. Incluir en el criterio la franja de mezcla entre los dos colores de
   fondo, o la costura donde se juntan deja una línea.
3. Dentro de esa zona, asignar transparencia **gradual** según el parecido
   al fondo, en vez de cortar en duro. Eso conserva el pelaje suave.
4. Despejar el tinte de los píxeles del borde: `F = (C - (1-a)·B) / a`.
   Sin esto queda un halo de color alrededor de la silueta.
5. Recortar al contenido, cuadrar y reducir a 512×512.

El script está en el historial del repo (commit `7acb0cc`). Para otra
mascota basta con cambiar los colores de fondo y volver a ejecutarlo.

---

## Requisitos de la imagen

- PNG cuadrado, idealmente 512×512, con transparencia
- La figura de pie y de frente
- **Con un brazo levantado**: de ahí sale la patita que señala
- Si el brazo levantado está a la derecha en vez de a la izquierda, hay
  que invertir la condición `aLaIzquierda` del volteo

---

## Cómo comprobar que no se rompe

Este componente se coloca solo, así que conviene comprobarlo por medida y
no a ojo. El recorrido completo son 160 pasos: 4 pantallas × 8 anchos.
Por cada paso se verifica que:

- el globo esté entero dentro del viewport
- la mascota y la patita estén enteras dentro del viewport
- la mascota no se solape con la zona resaltada
- no haya desborde horizontal
- no haya errores de consola

```js
const gb = document.querySelector('[role="dialog"] > div:last-child').getBoundingClientRect();
const m  = document.querySelector(".guia-mascota")?.getBoundingClientRect();
const foco = document.querySelector('[role="dialog"] .absolute.pointer-events-none')?.getBoundingClientRect();

const fuera = (b) => b && (b.top < -2 || b.left < -2 ||
                           b.bottom > innerHeight + 2 || b.right > innerWidth + 2);
const solapa = (a, b) => a && b &&
  !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
```

Anchos que conviene cubrir: **360, 390, 640, 768, 1024, 1280, 1366, 1920**.
Los que más problemas dieron fueron 360 (el globo ocupa la pantalla), 768
(la mascota se salía por 5px) y 1366×650 (pantalla baja).

---

## Errores que ya se cometieron

Por si se vuelve a tocar:

| Síntoma | Causa |
|---|---|
| La mascota aparece arriba a la izquierda | `transform` en línea pisado por las keyframes; usar `var(--pos)` |
| La patita no gira | Lo mismo con `var(--giro)` |
| La figura se sube encima del texto | El posicionamiento puesto en un div interior en vez de en `.guia-mascota` |
| Nunca se repliega aunque estorbe | La decisión dependía de `caja`, que cambia en cada scroll |
| Se sale de pantalla a 768px | El margen horizontal era menor que los 173px que se desplaza |
| El globo se sale en pantallas bajas | Un margen único para horizontal y vertical |
| El botón flotante no se puede pulsar | Estaba con `animate-bounce`; animar un halo detrás, no el botón |
| Revienta al abrir la guía | `movil` usada sin declarar: el build no lo detecta |

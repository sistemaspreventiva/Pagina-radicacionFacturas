// src/lib/guia.js
// Pasos del asistente, por ruta.
//
// Cada paso apunta a un elemento marcado en el JSX con data-guia="id".
// Si el elemento no existe en pantalla (por ejemplo algo que solo se ve
// en escritorio), el paso se omite solo en vez de romper el recorrido.

import { textoVentana } from "./dateWindow.js";

const VENTANA = textoVentana();

export const RECORRIDOS = {
  "/": {
    titulo: "Cómo entrar",
    pasos: [
      {
        objetivo: null, // sin objetivo: tarjeta de bienvenida centrada
        titulo: "¡Hola! Soy tu guía",
        texto:
          "Te muestro en menos de un minuto cómo radicar tu cuenta de cobro. Puedes cerrarme cuando quieras y volver a abrirme con el botón de abajo.",
      },
      {
        objetivo: "login-usuario",
        titulo: "Tu usuario",
        texto:
          "Escribe el usuario y la contraseña que creaste al registrarte. Si aún no tienes cuenta, usa el enlace «Regístrate» de más abajo.",
      },
      {
        objetivo: "login-ventana",
        titulo: "Cuándo puedes radicar",
        texto: `La radicación está habilitada ${VENTANA}. Cuando la ventana se cierra el formulario queda bloqueado, así que no dejes el envío para el final.`,
      },
      {
        objetivo: "login-instructivos",
        titulo: "Formatos y guías",
        texto:
          "Aquí descargas las plantillas de tu rol y los instructivos. Si es tu primera vez, empieza por el video.",
      },
    ],
  },

  "/register": {
    titulo: "Crear tu cuenta",
    pasos: [
      {
        objetivo: null,
        titulo: "Vamos a crear tu cuenta",
        texto: "Son pocos datos. Te señalo el único que necesita cuidado.",
      },
      {
        objetivo: "reg-cedula",
        titulo: "Tu cédula es importante",
        texto:
          "Con ella se arma automáticamente el número de tu cuenta de cobro. Escríbela sin puntos ni espacios, y revísala bien: si queda mal, el consecutivo saldrá mal todos los meses.",
      },
      {
        objetivo: "reg-rol",
        titulo: "Tu rol",
        texto:
          "Elige el que corresponda a tu contrato. De él dependen las plantillas que debes usar.",
      },
    ],
  },

  "/dashboard": {
    titulo: "Radicar paso a paso",
    pasos: [
      {
        objetivo: null,
        titulo: "Te acompaño en el envío",
        texto:
          "Radicar son cuatro datos: el periodo, el valor, los archivos y enviar. Vamos uno por uno.",
      },
      {
        objetivo: "dash-estado",
        titulo: "Primero: ¿está abierta la ventana?",
        texto: `Si dice «Ventana abierta» puedes enviar. Si dice «cerrada», el botón queda bloqueado. Ahora mismo está habilitada ${VENTANA}.`,
      },
      {
        objetivo: "dash-calendario",
        titulo: "Los días habilitados",
        texto:
          "Los días en turquesa son los que puedes radicar. El día de hoy aparece con un borde naranja.",
      },
      {
        objetivo: "dash-periodo",
        titulo: "El periodo que estás cobrando",
        texto:
          "Ojo con este: es el mes del trabajo que cobras, NO el mes actual. Si en agosto cobras lo de julio, aquí debe decir julio. Viene preseleccionado el mes anterior, que es lo normal.",
      },
      {
        objetivo: "dash-numero",
        titulo: "El número se genera solo",
        texto:
          "No lo escribes tú. Se arma con el mes del periodo y tu cédula. Si cambias el periodo arriba, este número cambia al instante.",
      },
      {
        objetivo: "dash-valor",
        titulo: "El valor a cobrar",
        texto: "Escribe el monto de tu cuenta de cobro para este periodo.",
      },
      {
        objetivo: "dash-archivos",
        titulo: "Tus documentos",
        texto:
          "Adjunta la cuenta de cobro y sus soportes en PDF, Word o Excel. Puedes subir varios: hasta 10 archivos y 20 MB en total.",
      },
      {
        objetivo: "dash-enviar",
        titulo: "Y listo",
        texto:
          "Al enviar, todo llega por correo al área de cuentas. Verás un mensaje de confirmación con el número de radicación.",
      },
    ],
  },

  "/instructivo": {
    titulo: "Dónde está cada documento",
    pasos: [
      {
        objetivo: null,
        titulo: "Aquí está todo lo que necesitas",
        texto: "Te muestro cómo está organizada esta página.",
      },
      {
        objetivo: "inst-video",
        titulo: "Empieza por el video",
        texto:
          "Explica el proceso completo de radicación. Si es tu primera vez, dedícale estos minutos.",
      },
      {
        objetivo: "inst-instructivos",
        titulo: "Los instructivos",
        texto:
          "Guías escritas para casos puntuales: cómo diligenciar tu cuenta de cobro y cómo soportar la seguridad social.",
      },
      {
        objetivo: "inst-roles",
        titulo: "Las plantillas de tu rol",
        texto:
          "Busca la columna de tu rol y descarga solo esos formatos. Cada rol usa plantillas distintas.",
      },
      {
        objetivo: "inst-formatos",
        titulo: "Un botón por documento",
        texto:
          "Los instructivos se descargan en PDF, para leerlos. Las plantillas en Word o Excel, para que puedas diligenciarlas.",
      },
    ],
  },
};

/** Devuelve el recorrido de una ruta, o null si no hay. */
export function recorridoDe(ruta) {
  return RECORRIDOS[ruta] || null;
}

// src/lib/instructivos.js
// Catálogo único de documentos publicados en /public/documentos.
//
// Los archivos se guardan con nombre "slug" (sin tildes ni espacios) para que
// la URL sea estable, pero se descargan con su NOMBRE OFICIAL gracias al
// atributo download del enlace. Así el contratista recibe el archivo con el
// código del sistema de gestión y la web no depende de caracteres especiales.
//
// Cada documento expone un solo formato, el que de verdad se usa:
//   - instructivos: PDF, porque se consultan, no se diligencian
//   - plantillas:   el editable (DOCX / XLSX), que es el que se llena

const BASE = "/documentos";

/** Instructivos: guías del proceso, en PDF. Se consultan, no se editan. */
export const instructivos = [
  {
    id: "in-gf-001-radicacion",
    codigo: "IN-GF-001",
    titulo: "Instructivo para radicación de cuenta de cobro",
    descripcion: "Guía general del proceso. Aplica a todos los roles.",
    pdf: `${BASE}/instructivos/in-gf-001-radicacion-cuenta-cobro.pdf`,
    nombreOficial: "IN-GF-001 INSTRUCTIVO PARA RADICACIÓN CUENTA DE COBRO v01",
  },
  {
    id: "in-gf-001-asistencial",
    codigo: "IN-GF-001",
    titulo: "Instructivo cuenta de cobro — personal asistencial",
    descripcion: "Cómo diligenciar la cuenta de cobro del personal asistencial.",
    pdf: `${BASE}/instructivos/in-gf-001-cuenta-cobro-asistencial.pdf`,
    nombreOficial: "IN-GF-001 INSTRUCTIVO CUENTA DE COBRO PERSONAL ASISTENCIAL v02",
  },
  {
    id: "in-gf-002-seguridad-social",
    codigo: "IN-GF-002",
    titulo: "Instructivo cotización seguridad social independientes",
    descripcion: "Cómo liquidar y soportar los aportes a seguridad social.",
    pdf: `${BASE}/instructivos/in-gf-002-seguridad-social-independientes.pdf`,
    nombreOficial: "IN-GF-002 INSTRUCTIVO COTIZACION SEGURIDAD SOCIAL INDEPENDIENTES v01",
  },
  {
    id: "in-gf-003-conductores",
    codigo: "IN-GF-003",
    titulo: "Instructivo cuenta de cobro — conductores",
    descripcion: "Cómo diligenciar el formato de cuenta de cobro de conductores.",
    pdf: `${BASE}/instructivos/in-gf-003-cuenta-cobro-conductores.pdf`,
    nombreOficial:
      "IN-GF-003 INSTRUCTIVO PARA DILIGENCIAR EL FORMATO DE CUENTA DE COBRO CONDUCTORES V01",
  },
];

/** Plantillas a diligenciar, agrupadas por rol. */
export const plantillas = {
  asistencial: [
    {
      id: "fo-gf-005",
      codigo: "FO-GF-005",
      titulo: "Plantilla cuenta de cobro asistencial",
      editable: `${BASE}/plantillas/fo-gf-005-cuenta-cobro-asistencial.docx`,
      nombreOficial: "FO-GF-005 PLANTILLA CUENTA DE COBRO ASISTENCIAL v01",
    },
    {
      id: "fo-gf-003",
      codigo: "FO-GF-003",
      titulo: "Plantilla relación de pacientes",
      editable: `${BASE}/plantillas/fo-gf-003-relacion-pacientes.xlsx`,
      nombreOficial: "FO-GF-003 PLANTILLA RELACION DE PACIENTES v01",
    },
  ],

  administrativo: [
    {
      id: "fo-gf-006",
      codigo: "FO-GF-006",
      titulo: "Plantilla cuenta de cobro administrativo",
      editable: `${BASE}/plantillas/fo-gf-006-cuenta-cobro-administrativo.docx`,
      nombreOficial: "FO-GF-006 PLANTILLA CUENTA DE COBRO ADMINISTRATIVO v01",
    },
    {
      id: "fo-gf-001",
      codigo: "FO-GF-001",
      titulo: "Informe de ejecución de actividades contractuales",
      editable: `${BASE}/plantillas/fo-gf-001-informe-ejecucion-actividades.docx`,
      nombreOficial: "FO-GF-001 INFORME DE EJECUCIÓN DE ACTIVIDADES CONTRACTUALES v01",
    },
  ],

  conductores: [
    {
      id: "fo-gf-002",
      codigo: "FO-GF-002",
      titulo: "Plantilla cuenta de cobro conductores",
      editable: `${BASE}/plantillas/fo-gf-002-cuenta-cobro-conductores.docx`,
      nombreOficial: "FO-GF-002 PLANTILLA CUENTA DE COBRO CONDUCTORES v01",
    },
    {
      id: "fo-gf-004",
      codigo: "FO-GF-004",
      titulo: "Relación de servicios — conductores",
      editable: `${BASE}/plantillas/fo-gf-004-relacion-servicios-conductores.xlsx`,
      nombreOficial: "FO-GF-004 RELACIÓN_DE_SERVICIOS-CONDUCTORES_v01",
    },
  ],
};

/** Extensión de una ruta, en mayúsculas y sin punto: "DOCX", "XLSX", "PDF". */
export function formatoDe(ruta) {
  const m = /\.([a-z0-9]+)$/i.exec(ruta || "");
  return m ? m[1].toUpperCase() : "";
}

/** Nombre con el que se descarga el archivo (código oficial + extensión). */
export function nombreDescarga(doc, ruta) {
  const ext = /\.([a-z0-9]+)$/i.exec(ruta || "");
  return ext ? `${doc.nombreOficial}.${ext[1].toLowerCase()}` : doc.nombreOficial;
}

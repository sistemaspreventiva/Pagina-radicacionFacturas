import { useRef, useState } from "react";
import { uploadRadicacion } from "../services/api";
import { genConsecutivo } from "../lib/consecutivo";
import { periodoAnterior, periodoActual, etiquetaPeriodo } from "../lib/dateWindow";

// Límites
const MAX_FILE_MB = 15;
const MAX_TOTAL_MB = 20;
const MAX_FILES = 10;

// Tipos permitidos (coinciden con el backend).
// OJO: el navegador entrega File.type SIEMPRE en minúsculas, así que las
// entradas van en minúscula ("macroenabled", no "macroEnabled").
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel.sheet.macroenabled.12",
]);
const ALLOWED_EXT = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".xlsm"];
const ACCEPT = ALLOWED_EXT.join(",");

// Algunos equipos entregan File.type vacío; en ese caso decide la extensión.
function tipoPermitido(file) {
  const mime = (file.type || "").toLowerCase().trim();
  const extOk = ALLOWED_EXT.some((ext) => file.name.toLowerCase().endsWith(ext));
  return extOk && (mime === "" || ALLOWED_MIME.has(mime));
}

function dedupe(files) {
  const map = new Map();
  for (const f of files) {
    const key = `${f.name}__${f.size}__${f.lastModified}`;
    if (!map.has(key)) map.set(key, f);
  }
  return Array.from(map.values());
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);

export default function UploadForm({ canUpload, user }) {
  const [files, setFiles] = useState([]);
  // Periodo que se está cobrando. Por defecto el mes anterior: en agosto se radica julio.
  const [periodo, setPeriodo] = useState(periodoAnterior);
  const [valor, setValor] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [progress, setProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const pickerRef = useRef(null);

  // El consecutivo se deriva del periodo y la cédula: no necesita estado propio.
  const numero = genConsecutivo(user?.dni, periodo);
  const maxPeriodo = periodoActual();
  const totalBytes = files.reduce((a, f) => a + f.size, 0);
  const bloqueado = !canUpload || sending;

  function validateAndMerge(current, incoming) {
    for (const f of incoming) {
      if (!tipoPermitido(f))
        throw new Error(`"${f.name}" no es PDF, Word ni Excel.`);
      if (f.size > MAX_FILE_MB * 1024 * 1024)
        throw new Error(`"${f.name}" supera ${MAX_FILE_MB} MB.`);
    }
    const combined = dedupe([...current, ...incoming]);
    if (combined.length > MAX_FILES)
      throw new Error(`Máximo ${MAX_FILES} archivos por envío.`);
    const total = combined.reduce((a, f) => a + f.size, 0);
    if (total > MAX_TOTAL_MB * 1024 * 1024)
      throw new Error(`El total (${mb(total)} MB) excede ${MAX_TOTAL_MB} MB.`);
    return combined;
  }

  function onPick(e) {
    setErr("");
    setOk("");
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;
    try {
      setFiles(validateAndMerge(files, incoming));
    } catch (ex) {
      setErr(ex.message || "Archivo no válido.");
    } finally {
      e.target.value = ""; // permite volver a elegir lo mismo
    }
  }

  const removeAt = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    if (!canUpload) return setErr("Fuera de la ventana de radicación.");
    if (!files.length) return setErr("Adjunta al menos un archivo.");
    if (!periodo) return setErr("Selecciona el periodo que vas a radicar.");
    if (periodo > maxPeriodo) return setErr("No puedes radicar un periodo futuro.");
    if (!numero)
      return setErr("No se pudo generar el consecutivo. Revisa tu cédula.");
    if (!valor) return setErr("Ingresa el valor.");

    try {
      setSending(true);
      setProgress(0);
      const res = await uploadRadicacion(
        { files, numero, valor, periodo, user },
        setProgress
      );
      setOk(
        `Radicación enviada · ${res.count ?? files.length} adjunto(s) · ID ${
          res.id || "N/A"
        }`
      );
      setFiles([]);
      setValor("");
    } catch (ex) {
      setErr(ex.message || "No se pudo enviar.");
    } finally {
      setSending(false);
      setTimeout(() => setProgress(0), 800);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {err && (
        <p role="alert" className="mb-6 border-l-2 border-ps-warn pl-3 text-sm text-ps-warn">
          {err}
        </p>
      )}
      {ok && (
        <p role="status" className="mb-6 border-l-2 border-ps-ok pl-3 text-sm text-ps-ok">
          {ok}
        </p>
      )}

      <div className="space-y-8">
        {/* Periodo — define el mes del consecutivo */}
        <div data-guia="dash-periodo">
          <label htmlFor="periodo" className="eyebrow block mb-1.5">
            Periodo que radica
          </label>
          <input
            id="periodo"
            type="month"
            className="field"
            value={periodo}
            max={maxPeriodo}
            onChange={(e) => {
              setPeriodo(e.target.value);
              setErr("");
              setOk("");
            }}
            disabled={bloqueado}
          />
          <p className="mt-1.5 text-xs text-ps-muted">
            {etiquetaPeriodo(periodo)
              ? `Periodo seleccionado: ${etiquetaPeriodo(periodo)}.`
              : "Selecciona el mes que vas a cobrar."}
          </p>
        </div>

        {/* Consecutivo y valor */}
        <div className="grid sm:grid-cols-2 gap-8">
          <div data-guia="dash-numero">
            <label htmlFor="numero" className="eyebrow block mb-1.5">
              N.º de cuenta de cobro
            </label>
            <p
              id="numero"
              className="py-2.5 border-b border-ps-line font-mono text-sm text-ps-navy select-all"
            >
              {numero || <span className="text-ps-muted font-sans">—</span>}
            </p>
            <p className="mt-1.5 text-xs text-ps-muted">
              Automático, según el periodo y tu cédula.
            </p>
          </div>

          <div data-guia="dash-valor">
            <label htmlFor="valor" className="eyebrow block mb-1.5">
              Valor
            </label>
            <input
              id="valor"
              className="field"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="$0"
              inputMode="numeric"
              disabled={bloqueado}
            />
          </div>
        </div>

        {/* Archivos */}
        <div data-guia="dash-archivos">
          <div className="flex items-baseline justify-between gap-4 mb-1.5">
            <span className="eyebrow">Archivos</span>
            {files.length > 0 && (
              <span className="text-xs text-ps-muted tabular-nums">
                {files.length}/{MAX_FILES} · {mb(totalBytes)}/{MAX_TOTAL_MB} MB
              </span>
            )}
          </div>

          <input
            ref={pickerRef}
            type="file"
            name="files"
            multiple
            accept={ACCEPT}
            onChange={onPick}
            className="sr-only"
            disabled={bloqueado}
          />

          <button
            type="button"
            onClick={() => pickerRef.current?.click()}
            className="btn-ghost w-full justify-center py-3 border-dashed disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={bloqueado}
          >
            {files.length ? "Agregar más archivos" : "Seleccionar archivos"}
          </button>

          <p className="mt-1.5 text-xs text-ps-muted">
            PDF, Word y Excel. Máx {MAX_FILE_MB} MB por archivo, {MAX_TOTAL_MB} MB
            en total.
          </p>

          {files.length > 0 && (
            <ul className="mt-4 border-t border-ps-line">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-4 py-2.5 border-b border-ps-line text-sm"
                >
                  <span className="flex-1 truncate text-ps-ink">{f.name}</span>
                  <span className="text-xs text-ps-muted tabular-nums shrink-0">
                    {mb(f.size)} MB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="text-xs text-ps-muted hover:text-ps-warn transition-colors shrink-0 disabled:opacity-40"
                    disabled={sending}
                    aria-label={`Quitar ${f.name}`}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Progreso */}
      {progress > 0 && (
        <div className="mt-8">
          <div className="h-px bg-ps-line overflow-hidden">
            <div
              className="h-px bg-ps-accent transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ps-muted tabular-nums">
            Enviando… {progress}%
          </p>
        </div>
      )}

      <button type="submit" data-guia="dash-enviar" className="btn-primary mt-10 w-full" disabled={bloqueado}>
        {sending
          ? "Enviando…"
          : canUpload
          ? "Enviar radicación"
          : "Fuera de ventana"}
        {!sending && canUpload && <span aria-hidden="true">→</span>}
      </button>
    </form>
  );
}

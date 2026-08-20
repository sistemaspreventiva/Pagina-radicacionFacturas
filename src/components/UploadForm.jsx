import { useRef, useState } from "react";
import { uploadRadicacion } from "../services/api";
import { genConsecutivo } from "../lib/consecutivo";
import { periodoAnterior, periodoActual, etiquetaPeriodo } from "../lib/dateWindow";

// Límites
const MAX_FILE_MB = 15;
const MAX_TOTAL_MB = 20;
const MAX_FILES   = 10;

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

export default function UploadForm({ canUpload, user }) {
  const [files, setFiles]   = useState([]);
  // Periodo que se está cobrando. Por defecto el mes anterior: en agosto se radica julio.
  const [periodo, setPeriodo] = useState(periodoAnterior);
  const [valor, setValor]   = useState("");
  const [err, setErr]       = useState("");
  const [ok, setOk]         = useState("");
  const [progress, setProgress] = useState(0);
  const [sending, setSending]   = useState(false);
  const pickerRef = useRef(null);

  // El consecutivo se deriva del periodo y la cédula: no necesita estado propio.
  const numero = genConsecutivo(user?.dni, periodo);
  const maxPeriodo = periodoActual();

  function validateAndMerge(current, incoming) {
    for (const f of incoming) {
      if (!tipoPermitido(f)) throw new Error(`"${f.name}" no es PDF/Word/Excel soportado.`);
      if (f.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`"${f.name}" supera ${MAX_FILE_MB} MB.`);
    }
    let combined = dedupe([...current, ...incoming]);
    if (combined.length > MAX_FILES) throw new Error(`Máximo ${MAX_FILES} archivos por envío.`);
    const totalBytes = combined.reduce((a, f) => a + f.size, 0);
    if (totalBytes > MAX_TOTAL_MB * 1024 * 1024) {
      throw new Error(`Tamaño total ${(totalBytes/1024/1024).toFixed(1)} MB excede ${MAX_TOTAL_MB} MB.`);
    }
    return combined;
  }

  function onPick(e) {
    setErr(""); setOk("");
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;
    try {
      setFiles(validateAndMerge(files, incoming));
      e.target.value = ""; // permite volver a elegir lo mismo
    } catch (ex) {
      setErr(ex.message || "Archivo no válido.");
      e.target.value = "";
    }
  }

  function removeAt(idx) { setFiles(prev => prev.filter((_, i) => i !== idx)); }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setOk("");
    if (!canUpload) return setErr("Fuera de ventana de radicación.");
    if (!files.length) return setErr("Adjunta al menos 1 archivo.");
    if (!periodo) return setErr("Selecciona el periodo que vas a radicar.");
    if (periodo > maxPeriodo) return setErr("No puedes radicar un periodo futuro.");
    if (!numero) return setErr("No se pudo generar el consecutivo. Verifica tu cédula en el registro.");
    if (!valor) return setErr("Ingresa el valor.");

    try {
      setSending(true); setProgress(0);
      const res = await uploadRadicacion({ files, numero, valor, periodo, user }, (p) => setProgress(p));
      setOk(`Radicación enviada. Adjuntos: ${res.count ?? files.length}. ID: ${res.id || "N/A"}`);
      setFiles([]);
      setValor("");
    } catch (ex) {
      setErr(ex.message || "No se pudo enviar.");
    } finally {
      setSending(false);
      setTimeout(() => setProgress(0), 800);
    }
  }

  const totalMB = (files.reduce((a, f) => a + f.size, 0) / 1024 / 1024).toFixed(2);

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {err && <p className="text-sm text-red-600">{err}</p>}
      {ok && <p className="text-sm text-green-700">{ok}</p>}

      {/* Periodo que se radica: define el mes del consecutivo */}
      <div>
        <label htmlFor="periodo" className="block text-sm mb-1">Periodo que radica</label>
        <input
          id="periodo"
          type="month"
          value={periodo}
          max={maxPeriodo}
          onChange={(e) => { setPeriodo(e.target.value); setErr(""); setOk(""); }}
          className="w-full border rounded px-3 py-2 bg-white"
          disabled={!canUpload || sending}
        />
        <p className="text-xs text-slate-500 mt-1">
          {etiquetaPeriodo(periodo)
            ? `Estás radicando el periodo: ${etiquetaPeriodo(periodo)}.`
            : "Selecciona el mes que vas a cobrar."}
        </p>
      </div>

      <div>
        <label className="block text-sm mb-1">Archivos a radicar</label>
        <input
          ref={pickerRef}
          type="file"
          name="files"
          multiple
          accept={ACCEPT}
          onChange={onPick}
          className="w-full border rounded px-3 py-2 bg-white disabled:opacity-60"
          disabled={!canUpload || sending}
        />
        {files.length > 0 && (
          <button
            type="button"
            onClick={() => pickerRef.current?.click()}
            className="mt-2 text-sm text-[color:var(--ps-blue)] hover:underline"
            disabled={!canUpload || sending}
          >
            Agregar más archivos
          </button>
        )}
        <p className="text-xs text-slate-500 mt-1">
          Permitidos: PDF, Word (DOC/DOCX) y Excel (XLS/XLSX/XLSM). Máx {MAX_FILE_MB}MB por archivo, {MAX_TOTAL_MB}MB total.
        </p>

        {!!files.length && (
          <ul className="mt-2 border rounded-lg divide-y">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="truncate mr-3">{f.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{(f.size/1024/1024).toFixed(2)} MB</span>
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="text-red-600 hover:underline"
                    disabled={sending}
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
            <li className="px-3 py-2 text-xs text-slate-600">Total: {totalMB} MB</li>
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="numero" className="block text-sm mb-1">Número de cuenta de cobro</label>
          <input
            id="numero"
            value={numero}
            readOnly
            className="w-full border rounded px-3 py-2 bg-slate-100 text-slate-700 select-all"
            placeholder="DSMMYY-CC"
            aria-readonly="true"
            title="Autogenerado con el periodo que radicas y tu cédula; no editable"
          />
          <p className="text-xs text-slate-500 mt-1">
            Formato DSMMYY-CC. Se arma con el mes del periodo que radicas y tu cédula.
          </p>
        </div>
        <div>
          <label className="block text-sm mb-1">Valor</label>
          <input
            value={valor}
            onChange={(e)=>setValor(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="$0"
            disabled={!canUpload || sending}
          />
        </div>
      </div>

      {progress > 0 && (
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div className="h-2 rounded-full bg-sky-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <button
        type="submit"
        className={`w-full rounded-lg py-2 font-semibold text-white ${canUpload ? "bg-sky-600 hover:bg-sky-700" : "bg-slate-400 cursor-not-allowed"}`}
        disabled={!canUpload || sending}
      >
        {sending ? "Enviando..." : canUpload ? "Enviar" : "Fuera de ventana"}
      </button>
    </form>
  );
}

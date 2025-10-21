import { useState } from "react";
import { uploadRadicacion } from "../services/api";

const MAX_MB = 15;
const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

export default function UploadForm({ canUpload, user }) {
  const [file, setFile] = useState(null);
  const [numero, setNumero] = useState("");
  const [valor, setValor] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [progress, setProgress] = useState(0);
  const [sending, setSending] = useState(false);

  function onPick(e) {
    setErr(""); setOk("");
    const f = e.target.files?.[0];
    if (!f) return setFile(null);
    if (!ALLOWED.includes(f.type)) { setErr("Formato no permitido. Solo PDF/JPG/PNG."); return setFile(null); }
    if (f.size > MAX_MB * 1024 * 1024) { setErr(`Archivo muy grande (máx ${MAX_MB} MB).`); return setFile(null); }
    setFile(f);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setOk("");
    if (!canUpload) return setErr("Fuera de ventana de radicación.");
    if (!file) return setErr("Adjunta un archivo.");
    if (!numero) return setErr("Ingresa el número de factura.");
    if (!valor) return setErr("Ingresa el valor.");

    try {
      setSending(true);
      setProgress(0);
      const res = await uploadRadicacion({ file, numero, valor, user }, (p) => setProgress(p));
      setOk(`Radicación enviada. ID: ${res.id || "N/A"}`);
      setFile(null); setNumero(""); setValor("");
    } catch (ex) {
      setErr(ex.message || "No se pudo enviar.");
    } finally {
      setSending(false);
      setTimeout(() => setProgress(0), 800);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {err && <p className="text-sm text-red-600">{err}</p>}
      {ok && <p className="text-sm text-green-700">{ok}</p>}

      <div>
        <label className="block text-sm mb-1">Factura / Cuenta de cobro</label>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={onPick}
          className="w-full border rounded px-3 py-2 bg-white disabled:opacity-60"
          disabled={!canUpload || sending}
        />
        <p className="text-xs text-slate-500 mt-1">PDF, JPG o PNG. Máx {MAX_MB} MB.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Número de factura</label>
          <input
            value={numero}
            onChange={(e)=>setNumero(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="FAC-0001"
            disabled={!canUpload || sending}
          />
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

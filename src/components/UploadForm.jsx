import { useMemo, useState } from "react";
import { uploadRadicacion } from "../services/api";

// Consecutivo DS"DD/YYYY-CC"
function generarConsecutivo() {
  const now = new Date();
  const dia = String(now.getDate()).padStart(2, "0");
  const anio = String(now.getFullYear());
  return `DS"${dia}/${anio}-CC"`;
}

// Calendario: 1–10 para asistencial/administrativo; todo el mes conductor
function calendarioHabilitado(role) {
  const hoy = new Date().getDate();
  if (role === "conductor") return true;
  return hoy >= 1 && hoy <= 10;
}

export default function UploadForm() {
  const [files, setFiles] = useState([]);
  const [valor, setValor] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("asistencial");
  const [dni, setDni] = useState(""); // informativo
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const numero = useMemo(() => generarConsecutivo(), []); // solo lectura
  const habilitado = calendarioHabilitado(role);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);

    if (!habilitado) {
      setMsg({ type: "error", text: "Calendario cerrado para tu rol (habilitado 1–10 del mes)." });
      return;
    }
    if (!files || files.length === 0) {
      setMsg({ type: "error", text: "Adjunta al menos un archivo (PDF/Word/Excel)." });
      return;
    }
    if (!valor) {
      setMsg({ type: "error", text: "Ingresa el valor de la factura." });
      return;
    }

    try {
      setLoading(true);
      const data = await uploadRadicacion({
        files,
        numero,
        valor,
        username,
        name,
        email,
        role,
        timestamp: new Date().toISOString(),
      });
      setMsg({ type: "ok", text: `Enviado ✅ (ID: ${data.id}) - Adjuntos: ${data.count}` });
      setFiles([]);
      setValor("");
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Error enviando radicación." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2 text-slate-800">Subir Radicación</h1>
      <p className="text-sm mb-6 opacity-80">
        {role === "conductor"
          ? "Conductores: habilitado todo el mes."
          : "Asistencial/Administrativo: habilitado del 1 al 10 de cada mes."}
      </p>

      {!habilitado && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-800">
          Calendario cerrado para tu rol en este momento.
        </div>
      )}

      {msg && (
        <div
          className={`mb-4 rounded-md border p-3 ${
            msg.type === "ok"
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Consecutivo solo lectura */}
        <div>
          <label className="block text-sm mb-1">Consecutivo</label>
          <input
            className="w-full rounded-md border px-3 py-2 bg-gray-100"
            type="text"
            value={numero}
            readOnly
          />
        </div>

        {/* DNI / Cédula */}
        <div>
          <label className="block text-sm mb-1">DNI / Cédula</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="Ingrese su DNI/Cédula"
          />
        </div>

        {/* Rol */}
        <div>
          <label className="block text-sm mb-1">Rol</label>
          <select
            className="w-full rounded-md border px-3 py-2"
            value={role}
            onChange={(e) => e.target.value && setRole(e.target.value)}
          >
            <option value="asistencial">Asistencial</option>
            <option value="administrativo">Administrativo</option>
            <option value="conductor">Conductor</option>
          </select>
        </div>

        {/* Usuario / Nombre / Email */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Usuario</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="usuario"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>
        </div>

        {/* Valor */}
        <div>
          <label className="block text-sm mb-1">Valor</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="number"
            min={0}
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Ej: 1230000"
          />
        </div>

        {/* Archivos */}
        <div>
          <label className="block text-sm mb-1">Adjuntos (PDF/Word/Excel)</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.xlsm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
          {files?.length > 0 && (
            <p className="text-sm mt-1 opacity-80">
              {files.length} archivo(s) seleccionados.
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !habilitado}
            className={`rounded-md px-4 py-2 text-white ${
              habilitado
                ? "bg-[var(--p-prim)] hover:bg-[var(--p-prim-600)]"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Enviando..." : "Enviar radicación"}
          </button>
        </div>
      </form>
    </div>
  );
}

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export function uploadRadicacion({ file, numero, valor, user }, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("numero", numero);
    form.append("valor", valor);
    form.append("username", user?.username || "");
    form.append("name", user?.name || "");
    form.append("email", user?.email || "");
    form.append("role", user?.role || "");
    form.append("timestamp", new Date().toISOString());

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/api/radicaciones`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === "function") {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(xhr.responseText || "Error de carga"));
    };
    xhr.onerror = () => reject(new Error("Error de red"));
    xhr.send(form);
  });
}

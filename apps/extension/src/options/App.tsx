import { useEffect, useState } from "react";
import { getSettings, saveSettings } from "../lib/storage";
import type { ServiceMode } from "../lib/types";

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: 32,
  boxSizing: "border-box",
  background: "radial-gradient(circle at top left, #dbeafe, transparent 28%), #f8fafc",
  color: "#0f172a",
  fontFamily: "Inter, Arial, sans-serif"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid #cbd5e1",
  background: "#fff",
  boxSizing: "border-box"
};

export const App = () => {
  const [serviceMode, setServiceMode] = useState<ServiceMode>("private");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [language, setLanguage] = useState("pt-BR");
  const [status, setStatus] = useState("Carregando...");

  useEffect(() => {
    const load = async () => {
      const settings = await getSettings();
      setServiceMode(settings.serviceMode);
      setApiBaseUrl(settings.apiBaseUrl);
      setApiKey(settings.apiKey);
      setLanguage(settings.language);
      setStatus("Pronto para salvar");
    };

    void load();
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveSettings({ serviceMode, apiBaseUrl, apiKey, language });
    setStatus("Configuracoes salvas");
  };

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <section style={{ marginBottom: 24, padding: 24, borderRadius: 24, background: "#111827", color: "#fff" }}>
          <p style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.4 }}>Corretor pt-BR</p>
          <h1 style={{ margin: "10px 0 8px", fontSize: 34 }}>Configuracoes da extensao</h1>
          <p style={{ margin: 0, color: "#cbd5e1" }}>Escolha entre o modo gratuito imediato ou o seu servidor proprio.</p>
        </section>

        <form onSubmit={handleSave} style={{ display: "grid", gap: 18, padding: 24, borderRadius: 24, background: "rgba(255,255,255,0.92)" }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span>Modo de correcao</span>
            <select style={inputStyle} value={serviceMode} onChange={(event) => setServiceMode(event.target.value as ServiceMode)}>
              <option value="public">Gratuito imediato (API publica do LanguageTool)</option>
              <option value="private">Servidor proprio</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span>URL base da API</span>
            <input
              style={{ ...inputStyle, opacity: serviceMode === "public" ? 0.55 : 1 }}
              value={apiBaseUrl}
              onChange={(event) => setApiBaseUrl(event.target.value)}
              disabled={serviceMode === "public"}
            />
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span>Token da licenca</span>
            <input
              style={{ ...inputStyle, opacity: serviceMode === "public" ? 0.55 : 1 }}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              disabled={serviceMode === "public"}
            />
          </label>

          {serviceMode === "private" ? (
            <p style={{ margin: 0, color: "#475569", fontSize: 13 }}>
              Use aqui o token da licenca do cliente ou da sua conta para validar plano e limites no backend.
            </p>
          ) : null}

          <label style={{ display: "grid", gap: 8 }}>
            <span>Idioma</span>
            <select style={inputStyle} value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option value="pt-BR">Portugues (Brasil)</option>
            </select>
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="submit"
              style={{
                padding: "12px 18px",
                border: 0,
                borderRadius: 14,
                background: "#111827",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Salvar
            </button>
            <span style={{ color: "#475569" }}>{status}</span>
          </div>
        </form>
      </div>
    </main>
  );
};

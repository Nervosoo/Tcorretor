import { useEffect, useMemo, useState } from "react";
import { getSettings, isDomainDisabled, toggleDomain } from "../lib/storage";
import type { AccountStatus, BackgroundResponse } from "../lib/types";

const shellStyle: React.CSSProperties = {
  width: 320,
  minHeight: 320,
  padding: 18,
  boxSizing: "border-box",
  fontFamily: "Inter, Arial, sans-serif",
  background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
  color: "#0f172a"
};

export const App = () => {
  const [domain, setDomain] = useState<string>("site atual");
  const [disabled, setDisabled] = useState(false);
  const [apiStatus, setApiStatus] = useState("Verificando API...");
  const [planLabel, setPlanLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const statusTone = useMemo(() => {
    return disabled ? "#b91c1c" : "#047857";
  }, [disabled]);

  useEffect(() => {
    const load = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tab?.url ? new URL(tab.url) : null;
      const currentDomain = url?.hostname ?? "site atual";
      const settings = await getSettings();
      setDomain(currentDomain);
      setDisabled(isDomainDisabled(settings, currentDomain));

      if (settings.serviceMode === "public") {
        setApiStatus("Modo gratuito publico ativo");
        setPlanLabel("Demo publica");
        setLoading(false);
        return;
      }

      const response = (await chrome.runtime.sendMessage({
        type: "PING_API",
        payload: { settings }
      })) as BackgroundResponse<AccountStatus>;

      if (response.ok && response.data) {
        setApiStatus("API privada conectada");
        setPlanLabel(`${response.data.account.plan} · ${response.data.account.name}`);
      } else {
        setApiStatus(response.error ?? "API privada indisponivel");
        setPlanLabel(null);
      }

      setLoading(false);
    };

    void load();
  }, []);

  const handleToggle = async () => {
    const next = await toggleDomain(domain);
    setDisabled(isDomainDisabled(next, domain));
  };

  return (
    <main style={shellStyle}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <section style={{ padding: 16, borderRadius: 18, background: "#111827", color: "#fff" }}>
          <p style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.4 }}>Corretor pt-BR</p>
          <h1 style={{ margin: "10px 0 6px", fontSize: 22 }}>Revisao no navegador</h1>
          <p style={{ margin: 0, color: "#cbd5e1", fontSize: 13 }}>{apiStatus}</p>
          {planLabel ? <p style={{ margin: "8px 0 0", color: "#93c5fd", fontSize: 12 }}>{planLabel}</p> : null}
        </section>

        <section style={{ padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.85)" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: 1 }}>Dominio atual</p>
          <p style={{ margin: "6px 0 12px", fontWeight: 700 }}>{domain}</p>
          <p style={{ margin: 0, color: statusTone, fontWeight: 600 }}>
            {loading ? "Carregando..." : disabled ? "Extensao desativada neste site" : "Extensao ativa neste site"}
          </p>
        </section>

        <button
          type="button"
          onClick={handleToggle}
          style={{
            padding: "12px 14px",
            border: 0,
            borderRadius: 14,
            background: disabled ? "#0f172a" : "#b91c1c",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          {disabled ? "Ativar neste site" : "Desativar neste site"}
        </button>

        <button
          type="button"
          onClick={() => chrome.runtime.openOptionsPage()}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid #cbd5e1",
            background: "#fff",
            color: "#0f172a",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Abrir configuracoes
        </button>
      </div>
    </main>
  );
};

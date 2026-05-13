import { useState } from "react";
import { Icon } from "./Icons";

export function CreateModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [source, setSource] = useState("zip");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && name) onCreate({ name, domain, source });
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <header>
          <h2>Nouveau projet</h2>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={14} /></button>
        </header>

        <div className="modal-body">
          <div className="field">
            <label>Nom du projet</label>
            <input
              className="input lg"
              placeholder="Ex. : Refonte newsletter, audit concurrent…"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <label>Domaine ou URL</label>
            <input
              className="input lg"
              placeholder="exemple.com"
              value={domain}
              onChange={e => setDomain(e.target.value)}
            />
            <div className="hint">Utilisé pour identifier le projet.</div>
          </div>

          <div className="field">
            <label>Source initiale</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { k: "zip",   label: "Importer un ZIP",  desc: "Le site, déjà téléchargé",     icon: "zip" },
                { k: "crawl", label: "Crawler l'URL",    desc: "Téléchargement automatique",    icon: "globe" },
              ].map(o => (
                <div
                  key={o.k}
                  onClick={() => setSource(o.k)}
                  style={{
                    padding: 12, borderRadius: 8,
                    border: `1px solid ${source === o.k ? "var(--text)" : "var(--border)"}`,
                    background: source === o.k ? "var(--surface-2)" : "transparent",
                    cursor: "pointer",
                    boxShadow: source === o.k ? "0 0 0 3px rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <Icon name={o.icon} size={16} />
                    {source === o.k && <Icon name="check" size={13} stroke={2.2} />}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{o.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{o.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button
            className="btn primary"
            disabled={!name.trim()}
            onClick={() => name.trim() && onCreate({ name: name.trim(), domain: domain.trim(), source })}
          >
            Créer le projet <Icon name="arrow-right" size={13} stroke={2} />
          </button>
        </footer>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { Icon } from "./Icons";
import { parseZip, parseHTML } from "../lib/zipParser";

export function UploadZone({ project, onComplete }) {
  const [state, setState] = useState("idle"); // idle | dragging | uploading | done | error
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const zipRef = useRef(null);
  const htmlRef = useRef(null);

  const startParse = async (file) => {
    if (!file) return;
    setState("uploading");
    setProgress(0);
    setLog([]);
    setErrorMsg("");

    const isHTML = file.name.toLowerCase().endsWith(".html") || file.name.toLowerCase().endsWith(".htm");
    const parser = isHTML ? parseHTML : parseZip;

    try {
      const result = await parser(file, (ev) => {
        if (ev.type === "log") setLog(l => [...l, ev.msg]);
        if (ev.type === "progress") setProgress(ev.pct);
      });
      setState("done");
      setTimeout(() => onComplete(result, file), 500);
    } catch (e) {
      setErrorMsg(e.message || "Erreur inconnue lors du parsage.");
      setState("error");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) startParse(file);
    else setState("idle");
  };

  const isHTML = project?.zipName?.endsWith(".html") || project?.zipName?.endsWith(".htm");

  return (
    <div className="main-inner">
      <div className="cat-header">
        <div className="left">
          <h1>Importer le site</h1>
          <p>
            Glissez le <strong>ZIP</strong> du site (wget, HTTrack, export CMS…) ou un fichier <strong>HTML</strong> directement.
            Claude analyse ensuite chaque composant pour reconstituer CSS et animations à la perfection.
          </p>
        </div>
      </div>

      <input ref={zipRef} type="file" accept=".zip,.tar.gz" style={{ display: "none" }} onChange={e => startParse(e.target.files?.[0])} />
      <input ref={htmlRef} type="file" accept=".html,.htm" style={{ display: "none" }} onChange={e => startParse(e.target.files?.[0])} />

      <div
        className={"upload-zone " + (state === "dragging" ? "dragging" : "")}
        onDragOver={e => { e.preventDefault(); if (state === "idle") setState("dragging"); }}
        onDragLeave={() => state === "dragging" && setState("idle")}
        onDrop={handleDrop}
      >
        {state !== "uploading" && state !== "done" && state !== "error" && <>
          <div className="upload-icon"><Icon name="upload" size={22} /></div>
          <h2>{state === "dragging" ? "Déposez pour importer" : "Glissez-déposez votre fichier"}</h2>
          <p style={{ marginBottom: 20 }}>ZIP complet ou fichier HTML standalone</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="btn primary" onClick={() => zipRef.current?.click()}>
              <Icon name="zip" size={13} /> ZIP du site
            </button>
            <button className="btn" onClick={() => htmlRef.current?.click()}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>&lt;/&gt;</span> Fichier HTML
            </button>
          </div>
          <div style={{ marginTop: 24, fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-faint)" }}>
            L'IA analysera automatiquement après l'extraction
          </div>
        </>}

        {state === "error" && <>
          <div className="upload-icon" style={{ color: "var(--danger)" }}><Icon name="close" size={22} /></div>
          <h2 style={{ color: "var(--danger)" }}>Erreur d'import</h2>
          <p>{errorMsg}</p>
          <button className="btn primary" onClick={() => setState("idle")}>Réessayer</button>
        </>}

        {(state === "uploading" || state === "done") && (
          <div className="upload-progress">
            <div className="file-row">
              <div className="file-icon"><Icon name="zip" size={14} /></div>
              <div className="file-info">
                <div className="file-name">{project?.zipName || "fichier"}</div>
                <div className="file-meta">{project?.zipSize || "—"} · {isHTML ? "HTML" : "ZIP"}</div>
              </div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: state === "done" ? "var(--success)" : "var(--accent)", display: "flex", alignItems: "center", gap: 4 }}>
                {state === "done"
                  ? <><Icon name="check" size={13} stroke={2.4} /> Terminé</>
                  : <><Icon name="spinner" size={14} /> {progress}%</>
                }
              </div>
            </div>

            <div className="bar">
              <div className="bar-fill" style={{ width: `${progress}%`, transition: "width 200ms ease" }} />
            </div>

            <div className="progress-meta">
              <span>{state === "done" ? "Extraction terminée — analyse IA en cours…" : "Extraction en cours…"}</span>
              <span>{progress}%</span>
            </div>

            <div className="log">
              {log.slice(-6).map((l, i) => (
                <div key={i}>
                  <span className="at">›</span>{" "}
                  <span className={i < log.slice(-6).length - 1 || state === "done" ? "ok" : ""}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

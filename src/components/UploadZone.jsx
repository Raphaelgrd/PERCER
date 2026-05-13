import { useState, useRef, useEffect } from "react";
import { Icon } from "./Icons";
import { parseZip } from "../lib/zipParser";

export function UploadZone({ project, onComplete }) {
  const [state, setState] = useState("idle"); // idle | dragging | uploading | done | error
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => () => {}, []);

  const startParse = async (file) => {
    if (!file) return;
    setState("uploading");
    setProgress(0);
    setLog([]);
    setErrorMsg("");

    try {
      const result = await parseZip(file, (ev) => {
        if (ev.type === "log") setLog(l => [...l, ev.msg]);
        if (ev.type === "progress") setProgress(ev.pct);
      });

      setState("done");
      setTimeout(() => onComplete(result, file), 600);
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

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) startParse(file);
  };

  return (
    <div className="main-inner">
      <div className="cat-header">
        <div className="left">
          <h1>Importer le site</h1>
          <p>Glissez le ZIP du site téléchargé (wget, HTTrack, export CMS…). PERCER extrait automatiquement les boutons, cards, sections, couleurs, typographies, icônes et plus. Si des animations JS sont trouvées (GSAP, Webflow…), elles sont recréées en CSS pur.</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,.tar.gz"
        style={{ display: "none" }}
        onChange={handleFileInput}
      />

      <div
        className={"upload-zone " + (state === "dragging" ? "dragging" : "")}
        onDragOver={e => { e.preventDefault(); if (state === "idle") setState("dragging"); }}
        onDragLeave={() => state === "dragging" && setState("idle")}
        onDrop={handleDrop}
      >
        {state !== "uploading" && state !== "done" && state !== "error" && <>
          <div className="upload-icon"><Icon name="upload" size={22} /></div>
          <h2>{state === "dragging" ? "Déposez pour importer" : "Glissez-déposez le ZIP du site"}</h2>
          <p>Formats acceptés : .zip, .tar.gz. Taille max recommandée : 200 Mo.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="btn primary" onClick={() => fileInputRef.current?.click()}>
              <Icon name="zip" size={13} /> Sélectionner un fichier
            </button>
            <button className="btn" onClick={() => {}} title="Bientôt disponible">
              <Icon name="globe" size={13} /> Crawler une URL
            </button>
          </div>
          <div style={{ marginTop: 28, fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-faint)" }}>
            Ce projet a un ZIP déjà associé ?{" "}
            <span style={{ color: "var(--accent)", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
              Glissez-le ici
            </span>
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
                <div className="file-name">{project?.zipName || "archive.zip"}</div>
                <div className="file-meta">{project?.zipSize || "—"} · ZIP</div>
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
              <span>{state === "done" ? "Extraction terminée" : "Extraction en cours…"}</span>
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

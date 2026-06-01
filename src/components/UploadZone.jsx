import { useState, useRef } from "react";
import { Icon } from "./Icons";
import { parseZip } from "../lib/zipParser";
import { analyzeHTMLFile } from "../lib/claudeAnalyzer";

export function UploadZone({ project, onComplete, apiKey, onNeedKey }) {
  const [state, setState] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const zipRef = useRef(null);
  const htmlRef = useRef(null);

  const handleZip = async (file) => {
    if (!file) return;
    setState("uploading");
    setProgress(0); setLog([]);
    try {
      const result = await parseZip(file, (ev) => {
        if (ev.type === "log") setLog(l => [...l, ev.msg]);
        if (ev.type === "progress") setProgress(ev.pct);
      });
      setState("done");
      setTimeout(() => onComplete(result, file), 500);
    } catch (e) {
      setErrorMsg(e.message); setState("error");
    }
  };

  const handleHTML = async (file) => {
    if (!file) return;
    if (!apiKey) { onNeedKey?.(() => handleHTML(file)); return; }
    setState("uploading");
    setProgress(30); setLog(["Lecture du HTML…"]);
    try {
      const html = await file.text();
      const elements = await analyzeHTMLFile(html, apiKey, (msg) => {
        setLog(l => [...l, msg]);
        setProgress(p => Math.min(p + 30, 95));
      });
      const total = Object.values(elements).reduce((a, b) => a + b.length, 0);
      setState("done");
      setTimeout(() => onComplete({ elements, css: "", pages: 1, total, detectedLibs: [] }, file), 500);
    } catch (e) {
      setErrorMsg(e.message); setState("error");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return setState("idle");
    const name = file.name.toLowerCase();
    if (name.endsWith(".html") || name.endsWith(".htm")) handleHTML(file);
    else handleZip(file);
  };

  return (
    <div className="main-inner">
      <div className="cat-header">
        <div className="left">
          <h1>Importer le site</h1>
          <p>Glissez un <strong>fichier HTML</strong> — Claude extrait logo, couleurs, typographies et boutons principaux. Ou importez le <strong>ZIP</strong> complet du site.</p>
        </div>
      </div>

      <input ref={zipRef} type="file" accept=".zip" style={{ display: "none" }} onChange={e => handleZip(e.target.files?.[0])} />
      <input ref={htmlRef} type="file" accept=".html,.htm" style={{ display: "none" }} onChange={e => handleHTML(e.target.files?.[0])} />

      <div
        className={"upload-zone " + (state === "dragging" ? "dragging" : "")}
        onDragOver={e => { e.preventDefault(); if (state === "idle") setState("dragging"); }}
        onDragLeave={() => state === "dragging" && setState("idle")}
        onDrop={handleDrop}
      >
        {state !== "uploading" && state !== "done" && state !== "error" && <>
          <div className="upload-icon"><Icon name="upload" size={22} /></div>
          <h2>{state === "dragging" ? "Déposez pour analyser" : "Glissez votre fichier ici"}</h2>
          <p style={{ marginBottom: 20 }}>HTML analysé par Claude · ZIP parsé localement</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="btn primary" onClick={() => htmlRef.current?.click()} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none" }}>
              <span style={{ fontSize: 13 }}>✦</span> Fichier HTML + IA
            </button>
            <button className="btn" onClick={() => zipRef.current?.click()}>
              <Icon name="zip" size={13} /> ZIP complet
            </button>
          </div>
        </>}

        {state === "error" && <>
          <div className="upload-icon" style={{ color: "var(--danger)" }}><Icon name="close" size={22} /></div>
          <h2 style={{ color: "var(--danger)" }}>Erreur</h2>
          <p>{errorMsg}</p>
          <button className="btn primary" onClick={() => setState("idle")}>Réessayer</button>
        </>}

        {(state === "uploading" || state === "done") && (
          <div className="upload-progress">
            <div className="file-row">
              <div className="file-icon"><Icon name="zip" size={14} /></div>
              <div className="file-info">
                <div className="file-name">{project?.zipName || "fichier"}</div>
              </div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: state === "done" ? "var(--success)" : "var(--accent)", display: "flex", alignItems: "center", gap: 4 }}>
                {state === "done" ? <><Icon name="check" size={13} stroke={2.4} /> Terminé</> : <><Icon name="spinner" size={14} /> {progress}%</>}
              </div>
            </div>
            <div className="bar"><div className="bar-fill" style={{ width: `${progress}%`, transition: "width 300ms ease" }} /></div>
            <div className="log">
              {log.slice(-5).map((l, i) => (
                <div key={i}><span className="at">›</span> <span className="ok">{l}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

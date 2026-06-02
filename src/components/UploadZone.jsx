import { useState, useRef } from "react";
import { Icon } from "./Icons";
import { parseZip } from "../lib/zipParser";
import { analyzeHTMLFile, UnreadableSiteError } from "../lib/claudeAnalyzer";

// ─── CORS proxies (tried in order until one works) ──────────────────────────────
const PROXIES = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
];

async function proxyFetch(url) {
  for (const make of PROXIES) {
    try {
      const res = await fetch(make(url));
      if (res.ok) {
        const txt = await res.text();
        if (txt && txt.length > 50) return txt;
      }
    } catch { /* try next proxy */ }
  }
  return "";
}

function resolveURL(base, href) {
  if (!href || href.startsWith("data:")) return null;
  try { return new URL(href, base).href; } catch { return null; }
}

// Detect client-rendered shells (React/Vue/etc.) where the source HTML is empty
function isReadable(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
  const els = doc.body?.querySelectorAll("*").length || 0;
  return text.length > 150 || els > 30;
}

async function fetchFullSite(pageUrl, onLog) {
  onLog?.(`Récupération de ${pageUrl}…`);
  const html = await proxyFetch(pageUrl);
  if (!html) throw new UnreadableSiteError("Le serveur bloque l'accès direct au site.");
  if (!isReadable(html)) {
    throw new UnreadableSiteError("Ce site charge son contenu en JavaScript — la source est vide.");
  }

  const doc = new DOMParser().parseFromString(html, "text/html");

  const cssLinks = [...doc.querySelectorAll('link[rel="stylesheet"]')]
    .map((l) => resolveURL(pageUrl, l.getAttribute("href")))
    .filter(Boolean).slice(0, 6);

  const jsLinks = [...doc.querySelectorAll("script[src]")]
    .map((s) => resolveURL(pageUrl, s.getAttribute("src")))
    .filter((u) => u && !/google|analytics|gtag|facebook|hotjar|crisp|intercom|tagmanager/i.test(u))
    .slice(0, 6);

  onLog?.(`Lecture de ${cssLinks.length} CSS + ${jsLinks.length} JS…`);

  const [cssFiles, jsFiles] = await Promise.all([
    Promise.all(cssLinks.map(proxyFetch)),
    Promise.all(jsLinks.map(proxyFetch)),
  ]);

  const inlineCSS = [...doc.querySelectorAll("style")].map((s) => s.textContent).join("\n");
  const inlineJS = [...doc.querySelectorAll("script:not([src])")].map((s) => s.textContent).join("\n");

  return {
    html,
    css: [inlineCSS, ...cssFiles].filter(Boolean).join("\n\n").slice(0, 120000),
    js: [inlineJS, ...jsFiles].filter(Boolean).join("\n\n").slice(0, 60000),
  };
}

// ─── Component ──────────────────────────────────────────────────────────────────
export function UploadZone({ project, onComplete, apiKey, onNeedKey }) {
  const [state, setState] = useState("idle"); // idle | dragging | uploading | done | error
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [canFallback, setCanFallback] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const zipRef = useRef(null);
  const htmlRef = useRef(null);

  const getKey = () => apiKey || localStorage.getItem("percer_api_key") || "";

  const fail = (e) => {
    setErrorMsg(e.message || "Erreur inconnue");
    setCanFallback(e instanceof UnreadableSiteError);
    setState("error");
  };

  // ── ZIP (local parsing, no AI) ──
  const handleZip = async (file) => {
    if (!file) return;
    setState("uploading"); setProgress(0); setLog([]); setCanFallback(false);
    try {
      const result = await parseZip(file, (ev) => {
        if (ev.type === "log") setLog((l) => [...l, ev.msg]);
        if (ev.type === "progress") setProgress(ev.pct);
      });
      setState("done");
      setTimeout(() => onComplete(result, file), 500);
    } catch (e) { fail(e); }
  };

  // ── Send a {html,css,js} site to Claude ──
  const analyzeSite = async (site, name, baseUrl) => {
    const elements = await analyzeHTMLFile(site, getKey(), (msg) => {
      setLog((l) => [...l, msg]);
      setProgress((p) => Math.min(p + 18, 95));
    }, baseUrl);
    const total = Object.values(elements).reduce((a, b) => a + b.length, 0);
    if (total === 0) throw new UnreadableSiteError("Aucun composant exploitable trouvé.");
    setState("done");
    const fakeFile = { name, size: site.html.length };
    setTimeout(() => onComplete({ elements, css: site.css, pages: 1, total, detectedLibs: [] }, fakeFile), 500);
  };

  // ── URL → fetch everything → Claude ──
  const handleURL = async () => {
    let url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    if (!getKey()) { onNeedKey?.(); return; }

    setState("uploading"); setProgress(5); setLog([]); setCanFallback(false);
    try {
      const site = await fetchFullSite(url, (msg) => {
        setLog((l) => [...l, msg]);
        setProgress((p) => Math.min(p + 10, 40));
      });
      const kb = (site.html.length + site.css.length + site.js.length) / 1024;
      setLog((l) => [...l, `${kb.toFixed(0)} Ko lus (HTML + CSS + JS)`]);
      setProgress(45);
      await analyzeSite(site, new URL(url).hostname, url);
    } catch (e) { fail(e); }
  };

  // ── Standalone HTML file → Claude ──
  const handleHTMLFile = async (file) => {
    if (!file) return;
    if (!getKey()) { onNeedKey?.(); return; }
    setState("uploading"); setProgress(20); setLog(["Lecture du fichier HTML…"]); setCanFallback(false);
    try {
      const html = await file.text();
      await analyzeSite({ html, css: "", js: "" }, file.name, "");
    } catch (e) { fail(e); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return setState("idle");
    const name = file.name.toLowerCase();
    if (name.endsWith(".html") || name.endsWith(".htm")) handleHTMLFile(file);
    else handleZip(file);
  };

  return (
    <div className="main-inner">
      <div className="cat-header">
        <div className="left">
          <h1>Importer le site</h1>
          <p>
            Collez l'URL d'un site — Claude lit le <strong>HTML, le CSS et le JS</strong> et reproduit
            au pixel près le logo, les couleurs, les typographies et les boutons principaux.
          </p>
        </div>
      </div>

      <input ref={zipRef} type="file" accept=".zip" style={{ display: "none" }} onChange={(e) => handleZip(e.target.files?.[0])} />
      <input ref={htmlRef} type="file" accept=".html,.htm" style={{ display: "none" }} onChange={(e) => handleHTMLFile(e.target.files?.[0])} />

      <div
        className={"upload-zone " + (state === "dragging" ? "dragging" : "")}
        onDragOver={(e) => { e.preventDefault(); if (state === "idle") setState("dragging"); }}
        onDragLeave={() => state === "dragging" && setState("idle")}
        onDrop={handleDrop}
      >
        {state !== "uploading" && state !== "done" && state !== "error" && (
          <>
            <div className="upload-icon"><Icon name="globe" size={22} /></div>
            <h2>{state === "dragging" ? "Déposez un fichier" : "Collez l'URL du site"}</h2>

            <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 480, margin: "16px auto 0" }}>
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleURL()}
                placeholder="https://exemple.com"
                style={{
                  flex: 1, background: "var(--bg)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "10px 14px", fontFamily: "JetBrains Mono",
                  fontSize: 12, color: "var(--text)", outline: "none",
                }}
              />
              <button
                className="btn primary"
                onClick={handleURL}
                disabled={!urlInput.trim()}
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", whiteSpace: "nowrap" }}
              >
                <span style={{ fontSize: 13 }}>✦</span> Analyser
              </button>
            </div>

            <div style={{ margin: "20px 0", color: "var(--text-faint)", fontSize: 11, fontFamily: "JetBrains Mono" }}>— ou —</div>

            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="btn ghost sm" onClick={() => htmlRef.current?.click()}>&lt;/&gt; Fichier HTML</button>
              <button className="btn ghost sm" onClick={() => zipRef.current?.click()}><Icon name="zip" size={12} /> ZIP</button>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <div className="upload-icon" style={{ color: canFallback ? "var(--accent)" : "var(--danger)" }}>
              <Icon name={canFallback ? "zip" : "close"} size={22} />
            </div>
            <h2 style={{ color: canFallback ? "var(--text)" : "var(--danger)" }}>
              {canFallback ? "Lecture directe impossible" : "Erreur"}
            </h2>
            <p style={{ maxWidth: 420 }}>
              {errorMsg}
              {canFallback && " Téléchargez le site en ZIP (ex : avec l'extension « SingleFile » ou HTTrack) puis déposez-le ici — l'analyse IA fonctionnera dessus."}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
              {canFallback && (
                <button className="btn primary" onClick={() => zipRef.current?.click()} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none" }}>
                  <Icon name="zip" size={13} /> Importer un ZIP
                </button>
              )}
              <button className="btn" onClick={() => setState("idle")}>Réessayer</button>
            </div>
          </>
        )}

        {(state === "uploading" || state === "done") && (
          <div className="upload-progress">
            <div className="file-row">
              <div className="file-icon"><Icon name="globe" size={14} /></div>
              <div className="file-info">
                <div className="file-name">{urlInput || project?.zipName || "analyse en cours"}</div>
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

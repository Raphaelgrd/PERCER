import { useState, useCallback, useEffect, useRef } from "react";
import { Icon } from "./Icons";
import { renderElementInteractive, codeFor } from "./ElementRenderers";
import { PropertyEditor } from "./PropertyEditor";

function buildSrcdoc(html, css, js) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;}
body{margin:0;padding:24px;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Instrument Sans',sans-serif;background:#fff;}
${css || ""}
</style>
</head>
<body>
${html || ""}
${js ? `<script>${js}<\/script>` : ""}
</body>
</html>`;
}

// ─── Pill toggle ───────────────────────────────────────────────────────────────
function ModeToggle({ mode, onChange }) {
  return (
    <div style={{ display: "flex", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: 2, gap: 2 }}>
      {["visuel", "code"].map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: "3px 10px",
            fontSize: 10,
            fontFamily: "JetBrains Mono",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            background: mode === m ? "var(--surface)" : "transparent",
            color: mode === m ? "var(--text)" : "var(--text-muted)",
            fontWeight: mode === m ? 600 : 400,
            boxShadow: mode === m ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            transition: "all 0.12s",
          }}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

// ─── Live preview iframe ────────────────────────────────────────────────────────
function LivePreview({ srcdoc, elementId }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderTop: "1px solid var(--border)" }}>
      <div style={{
        padding: "5px 12px",
        fontSize: 9,
        fontFamily: "JetBrains Mono",
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        background: "var(--surface)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: "#4ade80", display: "inline-block" }} />
        Aperçu live
      </div>
      <iframe
        key={elementId}
        srcDoc={srcdoc}
        sandbox="allow-scripts"
        style={{ flex: 1, border: "none", width: "100%", background: "#fff" }}
        title="live preview"
      />
    </div>
  );
}

// ─── Code section sub-tabs ─────────────────────────────────────────────────────
const CODE_SECTIONS = [
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "js", label: "JS" },
];

// ─── Main ──────────────────────────────────────────────────────────────────────
export function DetailPanel({ element, onClose, onSave }) {
  const [tab, setTab] = useState("preview");
  const [copied, setCopied] = useState(null);

  // Edit state
  const [editMode, setEditMode] = useState("visuel");
  const [editSection, setEditSection] = useState("css");
  const [editedHtml, setEditedHtml] = useState("");
  const [editedCss, setEditedCss]   = useState("");
  const [editedJs, setEditedJs]     = useState("");
  const [srcdoc, setSrcdoc]         = useState("");
  const [saved, setSaved]           = useState(false);
  const debounceRef = useRef(null);

  // Reset when element changes — pull code from codeFor() so demo elements are populated too
  useEffect(() => {
    if (!element) return;
    const parts = codeFor(element);
    const html = parts.find(p => p.label === "HTML")?.code       || element.html || "";
    const css  = parts.find(p => p.label === "CSS")?.code        || element.css  || "";
    const js   = parts.find(p => p.label === "JavaScript")?.code || element.js   || "";
    setEditedHtml(html);
    setEditedCss(css);
    setEditedJs(js);
    setSrcdoc(buildSrcdoc(html, css, js));
    setSaved(false);
  }, [element?.id]);

  // Debounced live preview
  useEffect(() => {
    if (tab !== "éditer") return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSrcdoc(buildSrcdoc(editedHtml, editedCss, editedJs));
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [editedHtml, editedCss, editedJs, tab]);

  const copyCode = useCallback((code, label) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(label); setTimeout(() => setCopied(null), 1600);
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = code; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      setCopied(label); setTimeout(() => setCopied(null), 1600);
    });
  }, []);

  const copyAll = useCallback(() => {
    const blocks = codeFor(element);
    const all = blocks.map(b => `/* === ${b.label} === */\n${b.code}`).join("\n\n");
    copyCode(all, "all");
  }, [element, copyCode]);

  const handleSave = useCallback(() => {
    if (!onSave) return;
    onSave({ ...element, html: editedHtml, css: editedCss, js: editedJs });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }, [element, editedHtml, editedCss, editedJs, onSave]);

  const handleReset = useCallback(() => {
    setEditedHtml(element.html || "");
    setEditedCss(element.css   || "");
    setEditedJs(element.js     || "");
  }, [element]);

  if (!element) return null;

  const codeParts = codeFor(element);
  const editValue    = editSection === "html" ? editedHtml : editSection === "css" ? editedCss : editedJs;
  const setEditValue = editSection === "html" ? setEditedHtml : editSection === "css" ? setEditedCss : setEditedJs;

  return (
    <aside className="detail">

      {/* ── Header ── */}
      <div className="detail-head">
        <div>
          <div className="name">{element.name}</div>
          <div className="src">
            détecté dans <span style={{ color: "var(--accent)" }}>{element.src}</span>
            {element.notes && (
              <span style={{ marginLeft: 8, background: "var(--accent-soft)", color: "var(--accent-strong)", padding: "1px 6px", borderRadius: 3, fontSize: 10, fontFamily: "JetBrains Mono" }}>
                CSS pur
              </span>
            )}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="close" size={14} /></button>
      </div>

      {/* ── Tabs ── */}
      <div className="detail-tabs">
        {["preview", "code", "éditer", "infos"].map(t => (
          <div key={t} className={"detail-tab " + (tab === t ? "active" : "")} onClick={() => setTab(t)}>{t}</div>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="detail-body">

        {/* Preview tab */}
        {tab === "preview" && (
          <>
            <div className="detail-preview">
              {renderElementInteractive(element)}
            </div>
            <div className="detail-meta">
              <div className="k">Type</div>
              <div className="v mono">{element.variant?.kind || element.category}</div>
              <div className="k">Source</div>
              <div className="v mono">{element.src}</div>
              <div className="k">Catégorie</div>
              <div className="v">{element.category}</div>
              {element.notes && <>
                <div className="k">Notes</div>
                <div className="v" style={{ fontSize: 12, color: "var(--text-muted)" }}>{element.notes}</div>
              </>}
            </div>
          </>
        )}

        {/* Code tab */}
        {tab === "code" && (
          <div>
            {codeParts.map((part, i) => (
              <div key={i} className="code-section">
                <div className="code-section-title">{part.label}</div>
                <div className="code-block">
                  <button className="copy-btn" onClick={() => copyCode(part.code, part.label)}>
                    {copied === part.label
                      ? <><Icon name="check" size={11} stroke={2.4} /> Copié</>
                      : <><Icon name="copy" size={11} /> Copier</>
                    }
                  </button>
                  {part.code}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Éditer tab */}
        {tab === "éditer" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

            {/* Mode toggle bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 14px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
              <ModeToggle mode={editMode} onChange={setEditMode} />
            </div>

            {/* Visuel mode */}
            {editMode === "visuel" && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                <div style={{ flex: "0 0 58%", overflowY: "auto", borderBottom: "1px solid var(--border)" }}>
                  <PropertyEditor css={editedCss} html={editedHtml} onChange={setEditedCss} />
                </div>
                <LivePreview srcdoc={srcdoc} elementId={element.id} />
              </div>
            )}

            {/* Code mode */}
            {editMode === "code" && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                {/* Section sub-tabs */}
                <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
                  {CODE_SECTIONS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setEditSection(s.id)}
                      style={{
                        padding: "6px 14px",
                        fontSize: 10,
                        fontFamily: "JetBrains Mono",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        border: "none",
                        borderBottom: editSection === s.id ? "2px solid var(--accent)" : "2px solid transparent",
                        cursor: "pointer",
                        background: "transparent",
                        color: editSection === s.id ? "var(--text)" : "var(--text-muted)",
                        fontWeight: editSection === s.id ? 600 : 400,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {/* Textarea */}
                <textarea
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  spellCheck={false}
                  style={{
                    flex: "0 0 48%",
                    resize: "none",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    padding: "12px 14px",
                    fontFamily: "JetBrains Mono",
                    fontSize: 11,
                    lineHeight: 1.65,
                    color: "var(--text)",
                    background: "var(--bg)",
                    outline: "none",
                    width: "100%",
                  }}
                />
                <LivePreview srcdoc={srcdoc} elementId={element.id} />
              </div>
            )}
          </div>
        )}

        {/* Infos tab */}
        {tab === "infos" && (
          <div className="detail-meta">
            <div className="k">Nom</div><div className="v">{element.name}</div>
            <div className="k">ID</div><div className="v mono">elem_{element.id}</div>
            <div className="k">Source</div><div className="v mono">{element.src}</div>
            <div className="k">Catégorie</div><div className="v">{element.category}</div>
            <div className="k">Type</div><div className="v mono">{element.variant?.kind || "—"}</div>
            {element.css && <>
              <div className="k">CSS</div>
              <div className="v" style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>
                {element.css.slice(0, 100).trim()}{element.css.length > 100 ? "…" : ""}
              </div>
            </>}
            {element.notes && <>
              <div className="k">Notes</div>
              <div className="v" style={{ fontSize: 12, color: "var(--text-muted)" }}>{element.notes}</div>
            </>}
            <div className="k">Tags</div>
            <div className="v">
              <span className="chip solid">{element.category}</span>
              {element.notes && <> <span className="chip">css-pur</span></>}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="detail-foot">
        {tab === "éditer" ? (
          <>
            <button className="btn ghost sm" onClick={handleReset}>Réinitialiser</button>
            <div style={{ flex: 1 }} />
            <button className="btn primary" onClick={handleSave} disabled={!onSave}>
              {saved
                ? <><Icon name="check" size={13} stroke={2.4} /> Sauvegardé</>
                : <><Icon name="check" size={13} /> Sauvegarder</>
              }
            </button>
          </>
        ) : (
          <>
            <button className="btn primary" onClick={copyAll}>
              {copied === "all"
                ? <><Icon name="check" size={13} stroke={2.4} /> Copié</>
                : <><Icon name="copy" size={13} /> Copier tout</>
              }
            </button>
            <div style={{ flex: 1 }} />
            <button className="icon-btn"><Icon name="more" size={15} /></button>
          </>
        )}
      </div>
    </aside>
  );
}

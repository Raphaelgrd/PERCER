import { useState, useRef } from "react";
import { ColorSwatch, hexToRgb, rgbToHex } from "./ColorPicker";

// ── CSS utilities ───────────────────────────────────────────────────────────────

function resolveVars(css) {
  if (!css) return css;
  const vars = {};
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;}\n]+)/g)) {
    if (!vars[m[1]]) vars[m[1]] = m[2].trim();
  }
  if (!Object.keys(vars).length) return css;
  return css.replace(/var\((--[\w-]+)\)/g, (_, name) => vars[name] || _);
}

function getDecl(css, prop) {
  if (!css) return null;
  for (const line of css.split("\n")) {
    const t = line.trim().replace(/;$/, "");
    const colon = t.indexOf(":");
    if (colon === -1) continue;
    const key = t.slice(0, colon).trim();
    if (key === prop) return t.slice(colon + 1).trim();
  }
  return null;
}

function setDecl(css, prop, newVal) {
  if (!css) return css;
  const lines = css.split("\n");
  let replaced = false;
  const result = lines.map(line => {
    const t = line.trim().replace(/;$/, "");
    const colon = t.indexOf(":");
    if (colon === -1) return line;
    const key = t.slice(0, colon).trim();
    if (key === prop) {
      replaced = true;
      return line.replace(/:.+$/, `: ${newVal};`).replace(/;;$/, ";");
    }
    return line;
  });
  return replaced ? result.join("\n") : css;
}

function replaceColor(css, oldColor, newColor) {
  return css.split(oldColor).join(newColor);
}

function colorFromVal(val) {
  if (!val) return null;
  const hexM = val.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/);
  if (hexM) {
    const h = hexM[0];
    return h.length === 4 ? "#" + h[1]+h[1]+h[2]+h[2]+h[3]+h[3] : h.toLowerCase();
  }
  const rgbM = val.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbM) return rgbToHex(+rgbM[1], +rgbM[2], +rgbM[3]);
  return null;
}

function numFromVal(val) {
  if (!val) return null;
  const m = String(val).match(/^(-?[\d.]+)(px|em|rem|%|vh|vw)?/);
  if (!m) return null;
  return { value: parseFloat(m[1]), unit: m[2] || "px" };
}

function parsePadding(css) {
  const val = getDecl(css, "padding");
  if (!val) return null;
  const parts = val.trim().split(/\s+/).map(p => parseFloat(p) || 0);
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]];
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]];
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]];
  return parts.slice(0, 4);
}

function updatePadding(css, values) {
  const [t,r,b,l] = values;
  const same = t===r && r===b && b===l;
  const val = same ? `${t}px` : `${t}px ${r}px ${b}px ${l}px`;
  return setDecl(css, "padding", val);
}

function parseBorderRadius(css) {
  const val = getDecl(css, "border-radius");
  if (!val) return null;
  const parts = val.trim().split(/\s+/).map(p => parseFloat(p) || 0);
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]];
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]];
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]];
  return parts.slice(0, 4);
}

function updateBorderRadius(css, values) {
  const [tl,tr,br,bl] = values;
  const same = tl===tr && tr===br && br===bl;
  const val = same ? `${tl}px` : `${tl}px ${tr}px ${br}px ${bl}px`;
  return setDecl(css, "border-radius", val);
}

// ── ScrubInput ──────────────────────────────────────────────────────────────────

function ScrubInput({ value, unit = "", min = 0, max = 9999, step = 1, onChange, width = 56 }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const dragging = useRef(false);
  const moved = useRef(false);
  const startX = useRef(0);
  const startVal = useRef(0);

  const fmt = v => {
    if (step < 0.01) return v.toFixed(3);
    if (step < 0.1)  return v.toFixed(2);
    if (step < 1)    return v.toFixed(1);
    return String(Math.round(v));
  };

  const commit = raw => {
    const n = parseFloat(raw);
    if (!isNaN(n)) onChange(Math.max(min, Math.min(max, step < 1 ? Math.round(n/step)*step : Math.round(n))));
  };

  if (editing) return (
    <input
      autoFocus
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => { commit(draft); setEditing(false); }}
      onKeyDown={e => {
        if (e.key === "Enter")     { commit(draft); setEditing(false); }
        if (e.key === "Escape")    { setEditing(false); }
        if (e.key === "ArrowUp")   { e.preventDefault(); const v = parseFloat(draft||"0")+step; setDraft(fmt(v)); }
        if (e.key === "ArrowDown") { e.preventDefault(); const v = parseFloat(draft||"0")-step; setDraft(fmt(v)); }
      }}
      style={{
        width, fontFamily: "JetBrains Mono", fontSize: 11, textAlign: "center",
        background: "var(--bg)", border: "1.5px solid var(--accent)",
        borderRadius: 4, padding: "3px 4px", color: "var(--text)", outline: "none",
      }}
    />
  );

  return (
    <div
      style={{
        width, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text)",
        background: "var(--bg)", border: "1px solid var(--border)",
        borderRadius: 4, cursor: "ew-resize", userSelect: "none",
        gap: 1,
      }}
      onClick={() => {
        if (moved.current) { moved.current = false; return; }
        setDraft(fmt(value));
        setEditing(true);
      }}
      onPointerDown={e => {
        startX.current = e.clientX;
        startVal.current = value;
        moved.current = false;
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.preventDefault();
      }}
      onPointerMove={e => {
        if (!dragging.current) return;
        const delta = e.clientX - startX.current;
        if (Math.abs(delta) > 2) moved.current = true;
        const sens = e.shiftKey ? step * 10 : step;
        const newVal = Math.max(min, Math.min(max, startVal.current + delta * sens));
        onChange(step < 1 ? Math.round(newVal/step)*step : Math.round(newVal));
      }}
      onPointerUp={() => { dragging.current = false; }}
    >
      <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{unit && fmt(value)}</span>
      {unit ? <span style={{ color: "var(--text-muted)", fontSize: 9 }}>{unit}</span> : fmt(value)}
    </div>
  );
}

// ── Layout primitives ───────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <div style={{
        display: "flex", alignItems: "center", padding: "7px 14px 5px",
        gap: 8,
      }}>
        <span style={{
          fontSize: 9, fontFamily: "JetBrains Mono", textTransform: "uppercase",
          letterSpacing: "0.08em", color: "var(--text-muted)", whiteSpace: "nowrap",
        }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>
      <div style={{ padding: "0 14px 10px" }}>{children}</div>
    </div>
  );
}

function Row({ children, gap = 6 }) {
  return <div style={{ display: "flex", alignItems: "center", gap, marginBottom: 5 }}>{children}</div>;
}

function Label({ children, width = 56 }) {
  return (
    <span style={{
      fontSize: 10, color: "var(--text-muted)", fontFamily: "JetBrains Mono",
      width, flexShrink: 0, userSelect: "none",
    }}>{children}</span>
  );
}

// Full-width color pill (like Framer's fill row)
function ColorPill({ label, hex, originalHex, onColorChange }) {
  if (!hex) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: "var(--bg)", border: "1px solid var(--border)",
      borderRadius: 5, padding: "4px 8px", marginBottom: 5, cursor: "pointer",
    }}>
      <ColorSwatch hex={hex} onChange={onColorChange} size={16} radius={3} />
      <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text)", flex: 1 }}>{hex}</span>
      <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

// ── Align buttons ───────────────────────────────────────────────────────────────

const ALIGN_ICONS = {
  left: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="2" width="10" height="1.5" rx=".75" fill="currentColor"/>
      <rect x="1" y="5.25" width="6" height="1.5" rx=".75" fill="currentColor"/>
      <rect x="1" y="8.5" width="8" height="1.5" rx=".75" fill="currentColor"/>
    </svg>
  ),
  center: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="2" width="10" height="1.5" rx=".75" fill="currentColor"/>
      <rect x="3" y="5.25" width="6" height="1.5" rx=".75" fill="currentColor"/>
      <rect x="2" y="8.5" width="8" height="1.5" rx=".75" fill="currentColor"/>
    </svg>
  ),
  right: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="2" width="10" height="1.5" rx=".75" fill="currentColor"/>
      <rect x="5" y="5.25" width="6" height="1.5" rx=".75" fill="currentColor"/>
      <rect x="3" y="8.5" width="8" height="1.5" rx=".75" fill="currentColor"/>
    </svg>
  ),
};

function AlignButtons({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {["left", "center", "right"].map(a => (
        <button key={a} onClick={() => onChange(a)} style={{
          width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer",
          background: value === a ? "var(--accent-soft)" : "var(--bg)",
          color: value === a ? "var(--accent-strong)" : "var(--text-muted)",
        }}>{ALIGN_ICONS[a]}</button>
      ))}
    </div>
  );
}

// ── Corner radius widget ────────────────────────────────────────────────────────

function CornerRadius({ values, onChange }) {
  const [tl,tr,br,bl] = values;
  const same = tl===tr && tr===br && br===bl;
  const [linked, setLinked] = useState(same);

  const update = (idx, v) => {
    const next = [...values];
    if (linked) onChange([v,v,v,v]);
    else { next[idx] = v; onChange(next); }
  };

  const W = 44;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", gridTemplateRows: "26px 26px", gap: 4, alignItems: "center" }}>
        <ScrubInput value={tl} min={0} max={999} step={1} width={W} onChange={v=>update(0,v)} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button onClick={() => setLinked(l=>!l)} title={linked ? "Séparer" : "Lier"} style={{
            width: 20, height: 20, border: "1px solid var(--border)", borderRadius: 4,
            background: linked ? "var(--accent-soft)" : "var(--bg)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: linked ? "var(--accent-strong)" : "var(--text-muted)",
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 5h4M5 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <ScrubInput value={tr} min={0} max={999} step={1} width={W} onChange={v=>update(1,v)} />
        <ScrubInput value={bl} min={0} max={999} step={1} width={W} onChange={v=>update(3,v)} />
        <div />
        <ScrubInput value={br} min={0} max={999} step={1} width={W} onChange={v=>update(2,v)} />
      </div>
      <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "JetBrains Mono", textAlign: "center", marginTop: 2 }}>
        ↖ ↗ ↙ ↘
      </div>
    </div>
  );
}

// ── Padding widget ──────────────────────────────────────────────────────────────

function PaddingWidget({ values, onChange }) {
  const [t,r,b,l] = values;
  const W = 46;

  const update = (idx, v) => {
    const next = [...values];
    next[idx] = v;
    onChange(next);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 46px 1fr", gridTemplateRows: "26px 26px 26px", gap: 4, alignItems: "center" }}>
        <div />
        <ScrubInput value={t} min={0} max={999} step={1} width={W} onChange={v=>update(0,v)} />
        <div />
        <ScrubInput value={l} min={0} max={999} step={1} width={W} onChange={v=>update(3,v)} />
        <div style={{ height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 20, height: 20, border: "1.5px dashed var(--border)", borderRadius: 3 }} />
        </div>
        <ScrubInput value={r} min={0} max={999} step={1} width={W} onChange={v=>update(1,v)} />
        <div />
        <ScrubInput value={b} min={0} max={999} step={1} width={W} onChange={v=>update(2,v)} />
        <div />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 46px 1fr", fontSize: 9, color: "var(--text-muted)", fontFamily: "JetBrains Mono", textAlign: "center", marginTop: 2 }}>
        <div />↑  R  ↓<div />
      </div>
    </div>
  );
}

// ── Select input ────────────────────────────────────────────────────────────────

function PropSelect({ value, options, labels, onChange, width }) {
  return (
    <select
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      style={{
        width, height: 26, fontFamily: "JetBrains Mono", fontSize: 10,
        border: "1px solid var(--border)", borderRadius: 4,
        padding: "0 6px", background: "var(--bg)", color: "var(--text)",
        cursor: "pointer", outline: "none",
      }}
    >
      {options.map((o, i) => <option key={o} value={o}>{labels ? labels[i] : o}</option>)}
    </select>
  );
}

// ── Main PropertyEditor ─────────────────────────────────────────────────────────

export function PropertyEditor({ css: rawCss, html, onChange }) {
  const css = resolveVars(rawCss);

  if (!css) return (
    <div style={{ padding: 32, color: "var(--text-muted)", fontSize: 12, textAlign: "center", fontFamily: "JetBrains Mono" }}>
      Aucun CSS à éditer
    </div>
  );

  // ── Parse ──────────────────────────────────────────────────────────────────────
  const bgVal         = getDecl(css, "background-color") || getDecl(css, "background");
  const bgColor       = colorFromVal(bgVal);
  const bgOriginal    = bgColor ? (bgVal?.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)/)?.[0] || bgColor) : null;

  const textVal       = getDecl(css, "color");
  const textColor     = colorFromVal(textVal);
  const textOriginal  = textColor ? (textVal?.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)/)?.[0] || textColor) : null;

  const borderVal     = getDecl(css, "border");
  const borderColorVal = getDecl(css, "border-color");
  const borderColor   = colorFromVal(borderColorVal) || colorFromVal(borderVal);
  const borderW       = numFromVal(getDecl(css, "border-width")) || numFromVal(borderVal?.match(/[\d.]+px/)?.[0]);

  const radValues     = parseBorderRadius(css);
  const padValues     = parsePadding(css);

  const fontFamily    = getDecl(css, "font-family")?.split(",")[0].replace(/["']/g, "").trim();
  const fontSizeN     = numFromVal(getDecl(css, "font-size"));
  const fontWeightV   = getDecl(css, "font-weight");
  const letterSpN     = numFromVal(getDecl(css, "letter-spacing"));
  const lineHeightN   = numFromVal(getDecl(css, "line-height"));
  const textAlignV    = getDecl(css, "text-align");
  const textTransV    = getDecl(css, "text-transform");

  const opacityN      = numFromVal(getDecl(css, "opacity"));

  const hasTypo = fontFamily || fontSizeN || fontWeightV || letterSpN || lineHeightN || textAlignV;

  // ── Update helpers ─────────────────────────────────────────────────────────────

  const updateBgColor = (newHex) => {
    if (bgOriginal) onChange(replaceColor(css, bgOriginal, newHex));
  };
  const updateTextColor = (newHex) => {
    if (textOriginal) onChange(replaceColor(css, textOriginal, newHex));
  };
  const updateBorderColor = (newHex) => {
    const orig = borderColor ? (borderColorVal?.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)/)?.[0] || borderColor) : null;
    if (orig) onChange(replaceColor(css, orig, newHex));
  };

  const upd = (prop, val) => onChange(setDecl(css, prop, val));

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ overflowY: "auto", flex: 1, paddingBottom: 24 }}>

      {/* Fill */}
      {bgColor && (
        <Section title="Remplissage">
          <ColorPill
            label="fond"
            hex={bgColor}
            onColorChange={updateBgColor}
          />
        </Section>
      )}

      {/* Text color */}
      {textColor && (
        <Section title="Couleur du texte">
          <ColorPill
            label="texte"
            hex={textColor}
            onColorChange={updateTextColor}
          />
        </Section>
      )}

      {/* Typography */}
      {hasTypo && (
        <Section title="Typographie">
          {fontFamily && (
            <Row>
              <div style={{
                flex: 1, height: 26, background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: 4, padding: "0 8px", display: "flex", alignItems: "center",
                fontFamily: fontFamily + ", sans-serif", fontSize: 12, color: "var(--text)",
                overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
              }}>
                {fontFamily}
              </div>
            </Row>
          )}
          <Row>
            {fontSizeN && (
              <>
                <Label width={28}>Taille</Label>
                <ScrubInput value={fontSizeN.value} unit="px" min={6} max={200} step={1} width={56}
                  onChange={v => upd("font-size", `${v}px`)} />
              </>
            )}
            {fontWeightV && (
              <>
                <Label width={34}>Graisse</Label>
                <PropSelect
                  value={fontWeightV}
                  options={["100","200","300","400","500","600","700","800","900"]}
                  labels={["100","200","300","400","500","600","700","800","900"]}
                  onChange={v => upd("font-weight", v)}
                  width={64}
                />
              </>
            )}
          </Row>
          <Row>
            {lineHeightN && (
              <>
                <Label width={28}>L</Label>
                <ScrubInput value={lineHeightN.value} unit={lineHeightN.unit} min={0.5} max={4} step={0.05} width={56}
                  onChange={v => upd("line-height", `${v.toFixed(2)}${lineHeightN.unit}`)} />
              </>
            )}
            {letterSpN && (
              <>
                <Label width={28}>AV</Label>
                <ScrubInput value={letterSpN.value} unit={letterSpN.unit} min={-0.2} max={1} step={0.01} width={60}
                  onChange={v => upd("letter-spacing", `${v.toFixed(2)}${letterSpN.unit}`)} />
              </>
            )}
          </Row>
          <Row>
            {textAlignV && (
              <>
                <Label>Align</Label>
                <AlignButtons value={textAlignV} onChange={v => upd("text-align", v)} />
              </>
            )}
            {textTransV && (
              <PropSelect
                value={textTransV}
                options={["none","uppercase","lowercase","capitalize"]}
                labels={["Aa Normal","AA Caps","aa min","Aa Capitalize"]}
                onChange={v => upd("text-transform", v)}
                width={110}
              />
            )}
          </Row>
        </Section>
      )}

      {/* Border */}
      {(borderColor || radValues) && (
        <Section title="Contour">
          {borderColor && (
            <Row>
              <ColorSwatch hex={borderColor} onChange={updateBorderColor} size={16} radius={3} />
              <Label width={44}>Couleur</Label>
              {borderW && (
                <>
                  <Label width={32}>Larg.</Label>
                  <ScrubInput value={borderW.value} unit="px" min={0} max={20} step={1} width={52}
                    onChange={v => upd("border-width", `${v}px`)} />
                </>
              )}
            </Row>
          )}
          {radValues && (
            <>
              <div style={{ marginBottom: 4, fontSize: 10, color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>Rayon des coins</div>
              <CornerRadius
                values={radValues}
                onChange={next => onChange(updateBorderRadius(css, next))}
              />
            </>
          )}
        </Section>
      )}

      {/* Spacing */}
      {padValues && (
        <Section title="Espacement">
          <div style={{ marginBottom: 4, fontSize: 10, color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>Padding</div>
          <PaddingWidget
            values={padValues}
            onChange={next => onChange(updatePadding(css, next))}
          />
        </Section>
      )}

      {/* Effects */}
      {opacityN && (
        <Section title="Effets">
          <Row>
            <Label>Opacité</Label>
            <ScrubInput value={Math.round(opacityN.value * 100)} unit="%" min={0} max={100} step={1} width={60}
              onChange={v => upd("opacity", (v / 100).toFixed(2))} />
          </Row>
        </Section>
      )}

      {!bgColor && !textColor && !hasTypo && !borderColor && !radValues && !padValues && !opacityN && (
        <div style={{ padding: "32px 16px", color: "var(--text-muted)", fontSize: 11, textAlign: "center", fontFamily: "JetBrains Mono", lineHeight: 1.6 }}>
          Aucune propriété reconnue.<br/>Essayez l'onglet Code pour éditer manuellement.
        </div>
      )}
    </div>
  );
}

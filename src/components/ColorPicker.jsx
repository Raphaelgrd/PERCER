import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

// ── Color math ─────────────────────────────────────────────────────────────────

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  return [parseInt(f.slice(0,2),16), parseInt(f.slice(2,4),16), parseInt(f.slice(4,6),16)];
}

export function rgbToHex(r, g, b) {
  return "#" + [r,g,b].map(n => Math.round(Math.max(0,Math.min(255,n))).toString(16).padStart(2,"0")).join("");
}

function rgbToHsv(r, g, b) {
  r/=255; g/=255; b/=255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
  let h=0, s=mx===0?0:d/mx, v=mx;
  if (d) switch (mx) {
    case r: h=((g-b)/d+(g<b?6:0))/6; break;
    case g: h=((b-r)/d+2)/6; break;
    case b: h=((r-g)/d+4)/6; break;
  }
  return [h*360, s*100, v*100];
}

function hsvToRgb(h, s, v) {
  h/=360; s/=100; v/=100;
  const i=Math.floor(h*6), f=h*6-i;
  const p=v*(1-s), q=v*(1-f*s), t=v*(1-(1-f)*s);
  const m=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];
  return m.map(c => Math.round(c*255));
}

function hueHex(h) { return rgbToHex(...hsvToRgb(h, 100, 100)); }

function safeHex(hex) {
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const [,a,b,c] = hex;
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  return "#888888";
}

// ── Picker popover ─────────────────────────────────────────────────────────────

function PickerPopover({ hex, onChange }) {
  const clean = safeHex(hex);
  const initHsv = () => { try { return rgbToHsv(...hexToRgb(clean)); } catch { return [0,100,100]; } };

  const [hsv, setHsv] = useState(initHsv);
  const [hue, sat, bri] = hsv;
  const [hexDraft, setHexDraft] = useState(clean);

  const canvasRef   = useRef(null);
  const hueRef      = useRef(null);
  const gradDrag    = useRef(false);
  const hueDrag     = useRef(false);

  useEffect(() => {
    const c = safeHex(hex);
    setHexDraft(c);
    try { setHsv(rgbToHsv(...hexToRgb(c))); } catch {}
  }, [hex]);

  // Draw gradient canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { width: W, height: H } = canvas;
    const gH = ctx.createLinearGradient(0,0,W,0);
    gH.addColorStop(0, "#ffffff");
    gH.addColorStop(1, hueHex(hue));
    ctx.fillStyle = gH;
    ctx.fillRect(0,0,W,H);
    const gV = ctx.createLinearGradient(0,0,0,H);
    gV.addColorStop(0, "rgba(0,0,0,0)");
    gV.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = gV;
    ctx.fillRect(0,0,W,H);
  }, [hue]);

  const emit = useCallback((h, s, v) => {
    const rgb = hsvToRgb(h, s, v);
    const newHex = rgbToHex(...rgb);
    setHexDraft(newHex);
    onChange(newHex);
  }, [onChange]);

  const onGrad = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const ns = Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100));
    const nb = Math.max(0, Math.min(100, (1 - (e.clientY - rect.top) / rect.height) * 100));
    setHsv([hue, ns, nb]);
    emit(hue, ns, nb);
  }, [hue, emit]);

  const onHue = useCallback((e) => {
    const rect = hueRef.current.getBoundingClientRect();
    const nh = Math.max(0, Math.min(360, (e.clientX - rect.left) / rect.width * 360));
    setHsv([nh, sat, bri]);
    emit(nh, sat, bri);
  }, [sat, bri, emit]);

  const onHexInput = (val) => {
    setHexDraft(val);
    const c = val.startsWith("#") ? val : "#" + val;
    if (/^#[0-9a-fA-F]{6}$/.test(c)) {
      onChange(c);
      try { setHsv(rgbToHsv(...hexToRgb(c))); } catch {}
    }
  };

  const [r, g, b] = hsvToRgb(hue, sat, bri);
  const previewHex = rgbToHex(r, g, b);
  const CW = 200, CH = 150;

  return (
    <div style={{
      background: "#1c1c1c",
      borderRadius: 10,
      boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)",
      padding: "12px 12px 14px",
      width: CW + 24,
      userSelect: "none",
    }}>
      {/* Gradient canvas */}
      <div style={{ position: "relative", cursor: "crosshair", marginBottom: 10 }}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); gradDrag.current = true; onGrad(e); }}
        onPointerMove={e => { if (gradDrag.current) onGrad(e); }}
        onPointerUp={() => { gradDrag.current = false; }}
      >
        <canvas ref={canvasRef} width={CW} height={CH}
          style={{ display: "block", borderRadius: 6 }} />
        <div style={{
          position: "absolute",
          left: `${sat}%`, top: `${100 - bri}%`,
          width: 12, height: 12, borderRadius: "50%",
          border: "2px solid #fff",
          boxShadow: "0 0 0 1.5px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.2)",
          transform: "translate(-50%,-50%)",
          pointerEvents: "none",
          background: previewHex,
        }} />
      </div>

      {/* Hue slider */}
      <div ref={hueRef}
        style={{
          position: "relative", height: 12, borderRadius: 6, marginBottom: 12,
          cursor: "crosshair",
          background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
        }}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); hueDrag.current = true; onHue(e); }}
        onPointerMove={e => { if (hueDrag.current) onHue(e); }}
        onPointerUp={() => { hueDrag.current = false; }}
      >
        <div style={{
          position: "absolute", left: `${(hue / 360) * 100}%`, top: "50%",
          width: 14, height: 14, borderRadius: "50%",
          background: hueHex(hue),
          border: "2px solid #fff",
          boxShadow: "0 0 0 1.5px rgba(0,0,0,0.4)",
          transform: "translate(-50%,-50%)",
          pointerEvents: "none",
        }} />
      </div>

      {/* Hex input row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5,
          background: previewHex,
          border: "1px solid rgba(255,255,255,0.1)",
          flexShrink: 0,
        }} />
        <input
          value={hexDraft}
          onChange={e => onHexInput(e.target.value)}
          style={{
            flex: 1, background: "#111",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 5, padding: "4px 8px",
            color: "#e0e0e0", fontFamily: "JetBrains Mono",
            fontSize: 11, outline: "none",
            letterSpacing: "0.04em",
          }}
        />
      </div>

      {/* R G B */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
        {[["R", r], ["G", g], ["B", b]].map(([l, val]) => (
          <div key={l}>
            <div style={{ fontSize: 9, color: "#555", textAlign: "center", marginBottom: 3, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div>
            <div style={{
              background: "#111", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 4, padding: "3px 0",
              fontFamily: "JetBrains Mono", fontSize: 11, color: "#bbb", textAlign: "center",
            }}>
              {Math.round(val)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ColorSwatch ─────────────────────────────────────────────────────────────────
// The small clickable swatch that triggers the picker popover

export function ColorSwatch({ hex, onChange, size = 18, radius = 4 }) {
  const [open, setOpen] = useState(false);
  const swatchRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const toggle = () => {
    if (!open) {
      const rect = swatchRef.current.getBoundingClientRect();
      const pickerW = 226;
      const left = Math.min(rect.left, window.innerWidth - pickerW - 12);
      const top = rect.bottom + 6;
      setPos({ top, left });
    }
    setOpen(v => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!e.target.closest("[data-color-picker]")) setOpen(false);
    };
    document.addEventListener("pointerdown", close, true);
    return () => document.removeEventListener("pointerdown", close, true);
  }, [open]);

  const safe = safeHex(hex);

  return (
    <>
      <div
        ref={swatchRef}
        data-color-picker
        onClick={toggle}
        style={{
          width: size, height: size, borderRadius: radius,
          background: safe,
          border: "1px solid rgba(0,0,0,0.18)",
          cursor: "pointer", flexShrink: 0,
          boxShadow: open ? "0 0 0 2px var(--accent)" : "none",
          transition: "box-shadow 0.1s",
        }}
      />
      {open && createPortal(
        <div data-color-picker style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}>
          <PickerPopover hex={safe} onChange={v => { onChange(v); }} />
        </div>,
        document.body
      )}
    </>
  );
}

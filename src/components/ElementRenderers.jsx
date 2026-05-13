import { useEffect, useRef } from "react";
import { Icon } from "./Icons";

// ─── Shadow DOM preview — renders real HTML+CSS in full isolation ──────────────
function ShadowPreview({ html, css, interactive }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let shadow;
    try { shadow = el.attachShadow({ mode: "open" }); }
    catch { shadow = el.shadowRoot; }
    if (!shadow) return;

    const scopedCss = (css || "").replace(/:root\s*\{/g, ":host {");
    shadow.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; }
        :host { display: flex; align-items: center; justify-content: center; width: 100%; }
        ${interactive ? "" : "* { pointer-events: none !important; cursor: default !important; }"}
        ${scopedCss}
      </style>
      ${html || ""}
    `;
  }, [html, css, interactive]);

  return <div ref={ref} style={{ width: "100%", minHeight: 40 }} />;
}

// ─── Variant-based renderers (demo project) ───────────────────────────────────

function Btn({ v, interactive = false }) {
  const style = {
    background: v.bg, color: v.fg, border: `1px solid ${v.border}`,
    borderRadius: v.radius, padding: "8px 16px", fontSize: 13, fontWeight: 500,
    width: v.full ? "100%" : "auto", textDecoration: v.underline ? "underline" : "none",
    cursor: interactive ? "pointer" : "default",
    transition: "opacity 150ms, transform 120ms",
    display: "inline-flex", alignItems: "center", gap: 6,
  };
  if (v.kind === "btn-icon") {
    return (
      <button className="mk-btn" style={{ ...style, padding: 8, width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 6 }}>
        <Icon name="cart" size={14} />
      </button>
    );
  }
  return <button className="mk-btn" style={style}>{v.label}</button>;
}

function FormField({ v, interactive = false }) {
  const inputStyle = {
    border: "1px solid #ddd", borderRadius: 4, height: 30, padding: "0 8px",
    background: "white", fontSize: 12, outline: "none", width: "100%",
    pointerEvents: interactive ? "auto" : "none",
  };
  if (v.kind === "input") return (
    <div className="mk-form-field">
      <label>{v.label}</label>
      <input placeholder={v.placeholder} style={inputStyle} readOnly={!interactive} />
    </div>
  );
  if (v.kind === "floating") return (
    <div className="mk-form-field" style={{ position: "relative" }}>
      <input placeholder=" " style={{ ...inputStyle, height: 42 }} readOnly={!interactive} />
      <label style={{ position: "absolute", top: 6, left: 9, fontSize: 9, color: "#888", pointerEvents: "none" }}>{v.label.toUpperCase()}</label>
    </div>
  );
  if (v.kind === "textarea") return (
    <div className="mk-form-field">
      <label>{v.label}</label>
      <textarea readOnly={!interactive} style={{ border: "1px solid #ddd", borderRadius: 4, padding: 6, fontSize: 12, height: 56, resize: "none", width: "100%", fontFamily: "inherit", pointerEvents: interactive ? "auto" : "none" }} />
    </div>
  );
  if (v.kind === "select") return (
    <div className="mk-form-field">
      <label>Pays</label>
      <div style={{ border: "1px solid #ddd", borderRadius: 4, height: 30, padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, background: "#fff", cursor: "default" }}>
        <span>{v.value}</span><Icon name="arrow-down" size={12} />
      </div>
    </div>
  );
  if (v.kind === "inline-newsletter") return (
    <div style={{ display: "flex", width: "100%", maxWidth: 240, border: "1px solid #1a1916", borderRadius: 999, overflow: "hidden", background: "#fff" }}>
      <input placeholder="vous@exemple.com" readOnly={!interactive} style={{ flex: 1, border: "none", padding: "0 12px", fontSize: 11, background: "transparent", outline: "none", pointerEvents: interactive ? "auto" : "none" }} />
      <button style={{ background: "#1a1916", color: "#fff", border: 0, padding: "0 14px", fontSize: 11, cursor: interactive ? "pointer" : "default" }}>OK</button>
    </div>
  );
  if (v.kind === "checkbox") return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: interactive ? "pointer" : "default" }}>
      <span style={{ width: 16, height: 16, border: "1px solid #1a1916", borderRadius: 3, background: "#1a1916", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name="check" size={11} stroke={2} />
      </span>
      <span style={{ color: "#1a1916" }}>{v.label}</span>
    </label>
  );
  if (v.kind === "radio") return (
    <div>
      <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>{v.label}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {v.options.map((o, i) => (
          <div key={o} style={{ width: 30, height: 30, borderRadius: 4, border: `1px solid ${i === 1 ? "#1a1916" : "#ddd"}`, background: i === 1 ? "#1a1916" : "#fff", color: i === 1 ? "#fff" : "#1a1916", display: "grid", placeItems: "center", fontSize: 11, cursor: interactive ? "pointer" : "default" }}>{o}</div>
        ))}
      </div>
    </div>
  );
  if (v.kind === "search") return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #ddd", borderRadius: 6, padding: "6px 10px", width: "100%", maxWidth: 220 }}>
      <Icon name="search" size={14} /><span style={{ fontSize: 11, color: "#888" }}>{v.placeholder}</span>
    </div>
  );
  if (v.kind === "stepper") return (
    <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 6, background: "#fff", overflow: "hidden" }}>
      <button style={{ border: 0, background: "transparent", padding: "4px 10px", color: "#1a1916", cursor: interactive ? "pointer" : "default" }}>−</button>
      <div style={{ padding: "4px 12px", fontSize: 12, fontWeight: 500, borderLeft: "1px solid #eee", borderRight: "1px solid #eee" }}>{v.value}</div>
      <button style={{ border: 0, background: "transparent", padding: "4px 10px", color: "#1a1916", cursor: interactive ? "pointer" : "default" }}>+</button>
    </div>
  );
  return null;
}

function CardPreview({ v }) {
  if (v.kind === "product") return (
    <div className="mk-card-preview">
      <div className="img" style={{ background: `linear-gradient(135deg, ${v.color}, oklch(40% 0.08 35))` }} />
      <div className="body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="title">{v.title}</div>
          {v.tag && <span style={{ fontSize: 8, padding: "1px 5px", background: "#c75a2c", color: "white", borderRadius: 2, textTransform: "uppercase" }}>{v.tag}</span>}
        </div>
        <div className="desc">
          <span style={{ fontWeight: 600, color: "#1a1916" }}>{v.price}</span>
          {v.old && <span style={{ textDecoration: "line-through", marginLeft: 6, fontSize: 9 }}>{v.old}</span>}
        </div>
      </div>
    </div>
  );
  if (v.kind === "article") return (
    <div className="mk-card-preview">
      <div className="img" style={{ background: "linear-gradient(135deg, #cdb59a, #8a7548)" }} />
      <div className="body">
        <div style={{ fontSize: 8, color: "#c75a2c", textTransform: "uppercase", letterSpacing: 0.5 }}>{v.category}</div>
        <div className="title" style={{ fontFamily: "Instrument Serif", fontWeight: 400, fontSize: 13 }}>{v.title}</div>
        <div className="desc">{v.date}</div>
      </div>
    </div>
  );
  if (v.kind === "quote") return (
    <div style={{ background: "white", border: "1px solid #e5e3dd", borderRadius: 8, padding: 12, width: "100%", maxWidth: 220 }}>
      <div style={{ fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 12, lineHeight: 1.4 }}>« {v.quote} »</div>
      <div style={{ marginTop: 8, fontSize: 10, fontWeight: 600 }}>{v.author}</div>
      <div style={{ fontSize: 9, color: "#888" }}>{v.role}</div>
    </div>
  );
  if (v.kind === "collection") return (
    <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", width: "100%", maxWidth: 220, aspectRatio: "4/3", background: `linear-gradient(135deg, ${v.color}, oklch(35% 0.08 60))` }}>
      <div style={{ position: "absolute", inset: 0, padding: 12, display: "flex", flexDirection: "column", justifyContent: "flex-end", color: "white" }}>
        <div style={{ fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 16 }}>{v.title}</div>
        <div style={{ fontSize: 10, opacity: 0.9 }}>{v.count}</div>
      </div>
    </div>
  );
  if (v.kind === "minimal") return (
    <div style={{ background: "white", border: "1px solid #e5e3dd", borderRadius: 8, padding: 14, width: "100%", maxWidth: 220 }}>
      <div style={{ fontFamily: "Instrument Serif", fontSize: 14, marginBottom: 4 }}>{v.title}</div>
      <div style={{ fontSize: 10, color: "#888", lineHeight: 1.4 }}>{v.desc}</div>
      <div style={{ marginTop: 8, fontSize: 10, color: "#c75a2c" }}>En savoir plus →</div>
    </div>
  );
  return null;
}

function NavPreview({ v }) {
  if (v.kind === "nav-main") return (
    <div className="mk-nav-preview">
      <div className="logo" style={{ fontFamily: "Instrument Serif", fontStyle: "italic" }}>argot</div>
      <div className="links"><span>Collections</span><span>Journal</span><span>L'atelier</span></div>
      <Icon name="search" size={12} /><Icon name="cart" size={12} />
    </div>
  );
  if (v.kind === "nav-transparent") return (
    <div className="mk-nav-preview" style={{ background: "#2b2113", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}>
      <div className="logo" style={{ color: "#fff", fontFamily: "Instrument Serif", fontStyle: "italic" }}>argot</div>
      <div className="links" style={{ color: "#cdc8b8" }}><span>Collections</span><span>Journal</span><span>L'atelier</span></div>
      <span style={{ color: "#fff", fontSize: 11 }}>FR</span>
    </div>
  );
  if (v.kind === "nav-mobile") return (
    <div style={{ width: "100%", maxWidth: 180, background: "white", border: "1px solid #e7e3d8", borderRadius: 6, padding: 10, display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 6, borderBottom: "1px solid #eee" }}>
        <span style={{ fontFamily: "Instrument Serif", fontStyle: "italic", fontWeight: 600 }}>argot</span>
        <Icon name="close" size={12} />
      </div>
      <div>Collections</div><div>Journal</div><div>L'atelier</div>
    </div>
  );
  if (v.kind === "nav-mega") return (
    <div className="mk-nav-preview" style={{ flexDirection: "column", alignItems: "stretch", padding: 0 }}>
      <div style={{ padding: 8, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "Instrument Serif", fontStyle: "italic", fontWeight: 600 }}>argot</span>
        <span style={{ color: "#c75a2c" }}>Collections ▾</span>
      </div>
      <div style={{ padding: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 10, color: "#666" }}>
        <span>Vases</span><span>Lampes</span><span>Bols</span><span>Plats</span>
      </div>
    </div>
  );
  return null;
}

function FooterPreview({ v }) {
  if (v.kind === "footer-4") return (
    <div className="mk-footer">
      <div><div className="col-title">Maison</div><div>L'atelier</div><div>Journal</div></div>
      <div><div className="col-title">Boutique</div><div>Collections</div><div>Soldes</div></div>
      <div><div className="col-title">Aide</div><div>Livraison</div><div>CGV</div></div>
    </div>
  );
  if (v.kind === "footer-mini") return (
    <div className="mk-footer" style={{ gridTemplateColumns: "1fr auto", padding: 10, fontSize: 9 }}>
      <div>© 2025 Maison Argot · Paris</div>
      <div>FR · EN · Newsletter</div>
    </div>
  );
  if (v.kind === "footer-news") return (
    <div className="mk-footer" style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
      <div style={{ color: "white", fontFamily: "Instrument Serif", fontSize: 13 }}>Restez en contact.</div>
      <div style={{ display: "flex", gap: 4 }}>
        <div style={{ flex: 1, height: 22, background: "#2b2a25", borderRadius: 3, fontSize: 9, padding: "4px 6px", color: "#aaa" }}>email…</div>
        <div style={{ background: "#c75a2c", color: "white", padding: "4px 10px", borderRadius: 3, fontSize: 9 }}>OK</div>
      </div>
    </div>
  );
  return null;
}

function HeroPreview({ v }) {
  const base = { width: "100%", maxWidth: 280, borderRadius: 6, border: "1px solid #e7e3d8", overflow: "hidden" };
  if (v.kind === "hero-editorial") return (
    <div style={{ ...base, padding: 14, background: "white" }}>
      <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "#c75a2c" }}>{v.sub}</div>
      <div style={{ fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 22, lineHeight: 1.05, margin: "8px 0", letterSpacing: -0.5 }}>{v.title}</div>
      <div style={{ height: 50, background: "linear-gradient(135deg, #cdb59a, #8a7548)", borderRadius: 4 }} />
    </div>
  );
  if (v.kind === "hero-split") return (
    <div style={{ ...base, display: "grid", gridTemplateColumns: "1fr 1fr", background: "white" }}>
      <div style={{ padding: 10, display: "flex", alignItems: "center" }}>
        <div style={{ fontFamily: "Instrument Serif", fontSize: 14, lineHeight: 1.1 }}>{v.title}</div>
      </div>
      <div style={{ background: "linear-gradient(135deg, #b8af96, #574828)", minHeight: 90 }} />
    </div>
  );
  if (v.kind === "hero-full") return (
    <div style={{ ...base, position: "relative", aspectRatio: "16/9", background: "linear-gradient(135deg, #8a7548, #2b2113)" }}>
      <div style={{ position: "absolute", inset: 0, padding: 14, display: "flex", flexDirection: "column", justifyContent: "flex-end", color: "white" }}>
        <div style={{ fontFamily: "Instrument Serif", fontSize: 16 }}>{v.title}</div>
        <div style={{ fontSize: 9, opacity: 0.7 }}>Découvrir →</div>
      </div>
    </div>
  );
  if (v.kind === "hero-typo") return (
    <div style={{ ...base, padding: 18, background: "#f6f0e3", textAlign: "center" }}>
      <div style={{ fontFamily: "Instrument Serif", fontSize: 32, lineHeight: 1, letterSpacing: -1, fontStyle: "italic" }}>{v.title}</div>
      <div style={{ fontSize: 9, color: "#888", marginTop: 6 }}>Paris · depuis 2018</div>
    </div>
  );
  if (v.kind === "hero-product") return (
    <div style={{ ...base, display: "grid", gridTemplateColumns: "1fr 1fr", background: "#fbfaf6" }}>
      <div style={{ background: "linear-gradient(135deg, #ddd4be, #8a7548)", minHeight: 90 }} />
      <div style={{ padding: 10, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontFamily: "Instrument Serif", fontSize: 14 }}>{v.title}</div>
        <div style={{ fontSize: 9, color: "#888" }}>78 €</div>
        <div style={{ background: "#1a1916", color: "white", fontSize: 9, padding: "3px 6px", borderRadius: 3, marginTop: 6, width: "max-content" }}>+ Panier</div>
      </div>
    </div>
  );
  if (v.kind === "hero-mag") return (
    <div style={{ ...base, padding: 14, background: "white", borderBottom: "2px solid #1a1916" }}>
      <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, letterSpacing: 1, color: "#888" }}>VOL. 12 · 2025</div>
      <div style={{ fontFamily: "Instrument Serif", fontSize: 22, fontStyle: "italic", lineHeight: 1 }}>{v.title}</div>
    </div>
  );
  return null;
}

// ─── renderElement (grid cards) — static, pointer-events off ─────────────────

export function renderElement(el) {
  return renderElementInner(el, false);
}

// ─── renderElementInteractive (detail panel) — fully interactive ──────────────

export function renderElementInteractive(el) {
  return renderElementInner(el, true);
}

function renderElementInner(el, interactive) {
  // Real extracted element → render with Shadow DOM isolation
  if (el.html && el.html.trim().length > 10) {
    return <ShadowPreview html={el.html} css={el.css || ""} interactive={interactive} />;
  }

  const v = el.variant;
  if (!v) return null;

  if (v.kind === "icon-raw" && el.html) {
    return (
      <div style={{ color: "#1a1916", width: 28, height: 28, display: "grid", placeItems: "center" }}
        dangerouslySetInnerHTML={{ __html: el.html }}
      />
    );
  }

  if (v.kind === "btn" || v.kind === "btn-icon") return <Btn v={v} interactive={interactive} />;
  if (["input","floating","textarea","select","inline-newsletter","checkbox","radio","search","stepper"].includes(v.kind))
    return <FormField v={v} interactive={interactive} />;
  if (["product","article","quote","collection","minimal"].includes(v.kind)) return <CardPreview v={v} />;
  if (v.kind?.startsWith("nav"))    return <NavPreview v={v} />;
  if (v.kind?.startsWith("footer")) return <FooterPreview v={v} />;
  if (v.kind?.startsWith("hero"))   return <HeroPreview v={v} />;

  if (v.kind === "type") return (
    <div className="mk-type">
      <div style={{ fontFamily: v.family, fontSize: Math.min(v.size, 32), fontStyle: v.style || "normal", fontWeight: v.weight || 400, textTransform: v.caps ? "uppercase" : "none", letterSpacing: v.caps ? "0.08em" : "-0.01em", lineHeight: 1 }}>{v.text}</div>
      <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "var(--text-faint)", marginTop: 8 }}>{v.family} · {v.size}px</div>
    </div>
  );

  if (v.kind === "color") return (
    <div style={{ width: "100%" }}>
      <div className="mk-color" style={{ background: v.hex }} />
    </div>
  );

  if (v.kind === "icon") return (
    <div className="mk-icon"><Icon name={v.svg} size={22} stroke={1.4} /></div>
  );

  if (v.kind === "image") return (
    <div className="mk-image" style={{ background: `linear-gradient(135deg, oklch(70% 0.05 ${v.hue}), oklch(45% 0.08 ${v.hue}))`, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, transparent 0, transparent 6px, rgba(255,255,255,0.08) 6px, rgba(255,255,255,0.08) 7px)" }} />
    </div>
  );

  if (v.kind === "anim") return (
    <div className="mk-anim">
      {v.style === "fade"   && <div className="fade-anim">Aa</div>}
      {v.style === "bounce" && <div className="dot-anim" />}
      {v.style === "bar"    && <div className="bar-anim" />}
      {v.style === "pulse"  && <div className="pulse-anim" />}
    </div>
  );

  if (v.kind === "layout") return (
    <div className={`mk-layout l-${v.l}`}><div /><div /><div /><div /></div>
  );

  if (el.html) return <div style={{ fontSize: 11, pointerEvents: interactive ? "auto" : "none" }} dangerouslySetInnerHTML={{ __html: el.html }} />;
  return null;
}

// ─── JS snippets library ──────────────────────────────────────────────────────

const JS_SNIPPETS = {
  "nav-mobile": `// Menu mobile — toggle
const btn = document.querySelector('[data-menu-toggle]');
const drawer = document.querySelector('[data-menu-drawer]');

btn?.addEventListener('click', () => {
  const isOpen = drawer.getAttribute('aria-hidden') === 'false';
  drawer.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
  drawer.style.display = isOpen ? 'none' : 'block';
  btn.setAttribute('aria-expanded', String(!isOpen));
  // Bloquer le scroll body pendant que le menu est ouvert
  document.body.style.overflow = isOpen ? '' : 'hidden';
});

// Fermer sur Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    drawer.setAttribute('aria-hidden', 'true');
    drawer.style.display = 'none';
    document.body.style.overflow = '';
  }
});`,

  "nav-mega": `// Mega menu — hover + keyboard
const triggers = document.querySelectorAll('[data-mega-trigger]');

triggers.forEach(trigger => {
  const panel = document.querySelector(trigger.getAttribute('data-mega-trigger'));
  let timeout;

  trigger.addEventListener('mouseenter', () => {
    clearTimeout(timeout);
    panel?.classList.add('is-open');
  });
  trigger.addEventListener('mouseleave', () => {
    timeout = setTimeout(() => panel?.classList.remove('is-open'), 120);
  });
  panel?.addEventListener('mouseenter', () => clearTimeout(timeout));
  panel?.addEventListener('mouseleave', () => {
    timeout = setTimeout(() => panel.classList.remove('is-open'), 120);
  });
});`,

  "anim-scroll": `// Scroll reveal — IntersectionObserver (sans dépendance)
const elements = document.querySelectorAll('[data-reveal]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      // Désobserver après l'animation si on ne veut qu'une fois
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15,       // Déclenche à 15% de visibilité
  rootMargin: '0px 0px -60px 0px'  // Décalage bas pour trigger plus tard
});

elements.forEach(el => observer.observe(el));`,

  "anim-marquee": `// Marquee infini — pause au hover
const track = document.querySelector('.marquee-track');
if (track) {
  // Dupliquer le contenu pour le loop parfait
  track.innerHTML += track.innerHTML;

  track.addEventListener('mouseenter', () => {
    track.style.animationPlayState = 'paused';
  });
  track.addEventListener('mouseleave', () => {
    track.style.animationPlayState = 'running';
  });
}`,

  "anim-counter": `// Compteur animé
function animateCounter(el, end, duration = 1200) {
  const start = 0;
  const step = end / (duration / 16);
  let current = start;
  const timer = setInterval(() => {
    current = Math.min(current + step, end);
    el.textContent = Math.round(current).toLocaleString('fr-FR');
    if (current >= end) clearInterval(timer);
  }, 16);
}

// Déclencher quand visible
const counters = document.querySelectorAll('[data-counter]');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target, parseInt(e.target.getAttribute('data-counter')));
      observer.unobserve(e.target);
    }
  });
});
counters.forEach(c => observer.observe(c));`,

  "form-validation": `// Validation de formulaire — sans dépendance
const form = document.querySelector('[data-form]');

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;

  // Vider les erreurs précédentes
  form.querySelectorAll('.field-error').forEach(el => el.remove());
  form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

  const addError = (input, msg) => {
    input.classList.add('input-error');
    const err = document.createElement('span');
    err.className = 'field-error';
    err.textContent = msg;
    input.parentNode.appendChild(err);
    valid = false;
  };

  // Email
  const email = form.querySelector('[type="email"]');
  if (email && !/^[^@]+@[^@]+\.[^@]+$/.test(email.value)) {
    addError(email, 'Adresse e-mail invalide.');
  }

  // Champs requis
  form.querySelectorAll('[required]').forEach(input => {
    if (!input.value.trim()) addError(input, 'Ce champ est requis.');
  });

  if (valid) {
    // Soumettre — adapter selon votre API
    console.log('Formulaire valide ✓', new FormData(form));
  }
});`,

  "btn-ripple": `// Effet ripple au clic
document.querySelectorAll('.btn-primary, .btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = \`
      position: absolute;
      border-radius: 50%;
      width: \${size}px; height: \${size}px;
      left: \${e.clientX - rect.left - size / 2}px;
      top: \${e.clientY - rect.top - size / 2}px;
      background: rgba(255,255,255,0.3);
      transform: scale(0);
      animation: ripple 500ms ease-out forwards;
      pointer-events: none;
    \`;
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

/* CSS requis :
@keyframes ripple {
  to { transform: scale(2.5); opacity: 0; }
} */`,

  "tabs": `// Tabs — navigation par onglets
const tabList = document.querySelector('[role="tablist"]');
const tabs = tabList?.querySelectorAll('[role="tab"]');
const panels = document.querySelectorAll('[role="tabpanel"]');

tabs?.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.getAttribute('aria-controls');

    tabs.forEach(t => {
      t.setAttribute('aria-selected', 'false');
      t.classList.remove('is-active');
    });
    panels.forEach(p => {
      p.hidden = p.id !== target;
    });

    tab.setAttribute('aria-selected', 'true');
    tab.classList.add('is-active');
  });
});`,

  "modal": `// Modal — ouvrir / fermer
const openBtns = document.querySelectorAll('[data-modal-open]');
const closeBtn = document.querySelector('[data-modal-close]');
const modal    = document.querySelector('[data-modal]');
const scrim    = document.querySelector('[data-modal-scrim]');

const openModal = () => {
  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  modal.querySelector('[autofocus]')?.focus();
};
const closeModal = () => {
  modal.setAttribute('hidden', '');
  document.body.style.overflow = '';
};

openBtns.forEach(btn => btn.addEventListener('click', openModal));
closeBtn?.addEventListener('click', closeModal);
scrim?.addEventListener('click', closeModal);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeModal();
});`,

  "slider": `// Slider simple — sans bibliothèque
const track = document.querySelector('.slider-track');
const slides = track?.querySelectorAll('.slide');
const prev = document.querySelector('[data-slider-prev]');
const next = document.querySelector('[data-slider-next]');
let current = 0;

const goTo = (index) => {
  current = Math.max(0, Math.min(index, slides.length - 1));
  track.style.transform = \`translateX(-\${current * 100}%)\`;
  // Mettre à jour les dots si présents
  document.querySelectorAll('[data-dot]').forEach((dot, i) => {
    dot.classList.toggle('is-active', i === current);
  });
};

prev?.addEventListener('click', () => goTo(current - 1));
next?.addEventListener('click', () => goTo(current + 1));

// Swipe tactile
let startX = 0;
track?.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
track?.addEventListener('touchend', e => {
  const diff = startX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
});`,

  "lazy-image": `// Lazy loading images — IntersectionObserver
const images = document.querySelectorAll('img[data-src]');

const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
      img.classList.add('is-loaded');
      imageObserver.unobserve(img);
    }
  });
}, { rootMargin: '200px' });

images.forEach(img => imageObserver.observe(img));`,
};

// ─── Code generator ───────────────────────────────────────────────────────────

export function codeFor(el) {
  // Real extracted element — use its actual code
  if (el.html) {
    const parts = [];
    parts.push({ label: "HTML", code: el.html.trim() });
    if (el.css?.trim()) parts.push({ label: "CSS", code: el.css.trim() });
    if (el.js?.trim())  parts.push({ label: "JavaScript", code: el.js.trim() });
    if (el.notes)       parts.push({ label: "Notes", code: el.notes });
    return parts;
  }

  // Demo-project — generate clean code + relevant JS
  const v = el.variant;
  if (!v) return [{ label: "HTML", code: `<!-- ${el.name} -->` }];

  // ── Buttons ──
  if (v.kind === "btn") {
    return [
      { label: "HTML", code: `<button class="btn-primary">\n  ${v.label}\n</button>` },
      { label: "CSS",  code: `.btn-primary {\n  background: ${v.bg};\n  color: ${v.fg};\n  border: 1px solid ${v.border};\n  border-radius: ${v.radius}px;\n  padding: 8px 20px;\n  font-size: 14px;\n  font-weight: 500;\n  cursor: pointer;\n  transition: background 150ms, transform 100ms, box-shadow 150ms;\n}\n.btn-primary:hover {\n  background: color-mix(in srgb, ${v.bg} 85%, black);\n  transform: translateY(-1px);\n  box-shadow: 0 4px 12px -4px ${v.bg}80;\n}\n.btn-primary:active {\n  transform: translateY(0);\n}` },
      { label: "JavaScript", code: JS_SNIPPETS["btn-ripple"] },
    ];
  }
  if (v.kind === "btn-icon") {
    return [
      { label: "HTML", code: `<button class="btn-icon" aria-label="Panier">\n  <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" width="18" height="18">\n    <!-- icon path ici -->\n  </svg>\n</button>` },
      { label: "CSS",  code: `.btn-icon {\n  width: 36px; height: 36px;\n  border-radius: 8px;\n  border: 1px solid ${v.border};\n  background: ${v.bg};\n  color: ${v.fg};\n  display: grid; place-items: center;\n  cursor: pointer;\n  transition: background 120ms;\n}\n.btn-icon:hover { background: #f0f0f0; }` },
    ];
  }

  // ── Forms ──
  if (v.kind === "input" || v.kind === "floating" || v.kind === "textarea" || v.kind === "select") {
    const htmlMap = {
      input:    `<div class="field">\n  <label for="email">Adresse e-mail</label>\n  <input id="email" type="email" placeholder="${v.placeholder || ""}" required />\n</div>`,
      floating: `<div class="field field--floating">\n  <input id="name" type="text" placeholder=" " />\n  <label for="name">${v.label || "Votre nom"}</label>\n</div>`,
      textarea: `<div class="field">\n  <label for="msg">${v.label || "Message"}</label>\n  <textarea id="msg" rows="4" required></textarea>\n</div>`,
      select:   `<div class="field">\n  <label for="country">${v.label || "Pays"}</label>\n  <select id="country">\n    <option>France</option>\n    <option>Belgique</option>\n    <option>Suisse</option>\n  </select>\n</div>`,
    };
    return [
      { label: "HTML", code: htmlMap[v.kind] || htmlMap.input },
      { label: "CSS",  code: `.field { display: flex; flex-direction: column; gap: 6px; }\n.field label { font-size: 12px; font-weight: 500; color: #555; }\n.field input,\n.field textarea,\n.field select {\n  border: 1px solid #d4cfc0;\n  border-radius: 6px;\n  padding: 8px 12px;\n  font-size: 14px;\n  outline: none;\n  transition: border 150ms, box-shadow 150ms;\n}\n.field input:focus,\n.field textarea:focus {\n  border-color: #1a1916;\n  box-shadow: 0 0 0 3px rgba(26,25,22,0.06);\n}` },
      { label: "JavaScript", code: JS_SNIPPETS["form-validation"] },
    ];
  }

  if (v.kind === "inline-newsletter") {
    return [
      { label: "HTML", code: `<form class="newsletter-form" data-form>\n  <input type="email" placeholder="vous@exemple.com" required />\n  <button type="submit">S'inscrire</button>\n</form>` },
      { label: "CSS",  code: `.newsletter-form {\n  display: flex;\n  border: 1px solid #1a1916;\n  border-radius: 999px;\n  overflow: hidden;\n  background: #fff;\n  max-width: 340px;\n}\n.newsletter-form input {\n  flex: 1;\n  border: none;\n  padding: 0 16px;\n  font-size: 14px;\n  outline: none;\n  background: transparent;\n}\n.newsletter-form button {\n  background: #1a1916;\n  color: #fff;\n  border: none;\n  padding: 0 20px;\n  font-size: 13px;\n  cursor: pointer;\n  transition: background 150ms;\n}\n.newsletter-form button:hover { background: #000; }` },
      { label: "JavaScript", code: `// Soumission newsletter\ndocument.querySelector('.newsletter-form')?.addEventListener('submit', async (e) => {\n  e.preventDefault();\n  const email = e.target.querySelector('input[type="email"]').value;\n  const btn = e.target.querySelector('button');\n  btn.textContent = '...';\n  try {\n    // Remplacer par votre endpoint (Brevo, Mailchimp, etc.)\n    await fetch('/api/newsletter', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ email }),\n    });\n    btn.textContent = '✓ Inscrit';\n  } catch {\n    btn.textContent = 'Réessayer';\n  }\n});` },
    ];
  }

  // ── Navigation ──
  if (v.kind === "nav-main" || v.kind === "nav-transparent") {
    return [
      { label: "HTML", code: `<header class="site-header">\n  <a href="/" class="logo">Argot</a>\n  <nav aria-label="Navigation principale">\n    <ul>\n      <li><a href="/collections">Collections</a></li>\n      <li><a href="/journal">Journal</a></li>\n      <li><a href="/atelier">L'atelier</a></li>\n    </ul>\n  </nav>\n  <div class="header-actions">\n    <button aria-label="Rechercher"><!-- search icon --></button>\n    <a href="/panier" aria-label="Panier"><!-- cart icon --></a>\n    <!-- Burger mobile -->\n    <button class="burger" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu">\n      <span></span><span></span><span></span>\n    </button>\n  </div>\n</header>\n\n<!-- Menu mobile -->\n<div id="mobile-menu" data-menu-drawer aria-hidden="true" hidden>\n  <nav><!-- même liens --></nav>\n</div>` },
      { label: "CSS",  code: `.site-header {\n  display: flex; align-items: center;\n  padding: 0 24px;\n  height: 60px;\n  border-bottom: 1px solid #e7e3d8;\n  position: sticky; top: 0; z-index: 10;\n  background: ${v.kind === "nav-transparent" ? "transparent" : "#fff"};\n}\n.site-header nav ul {\n  display: flex; gap: 28px;\n  list-style: none; margin: 0; padding: 0;\n}\n.site-header nav a {\n  font-size: 14px; text-decoration: none; color: inherit;\n  opacity: 0.7; transition: opacity 150ms;\n}\n.site-header nav a:hover { opacity: 1; }\n.logo { font-weight: 700; text-decoration: none; color: inherit; }\n.header-actions { display: flex; align-items: center; gap: 12px; margin-left: auto; }\n.burger { display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; }\n.burger span { width: 20px; height: 2px; background: currentColor; }\n@media (max-width: 768px) {\n  .site-header nav { display: none; }\n  .burger { display: flex; }\n}` },
      { label: "JavaScript", code: JS_SNIPPETS["nav-mobile"] },
    ];
  }

  if (v.kind === "nav-mega") {
    return [
      { label: "HTML", code: `<nav class="mega-nav">\n  <button data-mega-trigger="#mega-collections" aria-expanded="false">\n    Collections ▾\n  </button>\n  <div id="mega-collections" class="mega-panel" hidden>\n    <div class="mega-grid">\n      <a href="/vases">Vases</a>\n      <a href="/lampes">Lampes</a>\n      <a href="/bols">Bols</a>\n      <a href="/plats">Plats</a>\n    </div>\n  </div>\n</nav>` },
      { label: "CSS",  code: `.mega-nav { position: relative; }\n.mega-panel {\n  position: absolute; top: 100%; left: 0;\n  background: #fff; border: 1px solid #e7e3d8;\n  border-radius: 10px; padding: 20px;\n  box-shadow: 0 20px 40px -12px rgba(0,0,0,0.12);\n  min-width: 280px;\n  opacity: 0; transform: translateY(6px);\n  transition: opacity 200ms, transform 200ms;\n  pointer-events: none;\n}\n.mega-panel.is-open {\n  opacity: 1; transform: translateY(0);\n  pointer-events: auto;\n  display: block !important;\n}\n.mega-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }\n.mega-grid a { padding: 8px; border-radius: 6px; text-decoration: none; color: inherit; font-size: 14px; }\n.mega-grid a:hover { background: #f6f4ee; }` },
      { label: "JavaScript", code: JS_SNIPPETS["nav-mega"] },
    ];
  }

  if (v.kind === "nav-mobile") {
    return [
      { label: "HTML", code: `<button class="burger" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu" aria-label="Menu">\n  <span></span><span></span><span></span>\n</button>\n\n<div id="mobile-menu" data-menu-drawer role="dialog" aria-modal="true" aria-hidden="true" hidden>\n  <nav>\n    <ul>\n      <li><a href="/collections">Collections</a></li>\n      <li><a href="/journal">Journal</a></li>\n      <li><a href="/atelier">L'atelier</a></li>\n      <li><a href="/compte">Compte</a></li>\n    </ul>\n  </nav>\n  <button data-menu-close aria-label="Fermer">✕</button>\n</div>` },
      { label: "CSS",  code: `#mobile-menu {\n  position: fixed; inset: 0; z-index: 100;\n  background: #fff; padding: 24px;\n  transform: translateX(-100%);\n  transition: transform 280ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n#mobile-menu:not([hidden]) { transform: translateX(0); }\n#mobile-menu ul { list-style: none; padding: 0; margin: 40px 0; display: flex; flex-direction: column; gap: 20px; }\n#mobile-menu a { font-size: 24px; font-weight: 600; text-decoration: none; color: inherit; }\n.burger span {\n  display: block; width: 22px; height: 2px;\n  background: currentColor; border-radius: 2px;\n  transition: transform 250ms, opacity 200ms;\n}\n.burger[aria-expanded="true"] span:nth-child(1) { transform: translateY(6px) rotate(45deg); }\n.burger[aria-expanded="true"] span:nth-child(2) { opacity: 0; }\n.burger[aria-expanded="true"] span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }` },
      { label: "JavaScript", code: JS_SNIPPETS["nav-mobile"] },
    ];
  }

  // ── Hero sections ──
  if (v.kind?.startsWith("hero")) {
    return [
      { label: "HTML", code: `<section class="hero" data-reveal>\n  <span class="eyebrow">${v.sub || "Collection"}</span>\n  <h1 class="hero-title">${v.title}</h1>\n  <p class="hero-desc">Découvrez notre sélection de pièces artisanales.</p>\n  <div class="hero-actions">\n    <a href="/collections" class="btn-primary">Découvrir</a>\n    <a href="/atelier" class="btn-ghost">L'atelier →</a>\n  </div>\n</section>` },
      { label: "CSS",  code: `.hero {\n  padding: clamp(80px, 12vw, 160px) 24px;\n  text-align: center;\n  opacity: 0;\n  transform: translateY(24px);\n  transition: opacity 0.8s ease, transform 0.8s ease;\n}\n.hero.is-visible { opacity: 1; transform: none; }\n.eyebrow {\n  font-family: "JetBrains Mono", monospace;\n  font-size: 11px;\n  text-transform: uppercase;\n  letter-spacing: 0.1em;\n  color: #c75a2c;\n}\n.hero-title {\n  font-size: clamp(2.5rem, 6vw, 5rem);\n  font-weight: 400;\n  letter-spacing: -0.03em;\n  line-height: 1;\n  margin: 16px 0;\n}\n.hero-actions { display: flex; gap: 12px; justify-content: center; margin-top: 28px; }` },
      { label: "JavaScript", code: JS_SNIPPETS["anim-scroll"] },
    ];
  }

  // ── Animations ──
  if (v.kind === "anim") {
    const jsMap = {
      fade:   JS_SNIPPETS["anim-scroll"],
      bounce: JS_SNIPPETS["btn-ripple"],
      bar:    JS_SNIPPETS["anim-marquee"],
      pulse:  JS_SNIPPETS["anim-counter"],
    };
    const cssMap = {
      fade:   `/* Fade-in au scroll */\n[data-reveal] {\n  opacity: 0;\n  transform: translateY(24px);\n  transition: opacity 0.7s ease, transform 0.7s ease;\n}\n[data-reveal].is-visible {\n  opacity: 1;\n  transform: translateY(0);\n}`,
      bounce: `@keyframes bounce {\n  0%, 100% { transform: translateY(-10px); animation-timing-function: cubic-bezier(0.8,0,1,1); }\n  50%       { transform: translateY(0);    animation-timing-function: cubic-bezier(0,0,0.2,1); }\n}\n.animate-bounce { animation: bounce 1.4s infinite; }`,
      bar:    `/* Marquee */\n.marquee-container { overflow: hidden; }\n.marquee-track {\n  display: flex;\n  gap: 2rem;\n  animation: marquee 20s linear infinite;\n  width: max-content;\n}\n@keyframes marquee {\n  from { transform: translateX(0); }\n  to   { transform: translateX(-50%); }\n}`,
      pulse:  `@keyframes pulseRing {\n  0%   { box-shadow: 0 0 0 0 currentColor; opacity: 0.6; }\n  70%  { box-shadow: 0 0 0 10px currentColor; opacity: 0; }\n  100% { box-shadow: 0 0 0 0 currentColor; opacity: 0; }\n}\n.pulse { animation: pulseRing 1.6s cubic-bezier(0.2,0.8,0.4,1) infinite; }`,
    };
    return [
      { label: "CSS", code: cssMap[v.style] || cssMap.fade },
      { label: "JavaScript", code: jsMap[v.style] || jsMap.fade },
    ];
  }

  // ── Colors ──
  if (v.kind === "color") {
    return [{ label: "CSS", code: `/* ${el.name} */\n--color-${el.name}: ${v.hex};\n\n.bg-${el.name}   { background: ${v.hex}; }\n.text-${el.name} { color: ${v.hex}; }\n.border-${el.name} { border-color: ${v.hex}; }` }];
  }

  // ── Typography ──
  if (v.kind === "type") {
    return [{ label: "CSS", code: `/* ${el.name} */\n.text-style-${el.id} {\n  font-family: "${v.family}";\n  font-size: ${v.size}px;\n  font-weight: ${v.weight || 400};\n  font-style: ${v.style || "normal"};\n  letter-spacing: ${v.caps ? "0.08em" : "-0.01em"};\n  text-transform: ${v.caps ? "uppercase" : "none"};\n  line-height: 1.1;\n}` }];
  }

  // ── Icons ──
  if (v.kind === "icon") {
    return [{ label: "SVG", code: `<!-- ${v.svg} icon —\n  Remplacer les paths par le SVG réel du site -->\n<svg viewBox="0 0 24 24"\n     stroke="currentColor"\n     stroke-width="1.6"\n     stroke-linecap="round"\n     stroke-linejoin="round"\n     fill="none"\n     width="24" height="24"\n     aria-hidden="true">\n  <!-- paths ici -->\n</svg>` }];
  }

  // ── Cards ──
  if (["product","article","quote","collection","minimal"].includes(v.kind)) {
    return [
      { label: "HTML", code: `<article class="card">\n  <div class="card-image">\n    <img src="image.jpg" alt="${v.title || "Card"}" loading="lazy" />\n  </div>\n  <div class="card-body">\n    <h3 class="card-title">${v.title || "Titre"}</h3>\n    ${v.price ? `<span class="card-price">${v.price}</span>` : `<p class="card-desc">Description de l'élément.</p>`}\n  </div>\n</article>` },
      { label: "CSS",  code: `.card {\n  border-radius: 10px;\n  overflow: hidden;\n  background: #fff;\n  border: 1px solid #e7e3d8;\n  transition: transform 200ms ease, box-shadow 200ms ease;\n}\n.card:hover {\n  transform: translateY(-3px);\n  box-shadow: 0 12px 32px -8px rgba(0,0,0,0.12);\n}\n.card-image img {\n  width: 100%; aspect-ratio: 4/3;\n  object-fit: cover;\n  transition: transform 400ms ease;\n}\n.card:hover .card-image img { transform: scale(1.04); }\n.card-body { padding: 14px 16px; }\n.card-title { font-size: 15px; font-weight: 600; margin: 0 0 4px; }\n.card-price { font-size: 16px; font-weight: 700; }` },
      { label: "JavaScript", code: JS_SNIPPETS["lazy-image"] },
    ];
  }

  // ── Footer ──
  if (v.kind?.startsWith("footer")) {
    return [
      { label: "HTML", code: `<footer class="site-footer">\n  <div class="footer-grid">\n    <div>\n      <p class="footer-heading">Maison</p>\n      <ul><li><a href="#">L'atelier</a></li><li><a href="#">Journal</a></li></ul>\n    </div>\n    <div>\n      <p class="footer-heading">Boutique</p>\n      <ul><li><a href="#">Collections</a></li><li><a href="#">Nouveautés</a></li></ul>\n    </div>\n    <div>\n      <p class="footer-heading">Aide</p>\n      <ul><li><a href="#">Livraison</a></li><li><a href="#">Retours</a></li></ul>\n    </div>\n  </div>\n  <div class="footer-bottom">\n    <p>© 2025 Maison Argot · Paris</p>\n  </div>\n</footer>` },
      { label: "CSS",  code: `.site-footer {\n  background: #1a1916; color: #cdc8b8;\n  padding: 60px 48px 32px;\n}\n.footer-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));\n  gap: 40px;\n  margin-bottom: 48px;\n}\n.footer-heading { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #fff; margin: 0 0 14px; }\n.site-footer ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }\n.site-footer a { color: inherit; text-decoration: none; font-size: 13px; opacity: 0.7; transition: opacity 150ms; }\n.site-footer a:hover { opacity: 1; }\n.footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; font-size: 12px; opacity: 0.5; }` },
    ];
  }

  // ── Layouts ──
  if (v.kind === "layout") {
    const layoutCode = {
      hero:  `<main>\n  <section class="hero-section"><!-- Hero --></section>\n  <section class="features"><!-- Grid features --></section>\n  <section class="cta-section"><!-- CTA --></section>\n</main>`,
      grid:  `<div class="product-grid">\n  <article class="card"><!-- Card 1 --></article>\n  <article class="card"><!-- Card 2 --></article>\n  <article class="card"><!-- Card 3 --></article>\n  <article class="card"><!-- Card 4 --></article>\n</div>`,
      split: `<section class="split">\n  <div class="split-content"><!-- Texte --></div>\n  <div class="split-visual"><!-- Image --></div>\n</section>`,
      stack: `<main class="stack">\n  <header><!-- Header --></header>\n  <article><!-- Contenu --></article>\n  <aside><!-- Sidebar --></aside>\n  <footer><!-- Footer --></footer>\n</main>`,
    };
    const layoutCSS = {
      hero:  `.hero-section { min-height: 90vh; display: grid; place-items: center; }\n.features { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; padding: 80px 48px; }`,
      grid:  `.product-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: 24px;\n  padding: 48px;\n}`,
      split: `.split {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  min-height: 60vh;\n}\n@media (max-width: 768px) { .split { grid-template-columns: 1fr; } }`,
      stack: `.stack { display: flex; flex-direction: column; min-height: 100vh; }\n.stack article { flex: 1; }`,
    };
    return [
      { label: "HTML", code: layoutCode[v.l] || layoutCode.hero },
      { label: "CSS",  code: layoutCSS[v.l] || layoutCSS.hero },
    ];
  }

  return [{ label: "Code", code: `<!-- ${el.name} —\n   Source : ${el.src} -->` }];
}

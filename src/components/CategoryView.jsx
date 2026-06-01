import { useState } from "react";
import { Icon } from "./Icons";
import { renderElement } from "./ElementRenderers";
import { exportElementsAsZip, downloadBlob } from "../lib/exporter";

const DESCRIPTIONS = {
  buttons:    "Tous les boutons et CTA détectés sur le site, regroupés par variante et état.",
  forms:      "Champs de formulaire, sélecteurs et patterns d'input réutilisables.",
  cards:      "Cards produits, articles, témoignages, et autres conteneurs structurés.",
  nav:        "Barres de navigation, headers et menus mobiles.",
  footer:     "Pieds de page complets, en plusieurs variantes.",
  hero:       "Sections d'en-tête principales détectées en haut de chaque page.",
  typography: "Styles typographiques avec leur famille, poids et tailles d'origine.",
  colors:     "Palette extraite automatiquement par fréquence d'usage dans la feuille de style.",
  icons:      "Icônes vectorielles trouvées dans le site, nommées et prêtes à copier.",
  images:     "Médias bitmap et SVG hébergés dans le ZIP.",
  anim:       "Animations CSS copiées à l'identique — ou recréées en CSS pur si JS requis.",
  layouts:    "Patterns de mise en page : grilles, splits, hero+sections, etc.",
};

export function CategoryView({ project, category, elements, selectedId, onSelect, onAIAnalyze, aiProgress }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState("grid");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!elements.length || exporting) return;
    setExporting(true);
    try {
      const blob = await exportElementsAsZip(elements, {
        projectName: project?.name || "PERCER",
        categoryLabel: category?.label || "Éléments",
        projectCSS: "",
        detectedLibs: project?.detectedLibs || [],
      });
      const slug = (category?.label || "elements").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      downloadBlob(blob, `percer-${slug}.zip`);
    } finally {
      setExporting(false);
    }
  }

  const filtered = elements.filter(e =>
    q === "" || e.name.toLowerCase().includes(q.toLowerCase()) || e.src?.toLowerCase().includes(q.toLowerCase())
  );

  const colsClass = `cols-${category?.cols || 4}`;

  return (
    <div className="main-inner">
      <div className="cat-header">
        <div className="left">
          <h1>
            {category?.label || "Tous les éléments"}
            <span className="count">/ {filtered.length}</span>
          </h1>
          <p>{DESCRIPTIONS[category?.id] || "Éléments extraits automatiquement depuis le site."}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {onAIAnalyze && (
            <button
              className="btn"
              onClick={onAIAnalyze}
              disabled={!!aiProgress}
              style={{ background: aiProgress ? "var(--surface)" : "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", gap: 6 }}
            >
              {aiProgress ? (
                <><Icon name="spinner" size={13} /> {aiProgress}</>
              ) : (
                <><span style={{ fontSize: 13 }}>✦</span> Analyser avec IA</>
              )}
            </button>
          )}
          <button className="btn" onClick={handleExport} disabled={exporting || !elements.length}>
            <Icon name={exporting ? "spinner" : "download"} size={13} />
            {exporting ? "Export…" : "Exporter"}
          </button>
        </div>
      </div>

      <div className="cat-toolbar">
        <div className="search" style={{ flex: 1, maxWidth: 360 }}>
          <Icon name="search" size={13} />
          <input
            className="input"
            placeholder={`Rechercher dans ${(category?.label || "éléments").toLowerCase()}…`}
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <button className="btn ghost sm">
          <span className="chip"><span className="dot" style={{ background: "var(--accent)" }} /> source</span>
        </button>
        <button className="btn ghost sm">Trier <Icon name="arrow-down" size={11} /></button>
        <div style={{ flex: 1 }} />
        <div className="view-toggle" style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: 2, gap: 2 }}>
          <button className={"icon-btn " + (view === "grid" ? "active" : "")} onClick={() => setView("grid")} style={{ width: 24, height: 24 }}><Icon name="grid" size={13} /></button>
          <button className={"icon-btn " + (view === "list" ? "active" : "")} onClick={() => setView("list")} style={{ width: 24, height: 24 }}><Icon name="list" size={13} /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>Aucun élément trouvé</h3>
          <p>Essayez un autre terme ou modifiez les filtres.</p>
        </div>
      ) : (
        <div className={`elements-grid ${colsClass}`}>
          {filtered.map(el => (
            <ElementCard
              key={el.id}
              el={el}
              selected={selectedId === el.id}
              categoryId={category?.id}
              onSelect={() => onSelect(el)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ElementCard({ el, selected, categoryId, onSelect }) {
  return (
    <div className={"el-card " + (selected ? "selected" : "")} onClick={onSelect}>
      <div className="preview">
        {renderElement(el)}
        {categoryId === "colors" && el.variant?.hex && (
          <div style={{ position: "absolute", bottom: 6, left: 8, fontFamily: "JetBrains Mono", fontSize: 9, color: "rgba(255,255,255,0.9)", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 3, textTransform: "uppercase" }}>
            {el.variant.hex}
          </div>
        )}
        {el.aiEnhanced && (
          <div style={{ position: "absolute", top: 6, left: 6, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius: 4, padding: "2px 6px", fontSize: 9, fontFamily: "JetBrains Mono", color: "#fff", letterSpacing: "0.04em" }}>
            ✦ IA
          </div>
        )}
        {el.notes && !el.aiEnhanced && (
          <div style={{ position: "absolute", top: 6, right: 6, background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 4, padding: "1px 5px", fontSize: 9, fontFamily: "JetBrains Mono", color: "var(--accent-strong)", textTransform: "uppercase" }}>
            CSS pur
          </div>
        )}
      </div>
      <div className="foot">
        <div className="name">{el.name}</div>
        <div className="src">{el.src?.split("/").pop() || el.src}</div>
      </div>
    </div>
  );
}

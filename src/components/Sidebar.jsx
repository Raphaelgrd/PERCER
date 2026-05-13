import { Icon } from "./Icons";

export function Sidebar({ project, categories, elements, activeId, onSelect }) {
  const totalAll = Object.values(elements).reduce((a, arr) => a + arr.length, 0);

  return (
    <div className="sidebar">
      <div className="head">
        <div className="label">Projet</div>
        <h3>{project.name.split("—")[1]?.trim() || project.name}</h3>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: project.color, flexShrink: 0 }} />
          {project.domain}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="title">Bibliothèque</div>
        <div className={"nav-item " + (!activeId ? "active" : "")} onClick={() => onSelect(null)}>
          <span className="nav-icon"><Icon name="grid" size={14} /></span>
          <span className="nav-label">Tous les éléments</span>
          <span className="nav-count">{totalAll}</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="title">Catégories</div>
        {categories.map(c => {
          const count = elements[c.id]?.length || 0;
          return (
            <div
              key={c.id}
              className={"nav-item " + (activeId === c.id ? "active" : "") + (count === 0 ? " disabled" : "")}
              style={{ opacity: count === 0 ? 0.45 : 1 }}
              onClick={() => count > 0 && onSelect(c.id)}
            >
              <span className="nav-icon"><Icon name={c.icon} size={14} /></span>
              <span className="nav-label">{c.label}</span>
              <span className="nav-count">{count || "—"}</span>
            </div>
          );
        })}
      </div>

      <div className="sidebar-section">
        <div className="title">Source</div>
        {project.zipName && (
          <div className="nav-item">
            <span className="nav-icon"><Icon name="zip" size={14} /></span>
            <span className="nav-label" style={{ fontSize: 12 }}>{project.zipName}</span>
          </div>
        )}
        {project.pages > 0 && (
          <div className="nav-item">
            <span className="nav-icon"><Icon name="folder" size={14} /></span>
            <span className="nav-label">{project.pages} pages analysées</span>
          </div>
        )}
        <div className="nav-item" style={{ color: "var(--accent)", cursor: "pointer" }}>
          <span className="nav-icon"><Icon name="sparkles" size={14} /></span>
          <span className="nav-label">Re-analyser</span>
        </div>
      </div>
    </div>
  );
}

import { Icon } from "./Icons";

export function Topbar({ view, project, category, onHome, onProject }) {
  return (
    <div className="topbar">
      <div className="topbar-brand" onClick={onHome}>
        <div className="mark" />
        <span>bibliothèque <em style={{ fontStyle: "italic", fontFamily: "Instrument Serif", fontWeight: 400, marginLeft: 2 }}>percer</em></span>
        <small>v1.0</small>
      </div>

      <div className="topbar-crumbs">
        <span className="sep">/</span>
        <span className={"crumb " + (view === "projects" ? "current" : "")} onClick={onHome}>Projets</span>
        {project && <>
          <span className="sep">/</span>
          <span className={"crumb " + (!category ? "current" : "")} onClick={onProject}>{project.name}</span>
        </>}
        {category && <>
          <span className="sep">/</span>
          <span className="crumb current">{category.label}</span>
        </>}
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-actions">
        <div className="search" style={{ width: 220 }}>
          <Icon name="search" size={13} />
          <input className="input" placeholder="Rechercher…" />
          <span className="kbd-hint">⌘K</span>
        </div>
        <button className="icon-btn"><Icon name="settings" size={15} /></button>
        <div className="avatar">A</div>
      </div>
    </div>
  );
}

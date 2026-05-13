import { useState } from "react";
import { Icon } from "./Icons";

export function ProjectsScreen({ projects, onOpenProject, onNew, onDelete }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = projects.filter(p =>
    (filter === "all" || p.status === filter) &&
    (q === "" || p.name.toLowerCase().includes(q.toLowerCase()) || p.domain.toLowerCase().includes(q.toLowerCase()))
  );

  const totalEls = projects.reduce((a, p) => a + (p.elements || 0), 0);
  const totalStorage = projects.reduce((a, p) => {
    if (!p.zipSize) return a;
    const n = parseFloat(p.zipSize);
    return a + (isNaN(n) ? 0 : n);
  }, 0).toFixed(1);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vos <em>projets</em></h1>
          <p className="page-subtitle">Importez un site, extrayez ses éléments, réutilisez-les. Chaque projet conserve son ZIP source et la bibliothèque complète des composants détectés.</p>
        </div>
        <button className="btn primary lg" onClick={onNew}>
          <Icon name="plus" size={14} stroke={2} /> Nouveau projet <span className="kbd">N</span>
        </button>
      </div>

      <div className="stat-strip">
        <div className="stat"><div className="num">{projects.length}</div><div className="label">Projets</div></div>
        <div className="stat"><div className="num">{totalEls}</div><div className="label">Éléments extraits</div></div>
        <div className="stat"><div className="num">12</div><div className="label">Catégories</div></div>
        <div className="stat"><div className="num">{totalStorage} Mo</div><div className="label">Stockage utilisé</div></div>
      </div>

      <div className="toolbar">
        <div className="search" style={{ flex: 1, maxWidth: 320 }}>
          <Icon name="search" size={13} />
          <input className="input" placeholder="Filtrer par nom ou domaine…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="filters">
          {[["all", "Tous"], ["ready", "Prêts"], ["processing", "En cours"], ["empty", "Vides"]].map(([k, l]) => (
            <button key={k} className={"filter " + (filter === k ? "active" : "")} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <div className="toolbar-spacer" />
      </div>

      <div className="projects-grid">
        <div className="project-card new" onClick={onNew}>
          <div>
            <div className="plus">+</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Nouveau projet</div>
            <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Importer un ZIP ou crawler un site</div>
          </div>
        </div>

        {filtered.map(p => (
          <ProjectCard key={p.id} project={p} onOpen={() => onOpenProject(p)} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project: p, onOpen, onDelete }) {
  return (
    <div className="project-card" onClick={onOpen}>
      <div className="thumb">
        <div className="thumb-content">
          <div style={{ width: 24, height: 24, borderRadius: 5, background: p.color, marginBottom: 6 }} />
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <div style={{ height: 8, background: "var(--text)", borderRadius: 2, width: 50 }} />
            <div style={{ height: 8, background: "var(--border-strong)", borderRadius: 2, width: 30 }} />
            <div style={{ height: 8, background: "var(--border-strong)", borderRadius: 2, width: 40 }} />
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            <div style={{ width: 36, height: 24, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 3 }} />
            <div style={{ width: 36, height: 24, background: p.color, borderRadius: 3, opacity: 0.4 }} />
            <div style={{ width: 36, height: 24, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 3 }} />
          </div>
        </div>
      </div>
      <div className="meta">
        <div className="name">{p.name}</div>
        <div className="domain">{p.domain}</div>
      </div>
      <div className="footer">
        <div className={"status " + p.status}>
          <span className="dot" />
          <span>
            {p.status === "ready" && `${p.elements || 0} éléments`}
            {p.status === "processing" && "Extraction…"}
            {p.status === "empty" && "Aucun ZIP"}
          </span>
        </div>
        <span>{p.updated}</span>
      </div>
    </div>
  );
}

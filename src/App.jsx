import { useState, useEffect } from "react";
import { Topbar } from "./components/Topbar";
import { ProjectsScreen } from "./components/ProjectsScreen";
import { CreateModal } from "./components/CreateModal";
import { UploadZone } from "./components/UploadZone";
import { Sidebar } from "./components/Sidebar";
import { CategoryView } from "./components/CategoryView";
import { DetailPanel } from "./components/DetailPanel";
import { Icon } from "./components/Icons";
import { CATEGORIES, DEMO_PROJECT, DEMO_ELEMENTS } from "./data/categories";
import { loadProjects, saveProjects, loadElements, saveElements, saveProjectCSS, loadProjectCSS } from "./lib/storage";

// ─── Initial state ─────────────────────────────────────────────────────────────

function initProjects() {
  const saved = loadProjects();
  if (saved && saved.length > 0) return saved;
  // First run — seed with demo project
  return [
    DEMO_PROJECT,
    {
      id: "p2",
      name: "Audit concurrent — Nordseen",
      domain: "nordseen.io",
      color: "oklch(60% 0.08 240)",
      status: "empty",
      updated: "il y a 3 j",
      zipSize: null,
      zipName: null,
      elements: 0,
      pages: 0,
    },
  ];
}

function getElements(projectId) {
  if (projectId === "demo") return DEMO_ELEMENTS;
  const saved = loadElements(projectId);
  return saved || {};
}

// ─── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("projects"); // 'projects' | 'project'
  const [projects, setProjects] = useState(initProjects);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [categoryId, setCategoryId] = useState("buttons");
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [modal, setModal] = useState(null); // null | 'create' | 'apikey'
  const [projectElements, setProjectElements] = useState({});
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("percer_api_key") || "");

  const project = projects.find(p => p.id === selectedProjectId) || null;
  const category = CATEGORIES.find(c => c.id === categoryId) || null;
  const elements = projectElements[categoryId] || [];
  const selectedElement = elements.find(e => e.id === selectedElementId) || null;

  // Persist projects on change
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  // Load elements when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    const els = getElements(selectedProjectId);
    setProjectElements(els);
    // Set first non-empty category
    const firstCat = CATEGORIES.find(c => (els[c.id]?.length || 0) > 0);
    if (firstCat) setCategoryId(firstCat.id);
  }, [selectedProjectId]);

  const openProject = (p) => {
    setSelectedProjectId(p.id);
    setView("project");
    setSelectedElementId(null);
  };

  const goHome = () => {
    setView("projects");
    setSelectedProjectId(null);
    setSelectedElementId(null);
  };

  const createProject = ({ name, domain }) => {
    const newProject = {
      id: "p" + Date.now(),
      name,
      domain: domain || "nouveau-site.com",
      color: `oklch(60% 0.10 ${Math.floor(Math.random() * 360)})`,
      elements: 0,
      pages: 0,
      status: "empty",
      updated: "à l'instant",
      zipSize: null,
      zipName: null,
    };
    setProjects(ps => [newProject, ...ps]);
    setModal(null);
    setSelectedProjectId(newProject.id);
    setView("project");
    setProjectElements({});
  };

  // Called when ZIP parsing is complete
  const handleSaveElement = (updatedEl) => {
    const updated = {
      ...projectElements,
      [updatedEl.category]: (projectElements[updatedEl.category] || []).map(e =>
        e.id === updatedEl.id ? updatedEl : e
      ),
    };
    setProjectElements(updated);
    if (selectedProjectId !== "demo") saveElements(selectedProjectId, updated);
  };

  const handleUploadComplete = (result, file) => {
    const { elements: extracted, css, pages, total } = result;

    setProjects(ps => ps.map(p => p.id === selectedProjectId ? {
      ...p,
      status: "ready",
      elements: total,
      pages,
      zipName: file.name,
      zipSize: `${(file.size / 1024 / 1024).toFixed(1)} Mo`,
      updated: "à l'instant",
    } : p));

    setProjectElements(extracted);
    saveElements(selectedProjectId, extracted);
    if (css) saveProjectCSS(selectedProjectId, css);

    const firstCat = CATEGORIES.find(c => (extracted[c.id]?.length || 0) > 0);
    if (firstCat) setCategoryId(firstCat.id);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        if (modal) setModal(null);
        else if (selectedElementId) setSelectedElementId(null);
      }
      if (e.key === "n" && view === "projects" && !modal && document.activeElement.tagName !== "INPUT") {
        setModal("create");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modal, view, selectedElementId]);

  const isReady = project?.status === "ready";

  return (
    <div className="app">
      <Topbar
        view={view}
        project={view === "project" ? project : null}
        category={view === "project" && isReady ? category : null}
        onHome={goHome}
        onProject={() => setSelectedElementId(null)}
      />

      {/* ── Projects list ── */}
      {view === "projects" && (
        <ProjectsScreen
          projects={projects}
          onOpenProject={openProject}
          onNew={() => setModal("create")}
        />
      )}

      {/* ── Project upload state ── */}
      {view === "project" && project && !isReady && (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", height: "calc(100vh - 52px)" }}>
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
              <div className="title">État</div>
              <div className="nav-item active">
                <span className="nav-icon"><Icon name="upload" size={14} /></span>
                <span className="nav-label">Import</span>
              </div>
              {CATEGORIES.map(c => (
                <div key={c.id} className="nav-item" style={{ opacity: 0.35, cursor: "not-allowed" }}>
                  <span className="nav-icon"><Icon name={c.icon} size={14} /></span>
                  <span className="nav-label">{c.label}</span>
                  <span className="nav-count">—</span>
                </div>
              ))}
            </div>
          </div>
          <div className="main">
            <UploadZone
              project={project}
              onComplete={handleUploadComplete}
              apiKey={apiKey}
              onNeedKey={() => setModal("apikey")}
            />
          </div>
        </div>
      )}

      {/* ── Project library ── */}
      {view === "project" && project && isReady && (
        <div className={"workspace " + (selectedElement ? "detail-open" : "")}>
          <Sidebar
            project={project}
            categories={CATEGORIES}
            elements={projectElements}
            activeId={categoryId}
            onSelect={(id) => {
              setCategoryId(id || CATEGORIES.find(c => (projectElements[c.id]?.length || 0) > 0)?.id || "buttons");
              setSelectedElementId(null);
            }}
          />

          <div className="main">
            <CategoryView
              project={project}
              category={category}
              elements={elements}
              selectedId={selectedElementId}
              onSelect={(el) => setSelectedElementId(prev => prev === el.id ? null : el.id)}
            />
          </div>

          {selectedElement && (
            <DetailPanel
              element={selectedElement}
              onClose={() => setSelectedElementId(null)}
              onSave={handleSaveElement}
            />
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {modal === "create" && (
        <CreateModal onClose={() => setModal(null)} onCreate={createProject} />
      )}

      {modal === "apikey" && (
        <APIKeyModal
          defaultKey={apiKey}
          onConfirm={(key) => {
            setApiKey(key);
            localStorage.setItem("percer_api_key", key);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── API Key modal ─────────────────────────────────────────────────────────────

function APIKeyModal({ defaultKey, onConfirm, onClose }) {
  const [key, setKey] = useState(defaultKey || "");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 28, width: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "var(--text)" }}>Clé API Anthropic</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
          Claude va analyser chaque composant extrait et reconstituer son CSS à la perfection — même si le parser a raté des styles. La clé est stockée localement.
        </div>
        <input
          autoFocus
          type="password"
          placeholder="sk-ant-..."
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === "Enter" && key.startsWith("sk-") && onConfirm(key)}
          style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 7, padding: "10px 12px", fontFamily: "JetBrains Mono", fontSize: 12, color: "var(--text)", outline: "none", marginBottom: 16, boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn ghost" onClick={onClose}>Annuler</button>
          <button
            className="btn primary"
            disabled={!key.startsWith("sk-")}
            onClick={() => onConfirm(key)}
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none" }}
          >
            ✦ Lancer l'analyse IA
          </button>
        </div>
      </div>
    </div>
  );
}

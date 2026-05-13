const PROJECTS_KEY = "percer_projects";
const ELEMENTS_KEY = "percer_elements_";
const CSS_KEY = "percer_css_";

export function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProjects(projects) {
  try {
    const minimal = projects.map(p => ({
      id: p.id, name: p.name, domain: p.domain, color: p.color,
      status: p.status, updated: p.updated, zipSize: p.zipSize,
      zipName: p.zipName, isDemo: p.isDemo,
    }));
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(minimal));
  } catch (e) {
    console.warn("Storage save failed:", e);
  }
}

export function loadElements(projectId) {
  try {
    const raw = localStorage.getItem(ELEMENTS_KEY + projectId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveElements(projectId, elements) {
  try {
    localStorage.setItem(ELEMENTS_KEY + projectId, JSON.stringify(elements));
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      // If storage is full, store a trimmed version (no raw html for images/icons)
      const slim = {};
      for (const [cat, items] of Object.entries(elements)) {
        slim[cat] = items.map(el => ({ ...el, html: el.html?.slice(0, 2000) }));
      }
      try { localStorage.setItem(ELEMENTS_KEY + projectId, JSON.stringify(slim)); }
      catch { /* ignore */ }
    }
  }
}

export function loadProjectCSS(projectId) {
  try {
    return localStorage.getItem(CSS_KEY + projectId) || "";
  } catch {
    return "";
  }
}

export function saveProjectCSS(projectId, css) {
  try {
    // Limit to 500KB per project
    const truncated = css.length > 500_000 ? css.slice(0, 500_000) : css;
    localStorage.setItem(CSS_KEY + projectId, truncated);
  } catch {
    /* ignore */
  }
}

export function deleteProject(projectId) {
  try {
    localStorage.removeItem(ELEMENTS_KEY + projectId);
    localStorage.removeItem(CSS_KEY + projectId);
  } catch { /* ignore */ }
}

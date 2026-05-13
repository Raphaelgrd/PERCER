import JSZip from "jszip";

// Build a self-contained HTML file showcasing all elements in a category
function buildHTML(categoryLabel, elements, projectCSS = "") {
  const elementBlocks = elements.map(el => {
    const htmlContent = el.html || "";
    const cssContent = el.css || "";
    const jsContent = el.js || "";
    return `
  <!-- ═══ ${el.name} ═══ -->
  <section class="percer-element" id="${el.id}">
    <div class="percer-label">
      <span class="percer-name">${el.name}</span>
      <span class="percer-src">${el.src}</span>
    </div>
    <div class="percer-preview">
      ${htmlContent}
    </div>
    ${cssContent ? `<style>\n/* — ${el.name} — */\n${cssContent}\n</style>` : ""}
    ${jsContent ? `<script>\n/* — ${el.name} — */\n${jsContent}\n<\/script>` : ""}
  </section>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PERCER — ${categoryLabel}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
  <style>
/* ── Site CSS ── */
${projectCSS}

/* ── PERCER wrapper ── */
*, *::before, *::after { box-sizing: border-box; }
body { font-family: "Instrument Sans", sans-serif; margin: 0; padding: 0; background: #f6f4ee; color: #1a1916; }

.percer-header {
  padding: 40px 48px 24px;
  border-bottom: 1px solid #e7e3d8;
}
.percer-header h1 {
  font-family: "Instrument Serif", serif;
  font-weight: 400;
  font-size: 36px;
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}
.percer-header p {
  color: #6b6759;
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.percer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1px;
  background: #e7e3d8;
  border-top: 1px solid #e7e3d8;
}

.percer-element {
  background: #fff;
  padding: 0;
}
.percer-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #e7e3d8;
  background: #fbfaf6;
}
.percer-name {
  font-size: 12px;
  font-weight: 600;
}
.percer-src {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: #a39e8d;
}
.percer-preview {
  padding: 32px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  background-image: radial-gradient(#e7e3d8 1px, transparent 1px);
  background-size: 16px 16px;
}
  </style>
</head>
<body>
  <div class="percer-header">
    <h1>${categoryLabel}</h1>
    <p>Exporté depuis PERCER · ${elements.length} éléments · ${new Date().toLocaleDateString("fr-FR")}</p>
  </div>
  <div class="percer-grid">
    ${elementBlocks}
  </div>
</body>
</html>`;
}

// Build a global styles.css from all elements' CSS
function buildGlobalCSS(elements) {
  const seen = new Set();
  const blocks = [];
  for (const el of elements) {
    if (el.css && !seen.has(el.css)) {
      seen.add(el.css);
      blocks.push(`/* ── ${el.name} (${el.src}) ── */\n${el.css}`);
    }
  }
  return blocks.join("\n\n");
}

// Build a global scripts.js from all elements' JS
function buildGlobalJS(elements) {
  const seen = new Set();
  const blocks = [];
  for (const el of elements) {
    if (el.js && !seen.has(el.js)) {
      seen.add(el.js);
      blocks.push(`/* ── ${el.name} (${el.src}) ── */\n${el.js}`);
    }
  }
  if (!blocks.length) return null;
  return blocks.join("\n\n");
}

// Build a README.md summarizing the export
function buildReadme(projectName, categoryLabel, elements, detectedLibs = []) {
  const lines = [
    `# PERCER Export — ${projectName}`,
    `**Catégorie :** ${categoryLabel}  `,
    `**Éléments :** ${elements.length}  `,
    `**Date :** ${new Date().toLocaleDateString("fr-FR")}`,
    "",
    "## Fichiers",
    "",
    "| Fichier | Description |",
    "|---------|-------------|",
    "| `index.html` | Aperçu de tous les éléments, autonome (CSS/JS intégré) |",
    "| `styles.css` | Toutes les règles CSS extraites |",
  ];

  const hasJS = elements.some(e => e.js);
  if (hasJS) lines.push("| `scripts.js` | Tous les snippets JS extraits / recréés |");

  lines.push("", "## Éléments");
  for (const el of elements) {
    lines.push(`- **${el.name}** — \`${el.src}\``);
    if (el.notes) lines.push(`  > ${el.notes}`);
  }

  if (detectedLibs?.length) {
    lines.push("", "## Dépendances détectées (recréées en CSS pur)");
    for (const lib of detectedLibs) lines.push(`- ${lib}`);
  }

  lines.push("", "---", "*Généré par [PERCER](https://github.com/percer)*");
  return lines.join("\n");
}

// Main export function — returns a Blob
export async function exportElementsAsZip(elements, { projectName, categoryLabel, projectCSS, detectedLibs } = {}) {
  const zip = new JSZip();

  const globalCSS = buildGlobalCSS(elements);
  const globalJS  = buildGlobalJS(elements);
  const html      = buildHTML(categoryLabel, elements, globalCSS);
  const readme    = buildReadme(projectName, categoryLabel, elements, detectedLibs);

  zip.file("index.html", html);
  zip.file("styles.css", globalCSS || "/* No CSS extracted */");
  if (globalJS) zip.file("scripts.js", globalJS);
  zip.file("README.md", readme);

  // Individual element files
  const folder = zip.folder("elements");
  for (const el of elements) {
    const slug = el.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (el.html) folder.file(`${slug}.html`, el.html);
    if (el.css)  folder.file(`${slug}.css`, el.css);
    if (el.js)   folder.file(`${slug}.js`, el.js);
  }

  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

// Trigger browser download of a Blob
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

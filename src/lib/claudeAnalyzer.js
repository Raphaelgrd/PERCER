// ─── Claude analyzer ───────────────────────────────────────────────────────────
// Sends the FULL source (HTML + CSS + JS) to Claude and gets back the main
// visual components, reproduced pixel-perfect with self-contained CSS.

const MODEL = "claude-opus-4-5"; // change here if the model id evolves

async function callClaude(apiKey, messages, maxTokens = 8000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const m = err.error?.message || `Erreur API ${res.status}`;
    if (res.status === 401) throw new Error("Clé API invalide ou expirée");
    throw new Error(m);
  }
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// Special error type so the UI knows to offer the ZIP fallback
export class UnreadableSiteError extends Error {}

export async function analyzeHTMLFile(site, apiKey, onProgress, baseUrl = "") {
  // Accept either a raw HTML string (file) or { html, css, js }
  const html = typeof site === "string" ? site : (site.html || "");
  const css  = typeof site === "string" ? "" : (site.css || "");
  const js   = typeof site === "string" ? "" : (site.js  || "");

  onProgress?.("Claude lit le code source…");

  const prompt = `Tu es un expert front-end. On te donne le code source COMPLET d'une page web (HTML, CSS, et JS).
Ta mission : reproduire À L'IDENTIQUE, AU PIXEL PRÈS, ses éléments visuels principaux.
${baseUrl ? `URL de la page : ${baseUrl}` : ""}

=== HTML ===
${html.slice(0, 45000)}

=== CSS ===
${css.slice(0, 95000)}

=== JS ===
${js.slice(0, 25000)}

Réponds UNIQUEMENT avec ce JSON (aucun texte, aucun markdown) :
{
  "siteName": "Nom du site/marque",
  "colors": [{ "name": "accent", "hex": "#43f2a1" }],
  "typography": [{ "family": "Inter", "weight": 700, "size": 48, "sample": "Titre exemple" }],
  "buttons": [{
    "name": "Bouton principal",
    "html": "<a class=\\"btn btn-primary\\">Texte exact</a>",
    "css": "CSS COMPLET ET AUTONOME ici"
  }],
  "logo": { "name": "Marque", "html": "<svg ...>...</svg> ou <img src=\\"URL ABSOLUE\\">" }
}

RÈGLES STRICTES :
- colors : max 6 (les plus structurantes : accent, fond, texte, bordures)
- typography : max 3 (titre, corps, accent)
- buttons : max 3, UNIQUEMENT les boutons PRINCIPAUX (CTA), pas les liens secondaires
- Pour CHAQUE bouton, le "css" doit être COMPLET et copier-collable tel quel :
  • reprends le(s) sélecteur(s) EXACT(s) utilisés dans le HTML (ex: .btn, .btn-primary)
  • RÉSOUS tous les var(--x) en valeurs réelles (lis le bloc :root du CSS)
  • inclus : background (gradients exacts), color, padding, border, border-radius,
    font-family, font-size, font-weight, letter-spacing, box-shadow, transition
  • inclus les états :hover, :focus, :active s'ils existent
  • si une animation JS agit dessus (magnetic, ripple, scroll…), recrée l'effet en CSS pur
- logo : si <img>, donne une URL ABSOLUE${baseUrl ? ` (base : ${baseUrl})` : ""} ; préfère le SVG inline si présent
- Si le code ne contient AUCUN composant réel stylé (page vide, app rendue côté client en JS), réponds EXACTEMENT : {"error":"raison courte"}`;

  const text = await callClaude(apiKey, [{ role: "user", content: prompt }]);

  onProgress?.("Reconstruction des composants…");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude n'a pas retourné de JSON exploitable");

  let data;
  try {
    data = JSON.parse(match[0]);
  } catch {
    throw new Error("Réponse de Claude illisible (JSON invalide)");
  }

  if (data.error) {
    throw new UnreadableSiteError(data.error);
  }

  return buildElements(data);
}

function buildElements(data) {
  const elements = {
    colors: [], typography: [], buttons: [], forms: [],
    cards: [], nav: [], footer: [], hero: [],
    icons: [], images: [], anim: [], layouts: [],
  };

  (data.colors || []).forEach((c, i) => {
    if (!c.hex) return;
    elements.colors.push({
      id: `co_${i}`, name: c.name || c.hex, src: "IA", category: "colors",
      variant: { kind: "color", hex: c.hex },
      html: null, css: `color: ${c.hex};\nbackground: ${c.hex};`, js: null, notes: null,
      aiEnhanced: true,
    });
  });

  (data.typography || []).forEach((t, i) => {
    if (!t.family) return;
    elements.typography.push({
      id: `ty_${i}`, name: `${t.family} / ${t.size || 16}px`, src: "IA", category: "typography",
      variant: { kind: "type", text: t.sample || "Exemple", family: t.family, size: Math.min(t.size || 16, 36), weight: t.weight || 400, style: "normal" },
      html: null,
      css: `font-family: "${t.family}";\nfont-size: ${t.size || 16}px;\nfont-weight: ${t.weight || 400};`,
      js: null, notes: null, aiEnhanced: true,
    });
  });

  (data.buttons || []).forEach((b, i) => {
    if (!b.html) return;
    elements.buttons.push({
      id: `bt_${i}`, name: b.name || "Bouton", src: "IA", category: "buttons",
      variant: { kind: "btn", label: b.name },
      html: b.html, css: b.css || "", js: null, notes: null, aiEnhanced: true,
    });
  });

  if (data.logo?.html) {
    elements.icons.push({
      id: "logo_0", name: data.logo.name || data.siteName || "Logo", src: "IA", category: "icons",
      variant: { kind: "icon-raw" },
      html: data.logo.html, css: "svg, img { max-height: 48px; width: auto; }", js: null, notes: null,
      aiEnhanced: true,
    });
  }

  return elements;
}

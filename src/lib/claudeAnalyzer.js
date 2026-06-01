async function callClaude(apiKey, messages, maxTokens = 4000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-request-override": "allow-browser",
    },
    body: JSON.stringify({ model: "claude-opus-4-5", max_tokens: maxTokens, messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erreur API ${res.status}`);
  }
  const data = await res.json();
  return data.content[0]?.text || "";
}

export async function analyzeHTMLFile(htmlContent, apiKey, onProgress) {
  onProgress?.("Claude analyse le site…");

  // Truncate HTML if too large (keep head + first 80KB)
  const html = htmlContent.length > 80000
    ? htmlContent.slice(0, 80000) + "\n<!-- truncated -->"
    : htmlContent;

  const text = await callClaude(apiKey, [{
    role: "user",
    content: `Analyse ce code source HTML/CSS et extrais les éléments visuels principaux.

\`\`\`html
${html}
\`\`\`

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans explication) :
{
  "colors": [{ "name": "accent", "hex": "#43f2a1" }],
  "typography": [{ "family": "Inter", "weight": 700, "size": 48, "sample": "Texte exemple" }],
  "buttons": [{
    "name": "Bouton principal",
    "html": "<a class='btn btn-primary'>Texte</a>",
    "css": "/* CSS COMPLET standalone — résous TOUS les var(--x) en vraies valeurs */"
  }],
  "logo": { "name": "Nom du site", "html": "<svg ...> ou <img ...>" }
}

Règles :
- Max 6 couleurs (les principales)
- Max 3 typographies (titres, corps, accent)
- Max 3 boutons PRINCIPAUX seulement, CSS complet avec valeurs réelles (aucun var())
- Logo uniquement si présent dans le HTML`
  }]);

  onProgress?.("Traitement…");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude n'a pas retourné de JSON valide");

  const data = JSON.parse(match[0]);
  return buildElements(data);
}

function buildElements(data) {
  const elements = {
    colors: [], typography: [], buttons: [], forms: [],
    cards: [], nav: [], footer: [], hero: [],
    icons: [], images: [], anim: [], layouts: [],
  };

  // Colors
  (data.colors || []).forEach((c, i) => {
    elements.colors.push({
      id: `co_${i}`, name: c.name || c.hex, src: "IA", category: "colors",
      variant: { kind: "color", hex: c.hex },
      html: null, css: `color: ${c.hex};\nbackground: ${c.hex};`, js: null, notes: null,
      aiEnhanced: true,
    });
  });

  // Typography
  (data.typography || []).forEach((t, i) => {
    elements.typography.push({
      id: `ty_${i}`, name: `${t.family} / ${t.size}px`, src: "IA", category: "typography",
      variant: { kind: "type", text: t.sample || "Exemple", family: t.family, size: Math.min(t.size, 36), weight: t.weight, style: "normal" },
      html: null, css: `font-family: "${t.family}";\nfont-size: ${t.size}px;\nfont-weight: ${t.weight};`,
      js: null, notes: null, aiEnhanced: true,
    });
  });

  // Buttons
  (data.buttons || []).forEach((b, i) => {
    elements.buttons.push({
      id: `bt_${i}`, name: b.name || "Bouton", src: "IA", category: "buttons",
      variant: { kind: "btn", label: b.name },
      html: b.html, css: b.css, js: null, notes: null, aiEnhanced: true,
    });
  });

  // Logo
  if (data.logo?.html) {
    elements.icons.push({
      id: "logo_0", name: data.logo.name || "Logo", src: "IA", category: "icons",
      variant: { kind: "icon-raw" },
      html: data.logo.html, css: "svg, img { max-height: 48px; width: auto; }", js: null, notes: null,
      aiEnhanced: true,
    });
  }

  return elements;
}

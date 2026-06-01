import Anthropic from "@anthropic-ai/sdk";

// ─── Client factory ───────────────────────────────────────────────────────────

export function createClient(apiKey) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

// ─── Extract root vars from CSS ───────────────────────────────────────────────

function getRootVars(css) {
  const m = css.match(/:root\s*\{([^}]*)\}/s);
  return m ? m[1].trim().slice(0, 3000) : "";
}

// ─── Extract class list from HTML string ──────────────────────────────────────

function getClasses(html) {
  const classes = new Set();
  for (const m of html.matchAll(/class="([^"]+)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c) classes.add(c);
  }
  return [...classes];
}

// ─── Analyze a single element ────────────────────────────────────────────────

export async function analyzeElement(client, element, fullCSS) {
  if (!element.html) return null;

  const classes = getClasses(element.html);
  const rootVars = getRootVars(fullCSS);

  const prompt = `You are a CSS expert reproducing UI components with pixel-perfect accuracy.

ELEMENT HTML:
${element.html.slice(0, 2500)}

ELEMENT CLASSES: ${classes.join(", ")}

CURRENT EXTRACTED CSS (may be incomplete or have unresolved vars):
${(element.css || "").slice(0, 3000)}

ROOT CSS VARIABLES:
${rootVars}

Your task:
1. Produce a COMPLETE, SELF-CONTAINED CSS for this component
2. Resolve ALL var(--x) to their actual values from the root variables
3. Include :hover, :focus, :active, ::before, ::after states
4. Include @keyframes if the component uses animations
5. Include relevant @media queries
6. Do NOT include body/html/section/main rules
7. Use :host instead of :root for custom properties

Respond with ONLY valid JSON (no markdown fences):
{"css": "...complete css...", "description": "one-line visual description"}`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content[0]?.text || "";
    // Extract JSON — handle potential extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.css) return null;
    return parsed;
  } catch (e) {
    console.error("Claude analyze error:", e.message);
    return null;
  }
}

// ─── Batch analyze all elements in a project ─────────────────────────────────
// onProgress(done, total, currentName)

export async function analyzeAllElements(client, projectElements, fullCSS, onProgress) {
  // Collect all elements that have real HTML (not demo mocks)
  const candidates = [];
  for (const [cat, els] of Object.entries(projectElements)) {
    if (!Array.isArray(els)) continue;
    for (const el of els) {
      if (el.html && el.html.trim().length > 20) {
        candidates.push({ cat, el });
      }
    }
  }

  if (!candidates.length) return projectElements;

  const updated = JSON.parse(JSON.stringify(projectElements)); // deep clone
  let done = 0;

  for (const { cat, el } of candidates) {
    onProgress?.(done, candidates.length, el.name);

    const result = await analyzeElement(client, el, fullCSS);
    if (result?.css) {
      const idx = updated[cat].findIndex(e => e.id === el.id);
      if (idx !== -1) {
        updated[cat][idx] = {
          ...updated[cat][idx],
          css: result.css,
          aiEnhanced: true,
          aiDescription: result.description || null,
        };
      }
    }
    done++;
    // Small delay to respect rate limits
    await new Promise(r => setTimeout(r, 200));
  }

  onProgress?.(done, candidates.length, null);
  return updated;
}

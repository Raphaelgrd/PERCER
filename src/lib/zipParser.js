import JSZip from "jszip";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(prefix, i) { return `${prefix}_${i}`; }

function pageLabel(path) {
  return path.split("/").pop() || path;
}

// Hash a string for deduplication
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < Math.min(str.length, 500); i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

// Extract inline style value
function inlineStyle(el, prop) {
  const s = el.style?.[prop] || el.getAttribute?.("style") || "";
  const m = new RegExp(prop + "\\s*:\\s*([^;]+)").exec(s);
  return m ? m[1].trim() : null;
}

// Get computed-ish color from class or inline style
function guessColor(el) {
  const bg = inlineStyle(el, "background-color") || inlineStyle(el, "background");
  if (bg && bg !== "transparent" && bg !== "initial" && bg !== "inherit") return bg;
  return null;
}

// Extract text safely
function textContent(el) {
  return el.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) || "";
}

// ─── CSS helpers ─────────────────────────────────────────────────────────────

// ─── Robust CSS block parser (handles @media nesting) ─────────────────────────

function parseCSSBlocks(css, mediaContext = "") {
  const blocks = [];
  let i = 0;

  while (i < css.length) {
    // skip whitespace
    while (i < css.length && css[i] <= " ") i++;
    if (i >= css.length) break;

    // skip comments
    if (css[i] === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }

    // read selector up to '{'
    let selStart = i;
    while (i < css.length && css[i] !== "{" && css[i] !== "}") {
      if (css[i] === "/" && css[i + 1] === "*") {
        const end = css.indexOf("*/", i + 2);
        i = end === -1 ? css.length : end + 2;
      } else i++;
    }

    if (i >= css.length || css[i] === "}") { i++; continue; }

    const selector = css.slice(selStart, i).trim();
    i++; // skip '{'

    // find matching closing brace
    let depth = 1, bodyStart = i;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    const body = css.slice(bodyStart, i - 1).trim();

    if (!selector) continue;

    if (/^@(media|supports|layer|container|document)/i.test(selector)) {
      // recurse — keep the media context
      const ctx = mediaContext ? `${mediaContext} and ${selector}` : selector;
      blocks.push(...parseCSSBlocks(body, ctx));
    } else if (/^@keyframes/i.test(selector)) {
      // store keyframe block as-is
      blocks.push({ selector, body, mediaContext, isKeyframe: true });
    } else if (!selector.startsWith("@")) {
      blocks.push({ selector, body, mediaContext, isKeyframe: false });
    }
  }

  return blocks;
}

// Extract @keyframes blocks from CSS (brace-matching, handles complex bodies)
function extractKeyframes(css) {
  const frames = {};
  const re = /@(?:-webkit-)?keyframes\s+([\w-]+)\s*\{/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const name = m[1];
    let depth = 1, i = re.lastIndex;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    const body = css.slice(re.lastIndex, i - 1).trim();
    frames[name] = `@keyframes ${name} {\n  ${body}\n}`;
  }
  return frames;
}

// Extract all CSS rules matching a list of class names
function extractCSSForClasses(classNames, allCSS, keyframes = {}) {
  if (!classNames.length) return "";

  const escaped = classNames.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const classPattern = new RegExp(
    `\\.(?:${escaped.join("|")})(?=[\\s,{:>~+\\[#.\\)\\*]|$)`
  );

  const blocks = parseCSSBlocks(allCSS);
  const rules = [];
  const seen = new Set();

  for (const block of blocks) {
    if (block.isKeyframe) continue;
    // each selector in a comma list is checked independently
    const selectors = block.selector.split(",").map(s => s.trim());
    if (!selectors.some(s => classPattern.test(s))) continue;

    const key = block.selector + "||" + block.body.slice(0, 120);
    if (seen.has(key)) continue;
    seen.add(key);

    const ruleStr = block.mediaContext
      ? `${block.mediaContext} {\n  ${block.selector} {\n    ${block.body.replace(/\n/g, "\n    ")}\n  }\n}`
      : `${block.selector} {\n  ${block.body}\n}`;
    rules.push(ruleStr);
  }

  // Include referenced @keyframes
  const rulesText = rules.join("\n");
  const animNames = new Set();
  for (const m of rulesText.matchAll(/animation(?:-name)?\s*:\s*([\w-]+)/g)) {
    if (keyframes[m[1]]) animNames.add(m[1]);
  }
  const kfBlocks = [...animNames].map(n => keyframes[n]).filter(Boolean).join("\n\n");

  return [kfBlocks, ...rules].filter(Boolean).join("\n\n");
}

// Extract CSS custom properties used by an element
function extractCSSVars(css, usedCSS) {
  if (!usedCSS) return "";
  const varNames = new Set();
  for (const m of usedCSS.matchAll(/var\((--[\w-]+)\)/g)) varNames.add(m[1]);
  if (!varNames.size) return "";

  const definitions = new Map();
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;}\n]+)/g)) {
    if (varNames.has(m[1]) && !definitions.has(m[1])) {
      definitions.set(m[1], m[2].trim());
    }
  }
  if (!definitions.size) return "";

  const vars = [...definitions.entries()].map(([k, v]) => `  ${k}: ${v};`);
  return `:root {\n${vars.join("\n")}\n}`;
}

// Extract all color values from CSS
function extractColors(css) {
  const colors = new Map(); // hex → name

  // CSS custom properties in :root
  const rootBlock = css.match(/:root\s*\{([^}]+)\}/s)?.[1] || "";
  const propRe = /([-\w]+)\s*:\s*(#[0-9a-fA-F]{3,8}|oklch\([^)]+\)|rgb[a]?\([^)]+\))/g;
  let m;
  while ((m = propRe.exec(rootBlock)) !== null) {
    const name = m[1].replace(/^--/, "");
    const val = m[2].trim();
    if (!colors.has(val)) colors.set(val, name);
  }

  // Hex colors across all CSS (frequency based)
  const hexCount = new Map();
  const hexRe = /#([0-9a-fA-F]{3,8})\b/g;
  while ((m = hexRe.exec(css)) !== null) {
    const hex = "#" + m[1];
    hexCount.set(hex, (hexCount.get(hex) || 0) + 1);
  }

  // Add top colors not already from variables
  const sorted = [...hexCount.entries()].sort((a, b) => b[1] - a[1]);
  for (const [hex] of sorted) {
    if (!colors.has(hex) && colors.size < 24) {
      colors.set(hex, hex);
    }
  }

  return [...colors.entries()].map(([hex, name], i) => ({
    id: uid("co", i),
    name,
    src: "styles.css",
    category: "colors",
    variant: { kind: "color", hex },
    html: null,
    css: `color: ${hex};\nbackground: ${hex};`,
    js: null,
    notes: null,
  }));
}

// Extract typography from CSS
function extractTypography(css) {
  const fonts = new Map(); // "family|size|weight" → info
  const re = /([^{}]+)\{([^{}]*font-[^{}]*)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const body = m[2];
    const familyM = /font-family\s*:\s*([^;]+)/.exec(body);
    const sizeM   = /font-size\s*:\s*([\d.]+)(?:px|rem|em)/.exec(body);
    const weightM = /font-weight\s*:\s*([\d]+|bold|normal)/.exec(body);
    const styleM  = /font-style\s*:\s*(italic|oblique)/.exec(body);
    if (!familyM) continue;
    const family = familyM[1].trim().replace(/["']/g, "").split(",")[0].trim();
    const size = sizeM ? parseFloat(sizeM[1]) : 16;
    const weight = weightM ? parseInt(weightM[1]) || weightM[1] : 400;
    const style = styleM?.[1] || "normal";
    const key = `${family}|${size}|${weight}|${style}`;
    if (!fonts.has(key) && size >= 10 && size <= 80) {
      fonts.set(key, { family, size, weight: weight === "bold" ? 700 : weight, style });
    }
  }

  const result = [];
  let i = 0;
  for (const { family, size, weight, style } of fonts.values()) {
    const sampleText = size >= 30 ? "Grande ligne" : size >= 20 ? "Titre section" : size >= 14 ? "Sous-titre" : "Texte corps";
    result.push({
      id: uid("ty", i++),
      name: `${family} / ${size}px`,
      src: "styles.css",
      category: "typography",
      variant: { kind: "type", text: sampleText, family, size: Math.min(size, 36), weight, style },
      html: null,
      css: `font-family: "${family}";\nfont-size: ${size}px;\nfont-weight: ${weight};\nfont-style: ${style};`,
      js: null,
      notes: null,
    });
  }
  return result.slice(0, 16);
}

// Extract @keyframes animations from CSS
function extractAnimations(css, keyframes) {
  const result = [];
  let i = 0;
  for (const [name, kfCss] of Object.entries(keyframes)) {
    // Find the animation rule that uses this keyframe
    const useRe = new RegExp(`animation(?:-name)?\\s*:[^;]*${name}[^;]*;`, "g");
    const usages = [];
    let m;
    while ((m = useRe.exec(css)) !== null) usages.push(m[0]);

    const preview = name.includes("fade") ? "fade"
      : name.includes("slide") || name.includes("move") || name.includes("scroll") ? "bar"
      : name.includes("pulse") || name.includes("ping") ? "pulse"
      : name.includes("bounce") || name.includes("jump") ? "bounce"
      : "fade";

    result.push({
      id: uid("an", i++),
      name: `@keyframes ${name}`,
      src: "styles.css",
      category: "anim",
      variant: { kind: "anim", style: preview },
      html: null,
      css: kfCss + (usages.length ? "\n\n/* Usage */\n" + usages[0] : ""),
      js: null,
      notes: "Animation CSS pure — directement copiable.",
    });
  }
  return result.slice(0, 12);
}

// ─── HTML extractors ──────────────────────────────────────────────────────────

function getClasses(el) {
  return Array.from(el.classList || []);
}

function extractButtons(doc, pageName, allCSS, keyframes, seen, results) {
  const selectors = [
    "button",
    "a[class*='btn']", "a[class*='button']",
    "[role='button']",
    "input[type='submit']", "input[type='button']",
    "[class*='btn']", "[class*='button']", "[class*='cta']",
  ];
  const els = [];
  for (const sel of selectors) {
    try { els.push(...doc.querySelectorAll(sel)); } catch { /* ignore */ }
  }

  for (const el of els) {
    const html = el.outerHTML?.trim();
    if (!html || html.length > 1000) continue;
    const h = simpleHash(html);
    if (seen.has(h)) continue;
    seen.add(h);

    const classes = getClasses(el);
    const label = textContent(el) || el.getAttribute("value") || "Button";
    const bg = guessColor(el) || "#1a1916";
    const radius = parseInt(inlineStyle(el, "border-radius")) || 6;
    const css = extractCSSForClasses(classes, allCSS, keyframes);
    const vars = extractCSSVars(allCSS, css);

    results.push({
      id: uid("b", results.length),
      name: label.slice(0, 40),
      src: pageName,
      category: "buttons",
      variant: { kind: "btn", bg, fg: "#fff", border: bg, label: label.slice(0, 30), radius },
      html,
      css: [vars, css].filter(Boolean).join("\n\n") || `/* classes: ${classes.join(", ")} */`,
      js: null,
      notes: null,
    });
    if (results.length >= 24) break;
  }
}

function extractForms(doc, pageName, allCSS, keyframes, seen, results) {
  const wrappers = [
    ...doc.querySelectorAll("input[type='text'], input[type='email'], input[type='tel'], input[type='search'], input[type='password']"),
    ...doc.querySelectorAll("select"),
    ...doc.querySelectorAll("textarea"),
    ...doc.querySelectorAll("form"),
    ...doc.querySelectorAll("[class*='form'], [class*='field'], [class*='input']"),
  ];

  for (const el of wrappers) {
    const target = el.closest("div") || el;
    const html = target.outerHTML?.trim();
    if (!html || html.length > 2000) continue;
    const h = simpleHash(html);
    if (seen.has(h)) continue;
    seen.add(h);

    const classes = getClasses(target);
    const label = target.querySelector("label")?.textContent?.trim() ||
      el.getAttribute("placeholder") || el.getAttribute("name") || "Champ";
    const kind = el.tagName === "SELECT" ? "select"
      : el.tagName === "TEXTAREA" ? "textarea"
      : el.getAttribute("type") === "search" ? "search"
      : "input";

    const css = extractCSSForClasses(classes, allCSS, keyframes);
    const vars = extractCSSVars(allCSS, css);

    results.push({
      id: uid("f", results.length),
      name: label.slice(0, 40),
      src: pageName,
      category: "forms",
      variant: { kind, label: label.slice(0, 30), placeholder: el.getAttribute("placeholder") || "" },
      html,
      css: [vars, css].filter(Boolean).join("\n\n") || `/* classes: ${classes.join(", ")} */`,
      js: null,
      notes: null,
    });
    if (results.length >= 16) break;
  }
}

function extractCards(doc, pageName, allCSS, keyframes, seen, results) {
  const cardEls = doc.querySelectorAll(
    "article, [class*='card'], [class*='tile'], [class*='product'], [class*='item'], [class*='teaser']"
  );
  for (const el of cardEls) {
    if (el.children.length < 2) continue;
    const html = el.outerHTML?.trim();
    if (!html || html.length > 3000) continue;
    const h = simpleHash(html);
    if (seen.has(h)) continue;
    seen.add(h);

    const classes = getClasses(el);
    const title = el.querySelector("h1,h2,h3,h4,h5,h6")?.textContent?.trim() ||
      el.querySelector("[class*='title']")?.textContent?.trim() || "Card";
    const css = extractCSSForClasses(classes, allCSS, keyframes);
    const vars = extractCSSVars(allCSS, css);

    results.push({
      id: uid("c", results.length),
      name: title.slice(0, 40),
      src: pageName,
      category: "cards",
      variant: { kind: "article", title: title.slice(0, 30), date: "", category: "" },
      html,
      css: [vars, css].filter(Boolean).join("\n\n"),
      js: null,
      notes: null,
    });
    if (results.length >= 18) break;
  }
}

function extractNav(doc, pageName, allCSS, keyframes, seen, results) {
  const navEls = doc.querySelectorAll("nav, header, [role='navigation'], [class*='nav'], [class*='menu'], [class*='header']");
  for (const el of navEls) {
    const html = el.outerHTML?.trim();
    if (!html || html.length > 5000 || html.length < 50) continue;
    const h = simpleHash(html);
    if (seen.has(h)) continue;
    seen.add(h);

    const classes = getClasses(el);
    const tag = el.tagName.toLowerCase();
    const name = tag === "nav" ? "Navigation" : tag === "header" ? "Header" : "Nav / " + (classes[0] || "menu");
    const css = extractCSSForClasses(classes, allCSS, keyframes);
    const vars = extractCSSVars(allCSS, css);

    results.push({
      id: uid("n", results.length),
      name,
      src: pageName,
      category: "nav",
      variant: { kind: "nav-main" },
      html,
      css: [vars, css].filter(Boolean).join("\n\n"),
      js: null,
      notes: null,
    });
    if (results.length >= 8) break;
  }
}

function extractFooter(doc, pageName, allCSS, keyframes, seen, results) {
  const footerEls = doc.querySelectorAll("footer, [role='contentinfo'], [class*='footer']");
  for (const el of footerEls) {
    const html = el.outerHTML?.trim();
    if (!html || html.length > 6000 || html.length < 30) continue;
    const h = simpleHash(html);
    if (seen.has(h)) continue;
    seen.add(h);

    const classes = getClasses(el);
    const css = extractCSSForClasses(classes, allCSS, keyframes);
    const vars = extractCSSVars(allCSS, css);

    results.push({
      id: uid("ft", results.length),
      name: "Footer",
      src: pageName,
      category: "footer",
      variant: { kind: "footer-4" },
      html,
      css: [vars, css].filter(Boolean).join("\n\n"),
      js: null,
      notes: null,
    });
    if (results.length >= 6) break;
  }
}

function extractHero(doc, pageName, allCSS, keyframes, seen, results) {
  const heroEls = doc.querySelectorAll(
    "[class*='hero'], [class*='banner'], [class*='jumbotron'], [class*='cover'], section:first-of-type"
  );
  for (const el of heroEls) {
    if (el.getBoundingClientRect) { /* skip */ }
    const html = el.outerHTML?.trim();
    if (!html || html.length > 8000 || html.length < 60) continue;
    const h = simpleHash(html);
    if (seen.has(h)) continue;
    seen.add(h);

    const classes = getClasses(el);
    const title = el.querySelector("h1,h2")?.textContent?.trim() || "Hero";
    const css = extractCSSForClasses(classes, allCSS, keyframes);
    const vars = extractCSSVars(allCSS, css);

    results.push({
      id: uid("h", results.length),
      name: `Hero — ${title.slice(0, 30)}`,
      src: pageName,
      category: "hero",
      variant: { kind: "hero-editorial", title: title.slice(0, 40), sub: "" },
      html,
      css: [vars, css].filter(Boolean).join("\n\n"),
      js: null,
      notes: null,
    });
    if (results.length >= 8) break;
  }
}

function extractIcons(doc, pageName, seen, results) {
  const svgs = doc.querySelectorAll("svg");
  for (const svg of svgs) {
    const html = svg.outerHTML?.trim();
    if (!html || html.length > 2000 || html.length < 10) continue;
    // Skip very large SVGs (likely illustrations)
    if (html.length > 600) continue;
    const h = simpleHash(html);
    if (seen.has(h)) continue;
    seen.add(h);

    const title = svg.querySelector("title")?.textContent?.trim() ||
      svg.getAttribute("aria-label") ||
      svg.getAttribute("data-name") ||
      `icon-${results.length}`;

    results.push({
      id: uid("ic", results.length),
      name: title,
      src: pageName,
      category: "icons",
      variant: { kind: "icon-raw" },
      html,
      css: `svg {\n  width: 24px;\n  height: 24px;\n  stroke: currentColor;\n  fill: none;\n}`,
      js: null,
      notes: null,
    });
    if (results.length >= 48) break;
  }
}

function extractImages(doc, pageName, seen, results) {
  const imgs = doc.querySelectorAll("img");
  for (const img of imgs) {
    const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
    const alt = img.getAttribute("alt") || src.split("/").pop() || "image";
    if (!src || src.startsWith("data:") || src.startsWith("http")) continue;

    const h = simpleHash(src);
    if (seen.has(h)) continue;
    seen.add(h);

    results.push({
      id: uid("im", results.length),
      name: alt.slice(0, 40) || src.split("/").pop(),
      src: pageLabel(src),
      category: "images",
      variant: { kind: "image", hue: (results.length * 37) % 360, path: src },
      html: `<img src="${src}" alt="${alt}" />`,
      css: null,
      js: null,
      notes: null,
    });
    if (results.length >= 30) break;
  }
}

// ─── JS animation reconstruction ─────────────────────────────────────────────

const JS_LIBS = [
  { pattern: /gsap|TweenMax|TweenLite/i, name: "GSAP" },
  { pattern: /webflow/i, name: "Webflow.js" },
  { pattern: /anime\.js|animejs/i, name: "Anime.js" },
  { pattern: /ScrollTrigger/i, name: "GSAP ScrollTrigger" },
  { pattern: /AOS\./i, name: "AOS (Animate on Scroll)" },
  { pattern: /Swiper|slick|glide|splide/i, name: "Slider library" },
  { pattern: /lottie/i, name: "Lottie" },
];

function detectJSLibs(jsContent) {
  const found = [];
  for (const lib of JS_LIBS) {
    if (lib.pattern.test(jsContent)) found.push(lib.name);
  }
  return found;
}

// Generate CSS equivalent for common JS animation patterns
function reconstructAnimationCSS(jsContent, elementHtml) {
  const lines = [];

  if (/gsap.*opacity|opacity.*gsap/i.test(jsContent)) {
    lines.push(`/* Fade-in (reconstructed depuis GSAP) */
.element {
  opacity: 0;
  animation: fadeIn 0.8s ease forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}`);
  }

  if (/ScrollTrigger|scroll.*trigger|IntersectionObserver/i.test(jsContent)) {
    lines.push(`/* Scroll reveal (reconstructed depuis JS) */
.element {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.element.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Activer avec IntersectionObserver (CSS pur, sans dépendance) */`);
  }

  if (/marquee|scrolling.*text|ticker/i.test(jsContent + elementHtml)) {
    lines.push(`/* Marquee (reconstructed depuis JS) */
.marquee-track {
  display: flex;
  gap: 2rem;
  animation: marquee 20s linear infinite;
  width: max-content;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}`);
  }

  if (/parallax/i.test(jsContent)) {
    lines.push(`/* Parallax simplifié (CSS pur) */
.parallax {
  background-attachment: fixed;
  background-position: center;
  background-size: cover;
}
/* Note : effect JS complet = transform translateY calculé au scroll */`);
  }

  if (/hover.*scale|scale.*hover/i.test(jsContent)) {
    lines.push(`/* Hover zoom (reconstructed) */
.element {
  transition: transform 0.3s ease;
}
.element:hover {
  transform: scale(1.05);
}`);
  }

  return lines.join("\n\n");
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export async function parseZip(file, onProgress) {
  const log = (msg) => onProgress?.({ type: "log", msg });
  const progress = (pct) => onProgress?.({ type: "progress", pct });

  log(`Réception de ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} Mo)…`);
  progress(3);

  let zip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch (e) {
    throw new Error("Impossible d'ouvrir le ZIP : " + e.message);
  }

  // Inventory files
  const htmlFiles = [];
  const cssFiles = [];
  const jsFiles = [];
  const imageFiles = [];
  const svgFiles = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const p = path.toLowerCase();
    if (p.endsWith(".html") || p.endsWith(".htm")) htmlFiles.push({ path, entry });
    else if (p.endsWith(".css")) cssFiles.push({ path, entry });
    else if (p.endsWith(".js") && !p.includes("node_modules") && !p.includes("vendor")) jsFiles.push({ path, entry });
    else if (p.match(/\.(jpg|jpeg|png|webp|gif|avif)$/)) imageFiles.push({ path, entry });
    else if (p.endsWith(".svg")) svgFiles.push({ path, entry });
  }

  log(`${htmlFiles.length} pages HTML · ${cssFiles.length} feuilles CSS · ${jsFiles.length} scripts JS`);
  progress(10);

  // Load all CSS
  const cssContents = await Promise.all(cssFiles.map(f => f.entry.async("text").catch(() => "")));
  const allCSS = cssContents.join("\n\n");
  log(`CSS chargé (${(allCSS.length / 1024).toFixed(0)} Ko)`);
  progress(20);

  // Load all JS to detect frameworks
  const jsContents = await Promise.all(jsFiles.slice(0, 15).map(f => f.entry.async("text").catch(() => "")));
  const allJS = jsContents.join("\n");
  const detectedLibs = detectJSLibs(allJS);
  if (detectedLibs.length) {
    log(`Frameworks JS détectés : ${detectedLibs.join(", ")}`);
  }
  progress(28);

  // Extract keyframes
  const keyframes = extractKeyframes(allCSS);
  log(`${Object.keys(keyframes).length} @keyframes trouvés dans le CSS`);
  progress(32);

  // Extract global assets
  log("Extraction de la palette de couleurs…");
  const colors = extractColors(allCSS);
  log(`${colors.length} couleurs extraites`);
  progress(38);

  log("Extraction de la typographie…");
  const typography = extractTypography(allCSS);
  log(`${typography.length} styles typographiques`);
  progress(44);

  log("Extraction des animations CSS…");
  const animations = extractAnimations(allCSS, keyframes);

  // If JS frameworks found, also add reconstructed animations
  if (detectedLibs.length && allJS.length > 100) {
    log(`Reconstruction CSS des animations JS (${detectedLibs.join(", ")})…`);
    const reconstructed = reconstructAnimationCSS(allJS, "");
    if (reconstructed) {
      animations.push({
        id: uid("an", animations.length),
        name: "Animations JS → CSS pur",
        src: "scripts.js",
        category: "anim",
        variant: { kind: "anim", style: "fade" },
        html: null,
        css: reconstructed,
        js: null,
        notes: `Animations recréées en CSS pur depuis : ${detectedLibs.join(", ")}. Aucune dépendance externe requise.`,
      });
    }
  }
  log(`${animations.length} animations`);
  progress(50);

  // Parse HTML pages
  const elements = {
    buttons: [], forms: [], cards: [], nav: [], footer: [],
    hero: [], icons: [], images: [], layouts: [],
  };
  const seenPerCat = {
    buttons: new Set(), forms: new Set(), cards: new Set(), nav: new Set(),
    footer: new Set(), hero: new Set(), icons: new Set(), images: new Set(),
  };

  const pageCount = Math.min(htmlFiles.length, 30);
  for (let i = 0; i < pageCount; i++) {
    const { path, entry } = htmlFiles[i];
    const pageName = pageLabel(path);
    let html;
    try { html = await entry.async("text"); } catch { continue; }

    const doc = new DOMParser().parseFromString(html, "text/html");
    log(`Analyse de ${pageName}…`);

    // Extract inline <style> too
    const inlineCSS = [...doc.querySelectorAll("style")].map(s => s.textContent).join("\n");
    const pageCss = allCSS + "\n" + inlineCSS;
    const pageKeyframes = { ...keyframes, ...extractKeyframes(inlineCSS) };

    extractButtons(doc, pageName, pageCss, pageKeyframes, seenPerCat.buttons, elements.buttons);
    extractForms(doc, pageName, pageCss, pageKeyframes, seenPerCat.forms, elements.forms);
    extractCards(doc, pageName, pageCss, pageKeyframes, seenPerCat.cards, elements.cards);
    extractNav(doc, pageName, pageCss, pageKeyframes, seenPerCat.nav, elements.nav);
    extractFooter(doc, pageName, pageCss, pageKeyframes, seenPerCat.footer, elements.footer);
    extractHero(doc, pageName, pageCss, pageKeyframes, seenPerCat.hero, elements.hero);
    extractIcons(doc, pageName, seenPerCat.icons, elements.icons);
    extractImages(doc, pageName, seenPerCat.images, elements.images);

    progress(50 + Math.round((i / pageCount) * 40));
  }

  // Add SVG files as standalone icons
  for (const { path, entry } of svgFiles.slice(0, 24)) {
    const svgHtml = await entry.async("text").catch(() => "");
    if (!svgHtml || svgHtml.length > 3000) continue;
    const h = simpleHash(svgHtml);
    if (seenPerCat.icons.has(h)) continue;
    seenPerCat.icons.add(h);
    elements.icons.push({
      id: uid("ic", elements.icons.length),
      name: pageLabel(path).replace(".svg", ""),
      src: pageLabel(path),
      category: "icons",
      variant: { kind: "icon-raw" },
      html: svgHtml,
      css: `svg { width: 24px; height: 24px; }`,
      js: null,
      notes: null,
    });
  }

  // Generate basic layout elements
  elements.layouts = [
    { id: "l0", name: "Landing page", src: htmlFiles[0]?.path ? pageLabel(htmlFiles[0].path) : "index.html", category: "layouts", variant: { kind: "layout", l: "hero" }, html: null, css: null, js: null, notes: null },
    { id: "l1", name: "Grille 2 colonnes", src: "layout", category: "layouts", variant: { kind: "layout", l: "grid" }, html: null, css: `.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }`, js: null, notes: null },
    { id: "l2", name: "Split image / texte", src: "layout", category: "layouts", variant: { kind: "layout", l: "split" }, html: null, css: `.split { display: grid; grid-template-columns: 1fr 1fr; }`, js: null, notes: null },
  ];

  progress(95);

  const allElements = {
    buttons: elements.buttons,
    forms: elements.forms,
    cards: elements.cards,
    nav: elements.nav,
    footer: elements.footer,
    hero: elements.hero,
    typography,
    colors,
    icons: elements.icons,
    images: elements.images,
    anim: animations,
    layouts: elements.layouts,
  };

  const total = Object.values(allElements).reduce((a, b) => a + b.length, 0);
  log(`✓ ${total} éléments extraits depuis ${pageCount} pages`);
  progress(100);

  return {
    elements: allElements,
    css: allCSS,
    pages: pageCount,
    total,
    detectedLibs,
  };
}

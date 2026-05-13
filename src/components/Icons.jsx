export function Icon({ name, size = 16, stroke = 1.6 }) {
  const s = { width: size, height: size, strokeWidth: stroke, fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "search":      return <svg viewBox="0 0 24 24" {...s}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    case "plus":        return <svg viewBox="0 0 24 24" {...s}><path d="M12 5v14M5 12h14" /></svg>;
    case "minus":       return <svg viewBox="0 0 24 24" {...s}><path d="M5 12h14" /></svg>;
    case "close":       return <svg viewBox="0 0 24 24" {...s}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case "menu":        return <svg viewBox="0 0 24 24" {...s}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "grid":        return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case "list":        return <svg viewBox="0 0 24 24" {...s}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    case "upload":      return <svg viewBox="0 0 24 24" {...s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>;
    case "download":    return <svg viewBox="0 0 24 24" {...s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>;
    case "zip":         return <svg viewBox="0 0 24 24" {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M10 12h2v2h-2zM10 16h2v2h-2z" /></svg>;
    case "copy":        return <svg viewBox="0 0 24 24" {...s}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
    case "check":       return <svg viewBox="0 0 24 24" {...s}><path d="m5 12 5 5L20 7" /></svg>;
    case "external":    return <svg viewBox="0 0 24 24" {...s}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" /></svg>;
    case "more":        return <svg viewBox="0 0 24 24" {...s}><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></svg>;
    case "settings":    return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    case "trash":       return <svg viewBox="0 0 24 24" {...s}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>;
    case "filter":      return <svg viewBox="0 0 24 24" {...s}><path d="M22 3H2l8 9.46V19l4 2v-8.54z" /></svg>;
    case "arrow-right": return <svg viewBox="0 0 24 24" {...s}><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
    case "arrow-down":  return <svg viewBox="0 0 24 24" {...s}><path d="M12 5v14M5 13l7 7 7-7" /></svg>;
    case "arrow-left":  return <svg viewBox="0 0 24 24" {...s}><path d="M19 12H5M11 19l-7-7 7-7" /></svg>;
    case "cart":        return <svg viewBox="0 0 24 24" {...s}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>;
    case "user":        return <svg viewBox="0 0 24 24" {...s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case "heart":       return <svg viewBox="0 0 24 24" {...s}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
    case "ig":          return <svg viewBox="0 0 24 24" {...s}><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01" /></svg>;
    case "globe":       return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>;
    case "folder":      return <svg viewBox="0 0 24 24" {...s}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>;
    case "sparkles":    return <svg viewBox="0 0 24 24" {...s}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" /></svg>;
    case "spinner":     return <svg viewBox="0 0 24 24" {...s} style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.2-8.55" /></svg>;
    case "cat-button":  return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="8" width="18" height="8" rx="4" /></svg>;
    case "cat-form":    return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="7" width="18" height="10" rx="2" /><path d="M7 12h6" /></svg>;
    case "cat-card":    return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 14h18M9 18h6" /></svg>;
    case "cat-nav":     return <svg viewBox="0 0 24 24" {...s}><path d="M3 6h18M3 6v4M9 6v4M15 6v4M21 6v4" /></svg>;
    case "cat-footer":  return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 16h18" /></svg>;
    case "cat-hero":    return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 9h10M7 13h6" /></svg>;
    case "cat-type":    return <svg viewBox="0 0 24 24" {...s}><path d="M4 7V5h16v2M9 5v14M15 5v14M7 19h4M13 19h4" /></svg>;
    case "cat-color":   return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9" /><circle cx="8" cy="10" r="1.5" fill="currentColor" /><circle cx="16" cy="10" r="1.5" fill="currentColor" /><circle cx="12" cy="16" r="1.5" fill="currentColor" /></svg>;
    case "cat-icon":    return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></svg>;
    case "cat-image":   return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>;
    case "cat-anim":    return <svg viewBox="0 0 24 24" {...s}><path d="M3 12a9 9 0 1 0 9-9" /><path d="m17 8 4-5v5z" fill="currentColor" stroke="none" /></svg>;
    case "cat-layout":  return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>;
    default: return null;
  }
}

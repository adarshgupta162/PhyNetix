import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

/* NTA-style Accessibility + Screen Magnifier (drop-in for "@/components/test/AccessibilityToolbar").
   - Renders the two header buttons with the exact markup/inline styles of the NTA page
     (they sit inside `._header_right_controls_cexgz_21`, next to Instructions / Question Paper).
   - Dark mode toggles the NTA `dark-theme` class on the nearest `.nta-root` (styles are in nta-test.css).
   - Font size scales `#question-container`; cursor trail / cursor size are page-wide.
   - Screen Magnifier: 2x lens that follows the mouse. */

const ARROW = (s: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M3 2l7 19 3-8 8-3z" fill="#000" stroke="#fff" stroke-width="1.5"/></svg>`)}") 2 2, auto`;

const GLOBAL_CSS = `
.nta-root.dark-theme .nta-a11y-panel svg { filter: none !important; }
html[data-nta-font="0"] #question-container { zoom: 0.9; }
html[data-nta-font="2"] #question-container { zoom: 1.2; }
html[data-nta-cursor="1"], html[data-nta-cursor="1"] * { cursor: ${ARROW(32)} !important; }
html[data-nta-cursor="2"], html[data-nta-cursor="2"] * { cursor: ${ARROW(52)} !important; }
`;

const headerItem = (bg: string): CSSProperties => ({ fontFamily: "Arial, sans-serif", cursor: "pointer", color: "white", borderRadius: 5, padding: "1px 8px", display: "flex", alignItems: "center", gap: 5, backgroundColor: "rgb(54, 54, 54)" });
const iconDot = (bg: string): CSSProperties => ({ backgroundColor: bg, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" });

function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      style={{ width: 60, height: 29, borderRadius: 15, border: "none", background: on ? "rgb(21,126,179)" : "rgb(206,206,206)", position: "relative", cursor: "pointer", padding: 0, transition: "background .2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 2.5, left: on ? 33 : 2.5, width: 24, height: 24, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.3)", transition: "left .2s" }} />
    </button>
  );
}

function Circle({ selected, onClick, children, label }: { selected: boolean; onClick: () => void; children: ReactNode; label: string }) {
  return (
    <button type="button" aria-label={label} aria-pressed={selected} onClick={onClick}
      style={{ width: 48, height: 48, borderRadius: "50%", border: `2px solid ${selected ? "rgb(100,195,220)" : "rgb(210,210,210)"}`, background: selected ? "rgb(224,244,248)" : "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 5px", padding: 0, color: "#000", fontFamily: "Arial, sans-serif" }}>
      {children}
    </button>
  );
}

const Arrow = ({ s, fill, stroke = "#000" }: { s: number; fill: string; stroke?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ filter: "none" }}><path d="M3 2l7 19 3-8 8-3z" fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" /></svg>
);
const Sun = ({ c = "#222" }: { c?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" style={{ filter: "none" }}>
    <circle cx="12" cy="12" r="4" />{[0, 45, 90, 135, 180, 225, 270, 315].map(a => <line key={a} x1="12" y1="2.5" x2="12" y2="5" transform={`rotate(${a} 12 12)`} />)}
  </svg>
);
const Moon = ({ c = "#222" }: { c?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.9" strokeLinejoin="round" style={{ filter: "none" }}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
);

export default function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [font, setFont] = useState(1);      // 0 small, 1 medium (default), 2 large
  const [trail, setTrail] = useState(false);
  const [cursor, setCursor] = useState(0);  // 0 default, 1 medium, 2 large
  const [mag, setMag] = useState(false);

  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const root = () => anchorRef.current?.closest(".nta-root") as HTMLElement | null;

  useEffect(() => { root()?.classList.toggle("dark-theme", dark); return () => root()?.classList.remove("dark-theme"); }, [dark]);
  useEffect(() => { document.documentElement.setAttribute("data-nta-font", String(font)); return () => document.documentElement.removeAttribute("data-nta-font"); }, [font]);
  useEffect(() => {
    if (cursor) document.documentElement.setAttribute("data-nta-cursor", String(cursor)); else document.documentElement.removeAttribute("data-nta-cursor");
    return () => document.documentElement.removeAttribute("data-nta-cursor");
  }, [cursor]);

  /* close panel on outside click / Esc */
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { const t = e.target as Node; if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return; setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);

  /* cursor trail */
  useEffect(() => {
    if (!trail) return;
    const move = (e: MouseEvent) => {
      const d = document.createElement("div");
      d.style.cssText = `position:fixed;pointer-events:none;z-index:2147483000;width:12px;height:12px;border-radius:50%;background:rgba(21,126,179,.5);left:${e.clientX - 6}px;top:${e.clientY - 6}px;transition:opacity .5s;opacity:1`;
      document.body.appendChild(d);
      requestAnimationFrame(() => { d.style.opacity = "0"; });
      setTimeout(() => d.remove(), 550);
    };
    document.addEventListener("mousemove", move);
    return () => document.removeEventListener("mousemove", move);
  }, [trail]);

  /* screen magnifier (2x) */
  useEffect(() => {
    if (!mag) return;
    const Z = 2, W = Math.min(600, window.innerWidth * 0.94), H = 198;
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    const place = () => {
      const lens = lensRef.current, zin = zoomRef.current; if (!lens || !zin) return;
      lens.style.display = "block";
      lens.style.left = `${Math.max(4, Math.min(mx - W / 2, window.innerWidth - W - 4))}px`;
      lens.style.top = `${my + H + 30 < window.innerHeight ? my + 28 : Math.max(4, my - H - 28)}px`;
      zin.style.transform = `translate(${W / 2 - mx * Z}px,${H / 2 - my * Z}px) scale(${Z})`;
    };
    const refresh = () => {
      const src = root(), zin = zoomRef.current; if (!src || !zin) return;
      zin.style.width = `${window.innerWidth}px`; zin.style.height = `${window.innerHeight}px`;
      const clone = src.cloneNode(true) as HTMLElement;
      clone.style.cssText = `position:absolute;left:0;top:0;width:${window.innerWidth}px;height:${window.innerHeight}px;overflow:hidden`;
      clone.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
      zin.replaceChildren(clone);
      const o = src.querySelectorAll("*"), c = clone.querySelectorAll("*");
      o.forEach((el, i) => {
        const t = c[i] as HTMLElement | undefined; if (!t) return;
        if (el.scrollTop) t.scrollTop = el.scrollTop;
        if (el instanceof HTMLInputElement) { (t as HTMLInputElement).value = el.value; (t as HTMLInputElement).checked = el.checked; }
      });
    };
    const move = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; place(); };
    refresh(); place();
    const iv = window.setInterval(refresh, 500);
    document.addEventListener("mousemove", move);
    return () => { clearInterval(iv); document.removeEventListener("mousemove", move); if (lensRef.current) lensRef.current.style.display = "none"; };
  }, [mag]);

  const fg = dark ? "#fff" : "#333";
  const card: CSSProperties = { background: dark ? "rgb(36,36,36)" : "#fff", borderRadius: 3, padding: "20px 8px 0", textAlign: "center", fontSize: 14, color: fg, height: 108, boxSizing: "border-box" };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div ref={anchorRef} className="accessibility-toggle _header_control_item_cexgz_27" style={headerItem("")} onClick={() => setOpen(o => !o)}>
        <div style={iconDot("rgb(52, 186, 107)")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1" /><path d="m9 20 3-6 3 6" /><path d="m6 8 6 2 6-2" /><path d="M12 10v4" /></svg>
        </div>
        <span style={{ fontSize: 13 }}>Accessibility</span>
      </div>

      <div className="magnifier-toggle _header_control_item_cexgz_27" style={headerItem("")} onClick={() => setMag(m => !m)}>
        <div style={iconDot("rgb(255, 184, 0)")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M16 16l-2.5 -2.5" /><path d="M3 7v-2a2 2 0 0 1 2 -2h2" /><path d="M3 17v2a2 2 0 0 0 2 2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M17 21h2a2 2 0 0 0 2 -2v-2" /></svg>
        </div>
        <span style={{ fontSize: 13 }}>Screen Magnifier</span>
      </div>

      {open && (
        <div ref={panelRef} className="nta-a11y-panel" style={{ position: "fixed", top: 80, right: 20, width: 444, maxWidth: "96vw", background: dark ? "rgb(27,27,27)" : "rgb(243,243,243)", boxShadow: "0 4px 16px rgba(0,0,0,.45)", borderRadius: 3, padding: "20px 20px 20px", boxSizing: "border-box", zIndex: 1000002, fontFamily: "Arial, sans-serif", color: fg, filter: "none" }}>
          <div style={{ textAlign: "center", fontSize: 19, color: fg, margin: "0 0 17px", lineHeight: "28px" }}>Accessibility Adjustments</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={card}>
              Switch to Dark Mode
              <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                <Sun c={dark ? "#fff" : "#222"} /><Switch on={dark} onClick={() => setDark(d => !d)} label="Dark mode" /><Moon c={dark ? "#fff" : "#222"} />
              </div>
            </div>
            <div style={{ ...card, paddingTop: 12 }}>
              Select Font Size
              <div style={{ marginTop: 10 }}>
                {[14, 19, 24].map((fs, i) => <Circle key={i} selected={font === i} onClick={() => setFont(i)} label={["Small", "Medium", "Large"][i] + " font"}><span style={{ fontSize: fs }}>A</span></Circle>)}
              </div>
            </div>
            <div style={card}>
              Enable Cursor Trail
              <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <Arrow s={22} fill={dark ? "none" : "#fff"} stroke={dark ? "#fff" : "#000"} /><Switch on={trail} onClick={() => setTrail(t => !t)} label="Cursor trail" />
              </div>
            </div>
            <div style={{ ...card, paddingTop: 12 }}>
              Choose Cursor Size
              <div style={{ marginTop: 10 }}>
                {[18, 24, 30].map((s, i) => <Circle key={i} selected={cursor === i} onClick={() => setCursor(i)} label={["Default", "Medium", "Large"][i] + " cursor"}><Arrow s={s} fill={i === 2 ? "#000" : "#fff"} /></Circle>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {createPortal(
        <div ref={lensRef} aria-hidden style={{ display: "none", position: "fixed", width: Math.min(600, typeof window !== "undefined" ? window.innerWidth * 0.94 : 600), height: 198, border: "3px solid #333", borderRadius: 12, background: "#fff", overflow: "hidden", zIndex: 2147483500, pointerEvents: "none", boxShadow: "0 6px 20px rgba(0,0,0,.3)" }}>
          <div ref={zoomRef} style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0" }} />
        </div>,
        document.body
      )}
    </>
  );
}

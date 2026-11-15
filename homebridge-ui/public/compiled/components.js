"use strict";
(() => {
  const Pill = ({ tone = "neutral", icon, children }) => {
    const tones = {
      neutral: { bg: "var(--bg-2)", fg: "var(--fg-3)", bd: "1px solid var(--border-1)" },
      success: { bg: "var(--success-bg)", fg: "var(--success-fg)", bd: "none" },
      warning: { bg: "var(--warning-bg)", fg: "var(--warning-fg)", bd: "none" },
      danger: { bg: "var(--danger-bg)", fg: "var(--danger-fg)", bd: "none" },
      info: { bg: "var(--info-bg)", fg: "var(--info-fg)", bd: "none" },
      brand: { bg: "color-mix(in oklab, var(--brand-500) 18%, var(--bg-1))", fg: "var(--brand-300)", bd: "none" }
    };
    const t = tones[tone] || tones.neutral;
    return /* @__PURE__ */ React.createElement("span", { style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 999,
      background: t.bg,
      color: t.fg,
      border: t.bd,
      font: "500 11.5px var(--font-sans)",
      whiteSpace: "nowrap"
    } }, icon && /* @__PURE__ */ React.createElement("i", { className: "bi " + icon, style: { fontSize: tone === "neutral" ? 10 : 12 } }), children);
  };
  const Card = ({ title, action, children, padded = true, style }) => /* @__PURE__ */ React.createElement("div", { style: {
    background: "var(--bg-1)",
    border: "1px solid var(--border-1)",
    borderRadius: "var(--r-2)",
    ...style
  } }, title && /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid var(--border-1)",
    font: "600 13px var(--font-sans)",
    color: "var(--fg-1)"
  } }, /* @__PURE__ */ React.createElement("span", null, title), action), /* @__PURE__ */ React.createElement("div", { style: { padding: padded ? 16 : 0 } }, children));
  const Toggle = ({ on, onClick }) => /* @__PURE__ */ React.createElement("button", { onClick, "aria-pressed": on, style: {
    width: 36,
    height: 20,
    border: "none",
    cursor: "pointer",
    borderRadius: 999,
    position: "relative",
    background: on ? "var(--brand-500)" : "var(--border-2)",
    transition: "background 120ms var(--ease)",
    flexShrink: 0
  } }, /* @__PURE__ */ React.createElement("span", { style: {
    position: "absolute",
    left: 2,
    top: 2,
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "#fff",
    transform: on ? "translateX(16px)" : "translateX(0)",
    transition: "transform 120ms var(--ease)"
  } }));
  const WearBar = ({ used, max }) => {
    const pct = Math.min(100, used / max * 100);
    let color = "var(--wear-0)";
    if (pct > 90) color = "var(--wear-3)";
    else if (pct > 70) color = "var(--wear-2)";
    else if (pct > 50) color = "var(--wear-1)";
    return /* @__PURE__ */ React.createElement("div", { style: { height: 5, background: "var(--bg-0)", borderRadius: 999, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
      height: "100%",
      width: pct + "%",
      background: color,
      borderRadius: 999,
      transition: "width 220ms var(--ease)"
    } }));
  };
  const Btn = ({ variant = "secondary", icon, children, onClick, disabled, size = "md", loading }) => {
    const variants = {
      primary: { bg: "var(--brand-500)", fg: "#0F1216", bd: "none" },
      secondary: { bg: "transparent", fg: "var(--fg-2)", bd: "1px solid var(--border-2)" },
      danger: { bg: "transparent", fg: "var(--danger-fg)", bd: "1px solid color-mix(in oklab, var(--danger-500) 50%, transparent)" },
      ghost: { bg: "transparent", fg: "var(--fg-3)", bd: "none" }
    };
    const v = variants[variant];
    const pad = size === "sm" ? "5px 10px" : "8px 14px";
    const fs = size === "sm" ? 11.5 : 13;
    return /* @__PURE__ */ React.createElement("button", { onClick, disabled: disabled || loading, style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: pad,
      borderRadius: 6,
      cursor: disabled ? "not-allowed" : "pointer",
      background: v.bg,
      color: v.fg,
      border: v.bd,
      font: `${variant === "primary" ? 600 : 500} ${fs}px var(--font-sans)`,
      opacity: disabled || loading ? 0.6 : 1,
      transition: "background 120ms var(--ease), border-color 120ms var(--ease)"
    } }, loading ? /* @__PURE__ */ React.createElement("span", { style: { width: 12, height: 12, border: "1.5px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 600ms linear infinite", display: "inline-block" } }) : icon && /* @__PURE__ */ React.createElement("i", { className: "bi " + icon }), children);
  };
  const Section = ({ title, hint, action, children }) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, (title || action) && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 8 } }, /* @__PURE__ */ React.createElement("div", null, title && /* @__PURE__ */ React.createElement("div", { style: { font: "600 13px var(--font-sans)", color: "var(--fg-1)" } }, title), hint && /* @__PURE__ */ React.createElement("div", { style: { font: "400 12px var(--font-sans)", color: "var(--fg-4)", marginTop: 2 } }, hint)), action), children);
  const Stat = ({ label, value, accent, icon }) => /* @__PURE__ */ React.createElement("div", { style: {
    padding: 14,
    background: "var(--bg-1)",
    border: "1px solid var(--border-1)",
    borderRadius: 10
  } }, /* @__PURE__ */ React.createElement("div", { style: { font: "500 11px var(--font-sans)", color: "var(--fg-3)" } }, label), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginTop: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { font: "600 22px var(--font-sans)", color: "var(--fg-1)", fontVariantNumeric: "tabular-nums" } }, value), icon && /* @__PURE__ */ React.createElement("i", { className: "bi " + icon, style: { color: accent || "var(--fg-3)" } })));
  const Field = ({ label, hint, children }) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 5 } }, label && /* @__PURE__ */ React.createElement("div", { style: { font: "500 11.5px var(--font-sans)", color: "var(--fg-3)" } }, label), children, hint && /* @__PURE__ */ React.createElement("div", { style: { font: "400 11.5px var(--font-sans)", color: "var(--fg-4)" } }, hint));
  const Input = (props) => /* @__PURE__ */ React.createElement("input", { ...props, style: {
    background: "var(--bg-0)",
    border: "1px solid var(--border-2)",
    color: "var(--fg-1)",
    padding: "8px 10px",
    borderRadius: 6,
    font: "400 13px var(--font-sans)",
    outline: "none",
    width: "100%",
    transition: "border-color 120ms var(--ease)",
    ...props.style || {}
  } });
  const Segmented = ({ options, value, onChange }) => /* @__PURE__ */ React.createElement("div", { style: {
    display: "inline-flex",
    padding: 3,
    background: "var(--bg-0)",
    border: "1px solid var(--border-1)",
    borderRadius: 8,
    gap: 2,
    flexWrap: "wrap"
  } }, options.map((opt) => {
    const active = opt.value === value;
    return /* @__PURE__ */ React.createElement("button", { key: opt.value, onClick: () => onChange(opt.value), style: {
      background: active ? "var(--brand-500)" : "transparent",
      color: active ? "#0F1216" : "var(--fg-3)",
      border: "none",
      padding: "6px 12px",
      borderRadius: 6,
      font: `${active ? 600 : 500} 12.5px var(--font-sans)`,
      cursor: "pointer"
    } }, opt.label);
  }));
  const Divider = () => /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "var(--border-1)" } });
  const EmptyState = ({ icon, title, hint }) => /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 16px",
    textAlign: "center",
    gap: 8
  } }, /* @__PURE__ */ React.createElement("i", { className: "bi " + icon, style: { fontSize: 28, color: "var(--fg-4)" } }), /* @__PURE__ */ React.createElement("div", { style: { font: "600 14px var(--font-sans)", color: "var(--fg-1)" } }, title), hint && /* @__PURE__ */ React.createElement("div", { style: { font: "400 12.5px var(--font-sans)", color: "var(--fg-4)", maxWidth: 360 } }, hint));
  Object.assign(window, { Pill, Card, Toggle, WearBar, Btn, Section, Stat, Field, Input, Segmented, Divider, EmptyState });
})();

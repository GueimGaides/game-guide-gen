"use client";
import { useState, useEffect } from "react";

// Color presets — name, blue accent, purple accent
const COLOR_PRESETS = [
  { name: "Default",    blue: "#3b7dd8", purple: "#7c5cbf", bg: "#090c14" },
  { name: "Teal",       blue: "#0d9488", purple: "#0e7490", bg: "#030f0e" },
  { name: "Crimson",    blue: "#dc2626", purple: "#9f1239", bg: "#0f0505" },
  { name: "Amber",      blue: "#d97706", purple: "#b45309", bg: "#0f0a02" },
  { name: "Emerald",    blue: "#16a34a", purple: "#15803d", bg: "#030a05" },
  { name: "Rose",       blue: "#e11d48", purple: "#9333ea", bg: "#0f0309" },
  { name: "Slate",      blue: "#64748b", purple: "#475569", bg: "#080a0f" },
  { name: "Cyan",       blue: "#0891b2", purple: "#0e7490", bg: "#020c10" },
];

const SEASON_OPTIONS = [
  { value: "default",   label: "None" },
  { value: "christmas", label: "🎄 Christmas" },
  { value: "pride",     label: "🏳️‍🌈 Pride" },
  { value: "halloween", label: "🎃 Halloween" },
];

const STORAGE_KEY = "gg_admin_colors";
const HISTORY_LIMIT = 5;

interface ColorState {
  blue: string;
  purple: string;
  bg: string;
}

function applyColors(colors: ColorState) {
  const root = document.documentElement;
  root.style.setProperty("--accent-blue", colors.blue);
  root.style.setProperty("--accent-purple", colors.purple);
  root.style.setProperty("--bg-primary", colors.bg);
}

function saveColors(colors: ColorState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
}

export function loadSavedColors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ColorState;
  } catch {
    return null;
  }
}

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [authed, setAuthed]         = useState(false);
  const [pwInput, setPwInput]       = useState("");
  const [pwError, setPwError]       = useState("");
  const [current, setCurrent] = useState<ColorState>(() => {
  return loadSavedColors() ?? {
    blue: COLOR_PRESETS[0].blue,
    purple: COLOR_PRESETS[0].purple,
    bg: COLOR_PRESETS[0].bg,
    };
});
const [history, setHistory] = useState<ColorState[]>([]);
const [activeSeason, setActiveSeason] = useState<string>(() => {
  if (typeof window === "undefined") return "default";
  return document.documentElement.getAttribute("data-season") ?? "default";
});
const [customBlue, setCustomBlue] = useState<string>(() => {
  return loadSavedColors()?.blue ?? "#3b7dd8";
});
const [customPurple, setCustomPurple] = useState<string>(() => {
  return loadSavedColors()?.purple ?? "#7c5cbf";
});
const [customBg, setCustomBg] = useState<string>(() => {
  return loadSavedColors()?.bg ?? "#090c14";
});

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleAuth() {
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwInput }),
      });
      if (res.ok) {
        setAuthed(true);
        setPwError("");
      } else {
        setPwError("Wrong password.");
        setPwInput("");
      }
    } catch {
      setPwError("Something went wrong.");
    }
  }

  function applyPreset(preset: ColorState) {
    setHistory((prev) => [current, ...prev].slice(0, HISTORY_LIMIT));
    setCurrent(preset);
    setCustomBlue(preset.blue);
    setCustomPurple(preset.purple);
    setCustomBg(preset.bg);
    applyColors(preset);
    saveColors(preset);
  }

  function applyCustom() {
    const next = { blue: customBlue, purple: customPurple, bg: customBg };
    setHistory((prev) => [current, ...prev].slice(0, HISTORY_LIMIT));
    setCurrent(next);
    applyColors(next);
    saveColors(next);
  }

  function handleUndo() {
    if (history.length === 0) return;
    const [prev, ...rest] = history;
    setHistory(rest);
    setCurrent(prev);
    setCustomBlue(prev.blue);
    setCustomPurple(prev.purple);
    setCustomBg(prev.bg);
    applyColors(prev);
    saveColors(prev);
  }

  function handleSeason(season: string) {
    setActiveSeason(season);
    document.documentElement.setAttribute("data-season", season);
    localStorage.setItem("gg_season_override", season);
  }

  return (
    <div className="admin-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="admin-box">
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "20px",
        }}>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: "13px", color: "var(--text-primary)",
            letterSpacing: "1px",
          }}>
            ⚙ ADMIN
          </span>
          <button onClick={onClose} style={{
            background: "none", border: "none",
            color: "var(--text-muted)", cursor: "pointer", fontSize: "18px",
          }}>✕</button>
        </div>

        {/* Auth gate */}
        {!authed ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Enter admin password
            </div>
            <input
              className="input"
              type="password"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              placeholder="Password"
              autoFocus
            />
            {pwError && (
              <div style={{ fontSize: "12px", color: "var(--error)" }}>
                {pwError}
              </div>
            )}
            <button className="btn btn-primary" onClick={handleAuth}>
              Unlock
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Color presets */}
            <div>
              <div style={{
                fontSize: "11px", color: "var(--text-muted)",
                letterSpacing: "1px", marginBottom: "10px",
                textTransform: "uppercase", fontFamily: "var(--font-display)",
              }}>
                Color Presets
              </div>
              <div style={{
                display: "flex", flexWrap: "wrap", gap: "8px",
              }}>
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    title={preset.name}
                    style={{
                      width: "32px", height: "32px",
                      borderRadius: "50%",
                      border: current.blue === preset.blue
                        ? "2px solid #fff"
                        : "2px solid var(--border-subtle)",
                      background: `linear-gradient(135deg, ${preset.blue}, ${preset.purple})`,
                      cursor: "pointer",
                      transition: "transform 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.2)")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")}
                  />
                ))}
              </div>
            </div>

            {/* Custom colors */}
            <div>
              <div style={{
                fontSize: "11px", color: "var(--text-muted)",
                letterSpacing: "1px", marginBottom: "10px",
                textTransform: "uppercase", fontFamily: "var(--font-display)",
              }}>
                Custom Colors
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px", marginBottom: "10px",
              }}>
                {[
                  { label: "Accent 1", val: customBlue,   set: setCustomBlue },
                  { label: "Accent 2", val: customPurple, set: setCustomPurple },
                  { label: "Background", val: customBg,   set: setCustomBg },
                ].map(({ label, val, set }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                      {label}
                    </div>
                    <input
                      type="color"
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      style={{
                        width: "100%", height: "32px",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius)",
                        background: "var(--bg-secondary)",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                ))}
              </div>
              <button
                className="btn btn-ghost"
                onClick={applyCustom}
                style={{ width: "100%", fontSize: "11px" }}
              >
                Apply Custom
              </button>
            </div>

            {/* Seasonal override */}
            <div>
              <div style={{
                fontSize: "11px", color: "var(--text-muted)",
                letterSpacing: "1px", marginBottom: "10px",
                textTransform: "uppercase", fontFamily: "var(--font-display)",
              }}>
                Seasonal Theme
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {SEASON_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleSeason(s.value)}
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "10px", padding: "5px 10px",
                      borderRadius: "var(--radius)",
                      border: `1px solid ${activeSeason === s.value
                        ? "var(--accent-blue)"
                        : "var(--border-subtle)"}`,
                      background: activeSeason === s.value
                        ? "var(--accent-blue-dim)"
                        : "transparent",
                      color: activeSeason === s.value
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Undo */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {history.length} change{history.length !== 1 ? "s" : ""} in history
              </span>
              <button
                className="btn btn-ghost"
                onClick={handleUndo}
                disabled={history.length === 0}
                style={{ fontSize: "11px", padding: "6px 14px" }}
              >
                ↩ Undo
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
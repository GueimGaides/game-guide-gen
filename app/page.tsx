"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import GuideDisplay, { Guide } from "./components/GuideDisplay";
import AdminPanel, { loadSavedColors } from "./components/AdminPanel";
import SeasonalTheme, { getCurrentSeason } from "./components/SeasonalTheme";
import Link from "next/link";
import TutorialOverlay from "./components/TutorialOverlay";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
  { code: "ru", label: "Русский" },
  { code: "pl", label: "Polski" },
];

function detectLanguage(): string {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("gg_language");
  if (saved) return saved;
  const browser = navigator.language.split("-")[0];
  return LANGUAGES.find((l) => l.code === browser)?.code ?? "en";
}

export default function Home() {
  const [game, setGame] = useState(() => {
    try {
      const saved = localStorage.getItem("gg_last_guide");
      if (!saved) return "";
      return JSON.parse(saved).game ?? "";
    } catch { return ""; }
  });
  const [goal, setGoal] = useState(() => {
    try {
      const saved = localStorage.getItem("gg_last_guide");
      if (!saved) return "";
      return JSON.parse(saved).goal ?? "";
    } catch { return ""; }
  });
  const [guide, setGuide] = useState<Guide | null>(() => {
    try {
      const saved = localStorage.getItem("gg_last_guide");
      if (!saved) return null;
      const data = JSON.parse(saved);
      return data.guide ?? null;
    } catch { return null; }
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [language, setLanguage] = useState("en");
  const [showAdmin, setShowAdmin] = useState(false);
  const shiftCount = useRef(0);
  const shiftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const season = getCurrentSeason();

  // Load language on mount + apply saved colors
  useEffect(() => {
    setLanguage(detectLanguage());

    const saved = loadSavedColors();
    if (saved) {
      const root = document.documentElement;
      root.style.setProperty("--accent-blue", saved.blue);
      root.style.setProperty("--accent-purple", saved.purple);
      root.style.setProperty("--bg-primary", saved.bg);
    }

    const seasonOverride = localStorage.getItem("gg_season_override");
    if (seasonOverride) {
      document.documentElement.setAttribute("data-season", seasonOverride);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (e.key === "Shift") {
      shiftCount.current += 1;

      if (shiftCount.current >= 3) {
        setShowAdmin(true);
        shiftCount.current = 0;
      }

      if (shiftTimer.current) clearTimeout(shiftTimer.current);
      shiftTimer.current = setTimeout(() => {
        shiftCount.current = 0;
      }, 1000);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function handleLanguageChange(code: string) {
    setLanguage(code);
    localStorage.setItem("gg_language", code);
  }

  async function handleGenerate() {
    if (!game.trim() || !goal.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    setError("");
    setGuide(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: game.trim(),
          goal: goal.trim(),
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      if (data.guide.notEnoughInfo) {
        setError(
          "Not enough reliable information found for this game and goal. Try being more specific, or this game may not have enough documented guides yet."
        );
        return;
      }

      setGuide(data.guide);
      localStorage.setItem("gg_last_guide", JSON.stringify({
        guide: data.guide,
        game: game.trim(),
        goal: goal.trim(),
      }));
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("504")) {
        setError(
          "This guide is too large to generate at once. Try narrowing your goal or ask for specific sections and then ask me to generate the next section separately next."
        );
        return;
      }
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SeasonalTheme />
      <TutorialOverlay />
      {/* Admin panel */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      {/* Pixel grid background */}
      <div className="grid-bg" />

      <div style={{
        position: "relative", zIndex: 1,
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
      }}>

        {/* Header */}
        <header style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-secondary)",
          padding: "16px 24px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap", gap: "12px",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{
              fontSize: "10px", color: "var(--text-muted)",
              letterSpacing: "3px", textTransform: "uppercase",
              fontFamily: "var(--font-display)",
              marginBottom: "2px",
            }}>
              Free · No Account · Open Source
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              letterSpacing: "1px",
              lineHeight: 1,
            }}
              className={
                season === "pride" ? "pride-text" :
                season === "christmas" ? "logo-christmas" :
                season === "halloween" ? "logo-halloween" :
                ""
              }
            >
              {season === "christmas" ? "❄ GUEIMGAIDES" :
              season === "halloween" ? "🎃 GUEIMGAIDES" :
              "GUEIMGAIDES"}
            </h1>
          </div>

          {/* Language selector */}
          <select
            id="gg-lang"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              padding: "6px 10px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </header>

        {/* Main content */}
        <main style={{
          flex: 1,
          maxWidth: "800px",
          width: "100%",
          margin: "0 auto",
          padding: "32px 16px",
        }}>

          {/* Generator form */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-header">
              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: "12px", color: "var(--text-primary)",
                letterSpacing: "1px",
              }}>
                GENERATE GUIDE
              </span>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{
                  fontSize: "11px", color: "var(--text-muted)",
                  display: "block", marginBottom: "6px",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.5px", textTransform: "uppercase",
                }}>
                  Game
                </label>
                <input
                  id="gg-name"
                  className="input"
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  placeholder="e.g. Pokemon, SMT, Golden Sun..."
                  disabled={loading}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                />
              </div>
              <div>
                <label style={{
                  fontSize: "11px", color: "var(--text-muted)",
                  display: "block", marginBottom: "6px",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.5px", textTransform: "uppercase",
                }}>
                  Goal
                </label>
                <input
                  id="gg-goal"
                  className="input"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. 100% completion, Nuzlocke run, get all legendaries..."
                  disabled={loading}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                />
              </div>

              {error && (
                <div style={{
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "var(--radius)",
                  fontSize: "13px", color: "var(--error)",
                }}>
                  {error}
                </div>
              )}

              <button
                id="gg-generate"
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={loading}
                style={{ alignSelf: "flex-start" }}
              >
                {loading ? "Generating..." : "▶ Generate Guide"}
              </button>
            </div>

            {/* Loading state */}
            {loading && (
              <div style={{
                borderTop: "1px solid var(--border-subtle)",
                padding: "16px 20px",
                display: "flex", alignItems: "center", gap: "12px",
              }}>
                <div className="loading-dots">
                  <span /><span /><span />
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Searching guides, wikis and community sources...
                </span>
              </div>
            )}
          </div>

          {/* Guide output */}
          {guide && (
            <GuideDisplay
              guide={guide}
              game={game}
              goal={goal}
              language={language}
            />
          )}

          {/* Empty state */}
          {!guide && !loading && (
            <div style={{
              textAlign: "center", padding: "48px 20px",
              color: "var(--text-muted)",
            }}>
              <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.3 }}>
                🎮
              </div>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "13px", letterSpacing: "1px",
                marginBottom: "6px",
              }}>
                NO GUIDE LOADED
              </div>
              <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
                Enter a game and your goal above to generate a free guide.
                <br />Works for any game — RPGs, shooters, platformers, visual novels.
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "16px 24px",
          textAlign: "center",
          fontSize: "11px",
          color: "var(--text-muted)",
          fontFamily: "var(--font-display)",
          letterSpacing: "0.5px",
        }}>
          <span>FREE · NO ADS · NO ACCOUNT · OPEN SOURCE</span>
          <Link href="/about" style={{
            color: "var(--text-muted)",
            textDecoration: "none",
            marginLeft: "16px",
            fontFamily: "var(--font-display)",
            fontSize: "11px",
            letterSpacing: "0.5px",
          }}>
            LEGAL & ABOUT
          </Link>
          {season === "pride" && (
            <span className="pride-text" style={{ marginLeft: "8px" }}>
              🏳️‍🌈
            </span>
          )}
        </footer>
      </div>
    </>
  );
}
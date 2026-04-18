"use client";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "gg_tutorial_done";

interface TutorialStep {
  targetId: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const STEPS: TutorialStep[] = [
  {
    targetId: "gg-lang",
    title: "Language",
    description: "Select your language — the guide will be generated in it automatically.",
    position: "bottom",
  },
  {
    targetId: "gg-game",
    title: "Game",
    description: "Type any game. RPGs, shooters, visual novels, adult games — anything works.",
    position: "bottom",
  },
  {
    targetId: "gg-goal",
    title: "Goal",
    description: "Describe what you want. 100% run, nuzlocke, specific challenge, optimal route — be as specific as you want.",
    position: "bottom",
  },
  {
    targetId: "gg-generate",
    title: "Generate",
    description: "Hit generate. The AI searches wikis, GameFAQs, PSNProfiles and community guides to build your checklist.",
    position: "top",
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

export default function TutorialOverlay() {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(STORAGE_KEY);
    });
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const measureTarget = useCallback(() => {
    const current = STEPS[step];
    if (!current) return;
    const el = document.getElementById(current.targetId);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    });
  }, [step]);

    useEffect(() => {
        if (!visible) return;
        setTimeout(() => measureTarget(), 0);
        window.addEventListener("resize", measureTarget);
        return () => window.removeEventListener("resize", measureTarget);
    }, [visible, measureTarget]);

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleDone();
    }
  }

  function handlePrev() {
    if (step > 0) setStep((s) => s - 1);
  }

  function handleDone() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible || !rect) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  // Tooltip position
  const tooltipTop = current.position === "bottom"
    ? rect.top + rect.height + 12
    : rect.top - 160;

  const tooltipLeft = Math.max(
    12,
    Math.min(
      rect.left + rect.width / 2 - 160,
      window.innerWidth - 332
    )
  );

  return (
    <>
      {/* Dark overlay using box-shadow trick */}
      <div style={{
        position: "fixed",
        zIndex: 9998,
        pointerEvents: "none",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderRadius: "8px",
        boxShadow: `
          0 0 0 4px rgba(59,125,216,0.6),
          0 0 0 9999px rgba(0,0,0,0.75)
        `,
      }} />

      {/* Tooltip card */}
      <div style={{
        position: "fixed",
        zIndex: 9999,
        top: tooltipTop,
        left: tooltipLeft,
        width: "320px",
        background: "var(--bg-card, #131929)",
        border: "1px solid var(--accent-blue, #3b7dd8)",
        borderRadius: "10px",
        padding: "16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}>
        {/* Step counter */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}>
          <span style={{
            fontFamily: "var(--font-display, 'Space Mono')",
            fontSize: "10px",
            color: "var(--accent-blue, #3b7dd8)",
            letterSpacing: "1px",
          }}>
            {step + 1} / {STEPS.length}
          </span>
          <button
            onClick={handleDone}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted, #4a566e)",
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: "var(--font-display, 'Space Mono')",
              letterSpacing: "0.5px",
            }}
          >
            SKIP
          </button>
        </div>

        {/* Content */}
        <div style={{
          fontFamily: "var(--font-display, 'Space Mono')",
          fontSize: "13px",
          fontWeight: "bold",
          color: "var(--text-primary, #e8eaf0)",
          marginBottom: "6px",
          letterSpacing: "0.5px",
        }}>
          {current.title}
        </div>
        <div style={{
          fontSize: "12px",
          color: "var(--text-secondary, #8892a4)",
          lineHeight: "1.6",
          marginBottom: "14px",
        }}>
          {current.description}
        </div>

        {/* Buttons */}
        <div style={{
          display: "flex",
          gap: "8px",
          justifyContent: "flex-end",
        }}>
          {!isFirst && (
            <button
              onClick={handlePrev}
              style={{
                fontFamily: "var(--font-display, 'Space Mono')",
                fontSize: "11px",
                padding: "6px 14px",
                background: "transparent",
                border: "1px solid var(--border-subtle, #1e2a40)",
                borderRadius: "6px",
                color: "var(--text-muted, #4a566e)",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
            >
              ← BACK
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              fontFamily: "var(--font-display, 'Space Mono')",
              fontSize: "11px",
              padding: "6px 16px",
              background: "var(--accent-blue, #3b7dd8)",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              cursor: "pointer",
              letterSpacing: "0.5px",
              fontWeight: "bold",
            }}
          >
            {isLast ? "GOT IT ✓" : "NEXT →"}
          </button>
        </div>
      </div>
    </>
  );
}
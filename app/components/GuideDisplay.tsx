"use client";
import { useState } from "react";

// --- TYPES ---
interface Step {
  id: string;
  text: string;
  hint?: string | null;
}

interface Section {
  id: string;
  label: string;
  badge: string;
  steps: Step[];
}

interface KeyItem {
  id: string;
  text: string;
  where: string;
}

interface GuideImage {
  url: string;
  caption: string;
  section: string;
}

export interface Guide {
  title: string;
  summary: string;
  notEnoughInfo?: boolean;
  sections: Section[];
  keyItems: KeyItem[];
  tips: string[];
  images?: GuideImage[];
}

interface GuideDisplayProps {
  guide: Guide;
  game: string;
  goal: string;
  language: string;
}

const STORAGE_KEY = "gg_progress_v1";

function loadProgress(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(checked: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
}

function encodeProgress(checked: Record<string, boolean>): string {
  const keys = Object.keys(checked).filter((k) => checked[k]);
  return btoa(keys.join(",")).replace(/=/g, "").slice(0, 32);
}

function decodeProgress(code: string): Record<string, boolean> {
  try {
    const decoded = atob(code + "==");
    const keys = decoded.split(",").filter(Boolean);
    return Object.fromEntries(keys.map((k) => [k, true]));
  } catch {
    return {};
  }
}

export default function GuideDisplay({
  guide,
  game,
  goal,
  language,
}: GuideDisplayProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    loadProgress
  );
  const [activeSection, setActiveSection] = useState(
    guide.sections[0]?.id ?? ""
  );
  const [activeTab, setActiveTab] = useState<"guide" | "items" | "tips" | "save">("guide");
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineMsg, setRefineMsg] = useState("");
  const [steps, setSteps] = useState<Record<string, Step>>(
    () =>
      Object.fromEntries(
        guide.sections.flatMap((s) => s.steps.map((st) => [st.id, st]))
      )
  );
  const [saveCode, setSaveCode] = useState("");
  const [loadInput, setLoadInput] = useState("");
  const [loadMsg, setLoadMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const allStepIds = guide.sections.flatMap((s) => s.steps.map((st) => st.id));
  const allItemIds = guide.keyItems.map((i) => i.id);
  const totalCount = allStepIds.length + allItemIds.length;
  const doneCount = [...allStepIds, ...allItemIds].filter(
    (id) => checked[id]
  ).length;
  const pct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  function toggle(id: string) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    saveProgress(next);
  }

  function handleStepClick(id: string) {
    if (selectedStep === id) {
      setSelectedStep(null);
      setFeedback("");
      setRefineMsg("");
    } else {
      setSelectedStep(id);
      setFeedback("");
      setRefineMsg("");
    }
  }

  async function handleRefine(stepId: string) {
    if (!feedback.trim()) return;
    setRefining(true);
    setRefineMsg("");

    const section = guide.sections.find((s) =>
      s.steps.some((st) => st.id === stepId)
    );

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId,
          stepText: steps[stepId]?.text ?? "",
          feedback: feedback.trim(),
          sectionContext: section?.label ?? "",
          gameContext: game,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRefineMsg(`❌ ${data.error}`);
        return;
      }

      const { result } = data;
      setSteps((prev) => ({
        ...prev,
        [result.stepId]: {
          ...prev[result.stepId],
          text: result.newText,
        },
      }));

      setRefineMsg(`✓ ${result.explanation}`);
      setFeedback("");
      setSelectedStep(null);
    } catch {
      setRefineMsg("❌ Something went wrong. Try again.");
    } finally {
      setRefining(false);
    }
  }

  function handleSaveCode() {
    setSaveCode(encodeProgress(checked));
  }

  function handleLoadCode() {
    const data = decodeProgress(loadInput.trim());
    if (Object.keys(data).length === 0) {
      setLoadMsg("❌ Invalid code.");
    } else {
      setChecked(data);
      saveProgress(data);
      setLoadMsg(`✓ Loaded ${Object.keys(data).length} checkmarks.`);
    }
    setTimeout(() => setLoadMsg(""), 3000);
  }

  function handleCopy() {
    navigator.clipboard.writeText(saveCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

function generateSaveCode(): string {
  const keys = Object.keys(checked).filter((k) => checked[k]);
  return btoa(keys.join(",")).replace(/=/g, "").slice(0, 32) || "NO-PROGRESS-YET";
}

function handlePrint() {
  const code = generateSaveCode();
  
  const sectionsHTML = guide.sections.map((section) => `
    <div class="section">
      <div class="section-header">
        <span>${section.label}</span>
        <span class="badge">${section.badge}</span>
      </div>
      ${section.steps.map((step, i) => `
        <div class="step">
          <div class="checkbox"></div>
          <div class="step-content">
            <span class="step-num">${String(i + 1).padStart(2, "0")}.</span>
            ${steps[step.id]?.text ?? step.text}
            ${steps[step.id]?.hint
              ? `<div class="hint">💡 ${steps[step.id]?.hint}</div>`
              : ""}
          </div>
        </div>
      `).join("")}
    </div>
  `).join("");

  const itemsHTML = guide.keyItems.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <span>🎒 Key Items</span>
      </div>
      ${guide.keyItems.map((item) => `
        <div class="step">
          <div class="checkbox"></div>
          <div class="step-content">
            <strong>${item.text}</strong>
            <div class="location">📍 ${item.where}</div>
          </div>
        </div>
      `).join("")}
    </div>
  ` : "";

  const tipsHTML = guide.tips.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <span>💡 Tips</span>
      </div>
      ${guide.tips.map((tip) => `
        <div class="tip">→ ${tip}</div>
      `).join("")}
    </div>
  ` : "";

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>GueimGaides - ${game}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Courier New', monospace;
        font-size: 11px;
        color: #000;
        background: #fff;
        padding: 24px;
        max-width: 800px;
        margin: 0 auto;
      }
      .pdf-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #000;
        padding-bottom: 12px;
        margin-bottom: 20px;
      }
      .site-label {
        font-size: 8px;
        letter-spacing: 2px;
        color: #666;
        margin-bottom: 2px;
      }
      .site-name {
        font-size: 18px;
        font-weight: bold;
        letter-spacing: 1px;
      }
      .guide-title {
        font-size: 13px;
        font-weight: bold;
        margin-top: 10px;
      }
      .guide-goal {
        font-size: 10px;
        color: #444;
        margin-top: 3px;
        line-height: 1.5;
        max-width: 400px;
      }
      .save-code-block {
        text-align: right;
      }
      .save-code-label {
        font-size: 8px;
        letter-spacing: 1px;
        color: #666;
        margin-bottom: 2px;
      }
      .save-code {
        font-size: 11px;
        font-weight: bold;
        word-break: break-all;
        max-width: 200px;
      }
      .site-url {
        font-size: 8px;
        color: #666;
        margin-top: 4px;
      }
      .summary {
        font-size: 11px;
        color: #333;
        line-height: 1.6;
        margin-bottom: 20px;
        padding: 10px;
        border: 1px solid #ddd;
        background: #f9f9f9;
      }
      .section {
        margin-bottom: 20px;
        border: 1px solid #ccc;
        page-break-inside: avoid;
      }
      .section-header {
        background: #f0f0f0;
        padding: 6px 10px;
        font-weight: bold;
        font-size: 11px;
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid #ccc;
      }
      .badge {
        font-weight: normal;
        color: #666;
        font-size: 10px;
      }
      .step {
        display: flex;
        gap: 8px;
        padding: 6px 10px;
        border-bottom: 1px solid #eee;
        align-items: flex-start;
      }
      .step:last-child { border-bottom: none; }
      .checkbox {
        width: 12px;
        height: 12px;
        border: 1px solid #999;
        flex-shrink: 0;
        margin-top: 1px;
      }
      .step-content { flex: 1; line-height: 1.5; }
      .step-num { color: #999; margin-right: 4px; }
      .hint {
        margin-top: 4px;
        font-size: 10px;
        color: #555;
        padding: 4px 6px;
        background: #f5f5f5;
        border-left: 2px solid #999;
      }
      .location {
        font-size: 10px;
        color: #666;
        margin-top: 2px;
      }
      .tip {
        padding: 6px 10px;
        border-bottom: 1px solid #eee;
        font-size: 11px;
        color: #333;
        line-height: 1.5;
      }
      .tip:last-child { border-bottom: none; }
      .footer {
        margin-top: 24px;
        border-top: 1px solid #ccc;
        padding-top: 10px;
        font-size: 9px;
        color: #888;
        text-align: center;
        line-height: 1.6;
      }
      @media print {
        body { padding: 0; }
        @page { margin: 1.5cm; size: A4; }
      }
    </style>
  </head>
  <body>
    <div class="pdf-header">
      <div>
        <div class="site-label">FREE · NO ACCOUNT · OPEN SOURCE</div>
        <div class="site-name">GUEIMGAIDES</div>
        <div class="guide-title">${guide.title}</div>
        <div class="guide-goal">Goal: ${game} — ${goal}</div>
      </div>
      <div class="save-code-block">
        <div class="save-code-label">SAVE CODE</div>
        <div class="save-code">${code}</div>
        <div class="site-url">gueimgaides.vercel.app</div>
      </div>
    </div>

    <div class="summary">${guide.summary}</div>

    ${sectionsHTML}
    ${itemsHTML}
    ${tipsHTML}

    <div class="footer">
      AI-generated guide · Content may contain errors · Cross-reference with official sources
      · GueimGaides is free, open source, and collects no user data
      · gueimgaides.vercel.app
    </div>

    <script>
      window.onload = function() {
        window.print();
      };
    </script>
  </body>
  </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GueimGaides - ${game}.pdf`;
    a.click();
    const win = window.open(url, "_blank");
    if (win) {
      win.onafterprint = () => URL.revokeObjectURL(url);
    }
  }

  const section = guide.sections.find((s) => s.id === activeSection);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* PDF header — invisible on screen, visible when printing */}
      <div className="pdf-header">
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "2px" }}>
            FREE · NO ACCOUNT · OPEN SOURCE
          </div>
          <div style={{ fontSize: "16px", fontWeight: "bold", fontFamily: "Courier New" }}>
            GUEIMGAIDES
          </div>
          <div style={{ fontSize: "11px", marginTop: "8px" }}>
            <strong>{guide.title}</strong>
          </div>
          <div style={{ fontSize: "10px", color: "#444", marginTop: "2px" }}>
            Goal: {game} — {goal ?? ""}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "9px", letterSpacing: "1px" }}>
            SAVE CODE
          </div>
          <div style={{ fontFamily: "Courier New", fontSize: "13px", fontWeight: "bold" }}>
            {generateSaveCode()}
          </div>
          <div style={{ fontSize: "9px", color: "#666", marginTop: "4px" }}>
            gueimgaides.vercel.app
          </div>
        </div>
      </div>
      {/* Progress header */}
      <div className="card">
        <div style={{ padding: "16px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "8px",
          }}>
            <div>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "16px", color: "var(--text-primary)",
                marginBottom: "4px",
              }}>
                {guide.title}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                {guide.summary}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "24px", color: "var(--accent-blue)",
              }}>
                {pct}%
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                {doneCount}/{totalCount}
              </div>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(["guide", "items", "tips", "save"] as const).map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "guide" && "📋 Guide"}
            {tab === "items" && "🎒 Items"}
            {tab === "tips"  && "💡 Tips"}
            {tab === "save"  && "💾 Save / Load"}
          </button>
        ))}
      </div>

      {/* GUIDE TAB */}
      {activeTab === "guide" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Section selector */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {guide.sections.map((s) => {
              const done = s.steps.filter((x) => checked[x.id]).length;
              const isActive = activeSection === s.id;
              return (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "10px", letterSpacing: "0.5px",
                    padding: "6px 12px", borderRadius: "var(--radius)",
                    border: `1px solid ${isActive ? "var(--accent-blue)" : "var(--border-subtle)"}`,
                    background: isActive ? "var(--accent-blue-dim)" : "transparent",
                    color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                    textTransform: "uppercase",
                  }}>
                  {s.label}
                  <span style={{
                    background: done === s.steps.length && s.steps.length > 0
                      ? "var(--success-dim)" : "var(--bg-hover)",
                    color: done === s.steps.length && s.steps.length > 0
                      ? "var(--success)" : "var(--text-muted)",
                    borderRadius: "10px", padding: "1px 6px", fontSize: "10px",
                  }}>
                    {done}/{s.steps.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Steps */}
          <div className="card">
            <div className="card-header">
              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: "12px", color: "var(--text-primary)",
              }}>
                {section?.label}
              </span>
              <span style={{ fontSize: "11px", color: "var(--warning)" }}>
                {section?.badge}
              </span>
            </div>

            {section?.steps.map((step, i) => {
              const isDone = !!checked[step.id];
              const isSelected = selectedStep === step.id;
              const currentText = steps[step.id]?.text ?? step.text;

              return (
                <div key={step.id}>
                  <div
                    className={`step-row ${isSelected ? "selected" : ""} ${isDone ? "done" : ""}`}
                    onClick={() => handleStepClick(step.id)}
                  >
                    {/* Checkbox */}
                    <div
                      className={`step-checkbox ${isDone ? "checked" : ""}`}
                      onClick={(e) => { e.stopPropagation(); toggle(step.id); }}
                    >
                      {isDone && (
                        <span style={{ fontSize: "11px", color: "#fff" }}>✓</span>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div className={`step-text ${isDone ? "done" : ""}`} style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "12px",
                      }}>
                        <span style={{ color: "var(--text-muted)", marginRight: "6px" }}>
                          {String(i + 1).padStart(2, "0")}.
                        </span>
                        {currentText}
                      </div>
                      {steps[step.id]?.hint && !isDone && (
                        <details style={{ marginTop: "4px" }}>
                          <summary style={{
                            fontSize: "11px",
                            color: "var(--accent-blue)",
                            cursor: "pointer",
                            listStyle: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}>
                            💡 Need help with this step?
                          </summary>
                          <div style={{
                            marginTop: "6px",
                            padding: "8px 10px",
                            background: "var(--accent-blue-dim)",
                            borderRadius: "var(--radius)",
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                            lineHeight: "1.6",
                            fontFamily: "var(--font-display)",
                          }}>
                            {steps[step.id]?.hint}
                          </div>
                        </details>
                      )}
                    </div>

                    {/* Click hint */}
                    {!isSelected && (
                      <span style={{
                        fontSize: "10px", color: "var(--text-muted)",
                        flexShrink: 0, opacity: 0.5,
                      }}>
                        ✎
                      </span>
                    )}
                  </div>

                  {/* Edit panel */}
                  {isSelected && (
                    <div className="edit-panel">
                      <div style={{
                        fontSize: "11px", color: "var(--text-secondary)",
                        marginBottom: "8px",
                      }}>
                        Something wrong or want to adjust this step?
                      </div>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Describe what should change... (e.g. 'This demon can only be found in area X, not Y')"
                        disabled={refining}
                      />
                      <div style={{
                        display: "flex", gap: "8px",
                        marginTop: "8px", alignItems: "center",
                      }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleRefine(step.id)}
                          disabled={refining || !feedback.trim()}
                          style={{ fontSize: "11px", padding: "6px 16px" }}
                        >
                          {refining ? "Refining..." : "✎ Refine Step"}
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => { setSelectedStep(null); setFeedback(""); }}
                          style={{ fontSize: "11px", padding: "6px 12px" }}
                        >
                          Cancel
                        </button>
                        {refineMsg && (
                          <span style={{
                            fontSize: "11px",
                            color: refineMsg.startsWith("✓")
                              ? "var(--success)" : "var(--error)",
                          }}>
                            {refineMsg}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ITEMS TAB */}
      {activeTab === "items" && (
        <div className="card">
          <div className="card-header">
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "12px", color: "var(--text-primary)",
            }}>
              Key Items
            </span>
          </div>
          {guide.keyItems.map((item) => (
            <div
              key={item.id}
              className={`step-row ${checked[item.id] ? "done" : ""}`}
              onClick={() => toggle(item.id)}
            >
              <div className={`step-checkbox ${checked[item.id] ? "checked" : ""}`}>
                {checked[item.id] && (
                  <span style={{ fontSize: "11px", color: "#fff" }}>✓</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "13px", fontWeight: "500",
                  color: checked[item.id] ? "var(--text-muted)" : "var(--text-primary)",
                  textDecoration: checked[item.id] ? "line-through" : "none",
                }}>
                  {item.text}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  📍 {item.where}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TIPS TAB */}
      {activeTab === "tips" && (
        <div className="card">
          <div className="card-header">
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "12px", color: "var(--text-primary)",
            }}>
              Tips
            </span>
          </div>
          {guide.tips.map((tip, i) => (
            <div key={i} style={{
              padding: "12px 16px",
              borderBottom: i < guide.tips.length - 1
                ? "1px solid var(--border-subtle)" : "none",
              display: "flex", gap: "10px", alignItems: "flex-start",
            }}>
              <span style={{ color: "var(--warning)", flexShrink: 0 }}>→</span>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                {tip}
              </span>
            </div>
          ))}
          {/* Images if any */}
          {guide.images && guide.images.length > 0 && (
            <div style={{ padding: "16px", borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "11px", color: "var(--text-muted)",
                letterSpacing: "1px", marginBottom: "10px",
                textTransform: "uppercase",
              }}>
                Maps & Screenshots
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {guide.images.map((img, i) => (
                  <div key={i}>
                    <img
                        src={img.url}
                        alt={img.caption}
                        width={800}
                        height={450}
                        style={{
                            width: "100%",
                            height: "auto",
                            borderRadius: "var(--radius)",
                            border: "1px solid var(--border-subtle)",
                            display: "block",
                        }}
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                    />
                    <div style={{
                      fontSize: "11px", color: "var(--text-muted)",
                      marginTop: "4px", textAlign: "center",
                    }}>
                      {img.caption}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SAVE TAB */}
      {activeTab === "save" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="card">
            <div style={{ padding: "16px" }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "12px", color: "var(--text-secondary)",
                marginBottom: "8px",
              }}>
                Auto-Save Active
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.6" }}>
                Progress saves automatically to this browser.
                No account needed.
              </div>
              <div style={{
                marginTop: "10px", padding: "8px 12px",
                background: "var(--success-dim)",
                borderRadius: "var(--radius)",
                fontSize: "12px", color: "var(--success)",
              }}>
                ✓ {doneCount} tasks saved
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ padding: "16px" }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "12px", color: "var(--text-secondary)",
                marginBottom: "8px",
              }}>
                Save Code
              </div>
              <div style={{
                fontSize: "12px", color: "var(--text-muted)",
                lineHeight: "1.6", marginBottom: "12px",
              }}>
                Copy this code to transfer progress to another device.
              </div>
              <button
                className="btn btn-ghost"
                onClick={handleSaveCode}
                style={{ fontSize: "11px", marginBottom: "10px" }}
              >
                Generate Code
              </button>
              {saveCode && (
                <div style={{
                  display: "flex", alignItems: "center",
                  gap: "8px", marginTop: "8px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius)",
                  padding: "10px 14px",
                }}>
                  <span style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "14px", color: "var(--accent-blue)",
                    letterSpacing: "2px", flex: 1,
                    wordBreak: "break-all",
                  }}>
                    {saveCode}
                  </span>
                  <button onClick={handleCopy} style={{
                    background: "none", border: "none",
                    cursor: "pointer", fontSize: "16px", flexShrink: 0,
                  }}>
                    {copied ? "✅" : "📋"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div style={{ padding: "16px" }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "12px", color: "var(--text-secondary)",
                marginBottom: "12px",
              }}>
                Load from Code
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  className="input"
                  value={loadInput}
                  onChange={(e) => setLoadInput(e.target.value)}
                  placeholder="Paste your code..."
                  style={{ fontFamily: "var(--font-display)", fontSize: "12px" }}
                />
                <button
                  className="btn btn-ghost"
                  onClick={handleLoadCode}
                  style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                >
                  Load
                </button>
              </div>
              {loadMsg && (
                <div style={{
                  marginTop: "8px", fontSize: "12px",
                  color: loadMsg.startsWith("✓")
                    ? "var(--success)" : "var(--error)",
                }}>
                  {loadMsg}
                </div>
              )}
              <div className="card">
                <div style={{ padding: "16px" }}>
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "12px", color: "var(--text-secondary)",
                    marginBottom: "8px",
                  }}>
                    📄 Offline PDF
                  </div>
                  <div style={{
                    fontSize: "12px", color: "var(--text-muted)",
                    lineHeight: "1.6", marginBottom: "12px",
                  }}>
                    Want this guide offline? Download a PDF with all sections,
                    items, and tips. Includes your save code so you can reload
                    progress later on this page.
                  </div>
                  <button
                    className="btn btn-ghost"
                    onClick={handlePrint}
                    style={{ fontSize: "11px" }}
                  >
                    ⬇ Download Guide as PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
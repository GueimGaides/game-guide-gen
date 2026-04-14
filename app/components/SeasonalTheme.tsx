"use client";
import { useEffect } from "react";

const SNOWFLAKES = ["❄", "❅", "❆"];

export function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month === 12 || month === 1) return "christmas";
  if (month === 6) return "pride";
  if (month === 10) return "halloween";
  return "default";
}

function spawnSnowflake() {
  const el = document.createElement("span");
  el.className = "snowflake";
  el.textContent = SNOWFLAKES[Math.floor(Math.random() * SNOWFLAKES.length)];
  el.style.left = Math.random() * 100 + "vw";
  el.style.fontSize = Math.random() * 10 + 8 + "px";
  el.style.animationDuration = Math.random() * 6 + 6 + "s";
  el.style.animationDelay = Math.random() * 4 + "s";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 14000);
}

export default function SeasonalTheme() {
  useEffect(() => {
    const season = getCurrentSeason();
    document.documentElement.setAttribute("data-season", season);

    let interval: ReturnType<typeof setInterval> | null = null;
    if (season === "christmas") {
      interval = setInterval(spawnSnowflake, 800);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return null;
}
import React, { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

function applyTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  try {
    if (mode === "system") {
      localStorage.removeItem("theme");
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", !!prefersDark);
    } else {
      localStorage.setItem("theme", mode);
      root.classList.toggle("dark", mode === "dark");
    }
    window.dispatchEvent(new CustomEvent("theme:changed", { detail: { mode } }));
  } catch {}
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    if (stored === "light" || stored === "dark") return stored;
    return "system";
  } catch {
    return "system";
  }
}

export default function ThemePopup() {
  const [mode, setMode] = useState<ThemeMode>(getInitialTheme());

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-5">
        <h2 className="text-lg font-semibold mb-1">Theme</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose how TaskFlow looks on your device.</p>

        <div className="space-y-2" role="radiogroup" aria-label="Theme mode">
          <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={mode === "light"}
              onChange={() => setMode("light")}
            />
            <span className="text-sm">Light</span>
          </label>
          <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={mode === "dark"}
              onChange={() => setMode("dark")}
            />
            <span className="text-sm">Dark</span>
          </label>
          <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="system"
              checked={mode === "system"}
              onChange={() => setMode("system")}
            />
            <span className="text-sm">System</span>
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="px-3 py-1.5 rounded border text-sm"
            onClick={() => setMode(getInitialTheme())}
          >
            Reset
          </button>
          <button
            className="px-3 py-1.5 rounded bg-black text-white text-sm"
            onClick={() => applyTheme(mode)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}


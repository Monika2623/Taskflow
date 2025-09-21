import React, { useState, useRef, useEffect } from "react";
import { MdSettings } from "react-icons/md";
import { FaSun, FaMoon } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// User/mock data
const user = {
  name: "Monika K",
  email: "monikakarthikeyan23@email.com",
};

const accountOptions = [
  { label: "Profile", action: "/profile", icon: "👤" },
  { label: "Account settings", action: "/account", icon: "⚙️" },
  { label: "About", action: "/about", icon: "ℹ️" },
  { label: "Log out", action: "logout", icon: "↩️" },
];


const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(getInitialTheme);
  const [search, setSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  function getInitialTheme() {
    if (typeof window !== "undefined") {
      const st = localStorage.getItem("theme");
      if (st === "light" || st === "dark") return st as any;
      return "system";
    }
    return "system";
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
        setOpen(false);
      if (themeRef.current && !themeRef.current.contains(event.target as Node))
        setShowTheme(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Apply theme to document root and persist
    const root = window.document.documentElement;
    try {
      if (theme === "system") {
        localStorage.removeItem("theme");
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", !!prefersDark);
      } else {
        localStorage.setItem("theme", theme);
        root.classList.toggle("dark", theme === "dark");
      }
      window.dispatchEvent(new CustomEvent("theme:changed", { detail: { mode: theme } }));
    } catch {}
  }, [theme]);

  // Debounced broadcast of search query to the whole app
  useEffect(() => {
    const handle = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("app:search", { detail: { query: search } }));
      window.dispatchEvent(new CustomEvent("global:search", { detail: { q: search } }));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [search]);

  function handleOption(option: typeof accountOptions[number]) {
    setOpen(false);
    if (option.action === "logout") {
      try {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } catch {}
      window.location.href = "/auth";
    } else {
      navigate(option.action);
    }
  }

  function handleThemeChange(mode: "light" | "dark" | "system") {
    setTheme(mode);
  }

  function goToSettings() {
    navigate("/account");
  }

  return (
    <header className="w-full sticky top-0 z-40 bg-white/70 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
      <div className="flex items-center h-12 px-4">
        {/* Center search bar */}
        <div className="flex-1 flex justify-center">
          <input
            type="text"
            placeholder="Search"
            className="w-full max-w-xl border dark:border-gray-700 rounded px-4 py-2 text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:outline-blue-400"
            style={{ minWidth: "300px" }}
            value={search}
            onChange={(e) => {
              const q = e.target.value;
              setSearch(q);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigate("/your-work");
              }
            }}
            aria-label="Search"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center space-x-2 min-w-[160px] justify-end relative">
          {/* Theme icon only button */}
          <div className="relative mx-1" ref={themeRef}>
            <button
              className="text-gray-600 dark:text-gray-200 hover:text-orange-500 bg-gray-100 dark:bg-gray-800 rounded p-2 transition-colors"
              onClick={() => setShowTheme((v) => !v)}
              aria-label="Select Theme"
              title="Select Theme"
              style={{ fontSize: "18px" }}
            >
              {theme === "light" ? (
                <FaSun className="text-yellow-500" />
              ) : (
                <FaMoon className="text-blue-500" />
              )}
            </button>
            {showTheme && (
              <div className="absolute right-0 mt-2 z-30 bg-white dark:bg-gray-900 rounded text-black dark:text-gray-100 shadow-lg border border-gray-200 dark:border-gray-800 p-3 min-w-[220px]">
                <div className="flex justify-around mb-2">
                  <button
                    className={`flex-1 px-3 py-1 rounded mr-1 font-semibold transition-colors ${
                      theme === "light"
                        ? "bg-orange-400 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300"
                    }`}
                    onClick={() => handleThemeChange("light")}
                    aria-pressed={theme === "light"}
                  >
                    <FaSun className="inline mr-1" /> Light
                  </button>
                  <button
                    className={`flex-1 px-3 py-1 rounded font-semibold transition-colors ${
                      theme === "dark"
                        ? "bg-orange-400 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300"
                    }`}
                    onClick={() => handleThemeChange("dark")}
                    aria-pressed={theme === "dark"}
                  >
                    <FaMoon className="inline mr-1" /> Dark
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings icon button */}
          <div className="relative mx-1">
            <button
              className="text-gray-600 dark:text-gray-200 hover:text-orange-500 bg-gray-100 dark:bg-gray-800 rounded p-2 transition-colors"
              onClick={goToSettings}
              aria-label="Go to Settings"
              title="Settings"
              style={{ fontSize: "18px" }}
            >
              <MdSettings />
            </button>
          </div>

          {/* Account Dropdown */}
          <div className="ml-2" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-full bg-blue-600 dark:bg-amber-500 text-white font-bold px-4 py-1.5 text-sm shadow ring-1 ring-white/70 dark:ring-white/20 hover:opacity-90 transition select-none"
              aria-label="Account menu"
            >
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </button>
            {open && (
              <div className="absolute right-0 mt-10 z-30 min-w-[240px] rounded-[13px] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 shadow-xl select-none overflow-hidden">
                <div className="bg-amber-100 dark:bg-amber-900/30 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="font-bold text-[17px] mb-0.5 text-gray-900 dark:text-gray-100">{user.name}</div>
                  <div className="text-[15px] text-gray-600 dark:text-gray-300">{user.email}</div>
                </div>
                {accountOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => handleOption(opt)}
                    className="flex items-center w-full bg-transparent px-5 py-3 text-[16px] text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                  >
                    <span className="mr-3">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

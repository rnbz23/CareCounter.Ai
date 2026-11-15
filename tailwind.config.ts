import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Signal Ledger — cobalt clarity + signal orange on cool mist (not teal/purple/cream defaults)
        brand: {
          50: "#fff1ec",
          100: "#ffe0d4",
          200: "#ffc0a8",
          300: "#ff9470",
          400: "#ff6a42",
          500: "#f24a1d",
          600: "#d63512",
          700: "#b12a12",
          800: "#922616",
          900: "#782416",
          950: "#410f08",
        },
        cobalt: {
          50: "#eef4ff",
          100: "#dce7ff",
          200: "#c0d4ff",
          300: "#94b5ff",
          400: "#618bff",
          500: "#3b5fff",
          600: "#1a3df5",
          700: "#132fdb",
          800: "#1629b1",
          900: "#18298b",
          950: "#111954",
        },
        emerald: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#0f9f6e",
          600: "#0b8660",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        navy: {
          50: "#f2f5fa",
          100: "#e3eaf4",
          200: "#cdd9ea",
          300: "#a9bed9",
          400: "#7f9cc3",
          500: "#5f7fad",
          600: "#4b668f",
          700: "#3e5374",
          800: "#364761",
          900: "#1a2438",
          950: "#0b1220",
        },
        ink: {
          50: "#f5f6f9",
          100: "#ebeef3",
          200: "#d5dae4",
          300: "#b0b8c9",
          400: "#8490a7",
          500: "#65728b",
          600: "#505a72",
          700: "#424a5d",
          800: "#393f4f",
          900: "#323744",
          950: "#141820",
        },
        paper: {
          DEFAULT: "#eef2f7",
          muted: "#e3e9f2",
          rule: "#cfd8e6",
        },
        night: {
          DEFAULT: "#05080d",
          soft: "#0c121b",
          panel: "#121a26",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        panel:
          "0 1px 0 rgba(255,255,255,0.75) inset, 0 18px 44px rgba(11,18,32,0.08)",
        focus: "0 0 0 3px rgba(59,95,255,0.28)",
        lift: "0 26px 60px rgba(11,18,32,0.18)",
        signal: "0 0 0 1px rgba(242,74,29,0.35), 0 18px 40px rgba(242,74,29,0.18)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "page-in": {
          "0%": { opacity: "0", transform: "translateY(18px) scale(0.985)" },
          "100%": { opacity: "1", transform: "none" },
        },
        "spotlight-pulse": {
          "0%": {
            boxShadow: "0 0 0 0 rgba(15,159,110,0.45)",
            transform: "scale(1)",
          },
          "40%": {
            boxShadow: "0 0 0 14px rgba(15,159,110,0)",
            transform: "scale(1.015)",
          },
          "100%": {
            boxShadow: "0 0 0 0 rgba(15,159,110,0)",
            transform: "scale(1)",
          },
        },
        "focus-sheen": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "loader-word": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "18%, 78%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-14px)" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "page-in": "page-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
        "spotlight-pulse": "spotlight-pulse 0.95s ease-out 3",
        "focus-sheen": "focus-sheen 1.6s linear infinite",
        "float-y": "float-y 5.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

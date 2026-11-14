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
        // Coral accent + navy authority — deliberately not teal/purple AI defaults
        brand: {
          50: "#fff2ed",
          100: "#ffe2d6",
          200: "#ffc2ab",
          300: "#ff9874",
          400: "#f86b45",
          500: "#e4572e",
          600: "#c53d1c",
          700: "#a33118",
          800: "#862b19",
          900: "#6f2819",
          950: "#3c1109",
        },
        navy: {
          50: "#f3f6fb",
          100: "#e4ebf5",
          200: "#cfdced",
          300: "#adc3de",
          400: "#85a3cb",
          500: "#6787b8",
          600: "#516ea0",
          700: "#435983",
          800: "#3a4b6c",
          900: "#1b2a41",
          950: "#0e1a2b",
        },
        ink: {
          50: "#f5f6f8",
          100: "#eceef2",
          200: "#d5dae3",
          300: "#b0b9c9",
          400: "#8592a8",
          500: "#66748d",
          600: "#515d74",
          700: "#424c5f",
          800: "#394150",
          900: "#333944",
          950: "#151921",
        },
        paper: {
          DEFAULT: "#f7f8fb",
          muted: "#eef1f6",
          rule: "#dde3ec",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel:
          "0 1px 0 rgba(255,255,255,0.9) inset, 0 14px 40px rgba(21,25,33,0.07)",
        focus: "0 0 0 3px rgba(228,87,46,0.22)",
        lift: "0 22px 55px rgba(14,26,43,0.14)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "page-in": {
          "0%": { opacity: "0", transform: "translateY(18px) scale(0.985)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "page-in": "page-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;

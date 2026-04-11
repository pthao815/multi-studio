import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#080D1A",
        surface: "#0F1629",
        elevated: "#161F35",
        overlay: "#1E2A47",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(to right, #7C3AED, #2563EB, #06B6D4)",
        "brand-gradient-diagonal":
          "linear-gradient(to bottom right, #7C3AED, #2563EB, #06B6D4)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.4)",
        glow: "0 0 40px rgba(139, 92, 246, 0.15)",
        "glow-strong": "0 0 40px rgba(139, 92, 246, 0.3)",
        "glow-button": "0 0 30px rgba(139, 92, 246, 0.4)",
      },
      animation: {
        fadeInUp: "fadeInUp 0.4s ease-out",
        stepComplete: "stepComplete 0.4s ease-out forwards",
        gradientShift: "gradientShift 4s ease infinite",
        shimmer: "shimmer 1.5s infinite linear",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        stepComplete: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;

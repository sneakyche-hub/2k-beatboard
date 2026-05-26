/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
      },
      colors: {
        base: "#FAFAFA",
        panel: "#FFFFFF",
        line: "#E5E7EB",
        ink: {
          900: "#0F172A",
          700: "#334155",
          500: "#64748B",
          400: "#94A3B8",
          300: "#CBD5E1",
        },
        accent: {
          primary: "#1F4FDB",
          success: "#16A34A",
          amber: "#D97706",
          red: "#DC2626",
          violet: "#7C3AED",
        },
        twok: {
          black: "#0A0A0A",
          red: "#E11D2D",
          "red-deep": "#A30E1B",
          "red-soft": "#FECDD3",
          white: "#FFFFFF",
        },
        brand: {
          borderlands: "#FF8400",
          civilization: "#C9A227",
          mafia: "#7C1D1D",
          xcom: "#6B46C1",
          bioshock: "#0EA5A4",
          wonderlands: "#EC4899",
          homeworld: "#3B82F6",
          "risk-of-rain": "#84CC16",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
        "pulse-dot": "pulseDot 1.8s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.5, transform: "scale(0.9)" },
        },
      },
    },
  },
  plugins: [],
};

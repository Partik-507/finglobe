/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        // Core dark palette
        bg: {
          base:     "#030304",
          surface:  "#08080c",
          elevated: "#0f0f18",
          card:     "#14141f",
          border:   "#1e1e2e",
        },
        // Brand gold
        gold: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#d4a017",
          600: "#b8860b",
          700: "#92650a",
          800: "#6b4c0c",
          900: "#4a3209",
          DEFAULT: "#d4a017",
        },
        // Platinum silver  
        platinum: {
          50:  "#f8f8fa",
          100: "#e8e8ef",
          200: "#d0d0df",
          300: "#a8a8c0",
          400: "#7878a0",
          500: "#555578",
          600: "#3d3d60",
          700: "#2a2a45",
          800: "#1a1a30",
          900: "#0d0d1a",
          DEFAULT: "#a8a8c0",
        },
        // Accent
        electric: "#00d4ff",
        emerald:  "#00e5a0",
        crimson:  "#ff3366",
      },
      backgroundImage: {
        "gold-gradient":     "linear-gradient(135deg, #fcd34d 0%, #d4a017 40%, #92650a 100%)",
        "gold-shine":        "linear-gradient(105deg, #b8860b 0%, #fcd34d 30%, #fbbf24 50%, #fcd34d 70%, #b8860b 100%)",
        "dark-gradient":     "linear-gradient(180deg, #08080c 0%, #030304 100%)",
        "card-gradient":     "linear-gradient(135deg, rgba(212,160,23,0.08) 0%, rgba(20,20,31,0.6) 100%)",
        "hero-radial":       "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,160,23,0.15) 0%, transparent 60%)",
        "glow-gold":         "radial-gradient(circle, rgba(212,160,23,0.25) 0%, transparent 70%)",
      },
      animation: {
        "gold-pulse":    "goldPulse 3s ease-in-out infinite",
        "gold-shine":    "goldShine 4s ease-in-out infinite",
        "float-slow":    "float 8s ease-in-out infinite",
        "spin-very-slow":"spin 20s linear infinite",
        "slide-up":      "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in":       "fadeIn 0.8s ease forwards",
        "counter":       "counter 2s ease forwards",
        "blink":         "blink 1.2s step-end infinite",
      },
      keyframes: {
        goldPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(212,160,23,0.3), 0 0 40px rgba(212,160,23,0.1)" },
          "50%":       { boxShadow: "0 0 40px rgba(212,160,23,0.6), 0 0 80px rgba(212,160,23,0.2)" },
        },
        goldShine: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-24px)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(32px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0" },
        },
      },
      boxShadow: {
        "gold":         "0 0 0 1px rgba(212,160,23,0.3), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(252,211,77,0.15)",
        "gold-hover":   "0 0 0 1px rgba(212,160,23,0.5), 0 16px 48px rgba(0,0,0,0.6), 0 0 60px rgba(212,160,23,0.2)",
        "gold-glow":    "0 0 40px rgba(212,160,23,0.4), 0 0 80px rgba(212,160,23,0.15)",
        "card":         "0 2px 12px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        "card-hover":   "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,160,23,0.2), inset 0 1px 0 rgba(252,211,77,0.08)",
        "inner-gold":   "inset 0 1px 0 rgba(252,211,77,0.1), inset 0 -1px 0 rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};

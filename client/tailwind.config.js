/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#141B30",
          50: "#A9B4CC",
          100: "#7E8AAD",
          900: "#0B0F1E",
        },
        paper: {
          DEFAULT: "#F0E6D2",
          dim: "#E4D8BD",
        },
        maroon: {
          DEFAULT: "#8C3B3B",
          dark: "#6E2C2C",
          light: "#A85050",
        },
        stamp: {
          green: "#3C7A5C",
          amber: "#D98E2B",
          rust: "#B5502F",
        },
      },
      fontFamily: {
        display: ["Baloo 2", "sans-serif"],
        body: ["IBM Plex Sans", "IBM Plex Sans Devanagari", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        ledger: "0 2px 0 0 rgba(20,27,48,0.08), 0 12px 24px -10px rgba(20,27,48,0.35)",
      },
    },
  },
  plugins: [],
}

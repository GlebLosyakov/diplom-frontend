/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d12",
        card: "#11141b",
        border: "#1f2330",
        muted: "#8b93a7",
        fg: "#e7ecf3",
        accent: "#6366f1",
        accent2: "#22d3ee",
        success: "#10b981",
        danger: "#ef4444",
      },
      boxShadow: {
        glow: "0 10px 40px -10px rgba(99,102,241,.45)",
      },
    },
  },
  plugins: [],
};

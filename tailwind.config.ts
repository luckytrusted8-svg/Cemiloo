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
        cemiloo: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9", // Primary bright blue
          600: "#0284c7", // Active / hover blue
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          dark: "#111827",
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f8fafc",
          muted: "#f1f5f9",
          border: "#e2e8f0",
        },
      },
      boxShadow: {
        card: "0 2px 8px -1px rgba(0, 0, 0, 0.06), 0 1px 4px -1px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 6px 16px -2px rgba(14, 165, 233, 0.15), 0 2px 6px -1px rgba(0, 0, 0, 0.06)",
        float: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;

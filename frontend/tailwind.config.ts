import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f4f6f8",
          100: "#e6eaef",
          200: "#c7d0db",
          300: "#a2b0c2",
          400: "#7686a0",
          500: "#576a87",
          600: "#42536e",
          700: "#33415a",
          800: "#26314a",
          900: "#1a2337",
          950: "#0f1524",
        },
        accent: {
          50: "#fff7ed",
          100: "#ffedd3",
          200: "#ffd9a5",
          300: "#ffbd6b",
          400: "#ff9a33",
          500: "#f97b0e",
          600: "#e05e05",
          700: "#b94708",
          800: "#94390e",
          900: "#79310f",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 21 36 / 0.04), 0 1px 6px -1px rgb(15 21 36 / 0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;

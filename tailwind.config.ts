import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: [
          '"Playfair Display"',
          '"Bodoni Moda"',
          'Didot',
          '"Bodoni 72"',
          '"Cormorant Garamond"',
          'Baskerville',
          'Georgia',
          'serif',
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.02em",
      },
      colors: {
        neutral: {
          950: "#080808",
        },
      },
    },
  },
  plugins: [],
};
export default config;

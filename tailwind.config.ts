import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fc: {
          maroon: "#7a1212",
          maroonLight: "#a31a1a",
          navy: "#121a2e",
          bg: "#09090b",
        }
      }
    },
  },
  plugins: [],
};
export default config;

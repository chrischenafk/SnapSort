import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        snapsortBlue: "#1a73e8"
      }
    }
  },
  plugins: []
} satisfies Config;

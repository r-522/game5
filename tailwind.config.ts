import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      borderWidth: {
        3: "3px",
      },
      colors: {
        ink: "#0a0908",
        paper: "#f4f1ea",
        blood: "#c1121f",
        gold: "#ffc300",
        steel: "#1d2433",
      },
      fontFamily: {
        gothic: [
          '"Yu Gothic"', '"YuGothic"', '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"', '"Meiryo"', "system-ui", "sans-serif",
        ],
        impact: ['"Arial Black"', '"Impact"', '"Yu Gothic"', "system-ui", "sans-serif"],
      },
      keyframes: {
        shake: {
          "0%,100%": { transform: "translate(0,0)" },
          "20%": { transform: "translate(-4px,2px)" },
          "40%": { transform: "translate(4px,-2px)" },
          "60%": { transform: "translate(-3px,-1px)" },
          "80%": { transform: "translate(3px,1px)" },
        },
        slamIn: {
          "0%": { transform: "scale(2.4) rotate(-8deg)", opacity: "0" },
          "60%": { transform: "scale(0.9) rotate(-3deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-3deg)", opacity: "1" },
        },
        flash: {
          "0%,100%": { opacity: "0" },
          "50%": { opacity: "0.85" },
        },
      },
      animation: {
        shake: "shake 0.25s linear",
        slamIn: "slamIn 0.4s cubic-bezier(.2,1.4,.3,1) both",
        flash: "flash 0.4s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;

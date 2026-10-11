/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FEFDFB",
          100: "#FBF7EF",
          200: "#F5EEDE",
          300: "#EDE2C9",
        },
        moss: {
          50: "#F1F5F0",
          100: "#DFEAE0",
          200: "#BDD4BF",
          300: "#96B99A",
          400: "#729D78",
          500: "#537C5A",
          600: "#3F6247",
          700: "#324E39",
          800: "#26392A",
          900: "#1B291F",
          950: "#101A14",
        },
        clay: {
          100: "#F5E4D8",
          200: "#EAC5AA",
          300: "#DDA47C",
          400: "#CB8455",
          500: "#B56B3C",
          600: "#95552F",
        },
        ink: {
          50: "#F6F5F2",
          400: "#6B675E",
          600: "#453F35",
          800: "#221E19",
          900: "#17140F",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Manrope'", "sans-serif"],
      },
      borderRadius: {
        xl: "1.1rem",
        "2xl": "1.6rem",
        "3xl": "2.2rem",
      },
      boxShadow: {
        soft: "0 2px 16px -4px rgba(23, 20, 15, 0.08)",
        card: "0 8px 30px -12px rgba(23, 20, 15, 0.18)",
        lift: "0 20px 40px -16px rgba(23, 20, 15, 0.28)",
      },
      letterSpacing: {
        tightest: "-0.04em",
        widest2: "0.24em",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(14px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        toastIn: {
          "0%": { opacity: 0, transform: "translateY(-10px) scale(0.96)" },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both",
        toastIn: "toastIn 0.35s cubic-bezier(0.16,1,0.3,1) both",
        marquee: "marquee 28s linear infinite",
      },
    },
  },
  plugins: [],
};

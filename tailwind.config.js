/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        gilroy: ["Gilroy", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        "neon-purple": "#8B5CF6",
        "neon-blue": "#3B82F6",
        "neon-pink": "#EC4899",
        "neon-cyan": "#06B6D4",
        "dark-space": "#0F0F23",
        "space-purple": "#1E1B4B",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-space":
          "linear-gradient(135deg, #0F0F23 0%, #1E1B4B 50%, #312E81 100%)",
        "gradient-hero": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "gradient-purple": "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
    },
  },
  plugins: [],
};

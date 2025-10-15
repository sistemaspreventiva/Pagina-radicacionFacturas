/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "ps-navy":   "#0a2a4d",
        "ps-blue":   "#0f5cc0",
        "ps-cyan":   "#13c2be",
        "ps-orange": "#ff8a00",
      },
    },
  },
  plugins: [],
}

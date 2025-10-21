/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ps: {
          navy:   "#0a2a4d", // azul oscuro
          blue:   "#0f5cc0", // azul principal
          cyan:   "#13c2be", // cian/turquesa
          orange: "#ff8a00", // acento
        },
      },
    },
  },
  plugins: [],
}

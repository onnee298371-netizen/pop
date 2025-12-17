/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050510",
        primary: "#00f3ff",  // Neon Blue
        success: "#00ff9d",  // Neon Green
        danger: "#ff0055",   // Neon Red
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'monospace'],
        sans: ['Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#5DB9B3",
        secondary: "#6B7280",
        tertiary: "#00a5ec",
		neutral: "#F4FBFA",
      },
    },
  },
  plugins: [],
}

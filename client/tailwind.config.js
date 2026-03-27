/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5DB9B3',
        secondary: '#6B7280',
        tertiary: '#00a5ec',
        neutral: '#F4FBFA',
      },
    },
  },
  plugins: [],
}

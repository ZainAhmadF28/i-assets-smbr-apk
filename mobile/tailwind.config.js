/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand colors I-Asset SMBR
        primary: {
          50:  "#e6f4fe",
          100: "#cce9fd",
          500: "#1a7fd4",
          600: "#1570bc",
          700: "#0f5fa3",
        },
        smbr: {
          blue:  "#1a7fd4",
          green: "#16a34a",
          red:   "#dc2626",
          amber: "#d97706",
        },
      },
    },
  },
  plugins: [],
}


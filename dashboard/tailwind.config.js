/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ibm: {
          blue: '#0f62fe',
          darkblue: '#0043ce',
          ultramarine: '#001d6c',
          gray: {
            10: '#f4f4f4',
            20: '#e0e0e0',
            30: '#c6c6c6',
            40: '#a8a8a8',
            50: '#8d8d8d',
            60: '#6f6f6f',
            70: '#525252',
            80: '#393939',
            90: '#262626',
            100: '#161616'
          },
          green: '#24a148',
          red: '#da1e28',
          amber: '#f1c21b',
          cyan: '#1192e8'
        }
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'Menlo', 'Consolas', 'Courier New', 'monospace'],
        sans: ['"IBM Plex Sans"', 'Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}

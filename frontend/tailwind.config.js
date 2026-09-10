/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1d4ed8', foreground: '#ffffff' },
        destructive: { DEFAULT: '#dc2626', foreground: '#ffffff' },
        muted: { DEFAULT: '#f1f5f9', foreground: '#64748b' },
        accent: { DEFAULT: '#f1f5f9', foreground: '#0f172a' },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
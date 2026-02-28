/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        adam: '#3B82F6',
        chore: '#8B5CF6',
        ontrack: '#10B981',
        offtrack: '#EF4444',
      },
    },
  },
  plugins: [],
}

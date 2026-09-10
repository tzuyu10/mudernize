import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#f6f5f2',
        ink: '#1c1b29',
        line: '#e2e0da',
      },
    },
  },
  plugins: [],
}
export default config

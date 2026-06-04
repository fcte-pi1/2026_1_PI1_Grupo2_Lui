/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        app: {
          bg: '#07050F',
          surface: '#0D0B1A',
          header: '#0A0718',
          raised: '#110E20',
        },
        brand: {
          h1: '#EEF2F8',
          h2: '#CBD5E1',
          h3: '#94A3B8',
          h4: '#6B7A99',
          text: '#AAB8CC',
          muted: '#5A6A82',
          purple: '#7C3AED',
          'purple-light': '#8B5CF6',
          'purple-glow': '#A78BFA',
          green: '#10B981',
          cyan: '#06B6D4',
          amber: '#F59E0B'
        },
        border: {
          ghost: '#0E0B1B',
          subtle: '#131024',
          rule: '#18132D',
          dim: '#1D1736',
          accent: '#241E40',
          hover: '#2A224A'
        }
      },
      boxShadow: {
        'soft-panel': '0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 3px rgba(0,0,0,0.02)',
        'floating': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        'glow-purple': '0 0 15px rgba(124,58,237,0.3)',
      }
    },
  },
  plugins: [],
}

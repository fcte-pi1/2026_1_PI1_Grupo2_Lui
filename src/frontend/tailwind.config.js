/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        /* Tipografia por categoria (espelha os tokens do index.css) */
        'page-title':    ['20px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'section-title': ['11px', { lineHeight: '1', letterSpacing: '0.06em', fontWeight: '600' }],
        'control-label': ['11px', { lineHeight: '1', letterSpacing: '0.04em', fontWeight: '500' }],
        'btn':           ['14px', { lineHeight: '1', fontWeight: '600' }],
        'nav':           ['14px', { lineHeight: '1', fontWeight: '500' }],
        'chip':          ['13px', { lineHeight: '1', fontWeight: '500' }],
        'value':         ['28px', { lineHeight: '1', fontWeight: '700' }],
        'unit':          ['14px', { lineHeight: '1', fontWeight: '500' }],
        'caption':       ['11px', { lineHeight: '1.3', fontWeight: '500' }],
        'data':          ['12px', { lineHeight: '1', fontWeight: '500' }],
      },
      spacing: {
        /* Escala de espaçamento global */
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        /* Alturas de controle compartilhadas */
        'control-sm': '32px',
        'control-md': '40px',
        'control-lg': '48px',
        /* Tamanhos de ícone */
        'icon-sm': '14px',
        'icon-md': '16px',
        'icon-lg': '20px',
      },
      height: {
        'control-sm': '32px',
        'control-md': '40px',
        'control-lg': '48px',
        'badge': '24px',
      },
      minHeight: {
        'control-sm': '32px',
        'control-md': '40px',
        'control-lg': '48px',
      },
      gap: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
      },
      colors: {
        app: {
          bg:      '#0e0b1d',
          'bg-2':  '#0c0919',
          surface: '#100c27',
          header:  '#100c27',
          raised:  '#151034',
          hover:   '#1c1642',
          inset:   '#0d0a1c',
        },
        brand: {
          h1:     '#f5f1fb',        /* --text-1 */
          h2:     '#ddd6ec',        /* --text-2 (contraste melhorado) */
          h3:     '#b3abc7',        /* --text-3 (legível) */
          h4:     '#948cab',        /* --text-4 */
          text:   '#ddd6ec',
          muted:  '#948cab',
          purple:        '#391872',  /* --primary */
          'purple-light': '#b9a3e8', /* --accent: roxo claro p/ TEXTO (alto contraste) */
          'purple-fill':  '#5a3d99', /* --primary-2: preenchimento/paredes */
          'purple-glow':  '#4a2b8c',
          'purple-dim':   '#281052',
          accent:        '#b9a3e8',
          green:  '#1e9d74',        /* --success */
          'green-text': '#4fd1a5',  /* verde p/ texto */
          'green-dim':  '#103d30',
          cyan:   '#90b0d1',
          amber:  '#d6b54a',
          'amber-text': '#e6c860',
          danger: '#d06a4a',
          'danger-text': '#e88a6a',
        },
        border: {
          ghost:   'transparent',
          subtle:  '#34296599',       /* --border */
          rule:    '#34296599',       /* --border-rule */
          soft:    '#34296599',       /* --border-soft */
          dim:     '#34296599',
          accent:  '#4a3885cc',       /* --border-strong */
          hover:   '#4a3885cc',
        },
      },
      boxShadow: {
        glow: '0 0 12px var(--primary-glow)',
        'card':    '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.7)',
        'pop':     '0 1px 0 rgba(255,255,255,0.06) inset, 0 18px 40px -16px rgba(0,0,0,0.85)',
        'glow-purple':  '0 0 15px rgba(124,58,237,0.3)',
        'glow-green':   '0 0 12px rgba(109,224,168,0.3)',
        'soft-panel':   '0 4px 20px -2px rgba(0,0,0,0.03), 0 0 3px rgba(0,0,0,0.02)',
        'floating':     '0 25px 50px -12px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '22px',
        'pill': '999px',
      },
      animation: {
        'ping-slow': 'ping-slow 1.8s ease-out infinite',
        'beat': 'beat 1s ease-in-out infinite',
      },
      keyframes: {
        'ping-slow': {
          '0%':   { transform: 'scale(0.6)', opacity: '0.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'beat': {
          '50%': { transform: 'scale(1.35)' },
        },
      },
    },
  },
  plugins: [],
}

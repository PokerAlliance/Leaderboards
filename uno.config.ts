import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  theme: {
    colors: {
      'bg-base': '#0a0f14',
      'bg-card': '#131b23',
      'bg-elevated': '#1a242f',
      gold: '#d4af37',
      'gold-light': '#f4d03f',
      silver: '#a8a8a8',
      bronze: '#cd7f32',
      live: '#ef4444',
      'text-primary': '#f8fafc',
      'text-secondary': '#94a3b8',
      'text-muted': '#64748b',
    },
  },
  shortcuts: {
    btn: 'px-4 py-2 rounded-lg font-medium transition-colors',
    'btn-primary': 'btn bg-gold text-bg-base hover:bg-gold-light',
    card: 'bg-bg-card rounded-lg p-4 shadow-md',
  },
})

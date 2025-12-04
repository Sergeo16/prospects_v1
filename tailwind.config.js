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
        accent: '#00d9ff', // Cyan accent du thème dark de DaisyUI
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    // themes: ['light', 'dark'],
    themes: ['retro', 'cyberpunk'],
    darkTheme: 'retro',
    base: true,
    styled: true,
    utils: true,
    prefix: '',
    logs: true,
    themeRoot: ':root',
  },
}


/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#072339',
          light: '#0D3352',
          dark: '#041624',
        },
        amber: {
          DEFAULT: '#FDB60C',
          hover: '#E5A30B',
          light: '#FEF3D6',
        },
        offwhite: '#F8F8F6',
        bordercolor: '#E6E6E0',
        trust: {
          new: '#F1D9D3',
          community: '#F8E3A6',
          trusted: '#D6E3D3',
        },
        skill: {
          starter: '#ECEBE6',
          skilled: '#DCE8F5',
          expert: '#E4DFF5',
        },
      },
      fontFamily: {
        serif: ['Lora', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
      },
      maxWidth: {
        'app': '480px',
      },
    },
  },
  plugins: [],
}

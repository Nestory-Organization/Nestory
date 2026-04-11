/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "tertiary-container": "#5fc2d8",
        "surface-variant": "#e4e2de",
        "on-primary-fixed-variant": "#6f3800",
        "surface-container-lowest": "#ffffff",
        "background": "#fbf9f5",
        "on-secondary-fixed": "#2d1603",
        "inverse-surface": "#30312e",
        "tertiary": "#006878",
        "on-surface": "#1b1c1a",
        "error-container": "#ffdad6",
        "on-background": "#1b1c1a",
        "primary-fixed": "#ffdcc4",
        "on-tertiary-fixed": "#001f25",
        "surface": "#fbf9f5",
        "on-tertiary-fixed-variant": "#004e5b",
        "on-surface-variant": "#534439",
        "on-secondary-container": "#79563c",
        "surface-container-high": "#eae8e4",
        "error": "#ba1a1a",
        "secondary": "#7a573d",
        "inverse-primary": "#ffb780",
        "tertiary-fixed-dim": "#72d4ea",
        "on-primary": "#ffffff",
        "primary-fixed-dim": "#ffb780",
        "outline-variant": "#d8c2b5",
        "surface-bright": "#fbf9f5",
        "primary-container": "#f4a261",
        "on-error-container": "#93000a",
        "on-error": "#ffffff",
        "secondary-container": "#fdcead",
        "on-secondary": "#ffffff",
        "on-primary-fixed": "#2f1400",
        "surface-container-highest": "#e4e2de",
        "primary": "#8e4e14",
        "surface-container": "#efeeea",
        "on-tertiary-container": "#004e5b",
        "surface-tint": "#8e4e14",
        "on-tertiary": "#ffffff",
        "secondary-fixed": "#ffdcc4",
        "on-secondary-fixed-variant": "#5f4027",
        "surface-container-low": "#f5f3ef",
        "secondary-fixed-dim": "#ebbd9d",
        "on-primary-container": "#6f3800",
        "inverse-on-surface": "#f2f0ed",
        "outline": "#867468",
        "surface-dim": "#dbdad6",
        "tertiary-fixed": "#a8edff"
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["Noto Serif", "serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"],
      },
      animation: {
        // Playful animations for children's interface
        'bounce-gentle': 'bounce-gentle 1.5s ease-in-out infinite',
        'wiggle': 'wiggle 0.6s ease-in-out infinite',
        'hop': 'hop 0.8s ease-in-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        
        // Professional animations for parent/admin interface
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-down': 'slide-down 0.4s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-out': 'fade-out 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        
        // Celebration animation
        'celebrate': 'celebrate 0.6s ease-out',
      },
      keyframes: {
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        'hop': {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
          '100%': { transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.7' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'sparkle': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        'slide-up': {
          'from': { transform: 'translateY(10px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          'from': { transform: 'translateY(-10px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'fade-out': {
          'from': { opacity: '1' },
          'to': { opacity: '0' },
        },
        'scale-in': {
          'from': { transform: 'scale(0.95)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-in-left': {
          'from': { transform: 'translateX(-20px)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          'from': { transform: 'translateX(20px)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'celebrate': {
          '0%': { transform: 'scale(0.5) rotateZ(-20deg)', opacity: '0' },
          '50%': { transform: 'scale(1.1) rotateZ(0deg)' },
          '100%': { transform: 'scale(1) rotateZ(0deg)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

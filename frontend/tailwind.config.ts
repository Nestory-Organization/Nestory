/** @type {import('tailwindcss').Config} */
/* Nestory — Stitch “Living Library”: coral primary, sky secondary, meadow tertiary */

const libraryPrimary = {
  DEFAULT: '#E84A5F',
  dim: '#c73d52',
  container: '#ffccd1',
  50: '#fff7f8',
  100: '#ffeef0',
  200: '#ffd4d9',
  300: '#ffb0ba',
  400: '#f07888',
  500: '#E84A5F',
  600: '#d43d52',
  700: '#b5233e',
  800: '#981f36',
  900: '#7c1d30',
};

const librarySecondary = {
  DEFAULT: '#3d8fd4',
  container: '#cee5ff',
  onContainer: '#00436a',
  50: '#f4f9ff',
  100: '#e3f0ff',
  200: '#c5e0fc',
  300: '#93c8f5',
  400: '#5da9e9',
  500: '#3d8fd4',
  600: '#2a75b8',
  700: '#1f5f9a',
  800: '#1e4f7d',
  900: '#1c4268',
};

const libraryTertiary = {
  DEFAULT: '#66BB6A',
  container: '#d4f4d6',
  onContainer: '#0d4a1a',
  50: '#f3faf3',
  100: '#e3f5e5',
  200: '#c6e9c9',
  300: '#9bd8a1',
  400: '#66BB6A',
  500: '#4caf50',
  600: '#3d9442',
  700: '#327538',
  800: '#2b5e30',
  900: '#254e29',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#fafaf5',
        },
        'surface-container': {
          low: '#f3f4ee',
          lowest: '#ffffff',
          high: '#ebece6',
          highest: '#ffffff',
        },
        'on-surface': {
          DEFAULT: '#30332e',
          variant: '#5c6058',
        },
        'outline-variant': '#c8ccc0',
        primary: libraryPrimary,
        nestory: libraryPrimary,
        secondary: librarySecondary,
        tertiary: libraryTertiary,
        background: '#fafaf5',
      },
      fontFamily: {
        headline: ['Lexend', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        md: '0.75rem',
        xl: '1.5rem',
        '2xl': '1.75rem',
        pill: '9999px',
      },
      boxShadow: {
        ambient: '0 12px 32px rgba(48, 51, 46, 0.06)',
        'ambient-sm': '0 6px 20px rgba(48, 51, 46, 0.05)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #E84A5F 0%, #ffb0ba 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, #c73d52 0%, #ff9eab 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #3d8fd4 0%, #93c8f5 100%)',
        'page-mesh':
          'radial-gradient(1100px 520px at 8% -8%, rgba(232, 74, 95, 0.14), transparent 52%), radial-gradient(900px 480px at 96% 4%, rgba(61, 143, 212, 0.12), transparent 48%), radial-gradient(800px 420px at 48% 102%, rgba(102, 187, 106, 0.1), transparent 52%)',
        'auth-panel':
          'linear-gradient(165deg, rgba(232, 74, 95, 0.92) 0%, rgba(61, 143, 212, 0.55) 48%, rgba(102, 187, 106, 0.35) 100%)',
      },
      animation: {
        'bounce-gentle': 'bounce-gentle 1.5s ease-in-out infinite',
        wiggle: 'wiggle 0.6s ease-in-out infinite',
        hop: 'hop 0.8s ease-in-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 3s ease-in-out infinite',
        sparkle: 'sparkle 1.5s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-down': 'slide-down 0.4s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-out': 'fade-out 0.4s ease-out',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-in-left': 'slide-in-left 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        celebrate: 'celebrate 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        hop: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
          '100%': { transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        'slide-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-20px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(20px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        celebrate: {
          '0%': { transform: 'scale(0.5) rotateZ(-20deg)', opacity: '0' },
          '50%': { transform: 'scale(1.1) rotateZ(0deg)' },
          '100%': { transform: 'scale(1) rotateZ(0deg)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

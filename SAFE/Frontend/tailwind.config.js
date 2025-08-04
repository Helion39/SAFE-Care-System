/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pastel Color Palette
        pastel: {
          primary: '#C6E7FF',      // Light blue - primary backgrounds
          secondary: '#D4F6FF',    // Lighter blue - secondary elements
          background: '#FBFBFB',   // Off-white - main background
          white: '#FFFFFF',        // Pure white - cards, forms
        },
        // Enhanced Gray Scale
        gray: {
          50: '#f5f9ff',   // Lightest blue-gray - subtle backgrounds
          100: '#F1F3F4',  // Light gray - borders, dividers
          200: '#E8EAED',  // Medium light gray - inactive states
          300: '#DADCE0',  // Medium gray - borders
          400: '#BDC1C6',  // Dark gray - secondary text
          500: '#9AA0A6',  // Darker gray - labels
          600: '#80868B',  // Dark gray - primary text
          700: '#5F6368',  // Very dark gray - headings
          800: '#3C4043',  // Almost black - important text
        },
        // Status Colors (Pastel Variants)
        success: {
          light: '#E8F5E8',      // Light green background
          DEFAULT: '#2E7D32',    // Green text
        },
        warning: {
          light: '#FFF8E1',      // Light yellow background
          DEFAULT: '#F57F17',    // Orange text
        },
        error: {
          light: '#FFEBEE',      // Light red background
          DEFAULT: '#C62828',    // Red text
        },
        info: {
          light: '#E3F2FD',      // Light blue background
          DEFAULT: '#1565C0',    // Blue text
        },
        // Legacy color support (for gradual migration)
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        card: 'var(--color-card)',
        'card-foreground': 'var(--color-card-foreground)',
        popover: 'var(--color-popover)',
        'popover-foreground': 'var(--color-popover-foreground)',
        primary: 'var(--color-primary)',
        'primary-foreground': 'var(--color-primary-foreground)',
        secondary: 'var(--color-secondary)',
        'secondary-foreground': 'var(--color-secondary-foreground)',
        muted: 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-foreground)',
        accent: 'var(--color-accent)',
        'accent-foreground': 'var(--color-accent-foreground)',
        destructive: 'var(--color-destructive)',
        'destructive-foreground': 'var(--color-destructive-foreground)',
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        'input-background': 'var(--color-input-background)',
        ring: 'var(--color-ring)',
      },
      // 8px Grid Spacing System
      spacing: {
        '0.5': '4px',   // 0.5 * 8px
        '1': '8px',     // 1 * 8px
        '1.5': '12px',  // 1.5 * 8px
        '2': '16px',    // 2 * 8px
        '2.5': '20px',  // 2.5 * 8px
        '3': '24px',    // 3 * 8px
        '3.5': '28px',  // 3.5 * 8px
        '4': '32px',    // 4 * 8px
        '5': '40px',    // 5 * 8px
        '6': '48px',    // 6 * 8px
        '7': '56px',    // 7 * 8px
        '8': '64px',    // 8 * 8px
      },
      // Minimal Border Radius
      borderRadius: {
        'none': '0px',
        'sm': '4px',     // Small elements
        'DEFAULT': '8px', // Standard elements
        'lg': '12px',    // Cards, modals
        'xl': '16px',    // Large containers
        // Legacy support
        'md': 'var(--radius-md)',
      },
      // Typography Scale
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],    // Caption
        'sm': ['14px', { lineHeight: '20px' }],    // Body small
        'base': ['16px', { lineHeight: '24px' }],  // Body
        'lg': ['18px', { lineHeight: '28px' }],    // Heading 3
        'xl': ['20px', { lineHeight: '28px' }],    // Heading 2
        '2xl': ['24px', { lineHeight: '32px' }],   // Heading 1
      },
      // Font Family
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
      },
      // Transitions
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
}
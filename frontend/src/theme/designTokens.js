export const tokens = {
  colors: {
    // Primary brand colors with semantic meaning
    brand: {
      primary: {
        50: '#e6f5ff',
        100: '#b3e0ff',
        500: '#0078d4',
        600: '#0062ab',
        700: '#004c84',
      },
      secondary: {
        50: '#e8f5e9',
        100: '#c8e6c9',
        500: '#4caf50',
        600: '#2e7d32',
        700: '#1b5e20',
      }
    },
    // Component-specific colors from your YSB and RSM pages
    components: {
      leftPcb: '#ff6b6b',
      masterPcb: '#51cf66',
      rightPcb: '#74c0fc',
      boardToBoard: '#087f23',
      powerCable: '#8d6e63',
      highlight: '#ffeb3b'
    },
    // System UI colors
    ui: {
      background: {
        primary: '#ffffff',
        secondary: '#f8f9fa',
        tertiary: '#f1f3f5',
      },
      text: {
        primary: '#212529',
        secondary: '#495057',
        tertiary: '#868e96',
        inverse: '#ffffff'
      },
      border: {
        light: '#e9ecef',
        default: '#ced4da',
        focus: '#0078d4'
      }
    }
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
    16: '4rem',
  },
  typography: {
    fontFamily: {
      sans: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms'
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
};
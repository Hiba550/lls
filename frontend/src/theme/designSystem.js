/**
 * Industrial UI Design System
 * 
 * This file defines the core design system used throughout the application
 * for a consistent, professional industrial interface.
 */

// Color palette optimized for industrial applications
const colors = {
  // Primary colors
  primary: {
    50: '#e6f0ff',
    100: '#b3d1ff',
    200: '#80b3ff',
    300: '#4d94ff',
    400: '#1a75ff',
    500: '#0066ff', // Primary brand color
    600: '#0052cc',
    700: '#003d99',
    800: '#002966',
    900: '#001433',
  },
  
  // Neutral colors for backgrounds, text, etc.
  neutral: {
    50: '#f5f5f5',
    100: '#e6e6e6',
    200: '#cccccc',
    300: '#b3b3b3',
    400: '#999999',
    500: '#808080',
    600: '#666666',
    700: '#4d4d4d',
    800: '#333333',
    900: '#1a1a1a',
    950: '#0d0d0d',
  },
  
  // Semantic colors
  success: {
    light: '#d1fae5',
    DEFAULT: '#10b981',
    dark: '#065f46',
  },
  warning: {
    light: '#fef3c7',
    DEFAULT: '#f59e0b',
    dark: '#92400e',
  },
  error: {
    light: '#fee2e2',
    DEFAULT: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    light: '#dbeafe',
    DEFAULT: '#3b82f6',
    dark: '#1e40af',
  },
};

// Typography system
const typography = {
  fontFamily: {
    sans: [
      '"Inter"',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ],
    mono: [
      'ui-monospace',
      'SFMono-Regular',
      'Menlo',
      'Monaco',
      'Consolas',
      '"Liberation Mono"',
      '"Courier New"',
      'monospace',
    ],
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

// Spacing system (in rems - multiple of 4px)
const spacing = {
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  32: '8rem',      // 128px
};

// Border radius
const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
};

// Shadows optimized for industrial UI
const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

// Transition speeds
const transitions = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
};

// Z-index scale
const zIndex = {
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  auto: 'auto',
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
};

// Component-specific styles
const components = {
  // Button variants
  button: {
    // Primary buttons - for main actions
    primary: {
      bg: colors.primary[500],
      hoverBg: colors.primary[600],
      activeBg: colors.primary[700],
      text: 'white',
    },
    // Secondary buttons - for secondary actions
    secondary: {
      bg: colors.neutral[200],
      hoverBg: colors.neutral[300],
      activeBg: colors.neutral[400],
      text: colors.neutral[800],
    },
    // Danger buttons - for destructive actions
    danger: {
      bg: colors.error.DEFAULT,
      hoverBg: colors.error.dark,
      activeBg: '#7f1d1d',
      text: 'white',
    },
    // Ghost buttons - for low emphasis actions
    ghost: {
      bg: 'transparent',
      hoverBg: colors.neutral[100],
      activeBg: colors.neutral[200],
      text: colors.neutral[700],
    },
  },
  
  // Table styles for data display
  table: {
    header: {
      bg: colors.neutral[50],
      darkBg: colors.neutral[900],
      textColor: colors.neutral[500],
      darkTextColor: colors.neutral[400],
      borderColor: colors.neutral[200],
      darkBorderColor: colors.neutral[700],
    },
    row: {
      bg: 'white',
      darkBg: colors.neutral[800],
      hoverBg: colors.neutral[50],
      darkHoverBg: colors.neutral[750],
      borderColor: colors.neutral[200],
      darkBorderColor: colors.neutral[700],
      textColor: colors.neutral[800],
      darkTextColor: colors.neutral[200],
    }
  },
  
  // Card styles
  card: {
    bg: 'white',
    darkBg: colors.neutral[800],
    border: `1px solid ${colors.neutral[200]}`,
    darkBorder: `1px solid ${colors.neutral[700]}`,
    shadow: shadows.sm,
    radius: borderRadius.DEFAULT,
  },
  
  // Form element styles
  form: {
    input: {
      bg: 'white',
      darkBg: colors.neutral[700],
      border: `1px solid ${colors.neutral[300]}`,
      darkBorder: `1px solid ${colors.neutral[600]}`,
      focus: {
        ring: `1px solid ${colors.primary[500]}`,
        border: `1px solid ${colors.primary[500]}`,
      },
      text: colors.neutral[800],
      darkText: 'white',
    },
  },
};

// Export the design system
const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  components,
};

export default designSystem;
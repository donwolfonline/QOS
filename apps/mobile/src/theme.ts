export const theme = {
  colors: {
    background: '#0a0a0a',      // Matrix-Noir background
    surface: '#121212',         // Slightly lighter for cards/glassmorphism base
    border: '#333333',
    primary: '#00ff41',         // Primary neon green
    secondary: '#ff003c',       // Danger red
    accent: '#00d4ff',          // Action blue
    text: '#00ff41',            // Default text matches primary
    textMuted: '#555555',
    error: '#ff003c',
    warning: '#f3f925',
  },
  typography: {
    fontFamily: 'FiraCode_400Regular', // Will fallback to 'monospace' if not loaded yet
    sizes: {
      xs: 10,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
      xxl: 32,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  effects: {
    neonGlow: {
      textShadowColor: '#00ff41',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    },
    neonGlowError: {
      textShadowColor: '#ff003c',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    },
    neonGlowAccent: {
      textShadowColor: '#00d4ff',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    },
  }
};

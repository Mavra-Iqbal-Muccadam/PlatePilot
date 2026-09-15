export const theme = {
  brand: {
    name: "PlatePilot",
    tagline: "Eat Smart, Live Better",
  },
  colors: {
    primaryDarkGreen: "#386641",
    mediumGreen: "#6A994E",
    lightGreen: "#A7C957",
    creamBackground: "#F2E8CF",
    accentRed: "#BC4749",
  },
  radius: {
    sm: "12px",
    md: "14px",
    lg: "16px",
    xl: "20px",
  },
  spacing: {
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  typography: {
    h1: "text-4xl sm:text-5xl font-bold",
    h2: "text-2xl sm:text-3xl font-semibold",
    body: "text-base font-normal",
    button: "text-sm sm:text-base font-medium",
  },
  motion: {
    quick: "0.2s ease",
    regular: "0.3s ease",
  },
} as const;

export type AppTheme = typeof theme;

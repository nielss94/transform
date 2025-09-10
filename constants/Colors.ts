/**
 * Modern social media-inspired color system
 * Dark mode focused with sophisticated complementary colors
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

// Modern Design System - Social Media Inspired
export const DesignSystem = {
  // Base Dark Colors (Instagram/Twitter inspired)
  colors: {
    // Backgrounds
    background: {
      primary: "#000000", // Pure black like Instagram stories
      secondary: "#0a0a0a", // Slightly lighter for cards
      tertiary: "#1a1a1a", // Input fields, modals
      overlay: "#000000cc", // 80% opacity overlay
    },

    // Text
    text: {
      primary: "#ffffff", // Pure white for main text
      secondary: "#a0a0a0", // Muted for subtitles
      tertiary: "#6b6b6b", // Even more muted
      inverse: "#000000", // For light backgrounds
    },

    // Interactive Elements
    interactive: {
      primary: "#ff4757", // Instagram-like red/coral for primary actions
      secondary: "#00d2d3", // Teal complement for secondary actions
      tertiary: "#ffa502", // Orange for highlights
      success: "#2ed573", // Green for success states
      warning: "#ffa502", // Orange for warnings
      error: "#ff4757", // Red for errors
    },

    // Neutral Grays
    gray: {
      100: "#f8f9fa",
      200: "#e9ecef",
      300: "#dee2e6",
      400: "#ced4da",
      500: "#6c757d",
      600: "#495057",
      700: "#343a40",
      800: "#212529",
      900: "#1a1a1a",
    },

    // Borders & Dividers
    border: {
      primary: "#2a2a2a", // Subtle borders
      secondary: "#404040", // More visible borders
      accent: "#ff4757", // Accent borders
    },
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border Radius
  radius: {
    sm: 6,
    md: 12,
    lg: 20,
    xl: 24,
    full: 999,
  },

  // Typography
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    fontWeight: {
      normal: "400" as const,
      medium: "500" as const,
      semibold: "600" as const,
      bold: "700" as const,
    },
  },

  // Shadows (subtle, not glowy)
  shadows: {
    sm: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

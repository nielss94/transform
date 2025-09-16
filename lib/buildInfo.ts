import Constants from "expo-constants";
import { Platform } from "react-native";

export interface BuildInfo {
  version: string;
  buildNumber: string;
  buildProfile: string;
  buildTime?: string;
  gitCommit?: string;
  platform: string;
  isDebug: boolean;
  enableLogging: boolean;
}

/**
 * Get comprehensive build information for debugging and version tracking
 */
export function getBuildInfo(): BuildInfo {
  const extra = Constants.expoConfig?.extra || {};
  const manifest = Constants.expoConfig || {};

  return {
    version: manifest.version || "1.0.0",
    buildNumber:
      Platform.OS === "ios"
        ? manifest.ios?.buildNumber || "1"
        : manifest.android?.versionCode?.toString() || "1",
    buildProfile: process.env.EXPO_PUBLIC_BUILD_PROFILE || "unknown",
    buildTime: extra.buildInfo?.buildTime,
    gitCommit: extra.buildInfo?.gitCommit,
    platform: Platform.OS,
    isDebug: __DEV__,
    enableLogging: process.env.EXPO_PUBLIC_ENABLE_LOGGING === "true" || __DEV__,
  };
}

/**
 * Get a formatted build info string for display
 */
export function getBuildInfoString(): string {
  const info = getBuildInfo();
  return `v${info.version} (${info.buildNumber}) - ${info.buildProfile} - ${info.platform}`;
}

/**
 * Log build information on app start
 */
export function logBuildInfo(): void {
  const info = getBuildInfo();

  console.log("🏗️ Build Information:");
  console.log(`  Version: ${info.version}`);
  console.log(`  Build Number: ${info.buildNumber}`);
  console.log(`  Build Profile: ${info.buildProfile}`);
  console.log(`  Platform: ${info.platform}`);
  console.log(`  Debug Mode: ${info.isDebug}`);
  console.log(`  Logging Enabled: ${info.enableLogging}`);

  if (info.buildTime) {
    console.log(`  Build Time: ${info.buildTime}`);
  }

  if (info.gitCommit) {
    console.log(`  Git Commit: ${info.gitCommit}`);
  }
}

/**
 * Enhanced logging function that respects build configuration
 */
export const logger = {
  debug: (message: string, ...args: any[]) => {
    const info = getBuildInfo();
    if (info.enableLogging) {
      console.log(`🐛 [DEBUG] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: any[]) => {
    const info = getBuildInfo();
    if (info.enableLogging) {
      console.log(`ℹ️ [INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    const info = getBuildInfo();
    if (info.enableLogging) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    // Always log errors regardless of build configuration
    console.error(`❌ [ERROR] ${message}`, ...args);
  },

  auth: (message: string, ...args: any[]) => {
    const info = getBuildInfo();
    if (info.enableLogging) {
      console.log(`🔐 [AUTH] ${message}`, ...args);
    }
  },

  api: (message: string, ...args: any[]) => {
    const info = getBuildInfo();
    if (info.enableLogging) {
      console.log(`🌐 [API] ${message}`, ...args);
    }
  },
};

/**
 * Check if environment variables are properly configured
 */
export function validateEnvironment(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required Supabase environment variables
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
    missing.push("EXPO_PUBLIC_SUPABASE_URL");
  }

  if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  }

  // Check build profile
  if (!process.env.EXPO_PUBLIC_BUILD_PROFILE) {
    warnings.push(
      "EXPO_PUBLIC_BUILD_PROFILE not set - version tracking may be limited"
    );
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

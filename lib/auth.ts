import * as WebBrowser from "expo-web-browser";
import {
  AuthUser,
  SignInData,
  SignUpData,
  supabase,
  AuthSession as SupabaseAuthSession,
} from "./supabase";

// Complete the auth flow for web browsers
WebBrowser.maybeCompleteAuthSession();

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  session?: SupabaseAuthSession;
  error?: string;
}

export class AuthService {
  /**
   * Sign up with email and password
   */
  static async signUpWithEmail(data: SignUpData): Promise<AuthResult> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        user: authData.user as AuthUser,
        session: authData.session as SupabaseAuthSession,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "An unexpected error occurred",
      };
    }
  }

  /**
   * Sign in with email and password
   */
  static async signInWithEmail(data: SignInData): Promise<AuthResult> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        user: authData.user as AuthUser,
        session: authData.session as SupabaseAuthSession,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "An unexpected error occurred",
      };
    }
  }

  /**
   * Sign in with Google using Supabase OAuth with proper deep link handling
   */
  static async signInWithGoogle(): Promise<AuthResult> {
    try {
      // Create the deep link URL for OAuth callback
      // Use manual construction to ensure correct format
      const redirectTo = "beforeafter://auth/callback";

      console.log("🔍 DEBUG: OAuth redirect URL:", redirectTo);
      console.log("🔍 DEBUG: Expected format: beforeafter://auth/callback");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: false,
        },
      });

      console.log("🔍 DEBUG: Supabase OAuth response:", { data, error });

      if (error) {
        console.error("❌ Google auth error:", error);
        return {
          success: false,
          error: error.message || "Google authentication failed",
        };
      }

      // For mobile OAuth, the URL needs to be opened in a browser
      if (data?.url) {
        console.log("🔍 DEBUG: Opening OAuth URL:", data.url);

        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo
        );

        console.log(
          "🔍 DEBUG: WebBrowser result:",
          JSON.stringify(result, null, 2)
        );

        if (result.type === "success") {
          console.log("✅ Browser auth successful");
          console.log("🔍 DEBUG: OAuth result URL:", result.url);

          // If we have a URL with tokens, process it directly
          if (result.url && result.url.includes("#access_token=")) {
            try {
              // Extract tokens from the URL
              const fragment = result.url.split("#")[1];
              if (fragment) {
                const params = new URLSearchParams(fragment);
                const accessToken = params.get("access_token");
                const refreshToken = params.get("refresh_token");

                console.log("🔍 DEBUG: Direct token extraction:", {
                  hasAccessToken: !!accessToken,
                  hasRefreshToken: !!refreshToken,
                });

                if (accessToken && refreshToken) {
                  // Set session directly
                  const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                  });

                  console.log("🔍 DEBUG: Direct setSession result:", {
                    hasSession: !!data?.session,
                    error,
                    userId: data?.session?.user?.id,
                  });

                  if (error) {
                    console.error("❌ Error setting session directly:", error);
                    return {
                      success: false,
                      error: `Session error: ${error.message}`,
                    };
                  }

                  if (data?.session) {
                    console.log("✅ Session established directly!");
                    return {
                      success: true,
                      user: data.session.user as AuthUser,
                      session: data.session as SupabaseAuthSession,
                    };
                  }
                }
              }
            } catch (tokenError) {
              console.error("❌ Error processing tokens directly:", tokenError);
            }
          }

          // Fallback: wait and check for session
          console.log("🔍 DEBUG: Falling back to session check...");
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const { data: session, error: sessionError } =
            await supabase.auth.getSession();

          console.log("🔍 DEBUG: Fallback session check:", {
            hasSession: !!session?.session,
            sessionError,
            userId: session?.session?.user?.id,
          });

          if (session?.session) {
            console.log("✅ Found session in fallback!");
            return {
              success: true,
              user: session.session.user as AuthUser,
              session: session.session as SupabaseAuthSession,
            };
          }

          // If still no session, return error
          return {
            success: false,
            error: "Failed to establish session after authentication",
          };
        } else if (result.type === "cancel") {
          console.log("⚠️ User cancelled authentication");
          return {
            success: false,
            error: "Authentication was cancelled by user",
          };
        } else if (result.type === "dismiss") {
          console.log("⚠️ Authentication dismissed");
          return {
            success: false,
            error: "Authentication was dismissed",
          };
        } else {
          console.log("❌ Unexpected result type:", result.type);
          return {
            success: false,
            error: `Unexpected authentication result: ${result.type}`,
          };
        }
      } else {
        console.error("❌ No OAuth URL received from Supabase");
        return {
          success: false,
          error: "No OAuth URL received from Supabase",
        };
      }
    } catch (error: any) {
      console.error("❌ Google auth exception:", error);
      return {
        success: false,
        error: error.message || "Google authentication failed",
      };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Sign out failed",
      };
    }
  }

  /**
   * Get the current user session
   */
  static async getCurrentSession(): Promise<{
    user: AuthUser | null;
    session: SupabaseAuthSession | null;
  }> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        return { user: null, session: null };
      }

      return {
        user: data.session.user as AuthUser,
        session: data.session as SupabaseAuthSession,
      };
    } catch (error) {
      console.error("Error getting current session:", error);
      return { user: null, session: null };
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Password reset failed",
      };
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Password update failed",
      };
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(
    callback: (event: string, session: SupabaseAuthSession | null) => void
  ) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session as SupabaseAuthSession | null);
    });
  }
}

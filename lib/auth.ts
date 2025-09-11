import * as AuthSession from "expo-auth-session";
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
   * Sign in with Google
   */
  static async signInWithGoogle(): Promise<AuthResult> {
    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        useProxy: true,
      });

      const authUrl = `${
        process.env.EXPO_PUBLIC_SUPABASE_URL
      }/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
        redirectUrl
      )}`;

      const result = await AuthSession.startAsync({
        authUrl,
        returnUrl: redirectUrl,
      });

      if (result.type === "success") {
        const { url } = result;
        const urlParams = new URLSearchParams(
          url.split("#")[1] || url.split("?")[1]
        );

        const accessToken = urlParams.get("access_token");
        const refreshToken = urlParams.get("refresh_token");

        if (accessToken) {
          // Set the session in Supabase
          const { data: authData, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
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
        }
      }

      return {
        success: false,
        error: "Google authentication was cancelled or failed",
      };
    } catch (error: any) {
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

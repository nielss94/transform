import { AuthResult, AuthService } from "@/lib/auth";
import { logBuildInfo, logger, validateEnvironment } from "@/lib/buildInfo";
import { AuthSession, AuthUser, SignInData, SignUpData } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  // State
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  signUpWithEmail: (data: SignUpData) => Promise<AuthResult>;
  signInWithEmail: (data: SignInData) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!session;

  useEffect(() => {
    let mounted = true;

    // Log build info and validate environment on app start
    logBuildInfo();
    const envValidation = validateEnvironment();

    if (!envValidation.isValid) {
      logger.error("Environment validation failed:", envValidation.missing);
    }

    if (envValidation.warnings.length > 0) {
      logger.warn("Environment warnings:", envValidation.warnings);
    }

    // Get initial session from storage
    const getInitialSession = async () => {
      try {
        logger.auth("Checking for stored session...");
        const { user: currentUser, session: currentSession } =
          await AuthService.getCurrentSession();

        if (mounted) {
          if (currentSession && currentUser) {
            logger.auth("Found stored session for:", currentUser.email);
            setUser(currentUser);
            setSession(currentSession);
          } else {
            logger.auth("No stored session found");
            setUser(null);
            setSession(null);
          }
        }
      } catch (error) {
        logger.error("Error getting initial session:", error);
        if (mounted) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen to auth changes
    const {
      data: { subscription },
    } = AuthService.onAuthStateChange((event, session) => {
      logger.auth(
        "Auth state changed:",
        event,
        session ? `User: ${session.user?.email}` : "No session"
      );

      if (mounted) {
        if (session) {
          setUser(session.user);
          setSession(session);
        } else {
          setUser(null);
          setSession(null);
        }
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Redirect to main app when authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Simple replace without dismissAll to avoid navigation errors
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, router]);

  const signUpWithEmail = async (data: SignUpData): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await AuthService.signUpWithEmail(data);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (data: SignInData): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await AuthService.signInWithEmail(data);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await AuthService.signInWithGoogle();
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await AuthService.signOut();
      if (result.success) {
        setUser(null);
        setSession(null);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    return AuthService.resetPassword(email);
  };

  const updatePassword = async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    return AuthService.updatePassword(newPassword);
  };

  const value: AuthContextType = {
    // State
    user,
    session,
    isLoading,
    isAuthenticated,

    // Actions
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

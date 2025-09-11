import { DesignSystem } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type AuthMode = "signin" | "signup";

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    isLoading: authLoading,
  } = useAuth();

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result =
        mode === "signin"
          ? await signInWithEmail({ email, password })
          : await signUpWithEmail({ email, password });

      if (!result.success) {
        Alert.alert(
          "Authentication Error",
          result.error || "An error occurred"
        );
      } else if (mode === "signup" && !result.session) {
        Alert.alert(
          "Check Your Email",
          "We sent you a confirmation link. Please check your email and click the link to verify your account."
        );
      }
    } catch (error) {
      console.error("Auth error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);

    try {
      const result = await signInWithGoogle();

      if (!result.success) {
        Alert.alert(
          "Google Sign-In Error",
          result.error || "Failed to sign in with Google"
        );
      }
    } catch (error) {
      console.error("Google auth error:", error);
      Alert.alert("Error", "An unexpected error occurred with Google sign-in");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const isButtonLoading = isLoading || authLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "signin"
              ? "Sign in to continue your transformation journey"
              : "Join the community and start your transformation"}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={DesignSystem.colors.text.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={DesignSystem.colors.text.tertiary}
              secureTextEntry
              textContentType={mode === "signup" ? "newPassword" : "password"}
            />
          </View>

          {/* Confirm Password Input (Sign Up Only) */}
          {mode === "signup" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor={DesignSystem.colors.text.tertiary}
                secureTextEntry
                textContentType="newPassword"
              />
            </View>
          )}

          {/* Email/Password Submit Button */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isButtonLoading && styles.disabledButton,
            ]}
            onPress={handleEmailAuth}
            disabled={isButtonLoading}
          >
            {isButtonLoading ? (
              <ActivityIndicator color={DesignSystem.colors.text.primary} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={[
              styles.googleButton,
              isButtonLoading && styles.disabledButton,
            ]}
            onPress={handleGoogleAuth}
            disabled={isButtonLoading}
          >
            {isButtonLoading ? (
              <ActivityIndicator color={DesignSystem.colors.text.secondary} />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>
                  {mode === "signin"
                    ? "Sign in with Google"
                    : "Sign up with Google"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Toggle Mode */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {mode === "signin"
                ? "Don't have an account? "
                : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={styles.toggleButton}>
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: DesignSystem.spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.xl,
  },
  title: {
    fontSize: DesignSystem.typography.fontSize.xxl,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.sm,
  },
  subtitle: {
    fontSize: DesignSystem.typography.fontSize.md,
    color: DesignSystem.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: DesignSystem.spacing.lg,
  },
  label: {
    fontSize: DesignSystem.typography.fontSize.md,
    fontWeight: DesignSystem.typography.fontWeight.medium,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  input: {
    backgroundColor: DesignSystem.colors.background.secondary,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.primary,
    borderRadius: DesignSystem.radius.md,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.fontSize.md,
    color: DesignSystem.colors.text.primary,
  },
  primaryButton: {
    backgroundColor: DesignSystem.colors.interactive.primary,
    borderRadius: DesignSystem.radius.md,
    paddingVertical: DesignSystem.spacing.md,
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
    ...DesignSystem.shadows.sm,
  },
  primaryButtonText: {
    color: DesignSystem.colors.text.primary,
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: DesignSystem.colors.border.primary,
  },
  dividerText: {
    marginHorizontal: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.fontSize.sm,
    color: DesignSystem.colors.text.tertiary,
  },
  googleButton: {
    backgroundColor: DesignSystem.colors.background.secondary,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.primary,
    borderRadius: DesignSystem.radius.md,
    paddingVertical: DesignSystem.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  googleIcon: {
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    color: DesignSystem.colors.interactive.primary,
    marginRight: DesignSystem.spacing.sm,
  },
  googleButtonText: {
    color: DesignSystem.colors.text.secondary,
    fontSize: DesignSystem.typography.fontSize.md,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleText: {
    fontSize: DesignSystem.typography.fontSize.md,
    color: DesignSystem.colors.text.secondary,
  },
  toggleButton: {
    fontSize: DesignSystem.typography.fontSize.md,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    color: DesignSystem.colors.interactive.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

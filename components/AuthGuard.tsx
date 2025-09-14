import { DesignSystem } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, BackHandler, StyleSheet, View } from "react-native";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Simple replace without dismissAll to avoid navigation errors
      router.replace("/auth");
    }
  }, [isAuthenticated, isLoading, router]);

  // Add navigation state listener to prevent unwanted transitions
  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = navigation.addListener("beforeRemove", (e) => {
        const action = e.data.action;

        // Prevent navigation back to auth when authenticated
        if (action.type === "GO_BACK" || action.type === "POP") {
          const state = navigation.getState();
          const currentRoute = state.routes[state.index];

          if (currentRoute?.name === "(tabs)") {
            // Prevent the action
            e.preventDefault();
          }
        }
      });

      return unsubscribe;
    }
  }, [isAuthenticated, navigation]);

  // Prevent hardware back button from going to auth when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          // Always prevent back navigation when authenticated at root level
          const state = navigation.getState();
          const currentRoute = state.routes[state.index];

          // If we're at the main tabs or auth screen, prevent going back
          if (
            currentRoute?.name === "(tabs)" ||
            currentRoute?.name === "auth"
          ) {
            return true; // Prevent going back
          }
          return false; // Allow normal back navigation within the app
        }
      );

      return () => backHandler.remove();
    }
  }, [isAuthenticated, navigation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={DesignSystem.colors.interactive.primary}
        />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={DesignSystem.colors.interactive.primary}
        />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DesignSystem.colors.background.primary,
  },
});

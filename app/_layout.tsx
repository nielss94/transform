import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            // Disable animation to prevent seeing the transition
            animationEnabled: false,
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              gestureEnabled: false, // Disable swipe back gesture
              animationEnabled: false, // Disable animation
            }}
          />
          <Stack.Screen
            name="auth"
            options={{
              headerShown: false,
              gestureEnabled: false, // Disable swipe back gesture
              animationEnabled: false, // Disable animation
            }}
          />
          <Stack.Screen name="+not-found" />
          <Stack.Screen
            name="user/[userId]/profile"
            options={{
              headerShown: true,
              gestureEnabled: true, // Allow back gesture for user profiles
            }}
          />
          <Stack.Screen
            name="user/[userId]/viewer"
            options={{
              headerShown: true,
              gestureEnabled: true, // Allow back gesture for user viewers
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

import { DesignSystem } from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("🔍 DEBUG: Auth callback route triggered");

        // Wait a moment for any URL processing
        await new Promise((resolve) => setTimeout(resolve, 500));

        // The URL parameters should contain the auth tokens
        // Supabase will automatically handle the session creation
        const { data: session, error } = await supabase.auth.getSession();

        console.log("🔍 DEBUG: Callback session check:", {
          hasSession: !!session?.session,
          error,
          userId: session?.session?.user?.id,
        });

        if (error) {
          console.error("❌ Auth callback error:", error);
          router.replace("/auth");
          return;
        }

        if (session?.session) {
          console.log("✅ Auth callback successful, redirecting to app");
          router.replace("/(tabs)");
        } else {
          console.log("⚠️ No session found in callback, redirecting to auth");
          router.replace("/auth");
        }
      } catch (error) {
        console.error("❌ Auth callback exception:", error);
        router.replace("/auth");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: DesignSystem.colors.background.primary,
      }}
    >
      <ActivityIndicator
        size="large"
        color={DesignSystem.colors.interactive.primary}
      />
      <Text
        style={{
          marginTop: 16,
          fontSize: 16,
          color: DesignSystem.colors.text.secondary,
        }}
      >
        Completing authentication...
      </Text>
    </View>
  );
}

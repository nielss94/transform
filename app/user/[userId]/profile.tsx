import ProfileOverview from "@/components/ProfileOverview";
import { DesignSystem } from "@/constants/Colors";
import { TransformationService } from "@/lib/database";
import { Transformation } from "@/lib/supabase";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function UserProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");

  const loadUserTransformations = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      // Get all transformations and filter for this user
      const allTransformations =
        await TransformationService.getCompletedTransformations();
      const userTransformations = allTransformations.filter(
        (t) => t.user_id === userId
      );

      setTransformations(userTransformations);

      // Set user name from first transformation
      if (userTransformations.length > 0) {
        setUserName(userTransformations[0].user_name || "Unknown User");
      }
    } catch (error) {
      console.error("Failed to load user transformations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserTransformations();
  }, [loadUserTransformations]);

  const handleTransformationPress = (
    transformationId: string,
    index: number
  ) => {
    // Navigate to user transformation viewer with the transformation index
    router.push({
      pathname: "/user/[userId]/viewer",
      params: {
        userId: userId!,
        transformationId,
        startIndex: index.toString(),
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: "Profile" }} />
        <ActivityIndicator
          size="large"
          color={DesignSystem.colors.interactive.primary}
        />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: userName,
          headerStyle: {
            backgroundColor: DesignSystem.colors.background.primary,
          },
          headerTintColor: DesignSystem.colors.text.primary,
        }}
      />

      <ProfileOverview
        userName={userName}
        transformations={transformations}
        onTransformationPress={handleTransformationPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DesignSystem.colors.background.primary,
  },
  loadingText: {
    color: DesignSystem.colors.text.primary,
    marginTop: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.fontSize.md,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
});

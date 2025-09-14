import UserTransformationViewer from "@/components/UserTransformationViewer";
import { DesignSystem } from "@/constants/Colors";
import { TransformationService } from "@/lib/database";
import { Transformation } from "@/lib/supabase";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function UserTransformationViewerScreen() {
  const { userId, transformationId, startIndex } = useLocalSearchParams<{
    userId: string;
    transformationId: string;
    startIndex: string;
  }>();
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: "Transformations" }} />
        <ActivityIndicator
          size="large"
          color={DesignSystem.colors.interactive.primary}
        />
        <Text style={styles.loadingText}>Loading transformations...</Text>
      </View>
    );
  }

  if (transformations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: userName }} />
        <Text style={styles.emptyTitle}>No transformations found</Text>
        <Text style={styles.emptySubtitle}>
          This user hasn't shared any transformations yet
        </Text>
      </View>
    );
  }

  const initialIndex = startIndex ? parseInt(startIndex, 10) : 0;

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

      <UserTransformationViewer
        transformations={transformations}
        initialIndex={initialIndex}
        userName={userName}
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DesignSystem.colors.background.primary,
    paddingHorizontal: DesignSystem.spacing.xxl,
  },
  emptyTitle: {
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.sm,
  },
  emptySubtitle: {
    fontSize: DesignSystem.typography.fontSize.md,
    color: DesignSystem.colors.text.secondary,
    textAlign: "center",
  },
});

import ProfileOverview from "@/components/ProfileOverview";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { DesignSystem } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { TransformationService } from "@/lib/database";
import { Transformation } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileTab() {
  const { user } = useAuth();
  const router = useRouter();
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserTransformations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      // Get all transformations and filter for current user
      const allTransformations =
        await TransformationService.getCompletedTransformations();
      const userTransformations = allTransformations.filter(
        (t) => t.user_id === user.id
      );

      setTransformations(userTransformations);
    } catch (error) {
      console.error("Failed to load user transformations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

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
        userId: user!.id,
        transformationId,
        startIndex: index.toString(),
      },
    });
  };

  const handleSettingsPress = () => {
    router.push("/settings");
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
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
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header with Settings Button */}
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettingsPress}
        >
          <IconSymbol
            size={24}
            name="gearshape.fill"
            color={DesignSystem.colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      <ProfileOverview
        userName={getUserDisplayName()}
        transformations={transformations}
        onTransformationPress={handleTransformationPress}
        isOwnProfile={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.lg,
  },
  title: {
    fontSize: DesignSystem.typography.fontSize.xxl,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    color: DesignSystem.colors.text.primary,
  },
  settingsButton: {
    padding: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.radius.md,
    backgroundColor: DesignSystem.colors.background.secondary,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.primary,
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

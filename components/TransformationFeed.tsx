import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";

import { DesignSystem } from "@/constants/Colors";
import { TransformationService } from "@/lib/database";
import { Transformation } from "@/lib/supabase";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface TransformationCardProps {
  transformation: Transformation;
  isActive: boolean;
}

function TransformationCard({
  transformation,
  isActive,
}: TransformationCardProps) {
  const [showAfter, setShowAfter] = useState(false);
  const [lastManualToggle, setLastManualToggle] = useState(0);

  // Auto-toggle between before/after every 3 seconds when card is active
  // But pause auto-toggle for 5 seconds after manual interaction
  useEffect(() => {
    if (!isActive || !transformation.after_photo_url) return;

    const timeSinceManualToggle = Date.now() - lastManualToggle;
    const shouldAutoToggle = timeSinceManualToggle > 5000; // 5 second pause after manual toggle

    if (!shouldAutoToggle) {
      const pauseTimeout = setTimeout(() => {
        // Resume auto-toggle after pause
      }, 5000 - timeSinceManualToggle);
      return () => clearTimeout(pauseTimeout);
    }

    const interval = setInterval(() => {
      setShowAfter((prev) => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, transformation.after_photo_url, lastManualToggle]);

  const handleToggle = () => {
    if (!transformation.after_photo_url) return; // Can't toggle if no after photo

    setShowAfter((prev) => !prev);
    setLastManualToggle(Date.now());
  };

  const currentPhoto =
    showAfter && transformation.after_photo_url
      ? transformation.after_photo_url
      : transformation.before_photo_url;

  const photoLabel =
    showAfter && transformation.after_photo_url ? "AFTER" : "BEFORE";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleToggle}
      activeOpacity={0.95}
    >
      <Image
        source={{ uri: currentPhoto }}
        style={styles.image}
        contentFit="cover"
      />

      {/* Overlay gradient */}
      <View style={styles.overlay} />

      {/* Photo label */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{photoLabel}</Text>
        {transformation.after_photo_url && (
          <View style={styles.tapHintContainer}>
            <Text style={styles.tapHint}>Tap to switch</Text>
          </View>
        )}
      </View>

      {/* Transformation info */}
      <View style={styles.info}>
        <Text style={styles.date}>
          {new Date(transformation.created_at).toLocaleDateString()}
        </Text>
        {transformation.after_photo_url ? (
          <Text style={styles.status}>✨ Complete</Text>
        ) : (
          <Text style={styles.statusIncomplete}>⏳ In Progress</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function TransformationFeed() {
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasInitiallyLoadedRef = useRef(false);

  const loadTransformations = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const data = await TransformationService.getCompletedTransformations();
      setTransformations(data);
      hasInitiallyLoadedRef.current = true;
    } catch (error) {
      console.error("Failed to load transformations:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTransformations();
  }, [loadTransformations]);

  // Refresh when the screen comes into focus (when user navigates back to Feed tab)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we already have data (skip on initial load)
      if (hasInitiallyLoadedRef.current) {
        loadTransformations(false); // false = don't show full loading state
      }
    }, [loadTransformations])
  );

  const handleRefresh = useCallback(() => {
    loadTransformations(false);
  }, [loadTransformations]);

  const onViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: ViewToken[];
  }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: Transformation;
    index: number;
  }) => (
    <TransformationCard
      transformation={item}
      isActive={index === activeIndex}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading transformations...</Text>
      </View>
    );
  }

  if (transformations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No transformations yet</Text>
        <Text style={styles.emptySubtitle}>
          Create your first transformation to see it here!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={transformations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={screenHeight}
      snapToAlignment="start"
      decelerationRate="fast"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 50,
      }}
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  card: {
    width: screenWidth,
    height: screenHeight,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)", // Lighter overlay for better contrast
  },
  labelContainer: {
    position: "absolute",
    top: 60,
    right: DesignSystem.spacing.lg,
    alignItems: "center",
  },
  label: {
    color: DesignSystem.colors.text.primary,
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    backgroundColor: DesignSystem.colors.background.overlay,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.radius.full,
    marginBottom: DesignSystem.spacing.sm,
    overflow: "hidden",
  },
  tapHintContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.radius.md,
  },
  tapHint: {
    color: DesignSystem.colors.text.primary,
    fontSize: DesignSystem.typography.fontSize.xs,
    fontWeight: DesignSystem.typography.fontWeight.medium,
    opacity: 0.9,
  },
  info: {
    position: "absolute",
    bottom: 100,
    left: DesignSystem.spacing.lg,
    right: DesignSystem.spacing.lg,
  },
  date: {
    color: DesignSystem.colors.text.primary,
    fontSize: DesignSystem.typography.fontSize.md,
    fontWeight: DesignSystem.typography.fontWeight.medium,
    marginBottom: DesignSystem.spacing.sm,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  status: {
    color: DesignSystem.colors.interactive.success,
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusIncomplete: {
    color: DesignSystem.colors.interactive.warning,
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    color: DesignSystem.colors.text.primary,
    fontSize: DesignSystem.typography.fontSize.xl,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    marginBottom: DesignSystem.spacing.md,
    textAlign: "center",
  },
  emptySubtitle: {
    color: DesignSystem.colors.text.secondary,
    fontSize: DesignSystem.typography.fontSize.md,
    textAlign: "center",
    lineHeight: 24,
  },
});

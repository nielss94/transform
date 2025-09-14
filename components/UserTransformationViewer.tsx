import { DesignSystem } from "@/constants/Colors";
import { Transformation } from "@/lib/supabase";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface UserTransformationViewerProps {
  transformations: Transformation[];
  initialIndex: number;
  userName: string;
}

interface TransformationCardProps {
  transformation: Transformation;
  isActive: boolean;
  userName: string;
}

function TransformationCard({
  transformation,
  isActive,
  userName,
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
        <View style={styles.userInfo}>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.date}>
              {new Date(transformation.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        {transformation.after_photo_url ? (
          <Text style={styles.status}>✨ Complete</Text>
        ) : (
          <Text style={styles.statusIncomplete}>⏳ In Progress</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function UserTransformationViewer({
  transformations,
  initialIndex,
  userName,
}: UserTransformationViewerProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to initial index
    if (flatListRef.current && transformations.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, 100);
    }
  }, [initialIndex, transformations.length]);

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
      userName={userName}
    />
  );

  return (
    <FlatList
      ref={flatListRef}
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
      style={styles.container}
      getItemLayout={(data, index) => ({
        length: screenHeight,
        offset: screenHeight * index,
        index,
      })}
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: DesignSystem.colors.text.primary,
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    marginBottom: 2,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  date: {
    color: DesignSystem.colors.text.secondary,
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.medium,
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
});

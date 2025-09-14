import { DesignSystem } from "@/constants/Colors";
import { Transformation } from "@/lib/supabase";
import { Image } from "expo-image";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const itemSize = (screenWidth - DesignSystem.spacing.lg * 3) / 2; // 2 columns with spacing

interface ProfileOverviewProps {
  userName: string;
  transformations: Transformation[];
  onTransformationPress: (transformationId: string, index: number) => void;
  isOwnProfile?: boolean;
}

interface TransformationGridItemProps {
  transformation: Transformation;
  index: number;
  onPress: (transformationId: string, index: number) => void;
}

function TransformationGridItem({
  transformation,
  index,
  onPress,
}: TransformationGridItemProps) {
  return (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => onPress(transformation.id, index)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: transformation.before_photo_url }}
        style={styles.gridImage}
        contentFit="cover"
      />

      {/* Overlay to show it's a before/after */}
      <View style={styles.gridOverlay}>
        <Text style={styles.gridLabel}>
          {transformation.after_photo_url ? "BEFORE/AFTER" : "BEFORE"}
        </Text>
      </View>

      {/* Completion indicator */}
      {transformation.after_photo_url && (
        <View style={styles.completionBadge}>
          <Text style={styles.completionText}>✨</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileOverview({
  userName,
  transformations,
  onTransformationPress,
  isOwnProfile = false,
}: ProfileOverviewProps) {
  const completedCount = transformations.filter(
    (t) => t.after_photo_url
  ).length;
  const totalCount = transformations.length;

  const renderItem = ({
    item,
    index,
  }: {
    item: Transformation;
    index: number;
  }) => (
    <TransformationGridItem
      transformation={item}
      index={index}
      onPress={onTransformationPress}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userStats}>
          {totalCount} transformation{totalCount !== 1 ? "s" : ""} •{" "}
          {completedCount} completed
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Transformations</Text>
    </View>
  );

  if (transformations.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No transformations yet</Text>
          <Text style={styles.emptySubtitle}>
            {isOwnProfile
              ? "Start your transformation journey by creating your first post"
              : "This user hasn't shared any transformations"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transformations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  listContent: {
    padding: DesignSystem.spacing.lg,
  },
  header: {
    marginBottom: DesignSystem.spacing.xl,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.xl,
  },
  userName: {
    fontSize: DesignSystem.typography.fontSize.xxl,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  userStats: {
    fontSize: DesignSystem.typography.fontSize.md,
    color: DesignSystem.colors.text.secondary,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
  sectionTitle: {
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },
  row: {
    justifyContent: "space-between",
  },
  gridItem: {
    width: itemSize,
    height: itemSize,
    borderRadius: DesignSystem.radius.md,
    overflow: "hidden",
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
  },
  gridLabel: {
    color: DesignSystem.colors.text.primary,
    fontSize: DesignSystem.typography.fontSize.xs,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    textAlign: "center",
  },
  completionBadge: {
    position: "absolute",
    top: DesignSystem.spacing.sm,
    right: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.interactive.success,
    borderRadius: DesignSystem.radius.full,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  completionText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.xxl,
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

import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CameraComponent from "@/components/CameraComponent";
import { DesignSystem } from "@/constants/Colors";
import { TransformationService } from "@/lib/database";
import { initializeStorage, uploadPhoto } from "@/lib/storage";

// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type PhotoMode = "before" | "after";

interface LocalTransformation {
  id: string;
  beforePhoto: string;
  afterPhoto: string | null;
  createdAt: Date;
}

export default function CreateScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<PhotoMode>("before");
  const [currentTransformationId, setCurrentTransformationId] = useState<
    string | null
  >(null);
  const [unfinishedTransformations, setUnfinishedTransformations] = useState<
    LocalTransformation[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingMessage, setUploadingMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const handlePhotoTaken = async (photoUri: string) => {
    // Close camera immediately for better UX
    setShowCamera(false);
    setIsUploading(true);
    setUploadingMessage(
      currentMode === "before"
        ? "Saving before photo..."
        : "Saving after photo..."
    );

    try {
      if (currentMode === "before") {
        // Upload before photo
        const uploadResult = await uploadPhoto(photoUri, "before");

        if (!uploadResult.success) {
          Alert.alert(
            "Upload Failed",
            uploadResult.error || "Failed to upload photo"
          );
          return;
        }

        // Create new transformation record if none exists
        if (!currentTransformationId) {
          const transformation =
            await TransformationService.createTransformation(uploadResult.url!);
          if (transformation) {
            setCurrentTransformationId(transformation.id);
          }
        }

        setBeforePhoto(uploadResult.url!);
      } else {
        // Upload after photo
        const uploadResult = await uploadPhoto(photoUri, "after");

        if (!uploadResult.success) {
          Alert.alert(
            "Upload Failed",
            uploadResult.error || "Failed to upload photo"
          );
          return;
        }

        // Create transformation if none exists, or update existing one
        if (!currentTransformationId && beforePhoto) {
          const transformation =
            await TransformationService.createTransformation(beforePhoto);
          if (transformation) {
            setCurrentTransformationId(transformation.id);
            await TransformationService.updateTransformation(
              transformation.id,
              uploadResult.url!
            );
          }
        } else if (currentTransformationId) {
          await TransformationService.updateTransformation(
            currentTransformationId,
            uploadResult.url!
          );
        }

        setAfterPhoto(uploadResult.url!);

        // Show completion celebration
        if (beforePhoto) {
          Alert.alert(
            "🎉 Transformation Complete!",
            "Your before & after story is ready to inspire others!",
            [
              { text: "Create Another", onPress: startNewTransformation },
              { text: "View in Feed", style: "default" },
            ]
          );
        }

        // Refresh unfinished transformations
        loadUnfinishedTransformations();
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      Alert.alert("Error", "Failed to save photo. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadingMessage("");
    }
  };

  const openCameraForSlot = (mode: PhotoMode) => {
    setCurrentMode(mode);
    setShowCamera(true);
  };

  const startNewTransformation = () => {
    setBeforePhoto(null);
    setAfterPhoto(null);
    setCurrentTransformationId(null);
    setCurrentMode("before");
  };

  // Load unfinished transformations on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeStorage();
        await loadUnfinishedTransformations();
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const loadUnfinishedTransformations = async () => {
    try {
      const transformations =
        await TransformationService.getIncompleteTransformations();

      const localTransformations: LocalTransformation[] = transformations.map(
        (t) => ({
          id: t.id,
          beforePhoto: t.before_photo_url,
          afterPhoto: t.after_photo_url || null,
          createdAt: new Date(t.created_at),
        })
      );

      setUnfinishedTransformations(localTransformations);
    } catch (error) {
      console.error("Failed to load unfinished transformations:", error);
    }
  };

  const continueTransformation = (transformation: LocalTransformation) => {
    setBeforePhoto(transformation.beforePhoto);
    setAfterPhoto(transformation.afterPhoto);
    setCurrentTransformationId(transformation.id);
    setCurrentMode("after");
  };

  const deleteTransformation = async (id: string) => {
    Alert.alert(
      "Delete Transformation",
      "Are you sure you want to delete this transformation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await TransformationService.deleteTransformation(id);
              loadUnfinishedTransformations();

              // Clear current transformation if it's the one being deleted
              if (currentTransformationId === id) {
                startNewTransformation();
              }
            } catch (error) {
              console.error("Failed to delete transformation:", error);
              Alert.alert("Error", "Failed to delete transformation");
            }
          },
        },
      ]
    );
  };

  // Helper function to determine if transformation is complete
  const isTransformationComplete = () => {
    return beforePhoto && afterPhoto;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading...</Text>
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

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Transformation</Text>
          <Text style={styles.subtitle}>
            Capture your before & after moments
          </Text>
        </View>

        {/* Photo Slots - Instagram Stories Style */}
        <View style={styles.photoSlotsContainer}>
          {/* Before Photo Slot */}
          <TouchableOpacity
            style={styles.photoSlot}
            onPress={() => openCameraForSlot("before")}
            activeOpacity={0.8}
          >
            {beforePhoto ? (
              <>
                <Image source={{ uri: beforePhoto }} style={styles.slotImage} />
                <View style={styles.imageOverlay}>
                  <View style={styles.labelBadge}>
                    <Text style={styles.labelText}>BEFORE</Text>
                  </View>
                  <TouchableOpacity style={styles.editButton}>
                    <Text style={styles.editButtonText}>✏️</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.emptySlot}>
                <View style={styles.cameraIconContainer}>
                  <Text style={styles.cameraIcon}>📷</Text>
                </View>
                <Text style={styles.slotLabel}>BEFORE</Text>
                <Text style={styles.slotHint}>Tap to capture</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <Text style={styles.dividerText}>VS</Text>
          </View>

          {/* After Photo Slot */}
          <TouchableOpacity
            style={styles.photoSlot}
            onPress={() => openCameraForSlot("after")}
            activeOpacity={0.8}
          >
            {afterPhoto ? (
              <>
                <Image source={{ uri: afterPhoto }} style={styles.slotImage} />
                <View style={styles.imageOverlay}>
                  <View style={[styles.labelBadge, styles.labelBadgeAfter]}>
                    <Text style={styles.labelText}>AFTER</Text>
                  </View>
                  <TouchableOpacity style={styles.editButton}>
                    <Text style={styles.editButtonText}>✏️</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.emptySlot}>
                <View style={styles.cameraIconContainer}>
                  <Text style={styles.cameraIcon}>✨</Text>
                </View>
                <Text style={styles.slotLabel}>AFTER</Text>
                <Text style={styles.slotHint}>Tap to capture</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {isTransformationComplete() ? (
            <>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>
                  Share Transformation
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={startNewTransformation}
              >
                <Text style={styles.secondaryButtonText}>Start New</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {!beforePhoto &&
                  !afterPhoto &&
                  "Take your first photo to begin"}
                {beforePhoto &&
                  !afterPhoto &&
                  "Great! Now capture your after photo"}
                {!beforePhoto &&
                  afterPhoto &&
                  "Add your before photo to complete the story"}
              </Text>
            </View>
          )}
        </View>

        {/* Draft Transformations */}
        {unfinishedTransformations.length > 0 && (
          <ScrollView
            style={styles.draftsContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.draftsTitle}>
              Drafts ({unfinishedTransformations.length})
            </Text>

            {unfinishedTransformations.map((transformation) => (
              <TouchableOpacity
                key={transformation.id}
                style={styles.draftCard}
                onPress={() => continueTransformation(transformation)}
              >
                <Image
                  source={{ uri: transformation.beforePhoto }}
                  style={styles.draftThumbnail}
                />
                <View style={styles.draftInfo}>
                  <Text style={styles.draftDate}>
                    {transformation.createdAt.toLocaleDateString()}
                  </Text>
                  <Text style={styles.draftStatus}>Missing after photo</Text>
                </View>
                <TouchableOpacity
                  style={styles.draftDeleteButton}
                  onPress={() => deleteTransformation(transformation.id)}
                >
                  <Text style={styles.draftDeleteText}>×</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Upload Overlay */}
      {isUploading && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadModal}>
            <ActivityIndicator
              size="large"
              color={DesignSystem.colors.interactive.primary}
            />
            <Text style={styles.uploadModalText}>{uploadingMessage}</Text>
          </View>
        </View>
      )}

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowCamera(false)}
      >
        <CameraComponent
          mode={currentMode}
          onPhotoTaken={handlePhotoTaken}
          onClose={() => setShowCamera(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },

  // Loading State
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.fontSize.md,
    color: DesignSystem.colors.interactive.primary,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },

  // Main Content
  mainContent: {
    flex: 1,
    paddingTop: 60, // Status bar + padding
  },

  // Header
  header: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.xl,
    alignItems: "center",
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
  },

  // Photo Slots Container
  photoSlotsContainer: {
    flexDirection: "row",
    paddingHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.xl,
    alignItems: "center",
  },

  // Individual Photo Slot
  photoSlot: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: DesignSystem.radius.lg,
    overflow: "hidden",
  },

  // Slot Image (when photo is taken)
  slotImage: {
    width: "100%",
    height: "100%",
  },

  // Image Overlay (for labels and edit button)
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: DesignSystem.spacing.md,
    justifyContent: "space-between",
  },

  // Label Badges
  labelBadge: {
    backgroundColor: DesignSystem.colors.interactive.primary,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.radius.full,
    alignSelf: "flex-start",
  },
  labelBadgeAfter: {
    backgroundColor: DesignSystem.colors.interactive.secondary,
  },
  labelText: {
    color: DesignSystem.colors.text.primary,
    fontSize: DesignSystem.typography.fontSize.xs,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    letterSpacing: 1,
  },

  // Edit Button
  editButton: {
    backgroundColor: DesignSystem.colors.background.overlay,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  editButtonText: {
    fontSize: DesignSystem.typography.fontSize.md,
  },

  // Empty Slot (when no photo)
  emptySlot: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.secondary,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.primary,
    borderStyle: "dashed",
    borderRadius: DesignSystem.radius.lg,
    justifyContent: "center",
    alignItems: "center",
    padding: DesignSystem.spacing.lg,
  },

  // Camera Icon Container
  cameraIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: DesignSystem.colors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  cameraIcon: {
    fontSize: 28,
  },

  // Slot Labels
  slotLabel: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
    letterSpacing: 1,
  },
  slotHint: {
    fontSize: DesignSystem.typography.fontSize.xs,
    color: DesignSystem.colors.text.tertiary,
    textAlign: "center",
  },

  // VS Divider
  divider: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  dividerText: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    color: DesignSystem.colors.text.secondary,
    backgroundColor: DesignSystem.colors.background.primary,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.radius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.primary,
  },

  // Action Container
  actionContainer: {
    paddingHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.xl,
  },

  // Primary Button
  primaryButton: {
    backgroundColor: DesignSystem.colors.interactive.primary,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.radius.md,
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  primaryButtonText: {
    color: DesignSystem.colors.text.primary,
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },

  // Secondary Button
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.secondary,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.radius.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: DesignSystem.colors.text.secondary,
    fontSize: DesignSystem.typography.fontSize.md,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },

  // Progress Container
  progressContainer: {
    backgroundColor: DesignSystem.colors.background.secondary,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.radius.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.primary,
  },
  progressText: {
    color: DesignSystem.colors.text.secondary,
    fontSize: DesignSystem.typography.fontSize.md,
    textAlign: "center",
    lineHeight: 22,
  },

  // Drafts Section
  draftsContainer: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  draftsTitle: {
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },

  // Draft Card
  draftCard: {
    flexDirection: "row",
    backgroundColor: DesignSystem.colors.background.secondary,
    borderRadius: DesignSystem.radius.md,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.primary,
  },
  draftThumbnail: {
    width: 50,
    height: 60,
    borderRadius: DesignSystem.radius.sm,
    backgroundColor: DesignSystem.colors.gray[700],
  },
  draftInfo: {
    flex: 1,
    marginLeft: DesignSystem.spacing.md,
  },
  draftDate: {
    fontSize: DesignSystem.typography.fontSize.md,
    fontWeight: DesignSystem.typography.fontWeight.medium,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  draftStatus: {
    fontSize: DesignSystem.typography.fontSize.sm,
    color: DesignSystem.colors.interactive.warning,
  },
  draftDeleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DesignSystem.colors.interactive.error,
    justifyContent: "center",
    alignItems: "center",
  },
  draftDeleteText: {
    color: DesignSystem.colors.text.primary,
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    lineHeight: 20,
  },

  // Upload Overlay
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DesignSystem.colors.background.overlay,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  uploadModal: {
    backgroundColor: DesignSystem.colors.background.tertiary,
    borderRadius: DesignSystem.radius.lg,
    padding: DesignSystem.spacing.xl,
    alignItems: "center",
    minWidth: 200,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.primary,
    ...DesignSystem.shadows.lg,
  },
  uploadModalText: {
    color: DesignSystem.colors.text.primary,
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    marginTop: DesignSystem.spacing.md,
    textAlign: "center",
  },
});

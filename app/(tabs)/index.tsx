import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CameraComponent from "@/components/CameraComponent";
import { TransformationService } from "@/lib/database";
import { initializeStorage, uploadPhoto } from "@/lib/storage";

type PhotoMode = "before" | "after";

interface LocalTransformation {
  id: string;
  beforePhoto: string;
  afterPhoto: string | null;
  createdAt: Date;
}

export default function HomeScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<PhotoMode>("before");
  const [currentTransformationId, setCurrentTransformationId] = useState<
    string | null
  >(null);
  const [savedTransformations, setSavedTransformations] = useState<
    LocalTransformation[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handlePhotoTaken = async (photoUri: string) => {
    setIsUploading(true);

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

        // Create transformation record in database
        const transformation = await TransformationService.createTransformation(
          uploadResult.url!
        );

        if (!transformation) {
          Alert.alert("Error", "Failed to save transformation");
          return;
        }

        setBeforePhoto(uploadResult.url!);
        setCurrentTransformationId(transformation.id);
        setCurrentMode("after");
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

        // Update transformation record with after photo
        const updatedTransformation =
          await TransformationService.updateTransformation(
            currentTransformationId!,
            uploadResult.url!
          );

        if (!updatedTransformation) {
          Alert.alert("Error", "Failed to update transformation");
          return;
        }

        // Update local state
        setAfterPhoto(uploadResult.url!);

        // Add to saved transformations
        const newLocalTransformation: LocalTransformation = {
          id: updatedTransformation.id,
          beforePhoto: updatedTransformation.before_photo_url,
          afterPhoto: updatedTransformation.after_photo_url || null,
          createdAt: new Date(updatedTransformation.created_at),
        };

        setSavedTransformations((prev) => [newLocalTransformation, ...prev]);
      }
    } catch (error) {
      console.error("Photo handling error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsUploading(false);
      setShowCamera(false);
    }
  };

  const startNewComparison = () => {
    setBeforePhoto(null);
    setAfterPhoto(null);
    setCurrentTransformationId(null);
    setCurrentMode("before");
  };

  // Load saved transformations on component mount
  useEffect(() => {
    const loadTransformations = async () => {
      try {
        await initializeStorage();
        const transformations =
          await TransformationService.getCompletedTransformations();

        const localTransformations: LocalTransformation[] = transformations.map(
          (t) => ({
            id: t.id,
            beforePhoto: t.before_photo_url,
            afterPhoto: t.after_photo_url || null,
            createdAt: new Date(t.created_at),
          })
        );

        setSavedTransformations(localTransformations);
      } catch (error) {
        console.error("Failed to load transformations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransformations();
  }, []);

  const getButtonText = () => {
    if (!beforePhoto) return "📸 Take Before Photo";
    if (!afterPhoto) return "📸 Take After Photo";
    return "📸 Start New Comparison";
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading transformations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.appTitle}>Transform</Text>
            <Text style={styles.headerSubtitle}>Document your journey</Text>
          </View>
          <View style={styles.headerDecor}>
            <Text style={styles.decorEmoji}>✨</Text>
          </View>
        </View>

        {/* Current Transformation Card */}
        <View style={styles.mainSection}>
          {beforePhoto || afterPhoto ? (
            <View style={styles.transformationCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Your Transformation</Text>
                <View style={styles.progressBadge}>
                  <Text style={styles.progressText}>
                    {beforePhoto && afterPhoto ? "Complete" : "In Progress"}
                  </Text>
                </View>
              </View>

              <View style={styles.photoShowcase}>
                <View style={styles.photoFrame}>
                  <Text style={styles.photoLabel}>BEFORE</Text>
                  {beforePhoto ? (
                    <Image
                      source={{ uri: beforePhoto }}
                      style={styles.showcasePhoto}
                    />
                  ) : (
                    <View style={styles.emptyPhotoSlot}>
                      <Text style={styles.emptyPhotoText}>📷</Text>
                    </View>
                  )}
                </View>

                <View style={styles.transformArrow}>
                  <View style={styles.arrowLine} />
                  <Text style={styles.arrowText}>→</Text>
                  <View style={styles.arrowLine} />
                </View>

                <View style={styles.photoFrame}>
                  <Text style={styles.photoLabel}>AFTER</Text>
                  {afterPhoto ? (
                    <Image
                      source={{ uri: afterPhoto }}
                      style={styles.showcasePhoto}
                    />
                  ) : (
                    <View style={styles.emptyPhotoSlot}>
                      <Text style={styles.emptyPhotoText}>❓</Text>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isUploading && styles.actionButtonDisabled,
                ]}
                onPress={() => {
                  if (isUploading) return;

                  if (beforePhoto && afterPhoto) {
                    startNewComparison();
                  } else {
                    setShowCamera(true);
                  }
                }}
                disabled={isUploading}
              >
                {isUploading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="white" size="small" />
                    <Text
                      style={[styles.actionButtonText, styles.uploadingText]}
                    >
                      {currentMode === "before"
                        ? "Uploading Before Photo..."
                        : "Uploading After Photo..."}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.actionButtonText}>{getButtonText()}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeContent}>
                <Text style={styles.welcomeEmoji}>🎯</Text>
                <Text style={styles.welcomeTitle}>Ready to Transform?</Text>
                <Text style={styles.welcomeDescription}>
                  Start by capturing your &quot;before&quot; moment. Whether
                  it&apos;s a room makeover, fitness journey, or creative
                  project - document your transformation!
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.startButton,
                  isUploading && styles.startButtonDisabled,
                ]}
                onPress={() => setShowCamera(true)}
                disabled={isUploading}
              >
                <Text style={styles.startButtonText}>
                  📸 Start Transformation
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* My Transformations */}
        {savedTransformations.length > 0 && (
          <View style={styles.transformationsSection}>
            <Text style={styles.sectionTitle}>My Transformations</Text>
            <View style={styles.transformationsList}>
              {savedTransformations.map((transformation) => (
                <View key={transformation.id} style={styles.transformationItem}>
                  <View style={styles.transformationPhotos}>
                    <Image
                      source={{ uri: transformation.beforePhoto }}
                      style={styles.feedPhoto}
                    />
                    <View style={styles.feedArrow}>
                      <Text style={styles.feedArrowText}>→</Text>
                    </View>
                    <Image
                      source={{ uri: transformation.afterPhoto || "" }}
                      style={styles.feedPhoto}
                    />
                  </View>
                  <View style={styles.transformationInfo}>
                    <Text style={styles.transformationDate}>
                      {transformation.createdAt.toLocaleDateString()} at{" "}
                      {transformation.createdAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <View style={styles.completeBadge}>
                      <Text style={styles.completeText}>✓ Complete</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Community Preview */}
        <View style={styles.communitySection}>
          <Text style={styles.communityTitle}>Community</Text>

          <View style={styles.feedPreview}>
            <TouchableOpacity style={styles.feedCard} disabled>
              <View style={styles.feedContent}>
                <Text style={styles.feedEmoji}>🔥</Text>
                <Text style={styles.feedTitle}>Trending Now</Text>
                <Text style={styles.feedSubtitle}>Amazing transformations</Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.feedCard} disabled>
              <View style={styles.feedContent}>
                <Text style={styles.feedEmoji}>⏳</Text>
                <Text style={styles.feedTitle}>In Progress</Text>
                <Text style={styles.feedSubtitle}>
                  Awaiting &quot;after&quot; photos
                </Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="overFullScreen"
        onRequestClose={() => {
          console.log("Modal onRequestClose called");
          setShowCamera(false);
        }}
      >
        <CameraComponent
          mode={currentMode}
          onClose={() => setShowCamera(false)}
          onPhotoTaken={handlePhotoTaken}
        />
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowCamera(false)}
        >
          <Text style={styles.closeButtonText}>✕ Close</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Header
  header: {
    backgroundColor: "white",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerContent: {
    flex: 1,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#64748b",
  },
  headerDecor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  decorEmoji: {
    fontSize: 20,
  },

  // Main Content
  mainSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  // Transformation Card
  transformationCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  progressBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#166534",
  },

  // Photo Showcase
  photoShowcase: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  photoFrame: {
    flex: 1,
    alignItems: "center",
  },
  photoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 12,
    letterSpacing: 1.2,
  },
  showcasePhoto: {
    width: 110,
    height: 140,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
  },
  emptyPhotoSlot: {
    width: 110,
    height: 140,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyPhotoText: {
    fontSize: 28,
    opacity: 0.5,
  },

  // Transform Arrow
  transformArrow: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  arrowLine: {
    width: 24,
    height: 1,
    backgroundColor: "#cbd5e1",
    marginVertical: 4,
  },
  arrowText: {
    fontSize: 18,
    color: "#3b82f6",
    fontWeight: "600",
  },

  // Action Button
  actionButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  // Welcome Card
  welcomeCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeContent: {
    alignItems: "center",
    marginBottom: 28,
  },
  welcomeEmoji: {
    fontSize: 56,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
    textAlign: "center",
  },
  welcomeDescription: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: "#059669",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    minWidth: 200,
  },
  startButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  // Community Section
  communitySection: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  communityTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
  },
  feedPreview: {
    gap: 12,
  },
  feedCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  feedContent: {
    flex: 1,
  },
  feedEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  feedSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  comingSoonBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },

  // Modal
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 12,
    borderRadius: 24,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  bottomSpacing: {
    height: 40,
  },

  // Loading States
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },

  // Upload States
  actionButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  startButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  uploadingText: {
    marginLeft: 8,
  },

  // My Transformations Section
  transformationsSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
  },
  transformationsList: {
    gap: 16,
  },
  transformationItem: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  transformationPhotos: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  feedPhoto: {
    width: 80,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    flex: 1,
  },
  feedArrow: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  feedArrowText: {
    fontSize: 16,
    color: "#3b82f6",
    fontWeight: "600",
  },
  transformationInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transformationDate: {
    fontSize: 14,
    color: "#64748b",
  },
  completeBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#166534",
  },
});

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

        // Create new transformation record
        const transformation = await TransformationService.createTransformation(
          uploadResult.url!
        );

        if (transformation) {
          setBeforePhoto(uploadResult.url!);
          setCurrentTransformationId(transformation.id);
          setCurrentMode("after");
        }
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

        // Update transformation with after photo
        if (currentTransformationId) {
          await TransformationService.updateTransformation(
            currentTransformationId,
            uploadResult.url!
          );
        }

        setAfterPhoto(uploadResult.url!);
        Alert.alert(
          "Amazing! ✨",
          "Your transformation is complete! Ready to inspire others? 🎉",
          [
            { text: "Create Another", onPress: startNewComparison },
            { text: "View in Feed", style: "default" },
          ]
        );

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

  const openCamera = () => {
    setShowCamera(true);
  };

  const startNewComparison = () => {
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
                startNewComparison();
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

  const getButtonText = () => {
    if (!beforePhoto) return "📸 Take Before Photo";
    if (!afterPhoto) return "✨ Take After Photo";
    return "🎉 Start New Transformation";
  };

  const getButtonAction = () => {
    if (!beforePhoto || !afterPhoto) {
      return openCamera;
    }
    return startNewComparison;
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>✨ Create Transformation</Text>
          <Text style={styles.subtitle}>
            Document your journey, one moment at a time
          </Text>
        </View>

        {/* Current Transformation */}
        <View style={styles.currentSection}>
          <Text style={styles.sectionTitle}>Current Transformation</Text>

          <View style={styles.photoGrid}>
            <View style={styles.photoContainer}>
              <Text style={styles.photoLabel}>Before</Text>
              {beforePhoto ? (
                <Image source={{ uri: beforePhoto }} style={styles.photo} />
              ) : (
                <View style={styles.placeholderPhoto}>
                  <Text style={styles.placeholderText}>📸</Text>
                  <Text style={styles.placeholderSubtext}>
                    Take before photo
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.photoContainer}>
              <Text style={styles.photoLabel}>After</Text>
              {afterPhoto ? (
                <Image source={{ uri: afterPhoto }} style={styles.photo} />
              ) : (
                <View style={styles.placeholderPhoto}>
                  <Text style={styles.placeholderText}>✨</Text>
                  <Text style={styles.placeholderSubtext}>
                    {beforePhoto ? "Take after photo" : "Take before first"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isUploading && styles.buttonDisabled]}
            onPress={getButtonAction()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.buttonText}>{uploadingMessage}</Text>
              </>
            ) : (
              <Text style={styles.buttonText}>{getButtonText()}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Unfinished Transformations */}
        {unfinishedTransformations.length > 0 && (
          <View style={styles.unfinishedSection}>
            <Text style={styles.sectionTitle}>
              Unfinished Transformations ({unfinishedTransformations.length})
            </Text>

            {unfinishedTransformations.map((transformation) => (
              <View key={transformation.id} style={styles.transformationCard}>
                <Image
                  source={{ uri: transformation.beforePhoto }}
                  style={styles.thumbnailPhoto}
                />
                <View style={styles.transformationInfo}>
                  <Text style={styles.transformationDate}>
                    {transformation.createdAt.toLocaleDateString()}
                  </Text>
                  <Text style={styles.transformationStatus}>
                    Waiting for after photo
                  </Text>
                </View>
                <View style={styles.transformationActions}>
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => continueTransformation(transformation)}
                  >
                    <Text style={styles.continueButtonText}>Continue</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteTransformation(transformation.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Upload Overlay */}
      {isUploading && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadModal}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.uploadModalText}>{uploadingMessage}</Text>
            <Text style={styles.uploadModalSubtext}>
              {currentMode === "before"
                ? "Creating your transformation..."
                : "Completing your transformation..."}
            </Text>
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
    backgroundColor: "#0f0f23",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8b5cf6",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#a855f7",
    textAlign: "center",
  },
  currentSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  photoContainer: {
    flex: 1,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 8,
    textAlign: "center",
  },
  photo: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },
  placeholderPhoto: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    backgroundColor: "#1f1f37",
    borderWidth: 2,
    borderColor: "#8b5cf6",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 32,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: "#a855f7",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  unfinishedSection: {
    padding: 20,
    paddingTop: 0,
  },
  transformationCard: {
    backgroundColor: "#1f1f37",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#374151",
  },
  thumbnailPhoto: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  transformationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transformationDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  transformationStatus: {
    fontSize: 14,
    color: "#fbbf24",
  },
  transformationActions: {
    gap: 8,
  },
  continueButton: {
    backgroundColor: "#10b981",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 15, 35, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  uploadModal: {
    backgroundColor: "#1f1f37",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#374151",
    minWidth: 250,
  },
  uploadModalText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  uploadModalSubtext: {
    color: "#a855f7",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});

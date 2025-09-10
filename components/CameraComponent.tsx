import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, { runOnJS, useSharedValue } from "react-native-reanimated";

interface CameraComponentProps {
  mode?: "before" | "after";
  onClose: () => void;
  onPhotoTaken: (photoUri: string) => void;
}

export default function CameraComponent({
  mode,
  onClose,
  onPhotoTaken,
}: CameraComponentProps) {
  // All hooks must be called at the top level, in the same order every time
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [photo, setPhoto] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const zoomValue = useSharedValue(0);

  // Handle both hardware back button AND modern gesture navigation
  useEffect(() => {
    const backAction = () => {
      console.log("Back button/gesture detected");
      onClose();
      return true; // Prevent default back action
    };

    // Handle hardware back button (older Android)
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [onClose]);

  // Functions that depend on hooks
  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      try {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true, // Reduces processing time and flash
        });
        if (photo) {
          setPhoto(photo.uri);
        }
      } catch (error) {
        console.error("Camera error:", error);
        Alert.alert("Error", "Failed to take picture");
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const retakePicture = () => {
    setPhoto(null);
    setIsCapturing(false);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const updateZoom = (newZoom: number) => {
    setZoom(newZoom);
  };

  // New Gesture Handler 2.x pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      zoomValue.value = zoom; // Store initial zoom value
    })
    .onUpdate((event) => {
      // Simple scale-based zoom calculation
      const baseZoom = zoomValue.value;
      const scaleDelta = (event.scale - 1) * 0.3; // Reduced sensitivity
      const newZoom = Math.min(Math.max(baseZoom + scaleDelta, 0), 1);
      runOnJS(updateZoom)(newZoom);
    })
    .onFinalize(() => {
      zoomValue.value = zoom; // Update stored zoom value
    });

  // Pan gesture for swipe-to-dismiss (modern gesture navigation)
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Allow Android edge gesture by detecting swipes from the left edge
      if (event.translationX > 50 && event.absoluteX < 50) {
        // This is likely an edge swipe gesture
        runOnJS(onClose)();
      }
    })
    .onEnd((event) => {
      // Detect right swipe OR downward swipe with lower thresholds
      if (
        (event.velocityX > 200 && event.translationX > 50) || // Right swipe (even lower threshold)
        (event.velocityY > 200 && event.translationY > 50) // Downward swipe (even lower threshold)
      ) {
        console.log("Swipe dismiss gesture detected");
        runOnJS(onClose)();
      }
    });

  // Double-tap gesture to flip camera
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      console.log("Double-tap detected - flipping camera");
      runOnJS(toggleCameraFacing)();
    });

  // Combine all gestures - using Race to prevent conflicts
  const combinedGesture = Gesture.Race(
    Gesture.Simultaneous(pinchGesture, doubleTapGesture),
    panGesture
  );

  // Conditional rendering after all hooks
  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.fullscreenPreview} />
        <View style={styles.previewControls}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={retakePicture}
          >
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.previewButton, styles.usePhotoButton]}
            onPress={() => {
              if (photo) {
                onPhotoTaken(photo);
                setPhoto(null);
              }
            }}
          >
            <Text style={styles.buttonText}>
              Use{" "}
              {mode === "before"
                ? "Before"
                : mode === "after"
                ? "After"
                : "This"}{" "}
              Photo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={styles.container}>
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={cameraRef}
            zoom={zoom}
          >
            {/* Top Controls */}
            <View style={styles.topControls}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  console.log("Close button pressed");
                  onClose();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Close camera"
                accessibilityRole="button"
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
              <View style={styles.modeIndicator}>
                <Text style={styles.modeText}>
                  {mode === "before"
                    ? "📸 Taking BEFORE photo"
                    : mode === "after"
                    ? "📸 Taking AFTER photo"
                    : "📸 Taking photo"}
                </Text>
              </View>
              <View style={styles.closeButton} />
            </View>

            {/* Bottom Controls */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={toggleCameraFacing}
              >
                <Text style={styles.buttonText}>Flip</Text>
              </TouchableOpacity>
              <View style={styles.captureContainer}>
                <TouchableOpacity
                  style={[
                    styles.captureButton,
                    isCapturing && styles.captureButtonCapturing,
                  ]}
                  onPress={takePicture}
                  disabled={isCapturing}
                >
                  <View
                    style={[
                      styles.captureButtonInner,
                      isCapturing && styles.captureButtonInnerCapturing,
                    ]}
                  />
                </TouchableOpacity>
                {zoom > 0 && (
                  <Text style={styles.zoomIndicator}>
                    {(zoom * 9 + 1).toFixed(1)}x
                  </Text>
                )}
              </View>
              <View style={styles.button} />
            </View>
          </CameraView>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#000", // Prevents white flash
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: "#ffffff",
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    marginHorizontal: 20,
    marginBottom: 40,
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 15,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonCapturing: {
    backgroundColor: "rgba(139,92,246,0.5)",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  captureButtonInnerCapturing: {
    backgroundColor: "#8b5cf6",
    transform: [{ scale: 0.8 }],
  },
  preview: {
    flex: 1,
  },
  fullscreenPreview: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  previewControls: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewButton: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    minWidth: 100,
    alignItems: "center",
  },
  usePhotoButton: {
    backgroundColor: "#8b5cf6",
  },
  captureContainer: {
    alignItems: "center",
  },
  zoomIndicator: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  topControls: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 24,
  },
  modeIndicator: {
    alignItems: "center",
  },
  modeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
});

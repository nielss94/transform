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
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface CameraComponentProps {
  mode: "before" | "after";
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
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          setPhoto(photo.uri);
        }
      } catch (error) {
        console.error("Camera error:", error);
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  const retakePicture = () => {
    setPhoto(null);
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
  const panGesture = Gesture.Pan().onEnd((event) => {
    // Detect right swipe from left edge (back gesture)
    if (event.velocityX > 500 && event.translationX > 100) {
      console.log("Swipe back gesture detected");
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

  // Combine all gestures
  const combinedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture
  );

  // Conditional rendering after all hooks
  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.message}>
          We need your permission to show the camera
        </ThemedText>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={retakePicture}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (photo) {
                onPhotoTaken(photo);
                setPhoto(null);
              }
            }}
          >
            <Text style={styles.buttonText}>
              Use {mode === "before" ? "Before" : "After"} Photo
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
            {/* Mode Indicator */}
            <View style={styles.modeIndicator}>
              <Text style={styles.modeText}>
                {mode === "before"
                  ? "📸 Taking BEFORE photo"
                  : "📸 Taking AFTER photo"}
              </Text>
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
                  style={styles.captureButton}
                  onPress={takePicture}
                >
                  <View style={styles.captureButtonInner} />
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
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
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
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  preview: {
    flex: 1,
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
  modeIndicator: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
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

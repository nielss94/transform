import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import TransformationFeed from "@/components/TransformationFeed";
import { DesignSystem } from "@/constants/Colors";

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <TransformationFeed />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
});

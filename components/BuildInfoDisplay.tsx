import {
  getBuildInfo,
  getBuildInfoString,
  validateEnvironment,
} from "@/lib/buildInfo";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BuildInfoDisplayProps {
  showDetailed?: boolean;
}

export function BuildInfoDisplay({
  showDetailed = false,
}: BuildInfoDisplayProps) {
  const buildInfo = getBuildInfo();
  const envValidation = validateEnvironment();

  const handleBuildInfoPress = () => {
    const detailedInfo = `
Build Information:
• Version: ${buildInfo.version}
• Build Number: ${buildInfo.buildNumber}
• Build Profile: ${buildInfo.buildProfile}
• Platform: ${buildInfo.platform}
• Debug Mode: ${buildInfo.isDebug ? "Yes" : "No"}
• Logging Enabled: ${buildInfo.enableLogging ? "Yes" : "No"}
${buildInfo.buildTime ? `• Build Time: ${buildInfo.buildTime}` : ""}
${
  buildInfo.gitCommit
    ? `• Git Commit: ${buildInfo.gitCommit.substring(0, 8)}`
    : ""
}

Environment Status:
• Environment Valid: ${envValidation.isValid ? "Yes" : "No"}
${
  envValidation.missing.length > 0
    ? `• Missing Variables: ${envValidation.missing.join(", ")}`
    : ""
}
${
  envValidation.warnings.length > 0
    ? `• Warnings: ${envValidation.warnings.join(", ")}`
    : ""
}
    `;

    Alert.alert("Build Information", detailedInfo.trim());
  };

  if (!showDetailed) {
    return (
      <TouchableOpacity
        onPress={handleBuildInfoPress}
        style={styles.simpleContainer}
      >
        <Text style={styles.simpleText}>{getBuildInfoString()}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Build Information</Text>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Version:</Text>
        <Text style={styles.value}>{buildInfo.version}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Build:</Text>
        <Text style={styles.value}>{buildInfo.buildNumber}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Profile:</Text>
        <Text style={[styles.value, getProfileStyle(buildInfo.buildProfile)]}>
          {buildInfo.buildProfile}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Platform:</Text>
        <Text style={styles.value}>{buildInfo.platform}</Text>
      </View>

      {buildInfo.buildTime && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Built:</Text>
          <Text style={styles.value}>
            {new Date(buildInfo.buildTime).toLocaleDateString()}
          </Text>
        </View>
      )}

      {buildInfo.gitCommit && buildInfo.gitCommit !== "unknown" && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Commit:</Text>
          <Text style={styles.value}>
            {buildInfo.gitCommit.substring(0, 8)}
          </Text>
        </View>
      )}

      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusIndicator,
            envValidation.isValid ? styles.statusGreen : styles.statusRed,
          ]}
        />
        <Text style={styles.statusText}>
          Environment: {envValidation.isValid ? "OK" : "Issues"}
        </Text>
      </View>

      {(!envValidation.isValid || envValidation.warnings.length > 0) && (
        <TouchableOpacity
          onPress={handleBuildInfoPress}
          style={styles.issuesButton}
        >
          <Text style={styles.issuesButtonText}>View Issues</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function getProfileStyle(profile: string) {
  switch (profile) {
    case "production":
      return styles.productionProfile;
    case "development":
    case "development-simulator":
      return styles.developmentProfile;
    case "preview":
      return styles.previewProfile;
    default:
      return styles.unknownProfile;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  simpleContainer: {
    padding: 8,
    alignItems: "center",
  },
  simpleText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "SpaceMono",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    color: "#333",
    fontFamily: "SpaceMono",
  },
  productionProfile: {
    color: "#d32f2f",
    fontWeight: "bold",
  },
  developmentProfile: {
    color: "#1976d2",
    fontWeight: "bold",
  },
  previewProfile: {
    color: "#f57c00",
    fontWeight: "bold",
  },
  unknownProfile: {
    color: "#666",
    fontStyle: "italic",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusGreen: {
    backgroundColor: "#4caf50",
  },
  statusRed: {
    backgroundColor: "#f44336",
  },
  statusText: {
    fontSize: 12,
    color: "#666",
  },
  issuesButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#ffeb3b",
    borderRadius: 4,
    alignItems: "center",
  },
  issuesButtonText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
});

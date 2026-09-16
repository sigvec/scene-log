import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { Observation } from "../domain/observation/Observation";

interface ObservationReviewScreenProps {
  observation: Observation;
  onBack: () => void;
  onDelete: () => void;
}

export function ObservationReviewScreen({
  observation,
  onBack,
  onDelete,
}: ObservationReviewScreenProps) {
  return (
    <View style={styles.reviewObservation}>
      <Text style={styles.reviewTitle}>Observation</Text>

      <Text style={styles.reviewTimestamp}>
        {observation.createdAt.toLocaleTimeString()}
      </Text>

      {Array.from(
        new Set(
          observation.captures
            .map((capture) => capture.sourceImageUri)
            .filter((uri): uri is string => Boolean(uri)),
        ),
      ).map((imageUri) => (
        <Image
          key={imageUri}
          source={{ uri: imageUri }}
          style={styles.reviewImage}
          resizeMode="contain"
        />
      ))}

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Measurements</Text>

        {observation.captures.length > 0 ? (
          <View style={styles.reviewValues}>
            {observation.captures.flatMap((capture) =>
              capture.fieldValues.map((fieldValue, index) => (
                <View key={`${capture.id}-${index}`} style={styles.valuePill}>
                  <Text style={styles.valuePillText}>{fieldValue.value}</Text>
                </View>
              )),
            )}
          </View>
        ) : (
          <Text style={styles.reviewEmpty}>No measurements recorded.</Text>
        )}
      </View>

      <Pressable style={styles.primaryActionButton} onPress={onBack}>
        <Text style={styles.primaryActionButtonText}>Back</Text>
      </Pressable>

      <Pressable style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteButtonText}>Delete Observation</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewObservation: {
    marginTop: 40,
  },
  reviewTitle: {
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  reviewTimestamp: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
  },
  reviewImage: {
    width: "100%",
    height: 300,
    marginTop: 24,
    borderRadius: 8,
  },
  reviewSection: {
    marginTop: 32,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  reviewValues: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  valuePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
  },
  valuePillText: {
    fontSize: 15,
    fontWeight: "600",
  },
  reviewEmpty: {
    fontSize: 15,
    color: "#666",
  },
  primaryActionButton: {
    alignSelf: "stretch",
    marginTop: 20,
    paddingVertical: 13,
    alignItems: "center",
    borderRadius: 9,
    backgroundColor: "#222",
  },
  primaryActionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#B42318",
  },
});

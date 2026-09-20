import { ChevronRight, FileText, Plus } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "../components/Card";
import type { Observation } from "../domain/observation/Observation";
import type { Template } from "../domain/template/Template";
import { getFieldById } from "../domain/field/builtInFields";
import { formatDuration } from "../domain/field/duration";

interface ObservationListScreenProps {
  observations: Observation[];
  templates: Template[];
  onNewObservation: () => void;
  onSelectObservation: (observation: Observation) => void;
}

export function ObservationListScreen({
  observations,
  templates,
  onNewObservation,
  onSelectObservation,
}: ObservationListScreenProps) {
  const measurementValues = (observation: Observation) =>
    observation.captures.flatMap((capture) =>
      capture.fieldValues.map((fieldValue) => {
        const field = getFieldById(fieldValue.fieldId);
        const value =
          fieldValue.valueType === "duration"
            ? formatDuration(fieldValue.value)
            : fieldValue.value.toString();

        const template = capture.templateId
          ? templates.find((item) => item.id === capture.templateId)
          : undefined;
        const templateField = fieldValue.templateFieldId
          ? template?.fields.find(
              (candidate) => candidate.id === fieldValue.templateFieldId,
            )
          : undefined;
        const displayName = templateField?.label?.trim() || field.name;
        const unit = fieldValue.unit ?? field.unit;

        return `${displayName}: ${value}${unit ? ` ${unit}` : ""}`;
      }),
    );

  return (
    <View style={styles.observations}>
      {observations.length === 0 ? (
        <Card>
          <View style={styles.emptyStateIcon}>
            <FileText size={28} strokeWidth={1.8} color="#555" />
          </View>

          <Text style={styles.emptyStateTitle}>No observations yet</Text>

          <Text style={styles.emptyStateText}>
            Start by capturing your first observation.
          </Text>

          <Pressable style={styles.primaryButton} onPress={onNewObservation}>
            <Plus size={20} strokeWidth={2.2} color="#fff" />
            <Text style={styles.primaryButtonText}>New Observation</Text>
          </Pressable>
        </Card>
      ) : (
        <>
          <View style={styles.observationsHeader}>
            <Text style={styles.sectionTitle}>Observations</Text>

            <Pressable style={styles.primaryButton} onPress={onNewObservation}>
              <Plus size={18} strokeWidth={2.2} color="#fff" />
              <Text style={styles.primaryButtonText}>New Observation</Text>
            </Pressable>
          </View>

          {observations.map((observation) => (
            <Pressable
              key={observation.id}
              onPress={() => onSelectObservation(observation)}
            >
              <Card>
                <View style={styles.observationContent}>
                  <View style={styles.observationDetails}>
                    <Text style={styles.observationTime}>
                      {observation.createdAt.toLocaleTimeString()}
                    </Text>

                    <Text style={styles.observationCount}>
                      {observation.captures.reduce(
                        (count, capture) => count + capture.fieldValues.length,
                        0,
                      )}{" "}
                      measurement(s)
                    </Text>
                  </View>

                  <ChevronRight size={22} strokeWidth={1.8} color="#777" />
                </View>

                {measurementValues(observation).length > 0 && (
                  <View style={styles.measurementValues}>
                    {measurementValues(observation).map((value, index) => (
                      <View
                        key={`${observation.id}-${index}`}
                        style={styles.valuePill}
                      >
                        <Text style={styles.valuePillText}>{value}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            </Pressable>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  observations: {
    marginTop: 8,
  },
  emptyStateIcon: {
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    marginBottom: 20,
    borderRadius: 28,
    backgroundColor: "#F0F1F3",
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
    marginBottom: 24,
  },
  primaryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  observationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  observationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  observationTime: {
    fontSize: 16,
  },
  observationDetails: {
    flex: 1,
  },
  observationCount: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
  },
  measurementValues: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
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
});

import { BarChart3, ChevronRight, Clock, Plus } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "../components/Card";
import type { Observation } from "../domain/observation/Observation";
import type { Template } from "../domain/template/Template";
import type { SceneObservationField } from "../domain/scene/SceneObservationField";
import { getFieldById } from "../domain/field/builtInFields";
import { formatDuration } from "../domain/field/duration";

interface SceneHistoryScreenProps {
  observations: Observation[];
  templates: Template[];
  sceneFields: SceneObservationField[];
  onNewObservation: () => void;
  onSelectObservation: (observation: Observation) => void;
  onOpenSeries: () => void;
}

function formatFieldValue(
  value: { valueType: "number" | "duration"; value: number; unit?: string | null },
  fallbackUnit?: string | null,
): string {
  const formattedValue =
    value.valueType === "duration"
      ? formatDuration(value.value)
      : value.value.toString();
  const unit = value.unit ?? fallbackUnit;
  return `${formattedValue}${unit ? ` ${unit}` : ""}`;
}

function formatObservationTime(date: Date): string {
  return `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function SceneHistoryScreen({
  observations,
  templates,
  sceneFields,
  onNewObservation,
  onSelectObservation,
  onOpenSeries,
}: SceneHistoryScreenProps) {
  const sortedObservations = [...observations].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Clock size={20} strokeWidth={1.9} color="#555" />
            <Text style={styles.title}>History</Text>
          </View>
          <Text style={styles.subtitle}>
            {observations.length === 1
              ? "1 observation"
              : `${observations.length} observations`}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {sceneFields.length >= 2 ? (
            <Pressable style={styles.secondaryButton} onPress={onOpenSeries}>
              <BarChart3 size={17} strokeWidth={2} color="#444" />
              <Text style={styles.secondaryButtonText}>Series</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.primaryButton} onPress={onNewObservation}>
            <Plus size={18} strokeWidth={2.2} color="#fff" />
            <Text style={styles.primaryButtonText}>New Observation</Text>
          </Pressable>
        </View>
      </View>

      {sortedObservations.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>No observations yet</Text>
          <Text style={styles.emptyText}>
            Start recording observations to build a history for this scene.
          </Text>
          <Pressable style={styles.emptyButton} onPress={onNewObservation}>
            <Plus size={18} strokeWidth={2.2} color="#fff" />
            <Text style={styles.primaryButtonText}>New Observation</Text>
          </Pressable>
        </Card>
      ) : (
        <View style={styles.list}>
          {sortedObservations.map((observation) => (
            <Pressable
              key={observation.id}
              onPress={() => onSelectObservation(observation)}
            >
              <Card>
                <View style={styles.observationHeader}>
                  <View style={styles.observationHeaderText}>
                    <Text style={styles.observationTime}>
                      {formatObservationTime(observation.createdAt)}
                    </Text>
                    <Text style={styles.measurementCount}>
                      {observation.captures.reduce(
                        (count, capture) => count + capture.fieldValues.length,
                        0,
                      )}{" "}
                      measurement(s)
                    </Text>
                  </View>
                  <ChevronRight size={22} strokeWidth={1.8} color="#777" />
                </View>

                {sceneFields.length > 0 && (
                  <View style={styles.expectedSection}>
                    <Text style={styles.sectionLabel}>Expected values</Text>
                    {sceneFields.map((sceneField) => {
                      const field = getFieldById(sceneField.fieldId);
                      const values = observation.captures.flatMap((capture) =>
                        capture.fieldValues.filter(
                          (fieldValue) => fieldValue.sceneFieldId === sceneField.id,
                        ),
                      );
                      const label = sceneField.label?.trim() || field.name;

                      return (
                        <View key={sceneField.id} style={styles.fieldRow}>
                          <Text style={styles.fieldLabel}>{label}</Text>
                          <Text style={values.length > 0 ? styles.fieldValue : styles.fieldMissing}>
                            {values.length > 0
                              ? values
                                  .map((value) =>
                                    formatFieldValue(value, sceneField.unit ?? field.unit),
                                  )
                                  .join(", ")
                              : "—"}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {(() => {
                  const additionalValues = observation.captures.flatMap((capture) =>
                    capture.fieldValues
                      .filter((fieldValue) => !fieldValue.sceneFieldId)
                      .map((fieldValue) => ({ capture, fieldValue })),
                  );

                  if (additionalValues.length === 0) {
                    return null;
                  }

                  return (
                    <View style={styles.additionalSection}>
                      <Text style={styles.sectionLabel}>Additional values</Text>
                      <View style={styles.valueList}>
                        {additionalValues.map(({ capture, fieldValue }, index) => {
                          const field = getFieldById(fieldValue.fieldId);
                          const template = capture.templateId
                            ? templates.find((item) => item.id === capture.templateId)
                            : undefined;
                          const templateField = fieldValue.templateFieldId
                            ? template?.fields.find(
                                (candidate) => candidate.id === fieldValue.templateFieldId,
                              )
                            : undefined;
                          const label =
                            templateField?.label?.trim() || field.name;

                          return (
                            <View key={`${capture.id}-${index}`} style={styles.valuePill}>
                              <Text style={styles.valuePillText}>
                                {label}: {formatFieldValue(fieldValue, field.unit)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })()}
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#777",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D5D8DC",
    backgroundColor: "#fff",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "600",
    marginBottom: 7,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#666",
    marginBottom: 18,
  },
  emptyButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  list: {
    gap: 12,
  },
  observationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  observationHeaderText: {
    flex: 1,
  },
  observationTime: {
    fontSize: 16,
    fontWeight: "600",
  },
  measurementCount: {
    marginTop: 4,
    fontSize: 13,
    color: "#777",
  },
  expectedSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E6E7E9",
  },
  sectionLabel: {
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "#777",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 34,
  },
  fieldLabel: {
    flex: 1,
    paddingRight: 12,
    fontSize: 14,
    color: "#555",
  },
  fieldValue: {
    maxWidth: "58%",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
  },
  fieldMissing: {
    maxWidth: "58%",
    fontSize: 15,
    color: "#AAA",
    textAlign: "right",
  },
  additionalSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E6E7E9",
  },
  valueList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  valuePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#F0F1F3",
  },
  valuePillText: {
    fontSize: 13,
    color: "#444",
  },
});

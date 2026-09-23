import React from "react";
import { ArrowLeft, BarChart3, Check, ChevronDown } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "../components/Card";
import type { Observation } from "../domain/observation/Observation";
import type { SceneObservationField } from "../domain/scene/SceneObservationField";
import { extractDataSeries, type DataSeries } from "../domain/scene/extractDataSeries";
import { getFieldById } from "../domain/field/builtInFields";
import { formatDuration } from "../domain/field/duration";

interface SeriesSelectionScreenProps {
  observations: Observation[];
  sceneFields: SceneObservationField[];
  xSceneFieldId: string | null;
  ySceneFieldId: string | null;
  onXChange: (sceneFieldId: string | null) => void;
  onYChange: (sceneFieldId: string | null) => void;
  onBack: () => void;
}

function fieldLabel(sceneField: SceneObservationField): string {
  return sceneField.label?.trim() || getFieldById(sceneField.fieldId).name;
}

function fieldUnit(sceneField: SceneObservationField): string | null {
  return sceneField.unit ?? getFieldById(sceneField.fieldId).unit;
}

function formatSeriesValue(value: number, sceneField: SceneObservationField): string {
  const field = getFieldById(sceneField.fieldId);
  const formatted = field.valueType === "duration" ? formatDuration(value) : value.toString();
  const unit = fieldUnit(sceneField);
  return `${formatted}${unit ? ` ${unit}` : ""}`;
}

function FieldSelector({
  title,
  selectedId,
  sceneFields,
  onChange,
}: {
  title: string;
  selectedId: string | null;
  sceneFields: SceneObservationField[];
  onChange: (id: string | null) => void;
}) {
  const selected = sceneFields.find((field) => field.id === selectedId);
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <View style={styles.selectorSection}>
      <Text style={styles.selectorLabel}>{title}</Text>
      <Pressable style={styles.selector} onPress={() => setIsOpen((value) => !value)}>
        <View style={styles.selectorText}>
          <Text style={selected ? styles.selectedText : styles.placeholderText}>
            {selected ? fieldLabel(selected) : `Select ${title.toLowerCase()}`}
          </Text>
          {selected && fieldUnit(selected) ? (
            <Text style={styles.selectorUnit}>{fieldUnit(selected)}</Text>
          ) : null}
        </View>
        <ChevronDown size={19} strokeWidth={1.8} color="#666" />
      </Pressable>

      {isOpen && (
        <View style={styles.options}>
          {sceneFields.map((sceneField) => {
            const isSelected = sceneField.id === selectedId;
            return (
              <Pressable
                key={sceneField.id}
                style={[styles.option, isSelected && styles.selectedOption]}
                onPress={() => {
                  onChange(sceneField.id);
                  setIsOpen(false);
                }}
              >
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{fieldLabel(sceneField)}</Text>
                  <Text style={styles.optionMeta}>
                    {getFieldById(sceneField.fieldId).name}
                    {fieldUnit(sceneField) ? ` · ${fieldUnit(sceneField)}` : ""}
                  </Text>
                </View>
                {isSelected ? <Check size={18} strokeWidth={2} color="#2563EB" /> : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export function SeriesSelectionScreen({
  observations,
  sceneFields,
  xSceneFieldId,
  ySceneFieldId,
  onXChange,
  onYChange,
  onBack,
}: SeriesSelectionScreenProps) {
  const series: DataSeries | null =
    xSceneFieldId && ySceneFieldId
      ? extractDataSeries(observations, sceneFields, xSceneFieldId, ySceneFieldId)
      : null;

  const xField = sceneFields.find((field) => field.id === xSceneFieldId);
  const yField = sceneFields.find((field) => field.id === ySceneFieldId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={19} strokeWidth={1.9} color="#444" />
          <Text style={styles.backText}>History</Text>
        </Pressable>
        <View style={styles.titleRow}>
          <BarChart3 size={21} strokeWidth={1.9} color="#555" />
          <Text style={styles.title}>Data Series</Text>
        </View>
      </View>

      {sceneFields.length < 2 ? (
        <Card>
          <Text style={styles.emptyTitle}>Not enough expected fields</Text>
          <Text style={styles.emptyText}>
            Add at least two expected fields to this scene before creating a data series.
          </Text>
        </Card>
      ) : (
        <>
          <Card>
            <Text style={styles.cardTitle}>Choose axes</Text>
            <Text style={styles.cardText}>
              Select the expected fields that define the X and Y values for the series.
            </Text>

            <FieldSelector
              title="X axis"
              selectedId={xSceneFieldId}
              sceneFields={sceneFields}
              onChange={onXChange}
            />
            <FieldSelector
              title="Y axis"
              selectedId={ySceneFieldId}
              sceneFields={sceneFields}
              onChange={onYChange}
            />
          </Card>

          {series && xField && yField ? (
            <Card>
              <View style={styles.previewHeader}>
                <View>
                  <Text style={styles.cardTitle}>Series preview</Text>
                  <Text style={styles.previewSummary}>
                    {series.points.length} point{series.points.length === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>

              {series.points.length > 0 ? (
                <View style={styles.pointsList}>
                  {series.points.map((point) => (
                    <View key={point.observationId} style={styles.pointRow}>
                      <Text style={styles.pointValue}>
                        {formatSeriesValue(point.x, xField)}
                      </Text>
                      <Text style={styles.pointArrow}>→</Text>
                      <Text style={styles.pointValue}>
                        {formatSeriesValue(point.y, yField)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>
                  No observations currently contain one usable value for both selected fields.
                </Text>
              )}

              {series.skipped.length > 0 ? (
                <View style={styles.skippedSection}>
                  <Text style={styles.skippedTitle}>
                    {series.skipped.length} observation{series.skipped.length === 1 ? "" : "s"} excluded
                  </Text>
                  <Text style={styles.skippedText}>
                    Observations with missing, ambiguous, or incompatible values are excluded from the series.
                  </Text>
                </View>
              ) : null}
            </Card>
          ) : (
            <Card>
              <Text style={styles.emptyTitle}>Select both axes</Text>
              <Text style={styles.emptyText}>
                The series preview will appear here once you choose an X and Y field.
              </Text>
            </Card>
          )}
        </>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    marginBottom: 18,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingRight: 12,
    marginBottom: 12,
  },
  backText: {
    fontSize: 15,
    color: "#555",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  cardText: {
    marginTop: 5,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 21,
    color: "#666",
  },
  selectorSection: {
    marginTop: 14,
  },
  selectorLabel: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
  selector: {
    minHeight: 48,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#D5D8DC",
    borderRadius: 8,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    flex: 1,
    marginRight: 10,
  },
  selectedText: {
    fontSize: 15,
    color: "#222",
  },
  placeholderText: {
    fontSize: 15,
    color: "#888",
  },
  selectorUnit: {
    marginTop: 2,
    fontSize: 12,
    color: "#777",
  },
  options: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#D5D8DC",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  option: {
    minHeight: 52,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF1",
  },
  selectedOption: {
    backgroundColor: "#F4F7FF",
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    color: "#222",
  },
  optionMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#777",
  },
  previewHeader: {
    marginBottom: 14,
  },
  previewSummary: {
    marginTop: 3,
    fontSize: 13,
    color: "#777",
  },
  pointsList: {
    gap: 8,
  },
  pointRow: {
    minHeight: 40,
    paddingHorizontal: 11,
    borderRadius: 7,
    backgroundColor: "#F6F7F9",
    flexDirection: "row",
    alignItems: "center",
  },
  pointValue: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  pointArrow: {
    paddingHorizontal: 8,
    fontSize: 16,
    color: "#888",
  },
  skippedSection: {
    marginTop: 16,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#E4E6E9",
  },
  skippedTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
  skippedText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: "#777",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 5,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#666",
  },
});

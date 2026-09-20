import { ArrowLeft, Camera, Check, Plus } from "lucide-react-native";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Observation } from "../domain/observation/Observation";
import type { Template } from "../domain/template/Template";
import { FIELD_LIST, getFieldById, getUnitsForField } from "../domain/field/builtInFields";
import { formatDuration, parseDuration } from "../domain/field/duration";
import type { TextRegion } from "../services/ocr/TextRegion";

interface ObservationScreenProps {
  observation: Observation;
  templates: Template[];
  capturedImageUri: string | null;
  imageSize: {
    width: number;
    height: number;
  } | null;
  containerSize: {
    width: number;
    height: number;
  } | null;
  textRegions: TextRegion[];
  selectedRegionIndex: number | null;
  selectedFieldId: string;
  selectedUnit: string | null;
  editedValue: string;
  cameraStatus: string | null;
  manualEntry: boolean;
  editingMeasurement: boolean;
  onClose: () => void;
  onContainerLayout: (width: number, height: number) => void;
  onSelectRegion: (index: number, value: string) => void;
  onFieldChange: (fieldId: string) => void;
  onUnitChange: (unit: string | null) => void;
  onValueChange: (value: string) => void;
  onSaveValue: () => void;
  onManualEntry: () => void;
  onAddManualMeasurement: () => void;
  onCaptureWithCamera: () => void;
  onEditMeasurement: (
    captureId: string,
    fieldValueIndex: number,
    fieldId: string,
    value: number,
    unit: string | null | undefined,
  ) => void;
  onSaveEditedMeasurement: () => void;
  onDeleteMeasurement: (captureId: string, fieldValueIndex: number) => void;
}

function getContainTransform(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number,
) {
  const scale = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight,
  );

  const renderedWidth = imageWidth * scale;
  const renderedHeight = imageHeight * scale;

  return {
    scale,
    offsetX: (containerWidth - renderedWidth) / 2,
    offsetY: (containerHeight - renderedHeight) / 2,
  };
}

function parseNumericValue(text: string): number | null {
  const match = text.match(/[-+]?(?:\d+(?:\.\d*)?|\.\d+)/);

  if (!match) {
    return null;
  }

  const value = Number(match[0]);

  return Number.isFinite(value) ? value : null;
}

function isLikelyMeasurement(region: TextRegion): boolean {
  return parseNumericValue(region.text) !== null;
}

export function ObservationScreen({
  observation,
  templates,
  capturedImageUri,
  imageSize,
  containerSize,
  textRegions,
  selectedRegionIndex,
  selectedFieldId,
  selectedUnit,
  editedValue,
  cameraStatus,
  manualEntry,
  editingMeasurement,
  onClose,
  onContainerLayout,
  onSelectRegion,
  onFieldChange,
  onUnitChange,
  onValueChange,
  onSaveValue,
  onManualEntry,
  onAddManualMeasurement,
  onCaptureWithCamera,
  onEditMeasurement,
  onSaveEditedMeasurement,
  onDeleteMeasurement,
}: ObservationScreenProps) {
  const selectedRegion =
    selectedRegionIndex !== null ? textRegions[selectedRegionIndex] : null;
  const measurementCount = observation.captures.length;

  return (
    <View style={styles.activeObservation}>
      <View style={styles.observationHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to observations"
          hitSlop={8}
          style={styles.headerBackButton}
          onPress={onClose}
        >
          <ArrowLeft size={22} strokeWidth={2} color="#222" />
        </Pressable>

        <View style={styles.observationHeaderText}>
          <Text style={styles.activeTitle}>Observation</Text>
          <Text style={styles.timestamp}>
            {observation.createdAt.toLocaleTimeString()}
          </Text>
        </View>
      </View>

      {capturedImageUri && imageSize && (
        <View style={styles.imageSection}>
          <View style={styles.imageHeader}>
            <View>
              <Text style={styles.imageTitle}>Captured scene</Text>
              <Text style={styles.imageHint}>
                {selectedRegion
                  ? "Reading selected"
                  : textRegions.length > 0
                    ? "Tap a reading to select it"
                    : "Review the captured scene"}
              </Text>
            </View>

            <Camera size={20} strokeWidth={1.8} color="#666" />
          </View>

          <View
            style={styles.imageContainer}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              onContainerLayout(width, height);
            }}
          >
            <Image
              source={{ uri: capturedImageUri }}
              style={styles.image}
              resizeMode="contain"
            />

            {containerSize &&
              textRegions.map((region, index) => {
                const transform = getContainTransform(
                  imageSize.width,
                  imageSize.height,
                  containerSize.width,
                  containerSize.height,
                );

                return (
                  <Pressable
                    key={`${region.text}-${index}`}
                    onPress={() => {
                      onSelectRegion(index, region.text);
                    }}
                    style={[
                      styles.textRegion,
                      !isLikelyMeasurement(region) &&
                        styles.secondaryTextRegion,
                      selectedRegionIndex === index &&
                        styles.selectedTextRegion,
                      {
                        left:
                          transform.offsetX + region.bounds.x * transform.scale,
                        top:
                          transform.offsetY + region.bounds.y * transform.scale,
                        width: region.bounds.width * transform.scale,
                        height: region.bounds.height * transform.scale,
                      },
                    ]}
                  />
                );
              })}
          </View>
        </View>
      )}

      {(selectedRegion || manualEntry) && (
        <View style={styles.selectedValue}>
          <View style={styles.selectedValueHeader}>
            <Text style={styles.sectionEyebrow}>
              {manualEntry ? "MANUAL ENTRY" : "SELECTED READING"}
            </Text>

            <Check size={20} strokeWidth={2} color="#2563EB" />
          </View>

          {!manualEntry && selectedRegion && (
            <View style={styles.valueTransformation}>
              <View style={styles.valueStage}>
                <Text style={styles.valueStageLabel}>Recognized text</Text>

                <View style={styles.valueStageBox}>
                  <Text
                    style={styles.recognizedText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {selectedRegion.text}
                  </Text>
                </View>
              </View>

              <Text style={styles.valueArrow}>→</Text>

              <View style={styles.valueStage}>
                <Text style={styles.valueStageLabel}>Numeric value</Text>

                <View style={styles.extractedValueBox}>
                  <Text style={styles.extractedValueText}>
                    {getFieldById(selectedFieldId).valueType === "duration"
                      ? (() => {
                          const duration = parseDuration(selectedRegion.text);
                          return duration !== null
                            ? formatDuration(duration)
                            : "—";
                        })()
                      : (parseNumericValue(selectedRegion.text)?.toString() ??
                        "—")}
                    {selectedUnit ? ` ${selectedUnit}` : ""}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <Text style={styles.fieldLabel}>Field</Text>
          <View style={styles.fieldSelector}>
            {FIELD_LIST.map((field) => (
              <Pressable
                key={field.id}
                accessibilityRole="button"
                accessibilityState={{ selected: field.id === selectedFieldId }}
                style={[
                  styles.fieldOption,
                  field.id === selectedFieldId && styles.fieldOptionSelected,
                ]}
                onPress={() => onFieldChange(field.id)}
              >
                <Text
                  style={[
                    styles.fieldOptionText,
                    field.id === selectedFieldId &&
                      styles.fieldOptionTextSelected,
                  ]}
                >
                  {field.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {getFieldById(selectedFieldId).valueType === "number" &&
            getFieldById(selectedFieldId).unit &&
            getUnitsForField(selectedFieldId).length > 0 && (
              <View style={styles.unitSection}>
                <Text style={styles.fieldLabel}>Unit</Text>
                <View style={styles.fieldSelector}>
                  {getUnitsForField(selectedFieldId).map((unit) => (
                    <Pressable
                      key={unit}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedUnit === unit }}
                      style={[
                        styles.fieldOption,
                        selectedUnit === unit && styles.fieldOptionSelected,
                      ]}
                      onPress={() => onUnitChange(unit)}
                    >
                      <Text
                        style={[
                          styles.fieldOptionText,
                          selectedUnit === unit && styles.fieldOptionTextSelected,
                        ]}
                      >
                        {unit}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

          <Text style={styles.editValueLabel}>
            {editingMeasurement
              ? "Edit measurement"
              : manualEntry
                ? "Enter value"
                : "Edit value"}
            {selectedUnit ? ` (${selectedUnit})` : ""}
          </Text>

          <TextInput
            value={editedValue}
            onChangeText={onValueChange}
            keyboardType={
              getFieldById(selectedFieldId).valueType === "duration"
                ? "default"
                : "decimal-pad"
            }
            style={styles.valueInput}
            selectTextOnFocus
            placeholder={
              getFieldById(selectedFieldId).valueType === "duration"
                ? "e.g. 1:30 or 1.30"
                : "Enter value"
            }
            placeholderTextColor="#999"
          />

          <Pressable
            style={styles.saveButton}
            onPress={editingMeasurement ? onSaveEditedMeasurement : onSaveValue}
          >
            <Check size={18} strokeWidth={2.2} color="#fff" />
            <Text style={styles.saveButtonText}>
              {editingMeasurement ? "Save changes" : "Save measurement"}
            </Text>
          </Pressable>
        </View>
      )}

      {cameraStatus && (
        <View style={styles.statusMessage}>
          <Text style={styles.cameraStatus}>{cameraStatus}</Text>
        </View>
      )}

      {cameraStatus &&
        (cameraStatus.startsWith("No text") ||
          cameraStatus.startsWith("Text recognition failed")) && (
          <Pressable style={styles.manualEntryButton} onPress={onManualEntry}>
            <Text style={styles.manualEntryButtonText}>
              Enter value manually
            </Text>
          </Pressable>
        )}

      <View style={styles.measurementsSection}>
        <View style={styles.measurementsHeader}>
          <View>
            <Text style={styles.measurementsTitle}>Measurements</Text>

            <Text style={styles.measurementsSubtitle}>
              {measurementCount === 0
                ? "No measurements recorded yet"
                : `${measurementCount} recorded`}
            </Text>
          </View>

          <View style={styles.measurementCount}>
            <Text style={styles.measurementCountText}>{measurementCount}</Text>
          </View>
        </View>

        {measurementCount > 0 && (
          <View style={styles.measurementList}>
            {observation.captures.map((capture, captureIndex) => {
              const template = capture.templateId
                ? templates.find((item) => item.id === capture.templateId)
                : undefined;

              return (
                <View key={capture.id} style={styles.measurementGroup}>
                  <View style={styles.measurementGroupHeader}>
                    <Text style={styles.measurementGroupTitle}>
                      Measurement {captureIndex + 1}
                    </Text>
                    {template && (
                      <Text style={styles.measurementTemplateName}>
                        {template.name}
                      </Text>
                    )}
                  </View>

                  {capture.fieldValues.map((fieldValue, fieldValueIndex) => {
                    const field = getFieldById(fieldValue.fieldId);

                    return (
                      <View
                        key={`${capture.id}-${fieldValueIndex}`}
                        style={styles.measurementRow}
                      >
                        <Pressable
                          style={styles.measurementEditArea}
                          onPress={() =>
                            onEditMeasurement(
                              capture.id,
                              fieldValueIndex,
                              fieldValue.fieldId,
                              fieldValue.value,
                              fieldValue.unit ?? field.unit,
                            )
                          }
                        >
                          <Text style={styles.measurementField}>
                            {field.name}
                            {fieldValue.unit ?? field.unit
                              ? ` (${fieldValue.unit ?? field.unit})`
                              : ""}
                          </Text>

                          <Text style={styles.measurementValue}>
                            {fieldValue.valueType === "duration"
                              ? formatDuration(fieldValue.value)
                              : fieldValue.value}
                            {fieldValue.unit ?? field.unit
                              ? ` ${fieldValue.unit ?? field.unit}`
                              : ""}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={styles.deleteMeasurementButton}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${field.name} measurement`}
                          hitSlop={8}
                          onPress={() =>
                            onDeleteMeasurement(capture.id, fieldValueIndex)
                          }
                        >
                          <Text style={styles.deleteMeasurementText}>×</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}

        {!manualEntry && (
          <Pressable
            style={styles.addMeasurementButton}
            onPress={onAddManualMeasurement}
          >
            <Plus size={18} strokeWidth={2.2} color="#2563EB" />

            <Text style={styles.addMeasurementButtonText}>Add measurement</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.captureMeasurementButton}
          onPress={onCaptureWithCamera}
        >
          <Camera size={18} strokeWidth={2.2} color="#666" />

          <Text style={styles.captureMeasurementButtonText}>
            Capture with camera
          </Text>
        </Pressable>
      </View>

      <Pressable style={styles.primaryActionButton} onPress={onClose}>
        <Text style={styles.primaryActionButtonText}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  activeObservation: {
    marginTop: 8,
  },

  observationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  headerBackButton: {
    width: 40,
    height: 40,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#ECEEF1",
  },

  observationHeaderText: {
    flex: 1,
  },

  activeTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  timestamp: {
    marginTop: 3,
    fontSize: 14,
    color: "#666",
  },

  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },

  imageSection: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E3E5E8",
  },

  imageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  imageTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  imageHint: {
    marginTop: 2,
    fontSize: 13,
    color: "#777",
  },

  imageContainer: {
    width: "100%",
    height: 270,
    position: "relative",
    overflow: "hidden",
    borderRadius: 10,
    backgroundColor: "#F1F2F4",
  },

  textRegion: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#00aaff",
  },

  secondaryTextRegion: {
    borderColor: "rgba(0, 170, 255, 0.25)",
    borderWidth: 1,
  },

  selectedTextRegion: {
    borderColor: "#ff6600",
    backgroundColor: "rgba(255, 102, 0, 0.15)",
  },

  selectedValue: {
    marginTop: 18,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D9E2FF",
  },

  selectedValueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#2563EB",
  },

  valueTransformation: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 16,
  },

  valueStage: {
    flex: 1,
    minWidth: 0,
  },

  valueStageLabel: {
    marginBottom: 7,
    fontSize: 13,
    color: "#666",
  },

  valueStageBox: {
    height: 54,
    paddingHorizontal: 12,
    alignItems: "flex-start",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#F7F7F8",
  },

  recognizedText: {
    width: "100%",
    fontSize: 19,
    color: "#222",
  },

  valueArrow: {
    paddingBottom: 14,
    fontSize: 26,
    color: "#777",
  },

  extractedValueBox: {
    height: 54,
    paddingHorizontal: 12,
    alignItems: "flex-start",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#EEF2FF",
  },

  extractedValueText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },

  unitSection: {
    marginTop: 4,
  },

  fieldLabel: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  fieldSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  fieldOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D4D4D4",
    backgroundColor: "#fff",
  },
  fieldOptionSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  fieldOptionText: {
    fontSize: 14,
    color: "#555",
  },
  fieldOptionTextSelected: {
    color: "#2563EB",
    fontWeight: "600",
  },
  editValueLabel: {
    marginTop: 16,
    marginBottom: 7,
    fontSize: 13,
    color: "#666",
  },

  saveButton: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 9,
    backgroundColor: "#2563EB",
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  valueInput: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#C9CDD3",
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 20,
    backgroundColor: "#FAFAFB",
  },

  statusMessage: {
    marginTop: 14,
    paddingHorizontal: 2,
  },

  measurementsSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E4E7",
  },

  measurementsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  measurementsTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  measurementsSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#777",
  },

  measurementCount: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
  },

  measurementCountText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
  },

  measurementGroup: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F7F7F8",
  },
  measurementGroupHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  measurementGroupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  measurementTemplateName: {
    fontSize: 13,
    color: "#666",
  },
  measurementList: {
    marginTop: 12,
    gap: 8,
  },

  measurementRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E3E5E8",
  },

  measurementIndex: {
    width: 28,
    fontSize: 13,
    color: "#888",
  },

  measurementEditArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  measurementField: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },

  measurementValue: {
    fontSize: 19,
    fontWeight: "600",
  },

  addMeasurementButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#B9C9F7",
    backgroundColor: "#F8FAFF",
  },

  addMeasurementButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563EB",
  },

  captureMeasurementButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#D4D6DA",
    backgroundColor: "#fff",
  },

  captureMeasurementButtonText: {
    fontSize: 15,
    fontWeight: "500",
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

  cameraStatus: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },

  manualEntryButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#999",
  },

  manualEntryButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  deleteMeasurementButton: {
    marginLeft: 16,
  },
  deleteMeasurementText: {
    fontSize: 20,
    color: "#999",
    fontWeight: "500",
  },
});

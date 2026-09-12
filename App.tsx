import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Observation } from "./src/domain/observation/Observation";
import { createObservation } from "./src/domain/observation/createObservation";
import type { TextRegion } from "./src/services/ocr/TextRegion";
import { recognizeText } from "./src/services/ocr/recognizeText";
import { createCapture } from "./src/domain/capture/createCapture";
import { BUILT_IN_FIELD_IDS } from "./src/domain/field/builtInFields";
import { Card } from "./src/components/Card";
import { ChevronRight, FileText, Plus } from "lucide-react-native";

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

export default function App() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [activeObservation, setActiveObservation] =
    useState<Observation | null>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [textRegions, setTextRegions] = useState<TextRegion[]>([]);
  const [selectedRegionIndex, setSelectedRegionIndex] = useState<number | null>(
    null,
  );
  const [editedValue, setEditedValue] = useState("");

  function handleSaveValue() {
    if (!activeObservation) {
      return;
    }

    const value = Number(editedValue);

    if (!Number.isFinite(value)) {
      return;
    }

    const capture = createCapture([
      {
        fieldId: BUILT_IN_FIELD_IDS.value,
        value,
      },
    ]);

    const updatedObservation: Observation = {
      ...activeObservation,
      captures: [...activeObservation.captures, capture],
    };

    setActiveObservation(updatedObservation);

    setObservations((current) =>
      current.map((observation) =>
        observation.id === updatedObservation.id
          ? updatedObservation
          : observation,
      ),
    );

    setSelectedRegionIndex(null);
    setEditedValue("");
  }

  async function captureImage() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    setCapturedImageUri(asset.uri);
    setImageSize({
      width: asset.width,
      height: asset.height,
    });

    const regions = await recognizeText(asset.uri);
    setTextRegions(regions);
  }

  async function handleNewObservation() {
    const observation = createObservation();

    setImageSize(null);
    setContainerSize(null);
    setTextRegions([]);
    setSelectedRegionIndex(null);
    setEditedValue("");

    setObservations((current) => [...current, observation]);
    setActiveObservation(observation);
    setCapturedImageUri(null);

    await captureImage();
  }

  async function handleAddMeasurement() {
    if (!activeObservation) {
      return;
    }

    setImageSize(null);
    setContainerSize(null);
    setTextRegions([]);
    setSelectedRegionIndex(null);
    setEditedValue("");
    setCapturedImageUri(null);

    await captureImage();
  }

  function handleFinishObservation() {
    setActiveObservation(null);
    setCapturedImageUri(null);
    setImageSize(null);
    setContainerSize(null);
    setTextRegions([]);
    setSelectedRegionIndex(null);
    setEditedValue("");
  }

  function handleCloseObservation() {
    setActiveObservation(null);
    setCapturedImageUri(null);
    setImageSize(null);
    setContainerSize(null);
    setTextRegions([]);
    setSelectedRegionIndex(null);
    setEditedValue("");
  }

  async function handleCapture() {
    const observation = createObservation();

    setImageSize(null);
    setContainerSize(null);
    setTextRegions([]);
    setSelectedRegionIndex(null);

    setObservations((current) => [...current, observation]);
    setActiveObservation(observation);
    setCapturedImageUri(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    setCapturedImageUri(asset.uri);
    setImageSize({
      width: asset.width,
      height: asset.height,
    });

    const regions = await recognizeText(asset.uri);
    setTextRegions(regions);
  }

  const selectedRegion =
    selectedRegionIndex !== null ? textRegions[selectedRegionIndex] : null;

  const selectedNumericValue = selectedRegion
    ? parseNumericValue(selectedRegion.text)
    : null;

  const measurementValues = (observation: Observation) =>
    observation.captures.flatMap((capture) =>
      capture.fieldValues.map((fieldValue) => fieldValue.value),
    );

  const [reviewObservation, setReviewObservation] =
    useState<Observation | null>(null);

  return (
    <KeyboardAvoidingView style={styles.container} behavior="height">
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>SceneLog</Text>

        <Text style={styles.subtitle}>
          Capture what you observe. Keep the details that matter.
        </Text>

        {activeObservation && (
          <View style={styles.activeObservation}>
            <Text style={styles.sectionTitle}>Observation</Text>

            <Text style={styles.timestamp}>
              {activeObservation.createdAt.toLocaleTimeString()}
            </Text>

            {capturedImageUri && imageSize && (
              <View
                style={styles.imageContainer}
                onLayout={(event) => {
                  const { width, height } = event.nativeEvent.layout;

                  setContainerSize({ width, height });
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
                          setSelectedRegionIndex(index);
                          setEditedValue(
                            parseNumericValue(region.text)?.toString() ?? "",
                          );
                        }}
                        style={[
                          styles.textRegion,
                          selectedRegionIndex === index &&
                            styles.selectedTextRegion,
                          {
                            left:
                              transform.offsetX +
                              region.bounds.x * transform.scale,
                            top:
                              transform.offsetY +
                              region.bounds.y * transform.scale,
                            width: region.bounds.width * transform.scale,
                            height: region.bounds.height * transform.scale,
                          },
                        ]}
                      />
                    );
                  })}
              </View>
            )}

            {selectedRegion && (
              <View style={styles.selectedValue}>
                <Text style={styles.selectedValueLabel}>Selected value</Text>

                <Text style={styles.selectedValueText}>
                  {selectedRegion.text}
                </Text>

                <TextInput
                  value={editedValue}
                  onChangeText={setEditedValue}
                  keyboardType="decimal-pad"
                  style={styles.valueInput}
                  selectTextOnFocus
                />

                <Pressable style={styles.saveButton} onPress={handleSaveValue}>
                  <Text style={styles.saveButtonText}>Save Value</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.captureStatus}>
              {activeObservation.captures.length === 0
                ? "No measurements recorded"
                : `${activeObservation.captures.length} measurement(s)`}
            </Text>

            <Pressable style={styles.button} onPress={handleAddMeasurement}>
              <Text style={styles.buttonText}>Add Measurement</Text>
            </Pressable>

            {activeObservation.captures.length > 0 && (
              <View style={styles.measurements}>
                <Text style={styles.measurementsTitle}>Measurements</Text>

                {activeObservation.captures.map((capture) =>
                  capture.fieldValues.map((fieldValue, index) => (
                    <View
                      key={`${capture.id}-${index}`}
                      style={styles.measurementWrapper}
                    >
                      <Card>
                        <Text style={styles.measurementValue}>
                          {fieldValue.value}
                        </Text>
                      </Card>
                    </View>
                  )),
                )}
              </View>
            )}

            <Pressable
              style={styles.doneButton}
              onPress={handleCloseObservation}
            >
              <Text style={styles.doneButtonText}>
                {capturedImageUri ? "Done" : "Back"}
              </Text>
            </Pressable>
          </View>
        )}

        {reviewObservation && (
          <View style={styles.reviewObservation}>
            <Text style={styles.reviewTitle}>Observation</Text>

            <Text style={styles.reviewTimestamp}>
              {reviewObservation.createdAt.toLocaleTimeString()}
            </Text>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Measurements</Text>

              {reviewObservation.captures.length > 0 ? (
                <View style={styles.reviewValues}>
                  {reviewObservation.captures.flatMap((capture) =>
                    capture.fieldValues.map((fieldValue, index) => (
                      <View
                        key={`${capture.id}-${index}`}
                        style={styles.valuePill}
                      >
                        <Text style={styles.valuePillText}>
                          {fieldValue.value}
                        </Text>
                      </View>
                    )),
                  )}
                </View>
              ) : (
                <Text style={styles.reviewEmpty}>
                  No measurements recorded.
                </Text>
              )}
            </View>

            <Pressable
              style={styles.doneButton}
              onPress={() => setReviewObservation(null)}
            >
              <Text style={styles.doneButtonText}>Back</Text>
            </Pressable>
          </View>
        )}

        {!activeObservation && !reviewObservation && (
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

                <Pressable
                  style={styles.primaryButton}
                  onPress={handleNewObservation}
                >
                  <Plus size={20} strokeWidth={2.2} color="#fff" />
                  <Text style={styles.primaryButtonText}>New Observation</Text>
                </Pressable>
              </Card>
            ) : (
              <>
                <View style={styles.observationsHeader}>
                  <Text style={styles.sectionTitle}>Observations</Text>

                  <Pressable
                    style={styles.primaryButton}
                    onPress={handleNewObservation}
                  >
                    <Plus size={18} strokeWidth={2.2} color="#fff" />
                    <Text style={styles.primaryButtonText}>
                      New Observation
                    </Text>
                  </Pressable>
                </View>

                {observations.map((observation) => (
                  <Pressable
                    key={observation.id}
                    onPress={() => setReviewObservation(observation)}
                  >
                    <Card>
                      <View style={styles.observationContent}>
                        <View style={styles.observationDetails}>
                          <Text style={styles.observationTime}>
                            {observation.createdAt.toLocaleTimeString()}
                          </Text>

                          <Text style={styles.observationCount}>
                            {observation.captures.length} measurement(s)
                          </Text>
                        </View>

                        <ChevronRight
                          size={22}
                          strokeWidth={1.8}
                          color="#777"
                        />
                      </View>

                      {measurementValues(observation).length > 0 && (
                        <View style={styles.measurementValues}>
                          {measurementValues(observation).map(
                            (value, index) => (
                              <View
                                key={`${observation.id}-${index}`}
                                style={styles.valuePill}
                              >
                                <Text style={styles.valuePillText}>
                                  {value}
                                </Text>
                              </View>
                            ),
                          )}
                        </View>
                      )}
                    </Card>
                  </Pressable>
                ))}
              </>
            )}
          </View>
        )}

        <StatusBar style="auto" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7F9",
    paddingHorizontal: 20,
    paddingBottom: 48,
    paddingTop: 56,
  },
  content: {
    flexGrow: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 28,
  },
  subtitle: {
    marginTop: -16,
    marginBottom: 32,
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
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
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#222",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  activeObservation: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 14,
    color: "#666",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  captureStatus: {
    marginTop: 16,
    fontSize: 16,
  },
  observations: {
    marginTop: 8,
  },
  observationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  observationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  observationTime: {
    fontSize: 16,
  },
  observationCount: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
  },
  imageContainer: {
    width: "100%",
    height: 300,
    marginTop: 24,
    position: "relative",
    overflow: "hidden",
  },
  textRegion: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#00aaff",
  },
  selectedTextRegion: {
    borderColor: "#ff6600",
    backgroundColor: "rgba(255, 102, 0, 0.15)",
  },
  selectedValue: {
    marginTop: 24,
  },

  selectedValueLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },

  selectedValueText: {
    fontSize: 24,
    fontWeight: "600",
  },

  parsedValue: {
    marginTop: 4,
    fontSize: 14,
    color: "#666",
  },
  saveButton: {
    alignSelf: "flex-start",
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#222",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  valueInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 20,
  },
  measurements: {
    marginTop: 24,
  },
  measurementWrapper: {
    marginBottom: 8,
  },
  measurementsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  measurementValue: {
    fontSize: 20,
  },
  doneButton: {
    alignSelf: "flex-start",
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#222",
  },

  doneButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  observationDetails: {
    flex: 1,
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
  reviewValues: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
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

  reviewSection: {
    marginTop: 32,
  },

  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },

  reviewEmpty: {
    fontSize: 15,
    color: "#666",
  },
});

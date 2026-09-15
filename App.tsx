import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Alert,
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
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  FileText,
  Plus,
  Trash2,
} from "lucide-react-native";
import {
  loadObservations,
  saveObservations,
} from "./src/services/storage/observationStorage";
import {
  copyImageToStorage,
  deleteImageFromStorage,
} from "./src/services/storage/imageStorage";

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
    setManualEntry(false);
  }

  async function captureImage(observation?: Observation) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setCameraStatus(
        "Camera permission is required to capture an observation.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (result.canceled) {
      setCameraStatus("Capture cancelled.");
      return;
    }

    const asset = result.assets[0];

    setCapturedImageUri(asset.uri);
    setImageSize({
      width: asset.width,
      height: asset.height,
    });

    const storedImageUri = await copyImageToStorage(asset.uri);

    const currentObservation = observation ?? activeObservation;

    if (currentObservation) {
      const updatedObservation: Observation = {
        ...currentObservation,
        imageUri: storedImageUri,
      };

      setActiveObservation(updatedObservation);

      setObservations((current) =>
        current.map((observation) =>
          observation.id === updatedObservation.id
            ? updatedObservation
            : observation,
        ),
      );
    }

    try {
      const regions = await recognizeText(asset.uri);
      setTextRegions(regions);

      if (regions.length === 0) {
        setCameraStatus(
          "No text was detected. You can enter the measurement manually.",
        );
      }
    } catch {
      setTextRegions([]);
      setCameraStatus(
        "Text recognition failed. You can enter the measurement manually.",
      );
    }
  }

  function handleNewObservation() {
    setCameraStatus(null);
    setManualEntry(true);
    const observation = createObservation();

    setImageSize(null);
    setContainerSize(null);
    setTextRegions([]);
    setSelectedRegionIndex(null);
    setEditedValue("");

    setObservations((current) => [...current, observation]);
    setActiveObservation(observation);
    setCapturedImageUri(null);
  }

  async function handleAddMeasurement() {
    if (!activeObservation) {
      return;
    }
    setCameraStatus(null);
    setManualEntry(false);

    setImageSize(null);
    setContainerSize(null);
    setTextRegions([]);
    setSelectedRegionIndex(null);
    setEditedValue("");
    setCapturedImageUri(null);

    await captureImage(activeObservation);
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

  function handleDeleteObservation() {
    if (!reviewObservation) {
      return;
    }

    Alert.alert(
      "Delete observation?",
      "This observation and its captured image will be permanently deleted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (reviewObservation.imageUri) {
              deleteImageFromStorage(reviewObservation.imageUri);
            }

            setObservations((current) =>
              current.filter(
                (observation) => observation.id !== reviewObservation.id,
              ),
            );

            setReviewObservation(null);
          },
        },
      ],
    );
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

  const measurementValues = (observation: Observation) =>
    observation.captures.flatMap((capture) =>
      capture.fieldValues.map((fieldValue) => fieldValue.value),
    );

  const [reviewObservation, setReviewObservation] =
    useState<Observation | null>(null);
  const [observationsLoaded, setObservationsLoaded] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState(false);

  useEffect(() => {
    async function loadSavedObservations() {
      const savedObservations = await loadObservations();
      setObservations(savedObservations);
      setObservationsLoaded(true);
    }

    loadSavedObservations();
  }, []);

  useEffect(() => {
    if (!observationsLoaded) {
      return;
    }

    saveObservations(observations);
  }, [observations, observationsLoaded]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior="height">
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {!activeObservation && !reviewObservation && (
          <>
            <Text style={styles.title}>SceneLog</Text>

            <Text style={styles.subtitle}>
              Capture what you observe. Keep the details that matter.
            </Text>
          </>
        )}

        {activeObservation && (
          <View style={styles.activeObservation}>
            <View style={styles.observationHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to observations"
                hitSlop={8}
                style={styles.headerBackButton}
                onPress={handleCloseObservation}
              >
                <ArrowLeft size={22} strokeWidth={2} color="#222" />
              </Pressable>

              <View style={styles.observationHeaderText}>
                <Text style={styles.activeTitle}>Observation</Text>
                <Text style={styles.timestamp}>
                  {activeObservation.createdAt.toLocaleTimeString()}
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
                            !isLikelyMeasurement(region) &&
                              styles.secondaryTextRegion,
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
                      <Text style={styles.valueStageLabel}>
                        Recognized text
                      </Text>
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
                          {parseNumericValue(selectedRegion.text)?.toString() ??
                            "—"}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                <Text style={styles.editValueLabel}>
                  {manualEntry ? "Enter value" : "Edit value"}
                </Text>

                <TextInput
                  value={editedValue}
                  onChangeText={setEditedValue}
                  keyboardType="decimal-pad"
                  style={styles.valueInput}
                  selectTextOnFocus
                  placeholder="Enter value"
                  placeholderTextColor="#999"
                />

                <Pressable style={styles.saveButton} onPress={handleSaveValue}>
                  <Check size={18} strokeWidth={2.2} color="#fff" />
                  <Text style={styles.saveButtonText}>Save measurement</Text>
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
                <Pressable
                  style={styles.manualEntryButton}
                  onPress={() => {
                    setManualEntry(true);
                    setEditedValue("");
                  }}
                >
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
                    {activeObservation.captures.length === 0
                      ? "No measurements recorded yet"
                      : `${activeObservation.captures.length} recorded`}
                  </Text>
                </View>

                <View style={styles.measurementCount}>
                  <Text style={styles.measurementCountText}>
                    {activeObservation.captures.length}
                  </Text>
                </View>
              </View>

              {activeObservation.captures.length > 0 && (
                <View style={styles.measurementList}>
                  {activeObservation.captures.map((capture) =>
                    capture.fieldValues.map((fieldValue, index) => (
                      <View
                        key={`${capture.id}-${index}`}
                        style={styles.measurementRow}
                      >
                        <Text style={styles.measurementIndex}>{index + 1}</Text>
                        <Text style={styles.measurementValue}>
                          {fieldValue.value}
                        </Text>
                      </View>
                    )),
                  )}
                </View>
              )}

              {!manualEntry && (
                <Pressable
                  style={styles.addMeasurementButton}
                  onPress={() => {
                    setManualEntry(true);
                    setSelectedRegionIndex(null);
                    setEditedValue("");
                    setCameraStatus(null);
                  }}
                >
                  <Plus size={18} strokeWidth={2.2} color="#2563EB" />
                  <Text style={styles.addMeasurementButtonText}>
                    Add measurement
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={styles.captureMeasurementButton}
                onPress={handleAddMeasurement}
              >
                <Camera size={18} strokeWidth={2.2} color="#666" />
                <Text style={styles.captureMeasurementButtonText}>
                  Capture with camera
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.doneButton}
              onPress={handleCloseObservation}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        )}

        {reviewObservation && (
          <View style={styles.reviewObservation}>
            <Text style={styles.reviewTitle}>Observation</Text>

            <Text style={styles.reviewTimestamp}>
              {reviewObservation.createdAt.toLocaleTimeString()}
            </Text>

            {reviewObservation.imageUri && (
              <Image
                source={{ uri: reviewObservation.imageUri }}
                style={styles.reviewImage}
                resizeMode="contain"
              />
            )}

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

            <Pressable
              style={styles.deleteButton}
              onPress={handleDeleteObservation}
            >
              <Text style={styles.deleteButtonText}>Delete Observation</Text>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
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
  doneButton: {
    alignSelf: "stretch",
    marginTop: 20,
    paddingVertical: 13,
    alignItems: "center",
    borderRadius: 9,
    backgroundColor: "#222",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
  reviewImage: {
    width: "100%",
    height: 300,
    marginTop: 24,
    borderRadius: 8,
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

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
  View,
} from "react-native";
import { ObservationScreen } from "./src/screens/ObservationScreen";
import type { Observation } from "./src/domain/observation/Observation";
import { createObservation } from "./src/domain/observation/createObservation";
import type { TextRegion } from "./src/services/ocr/TextRegion";
import { recognizeText } from "./src/services/ocr/recognizeText";
import { createCapture } from "./src/domain/capture/createCapture";
import { BUILT_IN_FIELD_IDS } from "./src/domain/field/builtInFields";
import { Card } from "./src/components/Card";
import { ChevronRight, FileText, Plus } from "lucide-react-native";
import {
  loadObservations,
  saveObservations,
} from "./src/services/storage/observationStorage";
import {
  copyImageToStorage,
  deleteImageFromStorage,
} from "./src/services/storage/imageStorage";

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
          <ObservationScreen
            observation={activeObservation}
            capturedImageUri={capturedImageUri}
            imageSize={imageSize}
            containerSize={containerSize}
            textRegions={textRegions}
            selectedRegionIndex={selectedRegionIndex}
            editedValue={editedValue}
            cameraStatus={cameraStatus}
            manualEntry={manualEntry}
            onClose={handleCloseObservation}
            onContainerLayout={(width, height) => {
              setContainerSize({ width, height });
            }}
            onSelectRegion={(index, value) => {
              setSelectedRegionIndex(index);
              setEditedValue(value);
            }}
            onValueChange={setEditedValue}
            onSaveValue={handleSaveValue}
            onManualEntry={() => {
              setManualEntry(true);
              setEditedValue("");
            }}
            onAddManualMeasurement={() => {
              setManualEntry(true);
              setSelectedRegionIndex(null);
              setEditedValue("");
              setCameraStatus(null);
            }}
            onCaptureWithCamera={handleAddMeasurement}
          />
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
              style={styles.primaryActionButton}
              onPress={() => setReviewObservation(null)}
            >
              <Text style={styles.primaryActionButtonText}>Back</Text>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
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
  editValueLabel: {
    marginTop: 16,
    marginBottom: 7,
    fontSize: 13,
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

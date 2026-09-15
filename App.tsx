import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { ObservationScreen } from "./src/screens/ObservationScreen";
import type { Observation } from "./src/domain/observation/Observation";
import { createObservation } from "./src/domain/observation/createObservation";
import type { TextRegion } from "./src/services/ocr/TextRegion";
import { recognizeText } from "./src/services/ocr/recognizeText";
import { createCapture } from "./src/domain/capture/createCapture";
import { BUILT_IN_FIELD_IDS } from "./src/domain/field/builtInFields";
import {
  loadObservations,
  saveObservations,
} from "./src/services/storage/observationStorage";
import {
  copyImageToStorage,
  deleteImageFromStorage,
} from "./src/services/storage/imageStorage";
import { ObservationReviewScreen } from "./src/screens/ObservationReviewScreen";
import { ObservationListScreen } from "./src/screens/ObservationListScreen";

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
  const [editingMeasurement, setEditingMeasurement] = useState<{
    captureId: string;
    fieldValueIndex: number;
  } | null>(null);

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

  function handleStartEditingMeasurement(
    captureId: string,
    fieldValueIndex: number,
    value: number,
  ) {
    setEditingMeasurement({ captureId, fieldValueIndex });
    setSelectedRegionIndex(null);
    setManualEntry(true);
    setCameraStatus(null);
    setEditedValue(value.toString());
  }

  function handleSaveEditedMeasurement() {
    if (!activeObservation || !editingMeasurement) {
      return;
    }

    const value = Number(editedValue);

    if (!Number.isFinite(value)) {
      return;
    }

    const updatedObservation: Observation = {
      ...activeObservation,
      captures: activeObservation.captures.map((capture) =>
        capture.id === editingMeasurement.captureId
          ? {
              ...capture,
              fieldValues: capture.fieldValues.map((fieldValue, index) =>
                index === editingMeasurement.fieldValueIndex
                  ? { ...fieldValue, value }
                  : fieldValue,
              ),
            }
          : capture,
      ),
    };

    setActiveObservation(updatedObservation);

    setObservations((current) =>
      current.map((observation) =>
        observation.id === updatedObservation.id
          ? updatedObservation
          : observation,
      ),
    );

    setEditingMeasurement(null);
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
    setEditingMeasurement(null);
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
    setEditingMeasurement(null);

    await captureImage(activeObservation);
  }

  function handleDeleteMeasurement(captureId: string, fieldValueIndex: number) {
    if (!activeObservation) {
      return;
    }

    Alert.alert(
      "Delete measurement?",
      "This measurement will be permanently deleted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedObservation: Observation = {
              ...activeObservation,
              captures: activeObservation.captures
                .map((capture) =>
                  capture.id === captureId
                    ? {
                        ...capture,
                        fieldValues: capture.fieldValues.filter(
                          (_, index) => index !== fieldValueIndex,
                        ),
                      }
                    : capture,
                )
                .filter((capture) => capture.fieldValues.length > 0),
            };

            setActiveObservation(updatedObservation);

            setObservations((current) =>
              current.map((observation) =>
                observation.id === updatedObservation.id
                  ? updatedObservation
                  : observation,
              ),
            );

            setEditingMeasurement(null);
            setEditedValue("");
            setManualEntry(false);
          },
        },
      ],
    );
  }

  function handleCloseObservation() {
    setActiveObservation(null);
    setCapturedImageUri(null);
    setImageSize(null);
    setContainerSize(null);
    setTextRegions([]);
    setSelectedRegionIndex(null);
    setEditedValue("");
    setEditingMeasurement(null);
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
            editingMeasurement={editingMeasurement !== null}
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
            onEditMeasurement={handleStartEditingMeasurement}
            onSaveEditedMeasurement={handleSaveEditedMeasurement}
            onDeleteMeasurement={handleDeleteMeasurement}
          />
        )}

        {reviewObservation && (
          <ObservationReviewScreen
            observation={reviewObservation}
            onBack={() => setReviewObservation(null)}
            onDelete={handleDeleteObservation}
          />
        )}

        {!activeObservation && !reviewObservation && (
          <ObservationListScreen
            observations={observations}
            onNewObservation={handleNewObservation}
            onSelectObservation={setReviewObservation}
          />
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
});

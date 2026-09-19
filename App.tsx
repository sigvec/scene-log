import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
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
import {
  BUILT_IN_FIELDS,
  FIELD_LIST,
  getFieldById,
} from "./src/domain/field/builtInFields";
import { formatDuration, parseDuration } from "./src/domain/field/duration";
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
import type { Template } from "./src/domain/template/Template";
import { createTemplate } from "./src/domain/template/createTemplate";
import {
  loadTemplates,
  saveTemplates,
} from "./src/services/storage/templateStorage";
import { TemplateListScreen } from "./src/screens/TemplateListScreen";
import { TemplateEditorScreen } from "./src/screens/TemplateEditorScreen";

type AppScreen = "observations" | "templates" | "templateEditor";

function parseNumericValueForApp(text: string): string {
  const value = text.trim();

  const match = value.match(/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/);
  return match?.[0] ?? "";
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("observations");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateFieldIds, setSelectedTemplateFieldIds] = useState<
    string[]
  >([]);

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
  const [selectedFieldId, setSelectedFieldId] = useState(
    BUILT_IN_FIELDS.value.id,
  );
  const [editingMeasurement, setEditingMeasurement] = useState<{
    captureId: string;
    fieldValueIndex: number;
  } | null>(null);

  function parseFieldValue(fieldId: string, input: string): number | null {
    const field = getFieldById(fieldId);
    if (field.valueType === "duration") {
      return parseDuration(input);
    }

    const value = Number(input);
    return Number.isFinite(value) ? value : null;
  }

  function formatFieldInput(fieldId: string, value: number): string {
    const field = getFieldById(fieldId);
    return field.valueType === "duration"
      ? formatDuration(value)
      : value.toString();
  }

  function handleSaveValue() {
    if (!activeObservation) {
      return;
    }

    const field = getFieldById(selectedFieldId);
    const value = parseFieldValue(selectedFieldId, editedValue);

    if (value === null) {
      return;
    }

    const capture = createCapture(
      [
        {
          fieldId: field.id,
          valueType: field.valueType,
          value,
        },
      ],
      capturedImageUri ?? undefined,
    );

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
    fieldId: string,
    value: number,
  ) {
    setEditingMeasurement({ captureId, fieldValueIndex });
    setSelectedRegionIndex(null);
    setManualEntry(true);
    setCameraStatus(null);
    setSelectedFieldId(fieldId);
    const field = getFieldById(fieldId);
    setEditedValue(formatFieldInput(fieldId, value));
  }

  function handleSaveEditedMeasurement() {
    if (!activeObservation || !editingMeasurement) {
      return;
    }

    const currentField = getFieldById(selectedFieldId);
    const value = parseFieldValue(selectedFieldId, editedValue);

    if (value === null) {
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
                  ? {
                      ...fieldValue,
                      fieldId: currentField.id,
                      valueType: currentField.valueType,
                      value,
                    }
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

  async function captureImage() {
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
    const storedImageUri = await copyImageToStorage(asset.uri);

    setCapturedImageUri(storedImageUri);
    setImageSize({
      width: asset.width,
      height: asset.height,
    });

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
    setSelectedFieldId(BUILT_IN_FIELDS.value.id);

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

    await captureImage();
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
            const imageUris = new Set(
              reviewObservation.captures
                .map((capture) => capture.sourceImageUri)
                .filter((uri): uri is string => Boolean(uri)),
            );

            for (const imageUri of imageUris) {
              deleteImageFromStorage(imageUri);
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

  useEffect(() => {
    async function loadSavedTemplates() {
      const savedTemplates = await loadTemplates();
      setTemplates(savedTemplates);
      setTemplatesLoaded(true);
    }

    loadSavedTemplates();
  }, []);

  useEffect(() => {
    if (!templatesLoaded) {
      return;
    }

    saveTemplates(templates);
  }, [templates, templatesLoaded]);

  function handleOpenTemplates() {
    setCurrentScreen("templates");
  }

  function handleNewTemplate() {
    setEditingTemplate(null);
    setTemplateName("");
    setSelectedTemplateFieldIds([]);
    setCurrentScreen("templateEditor");
  }

  function handleEditTemplate(template: Template) {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setSelectedTemplateFieldIds([...template.fieldIds]);
    setCurrentScreen("templateEditor");
  }

  function handleToggleTemplateField(fieldId: string) {
    setSelectedTemplateFieldIds((current) =>
      current.includes(fieldId)
        ? current.filter((id) => id !== fieldId)
        : [...current, fieldId],
    );
  }

  function handleSaveTemplate() {
    const name = templateName.trim();

    if (!name || selectedTemplateFieldIds.length === 0) {
      return;
    }

    const fieldIds = FIELD_LIST.filter((field) =>
      selectedTemplateFieldIds.includes(field.id),
    ).map((field) => field.id);

    if (editingTemplate) {
      const updatedTemplate: Template = {
        ...editingTemplate,
        name,
        fieldIds,
        updatedAt: new Date(),
      };

      setTemplates((current) =>
        current.map((template) =>
          template.id === updatedTemplate.id ? updatedTemplate : template,
        ),
      );
    } else {
      const template = createTemplate(name, fieldIds);
      setTemplates((current) => [...current, template]);
    }

    setCurrentScreen("templates");
  }

  function handleDeleteTemplate(template: Template) {
    setTemplates((current) =>
      current.filter((item) => item.id !== template.id),
    );
  }

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

        <Pressable style={styles.templatesButton} onPress={handleOpenTemplates}>
          <Text style={styles.templatesButtonText}>Templates</Text>
        </Pressable>

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
              setEditedValue(
                getFieldById(selectedFieldId).valueType === "duration"
                  ? value
                  : parseNumericValueForApp(value),
              );
            }}
            selectedFieldId={selectedFieldId}
            onFieldChange={(fieldId: string) => {
              const nextField = getFieldById(fieldId);
              setSelectedFieldId(fieldId);

              if (selectedRegionIndex !== null) {
                const region = textRegions[selectedRegionIndex];
                setEditedValue(
                  nextField.valueType === "duration"
                    ? (region?.text ?? "")
                    : parseNumericValueForApp(region?.text ?? ""),
                );
                return;
              }

              if (editedValue) {
                const currentValue = parseFieldValue(
                  selectedFieldId,
                  editedValue,
                );
                if (currentValue !== null) {
                  setEditedValue(formatFieldInput(fieldId, currentValue));
                }
              }
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

        {currentScreen === "templates" &&
          !activeObservation &&
          !reviewObservation && (
            <TemplateListScreen
              templates={templates}
              onBack={() => setCurrentScreen("observations")}
              onNewTemplate={handleNewTemplate}
              onEditTemplate={handleEditTemplate}
              onDeleteTemplate={handleDeleteTemplate}
            />
          )}

        {currentScreen === "templateEditor" &&
          !activeObservation &&
          !reviewObservation && (
            <TemplateEditorScreen
              template={editingTemplate}
              name={templateName}
              selectedFieldIds={selectedTemplateFieldIds}
              onBack={() => setCurrentScreen("templates")}
              onNameChange={setTemplateName}
              onToggleField={handleToggleTemplateField}
              onSave={handleSaveTemplate}
            />
          )}

        {currentScreen === "observations" &&
          !activeObservation &&
          !reviewObservation && (
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
  templatesButton: {
    alignSelf: "flex-start",
    marginBottom: 24,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#D5D8DC",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  templatesButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
  },
});

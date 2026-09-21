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
  View,
} from "react-native";
import { ObservationScreen } from "./src/screens/ObservationScreen";
import type { Observation } from "./src/domain/observation/Observation";
import { createObservation } from "./src/domain/observation/createObservation";
import type { TextRegion } from "./src/services/ocr/TextRegion";
import { recognizeText } from "./src/services/ocr/recognizeText";
import { createCapture } from "./src/domain/capture/createCapture";
import {
  BUILT_IN_FIELDS,
  getFieldById,
  getUnitsForField,
} from "./src/domain/field/builtInFields";
import { formatDuration, parseDuration } from "./src/domain/field/duration";
import { convertUnitValue, findUnitInText } from "./src/domain/field/units";
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
import type { TemplateField } from "./src/domain/template/TemplateField";
import { createTemplate } from "./src/domain/template/createTemplate";
import {
  loadTemplates,
  saveTemplates,
} from "./src/services/storage/templateStorage";
import { TemplateListScreen } from "./src/screens/TemplateListScreen";
import { TemplateEditorScreen } from "./src/screens/TemplateEditorScreen";
import { ObservationTemplatePickerScreen } from "./src/screens/ObservationTemplatePickerScreen";
import { TemplateMeasurementEntryScreen } from "./src/screens/TemplateMeasurementEntryScreen";
import { TemplateCaptureReviewScreen } from "./src/screens/TemplateCaptureReviewScreen";
import type { Project } from "./src/domain/project/Project";
import { createProject } from "./src/domain/project/createProject";
import type { Scene } from "./src/domain/scene/Scene";
import { createScene } from "./src/domain/scene/createScene";
import { loadProjects, saveProjects } from "./src/services/storage/projectStorage";
import { loadScenes, saveScenes } from "./src/services/storage/sceneStorage";
import { ProjectListScreen } from "./src/screens/ProjectListScreen";
import { SceneListScreen } from "./src/screens/SceneListScreen";
import { ProjectEditorScreen } from "./src/screens/ProjectEditorScreen";
import { SceneEditorScreen } from "./src/screens/SceneEditorScreen";

type AppScreen = "projects" | "scenes" | "observations" | "templates" | "templateEditor" | "projectEditor" | "sceneEditor";

function parseNumericValueFromOcr(text: string): string {
  const match = text.match(/[-+]?(?:\d+(?:\.\d*)?|\.\d+)/);
  return match?.[0] ?? "";
}

function parseDurationFromOcr(text: string): string {
  const timerMatch = text.match(/\d+\s*:\s*\d{2}(?:\.\d{1,3})?/);
  if (timerMatch) {
    return timerMatch[0].replace(/\s+/g, "");
  }

  const dottedTimerMatch = text.match(/\d+\.\d{2}/);
  if (dottedTimerMatch) {
    return dottedTimerMatch[0];
  }

  return parseNumericValueFromOcr(text);
}

function parseOcrValueForField(
  fieldId: string,
  text: string,
  targetUnit?: string | null,
): string {
  const field = getFieldById(fieldId);

  if (field.valueType === "duration") {
    return parseDurationFromOcr(text);
  }

  const numericText = parseNumericValueFromOcr(text);
  if (!numericText) {
    return "";
  }

  if (!targetUnit) {
    return numericText;
  }

  const sourceUnit = findUnitInText(fieldId, text);

  if (!sourceUnit) {
    return numericText;
  }

  const converted = convertUnitValue(
    fieldId,
    Number(numericText),
    sourceUnit,
    targetUnit,
  );

  return converted === null ? "" : converted.toString();
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("projects");

  const [projects, setProjects] = useState<Project[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeScene, setActiveScene] = useState<Scene | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [projectName, setProjectName] = useState("");
  const [sceneName, setSceneName] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [scenesLoaded, setScenesLoaded] = useState(false);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const [templateName, setTemplateName] = useState("");
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);

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
  const [selectedOcrValue, setSelectedOcrValue] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState(
    BUILT_IN_FIELDS.value.id,
  );
  const [selectedUnit, setSelectedUnit] = useState<string | null>(
    BUILT_IN_FIELDS.value.unit,
  );
  const [editingMeasurement, setEditingMeasurement] = useState<{
    captureId: string;
    fieldValueIndex: number;
    unit: string | null;
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
    const valueInput = editedValue.trim() !== "" ? editedValue : selectedOcrValue ?? "";
    const value = parseFieldValue(selectedFieldId, valueInput);

    if (value === null) {
      return;
    }

    const capture = createCapture(
      [
        {
          fieldId: field.id,
          valueType: field.valueType,
          value,
          unit: selectedUnit,
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
    setSelectedOcrValue(null);
    setEditedValue("");
    setManualEntry(false);
  }

  function handleStartEditingMeasurement(
    captureId: string,
    fieldValueIndex: number,
    fieldId: string,
    value: number,
    unit: string | null | undefined,
  ) {
    setEditingMeasurement({
      captureId,
      fieldValueIndex,
      unit: unit ?? getFieldById(fieldId).unit,
    });
    setSelectedRegionIndex(null);
    setManualEntry(false);
    setCameraStatus(null);
    setSelectedFieldId(fieldId);
    setSelectedUnit(unit ?? getFieldById(fieldId).unit);
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
                      unit: selectedUnit,
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

  function resetCaptureState() {
    setCameraStatus(null);
    setImageSize(null);
    setContainerSize(null);
    setTextRegions([]);
    setSelectedRegionIndex(null);
    setSelectedOcrValue(null);
    setEditedValue("");
    setCapturedImageUri(null);
    setEditingMeasurement(null);
  }

  function normalizeUnit(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function hasExplicitUnit(text: string, unit: string | null): boolean {
    if (!unit) {
      return false;
    }

    return normalizeUnit(text).includes(normalizeUnit(unit));
  }

  function looksLikeTimer(text: string): boolean {
    return /\d+\s*:\s*\d{2}(?:\.\d{1,3})?/.test(text) || /\d+\.\d{2}(?!\d)/.test(text);
  }

  function findTemplateOcrValues(template: Template, regions: TextRegion[]) {
    const used = new Set<number>();

    return template.fields.map((templateField) => {
      const field = getFieldById(templateField.fieldId);
      const unit = templateField.unit ?? field.unit;
      const candidates = regions
        .map((region, index) => ({
          region,
          index,
          value: parseOcrValueForField(templateField.fieldId, region.text, unit),
        }))
        .filter((candidate) => candidate.value !== "" && !used.has(candidate.index))
        .sort((a, b) => {
          const score = (candidate: { region: TextRegion }) => {
            if (field.valueType === "duration") {
              return looksLikeTimer(candidate.region.text) ? 4 : 0;
            }

            if (unit && hasExplicitUnit(candidate.region.text, unit)) {
              return 4;
            }

            return unit ? 1 : 2;
          };

          return score(b) - score(a);
        });

      const candidate = candidates[0];
      if (candidate) {
        used.add(candidate.index);
      }

      return {
        templateFieldId: templateField.id,
        fieldId: templateField.fieldId,
        unit,
        recognizedText: candidate?.region.text ?? "",
        value: candidate?.value ?? "",
        region: candidate?.region ?? null,
      };
    });
  }

  async function captureImage(template?: Template) {
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

      if (template) {
        setTemplateCaptureReview({
          template,
          imageUri: storedImageUri,
          regions,
        });
        setObservationTemplatePickerOpen(false);
        return;
      }

      if (regions.length === 0) {
        setCameraStatus(
          "No text was detected. You can enter the measurement manually.",
        );
      }
    } catch {
      setTextRegions([]);

      if (template) {
        setTemplateCaptureReview({
          template,
          imageUri: storedImageUri,
          regions: [],
        });
        setObservationTemplatePickerOpen(false);
        return;
      }

      setCameraStatus(
        "Text recognition failed. You can enter the measurement manually.",
      );
    }
  }

  const [observationTemplatePickerOpen, setObservationTemplatePickerOpen] =
    useState(false);
  const [templateMeasurementEntry, setTemplateMeasurementEntry] =
    useState<Template | null>(null);
  const [templateCaptureReview, setTemplateCaptureReview] = useState<{
    template: Template;
    imageUri: string;
    regions: TextRegion[];
  } | null>(null);
  const [measurementPickerMode, setMeasurementPickerMode] = useState<"manual" | "camera">("manual");

  function handleNewObservation() {
    startObservation();
  }

  function startObservation() {
    setCameraStatus(null);
    setManualEntry(false);

    if (!activeScene) {
      return;
    }

    const observation = createObservation(activeScene.id);

    setImageSize(null);
    setContainerSize(null);
    setTextRegions([]);
    setSelectedRegionIndex(null);
    setSelectedOcrValue(null);
    setEditedValue("");
    setSelectedFieldId(BUILT_IN_FIELDS.value.id);
    setSelectedUnit(BUILT_IN_FIELDS.value.unit);

    setObservations((current) => [...current, observation]);
    setActiveObservation(observation);
    setCapturedImageUri(null);
    setEditingMeasurement(null);
    setObservationTemplatePickerOpen(false);
  }

  function startTemplateMeasurementEntry(template: Template) {
    setCameraStatus(null);
    setObservationTemplatePickerOpen(false);
    setTemplateMeasurementEntry(template);
  }

  function handleSaveTemplateMeasurements(values: Record<string, string>) {
    if (!activeObservation || !templateMeasurementEntry) {
      return;
    }

    const fieldValues = templateMeasurementEntry.fields.flatMap((templateField) => {
      const input = values[templateField.id]?.trim() ?? "";

      if (!input) {
        return [];
      }

      const field = getFieldById(templateField.fieldId);
      const value = parseFieldValue(templateField.fieldId, input);

      if (value === null) {
        return [];
      }

      return [{
        fieldId: field.id,
        templateFieldId: templateField.id,
        valueType: field.valueType,
        value,
        unit: templateField.unit ?? field.unit,
      }];
    });

    if (fieldValues.length === 0) {
      return;
    }

    const capture = createCapture(
      fieldValues,
      undefined,
      templateMeasurementEntry.id,
    );
    const updatedObservation: Observation = {
      ...activeObservation,
      captures: [...activeObservation.captures, capture],
    };

    setObservations((current) =>
      current.map((observation) =>
        observation.id === updatedObservation.id
          ? updatedObservation
          : observation,
      ),
    );
    setActiveObservation(updatedObservation);
    setSelectedFieldId(BUILT_IN_FIELDS.value.id);
    setSelectedUnit(BUILT_IN_FIELDS.value.unit);
    setEditedValue("");
    setManualEntry(false);
    setTemplateMeasurementEntry(null);
    setCapturedImageUri(null);
  }

  function openManualMeasurementPicker() {
    setMeasurementPickerMode("manual");
    setObservationTemplatePickerOpen(true);
  }

  function openCameraMeasurementPicker() {
    resetCaptureState();
    setMeasurementPickerMode("camera");
    setObservationTemplatePickerOpen(true);
  }

  async function startCameraForField(fieldId: string) {
    setObservationTemplatePickerOpen(false);
    setSelectedFieldId(fieldId);
    setSelectedUnit(getFieldById(fieldId).unit);
    setManualEntry(false);
    await captureImage();
  }

  async function startCameraForTemplate(template: Template) {
    setObservationTemplatePickerOpen(false);
    setManualEntry(false);
    await captureImage(template);
  }

  function handleSaveTemplateCapture(values: Record<string, string>) {
    if (!activeObservation || !templateCaptureReview) {
      return;
    }

    const fieldValues = templateCaptureReview.template.fields.flatMap((templateField) => {
      const input = values[templateField.id]?.trim() ?? "";
      if (!input) {
        return [];
      }

      const field = getFieldById(templateField.fieldId);
      const value = parseFieldValue(templateField.fieldId, input);
      return value === null
        ? []
        : [{
            fieldId: field.id,
            templateFieldId: templateField.id,
            valueType: field.valueType,
            value,
            unit: templateField.unit ?? field.unit,
          }];
    });

    if (fieldValues.length === 0) {
      return;
    }

    const capture = createCapture(
      fieldValues,
      templateCaptureReview.imageUri,
      templateCaptureReview.template.id,
    );
    const updatedObservation: Observation = {
      ...activeObservation,
      captures: [...activeObservation.captures, capture],
    };

    setActiveObservation(updatedObservation);
    setObservations((current) =>
      current.map((observation) =>
        observation.id === updatedObservation.id ? updatedObservation : observation,
      ),
    );
    setTemplateCaptureReview(null);
    resetCaptureState();
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
    setSelectedOcrValue(null);
    setEditedValue("");
    setSelectedUnit(BUILT_IN_FIELDS.value.unit);
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
    async function loadWorkspace() {
      const [savedProjects, savedScenes, savedObservations] = await Promise.all([
        loadProjects(),
        loadScenes(),
        loadObservations(),
      ]);

      let nextProjects = savedProjects;
      let nextScenes = savedScenes;
      let nextObservations = savedObservations;

      const orphaned = nextObservations.some((observation) => !observation.sceneId);
      if (orphaned) {
        let migrationProject = nextProjects[0];
        if (!migrationProject) {
          migrationProject = createProject("General Project");
          nextProjects = [migrationProject];
        }
        let migrationScene = nextScenes.find((scene) => scene.projectId === migrationProject.id);
        if (!migrationScene) {
          migrationScene = createScene(migrationProject.id, "General Scene", "Migrated observations without a scene.");
          nextScenes = [...nextScenes, migrationScene];
        }
        nextObservations = nextObservations.map((observation) =>
          observation.sceneId ? observation : { ...observation, sceneId: migrationScene!.id },
        );
      }

      setProjects(nextProjects);
      setScenes(nextScenes);
      setObservations(nextObservations);
      setProjectsLoaded(true);
      setScenesLoaded(true);
      setObservationsLoaded(true);
    }

    loadWorkspace();
  }, []);

  useEffect(() => {
    if (!observationsLoaded) return;
    void saveObservations(observations);
  }, [observations, observationsLoaded]);

  useEffect(() => {
    if (!projectsLoaded) return;
    void saveProjects(projects);
  }, [projects, projectsLoaded]);

  useEffect(() => {
    if (!scenesLoaded) return;
    void saveScenes(scenes);
  }, [scenes, scenesLoaded]);

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
    setTemplateFields([]);
    setCurrentScreen("templateEditor");
  }

  function handleEditTemplate(template: Template) {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateFields(template.fields.map((field) => ({ ...field })));
    setCurrentScreen("templateEditor");
  }

  function handleSaveTemplate() {
    const name = templateName.trim();

    if (!name || templateFields.length === 0) {
      return;
    }

    if (editingTemplate) {
      const updatedTemplate: Template = {
        ...editingTemplate,
        name,
        fields: templateFields.map((field) => ({ ...field })),
        updatedAt: new Date(),
      };

      setTemplates((current) =>
        current.map((template) =>
          template.id === updatedTemplate.id ? updatedTemplate : template,
        ),
      );
    } else {
      const template = createTemplate(name, templateFields);
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

        {templateMeasurementEntry && (
          <TemplateMeasurementEntryScreen
            template={templateMeasurementEntry}
            onBack={() => {
              setTemplateMeasurementEntry(null);
              setObservationTemplatePickerOpen(true);
            }}
            onSave={handleSaveTemplateMeasurements}
          />
        )}

        {templateCaptureReview && !observationTemplatePickerOpen && (
          <TemplateCaptureReviewScreen
            template={templateCaptureReview.template}
            imageUri={templateCaptureReview.imageUri}
            imageSize={imageSize}
            matches={Object.fromEntries(
              findTemplateOcrValues(
                templateCaptureReview.template,
                templateCaptureReview.regions,
              ).map((item) => [item.templateFieldId, item]),
            )}
            values={Object.fromEntries(
              findTemplateOcrValues(
                templateCaptureReview.template,
                templateCaptureReview.regions,
              ).map((item) => [item.templateFieldId, item.value]),
            )}
            recognizedText={Object.fromEntries(
              findTemplateOcrValues(
                templateCaptureReview.template,
                templateCaptureReview.regions,
              ).map((item) => [item.templateFieldId, item.recognizedText]),
            )}
            onBack={() => {
              setTemplateCaptureReview(null);
              resetCaptureState();
            }}
            onSave={handleSaveTemplateCapture}
          />
        )}

        {activeObservation && !templateMeasurementEntry && !templateCaptureReview && !observationTemplatePickerOpen && (
          <ObservationScreen
            observation={activeObservation}
            templates={templates}
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
              const field = getFieldById(selectedFieldId);
              const extractedValue = parseOcrValueForField(
                selectedFieldId,
                value,
                selectedUnit,
              );

              setSelectedRegionIndex(index);
              setSelectedOcrValue(extractedValue);
              setEditedValue(extractedValue);

              // Keep the OCR-derived value as an explicit source value so that
              // saving immediately cannot fall back to Number("") === 0.
              if (field.valueType === "duration" && !extractedValue) {
                setSelectedOcrValue(null);
                setEditedValue("");
              }
            }}
            selectedFieldId={selectedFieldId}
            selectedUnit={selectedUnit}
            onFieldChange={(fieldId: string) => {
              const nextField = getFieldById(fieldId);
              setSelectedFieldId(fieldId);
              setSelectedUnit(nextField.unit);

              if (selectedRegionIndex !== null) {
                const region = textRegions[selectedRegionIndex];
                const extractedValue = parseOcrValueForField(
                  fieldId,
                  region?.text ?? "",
                  nextField.unit,
                );
                setSelectedOcrValue(extractedValue || null);
                setEditedValue(extractedValue);
                return;
              }

              if (editedValue) {
                const currentValue = parseFieldValue(
                  selectedFieldId,
                  editedValue,
                );
                if (currentValue !== null) {
                  const convertedValue =
                    selectedUnit && nextField.unit &&
                    getUnitsForField(selectedFieldId).length > 0 &&
                    getUnitsForField(fieldId).length > 0
                      ? convertUnitValue(
                          selectedFieldId,
                          currentValue,
                          selectedUnit,
                          nextField.unit,
                        )
                      : currentValue;

                  setEditedValue(
                    formatFieldInput(
                      fieldId,
                      convertedValue ?? currentValue,
                    ),
                  );
                }
              }
            }}
            onUnitChange={(unit: string | null) => {
              if (unit === selectedUnit) {
                return;
              }

              if (
                editedValue &&
                selectedUnit &&
                unit &&
                getUnitsForField(selectedFieldId).length > 0
              ) {
                const currentValue = parseFieldValue(
                  selectedFieldId,
                  editedValue,
                );
                if (currentValue !== null) {
                  const convertedValue = convertUnitValue(
                    selectedFieldId,
                    currentValue,
                    selectedUnit,
                    unit,
                  );
                  if (convertedValue !== null) {
                    setEditedValue(formatFieldInput(selectedFieldId, convertedValue));
                  }
                }
              }

              setSelectedUnit(unit);
            }}
            onValueChange={setEditedValue}
            onSaveValue={handleSaveValue}
            onManualEntry={() => {
              setManualEntry(true);
              setEditedValue("");
            }}
            onAddManualMeasurement={openManualMeasurementPicker}
            onCaptureWithCamera={openCameraMeasurementPicker}
            onEditMeasurement={handleStartEditingMeasurement}
            onSaveEditedMeasurement={handleSaveEditedMeasurement}
            onDeleteMeasurement={handleDeleteMeasurement}
          />
        )}

        {reviewObservation && (
          <ObservationReviewScreen
            observation={reviewObservation}
            templates={templates}
            onBack={() => setReviewObservation(null)}
            onDelete={handleDeleteObservation}
          />
        )}

        {currentScreen === "projects" && !activeObservation && !reviewObservation && (
          <ProjectListScreen
            projects={projects}
            scenes={scenes}
            onNewProject={() => { setEditingProject(null); setProjectName(""); setCurrentScreen("projectEditor"); }}
            onSelectProject={(project) => { setActiveProject(project); setCurrentScreen("scenes"); }}
            onEditProject={(project) => { setEditingProject(project); setProjectName(project.name); setCurrentScreen("projectEditor"); }}
            onDeleteProject={(project) => setProjects((current) => current.filter((item) => item.id !== project.id))}
          />
        )}

        {currentScreen === "projectEditor" && !activeObservation && !reviewObservation && (
          <ProjectEditorScreen
            title={editingProject ? "Edit Project" : "New Project"}
            name={projectName}
            onBack={() => setCurrentScreen("projects")}
            onNameChange={setProjectName}
            onSave={() => {
              const name = projectName.trim();
              if (!name) return;
              if (editingProject) {
                const updated = { ...editingProject, name, updatedAt: new Date() };
                setProjects((current) => current.map((item) => item.id === updated.id ? updated : item));
              } else {
                const project = createProject(name);
                setProjects((current) => [...current, project]);
              }
              setCurrentScreen("projects");
            }}
          />
        )}

        {currentScreen === "scenes" && activeProject && !activeObservation && !reviewObservation && (
          <SceneListScreen
            projectName={activeProject.name}
            scenes={scenes.filter((scene) => scene.projectId === activeProject.id)}
            observations={observations}
            onBack={() => { setActiveProject(null); setCurrentScreen("projects"); }}
            onNewScene={() => { setEditingScene(null); setSceneName(""); setSceneDescription(""); setCurrentScreen("sceneEditor"); }}
            onSelectScene={(scene) => { setActiveScene(scene); setCurrentScreen("observations"); }}
            onEditScene={(scene) => { setEditingScene(scene); setSceneName(scene.name); setSceneDescription(scene.description ?? ""); setCurrentScreen("sceneEditor"); }}
            onDeleteScene={(scene) => setScenes((current) => current.filter((item) => item.id !== scene.id))}
          />
        )}

        {currentScreen === "sceneEditor" && activeProject && !activeObservation && !reviewObservation && (
          <SceneEditorScreen
            title={editingScene ? "Edit Scene" : "New Scene"}
            name={sceneName}
            description={sceneDescription}
            onBack={() => setCurrentScreen("scenes")}
            onNameChange={setSceneName}
            onDescriptionChange={setSceneDescription}
            onSave={() => {
              const name = sceneName.trim();
              if (!name) return;
              if (editingScene) {
                const updated = { ...editingScene, name, ...(sceneDescription.trim() ? { description: sceneDescription.trim() } : { description: undefined }), updatedAt: new Date() };
                setScenes((current) => current.map((item) => item.id === updated.id ? updated : item));
              } else {
                const scene = createScene(activeProject.id, name, sceneDescription);
                setScenes((current) => [...current, scene]);
              }
              setCurrentScreen("scenes");
            }}
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
              fields={templateFields}
              onBack={() => setCurrentScreen("templates")}
              onNameChange={setTemplateName}
              onFieldsChange={setTemplateFields}
              onSave={handleSaveTemplate}
            />
          )}

        {observationTemplatePickerOpen && !reviewObservation && (
          <ObservationTemplatePickerScreen
            templates={templates}
            mode={measurementPickerMode}
            onBack={() => setObservationTemplatePickerOpen(false)}
            onSelectField={(fieldId) => {
              if (measurementPickerMode === "camera") {
                void startCameraForField(fieldId);
                return;
              }

              setObservationTemplatePickerOpen(false);
              setManualEntry(true);
              setSelectedRegionIndex(null);
              setSelectedFieldId(fieldId);
              setSelectedUnit(getFieldById(fieldId).unit);
              setEditedValue("");
              setCameraStatus(null);
            }}
            onSelectTemplate={(template) => {
              if (measurementPickerMode === "camera") {
                void startCameraForTemplate(template);
                return;
              }

              startTemplateMeasurementEntry(template);
            }}
          />
        )}

        {currentScreen === "observations" && activeScene &&
          !observationTemplatePickerOpen &&
          !activeObservation &&
          !reviewObservation && (
            <>
              <View style={styles.sceneNav}>
                <Pressable onPress={() => { setActiveScene(null); setCurrentScreen("scenes"); }} style={styles.backLink}>
                  <Text style={styles.backLinkText}>{activeProject?.name ?? "Project"} / Scenes</Text>
                </Pressable>
                <Pressable style={styles.templatesButton} onPress={handleOpenTemplates}>
                  <Text style={styles.templatesButtonText}>Templates</Text>
                </Pressable>
              </View>
              <Text style={styles.sceneTitle}>{activeScene.name}</Text>
              {activeScene.description ? <Text style={styles.sceneDescription}>{activeScene.description}</Text> : null}
              <ObservationListScreen
                observations={observations.filter((observation) => observation.sceneId === activeScene.id)}
                templates={templates}
                onNewObservation={handleNewObservation}
                onSelectObservation={setReviewObservation}
              />
            </>
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
  sceneNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backLink: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backLinkText: {
    fontSize: 15,
    color: "#555",
  },
  sceneTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },
  sceneDescription: {
    marginBottom: 18,
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
  },
});

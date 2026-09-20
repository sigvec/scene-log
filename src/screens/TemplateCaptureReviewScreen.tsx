import { ArrowLeft, Check } from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Template } from "../domain/template/Template";
import { getFieldById } from "../domain/field/builtInFields";
import type { TextRegion } from "../services/ocr/TextRegion";

interface TemplateCaptureMatch {
  recognizedText: string;
  region: TextRegion | null;
}

interface TemplateCaptureReviewScreenProps {
  template: Template;
  imageUri: string;
  imageSize: {
    width: number;
    height: number;
  } | null;
  matches: Record<string, TemplateCaptureMatch>;
  values: Record<string, string>;
  recognizedText: Record<string, string>;
  onBack: () => void;
  onSave: (values: Record<string, string>) => void;
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

export function TemplateCaptureReviewScreen({
  template,
  imageUri,
  imageSize,
  matches,
  values: initialValues,
  recognizedText,
  onBack,
  onSave,
}: TemplateCaptureReviewScreenProps) {
  const [values, setValues] = useState(initialValues);
  const [imageContainerSize, setImageContainerSize] = useState({
    width: 0,
    height: 0,
  });

  const transform =
    imageSize && imageContainerSize.width > 0 && imageContainerSize.height > 0
      ? getContainTransform(
          imageSize.width,
          imageSize.height,
          imageContainerSize.width,
          imageContainerSize.height,
        )
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} strokeWidth={1.8} color="#555" />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>{template.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View
        style={styles.imageContainer}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setImageContainerSize({ width, height });
        }}
      >
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

        {transform &&
          template.fields.map((templateField) => {
            const match = matches[templateField.id];
            const region = match?.region;
            if (!region) {
              return null;
            }

            const field = getFieldById(templateField.fieldId);
            return (
              <View
                key={templateField.id}
                pointerEvents="none"
                style={[
                  styles.detectionBox,
                  {
                    left: transform.offsetX + region.bounds.x * transform.scale,
                    top: transform.offsetY + region.bounds.y * transform.scale,
                    width: region.bounds.width * transform.scale,
                    height: region.bounds.height * transform.scale,
                  },
                ]}
              >
                <View style={styles.detectionLabel}>
                  <Text style={styles.detectionLabelText} numberOfLines={1}>
                    {field.name}
                  </Text>
                </View>
              </View>
            );
          })}
      </View>

      <Text style={styles.description}>
        Review the values detected from the captured scene. The boxes show where
        SceneLog found each template measurement. Empty fields are skipped.
      </Text>

      <View style={styles.fieldList}>
        {template.fields.map((templateField) => {
          const field = getFieldById(templateField.fieldId);
          const unit = templateField.unit ?? field.unit;
          return (
            <View key={templateField.id} style={styles.fieldRow}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldName}>{field.name}</Text>
                {unit && <Text style={styles.fieldUnit}>{unit}</Text>}
              </View>
              <Text style={styles.recognizedText}>
                {recognizedText[templateField.id] || "No matching reading detected"}
              </Text>
              <TextInput
                value={values[templateField.id] ?? ""}
                onChangeText={(value) =>
                  setValues((current) => ({ ...current, [templateField.id]: value }))
                }
                keyboardType={field.valueType === "duration" ? "default" : "decimal-pad"}
                style={styles.valueInput}
                placeholder={field.valueType === "duration" ? "e.g. 1:30 or 1.30" : "Enter value"}
                placeholderTextColor="#999"
              />
            </View>
          );
        })}
      </View>

      <Pressable style={styles.saveButton} onPress={() => onSave(values)}>
        <Check size={19} strokeWidth={2.2} color="#fff" />
        <Text style={styles.saveButtonText}>Add Measurement</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingRight: 12 },
  backButtonText: { fontSize: 16, color: "#555" },
  title: { flex: 1, textAlign: "center", fontSize: 22, fontWeight: "600" },
  headerSpacer: { width: 58 },
  imageContainer: {
    width: "100%",
    height: 280,
    position: "relative",
    overflow: "hidden",
    borderRadius: 10,
    backgroundColor: "#F1F2F4",
  },
  image: { width: "100%", height: "100%" },
  detectionBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#16A34A",
    backgroundColor: "rgba(22, 163, 74, 0.08)",
  },
  detectionLabel: {
    position: "absolute",
    left: -2,
    top: -24,
    maxWidth: 120,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: "#16A34A",
  },
  detectionLabelText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  description: { marginTop: 16, marginBottom: 16, fontSize: 15, lineHeight: 22, color: "#666" },
  fieldList: { gap: 12 },
  fieldRow: { padding: 14, borderWidth: 1, borderColor: "#E0E2E5", borderRadius: 9, backgroundColor: "#fff" },
  fieldHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 },
  fieldName: { fontSize: 16, fontWeight: "600" },
  fieldUnit: { fontSize: 14, color: "#666" },
  recognizedText: { marginBottom: 8, fontSize: 13, color: "#666" },
  valueInput: { minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: "#D5D8DC", borderRadius: 8, backgroundColor: "#FAFAFB", fontSize: 18 },
  saveButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 20, paddingVertical: 13, borderRadius: 9, backgroundColor: "#222" },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

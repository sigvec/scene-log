import { ArrowLeft, Check } from "lucide-react-native";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { Template } from "../domain/template/Template";
import { getFieldById } from "../domain/field/builtInFields";

interface TemplateCaptureReviewScreenProps {
  template: Template;
  imageUri: string;
  values: Record<string, string>;
  recognizedText: Record<string, string>;
  onBack: () => void;
  onSave: (values: Record<string, string>) => void;
}

export function TemplateCaptureReviewScreen({
  template,
  imageUri,
  values: initialValues,
  recognizedText,
  onBack,
  onSave,
}: TemplateCaptureReviewScreenProps) {
  const [values, setValues] = useState(initialValues);

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

      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

      <Text style={styles.description}>
        Review the values detected from the captured scene. Empty fields are skipped.
      </Text>

      <View style={styles.fieldList}>
        {template.fieldIds.map((fieldId) => {
          const field = getFieldById(fieldId);
          return (
            <View key={fieldId} style={styles.fieldRow}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldName}>{field.name}</Text>
                {field.unit && <Text style={styles.fieldUnit}>{field.unit}</Text>}
              </View>
              <Text style={styles.recognizedText}>
                {recognizedText[fieldId] || "No matching reading detected"}
              </Text>
              <TextInput
                value={values[fieldId] ?? ""}
                onChangeText={(value) =>
                  setValues((current) => ({ ...current, [fieldId]: value }))
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
  image: { width: "100%", height: 230, borderRadius: 10, backgroundColor: "#F1F2F4" },
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

import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "../components/Card";
import type { Template } from "../domain/template/Template";
import { FIELD_LIST, getFieldById } from "../domain/field/builtInFields";

interface ObservationTemplatePickerScreenProps {
  templates: Template[];
  mode: "manual" | "camera";
  onBack: () => void;
  onSelectField: (fieldId: string) => void;
  onSelectTemplate: (template: Template) => void;
}

export function ObservationTemplatePickerScreen({
  templates,
  mode,
  onBack,
  onSelectField,
  onSelectTemplate,
}: ObservationTemplatePickerScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} strokeWidth={1.8} color="#555" />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>
          {mode === "camera" ? "Capture Measurement" : "Add Measurement"}
        </Text>
      </View>

      <Text style={styles.description}>
        {mode === "camera"
          ? "Choose a field or template for the camera capture."
          : "Choose a single field or use a template to enter a group of related measurements."}
      </Text>

      <Text style={styles.sectionTitle}>Field</Text>

      {FIELD_LIST.map((field) => (
        <Pressable key={field.id} onPress={() => onSelectField(field.id)}>
          <Card>
            <Text style={styles.optionTitle}>{field.name}</Text>
            <Text style={styles.optionDescription}>
              {field.unit ? field.unit : "Unitless"}
            </Text>
          </Card>
        </Pressable>
      ))}

      {templates.length > 0 && <Text style={styles.sectionTitle}>Templates</Text>}

      {templates.map((template) => (
        <Pressable key={template.id} onPress={() => onSelectTemplate(template)}>
          <Card>
            <Text style={styles.optionTitle}>{template.name}</Text>
            <Text style={styles.optionDescription}>
              {template.fieldIds
                .map((fieldId) => getFieldById(fieldId).name)
                .join(" · ")}
            </Text>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: "#555",
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginRight: 58,
  },
  description: {
    marginBottom: 18,
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
  },
});

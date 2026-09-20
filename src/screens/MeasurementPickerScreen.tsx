import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "../components/Card";
import { FIELD_LIST } from "../domain/field/builtInFields";
import type { Template } from "../domain/template/Template";
import { getFieldById } from "../domain/field/builtInFields";

interface MeasurementPickerScreenProps {
  templates: Template[];
  onBack: () => void;
  onSelectField: (fieldId: string) => void;
  onSelectTemplate: (template: Template) => void;
}

export function MeasurementPickerScreen({
  templates,
  onBack,
  onSelectField,
  onSelectTemplate,
}: MeasurementPickerScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} strokeWidth={1.8} color="#555" />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Add Measurement</Text>
      </View>

      <Text style={styles.description}>
        Choose a single field or use a template to enter a group of fields.
      </Text>

      <Text style={styles.sectionTitle}>Fields</Text>

      {FIELD_LIST.map((field) => (
        <Pressable key={field.id} onPress={() => onSelectField(field.id)}>
          <Card>
            <Text style={styles.optionTitle}>{field.name}</Text>
            <Text style={styles.optionDescription}>
              {field.unit || "Unitless"} ·{" "}
              {field.valueType === "duration" ? "Duration" : "Number"}
            </Text>
          </Card>
        </Pressable>
      ))}

      {templates.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Templates</Text>

          {templates.map((template) => (
            <Pressable
              key={template.id}
              onPress={() => onSelectTemplate(template)}
            >
              <Card>
                <Text style={styles.optionTitle}>{template.name}</Text>
                <Text style={styles.optionDescription}>
                  {template.fields
                    .map((templateField) => {
                      const field = getFieldById(templateField.fieldId);
                      const unit = templateField.unit ?? field.unit;
                      return `${field.name}${unit ? ` (${unit})` : ""}`;
                    })
                    .join(" · ")}
                </Text>
              </Card>
            </Pressable>
          ))}
        </>
      )}
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
    marginBottom: 20,
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
  },
  sectionTitle: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.7,
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

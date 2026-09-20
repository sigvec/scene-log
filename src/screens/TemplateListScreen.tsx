import { ChevronRight, Plus, Trash2 } from "lucide-react-native";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "../components/Card";
import type { Template } from "../domain/template/Template";
import { getFieldById } from "../domain/field/builtInFields";

interface TemplateListScreenProps {
  templates: Template[];
  onBack: () => void;
  onNewTemplate: () => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template) => void;
}

export function TemplateListScreen({
  templates,
  onBack,
  onNewTemplate,
  onEditTemplate,
  onDeleteTemplate,
}: TemplateListScreenProps) {
  function confirmDelete(template: Template) {
    Alert.alert(
      "Delete template?",
      `"${template.name}" will be permanently deleted.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDeleteTemplate(template),
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <Pressable style={styles.primaryButton} onPress={onNewTemplate}>
          <Plus size={18} strokeWidth={2.2} color="#fff" />
          <Text style={styles.primaryButtonText}>New Template</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Templates</Text>

      {templates.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>No templates yet</Text>

          <Text style={styles.emptyText}>
            Create a template to define a reusable group of measurement fields.
          </Text>

          <Pressable style={styles.primaryButton} onPress={onNewTemplate}>
            <Plus size={18} strokeWidth={2.2} color="#fff" />
            <Text style={styles.primaryButtonText}>New Template</Text>
          </Pressable>
        </Card>
      ) : (
        templates.map((template) => (
          <Card key={template.id}>
            <View style={styles.templateRow}>
              <Pressable
                style={styles.templateMain}
                onPress={() => onEditTemplate(template)}
              >
                <Text style={styles.templateName}>{template.name}</Text>

                <Text style={styles.fieldList}>
                  {template.fields
                    .map((templateField) => {
                      const field = getFieldById(templateField.fieldId);
                      const unit = templateField.unit ?? field.unit;
                      return `${field.name}${unit ? ` (${unit})` : ""}`;
                    })
                    .join(" · ")}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${template.name}`}
                onPress={() => onEditTemplate(template)}
                style={styles.iconButton}
              >
                <ChevronRight size={22} strokeWidth={1.8} color="#777" />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${template.name}`}
                onPress={() => confirmDelete(template)}
                style={styles.iconButton}
              >
                <Trash2 size={19} strokeWidth={1.8} color="#999" />
              </Pressable>
            </View>
          </Card>
        ))
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
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 10,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: "#555",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  primaryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
    marginBottom: 20,
  },
  templateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  templateMain: {
    flex: 1,
    paddingVertical: 2,
  },
  templateName: {
    fontSize: 17,
    fontWeight: "600",
  },
  fieldList: {
    marginTop: 7,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
});

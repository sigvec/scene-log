import { ArrowLeft, Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { FIELD_LIST } from "../domain/field/builtInFields";
import type { Template } from "../domain/template/Template";

interface TemplateEditorScreenProps {
  template: Template | null;
  name: string;
  selectedFieldIds: string[];
  onBack: () => void;
  onNameChange: (name: string) => void;
  onToggleField: (fieldId: string) => void;
  onSave: () => void;
}

export function TemplateEditorScreen({
  template,
  name,
  selectedFieldIds,
  onBack,
  onNameChange,
  onToggleField,
  onSave,
}: TemplateEditorScreenProps) {
  const isEditing = template !== null;
  const canSave = name.trim().length > 0 && selectedFieldIds.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} strokeWidth={1.8} color="#555" />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          {isEditing ? "Edit Template" : "New Template"}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.label}>Name</Text>

      <TextInput
        value={name}
        onChangeText={onNameChange}
        placeholder="Template name"
        placeholderTextColor="#999"
        style={styles.nameInput}
        autoCapitalize="sentences"
      />

      <Text style={styles.label}>Fields</Text>

      <Text style={styles.description}>
        Select the measurements that belong to this template.
      </Text>

      <View style={styles.fieldList}>
        {FIELD_LIST.map((field) => {
          const selected = selectedFieldIds.includes(field.id);

          return (
            <Pressable
              key={field.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              style={styles.fieldOption}
              onPress={() => onToggleField(field.id)}
            >
              <View
                style={[styles.checkbox, selected && styles.checkboxSelected]}
              >
                {selected && <Check size={16} strokeWidth={2.4} color="#fff" />}
              </View>

              <View style={styles.fieldDetails}>
                <Text style={styles.fieldName}>{field.name}</Text>

                {field.unit && (
                  <Text style={styles.fieldUnit}>{field.unit}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        disabled={!canSave}
        onPress={onSave}
      >
        <Check size={19} strokeWidth={2.2} color="#fff" />
        <Text style={styles.saveButtonText}>
          {isEditing ? "Save Changes" : "Save Template"}
        </Text>
      </Pressable>
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
    marginBottom: 28,
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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 58,
  },
  label: {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
  },
  nameInput: {
    minHeight: 48,
    marginBottom: 28,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#D5D8DC",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  description: {
    marginTop: -2,
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
  },
  fieldList: {
    gap: 8,
    marginBottom: 28,
  },
  fieldOption: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E0E2E5",
    borderRadius: 9,
    backgroundColor: "#fff",
  },
  checkbox: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: "#B8BCC2",
    borderRadius: 6,
  },
  checkboxSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#2563EB",
  },
  fieldDetails: {
    flex: 1,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: "500",
  },
  fieldUnit: {
    marginTop: 2,
    fontSize: 13,
    color: "#777",
  },
  saveButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

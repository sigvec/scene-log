import { ArrowLeft, Check, Minus, Plus } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { FIELD_LIST, getFieldById, getUnitsForField } from "../domain/field/builtInFields";
import type { Template } from "../domain/template/Template";
import type { TemplateField } from "../domain/template/TemplateField";
import { createTemplateField } from "../domain/template/TemplateField";

interface TemplateEditorScreenProps {
  template: Template | null;
  name: string;
  fields: TemplateField[];
  onBack: () => void;
  onNameChange: (name: string) => void;
  onFieldsChange: (fields: TemplateField[]) => void;
  onSave: () => void;
}

export function TemplateEditorScreen({
  template,
  name,
  fields,
  onBack,
  onNameChange,
  onFieldsChange,
  onSave,
}: TemplateEditorScreenProps) {
  const isEditing = template !== null;
  const canSave = name.trim().length > 0 && fields.length > 0;

  function addField() {
    onFieldsChange([...fields, createTemplateField(FIELD_LIST[0].id)]);
  }

  function removeField(index: number) {
    onFieldsChange(fields.filter((_, fieldIndex) => fieldIndex !== index));
  }

  function setFieldId(index: number, fieldId: string) {
    const field = getFieldById(fieldId);
    const units = getUnitsForField(fieldId);
    const current = fields[index];
    const defaultUnit = field.unit && units.includes(field.unit) ? field.unit : units[0] ?? null;

    onFieldsChange(
      fields.map((item, fieldIndex) =>
        fieldIndex === index
          ? {
              ...current,
              fieldId,
              ...(defaultUnit !== null ? { unit: defaultUnit } : { unit: null }),
            }
          : item,
      ),
    );
  }

  function setUnit(index: number, unit: string | null) {
    onFieldsChange(
      fields.map((item, fieldIndex) =>
        fieldIndex === index ? { ...item, unit } : item,
      ),
    );
  }

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

      <View style={styles.fieldsHeader}>
        <View style={styles.fieldsHeaderText}>
          <Text style={styles.label}>Measurement fields</Text>
          <Text style={styles.description}>
            Add a field for each value the template should capture. A field can
            appear more than once.
          </Text>
        </View>

        <Pressable style={styles.addFieldButton} onPress={addField}>
          <Plus size={17} strokeWidth={2.2} color="#fff" />
          <Text style={styles.addFieldButtonText}>Add field</Text>
        </Pressable>
      </View>

      <View style={styles.fieldList}>
        {fields.map((templateField, index) => {
          const field = getFieldById(templateField.fieldId);
          const units = getUnitsForField(field.id);

          return (
            <View key={templateField.id} style={styles.fieldRow}>
              <View style={styles.fieldRowHeader}>
                <Text style={styles.slotLabel}>Field {index + 1}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove field ${index + 1}`}
                  onPress={() => removeField(index)}
                  style={styles.removeButton}
                >
                  <Minus size={18} strokeWidth={2} color="#777" />
                </Pressable>
              </View>

              <View style={styles.fieldChoices}>
                {FIELD_LIST.map((choice) => (
                  <Pressable
                    key={choice.id}
                    style={[
                      styles.choiceButton,
                      choice.id === field.id && styles.choiceButtonSelected,
                    ]}
                    onPress={() => setFieldId(index, choice.id)}
                  >
                    <Text
                      style={[
                        styles.choiceButtonText,
                        choice.id === field.id && styles.choiceButtonTextSelected,
                      ]}
                    >
                      {choice.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {units.length > 0 && (
                <View style={styles.unitSection}>
                  <Text style={styles.unitLabel}>Unit</Text>
                  <View style={styles.unitChoices}>
                    {units.map((unit) => (
                      <Pressable
                        key={unit}
                        style={[
                          styles.unitButton,
                          (templateField.unit ?? field.unit) === unit &&
                            styles.unitButtonSelected,
                        ]}
                        onPress={() => setUnit(index, unit)}
                      >
                        <Text
                          style={[
                            styles.unitButtonText,
                            (templateField.unit ?? field.unit) === unit &&
                              styles.unitButtonTextSelected,
                          ]}
                        >
                          {unit}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {fields.length === 0 && (
        <View style={styles.emptyFields}>
          <Text style={styles.emptyFieldsText}>
            Add at least one measurement field to this template.
          </Text>
        </View>
      )}

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
  container: { marginTop: 8 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingRight: 12 },
  backButtonText: { fontSize: 16, color: "#555" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 20, fontWeight: "600" },
  headerSpacer: { width: 58 },
  label: { marginBottom: 8, fontSize: 15, fontWeight: "600", color: "#444" },
  nameInput: { minHeight: 48, marginBottom: 24, paddingHorizontal: 14, borderWidth: 1, borderColor: "#D5D8DC", borderRadius: 8, backgroundColor: "#fff", fontSize: 16 },
  fieldsHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  fieldsHeaderText: { flex: 1 },
  description: { marginTop: -2, fontSize: 14, lineHeight: 20, color: "#666" },
  addFieldButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: "#2563EB" },
  addFieldButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  fieldList: { gap: 12, marginBottom: 24 },
  fieldRow: { padding: 14, borderWidth: 1, borderColor: "#E0E2E5", borderRadius: 9, backgroundColor: "#fff" },
  fieldRowHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  slotLabel: { fontSize: 13, fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: 0.4 },
  removeButton: { padding: 5 },
  fieldChoices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  choiceButton: { paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: "#D5D8DC", borderRadius: 7, backgroundColor: "#FAFAFB" },
  choiceButtonSelected: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  choiceButtonText: { fontSize: 13, color: "#555" },
  choiceButtonTextSelected: { color: "#1D4ED8", fontWeight: "600" },
  unitSection: { marginTop: 12 },
  unitLabel: { marginBottom: 7, fontSize: 13, fontWeight: "600", color: "#666" },
  unitChoices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  unitButton: { minWidth: 48, alignItems: "center", paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: "#D5D8DC", borderRadius: 7, backgroundColor: "#FAFAFB" },
  unitButtonSelected: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  unitButtonText: { fontSize: 13, color: "#555" },
  unitButtonTextSelected: { color: "#1D4ED8", fontWeight: "600" },
  emptyFields: { padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#E0E2E5", borderRadius: 9, backgroundColor: "#fff" },
  emptyFieldsText: { fontSize: 14, color: "#666" },
  saveButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 8, backgroundColor: "#2563EB" },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

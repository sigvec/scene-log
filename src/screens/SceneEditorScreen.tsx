import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { FIELD_LIST, getFieldById, getUnitsForField } from "../domain/field/builtInFields";
import type { SceneObservationField } from "../domain/scene/SceneObservationField";
import { createSceneObservationField } from "../domain/scene/SceneObservationField";

interface Props {
  title: string;
  name: string;
  description: string;
  observationFields: SceneObservationField[];
  onBack: () => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onObservationFieldsChange: (fields: SceneObservationField[]) => void;
  onSave: () => void;
}

export function SceneEditorScreen({
  title,
  name,
  description,
  observationFields,
  onBack,
  onNameChange,
  onDescriptionChange,
  onObservationFieldsChange,
  onSave,
}: Props) {
  function addField(fieldId: string) {
    onObservationFieldsChange([
      ...observationFields,
      createSceneObservationField(fieldId, getFieldById(fieldId).unit),
    ]);
  }

  function updateField(id: string, patch: Partial<SceneObservationField>) {
    onObservationFieldsChange(
      observationFields.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    );
  }

  function removeField(id: string) {
    onObservationFieldsChange(observationFields.filter((field) => field.id !== id));
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.back}>
        <ArrowLeft size={21} color="#222" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.label}>Scene name</Text>
      <TextInput
        value={name}
        onChangeText={onNameChange}
        placeholder="e.g. 40°C measurements"
        style={styles.input}
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        value={description}
        onChangeText={onDescriptionChange}
        placeholder="Experimental context, setup, sample, etc."
        multiline
        style={[styles.input, styles.multiline]}
      />

      <Text style={styles.sectionTitle}>Expected observation values</Text>
      <Text style={styles.helpText}>
        These define the values you expect each observation in this scene to contain.
        They are guidance, not a restriction: observations can still contain other values.
      </Text>

      {observationFields.map((sceneField, index) => {
        const field = getFieldById(sceneField.fieldId);
        const units = getUnitsForField(field.id);

        return (
          <View key={sceneField.id} style={styles.expectedCard}>
            <View style={styles.expectedHeader}>
              <Text style={styles.expectedIndex}>{index + 1}</Text>
              <Text style={styles.expectedName}>{field.name}</Text>
              <Pressable onPress={() => removeField(sceneField.id)} hitSlop={8}>
                <Trash2 size={18} color="#888" />
              </Pressable>
            </View>

            <TextInput
              value={sceneField.label ?? ""}
              onChangeText={(value) => updateField(sceneField.id, { label: value })}
              placeholder={`Label (e.g. ${field.name})`}
              style={styles.smallInput}
            />

            {units.length > 0 && (
              <View style={styles.unitRow}>
                {units.map((unit) => (
                  <Pressable
                    key={unit}
                    onPress={() => updateField(sceneField.id, { unit })}
                    style={[
                      styles.unitOption,
                      (sceneField.unit ?? field.unit) === unit && styles.unitOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.unitOptionText,
                        (sceneField.unit ?? field.unit) === unit && styles.unitOptionTextSelected,
                      ]}
                    >
                      {unit}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <Text style={styles.addLabel}>Add expected value</Text>
      <View style={styles.fieldList}>
        {FIELD_LIST.map((field) => (
          <Pressable key={field.id} onPress={() => addField(field.id)} style={styles.addFieldButton}>
            <Plus size={16} color="#2563EB" />
            <Text style={styles.addFieldText}>{field.name}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.button} onPress={onSave}>
        <Save size={18} color="#fff" />
        <Text style={styles.buttonText}>Save Scene</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  back: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 10, marginBottom: 12 },
  backText: { fontSize: 16, color: "#555" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 28 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#D5D8DC", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 20 },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginTop: 4, marginBottom: 6 },
  helpText: { fontSize: 14, lineHeight: 20, color: "#666", marginBottom: 14 },
  expectedCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#D5D8DC", borderRadius: 8, padding: 12, marginBottom: 10 },
  expectedHeader: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 10 },
  expectedIndex: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#EEF2FF", textAlign: "center", lineHeight: 24, fontSize: 13, fontWeight: "700", color: "#2563EB" },
  expectedName: { flex: 1, fontSize: 16, fontWeight: "600" },
  smallInput: { backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#D5D8DC", borderRadius: 7, paddingHorizontal: 11, paddingVertical: 9, fontSize: 15, marginBottom: 10 },
  unitRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  unitOption: { borderWidth: 1, borderColor: "#D5D8DC", borderRadius: 7, paddingHorizontal: 11, paddingVertical: 7 },
  unitOptionSelected: { backgroundColor: "#EEF2FF", borderColor: "#2563EB" },
  unitOptionText: { fontSize: 14, color: "#555" },
  unitOptionTextSelected: { color: "#2563EB", fontWeight: "600" },
  addLabel: { fontSize: 14, fontWeight: "600", marginTop: 8, marginBottom: 8 },
  fieldList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 22 },
  addFieldButton: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "#C7D2FE", borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9 },
  addFieldText: { color: "#2563EB", fontSize: 14, fontWeight: "600" },
  button: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, backgroundColor: "#2563EB", marginBottom: 20 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});

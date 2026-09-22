import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text } from "react-native";

import type { SceneObservationField } from "../domain/scene/SceneObservationField";
import { getFieldById } from "../domain/field/builtInFields";

interface SceneFieldAssignmentPickerProps {
  sceneFields: SceneObservationField[];
  fieldId: string;
  selectedSceneFieldId: string | null;
  onChange: (sceneFieldId: string | null) => void;
}

export function SceneFieldAssignmentPicker({
  sceneFields,
  fieldId,
  selectedSceneFieldId,
  onChange,
}: SceneFieldAssignmentPickerProps) {
  const [visible, setVisible] = useState(false);
  const compatibleSceneFields = sceneFields.filter((field) => field.fieldId === fieldId);
  const selected = compatibleSceneFields.find((field) => field.id === selectedSceneFieldId);
  const selectedLabel = selected
    ? selected.label?.trim() || getFieldById(selected.fieldId).name
    : "Not assigned";

  return (
    <>
      <Text style={styles.label}>Scene expected value</Text>
      <Pressable style={styles.selector} onPress={() => setVisible(true)}>
        <Text style={styles.selectorText}>{selectedLabel}</Text>
        <Text style={styles.selectorHint}>Change</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modal} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Assign to expected value</Text>

            <Pressable
              style={[styles.option, selectedSceneFieldId === null && styles.selectedOption]}
              onPress={() => {
                onChange(null);
                setVisible(false);
              }}
            >
              <Text style={styles.optionTitle}>Not assigned</Text>
              <Text style={styles.optionDescription}>Keep this value outside the Scene data series.</Text>
            </Pressable>

            {compatibleSceneFields.map((sceneField) => {
              const field = getFieldById(sceneField.fieldId);
              const label = sceneField.label?.trim() || field.name;
              const unit = sceneField.unit ?? field.unit;
              return (
                <Pressable
                  key={sceneField.id}
                  style={[styles.option, selectedSceneFieldId === sceneField.id && styles.selectedOption]}
                  onPress={() => {
                    onChange(sceneField.id);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.optionTitle}>{label}</Text>
                  <Text style={styles.optionDescription}>
                    {field.name}{unit ? ` · ${unit}` : " · Unitless"}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable style={styles.cancelButton} onPress={() => setVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6, fontSize: 13, fontWeight: "600", color: "#666" },
  selector: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D5D8DC",
    borderRadius: 8,
    backgroundColor: "#FAFAFB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: { fontSize: 15, color: "#222" },
  selectorHint: { fontSize: 13, color: "#666" },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modal: {
    maxHeight: "85%",
    padding: 18,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  modalTitle: { marginBottom: 12, fontSize: 19, fontWeight: "700" },
  option: {
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E2E5",
    borderRadius: 8,
  },
  selectedOption: { borderColor: "#222", backgroundColor: "#F7F7F7" },
  optionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 3 },
  optionDescription: { fontSize: 13, color: "#666", lineHeight: 18 },
  cancelButton: { alignItems: "center", paddingVertical: 10, marginTop: 4 },
  cancelText: { fontSize: 15, fontWeight: "600", color: "#555" },
});

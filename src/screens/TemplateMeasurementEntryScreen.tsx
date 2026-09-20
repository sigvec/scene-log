import { ArrowLeft, Check } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Template } from "../domain/template/Template";
import { getFieldById } from "../domain/field/builtInFields";
import { parseDuration } from "../domain/field/duration";

interface TemplateMeasurementEntryScreenProps {
  template: Template;
  onBack: () => void;
  onSave: (values: Record<string, string>) => void;
}

function isValidValue(fieldId: string, value: string): boolean {
  if (!value.trim()) {
    return true;
  }

  const field = getFieldById(fieldId);

  if (field.valueType === "duration") {
    return parseDuration(value) !== null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue);
}

export function TemplateMeasurementEntryScreen({
  template,
  onBack,
  onSave,
}: TemplateMeasurementEntryScreenProps) {
  const fields = template.fields.map((templateField) => ({
    templateField,
    field: getFieldById(templateField.fieldId),
    unit: templateField.unit ?? getFieldById(templateField.fieldId).unit,
  }));
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  function handleSubmit() {
    const invalidField = fields.find(
      ({ field, templateField }) =>
        !isValidValue(field.id, values[templateField.id] ?? ""),
    );

    if (invalidField) {
      setError(`Enter a valid value for ${invalidField.field.name}.`);
      return;
    }

    const enteredValues = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value.trim().length > 0),
    );

    if (Object.keys(enteredValues).length === 0) {
      setError("Enter at least one measurement or go back.");
      return;
    }

    onSave(enteredValues);
  }

  function focusNext(index: number) {
    const nextInput = inputRefs.current[index + 1];

    if (nextInput) {
      nextInput.focus();
      return;
    }

    handleSubmit();
  }

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

      <Text style={styles.description}>
        Enter any of the template measurements. Empty fields are skipped, and
        you can add other measurements later.
      </Text>

      <View style={styles.fieldList}>
        {fields.map(({ templateField, field, unit }, index) => (
          <View key={templateField.id} style={styles.fieldRow}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldName}>{field.name}</Text>
              {unit && <Text style={styles.fieldUnit}>{unit}</Text>}
            </View>

            <TextInput
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              value={values[templateField.id] ?? ""}
              onChangeText={(value) => {
                setError(null);
                setValues((current) => ({ ...current, [templateField.id]: value }));
              }}
              keyboardType={
                field.valueType === "duration" ? "default" : "decimal-pad"
              }
              returnKeyType={index === fields.length - 1 ? "done" : "next"}
              blurOnSubmit={false}
              onSubmitEditing={() => focusNext(index)}
              style={styles.valueInput}
              placeholder={
                field.valueType === "duration"
                  ? "e.g. 1:30 or 1.30"
                  : "Enter value"
              }
              placeholderTextColor="#999"
              autoFocus={index === 0}
            />
          </View>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.saveButton} onPress={handleSubmit}>
        <Check size={19} strokeWidth={2.2} color="#fff" />
        <Text style={styles.saveButtonText}>Add Measurements</Text>
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
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 58,
  },
  description: {
    marginBottom: 20,
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
  },
  fieldList: {
    gap: 12,
  },
  fieldRow: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#E0E2E5",
    borderRadius: 9,
    backgroundColor: "#fff",
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: "600",
  },
  fieldUnit: {
    fontSize: 14,
    color: "#666",
  },
  valueInput: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#D5D8DC",
    borderRadius: 8,
    backgroundColor: "#FAFAFB",
    fontSize: 18,
  },
  error: {
    marginTop: 12,
    fontSize: 14,
    color: "#B42318",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 24,
    paddingVertical: 13,
    borderRadius: 9,
    backgroundColor: "#222",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

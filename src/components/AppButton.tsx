import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

interface AppButtonProps {
  children: ReactNode;
  onPress: () => void;
}

export function AppButton({ children, onPress }: AppButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#222",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

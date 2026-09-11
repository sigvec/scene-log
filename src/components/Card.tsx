import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

interface CardProps {
  children: ReactNode;
}

export function Card({ children }: CardProps) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
});

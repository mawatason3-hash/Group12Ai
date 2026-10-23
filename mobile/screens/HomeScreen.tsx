import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../App";
import { colors, radius, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.icon}>🥔</Text>
        <Text style={styles.title}>AgriSoko Pocket</Text>
        <Text style={styles.subtitle}>Meet the people behind Group G12</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        style={styles.primaryButton}
        onPress={() => navigation.navigate("Ask")}
      >
        <Text style={styles.primaryLabel}>Ask the Team</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("Directory")}
      >
        <Text style={styles.secondaryLabel}>Member Directory</Text>
      </Pressable>
      <Text style={styles.footer}>Group G12 · INES</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  hero: { alignItems: "center", marginBottom: spacing.xl },
  icon: { fontSize: 58, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 30, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 16, marginTop: spacing.sm },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  primaryLabel: { color: colors.surface, fontWeight: "700", fontSize: 16 },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  secondaryLabel: { color: colors.primaryDark, fontWeight: "700", fontSize: 16 },
  footer: { textAlign: "center", color: colors.muted, marginTop: spacing.xl },
});

import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { RootStackParamList } from "../App";
import { askAI } from "../services/api";
import { colors, radius, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Ask">;

export default function AskScreen({ navigation }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState("");

  async function submit() {
    const normalized = query.trim();
    if (!normalized) {
      setValidation("Please enter a question.");
      return;
    }
    if (normalized.length > 1000) {
      setValidation("Keep your question to 1000 characters or fewer.");
      return;
    }
    setValidation("");
    setLoading(true);
    try {
      const result = await askAI(normalized);
      navigation.navigate("Result", { result });
    } catch {
      Alert.alert(
        "Couldn't reach the AI service",
        "Check your connection and try again. You can still browse the local member directory.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What would you like to know?</Text>
      <Text style={styles.help}>Describe your question and we’ll find the most relevant team member.</Text>
      <TextInput
        accessibilityLabel="Your question"
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="e.g. Who is working on the AI API?"
        multiline
        maxLength={1001}
        textAlignVertical="top"
      />
      <Text style={styles.count}>{query.length}/1000</Text>
      {validation ? <Text style={styles.error}>{validation}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={submit}
        style={[styles.button, loading && styles.disabled]}
      >
        {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.buttonLabel}>Find a Match</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", marginBottom: spacing.sm },
  help: { color: colors.muted, fontSize: 16, lineHeight: 23, marginBottom: spacing.lg },
  input: {
    minHeight: 150,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  count: { color: colors.muted, textAlign: "right", marginTop: spacing.xs },
  error: { color: colors.error, marginTop: spacing.sm },
  button: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg },
  disabled: { opacity: 0.65 },
  buttonLabel: { color: colors.surface, fontWeight: "700", fontSize: 16 },
});

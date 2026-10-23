import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../App";
import { colors, radius, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

export default function ResultScreen({ route, navigation }: Props) {
  const { result } = route.params;
  const member = result.member;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {result.matched && member ? (
        <>
          <Text style={styles.eyebrow}>YOUR BEST MATCH</Text>
          <Text style={styles.title}>{member.fullName}</Text>
          <Text style={styles.role}>{member.role}</Text>
          <View style={styles.scoreCard}>
            <Text style={styles.score}>{Math.round(result.score * 100)}%</Text>
            <Text style={styles.scoreLabel}>match confidence</Text>
          </View>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.body}>{result.introduction ?? member.introductionDraft}</Text>
          <Text style={styles.sectionTitle}>Why this match?</Text>
          <Text style={styles.body}>{result.reason}</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.button}
            onPress={() => navigation.navigate("Profile", { memberId: member.id })}
          >
            <Text style={styles.buttonLabel}>View Full Profile</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.noMatch}>
          <Text style={styles.title}>No strong match yet</Text>
          <Text style={styles.body}>{result.reason}</Text>
          <Text style={styles.body}>Try adding more detail, or browse all five members in the directory.</Text>
          <Pressable style={styles.button} onPress={() => navigation.navigate("Directory")}>
            <Text style={styles.buttonLabel}>Browse Directory</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.lg, backgroundColor: colors.background },
  eyebrow: { color: colors.primary, fontWeight: "800", letterSpacing: 1, marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" },
  role: { color: colors.muted, fontSize: 17, marginTop: spacing.xs },
  scoreCard: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginVertical: spacing.lg },
  score: { color: colors.primary, fontSize: 34, fontWeight: "800" },
  scoreLabel: { color: colors.muted },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: spacing.md, marginBottom: spacing.sm },
  body: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  button: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg },
  buttonLabel: { color: colors.surface, fontWeight: "700", fontSize: 16 },
  noMatch: { flex: 1, justifyContent: "center" },
});

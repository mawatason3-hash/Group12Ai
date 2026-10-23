import { useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../App";
import { localMembers } from "../data/localMembers";
import { getMember, type Member } from "../services/api";
import { colors, radius, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ route }: Props) {
  const [member, setMember] = useState<Member | undefined>(
    localMembers.find((item) => item.id === route.params.memberId),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMember(route.params.memberId)
      .then((response) => { if (active) setMember(response); })
      .catch(() => { /* Keep the bundled profile available offline. */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [route.params.memberId]);

  if (loading && !member) {
    return <ActivityIndicator color={colors.primary} style={styles.loader} />;
  }
  if (!member) {
    return <View style={styles.container}><Text style={styles.title}>Profile unavailable</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarLabel}>{member.fullName.charAt(0)}</Text></View>
        <Text style={styles.title}>{member.fullName}</Text>
        <Text style={styles.role}>{member.role}</Text>
      </View>
      <ProfileField label="Introduction" value={member.introductionDraft} />
      <ProfileField label="Registration number" value={member.registrationNumber} />
      <ProfileField label="GitHub" value={member.githubUsername} />
      <ProfileField label="Skills" value={member.skills.join(" · ")} />
      <ProfileField label="Target user" value={member.targetUser} />
      <ProfileField label="Problem" value={member.problem} />
      <ProfileField label="Contribution" value={member.contribution} />
      <ProfileField label="Feature" value={member.feature} />
      <ProfileField label="Outcome metric" value={member.outcomeMetric} />
      <ProfileField label="Tester feedback" value={member.testerFeedback || "Not recorded yet."} />
      <Text style={styles.sectionTitle}>Evidence links</Text>
      {Object.entries(member.evidenceLinks).length ? Object.entries(member.evidenceLinks).map(([kind, reference]) => {
        const link = evidenceUrl(kind, reference);
        return link ? (
          <Pressable key={kind} onPress={() => void Linking.openURL(link)}>
            <Text style={styles.link}>{kind}: {reference}</Text>
          </Pressable>
        ) : (
          <Text key={kind} style={styles.value}>{kind}: {reference}</Text>
        );
      }) : <Text style={styles.value}>No evidence links added yet.</Text>}
    </ScrollView>
  );
}

function evidenceUrl(kind: string, reference: string): string | undefined {
  if (/^https?:\/\//i.test(reference)) return reference;
  if (kind === "issue" || kind === "pr") {
    const number = reference.match(/^#?(\d+)$/)?.[1];
    if (number) {
      const path = kind === "issue" ? "issues" : "pull";
      return `https://github.com/mawatason3-hash/Group12Ai/${path}/${number}`;
    }
  }
  if (kind === "commit" && /^[0-9a-f]{7,40}$/i.test(reference)) {
    return `https://github.com/mawatason3-hash/Group12Ai/commit/${reference}`;
  }
  return undefined;
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, backgroundColor: colors.background },
  loader: { flex: 1 },
  header: { alignItems: "center", marginBottom: spacing.md },
  avatar: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: "#E5F1E3", marginBottom: spacing.sm },
  avatarLabel: { color: colors.primary, fontSize: 28, fontWeight: "800" },
  title: { color: colors.text, fontSize: 26, fontWeight: "800" },
  role: { color: colors.primary, fontSize: 16, marginTop: spacing.xs },
  field: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  label: { color: colors.primary, fontWeight: "700", marginBottom: spacing.xs },
  value: { color: colors.text, lineHeight: 22 },
  sectionTitle: { color: colors.text, fontWeight: "700", fontSize: 18, marginVertical: spacing.sm },
  link: { color: colors.primary, textDecorationLine: "underline", marginBottom: spacing.sm },
});

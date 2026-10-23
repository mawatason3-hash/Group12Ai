import { useCallback, useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../App";
import { localMembers } from "../data/localMembers";
import { getMembers, type Member } from "../services/api";
import { colors, radius, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Directory">;

export default function DirectoryScreen({ navigation }: Props) {
  const [members, setMembers] = useState<Member[]>(localMembers);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMembers(await getMembers());
      setOffline(false);
    } catch {
      setMembers(localMembers);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.container}>
      {offline ? (
        <Text accessibilityRole="alert" style={styles.banner}>Offline mode · Showing saved member directory</Text>
      ) : null}
      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      <FlatList
        data={members}
        keyExtractor={(member) => member.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            style={styles.card}
            onPress={() => navigation.navigate("Profile", { memberId: item.id })}
          >
            <View style={styles.avatar}><Text style={styles.avatarLabel}>{item.fullName.charAt(0)}</Text></View>
            <View style={styles.details}>
              <Text style={styles.name}>{item.fullName}</Text>
              <Text style={styles.role}>{item.role}</Text>
              <Text style={styles.skills} numberOfLines={1}>{item.skills.join(" · ")}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  banner: { color: colors.primaryDark, backgroundColor: "#E5F1E3", padding: spacing.sm, textAlign: "center" },
  loader: { marginTop: spacing.sm },
  list: { padding: spacing.md },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#E5F1E3", marginRight: spacing.md },
  avatarLabel: { color: colors.primary, fontWeight: "800", fontSize: 18 },
  details: { flex: 1 },
  name: { color: colors.text, fontWeight: "700", fontSize: 16 },
  role: { color: colors.primary, marginTop: 2 },
  skills: { color: colors.muted, fontSize: 12, marginTop: spacing.xs },
  arrow: { color: colors.muted, fontSize: 26, paddingLeft: spacing.sm },
});

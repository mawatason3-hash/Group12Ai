import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AgriSoko Pocket GXX</Text>
      <Text style={styles.subtitle}>
        Find the right teammate and learn about their work.
      </Text>

      <Link href="/ask" style={styles.button}>
        Ask the Team
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#1B5E20',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    color: '#2E3A59',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
  },
  button: {
    backgroundColor: '#1B5E20',
    color: '#FFFFFF',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

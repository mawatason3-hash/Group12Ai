
import { useState } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type AskStatus = 'idle' | 'empty' | 'not-connected';

export default function AskScreen() {
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<AskStatus>('idle');

  function handleAsk() {
    Keyboard.dismiss();

    if (!question.trim()) {
      setStatus('empty');
      return;
    }

    setStatus('not-connected');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Ask the Team</Text>

      <Text style={styles.description}>
        Ask about a teammate by name, nickname, role, or skill.
      </Text>

      <TextInput
        value={question}
        onChangeText={(value) => {
          setQuestion(value);
          setStatus('idle');
        }}
        placeholder="e.g. Who worked on offline mode?"
        placeholderTextColor="#687386"
        multiline
        accessibilityLabel="Your question about a team member"
        style={styles.input}
        textAlignVertical="top"
      />

      <Pressable
        accessibilityRole="button"
        onPress={handleAsk}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonText}>Ask Question</Text>
      </Pressable>

      {status === 'empty' && (
        <Text style={styles.error} accessibilityRole="alert">
          Please enter a question first.
        </Text>
      )}

      {status === 'not-connected' && (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>
            Team service not connected yet
          </Text>
          <Text style={styles.noticeText}>
            Your question is ready, but we need the team&apos;s API connection
            before we can retrieve a verified answer.
          </Text>
        </View>
      )}

      <View style={styles.tip}>
        <Text style={styles.tipTitle}>Try asking</Text>
        <Text style={styles.tipText}>• Who built offline mode?</Text>
        <Text style={styles.tipText}>• Tell me about a team member.</Text>
        <Text style={styles.tipText}>• Who worked on navigation?</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  heading: {
    color: '#1B5E20',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#2E3A59',
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 20,
  },
  input: {
    minHeight: 125,
    backgroundColor: '#FFFFFF',
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: '#2E3A59',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1B5E20',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: '#B3261E',
    marginTop: 12,
    fontSize: 14,
  },
  notice: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#B3261E',
  },
  noticeTitle: {
    color: '#2E3A59',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noticeText: {
    color: '#2E3A59',
    fontSize: 14,
    lineHeight: 21,
  },
  tip: {
    marginTop: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  tipTitle: {
    color: '#1B5E20',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tipText: {
    color: '#2E3A59',
    fontSize: 14,
    lineHeight: 24,
  },
});

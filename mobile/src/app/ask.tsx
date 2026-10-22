
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

type Data = Record<string, unknown>;

type Status = 'idle' | 'loading' | 'success' | 'no-match' | 'error';

type AskResult = {
  member: Data;
  confidence: string;
  reason: string;
  introduction: string;
  evidenceLinks: string[];
  source: 'Live API' | 'Offline match';
};

const MEMBERS_KEY = '@agrisoko/approved-members-v1';
const LAST_RESULT_KEY = '@agrisoko/last-result-v1';
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 10000;
const MAX_QUESTION_LENGTH = 300;

function asData(value: unknown): Data | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Data;
  }
  return null;
}

function asText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }
  return '';
}


function textList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(asText).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function memberName(member: Data): string {
  return (
    asText(member.fullName) ||
    asText(member.full_name) ||
    asText(member.name) ||
    asText(member.displayName) ||
    asText(member.display_name) ||
    'Team member'
  );
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMembers(payload: unknown): Data[] {
  if (Array.isArray(payload)) {
    return payload.map(asData).filter((item): item is Data => item !== null);
  }

  const data = asData(payload);
  if (!data) return [];

  for (const key of ['members', 'results', 'data', 'items']) {
    const value = data[key];

    if (Array.isArray(value)) {
      return value.map(asData).filter((item): item is Data => item !== null);
    }

    const nested = asData(value);
    if (nested && Array.isArray(nested.members)) {
      return nested.members
        .map(asData)
        .filter((item): item is Data => item !== null);
    }
  }

  return [];
}

function findOfflineMember(question: string, members: Data[]): Data | null {
  let query = normalize(question);

  query = query
    .replace(/^(please\s+)?(tell me about|who is|who built|who created|who worked on|find|about)\s+/, '')
    .replace(/[?.!]+$/g, '')
    .trim();

  if (!query) return null;

  for (const member of members) {
    const names = [
      memberName(member),
      ...textList(member.aliases),
      ...textList(member.nicknames),
      ...textList(member.nickname),
    ];

    const roles = [
      asText(member.role),
      asText(member.title),
      ...textList(member.roles),
    ];

    const skills = [
      ...textList(member.skills),
      ...textList(member.expertise),
      ...textList(member.responsibilities),
      ...textList(member.features),
      ...textList(member.contributions),
    ];

    const exactValues = [...names, ...roles, ...skills]
      .map(normalize)
      .filter(Boolean);

    if (exactValues.includes(query)) {
      return member;
    }
  }

  return null;
}

function extractLinks(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return values
    .map((item) => {
      if (typeof item === 'string') return item.trim();

      const data = asData(item);
      if (!data) return '';

      return (
        asText(data.url) ||
        asText(data.href) ||
        asText(data.link)
      );
    })
    .filter((url) => /^https?:\/\//i.test(url));
}

async function requestJson(
  path: string,
  options: RequestInit = {},
): Promise<Data> {
  if (!API_BASE_URL) {
    throw new Error('The API URL has not been configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`The server returned HTTP ${response.status}.`);
    }

    const json: unknown = await response.json();
    const data = asData(json);

    if (!data) {
      throw new Error('The server returned an unexpected response.');
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function createOfflineResult(member: Data): AskResult {
  return {
    member,
    confidence: 'Exact local match',
    reason: 'Matched an approved name, nickname, role, or skill saved on this device.',
    introduction:
      asText(member.introductionDraft) ||
      asText(member.introduction) ||
      asText(member.contribution) ||
      asText(member.bio) ||
      'No approved introduction is available offline.',
    evidenceLinks: extractLinks(
      member.evidenceLinks ?? member.evidence_links ?? member.links,
    ),
    source: 'Offline match',
  };
}

export default function AskScreen() {
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<AskResult | null>(null);
  const [members, setMembers] = useState<Data[]>([]);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function initialise() {
      try {
        const cached = await AsyncStorage.getItem(MEMBERS_KEY);
        if (cached) {
          const parsed: unknown = JSON.parse(cached);
          if (active && Array.isArray(parsed)) {
            setMembers(
              parsed
                .map(asData)
                .filter((item): item is Data => item !== null),
            );
          }
        }

        const savedResult = await AsyncStorage.getItem(LAST_RESULT_KEY);
        if (savedResult && active) {
          const parsedResult: unknown = JSON.parse(savedResult);
          const saved = asData(parsedResult);

          if (saved && asData(saved.member)) {
            setResult(saved as unknown as AskResult);
          }
        }
      } catch {
        // A missing or invalid local cache should not stop the screen.
      }
    }

    void initialise();

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (active) {
        setIsOnline(state.isConnected === true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function loadApprovedMembers(): Promise<Data[]> {
    if (!API_BASE_URL) return members;

    const payload = await requestJson('/members');
    const fetchedMembers = extractMembers(payload);

    if (fetchedMembers.length > 0) {
      setMembers(fetchedMembers);
      await AsyncStorage.setItem(
        MEMBERS_KEY,
        JSON.stringify(fetchedMembers),
      );
      return fetchedMembers;
    }

    return members;
  }

  async function handleAsk() {
    const cleanQuestion = question.trim().slice(0, MAX_QUESTION_LENGTH);

    if (!cleanQuestion) {
      setErrorMessage('Please enter a question first.');
      setStatus('error');
      return;
    }

    Keyboard.dismiss();
    setStatus('loading');
    setErrorMessage('');

    let availableMembers = members;

    try {
      const network = await NetInfo.fetch();
      const online = network.isConnected === true;
      setIsOnline(online);

      if (!online || !API_BASE_URL) {
        const offlineMember = findOfflineMember(
          cleanQuestion,
          availableMembers,
        );

        if (offlineMember) {
          const offlineResult = createOfflineResult(offlineMember);
          setResult(offlineResult);
          setStatus('success');
          await AsyncStorage.setItem(
            LAST_RESULT_KEY,
            JSON.stringify(offlineResult),
          );
        } else {
          setStatus('no-match');
          setErrorMessage(
            !online
              ? 'No exact offline match was found. Connect to the internet and try again.'
              : 'The API is not configured yet, and no exact offline match was found.',
          );
        }

        return;
      }

      try {
        availableMembers = await loadApprovedMembers();
      } catch {
        // The Ask endpoint may still work if the directory endpoint fails.
      }

      const payload = await requestJson('/ask', {
        method: 'POST',
        body: JSON.stringify({ question: cleanQuestion }),
      });

      const candidate =
        payload.topMatch ??
        payload.top_match ??
        payload.match ??
        payload.member ??
        payload.profile;

      let matchedMember: Data | null = asData(candidate);

      if (!matchedMember && typeof candidate === 'string') {
        const candidateName = normalize(candidate);

        matchedMember =
          availableMembers.find(
            (member) => normalize(memberName(member)) === candidateName,
          ) ?? null;
      }

      const nested = matchedMember
        ? asData(matchedMember.member)
        : null;

      if (nested) matchedMember = nested;

      if (
        payload.matched === false ||
        payload.noMatch === true ||
        payload.no_match === true ||
        !matchedMember
      ) {
        setStatus('no-match');
        setErrorMessage(
          asText(payload.message) ||
            'No matching team member was found for that question.',
        );
        return;
      }

      const member = matchedMember;
      const confidenceValue = payload.confidence ?? member.confidence;

      const reason =
        asText(payload.reason) ||
        asText(payload.matchedTerms) ||
        asText(payload.matched_terms) ||
        'The service did not provide a match explanation.';

      const apiResult: AskResult = {
        member,
        confidence:
          typeof confidenceValue === 'number'
            ? `${(confidenceValue * 100).toFixed(1)}%`
            : asText(confidenceValue) || 'Not provided',
        reason,
        introduction:
          asText(payload.introduction) ||
          asText(member.introductionDraft) ||
          asText(member.introduction) ||
          asText(member.contribution) ||
          asText(member.bio) ||
          'No approved introduction was provided.',
        evidenceLinks: extractLinks(
          payload.evidenceLinks ??
            payload.evidence_links ??
            member.evidenceLinks ??
            member.evidence_links ??
            member.links,
        ),
        source: 'Live API',
      };

      setResult(apiResult);
      setStatus('success');

      await AsyncStorage.setItem(
        LAST_RESULT_KEY,
        JSON.stringify(apiResult),
      );
    } catch (error) {
      const offlineMember = findOfflineMember(
        cleanQuestion,
        availableMembers,
      );

      if (offlineMember) {
        const offlineResult = createOfflineResult(offlineMember);
        setResult(offlineResult);
        setStatus('success');

        await AsyncStorage.setItem(
          LAST_RESULT_KEY,
          JSON.stringify(offlineResult),
        );
      } else {
        setStatus('error');
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.',
        );
      }
    }
  }

  function clearQuestion() {
    setQuestion('');
    setStatus('idle');
    setErrorMessage('');
    setResult(null);
  }

  const member = result?.member;
  const name = member ? memberName(member) : '';
  const role = member
    ? asText(member.role) || asText(member.title)
    : '';
  const skills = member
    ? textList(member.skills ?? member.expertise)
    : [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Ask the Team</Text>
      <Text style={styles.subtitle}>
        Ask a question to find the teammate whose work best matches it.
      </Text>

      <View style={styles.connectionRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isOnline ? '#2E7D32' : '#B7791F' },
          ]}
        />
        <Text style={styles.connectionText}>
          {isOnline === null
            ? 'Checking connection…'
            : isOnline
              ? 'Internet connection available'
              : 'Offline mode'}
        </Text>
      </View>

      <Text style={styles.label}>Your question</Text>
      <TextInput
        style={styles.input}
        value={question}
        onChangeText={setQuestion}
        placeholder="e.g. Who built offline mode?"
        placeholderTextColor="#718096"
        multiline
        maxLength={MAX_QUESTION_LENGTH}
        editable={status !== 'loading'}
        returnKeyType="default"
        accessibilityLabel="Ask a question about a team member"
      />

      <Text style={styles.characterCount}>
        {question.length}/{MAX_QUESTION_LENGTH}
      </Text>

      <Pressable
        style={[
          styles.primaryButton,
          status === 'loading' && styles.disabledButton,
        ]}
        onPress={() => void handleAsk()}
        disabled={status === 'loading'}
        accessibilityRole="button"
      >
        {status === 'loading' ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Find teammate</Text>
        )}
      </Pressable>

      {question.length > 0 && status !== 'loading' && (
        <Pressable
          style={styles.clearButton}
          onPress={clearQuestion}
          accessibilityRole="button"
        >
          <Text style={styles.clearButtonText}>Clear question</Text>
        </Pressable>
      )}

      {status === 'loading' && (
        <View style={styles.messageCard}>
          <ActivityIndicator size="small" color="#1B5E20" />
          <Text style={styles.messageText}>Looking for the best match…</Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not complete the search</Text>
          <Text style={styles.errorText}>
            {errorMessage || 'Please check your connection and try again.'}
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => void handleAsk()}
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {status === 'no-match' && (
        <View style={styles.messageCard}>
          <Text style={styles.resultTitle}>No match found</Text>
          <Text style={styles.messageText}>
            {errorMessage ||
              'Try using a team member’s approved name, nickname, role, or skill.'}
          </Text>
        </View>
      )}

      {status === 'success' && result && member && (
        <View style={styles.resultCard}>
          <Text style={styles.resultEyebrow}>BEST MATCH</Text>
          <Text style={styles.resultTitle}>{name}</Text>

          {role ? <Text style={styles.roleText}>{role}</Text> : null}

          <View style={styles.sourcePill}>
            <Text style={styles.sourceText}>{result.source}</Text>
          </View>

          <Text style={styles.sectionTitle}>Profile</Text>
          <Text style={styles.bodyText}>{result.introduction}</Text>

          {skills.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Skills and responsibilities</Text>
              <View style={styles.skillList}>
                {skills.map((skill, index) => (
                  <View key={`${skill}-${index}`} style={styles.skillPill}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Match confidence</Text>
          <Text style={styles.bodyText}>{result.confidence}</Text>

          <Text style={styles.sectionTitle}>Why this match?</Text>
          <Text style={styles.bodyText}>{result.reason}</Text>

          {result.evidenceLinks.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Evidence links</Text>
              {result.evidenceLinks.map((url, index) => (
                <Pressable
                  key={`${url}-${index}`}
                  onPress={() => void Linking.openURL(url)}
                  accessibilityRole="link"
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>{url}</Text>
                </Pressable>
              ))}
            </>
          )}
        </View>
      )}

      <Text style={styles.footer}>
        Results depend on the approved team data available to the app. Offline
        search only checks exact saved names, nicknames, roles, and skills.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: '#2E3A59',
    marginBottom: 18,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 8,
  },
  connectionText: {
    color: '#2E3A59',
    fontSize: 13,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E3A59',
    marginBottom: 8,
  },
  input: {
    minHeight: 105,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B7D6B9',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    lineHeight: 22,
    color: '#243047',
    textAlignVertical: 'top',
  },
  characterCount: {
    alignSelf: 'flex-end',
    color: '#64748B',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 14,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    alignSelf: 'center',
    padding: 12,
  },
  clearButtonText: {
    color: '#1B5E20',
    fontWeight: '600',
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
  },
  messageText: {
    color: '#2E3A59',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FDECEC',
    borderColor: '#E5A3A3',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#B3261E',
    marginBottom: 8,
  },
  errorText: {
    color: '#7F1D1D',
    fontSize: 14,
    lineHeight: 21,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#B3261E',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#C9E3CB',
  },
  resultEyebrow: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 5,
  },
  roleText: {
    color: '#2E3A59',
    fontSize: 15,
    marginBottom: 12,
  },
  sourcePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  sourceText: {
    color: '#1B5E20',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#2E3A59',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 6,
  },
  bodyText: {
    color: '#364152',
    fontSize: 14,
    lineHeight: 22,
  },
  skillList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillPill: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  skillText: {
    color: '#1B5E20',
    fontSize: 13,
  },
  linkButton: {
    paddingVertical: 7,
  },
  linkText: {
    color: '#1565C0',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  footer: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 24,
  },
});

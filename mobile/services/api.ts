import axios from "axios";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export const api = axios.create({ baseURL: API_URL, timeout: 8000 });

export type Member = {
  id: string;
  fullName: string;
  registrationNumber: string;
  aliases: string[];
  githubUsername: string;
  role: string;
  skills: string[];
  targetUser: string;
  problem: string;
  contribution: string;
  feature: string;
  outcomeMetric: string;
  evidenceLinks: Record<string, string>;
  testerFeedback: string;
  introductionDraft: string;
};

export type AskResult = {
  matched: boolean;
  score: number;
  threshold: number;
  member?: Member;
  introduction?: string;
  reason: string;
};

export async function askAI(query: string): Promise<AskResult> {
  const response = await api.post<AskResult>("/ask", { query });
  return response.data;
}

export async function getMembers(): Promise<Member[]> {
  const response = await api.get<Member[]>("/members");
  return response.data;
}

export async function getMember(id: string): Promise<Member> {
  const response = await api.get<Member>(`/members/${encodeURIComponent(id)}`);
  return response.data;
}

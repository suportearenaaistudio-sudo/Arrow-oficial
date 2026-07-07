export interface WeeklyTokenUsage {
  weekStart: string;
  tokensIn: number;
  tokensOut: number;
  tokensTotal: number;
  requestCount: number;
}

export interface AISettings {
  configured: boolean;
  maskedKey?: string;
  model?: string;
  personalContext?: string;
  weeklyUsage: WeeklyTokenUsage;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_name?: string | null;
  tokens_in?: number;
  tokens_out?: number;
  created_at: string;
}

export interface ContextStats {
  estimatedTokens: number;
  charCount: number;
  maxTokens: number;
  maxChars: number;
  truncated: boolean;
}

export interface SendMessageResult {
  status: 'completed' | 'pending_confirmation' | 'cancelled';
  text?: string | null;
  tokensIn: number;
  tokensOut: number;
  weeklyUsage: WeeklyTokenUsage;
  contextStats?: Partial<ContextStats>;
  pendingId?: string | null;
  pendingTool?: string | null;
  pendingPreview?: string | null;
  affectedQueries?: string[];
  userMessageId?: string;
  assistantMessageId?: string | null;
}

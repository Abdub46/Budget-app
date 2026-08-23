import OpenAI from 'openai';
import type { FinancialContext } from '@/lib/ai-context';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!process.env.AI_API_KEY) {
    throw new Error(
      'AI_API_KEY is not configured. Add it to your .env.local file to enable the AI Financial Assistant.'
    );
  }
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_API_BASE_URL || undefined,
    });
  }
  return client;
}

function buildSystemPrompt(context: FinancialContext): string {
  return `You are the AI Financial Assistant inside a personal budgeting app. You help the user understand their OWN budgeting and spending data.

STRICT RULES:
- You are a budgeting and financial-analysis assistant, NOT a regulated financial advisor. Never present yourself as one.
- Answer ONLY using the FINANCIAL_DATA JSON provided below. Never invent, estimate, or guess a number that isn't derivable from it.
- If the data needed to answer isn't present in FINANCIAL_DATA, say so plainly and suggest what the user could check in the Budget or Dashboard pages instead of making something up.
- When you mention money, format it using the user's currency: ${context.currency}.
- When discussing investments, clearly separate the user's OWN recorded investment activity (from FINANCIAL_DATA) from any general educational information you provide. Never present speculative outcomes as guaranteed.
- Be concise and conversational. Prefer short paragraphs or a short bulleted list over long essays.
- You may explain calculations (e.g. how a percentage change was derived) but always tie the explanation back to the real figures in FINANCIAL_DATA.

FINANCIAL_DATA (this user's data only, already aggregated for you):
${JSON.stringify(context)}
`;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function getAssistantReply(
  messages: ChatMessage[],
  context: FinancialContext
): Promise<string> {
  const openai = getClient();
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: 'system', content: buildSystemPrompt(context) }, ...messages],
    temperature: 0.3,
    max_tokens: 700,
  });

  return completion.choices[0]?.message?.content?.trim() || "I couldn't generate a response — please try rephrasing your question.";
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import ChatMessageBubble, { type ChatMessageData } from '@/components/assistant/ChatMessageBubble';
import SuggestedQuestions from '@/components/assistant/SuggestedQuestions';
import InsightsPanel from '@/components/assistant/InsightsPanel';
import { Button } from '@/components/ui/Button';

export default function AssistantClient() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const nextMessages: ChatMessageData[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'The assistant could not respond.');
        setMessages(messages); // roll back the optimistic user message context isn't lost, just don't add a reply
        return;
      }

      setMessages([...nextMessages, { role: 'assistant', content: result.reply }]);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Financial Assistant
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Ask questions about your budgets, expenses, and spending trends. It analyzes your
          own data — it&apos;s a budgeting assistant, not a licensed financial advisor.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col rounded-2xl border border-border bg-card overflow-hidden h-[70vh]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <Sparkles className="h-6 w-6" />
                </span>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask me anything about your finances — try one of these:
                </p>
                <SuggestedQuestions onSelect={sendMessage} />
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <ChatMessageBubble key={i} role={m.role} content={m.content} />
                ))}
                {isSending && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pl-10">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Thinking…
                  </div>
                )}
              </>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="border-t border-border p-3 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your budget, spending, or savings…"
              className="flex-1 h-11 rounded-lg border border-input bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="submit" size="icon" isLoading={isSending} disabled={!input.trim()}>
              {!isSending && <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 h-fit">
          <h2 className="text-sm font-semibold text-foreground mb-3">Insights for you</h2>
          <InsightsPanel />
        </div>
      </div>
    </div>
  );
}

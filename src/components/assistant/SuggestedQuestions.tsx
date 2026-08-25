'use client';

const SUGGESTIONS = [
  'Can I afford this?',
  'How much can I spend this week?',
  'Am I overspending?',
  'Why did my budget change?',
  'How much should I save?',
  'How can I reduce my expenses?',
];

export default function SuggestedQuestions({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTIONS.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          {q}
        </button>
      ))}
    </div>
  );
}

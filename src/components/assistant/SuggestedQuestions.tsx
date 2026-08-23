'use client';

const SUGGESTIONS = [
  'Where am I spending most of my money?',
  'Am I within my budget?',
  'Did I spend more this month than last month?',
  'Which category should I watch?',
  'How much have I saved this year?',
  'Give me a summary of my financial performance.',
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

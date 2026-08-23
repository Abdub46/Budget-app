'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

export default function InsightsPanel() {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/assistant/insights')
      .then((res) => res.json())
      .then((data) => setInsights(data.insights ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add a budget and a few expenses to start seeing personalized insights here.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {insights.map((insight, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          className="flex items-start gap-2.5 rounded-lg bg-muted/60 px-3 py-2.5 text-sm text-foreground"
        >
          <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <span>{insight}</span>
        </motion.li>
      ))}
    </ul>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessageData {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatMessageBubble({ role, content }: ChatMessageData) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex items-start gap-2.5', isUser && 'flex-row-reverse')}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </span>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm'
        )}
      >
        {content}
      </div>
    </motion.div>
  );
}

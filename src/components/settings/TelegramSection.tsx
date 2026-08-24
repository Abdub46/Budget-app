'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';
import SettingsSection from '@/components/settings/SettingsSection';



interface TelegramSectionProps {
  enabled: boolean;
  hasBotToken: boolean;
  chatId?: string | null;
}

export default function TelegramSection({
  enabled: initialEnabled,
  hasBotToken,
  chatId: initialChatId,
}: TelegramSectionProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [tokenSaved, setTokenSaved] = useState(hasBotToken);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [chatId, setChatId] = useState(initialChatId ?? '');
  const [savedChatId, setSavedChatId] = useState(initialChatId ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const hasUnsavedChanges =
    botTokenInput.trim() !== '' ||
    chatId.trim() !== savedChatId.trim();

  const canEnable =
    tokenSaved && savedChatId.trim().length > 0;

  const canTest = canEnable && !hasUnsavedChanges;






  const handleSave = async () => {
    setIsSaving(true);
    try {
      const body: { botToken?: string; chatId?: string } = {};
      // Only send the token if the user actually typed a new one — an
      // untouched, blank field means "leave the saved token as-is".
      if (botTokenInput.trim()) body.botToken = botTokenInput.trim();
      body.chatId = chatId.trim();

      const res = await fetch('/api/settings/telegram', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Could not save Telegram settings.');
        return;
      }
      if (body.botToken) {
        setTokenSaved(true);
        setBotTokenInput('');
      }
      setSavedChatId(body.chatId ?? '');
      toast.success('Telegram settings saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    if (value && !canEnable) {
      toast.error('Add your bot token and chat ID, then save, before enabling reminders.');
      return;
    }
    const previous = enabled;
    setEnabled(value);
    const res = await fetch('/api/settings/telegram', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: value }),
    });
    if (!res.ok) {
      setEnabled(previous);
      const result = await res.json().catch(() => null);
      toast.error(result?.error || 'Could not update this setting.');
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/settings/telegram/test', { method: 'POST' });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Could not send the test message.');
        return;
      }
      toast.success('Test message sent — check Telegram.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <SettingsSection
      title="Telegram Reminders"
      description="Get a Telegram message if your expenses haven't been updated in 24 hours."
    >
      <div className="space-y-4">
        <Input
          label="Bot token"
          type="password"
          autoComplete="off"
          value={botTokenInput}
          onChange={(e) => setBotTokenInput(e.target.value)}
          placeholder={tokenSaved ? '•••••••••••• (saved — enter a new one to replace)' : 'e.g. 123456789:AAExampleTokenFromBotFather'}
          hint="Create a bot with @BotFather on Telegram to get a token."
        />
        <Input
          label="Chat ID"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          placeholder="e.g. 123456789"
          hint="Message @userinfobot on Telegram to find your chat ID."
        />

        <div className="flex flex-wrap items-center justify-end gap-2">
          {hasUnsavedChanges && (
            <p className="mr-auto text-xs text-muted-foreground">Save before sending a test.</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            isLoading={isTesting}
            disabled={!canTest}
          >
            <Send className="h-3.5 w-3.5" />
            Send test message
          </Button>
          <Button size="sm" onClick={handleSave} isLoading={isSaving}>
            Save
          </Button>
        </div>

        <div className="border-t border-border pt-1">
          <Toggle
            checked={enabled}
            onChange={handleToggle}
            label="Enable reminders"
            description="Notify me on Telegram if I haven't logged an expense in the last 24 hours."
          />
        </div>
      </div>
    </SettingsSection>
  );
}
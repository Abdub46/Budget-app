'use client';

import { createContext, useContext, useState } from 'react';

interface AvatarContextValue {
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
}

const AvatarContext = createContext<AvatarContextValue | null>(null);

export function AvatarProvider({
  initialAvatar,
  children,
}: {
  initialAvatar: string | null;
  children: React.ReactNode;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);
  return (
    <AvatarContext.Provider value={{ avatarUrl, setAvatarUrl }}>
      {children}
    </AvatarContext.Provider>
  );
}

/** Returns the current avatar plus a setter — used by Sidebar/MobileTopBar to
 * display it, and by AvatarSection to update it in place after a save. */
export function useAvatar(): AvatarContextValue {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error('useAvatar must be used within an AvatarProvider');
  return ctx;
}
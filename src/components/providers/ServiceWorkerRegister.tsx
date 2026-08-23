'use client';

import { useEffect } from 'react';

/**
 * Registers /sw.js for PWA offline support. Renders nothing — this is a
 * side-effect-only component, mounted once at the root layout.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Skip in local dev by default — a stale cached service worker is a
    // common source of "why isn't my change showing up" confusion while
    // iterating. Registers in every other environment (staging, prod).
    if (process.env.NODE_ENV === 'development') return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err);
      });
    });
  }, []);

  return null;
}
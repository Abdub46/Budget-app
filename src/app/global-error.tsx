'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 380, textAlign: 'center' }}>
            <h1 style={{ fontSize: 18, fontWeight: 600 }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
              An unexpected error occurred. Please try reloading the page.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: 20,
                padding: '10px 18px',
                borderRadius: 8,
                background: '#2563eb',
                color: 'white',
                border: 'none',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

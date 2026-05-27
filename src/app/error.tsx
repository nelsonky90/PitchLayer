'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 text-center">
      <h2 className="text-2xl font-bold">Something went wrong</h2>
      <p className="text-slate">{error.message || 'An unexpected error occurred.'}</p>
      <button onClick={reset} className="btn">
        Try again
      </button>
    </div>
  );
}

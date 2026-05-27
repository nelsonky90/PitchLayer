'use client';

import { useState } from 'react';

export default function CopyEmailButton({ subject, body }: { subject: string; body: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="text-xs px-3 py-1 rounded bg-signal text-white hover:bg-signal/80"
    >
      {copied ? 'Copied!' : 'Copy email'}
    </button>
  );
}

'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useState } from 'react';
import { Pitch } from '@/types/pitch';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getCsrfToken() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/csrf-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export default function SavedPitchesList() {
  const { data, error, mutate } = useSWR('/api/pitches', fetcher);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pitch? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await fetch(`/api/pitches/${id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': getCsrfToken() }
      });
      mutate();
    } finally {
      setDeleting(null);
    }
  };

  if (error) return <p className="text-red-600">Failed to load pitches.</p>;
  if (!data) return <p className="text-slate">Loading…</p>;

  const pitches: Pitch[] = data.pitches ?? [];

  if (pitches.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-slate text-lg">No pitches yet.</p>
        <Link href="/pitch/new" className="btn">Create your first pitch</Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {pitches.map((pitch) => (
        <div key={pitch.id} className="card p-4 space-y-3">
          <div>
            <h3 className="text-lg font-semibold">{pitch.company}</h3>
            <p className="text-sm text-slate line-clamp-2">{pitch.opportunity}</p>
            <p className="text-xs text-slate mt-1">
              {new Date(pitch.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/pitch/${pitch.id}`} className="btn text-sm py-1 px-3">
              Open
            </Link>
            <button
              onClick={() => handleDelete(pitch.id)}
              disabled={deleting === pitch.id}
              className="text-sm px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting === pitch.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

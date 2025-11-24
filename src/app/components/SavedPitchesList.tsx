'use client';

import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SavedPitchesList() {
  const { data, error } = useSWR('/api/pitches', fetcher);
  if (error) return <p className="text-red-600">Failed to load pitches</p>;
  if (!data) return <p>Loading...</p>;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {data.pitches?.map((pitch: any) => (
        <div key={pitch.id} className="card p-4 space-y-2">
          <h3 className="text-lg font-semibold">{pitch.company}</h3>
          <p className="text-sm text-slate">{pitch.opportunity}</p>
          <Link href={`/pitch/${pitch.id}`} className="btn">Open</Link>
        </div>
      ))}
    </div>
  );
}

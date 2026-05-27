'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Persona } from '@/types/pitch';
import PersonaCard from './PersonaCard';
import PersonaEditor from './PersonaEditor';
import PDFExport from './PDFExport';
import SlidesExport from './SlidesExport';

export default function PitchView({
  pitchId,
  company,
  opportunity,
  initialPersonas
}: {
  pitchId: string;
  company: string;
  opportunity: string;
  initialPersonas: Persona[];
}) {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const updatePersona = (i: number, next: Persona) =>
    setPersonas((prev) => prev.map((p, idx) => (idx === i ? next : p)));

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/pitches/${pitchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_output: { personas } })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setStatus('Saved');
      setEditing(false);
      router.refresh();
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{company}</h1>
          <p className="text-slate">{opportunity}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <button onClick={save} disabled={saving} className="btn">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                onClick={() => {
                  setPersonas(initialPersonas);
                  setEditing(false);
                  setStatus(null);
                }}
                className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn">
                Edit
              </button>
              <Link
                href={{ pathname: '/pitch/new', query: { from: pitchId } }}
                className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50"
              >
                Duplicate for new persona
              </Link>
              <PDFExport personas={personas} pitchId={pitchId} />
              <SlidesExport personas={personas} />
            </>
          )}
        </div>
      </div>

      {status && <p className="text-sm text-slate">{status}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {personas.map((persona, i) =>
          editing ? (
            <PersonaEditor key={i} persona={persona} onChange={(next) => updatePersona(i, next)} />
          ) : (
            <PersonaCard key={persona.name || i} persona={persona} />
          )
        )}
      </div>
    </div>
  );
}

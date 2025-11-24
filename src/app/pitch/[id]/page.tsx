import PersonaCard from '@/app/components/PersonaCard';
import PDFExport from '@/app/components/PDFExport';
import SlidesExport from '@/app/components/SlidesExport';
import { Persona } from '@/types/pitch';

async function getPitch(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/pitches/${id}`, {
    cache: 'no-store'
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function PitchDetailPage({ params }: { params: { id: string } }) {
  const pitch = await getPitch(params.id);
  if (!pitch) {
    return <p>Pitch not found.</p>;
  }
  const personas = (pitch.ai_output?.personas || []) as Persona[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{pitch.company}</h1>
          <p className="text-slate">{pitch.opportunity}</p>
        </div>
        <div className="flex gap-2">
          <PDFExport personas={personas} pitchId={pitch.id} />
          <SlidesExport personas={personas} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {personas.map((persona: Persona) => (
          <PersonaCard key={persona.name} persona={persona} />
        ))}
      </div>
    </div>
  );
}

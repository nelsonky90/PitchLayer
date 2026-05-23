import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/db';
import PersonaCard from '@/components/PersonaCard';
import PDFExport from '@/components/PDFExport';
import SlidesExport from '@/components/SlidesExport';
import { Persona } from '@/types/pitch';

async function getPitch(id: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('pitches')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();
  return data;
}

export default async function PitchDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');

  const pitch = await getPitch(params.id, session.user.id);
  if (!pitch) {
    return <p>Pitch not found.</p>;
  }
  const personas = ((pitch.ai_output as Record<string, unknown>)?.personas || []) as Persona[];
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

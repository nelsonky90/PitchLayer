import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/db';
import PitchView from '@/components/PitchView';
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
  if (!pitch) return <p>Pitch not found.</p>;

  const output = pitch.ai_output as Record<string, unknown>;
  const personas = (output?.personas || []) as Persona[];
  const recipientName = (output?.recipient_name as string) || '';
  const recipientJobTitle = (output?.recipient_job_title as string) || '';
  const logoUrl = (output?.logo_url as string) || null;

  return (
    <PitchView
      pitchId={pitch.id}
      company={pitch.company}
      opportunity={pitch.opportunity}
      recipientName={recipientName}
      recipientJobTitle={recipientJobTitle}
      logoUrl={logoUrl}
      initialPersonas={personas}
    />
  );
}

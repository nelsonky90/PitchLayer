import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/db';
import PitchForm from '@/components/PitchForm';

async function getSource(id: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('pitches')
    .select('company, opportunity, pain_points, benefits')
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();
  return data;
}

export default async function NewPitchPage({
  searchParams
}: {
  searchParams: { from?: string };
}) {
  const session = await getServerSession(authOptions);
  let prefill: { company: string; opportunity: string; pain_points: string; benefits: string } | null = null;

  if (searchParams.from && session?.user?.id) {
    prefill = await getSource(searchParams.from, session.user.id);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">New Pitch</h1>
      <p className="text-slate">
        {prefill
          ? `Duplicating context from ${prefill.company}. Enter the new persona(s) you want to target.`
          : 'Craft persona-specific internal pitch content for your champions.'}
      </p>
      <PitchForm initialValues={prefill ?? undefined} />
    </div>
  );
}

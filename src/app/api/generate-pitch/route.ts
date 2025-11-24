import { NextResponse } from 'next/server';
import { pitchSchema } from '@/lib/validation';
import { generatePitchContent } from '@/lib/openai';
import { supabaseAdmin } from '@/lib/db';
import { rateLimit } from '@/utils/rateLimit';
import { verifyCsrf } from '@/utils/csrf';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    verifyCsrf();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rate = rateLimit(session.user.id);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    const body = await request.json();
    const parsed = pitchSchema.parse(body);

    const prompt = `You are a Senior Product Marketing Manager.
Generate persona-based internal pitch content.

Input:
Company: ${parsed.company}
Opportunity: ${parsed.opportunity}
Personas: ${parsed.personas.join(', ')}
Pain Points: ${parsed.pain_points}
Benefits: ${parsed.benefits}

Return JSON: ...`;

    const aiResponse = await generatePitchContent(prompt);
    let aiJson: unknown;
    try {
      aiJson = JSON.parse(aiResponse);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 });
    }

    const pitchId = (aiJson as any)?.pitch_id || randomUUID();
    await supabaseAdmin.from('pitches').insert({
      id: pitchId,
      user_id: session.user.id,
      company: parsed.company,
      opportunity: parsed.opportunity,
      personas: parsed.personas,
      pain_points: parsed.pain_points,
      benefits: parsed.benefits,
      ai_output: aiJson
    });

    return NextResponse.json({ pitch_id: pitchId, ai_output: aiJson });
  } catch (error: any) {
    console.error('generate-pitch error', { message: error.message });
    if (process.env.SLACK_WEBHOOK_URL) {
      fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `500 in generate-pitch: ${error.message}` })
      }).catch(() => {});
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

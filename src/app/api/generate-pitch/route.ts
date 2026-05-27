import { NextResponse } from 'next/server';
import { z } from 'zod';
import { pitchSchema, personaSchema } from '@/lib/validation';
import { generatePitchContent } from '@/lib/openai';
import { supabaseAdmin } from '@/lib/db';
import { rateLimit } from '@/utils/rateLimit';
import { verifyCsrf } from '@/utils/csrf';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { randomUUID } from 'crypto';

const aiOutputSchema = z.object({
  personas: z.array(personaSchema).min(1)
});

export async function POST(request: Request) {
  try {
    verifyCsrf();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rate = rateLimit(session.user.id);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = pitchSchema.parse(body);

    const prompt = `Generate persona-based internal sales pitch content for a sales champion.

Company: ${parsed.company}
Opportunity: ${parsed.opportunity}
Personas: ${parsed.personas.join(', ')}
Pain Points: ${parsed.pain_points}
Benefits: ${parsed.benefits}

Return a JSON object with this exact structure (pure JSON only, no markdown):
{
  "personas": [
    {
      "name": "<persona name exactly as listed above>",
      "summary": "<2-3 sentence executive summary tailored to this persona>",
      "challenge": "<primary business challenge this persona faces>",
      "value_prop": "<core value proposition specifically for this persona>",
      "benefits": ["<specific benefit 1>", "<specific benefit 2>", "<specific benefit 3>"],
      "headlines": ["<punchy email/meeting subject line 1>", "<punchy subject line 2>"],
      "talking_points": ["<key talking point 1>", "<key talking point 2>", "<key talking point 3>"],
      "cta": "<specific call to action for this persona>"
    }
  ]
}

Generate one persona object for EACH of these ${parsed.personas.length} persona(s): ${parsed.personas.join(', ')}.`;

    const aiResponse = await generatePitchContent(prompt);

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(aiResponse);
    } catch {
      console.error('AI response was not valid JSON:', aiResponse.slice(0, 200));
      return NextResponse.json({ error: 'AI returned invalid JSON. Please try again.' }, { status: 500 });
    }

    const validated = aiOutputSchema.safeParse(rawJson);
    if (!validated.success) {
      console.error('AI output failed schema validation:', validated.error.flatten());
      return NextResponse.json({ error: 'AI returned unexpected structure. Please try again.' }, { status: 500 });
    }

    const aiJson = validated.data;
    const pitchId = randomUUID();

    const { error: dbError } = await supabaseAdmin.from('pitches').insert({
      id: pitchId,
      user_id: session.user.id,
      company: parsed.company,
      opportunity: parsed.opportunity,
      personas: parsed.personas,
      pain_points: parsed.pain_points,
      benefits: parsed.benefits,
      ai_output: aiJson as import('@/lib/types').Json
    });

    if (dbError) {
      console.error('DB insert error:', dbError.message);
      return NextResponse.json({ error: 'Failed to save pitch. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ pitch_id: pitchId, ai_output: aiJson });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('generate-pitch error:', message);
    if (process.env.SLACK_WEBHOOK_URL) {
      fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `500 in generate-pitch: ${message}` })
      }).catch(() => {});
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

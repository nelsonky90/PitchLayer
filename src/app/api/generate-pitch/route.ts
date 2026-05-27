import { NextResponse } from 'next/server';
import { z } from 'zod';
import { pitchSchema, personaSchema } from '@/lib/validation';
import { generatePitchContent } from '@/lib/openai';
import { supabaseAdmin } from '@/lib/db';
import { rateLimit } from '@/utils/rateLimit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { randomUUID } from 'crypto';

const aiOutputSchema = z.object({
  personas: z.array(personaSchema).min(1)
});

export async function POST(request: Request) {
  try {
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
      "objections": [
        { "objection": "<likely internal pushback this persona will hear, e.g. 'we already evaluated this' or 'what about migration risk'>", "response": "<crisp, confident rebuttal the champion can use>" },
        { "objection": "<second likely objection>", "response": "<rebuttal>" },
        { "objection": "<third likely objection>", "response": "<rebuttal>" }
      ],
      "email_template": {
        "subject": "<subject line for an internal email the champion can forward to their leadership>",
        "body": "<3-5 sentence email body the champion can copy-paste and send internally to build support, written in first person from the champion's perspective>"
      },
      "cta": "<specific next-step call to action for this persona>"
    }
  ]
}

Rules:
- Generate one persona object for EACH of these ${parsed.personas.length} persona(s): ${parsed.personas.join(', ')}.
- Do NOT invent specific dates, days of the week, or deadlines. If a timeframe is useful, use a neutral placeholder like "[date]" or phrase it relative to a known event (e.g. "before the renewal date").
- Only use facts present in the input above; do not fabricate statistics or product names.`;

    let aiResponse: string;
    try {
      aiResponse = await generatePitchContent(prompt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Anthropic error:', msg);
      return NextResponse.json({ error: `AI error: ${msg}` }, { status: 502 });
    }

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(aiResponse);
    } catch {
      console.error('AI response was not valid JSON:', aiResponse.slice(0, 300));
      return NextResponse.json({ error: 'AI returned invalid JSON. Please try again.' }, { status: 500 });
    }

    const validated = aiOutputSchema.safeParse(rawJson);
    if (!validated.success) {
      console.error('AI output failed schema validation:', validated.error.flatten());
      return NextResponse.json({ error: 'AI returned unexpected structure. Please try again.' }, { status: 500 });
    }

    const fullOutput = {
      ...validated.data,
      recipient_name: parsed.recipient_name,
      recipient_job_title: parsed.recipient_job_title,
      logo_url: parsed.logo_url || null
    };
    const pitchId = randomUUID();

    const { error: dbError } = await supabaseAdmin.from('pitches').insert({
      id: pitchId,
      user_id: session.user.id,
      company: parsed.company,
      opportunity: parsed.opportunity,
      personas: parsed.personas,
      pain_points: parsed.pain_points,
      benefits: parsed.benefits,
      ai_output: fullOutput as import('@/lib/types').Json
    });

    if (dbError) {
      console.error('DB insert error:', dbError.message);
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ pitch_id: pitchId, ai_output: fullOutput });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('generate-pitch unhandled error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

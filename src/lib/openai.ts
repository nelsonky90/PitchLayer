import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn('OPENAI_API_KEY not set.');
}

export const openai = new OpenAI({ apiKey, maxRetries: 2 });

export async function generatePitchContent(prompt: string) {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a secure assistant that produces JSON only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.4
  });
  return response.choices[0]?.message?.content || '';
}

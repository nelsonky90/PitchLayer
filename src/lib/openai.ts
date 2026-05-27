import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn('ANTHROPIC_API_KEY not set.');
}

const client = new Anthropic({ apiKey, maxRetries: 2 });

export async function generatePitchContent(prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    system: 'You are a Senior Product Marketing Manager. You produce only valid JSON — no markdown, no code blocks, no commentary.',
    messages: [{ role: 'user', content: prompt }]
  });

  for (const block of response.content) {
    if (block.type === 'text') {
      return block.text.trim();
    }
  }
  return '';
}

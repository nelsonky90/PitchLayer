import { z } from 'zod';

export const personaSchema = z.object({
  name: z.string().min(1).trim(),
  summary: z.string().min(1).trim(),
  challenge: z.string().min(1).trim(),
  value_prop: z.string().min(1).trim(),
  benefits: z.array(z.string().trim()).default([]),
  headlines: z.array(z.string().trim()).default([]),
  talking_points: z.array(z.string().trim()).default([]),
  cta: z.string().min(1).trim()
});

export const pitchSchema = z.object({
  company: z.string().min(2).max(200).trim(),
  opportunity: z.string().min(2).max(500).trim(),
  personas: z.array(z.string().min(1).trim()).min(1),
  pain_points: z.string().min(2).max(1000).trim(),
  benefits: z.string().min(2).max(1000).trim()
});

export const pitchUpdateSchema = z.object({
  company: z.string().min(2).max(200).trim().optional(),
  opportunity: z.string().min(2).max(500).trim().optional(),
  personas: z.array(z.string().min(1).trim()).optional(),
  pain_points: z.string().min(2).max(1000).trim().optional(),
  benefits: z.string().min(2).max(1000).trim().optional(),
  ai_output: z.any().optional()
});

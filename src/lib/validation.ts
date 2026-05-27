import { z } from 'zod';

export const objectionSchema = z.object({
  objection: z.string().min(1).trim(),
  response: z.string().min(1).trim()
});

export const emailTemplateSchema = z.object({
  subject: z.string().min(1).trim(),
  body: z.string().min(1).trim()
});

export const personaSchema = z.object({
  name: z.string().min(1).trim(),
  summary: z.string().min(1).trim(),
  challenge: z.string().min(1).trim(),
  value_prop: z.string().min(1).trim(),
  benefits: z.array(z.string().trim()).default([]),
  headlines: z.array(z.string().trim()).default([]),
  talking_points: z.array(z.string().trim()).default([]),
  objections: z.array(objectionSchema).default([]),
  email_template: emailTemplateSchema.optional(),
  cta: z.string().min(1).trim()
});

export const pitchSchema = z.object({
  company: z.string().min(2).max(200).trim(),
  opportunity: z.string().min(2).max(500).trim(),
  personas: z.array(z.string().min(1).trim()).min(1),
  pain_points: z.string().min(2).max(1000).trim(),
  benefits: z.string().min(2).max(1000).trim(),
  recipient_name: z.string().min(1).max(100).trim(),
  recipient_job_title: z.string().min(1).max(100).trim(),
  logo_url: z.string().url().optional().or(z.literal(''))
});

export const pitchUpdateSchema = z.object({
  company: z.string().min(2).max(200).trim().optional(),
  opportunity: z.string().min(2).max(500).trim().optional(),
  personas: z.array(z.string().min(1).trim()).optional(),
  pain_points: z.string().min(2).max(1000).trim().optional(),
  benefits: z.string().min(2).max(1000).trim().optional(),
  ai_output: z.any().optional()
});

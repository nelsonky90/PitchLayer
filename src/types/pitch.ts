export type Persona = {
  name: string;
  summary: string;
  challenge: string;
  value_prop: string;
  benefits: string[];
  headlines: string[];
  talking_points: string[];
  cta: string;
};

export type Pitch = {
  id: string;
  user_id: string;
  company: string;
  opportunity: string;
  personas: Persona[];
  pain_points: string;
  benefits: string;
  ai_output: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      pitches: {
        Row: {
          id: string;
          user_id: string;
          company: string;
          opportunity: string;
          personas: Json;
          pain_points: string;
          benefits: string;
          ai_output: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          company: string;
          opportunity: string;
          personas: Json;
          pain_points: string;
          benefits: string;
          ai_output: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          company?: string;
          opportunity?: string;
          personas?: Json;
          pain_points?: string;
          benefits?: string;
          ai_output?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string | null;
          mfa_secret: string | null;
          locked_until: string | null;
          failed_attempts: number | null;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash?: string | null;
          mfa_secret?: string | null;
          locked_until?: string | null;
          failed_attempts?: number | null;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string | null;
          mfa_secret?: string | null;
          locked_until?: string | null;
          failed_attempts?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

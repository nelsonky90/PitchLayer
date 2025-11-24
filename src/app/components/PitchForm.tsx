'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { pitchSchema } from '@/lib/validation';
import { z } from 'zod';
import PitchResult from './PitchResult';
import { Persona } from '@/types/pitch';

const formSchema = pitchSchema;
type FormValues = z.infer<typeof formSchema>;

function getCsrfToken() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/csrf-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export default function PitchForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { personas: ['Economic Buyer'] } });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken()
        },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data.ai_output);
    } catch (error) {
      console.error(error);
      alert('Unable to generate pitch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-xl font-semibold">Create a new pitch</h2>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-sm font-medium">Company</label>
          <input className="w-full rounded border px-3 py-2" {...register('company')} />
          {errors.company && <p className="text-sm text-red-600">{errors.company.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Opportunity</label>
          <textarea className="w-full rounded border px-3 py-2" rows={2} {...register('opportunity')} />
          {errors.opportunity && <p className="text-sm text-red-600">{errors.opportunity.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Personas (comma separated)</label>
          <input
            className="w-full rounded border px-3 py-2"
            defaultValue="Economic Buyer"
            {...register('personas', {
              setValueAs: (value) => (typeof value === 'string' ? value.split(',').map((v: string) => v.trim()).filter(Boolean) : value)
            })}
          />
          {errors.personas && <p className="text-sm text-red-600">{errors.personas.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Pain Points</label>
          <textarea className="w-full rounded border px-3 py-2" rows={3} {...register('pain_points')} />
          {errors.pain_points && <p className="text-sm text-red-600">{errors.pain_points.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Benefits</label>
          <textarea className="w-full rounded border px-3 py-2" rows={3} {...register('benefits')} />
          {errors.benefits && <p className="text-sm text-red-600">{errors.benefits.message}</p>}
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Pitch'}
        </button>
      </form>
      {result && <PitchResult personas={(result.personas || []) as Persona[]} pitchId={result.pitch_id} />}
    </div>
  );
}

'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { pitchSchema } from '@/lib/validation';
import { z } from 'zod';

type FormValues = z.infer<typeof pitchSchema>;

type InitialValues = {
  company?: string;
  opportunity?: string;
  pain_points?: string;
  benefits?: string;
};

const inputCls = 'w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-signal';

function getCsrfToken() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/csrf-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export default function PitchForm({ initialValues }: { initialValues?: InitialValues }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDuplicate = Boolean(initialValues);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(pitchSchema),
    defaultValues: {
      company: initialValues?.company ?? '',
      opportunity: initialValues?.opportunity ?? '',
      pain_points: initialValues?.pain_points ?? '',
      benefits: initialValues?.benefits ?? '',
      personas: isDuplicate ? [] : ['Economic Buyer'],
      recipient_name: '',
      recipient_job_title: '',
      logo_url: ''
    }
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setErrorMsg(null);
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
      if (!res.ok) throw new Error(data.error || 'Failed to generate pitch');
      router.push(`/pitch/${data.pitch_id}`);
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Unable to generate pitch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 space-y-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold">Create a new pitch</h2>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Recipient Name</label>
            <input className={inputCls} placeholder="e.g. Sarah Johnson" {...register('recipient_name')} />
            {errors.recipient_name && <p className="text-sm text-red-600 mt-1">{errors.recipient_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recipient Job Title</label>
            <input className={inputCls} placeholder="e.g. VP Engineering" {...register('recipient_job_title')} />
            {errors.recipient_job_title && <p className="text-sm text-red-600 mt-1">{errors.recipient_job_title.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Customer Logo URL <span className="text-slate font-normal">(optional)</span>
          </label>
          <input
            className={inputCls}
            placeholder="https://example.com/logo.png"
            {...register('logo_url')}
          />
          {errors.logo_url && <p className="text-sm text-red-600 mt-1">{errors.logo_url.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Company</label>
          <input className={inputCls} placeholder="e.g. Acme Corp" {...register('company')} />
          {errors.company && <p className="text-sm text-red-600 mt-1">{errors.company.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Opportunity</label>
          <textarea className={inputCls} rows={2} placeholder="e.g. Replacing legacy data warehouse to reduce costs" {...register('opportunity')} />
          {errors.opportunity && <p className="text-sm text-red-600 mt-1">{errors.opportunity.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Personas <span className="text-slate font-normal">(comma separated)</span></label>
          <input
            className={inputCls}
            placeholder="e.g. Economic Buyer, Champion, Technical Evaluator"
            {...register('personas', {
              setValueAs: (value) =>
                typeof value === 'string'
                  ? value.split(',').map((v: string) => v.trim()).filter(Boolean)
                  : value
            })}
          />
          {errors.personas && <p className="text-sm text-red-600 mt-1">{errors.personas.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pain Points</label>
          <textarea className={inputCls} rows={3} placeholder="What problems is the customer facing?" {...register('pain_points')} />
          {errors.pain_points && <p className="text-sm text-red-600 mt-1">{errors.pain_points.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Benefits</label>
          <textarea className={inputCls} rows={3} placeholder="What value does your solution deliver?" {...register('benefits')} />
          {errors.benefits && <p className="text-sm text-red-600 mt-1">{errors.benefits.message}</p>}
        </div>

        {errorMsg && (
          <div className="rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <button type="submit" className="btn w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating pitch…
            </span>
          ) : (
            'Generate Pitch'
          )}
        </button>
      </form>
    </div>
  );
}

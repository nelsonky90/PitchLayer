'use client';

import { Persona } from '@/types/pitch';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold uppercase tracking-wide text-teal">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-signal';

export default function PersonaEditor({
  persona,
  onChange
}: {
  persona: Persona;
  onChange: (next: Persona) => void;
}) {
  const set = (patch: Partial<Persona>) => onChange({ ...persona, ...patch });

  const setList = (key: 'benefits' | 'headlines' | 'talking_points', text: string) =>
    set({ [key]: text.split('\n').map((s) => s.trim()).filter(Boolean) } as Partial<Persona>);

  const updateObjection = (i: number, patch: Partial<{ objection: string; response: string }>) => {
    const next = persona.objections.map((o, idx) => (idx === i ? { ...o, ...patch } : o));
    set({ objections: next });
  };

  return (
    <div className="card p-4 space-y-3">
      <Field label="Name">
        <input className={inputCls} value={persona.name} onChange={(e) => set({ name: e.target.value })} />
      </Field>
      <Field label="Summary">
        <textarea className={inputCls} rows={3} value={persona.summary} onChange={(e) => set({ summary: e.target.value })} />
      </Field>
      <Field label="Challenge">
        <textarea className={inputCls} rows={2} value={persona.challenge} onChange={(e) => set({ challenge: e.target.value })} />
      </Field>
      <Field label="Value Proposition">
        <textarea className={inputCls} rows={2} value={persona.value_prop} onChange={(e) => set({ value_prop: e.target.value })} />
      </Field>
      <Field label="Benefits (one per line)">
        <textarea className={inputCls} rows={3} value={persona.benefits.join('\n')} onChange={(e) => setList('benefits', e.target.value)} />
      </Field>
      <Field label="Headlines (one per line)">
        <textarea className={inputCls} rows={2} value={persona.headlines.join('\n')} onChange={(e) => setList('headlines', e.target.value)} />
      </Field>
      <Field label="Talking Points (one per line)">
        <textarea className={inputCls} rows={3} value={persona.talking_points.join('\n')} onChange={(e) => setList('talking_points', e.target.value)} />
      </Field>

      <Field label="Objection Handling">
        <div className="space-y-2">
          {persona.objections.map((o, i) => (
            <div key={i} className="border-l-2 border-signal/40 pl-2 space-y-1">
              <input
                className={inputCls}
                placeholder="Objection"
                value={o.objection}
                onChange={(e) => updateObjection(i, { objection: e.target.value })}
              />
              <textarea
                className={inputCls}
                rows={2}
                placeholder="Response"
                value={o.response}
                onChange={(e) => updateObjection(i, { response: e.target.value })}
              />
              <button
                type="button"
                onClick={() => set({ objections: persona.objections.filter((_, idx) => idx !== i) })}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set({ objections: [...persona.objections, { objection: '', response: '' }] })}
            className="text-xs text-signal hover:underline"
          >
            + Add objection
          </button>
        </div>
      </Field>

      <Field label="Internal Email Template">
        <input
          className={inputCls}
          placeholder="Subject"
          value={persona.email_template?.subject ?? ''}
          onChange={(e) =>
            set({ email_template: { subject: e.target.value, body: persona.email_template?.body ?? '' } })
          }
        />
        <textarea
          className={`${inputCls} mt-1`}
          rows={4}
          placeholder="Body"
          value={persona.email_template?.body ?? ''}
          onChange={(e) =>
            set({ email_template: { subject: persona.email_template?.subject ?? '', body: e.target.value } })
          }
        />
      </Field>

      <Field label="Call to Action">
        <textarea className={inputCls} rows={2} value={persona.cta} onChange={(e) => set({ cta: e.target.value })} />
      </Field>
    </div>
  );
}

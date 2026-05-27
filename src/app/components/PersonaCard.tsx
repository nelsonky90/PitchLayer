import { Persona } from '@/types/pitch';
import CopyEmailButton from './CopyEmailButton';

export default function PersonaCard({ persona }: { persona: Persona }) {
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{persona.name}</h3>
        <span className="text-xs bg-teal/20 text-teal px-2 py-1 rounded">Champion Persona</span>
      </div>
      <p className="text-slate text-sm">{persona.summary}</p>
      <div className="text-sm space-y-1">
        <p><strong>Challenge:</strong> {persona.challenge}</p>
        <p><strong>Value Prop:</strong> {persona.value_prop}</p>
        <p><strong>CTA:</strong> {persona.cta}</p>
      </div>
      <div>
        <h4 className="font-semibold">Headlines</h4>
        <ul className="list-disc list-inside text-sm text-slate">
          {persona.headlines.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="font-semibold">Talking Points</h4>
        <ul className="list-disc list-inside text-sm text-slate">
          {persona.talking_points.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </div>
      {persona.objections?.length > 0 && (
        <div>
          <h4 className="font-semibold">Objection Handling</h4>
          <ul className="space-y-2 text-sm">
            {persona.objections.map((o) => (
              <li key={o.objection} className="border-l-2 border-signal/40 pl-3">
                <p className="font-medium text-midnight">&ldquo;{o.objection}&rdquo;</p>
                <p className="text-slate">{o.response}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {persona.email_template && (
        <div>
          <h4 className="font-semibold">Internal Email Template</h4>
          <div className="rounded bg-cloud border border-gray-200 p-3 text-sm space-y-2">
            <p className="text-slate"><strong>Subject:</strong> {persona.email_template.subject}</p>
            <p className="whitespace-pre-wrap text-midnight">{persona.email_template.body}</p>
            <CopyEmailButton subject={persona.email_template.subject} body={persona.email_template.body} />
          </div>
        </div>
      )}
    </div>
  );
}

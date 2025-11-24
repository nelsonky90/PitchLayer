import { Persona } from '@/types/pitch';

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
    </div>
  );
}

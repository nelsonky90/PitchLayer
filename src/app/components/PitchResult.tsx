import PersonaCard from './PersonaCard';
import PDFExport from './PDFExport';
import SlidesExport from './SlidesExport';
import { Persona } from '@/types/pitch';

export default function PitchResult({ personas, pitchId }: { personas: Persona[]; pitchId?: string }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <PDFExport personas={personas} pitchId={pitchId} />
        <SlidesExport personas={personas} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {personas.map((persona) => (
          <PersonaCard key={persona.name} persona={persona} />
        ))}
      </div>
    </div>
  );
}

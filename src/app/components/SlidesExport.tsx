'use client';

import { Persona } from '@/types/pitch';

export default function SlidesExport({ personas }: { personas: Persona[] }) {
  const exportSlides = async () => {
    alert('Slides export placeholder. Configure Google Slides API credentials to enable.');
  };

  return (
    <button onClick={exportSlides} className="btn bg-midnight text-white hover:bg-gray-900">
      Export to Google Slides
    </button>
  );
}

'use client';

import jsPDF from 'jspdf';
import { Persona } from '@/types/pitch';

export default function PDFExport({ personas, pitchId }: { personas: Persona[]; pitchId?: string }) {
  const generate = () => {
    const doc = new jsPDF();
    doc.setFillColor('#1A1E2E');
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor('#F9FAFB');
    doc.setFontSize(16);
    doc.text('PitchLayer', 10, 12);
    doc.setTextColor('#1A1E2E');
    doc.setFontSize(12);
    personas.forEach((persona, idx) => {
      const y = 30 + idx * 50;
      doc.text(`${persona.name}`, 10, y);
      doc.text(`Summary: ${persona.summary}`, 10, y + 7);
      doc.text(`Challenge: ${persona.challenge}`, 10, y + 14);
      doc.text(`Value Prop: ${persona.value_prop}`, 10, y + 21);
    });
    doc.save(`pitch-${pitchId || 'export'}.pdf`);
  };

  return (
    <button onClick={generate} className="btn bg-teal text-midnight hover:bg-teal/80">
      Export PDF
    </button>
  );
}

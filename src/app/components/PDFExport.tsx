'use client';

import jsPDF from 'jspdf';
import { Persona } from '@/types/pitch';

const MIDNIGHT = '#1A1E2E';
const TEAL = '#2DD4BF';
const SLATE = '#64748B';
const PAGE_W = 210;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

async function loadImageBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/') || blob.type.includes('svg')) return null;
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatFromDataUrl(dataUrl: string): string {
  const m = dataUrl.match(/^data:image\/(\w+);/);
  return m ? m[1].toUpperCase() : 'PNG';
}

function addSection(doc: jsPDF, label: string, value: string | string[], y: number): number {
  if (y > 265) { doc.addPage(); y = 20; }
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(TEAL);
  doc.text(label.toUpperCase(), MARGIN, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MIDNIGHT);
  doc.setFontSize(10);
  if (Array.isArray(value)) {
    for (const item of value) {
      const lines = doc.splitTextToSize(`• ${item}`, CONTENT_W);
      if (y + lines.length * 5 > 275) { doc.addPage(); y = 20; }
      doc.text(lines, MARGIN + 2, y);
      y += lines.length * 5;
    }
  } else {
    const lines = doc.splitTextToSize(value, CONTENT_W);
    if (y + lines.length * 5 > 275) { doc.addPage(); y = 20; }
    doc.text(lines, MARGIN, y);
    y += lines.length * 5;
  }
  return y + 4;
}

interface PDFExportProps {
  personas: Persona[];
  company: string;
  recipientName: string;
  recipientJobTitle: string;
  logoPrimaryUrl?: string | null;
  logoFallbackUrl?: string | null;
}

export default function PDFExport({ personas, company, recipientName, recipientJobTitle, logoPrimaryUrl, logoFallbackUrl }: PDFExportProps) {
  const generate = async () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    let logoBase64: string | null = null;
    if (logoPrimaryUrl) logoBase64 = await loadImageBase64(logoPrimaryUrl);
    if (!logoBase64 && logoFallbackUrl) logoBase64 = await loadImageBase64(logoFallbackUrl);

    personas.forEach((persona, idx) => {
      if (idx > 0) doc.addPage();

      // Header bar — company branding, no PitchLayer, no pitch ID
      doc.setFillColor(MIDNIGHT);
      doc.rect(0, 0, PAGE_W, 24, 'F');

      let headerX = MARGIN;
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, formatFromDataUrl(logoBase64), MARGIN, 4, 16, 16);
          headerX = MARGIN + 20;
        } catch {
          // Logo failed — just use text
        }
      }

      doc.setTextColor('#F9FAFB');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(company.toUpperCase(), headerX, 15);

      // Recipient line
      let y = 34;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(MIDNIGHT);
      doc.text(`Internal Pitch for ${recipientName}, ${recipientJobTitle}`, MARGIN, y);
      y += 2;
      doc.setDrawColor(TEAL);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      y += 8;

      y = addSection(doc, 'Summary', persona.summary, y);
      y = addSection(doc, 'Challenge', persona.challenge, y);
      y = addSection(doc, 'Value Proposition', persona.value_prop, y);
      if (persona.benefits?.length) y = addSection(doc, 'Benefits', persona.benefits, y);
      if (persona.headlines?.length) y = addSection(doc, 'Headlines', persona.headlines, y);
      if (persona.talking_points?.length) y = addSection(doc, 'Talking Points', persona.talking_points, y);
      if (persona.objections?.length) {
        y = addSection(doc, 'Objection Handling',
          persona.objections.map((o) => `"${o.objection}" — ${o.response}`), y);
      }
      if (persona.email_template) {
        y = addSection(doc, 'Internal Email Template',
          [`Subject: ${persona.email_template.subject}`, persona.email_template.body], y);
      }
      if (persona.cta) {
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setFillColor('#F0FDFA');
        doc.roundedRect(MARGIN, y, CONTENT_W, 14, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(TEAL);
        doc.text('CALL TO ACTION', MARGIN + 3, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(MIDNIGHT);
        doc.setFontSize(10);
        doc.text(doc.splitTextToSize(persona.cta, CONTENT_W - 6), MARGIN + 3, y + 10);
        y += 18;
      }

      // Footer — page number only, no PitchLayer branding
      doc.setFontSize(8);
      doc.setTextColor(SLATE);
      doc.text(`Page ${idx + 1} of ${personas.length}`, PAGE_W - MARGIN, 290, { align: 'right' });
    });

    doc.save(`pitch-${company.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <button onClick={generate} className="btn bg-teal text-midnight hover:bg-teal/80">
      Export PDF
    </button>
  );
}

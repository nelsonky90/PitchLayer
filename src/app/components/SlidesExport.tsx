'use client';

import { Persona } from '@/types/pitch';

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface SlidesExportProps {
  personas: Persona[];
  company: string;
  recipientName: string;
  recipientJobTitle: string;
  logoUrl?: string | null;
}

function buildHtml({ personas, company, recipientName, recipientJobTitle, logoUrl }: SlidesExportProps): string {
  const logoTag = logoUrl
    ? `<img src="${escHtml(logoUrl)}" alt="${escHtml(company)} logo" style="height:40px;object-fit:contain;margin-right:16px" onerror="this.style.display='none'">`
    : '';

  const slides = personas.map((p) => `
    <section class="slide">
      <div class="slide-header">
        <div class="header-left">
          ${logoTag}
          <span class="company">${escHtml(company.toUpperCase())}</span>
        </div>
        <div class="recipient">Internal Pitch for ${escHtml(recipientName)}, ${escHtml(recipientJobTitle)}</div>
      </div>
      <div class="slide-body">
        <div class="col">
          <div class="field">
            <div class="label">Summary</div>
            <p>${escHtml(p.summary)}</p>
          </div>
          <div class="field">
            <div class="label">Challenge</div>
            <p>${escHtml(p.challenge)}</p>
          </div>
          <div class="field">
            <div class="label">Value Proposition</div>
            <p>${escHtml(p.value_prop)}</p>
          </div>
          <div class="field cta-box">
            <div class="label">Call to Action</div>
            <p>${escHtml(p.cta)}</p>
          </div>
        </div>
        <div class="col">
          ${p.benefits?.length ? `<div class="field"><div class="label">Benefits</div><ul>${p.benefits.map((b) => `<li>${escHtml(b)}</li>`).join('')}</ul></div>` : ''}
          ${p.headlines?.length ? `<div class="field"><div class="label">Headlines</div><ul>${p.headlines.map((h) => `<li>${escHtml(h)}</li>`).join('')}</ul></div>` : ''}
          ${p.talking_points?.length ? `<div class="field"><div class="label">Talking Points</div><ul>${p.talking_points.map((t) => `<li>${escHtml(t)}</li>`).join('')}</ul></div>` : ''}
          ${p.objections?.length ? `<div class="field"><div class="label">Objection Handling</div><ul>${p.objections.map((o) => `<li><strong>${escHtml(o.objection)}</strong> — ${escHtml(o.response)}</li>`).join('')}</ul></div>` : ''}
          ${p.email_template ? `<div class="field"><div class="label">Internal Email Template</div><p><strong>Subject:</strong> ${escHtml(p.email_template.subject)}</p><p style="white-space:pre-wrap;margin-top:8px">${escHtml(p.email_template.body)}</p></div>` : ''}
        </div>
      </div>
    </section>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Internal Pitch for ${escHtml(recipientName)} — ${escHtml(company)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#F9FAFB;color:#1A1E2E}
  .slide{display:none;min-height:100vh;flex-direction:column;page-break-after:always}
  .slide.active{display:flex}
  .slide-header{background:#1A1E2E;color:#fff;padding:16px 40px;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .header-left{display:flex;align-items:center}
  .company{font-size:1.2rem;font-weight:700;letter-spacing:.05em}
  .recipient{font-size:1rem;color:#2DD4BF;font-weight:600;text-align:right}
  .slide-body{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:32px 40px;flex:1}
  .col{display:flex;flex-direction:column;gap:16px}
  .field{background:#fff;border-radius:8px;padding:16px;border:1px solid #e2e8f0}
  .label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#2DD4BF;margin-bottom:6px}
  p{font-size:.95rem;line-height:1.5}
  ul{padding-left:18px;font-size:.9rem;line-height:1.8}
  .cta-box{background:#F0FDFA;border-color:#2DD4BF}
  nav{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);display:flex;gap:12px;background:#1A1E2E;padding:10px 20px;border-radius:999px}
  nav button{background:#2DD4BF;color:#1A1E2E;border:none;padding:6px 18px;border-radius:999px;cursor:pointer;font-weight:600;font-size:.85rem}
  nav button:disabled{opacity:.4;cursor:default}
  .counter{color:#fff;font-size:.85rem;align-self:center;min-width:60px;text-align:center}
  @media print{nav{display:none}.slide{display:flex!important;page-break-after:always}}
</style>
</head>
<body>
${slides}
<nav>
  <button id="prev" onclick="go(-1)" disabled>← Prev</button>
  <span class="counter" id="counter"></span>
  <button id="next" onclick="go(1)">Next →</button>
</nav>
<script>
  const slides=document.querySelectorAll('.slide');
  let cur=0;
  function show(n){slides[cur].classList.remove('active');cur=Math.max(0,Math.min(slides.length-1,n));slides[cur].classList.add('active');document.getElementById('counter').textContent=(cur+1)+' / '+slides.length;document.getElementById('prev').disabled=cur===0;document.getElementById('next').disabled=cur===slides.length-1;}
  function go(d){show(cur+d);}
  document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowDown')go(1);if(e.key==='ArrowLeft'||e.key==='ArrowUp')go(-1);});
  show(0);
<\/script>
</body></html>`;
}

export default function SlidesExport(props: SlidesExportProps) {
  const download = () => {
    const html = buildHtml(props);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitch-${props.company.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={download} className="btn bg-midnight text-white hover:bg-gray-900">
      Export Slides
    </button>
  );
}

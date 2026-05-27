export function normalizeDomain(input?: string | null): string | null {
  if (!input) return null;
  let s = input.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '');
  s = s.split('/')[0].split('?')[0].split('#')[0];
  // Basic sanity: must contain a dot and no spaces
  if (!s.includes('.') || /\s/.test(s)) return null;
  return s;
}

export function clearbitLogo(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

export function faviconLogo(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

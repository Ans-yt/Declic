export function suggestAwardTitle(text: string): string | null {
  if (/\bBIA\b|brevet\s+d['’]?initiation\s+a[ée]ronautique/i.test(text)) return 'Brevet d’initiation aéronautique (BIA)';
  const lines = text.split(/\r?\n/).map(line => line.replace(/[^\p{L}\p{N}\s'’():,.–-]/gu, '').replace(/\s+/g, ' ').trim()).filter(line => line.length >= 8 && line.length <= 140 && /\p{L}{3}/u.test(line));
  const likely = lines.find(line => /dipl[oô]me|certificat|award|prize|concours|attestation|brevet|participation|r[ée]compense/i.test(line));
  return likely || null;
}

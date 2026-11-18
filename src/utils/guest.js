export function getGuestName() {
  if (typeof window === 'undefined') return '';
  const raw = new URLSearchParams(window.location.search).get('guest');
  if (!raw) return '';
  return raw.trim().replace(/\s+/g, ' ').slice(0, 32);
}

export function buildGuestInviteUrl(name) {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  const clean = name.trim().replace(/\s+/g, ' ').slice(0, 32);
  if (clean) url.searchParams.set('guest', clean);
  else url.searchParams.delete('guest');
  return url.toString();
}
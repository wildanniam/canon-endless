const paths: Record<string, string> = {
  play: '<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="4"/>',
  rewind: '<path d="M4 8v5h5M4 12a8 8 0 1 1 2 6"/><path d="M12 8v4l3 2"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  share: '<path d="M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  mix: '<path d="M5 3v5m0 5v8M12 3v10m0 5v3M19 3v2m0 5v11M2 8h6m1 10h6m1-13h6"/>',
  leaf: '<path d="M20 3c-6-1-15 1-15 9a6 6 0 0 0 6 6c8 0 9-9 9-15ZM4 21 15 10"/>',
  zen: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  volume:
    '<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  muted: '<path d="m11 4-6 5H2v6h3l6 5Zm5 5 6 6m-6 0 6-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  shuffle:
    '<path d="m18 3 3 3-3 3M3 6h3c5 0 7 12 12 12h3m-3-3 3 3-3 3M3 18h3c2 0 3-2 4-4m4-4c1-2 2-4 4-4h3"/>',
  record: '<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
};
export function icon(name: string, size = 20): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
}
export const logo =
  '<svg width="39" height="27" viewBox="0 0 60 36" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 22c0-17 17-17 26 0s26 17 26 0-17-17-26 0S4 39 4 22Z"/><path d="M4 13c0-17 17-17 26 0s26 17 26 0" opacity=".5"/></svg>';

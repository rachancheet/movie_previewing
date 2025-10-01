import { NextResponse } from 'next/server';
import yts from 'yt-search';

// Try multiple Piped instances and query variants for robustness
const PIPED_INSTANCES = [
  'https://piped.video',
  'https://piped.lunar.icu',
  'https://piped.projectsegfau.lt',
  'https://piped.privacydev.net',
];

type PipedItem = {
  type?: string;
  url?: string;
  id?: string;
  title?: string;
};

function extractVideoIdFromItem(item: PipedItem): string | null {
  // Common shapes:
  // - { type: 'video', url: '/watch?v=ID', ... }
  // - { type: 'stream', url: '/watch?v=ID', ... }
  // - { type: 'video', id: 'ID', ... }
  const urlPath = typeof item?.url === 'string' ? item.url : null;
  if (urlPath) {
    const match = /v=([\w-]{6,})/.exec(urlPath);
    if (match?.[1]) return match[1];
  }
  if (typeof item?.id === 'string' && item.id.length >= 6) return item.id;
  return null;
}

async function searchOnInstance(instance: string, query: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const url = new URL('/api/v1/search', instance);
    url.searchParams.set('q', query);
    url.searchParams.set('region', 'US');
    url.searchParams.set('hl', 'en');
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    const items: PipedItem[] = Array.isArray(json)
      ? (json as PipedItem[])
      : Array.isArray((json as { items?: unknown })?.items)
      ? ((json as { items?: unknown }).items as PipedItem[])
      : [];
    if (!items.length) return null;

    // Prefer items with 'trailer' in the title
    const candidates = items.filter((x) =>
      (x?.type === 'video' || x?.type === 'stream') &&
      (x?.url || x?.id) &&
      typeof x?.title === 'string' && x.title.toLowerCase().includes('trailer')
    );
    if (candidates.length > 0) {
      return extractVideoIdFromItem(candidates[0]);
    }

    // Fallback: first video-like item
    const fallback = items.find((x) => (x?.type === 'video' || x?.type === 'stream') && (x?.url || x?.id));
    return fallback ? extractVideoIdFromItem(fallback) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function searchYouTubeVideoId(query: string): Promise<string | null> {
  const variants = [
    `${query} official trailer`,
    `${query} trailer`,
    `${query} teaser`,
    `${query} movie trailer`,
    `${query} (2025) trailer`,
    query,
  ];

  // 1) Prefer yt-search (no API key required)
  for (const q of variants) {
    try {
      const result = await yts(q);
      const videos = Array.isArray(result?.videos) ? result.videos : [];
      if (!videos.length) continue;
      const lowered = (s: string) => s.toLowerCase();
      const prioritized = videos.filter((v) => typeof v?.title === 'string' && lowered(v.title!).includes('trailer'));
      const pick = prioritized[0] ?? videos[0];
      const id = typeof pick?.videoId === 'string' ? pick.videoId : null;
      if (id) return id;
    } catch {
      // ignore and continue
    }
  }

  // 2) Fallback to Piped instances if yt-search did not yield results
  for (const q of variants) {
    const results = await Promise.all(PIPED_INSTANCES.map((base) => searchOnInstance(base, q)));
    const found = results.find((id) => id !== null);
    if (found) return found as string;
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'Missing q' }, { status: 400 });
  const videoId = await searchYouTubeVideoId(`${q} trailer`);
  if (!videoId) return NextResponse.json({ error: 'No trailer found' }, { status: 404 });
  return NextResponse.json({ videoId, embedUrl: `https://www.youtube.com/embed/${videoId}` });
}



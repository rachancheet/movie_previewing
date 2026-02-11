import { promises as fs } from 'fs';
import path from 'path';
import yts from 'yt-search';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'movies.json');

const FETCH_DELAY_MS = 1000; // pause between YouTube searches to avoid rate-limits
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Shape of what we persist
export type TrailerInfo = { videoId: string; embedUrl: string };
export type MovieEntry = { name: string; trailer: TrailerInfo | null; watched?: boolean };
export type StoreData = { movies: MovieEntry[] };

// ---------------------------------------------------------------------------
// Read / Write helpers
// ---------------------------------------------------------------------------

async function readStore(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.movies)) return parsed as StoreData;
  } catch {
    // file missing or corrupt – start fresh
  }
  return { movies: [] };
}

async function writeStore(data: StoreData): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ---------------------------------------------------------------------------
// YouTube search  (yt-search, no API key needed)
// ---------------------------------------------------------------------------

async function fetchTrailerForMovie(movieName: string): Promise<TrailerInfo | null> {
  const queries = [
    `${movieName} official trailer`,
    `${movieName} trailer`,
    `${movieName} movie trailer`,
  ];

  for (const q of queries) {
    try {
      const result = await yts(q);
      const videos = Array.isArray(result?.videos) ? result.videos : [];
      if (!videos.length) continue;

      // prefer a video whose title contains "trailer"
      const preferred = videos.find(
        (v) => typeof v?.title === 'string' && v.title.toLowerCase().includes('trailer'),
      );
      const pick = preferred ?? videos[0];
      const id = typeof pick?.videoId === 'string' ? pick.videoId : null;
      if (id) {
        return { videoId: id, embedUrl: `https://www.youtube.com/embed/${id}` };
      }
    } catch {
      // try next query
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API used by route handlers
// ---------------------------------------------------------------------------

/** Return all stored movies + trailers */
export async function getMovies(): Promise<MovieEntry[]> {
  const store = await readStore();
  // Filter out watched movies from the returned list so they don't appear in UI
  return store.movies.filter(m => !m.watched);
}

/** Return a single random movie that has a trailer and is not watched */
export async function getRandomTrailer(): Promise<MovieEntry | null> {
  const store = await readStore();
  const validMovies = store.movies.filter((m) => m.trailer !== null && !m.watched);
  if (!validMovies.length) return null;
  return validMovies[Math.floor(Math.random() * validMovies.length)] ?? null;
}

/** Mark a movie as watched */
export async function markMovieAsWatched(name: string): Promise<boolean> {
  const store = await readStore();
  const entry = store.movies.find(m => m.name.toLowerCase() === name.toLowerCase());

  if (entry) {
    entry.watched = true;
    await writeStore(store);
    return true;
  }
  return false;
}

/**
 * Replace the movie list.
 * - Movies already in the store keep their existing trailer and watched status.
 * - New movies are saved immediately with trailer: null.
 * - Trailer fetching for new movies happens in the background (fire-and-forget).
 * - Movies removed from the new list are dropped.
 */
export async function updateMovieList(newNames: string[]): Promise<MovieEntry[]> {
  const cleaned = Array.from(new Set(newNames.map((n) => n.trim()).filter(Boolean)));

  const store = await readStore();

  // Build a lookup of existing entries keyed by lowercase name
  const existing = new Map<string, MovieEntry>();
  for (const entry of store.movies) {
    existing.set(entry.name.toLowerCase(), entry);
  }

  // Build new list, reusing trailers and watched status where possible
  const entries: MovieEntry[] = [];
  const needFetch: string[] = [];

  for (const name of cleaned) {
    const key = name.toLowerCase();
    const prev = existing.get(key);

    if (prev) {
      // Preserve trailer and watched status
      entries.push({
        name,
        trailer: prev.trailer,
        watched: prev.watched
      });
    } else {
      // New movie
      entries.push({ name, trailer: null, watched: false });
      needFetch.push(name);
    }
  }

  // Save immediately so the response is instant
  const updated: StoreData = { movies: entries };
  await writeStore(updated);

  // Kick off background trailer fetching (fire-and-forget)
  if (needFetch.length > 0) {
    fetchTrailersInBackground(needFetch);
  }

  return entries;
}

/**
 * Fetch trailers for the given movie names in the background.
 * After each successful fetch, patch the store on disk.
 * Errors are silently swallowed – the frontend can retry later.
 */
function fetchTrailersInBackground(names: string[]): void {
  // We intentionally do NOT await this – it runs detached
  (async () => {
    for (let i = 0; i < names.length; i++) {
      const name = names[i];

      // Throttle: wait before each fetch (skip the first one)
      if (i > 0) await sleep(FETCH_DELAY_MS);

      try {
        const trailer = await fetchTrailerForMovie(name);
        if (!trailer) continue;

        // Read → patch → write (safe for sequential background work)
        const store = await readStore();
        const entry = store.movies.find(
          (m) => m.name.toLowerCase() === name.toLowerCase(),
        );
        if (entry) {
          entry.trailer = trailer;
          await writeStore(store);
        }
      } catch {
        // skip this movie, the user can refresh later
      }
    }
  })();
}

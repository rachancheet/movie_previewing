"use client";
import { useCallback, useEffect, useRef, useState } from 'react';

type TrailerResponse = { videoId: string; embedUrl: string };

export default function Home() {
  const [movies, setMovies] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trailerCache = useRef<Map<string, TrailerResponse>>(new Map());

  const pickRandom = useCallback((list: string[]) => {
    if (!list.length) return null;
    return list[Math.floor(Math.random() * list.length)] ?? null;
  }, []);

  

  const loadMovies = useCallback(async () => {
    const res = await fetch('/api/movies', { cache: 'no-store' });
    const data: { movies: string[] } = await res.json();
    setMovies(data.movies ?? []);
    return data.movies ?? [];
  }, []);

  const fetchTrailer = useCallback(async (title: string) => {
    // Check cache first
    const cached = trailerCache.current.get(title);
    if (cached) {
      setEmbedUrl(cached.embedUrl);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trailer?q=${encodeURIComponent(title)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Trailer not found');
      const data: TrailerResponse = await res.json();
      // Store in cache
      trailerCache.current.set(title, data);
      setEmbedUrl(data.embedUrl);
    } catch (e: unknown) {
      setEmbedUrl(null);
      const msg = e instanceof Error ? e.message : 'Failed to load trailer';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const nextRandom = useCallback(async () => {
    const list = movies.length ? movies : await loadMovies();
    const title = pickRandom(list);
    setCurrent(title);
    if (title) await fetchTrailer(title);
  }, [movies, loadMovies, pickRandom, fetchTrailer]);

  useEffect(() => {
    (async () => {
      const list = await loadMovies();
      const title = pickRandom(list);
      setCurrent(title);
      if (title) await fetchTrailer(title);
    })();
  }, [loadMovies, pickRandom, fetchTrailer]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        nextRandom();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [nextRandom]);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Random Movie Trailer</h1>
      {current && <div style={{ fontSize: 18 }}>🎬 {current}</div>}
      <div style={{ width: '100%', maxWidth: 960, aspectRatio: '16 / 9', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, overflow: 'hidden' }}>
        {embedUrl ? (
          <iframe
            key={embedUrl}
            src={embedUrl}
            style={{ width: '100%', height: '100%', border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div style={{ color: '#eee', padding: 16 }}>{loading ? 'Loading…' : error ? error : 'No trailer yet'}</div>
        )}
      </div>
      <button onClick={nextRandom} style={{ padding: '10px 16px', borderRadius: 6, border: '1px solid #444', background: '#222', color: '#fff', cursor: 'pointer' }}>
        {loading ? 'Finding…' : 'Next'}
      </button>
    </main>
  );
}

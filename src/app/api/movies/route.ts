import { NextResponse } from 'next/server';
import { getMovies } from '@/lib/store';

/** GET /api/movies – return the full movie list with trailer info */
export async function GET() {
  const movies = await getMovies();
  return NextResponse.json({
    movies: movies.map((m) => ({
      name: m.name,
      hasTrailer: m.trailer !== null,
      embedUrl: m.trailer?.embedUrl ?? null,
      videoId: m.trailer?.videoId ?? null,
    })),
    total: movies.length,
    trailersReady: movies.filter((m) => m.trailer !== null).length,
  });
}

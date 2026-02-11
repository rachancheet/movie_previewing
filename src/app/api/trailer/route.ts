import { NextResponse } from 'next/server';
import { getRandomTrailer } from '@/lib/store';

/**
 * GET /api/trailer
 *
 * Returns a random movie trailer from the pre-fetched store.
 * No live YouTube searching – everything is served from cache.
 */
export async function GET() {
  const entry = await getRandomTrailer();

  if (!entry || !entry.trailer) {
    return NextResponse.json(
      { error: 'No trailers available. Send a movie list to /api/update_list first.' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    movie: entry.name,
    videoId: entry.trailer.videoId,
    embedUrl: entry.trailer.embedUrl,
  });
}

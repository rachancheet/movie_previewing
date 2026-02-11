import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateMovieList } from '@/lib/store';

const Body = z.object({
  movies: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = Body.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    // This will reuse existing trailers and only fetch new ones
    const movies = await updateMovieList(parsed.data.movies);

    return NextResponse.json({
      movies: movies.map((m) => m.name),
      trailersReady: movies.filter((m) => m.trailer !== null).length,
      total: movies.length,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
}

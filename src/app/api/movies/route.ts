import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readMovies, writeMovies, addMovies } from '@/lib/store';

export async function GET() {
  const movies = await readMovies();
  return NextResponse.json({ movies });
}

const MoviesBody = z.object({
  movies: z.array(z.string().min(1)).min(1),
  mode: z.enum(['replace', 'append']).default('append').optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = MoviesBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const { movies, mode = 'append' } = parsed.data;
    let updated: string[];
    if (mode === 'replace') {
      await writeMovies(movies);
      updated = movies;
    } else {
      updated = await addMovies(movies);
    }
    return NextResponse.json({ movies: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update movies' }, { status: 500 });
  }
}



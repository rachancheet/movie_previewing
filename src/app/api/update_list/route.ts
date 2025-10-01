import { NextResponse } from 'next/server';
import { z } from 'zod';
import { writeMovies } from '@/lib/store';

const Body = z.object({
  movies: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = Body.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const { movies } = parsed.data;
    await writeMovies(movies);
    return NextResponse.json({ movies });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
}



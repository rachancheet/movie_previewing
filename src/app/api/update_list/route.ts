import { NextResponse } from 'next/server';
import { z } from 'zod';
import { writeMovies } from '@/lib/store';

const Body = z.object({
  movies: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request) {
  try {    
    if (!request.headers.get('content-type')?.includes('application/json')) {
        return NextResponse.json({ error: 'JSON only' }, { status: 415 });
    }
    const key = request.headers.get("authorization");
    if (key !== `Bearer ${process.env.API_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const payload = await request.json();
    const parsed = Body.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const { movies } = parsed.data;
    await writeMovies(movies);
    return NextResponse.json({ movies });
  } catch {
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
}



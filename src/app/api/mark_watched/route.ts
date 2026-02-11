import { NextResponse } from "next/server";
import { markMovieAsWatched } from "@/lib/store";

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        if (!name) {
            return NextResponse.json({ error: "Movie name is required" }, { status: 400 });
        }

        const success = await markMovieAsWatched(name);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Movie not found" }, { status: 404 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

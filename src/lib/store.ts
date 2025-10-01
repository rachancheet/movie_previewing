import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'movies.json');

export async function readMovies(): Promise<string[]> {
  const buf = await fs.readFile(dataFilePath, 'utf8');
  const data = JSON.parse(buf);
  if (!Array.isArray(data)) return [];
  return data.filter((x) => typeof x === 'string');
}

export async function writeMovies(movies: string[]): Promise<void> {
  const unique = Array.from(new Set(movies.map((m) => m.trim()).filter(Boolean)));
  const json = JSON.stringify(unique, null, 2) + '\n';
  await fs.writeFile(dataFilePath, json, 'utf8');
}

export async function addMovies(moviesToAdd: string[]): Promise<string[]> {
  const current = await readMovies();
  const merged = Array.from(new Set([...current, ...moviesToAdd]));
  await writeMovies(merged);
  return merged;
}

export function getRandomMovie(movies: string[]): string | null {
  if (!movies.length) return null;
  const idx = Math.floor(Math.random() * movies.length);
  return movies[idx] ?? null;
}



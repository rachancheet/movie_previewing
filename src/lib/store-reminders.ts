import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'reminders.json');

export type Reminder = {
  id: string;
  title: string;
  notes: string | null;
  is_completed: boolean;
  due_date: string | null;
  priority: number;
  list_name: string | null;
  creation_date: string | null;
};

export type RemindersData = { reminders: Reminder[] };

async function readStore(): Promise<RemindersData> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.reminders)) return parsed as RemindersData;
  } catch {
    // start fresh
  }
  return { reminders: [] };
}

async function writeStore(data: RemindersData): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export async function getReminders(): Promise<Reminder[]> {
  const store = await readStore();
  return store.reminders;
}

export async function updateReminder(id: string, updates: Partial<Reminder>): Promise<boolean> {
  const store = await readStore();
  const index = store.reminders.findIndex(r => r.id === id);
  if (index !== -1) {
    store.reminders[index] = { ...store.reminders[index], ...updates };
    await writeStore(store);
    return true;
  }
  return false;
}

export async function mergeReminders(incoming: Reminder[]): Promise<void> {
  const store = await readStore();
  const existingMap = new Map<string, Reminder>();
  
  // Index by lowercase title as requested (if a reminder with same name already exists)
  store.reminders.forEach(r => {
    existingMap.set(r.title.toLowerCase(), r);
  });

  const merged = [...store.reminders];

  incoming.forEach(newRem => {
    const key = newRem.title.toLowerCase();
    if (!existingMap.has(key)) {
      merged.push(newRem);
      existingMap.set(key, newRem);
    }
    // If it exists, we keep the server version as requested
  });

  await writeStore({ reminders: merged });
}

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Drawing } from '@/types/drawing';

const STORAGE_KEY = 'badartist.drawings.v1';

/**
 * Storage abstraction — the UI must only talk to these functions,
 * never to AsyncStorage directly. Keeps the backend replaceable.
 */
async function readAll(): Promise<Drawing[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Drawing[];
  } catch {
    return [];
  }
}

async function writeAll(drawings: Drawing[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(drawings));
}

export const drawingRepository = {
  async save(drawing: Drawing): Promise<Drawing> {
    const all = await readAll();
    await writeAll([drawing, ...all.filter((d) => d.id !== drawing.id)]);
    return drawing;
  },

  async getDrawing(id: string): Promise<Drawing | null> {
    const all = await readAll();
    return all.find((d) => d.id === id) ?? null;
  },

  async getDrawings(): Promise<Drawing[]> {
    const all = await readAll();
    return [...all].sort((a, b) => b.createdAt - a.createdAt);
  },

  async deleteDrawing(id: string): Promise<void> {
    const all = await readAll();
    await writeAll(all.filter((d) => d.id !== id));
  },

  async count(): Promise<number> {
    return (await readAll()).length;
  },
};

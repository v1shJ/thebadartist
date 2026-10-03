import { newId } from '@/drawing/ids';
import type { Drawing, Stroke } from '@/types/drawing';

export function createDrawing(args: {
  width: number;
  height: number;
  strokes: Stroke[];
  sessionStartedAt: number;
  prompt?: string;
}): Drawing {
  const now = Date.now();
  return {
    id: newId('drawing'),
    width: args.width,
    height: args.height,
    strokes: args.strokes,
    createdAt: now,
    durationMs: Math.max(0, now - args.sessionStartedAt),
    ...(args.prompt ? { prompt: args.prompt } : {}),
  };
}

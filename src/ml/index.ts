import type { DrawingClassifier } from '@/types/drawing';

import { createMockClassifier } from './MockDrawingClassifier';
import { TfjsDrawingClassifier } from './TfjsDrawingClassifier';

let pending: Promise<DrawingClassifier> | null = null;

export function getClassifier(): Promise<DrawingClassifier> {
  if (!pending) {
    pending =
      process.env.EXPO_PUBLIC_ML_MOCK === '1'
        ? Promise.resolve(createMockClassifier())
        : TfjsDrawingClassifier.create();
    pending.catch(() => {
      pending = null;
    });
  }
  return pending;
}

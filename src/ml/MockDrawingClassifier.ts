import { PROMPT_LABELS } from '@/game/prompts';
import type { ClassifierInput, DrawingClassifier, Prediction } from '@/types/drawing';

export function createMockClassifier(seed = 7): DrawingClassifier {
  return {
    async predict({ strokes }: ClassifierInput): Promise<Prediction[]> {
      const pointCount = strokes.reduce((sum, stroke) => sum + stroke.points.length, 0);
      const weights = PROMPT_LABELS.map((label, i) => ({
        label,
        confidence: (Math.sin(seed + i * 7 + pointCount) + 1) / 2,
      }));
      const total = weights.reduce((sum, item) => sum + item.confidence, 0) || 1;
      return weights
        .map((item) => ({ ...item, confidence: item.confidence / total }))
        .sort((a, b) => b.confidence - a.confidence);
    },
  };
}

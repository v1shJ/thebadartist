import { PROMPT_LABELS } from '@/game/prompts';

import { MODEL_LABELS } from './modelLabels';

export const MODEL_CLASS_COUNT = MODEL_LABELS.length;

// Prompts are derived positionally from the model's class list, so prompt
// index i is model class i. Assert it so a future divergence cannot silently
// mislabel predictions.
if (PROMPT_LABELS.length !== MODEL_LABELS.length) {
  throw new Error(
    `Prompt vocabulary (${PROMPT_LABELS.length}) does not match model classes (${MODEL_LABELS.length})`,
  );
}

export const PROMPT_CLASS_INDICES = PROMPT_LABELS.map((_, index) => index);

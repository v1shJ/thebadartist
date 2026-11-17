import { PROMPT_LABELS } from '@/game/prompts';

import { MODEL_LABELS } from './modelLabels';

const lowercase = MODEL_LABELS.map((label) => label.toLowerCase());

export const MODEL_CLASS_COUNT = MODEL_LABELS.length;

export const PROMPT_CLASS_INDICES = PROMPT_LABELS.map((label) => {
  const index = lowercase.indexOf(label);
  if (index < 0) {
    throw new Error(`Prompt "${label}" is missing from the model classes`);
  }
  return index;
});

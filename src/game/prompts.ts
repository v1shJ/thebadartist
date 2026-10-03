/** Initial Quick-Draw-style category pool (Phase 2 ML classes will grow from this). */
export const PROMPT_LABELS = [
  'cat',
  'dog',
  'car',
  'bicycle',
  'house',
  'tree',
  'flower',
  'sun',
  'fish',
  'apple',
  'bird',
  'chair',
  'cup',
  'shoe',
  'snake',
  'spider',
  'moon',
  'star',
  'key',
  'umbrella',
  'clock',
  'mountain',
  'pizza',
  'guitar',
] as const;

export type PromptLabel = (typeof PROMPT_LABELS)[number];

export function isPromptLabel(value: unknown): value is PromptLabel {
  return typeof value === 'string' && (PROMPT_LABELS as readonly string[]).includes(value);
}

/** Three distinct random prompts. */
export function pickThree(): PromptLabel[] {
  const pool = [...PROMPT_LABELS];
  const out: PromptLabel[] = [];
  while (out.length < 3 && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

/** A different random prompt than the current one. */
export function pickReplacement(current: PromptLabel): PromptLabel {
  const pool = PROMPT_LABELS.filter((p) => p !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}

function articleFor(word: string): 'a' | 'an' {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

/** "Draw a Cat" / "Draw an Apple" — the challenge title. */
export function challengeTitle(prompt: string): string {
  const word = prompt.charAt(0).toUpperCase() + prompt.slice(1);
  return `Draw ${articleFor(prompt)} ${word}`;
}

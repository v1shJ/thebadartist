import { MODEL_LABELS } from '../ml/modelLabels';

/**
 * The prompt vocabulary is the model's full class list (345 Quick, Draw!
 * categories), so every prompt is guaranteed to be classifiable.
 *
 * These are the raw model labels (`hot_dog`, `The_Mona_Lisa`); they are
 * stable ids used in routes and storage. Use `promptDisplay` for anything
 * a player reads.
 */
export const PROMPT_LABELS = MODEL_LABELS;

export type PromptLabel = (typeof PROMPT_LABELS)[number];

const PROMPT_SET: ReadonlySet<string> = new Set<string>(PROMPT_LABELS);

export function isPromptLabel(value: unknown): value is PromptLabel {
  return typeof value === 'string' && PROMPT_SET.has(value);
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

const SMALL_WORDS = new Set(['a', 'an', 'and', 'at', 'for', 'in', 'of', 'on', 'the', 'to']);

/**
 * Human-readable label: `hot_dog` → "Hot Dog",
 * `The_Great_Wall_of_China` → "The Great Wall of China".
 */
export function promptDisplay(label: string): string {
  return label
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .map((word, index) => {
      if (word.length === 0) return word;
      if (index > 0 && SMALL_WORDS.has(word)) return word;
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/** "Draw a Hot Dog" / "Draw the Mona Lisa" — the challenge title. */
export function challengeTitle(prompt: string): string {
  const display = promptDisplay(prompt);
  if (display.startsWith('The ')) {
    return `Draw ${display.replace(/^The /, 'the ')}`;
  }
  return `Draw ${articleFor(prompt)} ${display}`;
}

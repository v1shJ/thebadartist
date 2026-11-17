import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';
import { loadLayersModel, type LayersModel } from '@tensorflow/tfjs-layers';

import { PROMPT_LABELS } from '@/game/prompts';
import type { ClassifierInput, DrawingClassifier, Prediction } from '@/types/drawing';

import { MODEL_CLASS_COUNT, PROMPT_CLASS_INDICES } from './labels';
import { loadDoodleNetArtifacts } from './modelAssets';
import { GRID_SIZE, rasterizeStrokes } from './preprocess/rasterize';
import { installTfPlatform } from './tfPlatform';

export class TfjsDrawingClassifier implements DrawingClassifier {
  private constructor(private readonly model: LayersModel) {}

  static async create(): Promise<TfjsDrawingClassifier> {
    const startedAt = Date.now();
    installTfPlatform();
    await tf.setBackend('cpu');
    await tf.ready();

    const artifacts = await loadDoodleNetArtifacts();
    const model = await loadLayersModel({ load: async () => artifacts });

    const inputs = model.inputs[0].shape;
    if (inputs[1] !== GRID_SIZE || inputs[2] !== GRID_SIZE) {
      throw new Error(`Unexpected model input shape: ${JSON.stringify(inputs)}`);
    }
    const outputs = model.outputs[0].shape;
    if (outputs[1] !== MODEL_CLASS_COUNT) {
      throw new Error(`Model outputs ${outputs[1]} classes, expected ${MODEL_CLASS_COUNT}`);
    }

    const classifier = new TfjsDrawingClassifier(model);
    classifier.warmUp();
    if (__DEV__) {
      console.log(
        `[ml] backend=${tf.getBackend()} model ready in ${Date.now() - startedAt}ms`,
      );
    }
    return classifier;
  }

  private warmUp() {
    tf.tidy(() => {
      const input = tf.zeros([1, GRID_SIZE, GRID_SIZE, 1]);
      this.model.predict(input);
    });
  }

  async predict({ strokes }: ClassifierInput): Promise<Prediction[]> {
    const startedAt = Date.now();
    const ink = rasterizeStrokes(strokes);

    const scores = tf.tidy(() => {
      const input = tf.tensor4d(ink, [1, GRID_SIZE, GRID_SIZE, 1]);
      const output = this.model.predict(input) as tf.Tensor;
      return Array.from(output.dataSync());
    });

    const candidates = PROMPT_LABELS.map((label, i) => ({
      label,
      value: scores[PROMPT_CLASS_INDICES[i]] ?? 0,
    }));
    const total = candidates.reduce((sum, item) => sum + item.value, 0) || 1;

    if (__DEV__) {
      console.log(`[ml] inference in ${Date.now() - startedAt}ms (${strokes.length} strokes)`);
    }

    return candidates
      .map(({ label, value }) => ({ label, confidence: value / total }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  dispose() {
    this.model.dispose();
  }
}

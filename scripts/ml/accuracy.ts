import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';
import { loadLayersModel } from '@tensorflow/tfjs-layers';
import { rasterizeStrokes, GRID_SIZE } from '../../src/ml/preprocess/rasterize';
import { MODEL_LABELS } from '../../src/ml/modelLabels';
import type { Stroke } from '../../src/types/drawing';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const MODEL_DIR = join(ROOT, 'assets/ml/doodlenet');
const CACHE_DIR = join(ROOT, '.ml-cache');

type LabelsModel = Awaited<ReturnType<typeof loadLayersModel>>;

const now = () => Number(process.hrtime.bigint() / 1000000n);

async function loadModel(): Promise<LabelsModel> {
  const modelJson = JSON.parse(readFileSync(join(MODEL_DIR, 'model.json'), 'utf8'));
  const bin = readFileSync(join(MODEL_DIR, 'group1-shard1of1.bin'));
  const weightData = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);
  const artifacts = {
    modelTopology: modelJson.modelTopology,
    weightSpecs: modelJson.weightsManifest.flatMap(
      (group: { weights: unknown[] }) => group.weights,
    ),
    weightData,
    format: 'layers-model',
    generatedBy: modelJson.generatedBy,
    convertedBy: modelJson.convertedBy,
  };
  return loadLayersModel({ load: async () => artifacts } as never);
}

function predict(model: LabelsModel, images: Float32Array, n: number): number[][] {
  return tf.tidy(() => {
    const input = tf.tensor4d(images, [n, GRID_SIZE, GRID_SIZE, 1]);
    const out = model.predict(input) as tf.Tensor;
    return out.arraySync() as number[][];
  });
}

function restrict(probs: number[], indices: number[]) {
  const picked = indices.map((i) => probs[i]);
  const sum = picked.reduce((a, b) => a + b, 0) || 1;
  const norm = picked.map((p) => p / sum);
  const ranked = norm
    .map((p, i) => ({ i, p }))
    .sort((a, b) => b.p - a.p);
  return { top1: ranked[0], top3: ranked.slice(0, 3), ranked };
}

function loadBitmapBatch(cls: string): { images: Float32Array; n: number } {
  const meta = JSON.parse(readFileSync(join(CACHE_DIR, `${cls}.meta.json`), 'utf8'));
  const raw = readFileSync(join(CACHE_DIR, `${cls}.bin`));
  const n = meta.count as number;
  const images = new Float32Array(n * GRID_SIZE * GRID_SIZE);
  for (let i = 0; i < images.length; i += 1) images[i] = raw[i] / 255;
  return { images, n };
}

function invertBatch(images: Float32Array): Float32Array {
  const out = new Float32Array(images.length);
  for (let i = 0; i < images.length; i += 1) out[i] = 1 - images[i];
  return out;
}

type RawDrawing = { drawing: number[][][] };

function rawToStrokes(drawing: number[][][]): Stroke[] {
  return drawing.map((stroke, i) => {
    const [xs, ys, ts] = stroke;
    const points = xs.map((x, j) => ({ x, y: ys[j], timestamp: ts[j] }));
    return { id: String(i), points, startedAt: ts[0] ?? 0, endedAt: ts[ts.length - 1] ?? 0 };
  });
}

async function main() {
  await tf.setBackend('cpu');
  await tf.ready();
  console.log('backend:', tf.getBackend());

  const classes = readFileSync(join(MODEL_DIR, 'class_names.txt'), 'utf8')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Validation uses whatever classes `ml:fetch` cached, not the app's full
  // prompt vocabulary (which is all 345 model classes).
  const cached = existsSync(CACHE_DIR)
    ? readdirSync(CACHE_DIR)
        .filter((file) => file.endsWith('.bin'))
        .map((file) => file.slice(0, -'.bin'.length))
        .filter((label) => existsSync(join(CACHE_DIR, `${label}.meta.json`)))
        .sort()
    : [];

  if (cached.length === 0) {
    console.log('no cached samples in .ml-cache — run `npm run ml:fetch` first');
    return;
  }

  const modelIndex = new Map<string, number>(
    MODEL_LABELS.map((label, index) => [label.toLowerCase(), index] as const),
  );
  const validation = cached.map((label) => {
    const index = modelIndex.get(label.toLowerCase());
    if (index == null) throw new Error(`cached class "${label}" is not in the model`);
    return { label, index };
  });
  const indices = validation.map((entry) => entry.index);
  console.log('classes:', classes.length, '| validation classes:', validation.length);

  const t0 = now();
  const model = await loadModel();
  console.log('model loaded in', now() - t0, 'ms | input:', model.inputs[0].shape, '| output:', model.outputs[0].shape);

  const labelAt = (i: number) => classes[i];

  for (const polarity of ['ink-on-black', 'black-on-white'] as const) {
    const tStart = now();
    let restrictedTop1 = 0;
    let restrictedTop3 = 0;
    let fullTop1 = 0;
    let total = 0;
    const perClass: Record<string, string> = {};

    for (let c = 0; c < validation.length; c += 1) {
      const { label, index } = validation[c];
      const { images, n } = loadBitmapBatch(label);
      const batch = polarity === 'ink-on-black' ? images : invertBatch(images);
      const probs = predict(model, batch, n);
      let cTop1 = 0;
      let cTop3 = 0;
      for (let i = 0; i < n; i += 1) {
        const r = restrict(probs[i], indices);
        if (r.top1.i === c) cTop1 += 1;
        if (r.top3.some((s) => s.i === c)) cTop3 += 1;
        let best = 0;
        for (let k = 1; k < probs[i].length; k += 1) if (probs[i][k] > probs[i][best]) best = k;
        if (best === index) fullTop1 += 1;
      }
      restrictedTop1 += cTop1;
      restrictedTop3 += cTop3;
      total += n;
      perClass[label] = `${((cTop1 / n) * 100).toFixed(0)}%/${((cTop3 / n) * 100).toFixed(0)}%`;
    }

    console.log(`\n=== ${polarity} (${total} samples, ${now() - tStart}ms) ===`);
    console.log(
      `restricted top-1 ${((restrictedTop1 / total) * 100).toFixed(1)}% | top-3 ${((restrictedTop3 / total) * 100).toFixed(1)}% | full-345 top-1 ${((fullTop1 / total) * 100).toFixed(1)}%`,
    );
    console.log('per class (top1/top3):', JSON.stringify(perClass));
  }

  console.log('\n=== raw stroke rasterization ===');
  const variants = [
    { name: 'r0.5 m2', radius: 0.5, margin: 2 },
    { name: 'r0.75 m2', radius: 0.75, margin: 2 },
    { name: 'r1.0 m2', radius: 1, margin: 2 },
    { name: 'r0.75 m3', radius: 0.75, margin: 3 },
  ];
  for (const variant of variants) {
    let hit = 0;
    let total = 0;
    let zeroInputs = 0;
    const tStart = now();
    for (let c = 0; c < validation.length; c += 1) {
      const { label } = validation[c];
      let raw: RawDrawing[];
      try {
        raw = JSON.parse(readFileSync(join(CACHE_DIR, `${label}.raw.json`), 'utf8'));
      } catch {
        continue;
      }
      const sample = raw.slice(0, 25);
      const images = new Float32Array(sample.length * GRID_SIZE * GRID_SIZE);
      sample.forEach((d, i) => {
        const img = rasterizeStrokes(rawToStrokes(d.drawing), {
          radius: variant.radius,
          margin: variant.margin,
        });
        let ink = 0;
        for (let k = 0; k < img.length; k += 1) ink += img[k];
        if (ink === 0) zeroInputs += 1;
        images.set(img, i * GRID_SIZE * GRID_SIZE);
      });
      const probs = predict(model, images, sample.length);
      for (let i = 0; i < sample.length; i += 1) {
        const r = restrict(probs[i], indices);
        if (r.top1.i === c) hit += 1;
        total += 1;
      }
    }
    console.log(
      `${variant.name}: top-1 ${((hit / total) * 100).toFixed(1)}% (${hit}/${total}) in ${now() - tStart}ms, empty=${zeroInputs}`,
    );
  }

  const samplePred = (() => {
    const label = 'cat';
    const raw: RawDrawing[] = JSON.parse(
      readFileSync(join(CACHE_DIR, `${label}.raw.json`), 'utf8'),
    );
    const strokes = raw.slice(0, 5).map((d) => rawToStrokes(d.drawing));
    const images = new Float32Array(strokes.length * GRID_SIZE * GRID_SIZE);
    strokes.forEach((s, i) => images.set(rasterizeStrokes(s), i * GRID_SIZE * GRID_SIZE));
    const probs = predict(model, images, strokes.length);
    return probs.map((p) => {
      const r = restrict(p, indices);
      return r.top3.map((s) => `${validation[s.i].label} ${(s.p * 100).toFixed(0)}%`).join(', ');
    });
  })();
  console.log('sample cat raws ->', samplePred);
  console.log('labelAt sanity:', [0, 100, 211, 344].map((i) => `${i}:${labelAt(i)}`).join(' '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

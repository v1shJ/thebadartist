import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const MODEL_DIR = join(ROOT, 'assets/ml/doodlenet');
const CACHE_DIR = join(ROOT, '.ml-cache');

const MODEL_BASE =
  'https://raw.githubusercontent.com/yining1023/doodleNet/master/demo/DoodleClassifier_345/model';
const NPY_BASE = 'https://storage.googleapis.com/quickdraw_dataset/full/numpy_bitmap';
const RAW_BASE = 'https://storage.googleapis.com/quickdraw_dataset/full/raw';

const CLASSES = [
  'cat', 'dog', 'car', 'bicycle', 'house', 'tree', 'flower', 'sun',
  'fish', 'apple', 'bird', 'chair', 'cup', 'shoe', 'snake', 'spider',
  'moon', 'star', 'key', 'umbrella', 'clock', 'mountain', 'pizza', 'guitar',
];

const SAMPLES_PER_CLASS = 200;
const ROWS = 28 * 28;

async function download(url, dest, headers = {}) {
  await mkdir(dirname(dest), { recursive: true });
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf;
}

async function fetchNpySamples(cls, count) {
  const url = `${NPY_BASE}/${cls}.npy`;
  const head = await download(url, join(CACHE_DIR, `${cls}.head`), { Range: 'bytes=0-255' });

  if (head.subarray(0, 6).toString('latin1') !== '\x93NUMPY') {
    throw new Error(`not an npy file: ${cls}`);
  }
  const major = head[6];
  const headerLen = major === 1 ? head.readUInt16LE(8) : head.readUInt32LE(8);
  const dataStart = (major === 1 ? 10 : 12) + headerLen;
  const header = head.subarray(major === 1 ? 10 : 12, dataStart).toString('latin1');
  const shapeMatch = /'shape':\s*\((\d+),\s*(\d+)\)/.exec(header);
  if (!shapeMatch) throw new Error(`unparsed shape ${header}`);

  const totalRows = Number(shapeMatch[1]);
  if (Number(shapeMatch[2]) !== ROWS) throw new Error(`bad row size ${shapeMatch[2]}`);
  const n = Math.min(count, totalRows);
  const end = dataStart + n * ROWS - 1;

  const body = await download(url, join(CACHE_DIR, `${cls}.bin`), {
    Range: `bytes=${dataStart}-${end}`,
  });
  if (body.length !== n * ROWS) {
    throw new Error(`${cls}: expected ${n * ROWS} bytes, got ${body.length}`);
  }
  await writeFile(
    join(CACHE_DIR, `${cls}.meta.json`),
    JSON.stringify({ cls, count: n, totalRows, dataStart, headerLen, version: major }),
  );

  let ink = 0;
  let max = 0;
  let borderInk = 0;
  let borderCount = 0;
  for (let i = 0; i < n; i += 1) {
    for (let y = 0; y < 28; y += 1) {
      for (let x = 0; x < 28; x += 1) {
        const v = body[i * ROWS + y * 28 + x];
        if (v > 0) ink += 1;
        if (v > max) max = v;
        if (x === 0 || y === 0 || x === 27 || y === 27) {
          borderCount += 1;
          if (v > 0) borderInk += 1;
        }
      }
    }
  }
  return {
    cls,
    count: n,
    totalRows,
    inkFraction: +(ink / (n * ROWS)).toFixed(4),
    max,
    borderInkFraction: +(borderInk / borderCount).toFixed(4),
  };
}

async function fetchRaw(cls, byteCount = 262144) {
  const url = `${RAW_BASE}/${cls}.ndjson`;
  const res = await fetch(url, { headers: { Range: `bytes=0-${byteCount - 1}` } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const text = await res.text();
  const lines = text.split('\n').filter((l) => l.trim().endsWith('}'));
  const drawings = [];
  for (const line of lines) {
    try {
      drawings.push(JSON.parse(line));
    } catch {
      break;
    }
  }
  await writeFile(join(CACHE_DIR, `${cls}.raw.json`), JSON.stringify(drawings));
  return { cls, drawings: drawings.length };
}

async function main() {
  console.log('model files ->', MODEL_DIR);
  for (const name of ['model.json', 'group1-shard1of1.bin', 'class_names.txt']) {
    const dest = join(MODEL_DIR, name);
    if (existsSync(dest)) {
      console.log('  skip (exists)', name);
      continue;
    }
    const buf = await download(`${MODEL_BASE}/${name}`, dest);
    console.log('  saved', name, buf.length, 'bytes');
  }

  console.log('npy samples ->', CACHE_DIR);
  const stats = [];
  for (const cls of CLASSES) {
    stats.push(await fetchNpySamples(cls, SAMPLES_PER_CLASS));
    console.log('  ', cls, JSON.stringify(stats.at(-1)));
  }

  console.log('raw ndjson samples');
  for (const cls of CLASSES) {
    try {
      console.log('  ', JSON.stringify(await fetchRaw(cls)));
    } catch (err) {
      console.warn('  raw failed', cls, err.message);
    }
  }

  await writeFile(join(CACHE_DIR, 'stats.json'), JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

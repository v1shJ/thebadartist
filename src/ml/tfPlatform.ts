import * as tf from '@tensorflow/tfjs-core';

let installed = false;

function encodeUtf8(text: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text);
  }
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i) & 0xff;
  return bytes;
}

function decodeUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(bytes);
  }
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]);
  return out;
}

export function installTfPlatform() {
  if (installed) return;
  installed = true;

  tf.setPlatform('react-native', {
    fetch: (path, init) => fetch(path, init),
    now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
    encode: (text) => encodeUtf8(text),
    decode: (bytes) => decodeUtf8(bytes),
    isTypedArray: (value): value is Float32Array | Int32Array | Uint8Array | Uint8ClampedArray =>
      ArrayBuffer.isView(value) && !(value instanceof DataView),
  });
}

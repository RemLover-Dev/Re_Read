/// <reference types="vite/client" />
import wasmUrl from 'node-unrar-js/esm/js/unrar.wasm?url';

let wasmPromise: Promise<ArrayBuffer> | undefined;

export function loadRarWasm(): Promise<ArrayBuffer> {
  wasmPromise ??= fetch(wasmUrl).then((response) => {
    if (!response.ok) throw new Error(`Unable to load the RAR decoder (${response.status}).`);
    return response.arrayBuffer();
  }).catch((error) => {
    wasmPromise = undefined;
    throw error;
  });
  return wasmPromise;
}

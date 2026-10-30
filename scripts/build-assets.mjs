import { mkdir, copyFile } from "node:fs/promises";
await import("./merge-original-map.mjs");
await import("./build-world-chunks.mjs");
await import("./build-explosion-lod.mjs");
await mkdir("public/draco", { recursive: true });
for (const name of [
  "draco_wasm_wrapper.js",
  "draco_decoder.wasm",
  "draco_decoder.js",
]) {
  await copyFile(
    `node_modules/three/examples/jsm/libs/draco/gltf/${name}`,
    `public/draco/${name}`,
  );
}

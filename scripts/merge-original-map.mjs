import { readFile, readdir, writeFile } from "node:fs/promises";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { Mesh, MeshStandardMaterial, Box3, Vector3 } from "three";

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};
const loader = new GLTFLoader();
const geometries = [];
for (const name of (await readdir("public/Maps"))
  .filter((n) => n.endsWith(".glb"))
  .sort()) {
  const bytes = await readFile(`public/Maps/${name}`);
  const { scene } = await loader.parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  scene.updateMatrixWorld(true);
  if (["PT_002.glb", "DE_001.glb", "GB_001.glb"].includes(name))
    console.log(
      name,
      new Box3().setFromObject(scene).min,
      new Box3().setFromObject(scene).max,
    );
  scene.traverse((object) => {
    if (!object.isMesh) return;
    let geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
    if (geometry.index) geometry = geometry.toNonIndexed();
    for (const key of Object.keys(geometry.attributes))
      if (!["position", "normal"].includes(key)) geometry.deleteAttribute(key);
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    geometries.push(geometry);
  });
}
const geometry = mergeGeometries(geometries);
const mesh = new Mesh(
  geometry,
  new MeshStandardMaterial({ color: "#555555", roughness: 0.85 }),
);
mesh.name = "Original country models - merged";
console.log(
  "Bounds",
  new Box3().setFromObject(mesh).min,
  new Box3().setFromObject(mesh).max,
  "vertices",
  geometry.attributes.position.count,
);
const glb = await new GLTFExporter().parseAsync(mesh, { binary: true });
await writeFile("public/map-original.glb", new Uint8Array(glb));
console.log(
  "Merged",
  geometries.length,
  "meshes into",
  glb.byteLength,
  "bytes",
);

import { readFile, writeFile } from "node:fs/promises";
import draco3d from "draco3d";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import {
  Mesh,
  MeshStandardMaterial,
  BufferAttribute,
  BufferGeometry,
} from "three";
import { MeshoptSimplifier } from "meshoptimizer/simplifier";
globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};
const bytes = await readFile("public/trees.glb");
const jsonLength = bytes.readUInt32LE(12),
  json = JSON.parse(bytes.toString("utf8", 20, 20 + jsonLength));
const view = json.bufferViews[0],
  binOffset = 20 + jsonLength + 8;
const compressed = bytes.subarray(
  binOffset + (view.byteOffset || 0),
  binOffset + (view.byteOffset || 0) + view.byteLength,
);
const module = await draco3d.createDecoderModule({}),
  decoder = new module.Decoder(),
  buffer = new module.DecoderBuffer();
buffer.Init(compressed, compressed.length);
const decoded = new module.Mesh();
const status = decoder.DecodeBufferToMesh(buffer, decoded);
if (!status.ok()) throw Error(status.error_msg());
const positions = new Float32Array(decoded.num_points() * 3),
  attr = decoder.GetAttributeByUniqueId(decoded, 0),
  values = new module.DracoFloat32Array();
decoder.GetAttributeFloatForAllPoints(decoded, attr, values);
for (let i = 0; i < positions.length; i++) positions[i] = values.GetValue(i);
const sourceIndices = new Uint32Array(decoded.num_faces() * 3),
  face = new module.DracoInt32Array();
for (let i = 0; i < decoded.num_faces(); i++) {
  decoder.GetFaceFromMesh(decoded, i, face);
  for (let j = 0; j < 3; j++) sourceIndices[i * 3 + j] = face.GetValue(j);
}
const source = new BufferGeometry();
source.setAttribute("position", new BufferAttribute(positions, 3));
source.setIndex(new BufferAttribute(sourceIndices, 1));
for (const object of [face, values, decoded, buffer, decoder])
  module.destroy(object);
await MeshoptSimplifier.ready;
async function exportLevel(errorLimit, output) {
  const geometry = mergeVertices(source.clone());
  const [indices, error] = MeshoptSimplifier.simplifySloppy(
    new Uint32Array(geometry.index.array),
    new Float32Array(geometry.attributes.position.array),
    3,
    null,
    9000,
    errorLimit,
  );
  const remap = new Map(),
    compact = [],
    positionsBefore = geometry.attributes.position.array;
  for (let i = 0; i < indices.length; i++) {
    const old = indices[i];
    if (!remap.has(old)) {
      remap.set(old, remap.size);
      compact.push(
        positionsBefore[old * 3],
        positionsBefore[old * 3 + 1],
        positionsBefore[old * 3 + 2],
      );
    }
    indices[i] = remap.get(old);
  }
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(compact), 3),
  );
  geometry.setIndex(new BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  const mesh = new Mesh(
    geometry,
    new MeshStandardMaterial({ color: "#f00511" }),
  );
  mesh.name = "Foliage";
  await writeFile(
    output,
    new Uint8Array(await new GLTFExporter().parseAsync(mesh, { binary: true })),
  );
  console.log(output, indices.length / 3, "triangles, relative error", error);
}
await exportLevel(0.05, "public/trees-mid.glb");
await exportLevel(0.15, "public/trees-lod.glb");

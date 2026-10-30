import test from "node:test";
import assert from "node:assert/strict";
import { Group, Mesh, BoxGeometry, MeshBasicMaterial, Matrix4 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { preparePropellers, spinPropellers } from "../src/javascript/data/propellers.js";

test("a propeller integrated into an aircraft mesh is separated without changing the shared source geometry", () => {
  const body=new BoxGeometry(.8,.3,1);
  const blade=new BoxGeometry(.4,.15,.04).translate(0,.18,-.79);
  const original=mergeGeometries([body,blade]);
  const model=new Group(), mesh=new Mesh(original,new MeshBasicMaterial());
  mesh.name="Circle_curtissP40_0";model.add(mesh);
  const before=original.index.count;
  const result=preparePropellers(model,"curtiss_p40_airplane");
  assert.equal(result.rotors.length,1);
  assert.equal(original.index.count,before);
  const count=mesh.geometry.attributes.position.count+result.rotors[0].pivot.children[0].geometry.attributes.position.count;
  assert.equal(count,before,"every original triangle belongs to exactly one output");
  const bodyBounds=mesh.geometry.computeBoundingBox()??mesh.geometry.boundingBox;
  assert.ok(bodyBounds.min.z>=-.5);
  const rotor=result.rotors[0], rotation=rotor.pivot.quaternion.clone();
  spinPropellers(result.rotors,1/60,4);
  assert.ok(rotation.angleTo(rotor.pivot.quaternion)>0);
  assert.deepEqual(rotor.pivot.position.toArray(),[0,.176,-.799]);
  result.dispose();body.dispose();blade.dispose();original.dispose();
});
test("two engines receive independent centered rotor pivots", () => {
  const left=new BoxGeometry(.3,.3,.04).translate(-.306,.07,-.55);
  const right=new BoxGeometry(.3,.3,.04).translate(.306,.07,-.55);
  const model=new Group(), mesh=new Mesh(mergeGeometries([left,right]),new MeshBasicMaterial());
  mesh.name="Object_20";model.add(mesh);
  const result=preparePropellers(model,"german_ww2_bomber_henschel");
  assert.equal(result.rotors.length,2);
  assert.equal(mesh.visible,false);
  for(const rotor of result.rotors)assert.ok(Math.abs(rotor.axis.length()-1)<1e-10);
  spinPropellers(result.rotors,1/30,4);
  assert.ok(result.rotors.every(r=>r.angle>0));
  result.dispose();left.dispose();right.dispose();mesh.geometry.dispose();
});

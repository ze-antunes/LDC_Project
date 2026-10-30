import test from "node:test";
import assert from "node:assert/strict";
import { Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide, Raycaster, Vector3 } from "three";
import { visibleLandHit } from "../src/javascript/data/mapPicking.js";

test("water occludes countries behind it, independently of surface list order", () => {
  const make = (kind, y) => {
    const mesh = new Mesh(new PlaneGeometry(100, 100), new MeshBasicMaterial({side: DoubleSide}));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = y;
    mesh.userData.mapSurface = kind;
    mesh.updateMatrixWorld();
    return mesh;
  };
  const ocean = make("water", 0);
  const remoteCountry = make("land", -10);
  const ray = new Raycaster(new Vector3(0, 20, 0), new Vector3(0, -1, 0));
  assert.equal(visibleLandHit(ray, [remoteCountry, ocean]), null);
  assert.equal(visibleLandHit(ray, [ocean, remoteCountry]), null);
  const visibleCountry = make("land", 1);
  assert.equal(visibleLandHit(ray, [remoteCountry, ocean, visibleCountry]).object, visibleCountry);
  assert.equal(visibleLandHit(ray, []), null);
});

export function visibleLandHit(raycaster, surfaces) {
  const hit = raycaster.intersectObjects(surfaces, false)[0];
  return hit?.object.userData.mapSurface === "land" ? hit : null;
}

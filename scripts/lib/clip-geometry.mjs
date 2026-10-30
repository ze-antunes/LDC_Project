export function clipPolygon(vertices, axis, bound, keepGreater) {
  const result = [];
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i],
      b = vertices[(i + 1) % vertices.length],
      insideA = keepGreater ? a[axis] >= bound : a[axis] <= bound,
      insideB = keepGreater ? b[axis] >= bound : b[axis] <= bound;
    if (insideA) result.push(a);
    if (insideA !== insideB) {
      const t = (bound - a[axis]) / (b[axis] - a[axis]);
      result.push(a.map((value, index) => value + (b[index] - value) * t));
    }
  }
  return result;
}
export function clipTriangle(triangle, minX, maxX, minZ, maxZ) {
  let polygon = triangle;
  for (const [axis, bound, greater] of [
    [0, minX, true],
    [0, maxX, false],
    [2, minZ, true],
    [2, maxZ, false],
  ]) {
    polygon = clipPolygon(polygon, axis, bound, greater);
    if (polygon.length < 3) return [];
  }
  const triangles = [];
  for (let i = 1; i < polygon.length - 1; i++)
    triangles.push([polygon[0], polygon[i], polygon[i + 1]]);
  return triangles;
}

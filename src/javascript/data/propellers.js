import { Box3, Vector3, Group, Mesh, BufferGeometry, BufferAttribute } from "three";

// Coordinates refer to the normalized aircraft: 2.2 units, nose towards -Z.
export const PROPELLERS = {
  allies_airplane_ww2: [{ meshes: ["Object_10"], center: [0.003, 0.095, -0.805], axis: [0, -0.21, 1] }],
  curtiss_p40_airplane: [{ meshes: ["Circle_curtissP40_0"], center: [0, 0.176, -0.799], axis: [0, -0.21, 1], components: true, accept: b => b.max.z < -0.72 && b.min.z > -0.91 && Math.max(b.max.x-b.min.x, b.max.y-b.min.y) > 0.1 && b.max.z-b.min.z < 0.12 }],
  german_ww2_bomber_henschel: [
    { meshes: ["Object_20"], center: [-0.306, 0.070, -0.550], axis: [0, -0.21, 1], side: -1 },
    { meshes: ["Object_20"], center: [0.306, 0.070, -0.550], axis: [0, -0.21, 1], side: 1 },
  ],
  ww2_aircraft_lowpoly: [
    { meshes: ["Object_6"], center: [0.580, -0.034, -0.488] },
    { meshes: ["Object_10"], center: [0.286, -0.042, -0.519] },
    { meshes: ["Object_14"], center: [-0.606, -0.034, -0.485] },
    { meshes: ["Object_18"], center: [-0.290, -0.042, -0.518] },
  ],
  zirkus_rosarius_spitfire: [{ meshes: ["defaultMaterial"], center: [0, 0.061, -0.848], components: true, accept: b => b.max.z < -0.80 && b.min.z > -0.90 }],
  "p-100_avenger_-_free": [{ meshes: ["Object_26"], center: [0, 0.049, -0.768] }],
};

// Weld by position only for connectivity; keep original UVs/normals in output.
export function componentBounds(geometry, transform) {
  const pos = geometry.attributes.position, parent = Array.from({ length: pos.count }, (_, i) => i);
  const root = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const union = (a,b) => { parent[root(a)] = root(b); };
  const weld = new Map(), point = new Vector3();
  for (let i=0; i<pos.count; i++) {
    point.fromBufferAttribute(pos,i).applyMatrix4(transform);
    const key = point.toArray().map(v=>Math.round(v*1e5)).join(",");
    if (weld.has(key)) union(i,weld.get(key)); else weld.set(key,i);
  }
  const count = geometry.index?.count ?? pos.count;
  const at = i => geometry.index ? geometry.index.getX(i) : i;
  for (let i=0;i<count;i+=3) { union(at(i),at(i+1)); union(at(i),at(i+2)); }
  const boxes = new Map();
  for (let i=0;i<pos.count;i++) {
    const r=root(i); if(!boxes.has(r)) boxes.set(r,new Box3());
    boxes.get(r).expandByPoint(point.fromBufferAttribute(pos,i).applyMatrix4(transform));
  }
  return { root, boxes };
}
function triangleSubset(source, triangles) {
  const result = new BufferGeometry();
  const indices = triangles.flatMap(i => [i,i+1,i+2].map(j=>source.index ? source.index.getX(j) : j));
  for (const [name, attribute] of Object.entries(source.attributes)) {
    const array = new attribute.array.constructor(indices.length * attribute.itemSize);
    indices.forEach((id,i)=>{for(let c=0;c<attribute.itemSize;c++)array[i*attribute.itemSize+c]=attribute.isInterleavedBufferAttribute ? attribute.data.array[id*attribute.data.stride+attribute.offset+c] : attribute.array[id*attribute.itemSize+c]});
    result.setAttribute(name,new BufferAttribute(array,attribute.itemSize,attribute.normalized));
  }
  return result;
}
export function preparePropellers(model, aircraftId) {
  model.updateMatrixWorld(true);
  const group = new Group(); group.name = "animated-aircraft";
  const rotors = [], owned = [];
  const configs = PROPELLERS[aircraftId] || [];
  const meshes = []; model.traverse(o=>{if(o.isMesh)meshes.push(o)});
  // Use original matrices before reparenting the normalized model.
  for (const mesh of meshes) {
    const matches=configs.map((c,i)=>({c,i})).filter(({c})=>c.meshes.includes(mesh.name));
    if(!matches.length)continue;
    const source=mesh.geometry, matrix=mesh.matrixWorld.clone();
    const components=matches.some(({c})=>c.components)?componentBounds(source,matrix):null;
    const buckets=new Map(matches.map(({i})=>[i,[]])), rest=[];
    const point=new Vector3(), pos=source.attributes.position;
    const count=source.index?.count ?? pos.count;
    for(let t=0;t<count;t+=3){
      const id=source.index?source.index.getX(t):t;
      point.fromBufferAttribute(pos,id).applyMatrix4(matrix);
      const match=matches.find(({c})=>(!c.side || point.x*c.side>0)&&(!c.components || c.accept(components.boxes.get(components.root(id)))));
      if(match)buckets.get(match.i).push(t);else rest.push(t);
    }
    for(const {c,i}of matches){
      const triangles=buckets.get(i);if(!triangles.length)continue;
      let rotor=rotors.find(r=>r.id===i);
      if(!rotor){const pivot=new Group();pivot.name=`propeller-${i}`;pivot.position.fromArray(c.center);group.add(pivot);rotor={id:i,pivot,axis:new Vector3(...c.axis||[0,0,1]).normalize(),angle:0};rotors.push(rotor)}
      const geometry=triangleSubset(source,triangles).applyMatrix4(matrix).translate(-c.center[0],-c.center[1],-c.center[2]);
      // A mirrored source mesh used renderer-side face reversal. Bake it too.
      if(matrix.determinant()<0)for(const attribute of Object.values(geometry.attributes)) {
        for(let v=0;v<attribute.count;v+=3)for(let k=0;k<attribute.itemSize;k++) {
          const a=(v+1)*attribute.itemSize+k,b=(v+2)*attribute.itemSize+k;
          const value=attribute.array[a];attribute.array[a]=attribute.array[b];attribute.array[b]=value;
        }
      }
      owned.push(geometry);
      const part=new Mesh(geometry,mesh.material);part.name=`rotating-${mesh.name}`;rotor.pivot.add(part);
    }
    if(rest.length){mesh.geometry=triangleSubset(source,rest);owned.push(mesh.geometry)}else mesh.visible=false;
  }
  group.add(model);
  return {group,rotors,dispose:()=>owned.forEach(g=>g.dispose())};
}
export function spinPropellers(rotors, dt, speed) {
  for(const rotor of rotors){rotor.angle=(rotor.angle+Math.min(dt,.05)*(24+speed*3))%(Math.PI*2);rotor.pivot.quaternion.setFromAxisAngle(rotor.axis,rotor.angle)}
}

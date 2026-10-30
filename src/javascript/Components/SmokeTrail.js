import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, Vector3, ShaderMaterial, UniformsLib, UniformsUtils } from "three";
import { useExplorer } from "../stores/useExplorer";
import { cameraRebase } from "../data/worldStream";
const CAPACITY=128, LIFE=3.2;
export default function SmokeTrail({ plane, flight, aircraftId, reset }) {
  const simulation=useRef({cursor:0,emission:0,last:null});
  const resources=useMemo(()=>{
    const geometry=new BufferGeometry();
    geometry.setAttribute("position",new Float32BufferAttribute(new Float32Array(CAPACITY*3),3));
    geometry.setAttribute("life",new Float32BufferAttribute(new Float32Array(CAPACITY).fill(-1),1));
    const material=new ShaderMaterial({transparent:true,depthWrite:false,fog:true,
      uniforms:{...UniformsUtils.clone(UniformsLib.fog),pixelHeight:{value:900}},
      vertexShader:`attribute float life; varying float age; uniform float pixelHeight;
        #include <fog_pars_vertex>
        void main(){age=life;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mvPosition;
        gl_PointSize=life<0.0?0.0:min(100.0,(0.10+life*0.42)*pixelHeight*projectionMatrix[1][1]/max(0.1,-mvPosition.z));
        #include <fog_vertex>
        }`,
      fragmentShader:`varying float age;
        #include <fog_pars_fragment>
        void main(){if(age<0.0)discard;float r=length(gl_PointCoord-0.5)*2.0;
        float alpha=(1.0-smoothstep(0.12,1.0,r))*0.19*pow(1.0-age,1.5)*smoothstep(0.0,0.06,age);
        if(alpha<0.003)discard;gl_FragColor=vec4(vec3(0.69),alpha);
        #include <fog_fragment>
        }`});
    return {geometry,material,tail:new Vector3()};
  },[]);
  useEffect(()=>{
    resources.geometry.attributes.life.array.fill(-1);resources.geometry.attributes.life.needsUpdate=true;
    simulation.current={cursor:0,emission:0,last:null};
  },[aircraftId,reset,resources]);
  useEffect(()=>()=>{resources.geometry.dispose();resources.material.dispose()},[resources]);
  useFrame((state,delta)=>{
    const f=flight.current, s=simulation.current, geo=resources.geometry;
    resources.material.uniforms.pixelHeight.value=state.size.height*state.gl.getPixelRatio();
    const explorer=useExplorer.getState();
    if(!plane.current || explorer.paused || f.paused || explorer.cameraMode!=="flight")return;
    const dt=Math.min(delta,.05), pos=geo.attributes.position, life=geo.attributes.life;
    if(s.last){const [dx,dz]=cameraRebase(s.last,f);if(dx||dz)for(let i=0;i<CAPACITY;i++){pos.array[i*3]+=dx;pos.array[i*3+2]+=dz}}
    s.last={x:f.x,z:f.z};
    for(let i=0;i<CAPACITY;i++)if(life.array[i]>=0){life.array[i]+=dt/LIFE;if(life.array[i]>=1)life.array[i]=-1;else pos.array[i*3+1]+=dt*.06}
    s.emission+=dt;
    while(s.emission>=1/30){s.emission-=1/30;
      plane.current.updateWorldMatrix(true,false);
      const p=resources.tail.set(0,-.035,.75).applyMatrix4(plane.current.matrixWorld);
      const i=s.cursor++%CAPACITY;
      pos.setXYZ(i,p.x,p.y,p.z);life.array[i]=0;
    }
    pos.needsUpdate=true;life.needsUpdate=true;
  });
  return <points name="aircraft-smoke-trail" geometry={resources.geometry} material={resources.material} frustumCulled={false} dispose={null} raycast={()=>null} />;
}

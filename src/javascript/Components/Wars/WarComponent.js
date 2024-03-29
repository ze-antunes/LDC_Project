import React, { useRef, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { RedFormat, DataTexture, Color, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { StyleShader } from "./StyleShader";

export let Wars = ({ scale = 0.1, position = [0, 0.5, 0], colors = [] }) => {
    let [active, setActive] = useState(false);
    let { nodes, materials } = useGLTF("/trees.glb");

    let refObj = useRef(null);

    useFrame(() => {
        let { current: group } = refObj
        if (group) {
            group.rotation.x = group.rotation.y += 0.01;
        }
    });

    let toneMap = useMemo(() => {
        let format = RedFormat;
        let colors = new Uint8Array(4);
        for (let c = 0; c <= colors.length; c++) {
            colors[c] = (c / colors.length) * 256;
        }
        let gradientMap = new DataTexture(colors, colors.length, 1, format);
        gradientMap.needsUpdate = true;
        return gradientMap;
    }, []);

    let uniforms = useMemo(() => {
        return {
            // ...ToonShader.uniforms,
            // uBaseColor: { value: new Color("#076838") },
            // uAmbientLightColor: { value: new Color("#050505") },
            // uDirLightColor: { value: new Color("white") },
            // uDirLightPos: { value: new Vector3(15, 15, 15) },
            // uLineColor1: { value: new Color("#808080") },
            // uLineColor2: { value: new Color("black") }

            colorMap: {
                value: colors
            },
            brightnessThresholds: {
                value: [0.9, 0.45, 0.001]
            },
            lightPosition: {
                value: new Vector3(15, 15, 15)
            }
        };
    }, [colors]);

    return (
        // <mesh castShadows position={position} scale={scale}>
        //     <boxGeometry />
        //     <meshStandardMaterial color="mediumpurple" />
        // </mesh>

        <group ref={refObj} position={position} scale={scale} dispose={null}>
            <mesh
                castShadow
                receiveShadow
                scale={active ? 1.2 : 0.8}
                onClick={(e) => setActive(!active)}
                geometry={nodes.Foliage.geometry}
                material={materials["Stylized Foliage"]}
                position={[0, -0.05, 0]}
            >
                {/* <meshToonMaterial gradientMap={toneMap} color={"#076838"} /> */}
                <shaderMaterial
                    attach="material"
                    {...StyleShader}
                    uniforms={uniforms}
                />
            </mesh>
        </group>
    )
}

useGLTF.preload("/trees.glb");
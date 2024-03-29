import React from 'react'
import { useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

let boxGeometry = new THREE.BoxGeometry(1, 1, 1)
let floor1Material = new THREE.MeshStandardMaterial({ color: "#1C1C1C" })

function Floor() {
    return (
        <RigidBody type="fixed" restitution={0.2} friction={0}>
            <group position={[0, 0, 0]}>
                <mesh className="floor" geometry={boxGeometry} material={floor1Material} position={[0, -0.1, 0]} scale={[65, 0.2, 35]} castShadow receiveShadow />
            </group>

            <CuboidCollider
                args={[32.5, 0.1, 17.5]}
                position={[0, - 0.1, 0]}
                restitution={0.2}
                friction={1}
            />
        </RigidBody>
        
    )
}

export default Floor
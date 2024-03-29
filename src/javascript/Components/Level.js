import { useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

let boxGeometry = new THREE.BoxGeometry(1, 1, 1)

let floor1Material = new THREE.MeshStandardMaterial({ color: "limegreen" })
let floor2Material = new THREE.MeshStandardMaterial({ color: "greenyellow" })
let obstacleMaterial = new THREE.MeshStandardMaterial({ color: "orangered" })
let wallMaterial = new THREE.MeshStandardMaterial({ color: "slategrey" })

export function Level({ count = 5, types = [BlockSpinner, BlockLimbo, BlockAxe], seed = 0 }) {

    let blocks = useMemo(() => {
        let blocks = []

        for (let i = 0; i < count; i++) {
            let type = types[Math.floor(Math.random() * types.length)]
            blocks.push(type)
        }
        return blocks
    }, [count, types, seed])

    return (
        <>
            {/* <BlockStart position={[0, 0, 0]} />
            {blocks.map((Block, index) => <Block key={index} position={[0, 0, - (index + 1) * 4]} />)} */}
            {/* <BlockEnd position={[0, 0, -(count + 1) * 4]} /> */}
            {/* <Bounds length={count + 2} /> */}
        </>
    )
}

export function BlockStart({ position = [0, 0, 0] }) {
    return (
        <group position={position}>
            <mesh geometry={boxGeometry} material={floor1Material} position={[0, - 0.1, 0]} scale={[4, 0.2, 4]} receiveShadow />
        </group>
    )
}

export function BlockEnd({ position = [0, 0, 0] }) {
    let hamburger = useGLTF('./hamburger.glb')
    hamburger.scene.children.forEach((mesh) => {
        mesh.castShadow = true;
    })

    return (
        <group position={position}>
            <mesh geometry={boxGeometry} material={floor1Material} position={[0, 0, 0]} scale={[4, 0.2, 4]} receiveShadow />
            <RigidBody type='fixed' colliders='hull' position={[0, 0.25, 0]} restitution={0.2} friction={0}>
                <primitive object={hamburger.scene} scale={0.2} />
            </RigidBody>
        </group>
    )
}

export function BlockSpinner({ position = [0, 0, 0] }) {

    let obstacle = useRef()
    let [speed] = useState(() => (Math.random() + 0.2) * (Math.random() < 0.5 ? -1 : 1))

    useFrame((state) => {
        let time = state.clock.getElapsedTime()

        let rotation = new THREE.Quaternion()
        rotation.setFromEuler(new THREE.Euler(0, time * speed, 0))
        obstacle.current.setNextKinematicRotation(rotation)
    })
    return (
        <group position={position}>
            <mesh geometry={boxGeometry} material={floor2Material} position={[0, - 0.1, 0]} scale={[4, 0.2, 4]} receiveShadow />

            <RigidBody ref={obstacle} type="kinematicPosition" position={[0, 0.3, 0]} restitution={0.2} friction={0}>
                <mesh geometry={boxGeometry} material={obstacleMaterial} scale={[3.5, 0.3, 0.3]} castShadow receiveShadow />
            </RigidBody>
        </group>
    )
}

export function BlockLimbo({ position = [0, 0, 0] }) {

    let obstacle = useRef()
    let [timeOffset] = useState(() => Math.random() * Math.PI * 2)

    useFrame((state) => {
        let time = state.clock.getElapsedTime()
        let y = Math.sin(time + timeOffset) + 1.15
        obstacle.current.setNextKinematicTranslation({ x: position[0], y: position[1] + y, z: position[2] })
    })
    return (
        <group position={position}>
            <mesh geometry={boxGeometry} material={floor2Material} position={[0, - 0.1, 0]} scale={[4, 0.2, 4]} receiveShadow />

            <RigidBody ref={obstacle} type="kinematicPosition" position={[0, 0.3, 0]} restitution={0.2} friction={0}>
                <mesh geometry={boxGeometry} material={obstacleMaterial} scale={[3.5, 0.3, 0.3]} castShadow receiveShadow />
            </RigidBody>
        </group>
    )
}

export function BlockAxe({ position = [0, 0, 0] }) {

    let obstacle = useRef()
    let [timeOffset] = useState(() => Math.random() * Math.PI * 2)

    useFrame((state) => {
        let time = state.clock.getElapsedTime()
        let x = Math.sin(time + timeOffset) * 1.25
        obstacle.current.setNextKinematicTranslation({ x: position[0] + x, y: position[1] + 0.75, z: position[2] })
    })
    return (
        <group position={position}>
            <mesh geometry={boxGeometry} material={floor2Material} position={[0, - 0.1, 0]} scale={[4, 0.2, 4]} receiveShadow />

            <RigidBody ref={obstacle} type="kinematicPosition" position={[0, 0.3, 0]} restitution={0.2} friction={0}>
                <mesh geometry={boxGeometry} material={obstacleMaterial} scale={[1.5, 1.5, 0.3]} castShadow receiveShadow />
            </RigidBody>
        </group>
    )
}

// export function Bounds({ length = 1 }) {
//     return <>
//         <RigidBody type="fixed" restitution={0.2} friction={0}>
//             <mesh
//                 position={[2.15, 0.75, - (length * 2) + 2]}
//                 geometry={boxGeometry}
//                 material={wallMaterial}
//                 scale={[0.3, 1.5, 4 * length]}
//                 castShadow
//             />
//             <mesh
//                 position={[-2.15, 0.75, - (length * 2) + 2]}
//                 geometry={boxGeometry}
//                 material={wallMaterial}
//                 scale={[0.3, 1.5, 4 * length]}
//                 receiveShadow
//             />
//             <mesh
//                 position={[0, 0.75, - (length * 4) + 2]}
//                 geometry={boxGeometry}
//                 material={wallMaterial}
//                 scale={[4, 1.5, 0.3]}
//                 receiveShadow
//             />
//             <CuboidCollider
//                 args={[100, 0.1, 100]}
//                 position={[0, - 0.1, - (length * 2) + 2]}
//                 restitution={0.2}
//                 friction={1}w
//             />
//         </RigidBody>
//     </>
// }
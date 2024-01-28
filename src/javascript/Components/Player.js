import { RigidBody, useRapier } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import useGame from '../stores/useGame'
import { useControls } from "leva";


const Player = () => {

    let body = useRef()
    let [subscribeKeys, getKeys] = useKeyboardControls()
    // let { rapier, world } = useRapier()
    // let rapierWorld = world

    let [smoothCameraPosition] = useState(() => new THREE.Vector3(10, 10, 10))
    let [smoothCameraTarget] = useState(() => new THREE.Vector3())

    let start = useGame((state) => { return state.start })
    let end = useGame((state) => { return state.end })
    let restart = useGame((state) => { return state.restart })
    let blocksCount = useGame((state) => { return state.blocksCount })


    let { orbitalControls } = useControls("Camera", {
        orbitalControls: false
    });

    // let jump = () => {
    //     let origin = body.current.translation()
    //     origin.y -= 0.31
    //     let direction = { x: 0, y: -1, z: 0 }
    //     let ray = new rapier.Ray(origin, direction)
    //     let hit = rapierWorld.castRay(ray, 10, true)

    //     if (hit.toi < 0.15)
    //         body.current.applyImpulse({ x: 0, y: 0.5, z: 0 })
    // }

    let reset = () => {
        body.current.setTranslation({ x: 0, y: 1, z: 0 })
        body.current.setLinvel({ x: 0, y: 0, z: 0 })
        body.current.setAngvel({ x: 0, y: 0, z: 0 })
    }

    useEffect(() => {
        let unsubscribeReset = useGame.subscribe(
            (state) => {
                return state.phase
            },
            (value) => {
                if (value === 'ready')
                    reset()
            }
        )

        let unsubscribeAnyKey = subscribeKeys(
            () => {
                start()
            }
        )

        return () => {
            unsubscribeReset()
            unsubscribeAnyKey()
        }
    }, [])

    useFrame((state, delta) => {
        // Controls
        let { forward, backward, left, right } = getKeys()

        let impulse = { x: 0, y: 0, z: 0 }
        let torque = { x: 0, y: 0, z: 0 }

        let impulseStrength = 1 * delta
        let torqueStrength = 1 * delta

        if (forward) {
            impulse.z -= impulseStrength
            torque.x -= torqueStrength
        }

        if (backward) {
            impulse.z += impulseStrength
            torque.x += torqueStrength
        }

        if (left) {
            impulse.x -= impulseStrength
            torque.z += torqueStrength
        }

        if (right) {
            impulse.x += impulseStrength
            torque.z -= torqueStrength
        }

        body.current.applyImpulse(impulse)
        body.current.applyTorqueImpulse(torque)

        // Camera
        let bodyPosition = body.current.translation()
        let cameraPosition = new THREE.Vector3()
        let cameraTarget = new THREE.Vector3()
        
        if (orbitalControls == false) {
            cameraPosition.copy(bodyPosition)
            cameraPosition.z += 3.5
            cameraPosition.y += 2.35

            cameraTarget.copy(bodyPosition)
            cameraTarget.y += 0.25

            smoothCameraPosition.lerp(cameraPosition, 5 * delta)
            
            state.camera.position.copy(smoothCameraPosition)
        }

        smoothCameraTarget.lerp(cameraTarget, 5 * delta)
        state.camera.lookAt(smoothCameraTarget)

            //Phases
            if (bodyPosition.z < -(blocksCount * 4 + 2))
                end()

            if (bodyPosition.y < -4)
                restart()
    })

    return (
        <RigidBody
            ref={body}
            canSleep={false}
            colliders="ball"
            restitution={0.2}
            friction={1}
            linearDamping={0.5}
            angularDamping={0.5}
            position={[0, 1, 0]}
        >
            <mesh castShadow>
                <icosahedronGeometry args={[0.3, 1]} />
                <meshStandardMaterial flatShading color='mediumpurple' />
            </mesh>
        </RigidBody>
    );
}

export default Player;
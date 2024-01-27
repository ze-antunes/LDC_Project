import React from 'react'
import * as THREE from 'three'

function Floor() {
    return (
        <mesh position-y={-1} rotation-x={-Math.PI * 0.5} scale={10}>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#2c2c2c" />
        </mesh>
    )
}

export default Floor
import React from 'react'

export const Wars = ({ scale = 0.1, position = [0,0.5,0] }) => {
    return (
        <mesh position={position} scale={scale}>
            <boxGeometry />
            <meshStandardMaterial color="mediumpurple" />
        </mesh>
    )
}

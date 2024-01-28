import { useKeyboardControls } from "@react-three/drei";
import { addEffect } from "@react-three/fiber";
import { useControls } from "leva";
import { useEffect, useRef } from "react";
import useGame from "../stores/useGame";

const Interface = () => {
    let time = useRef()

    let restart = useGame((state) => state.restart)
    let phase = useGame((state) => state.phase)

    let forward = useKeyboardControls((state) => state.forward)
    let backward = useKeyboardControls((state) => state.backward)
    let left = useKeyboardControls((state) => state.left)
    let right = useKeyboardControls((state) => state.right)
    let jump = useKeyboardControls((state) => state.jump)

    return (
        <div className="interface">
            {/* Restart  */}
            {phase === 'ended' && <div className="restart" onClick={restart}>Restart</div>}

            {/* Controls */}
            <div className="controls">
                <div className="raw">
                    <div className={`key ${forward ? 'active' : ''}`}></div>
                </div>
                <div className="raw">
                    <div className={`key ${left ? 'active' : ''}`}></div>
                    <div className={`key ${backward ? 'active' : ''}`}></div>
                    <div className={`key ${right ? 'active' : ''}`}></div>
                </div>
            </div>
        </div>
    );
}

export default Interface;
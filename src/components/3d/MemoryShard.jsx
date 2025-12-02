import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function MemoryShard({ position, color, onClick, clickable = true }) {
    const groupRef = useRef();
    const { scene } = useGLTF('/models/crystal_shard.glb');

    const clone = useMemo(() => scene.clone(), [scene]);

    const [hovered, setHovered] = useState(false);

    const timeOffset = useMemo(() => Math.random() * 100, []);

    useEffect(() => {
        clone.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();
                child.material.color = new THREE.Color(color);

                child.material = new THREE.MeshStandardMaterial({ color: color });
                child.material.transparent = true;
                child.material.opacity = 0.6;
                child.material.emissive = new THREE.Color(color);
                child.material.emissiveIntensity = 10;
            }
        })
    });

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.5;
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + timeOffset) * 0.3;

            if (hovered && clickable) {
                groupRef.current.rotation.y += delta * 2;
            }
        }
    });

    return (
        <group
            ref={groupRef}
            position={position}
            onClick={clickable ? onClick : undefined}
            onPointerOver={() => {
                if (clickable) {
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }
            }}
            onPointerOut={() => {
                if (clickable) {
                    setHovered(false);
                    document.body.style.cursor = 'auto';
                }
            }}
            scale={0.35}
        >
            <primitive object={clone} />
        </group>
    );
}

useGLTF.preload('/models/crystal_shard.glb');

export default MemoryShard;

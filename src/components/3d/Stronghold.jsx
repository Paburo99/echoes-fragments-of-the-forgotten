import React, { useEffect, useState, useMemo } from 'react';
import { useAnimations, useGLTF, TransformControls } from '@react-three/drei';
import { useFrame, createPortal } from '@react-three/fiber';
import * as THREE from 'three';
import MemoryShard from './MemoryShard';

function Stronghold(props) {
    const { scene, animations } = useGLTF('/src/assets/models/a_regular_day_in_neo-tokyo/scene.gltf');

    const { actions } = useAnimations(animations, scene);
    useEffect(() => {
        const actionName = Object.keys(actions)[0];
        const action = actions[actionName];

        if (action) {
            action.reset().fadeIn(0.5).play();
        }

        return () => {
            if (action) action.fadeOut(0.5);
        }
    }, [actions]);

    useEffect(() => {
        scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [scene]);

    useFrame(() => {
        const node = scene.getObjectByName('group1');
        if (node) {
            node.visible = false;
        }
    });

    // Create a portal for the shards inside BOMBAB
    const [bombabNode, setBombabNode] = useState(null);

    useEffect(() => {
        const node = scene.getObjectByName('BOMBAB');
        if (node) {
            setBombabNode(node);
        }
    }, [scene]);

    const shards = useMemo(() => {
        return new Array(30).fill(0).map((_, i) => ({
            position: [
                (Math.random() - 0.5) * 14,
                (Math.random() - 0.5) * 14,
                (Math.random() - 0.5) * 14
            ],
            color: new THREE.Color().setHSL(Math.random(), 1, 0.5).getStyle()
        }));
    }, []);

    const bombabShards = bombabNode ? (
        createPortal(
            <group>
                {shards.map((shard, i) => (
                    <MemoryShard
                        key={i}
                        position={shard.position}
                        color={shard.color}
                        clickable={false}
                    />
                ))}
            </group>,
            bombabNode
        )
    ) : null;

    useEffect(() => {
        const objectName = 'BOMBAC_BOMBAByC_0';
        const object = scene.getObjectByName(objectName);

        if (object) {

            if (object.isMesh) {
                // Clone material so we don't affect other objects sharing it
                object.material = object.material.clone();
                object.material.emissive = new THREE.Color('#fff');
                object.material.emissiveIntensity = 2;
                object.material.toneMapped = false;
            }

            // Check if light already exists to avoid duplicates
            if (!object.getObjectByName('attached-light')) {
                const light = new THREE.PointLight('#fff', 8000, 175); // Color, Intensity, Distance
                light.name = 'attached-light';

                light.position.set(0, 15, 0);

                light.castShadow = true;
                object.add(light);
            }
        }
    }, [scene]);

    return (
        <group {...props}>
            {/* Main scene */}
            <primitive object={scene} />

            {bombabShards}
        </group>
    );
}

useGLTF.preload('/src/assets/models/a_regular_day_in_neo-tokyo/scene.gltf');

export default Stronghold;
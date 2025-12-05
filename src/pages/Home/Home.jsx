import { useState, useEffect, Suspense, useMemo, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ScrollControls, useScroll, TransformControls, OrbitControls } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAudio } from '../../context/AudioContext';
import * as THREE from 'three';
import MemoryShard from '../../components/3d/MemoryShard';
import Stronghold from '../../components/3d/Stronghold';
import Loader from '../../components/ui/Loader';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import styles from './Home.module.css';

const DEV_MODE = false;

const EMOTION_MUSIC = {
    hope: [
        '/music/hope/hope1.mp3',
        '/music/hope/hope2.mp3',
        '/music/hope/hope3.mp3'
    ],
    sorrow: [
        '/music/sorrow/sorrow1.mp3',
        '/music/sorrow/sorrow2.mp3',
        '/music/sorrow/sorrow3.mp3',
        '/music/sorrow/sorrow4.mp3'
    ],
    joy: [
        '/music/joy/joy1.mp3',
        '/music/joy/joy2.mp3',
        '/music/joy/joy3.mp3'
    ],
    fear: [
        '/music/fear/fear1.mp3',
        '/music/fear/fear2.mp3',
        '/music/fear/fear3.mp3'
    ],
    anger: [
        '/music/anger/anger1.mp3',
        '/music/anger/anger2.mp3',
        '/music/anger/anger3.mp3'
    ]
};

const SPIRAL_CONFIG = {
    startPos: new THREE.Vector3(-23.83, 12.28, 47.59),
    endRadius: 5,
    endHeight: 2,
    rotations: 2,
    pointCount: 100
};

// Helper to create the spiral curve
const createSpiralCurve = () => {
    const { startPos, endRadius, endHeight, rotations, pointCount } = SPIRAL_CONFIG;

    // Calculate initial polar coordinates
    const startRadius = Math.sqrt(startPos.x * startPos.x + startPos.z * startPos.z);
    const startAngle = Math.atan2(startPos.z, startPos.x);

    const points = [];
    for (let i = 0; i <= pointCount; i++) {
        const t = i / pointCount;

        // Interpolate radius and height
        const r = startRadius * (1 - t) + endRadius * t;
        const y = startPos.y * (1 - t) + endHeight * t;

        // Calculate angle (spiral inwards)
        const theta = startAngle + (t * rotations * Math.PI * 2);

        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        points.push(new THREE.Vector3(x, y, z));
    }

    return new THREE.CatmullRomCurve3(points);
};

// Generate shard positions along the spiral
const spiralCurve = createSpiralCurve();
const SHARD_CONFIGS = [
    { id: 1, t: 0.2, color: "#F4320B" },
    { id: 2, t: 0.4, color: "#4488ff" },
    { id: 3, t: 0.6, color: "#44ff88" },
    { id: 4, t: 0.8, color: "#ff44aa" },
].map(config => {
    const point = spiralCurve.getPoint(config.t);

    // Offset the shard position inwards towards the center (0,0,0)
    // This ensures they are visible in the camera's field of view (which looks at 0,0,0)
    const offsetScale = 0.8;

    return {
        ...config,
        position: [point.x * offsetScale, point.y * 0.9, point.z * offsetScale]
    };
});

const EMOTION_COLORS = {
    hope: "#44ff88",
    sorrow: "#4488ff",
    joy: "#ffcc44",
    fear: "#9944ff",
    anger: "#F4320B"
};

// Snap points for each shard (matching SHARD_CONFIGS t values)
const SNAP_POINTS = [0.2, 0.4, 0.6, 0.8];
const SNAP_THRESHOLD = 0.12; // How close to snap point before snapping

function CameraHandler({ isMobile, onReachEnd }) {
    const scroll = useScroll();
    const hasTriggeredEnd = useRef(false);

    const smoothedPosition = useRef(new THREE.Vector3());
    const smoothedLookAt = useRef(new THREE.Vector3());
    const isInitialized = useRef(false);

    // For snapping behavior
    const snappedOffset = useRef(0);
    const lastRawOffset = useRef(0);
    const velocitySmooth = useRef(0);

    // Define the path points
    const curve = useMemo(() => createSpiralCurve(), []);

    useFrame((state, delta) => {
        const rawOffset = scroll.offset;

        // Calculate smoothed scroll velocity for more stable detection
        const scrollDelta = rawOffset - lastRawOffset.current;
        velocitySmooth.current = velocitySmooth.current * 0.9 + scrollDelta * 0.1;
        lastRawOffset.current = rawOffset;

        // Find if we're near a snap point
        let targetOffset = rawOffset;
        let isNearSnapPoint = false;

        for (const snapPoint of SNAP_POINTS) {
            const distanceToSnap = Math.abs(rawOffset - snapPoint);
            if (distanceToSnap < SNAP_THRESHOLD) {
                isNearSnapPoint = true;
                // Only snap if scroll velocity is low (user stopped scrolling)
                if (Math.abs(velocitySmooth.current) < 0.0008) {
                    targetOffset = snapPoint;
                }
                break;
            }
        }

        // Smoothly interpolate to target offset - very smooth easing
        const offsetLerpFactor = isNearSnapPoint ? 0.02 : 0.04;
        snappedOffset.current += (targetOffset - snappedOffset.current) * offsetLerpFactor;

        // Use snapped offset for camera position
        const targetPoint = curve.getPoint(snappedOffset.current);

        // Calculate target look-at point
        const targetLookAt = new THREE.Vector3(0, 0, 0);

        // Initialize smoothed values on first frame
        if (!isInitialized.current) {
            smoothedPosition.current.copy(targetPoint);
            smoothedLookAt.current.copy(targetLookAt);
            snappedOffset.current = rawOffset;
            isInitialized.current = true;
        }

        // Smoothing factor (lower = smoother, higher = more responsive)
        // Using delta to make it frame-rate independent
        const smoothFactor = 1 - Math.pow(0.05, delta);

        // Smoothly interpolate position and lookAt
        smoothedPosition.current.lerp(targetPoint, smoothFactor);
        smoothedLookAt.current.lerp(targetLookAt, smoothFactor);

        // Apply smoothed values to camera
        state.camera.position.copy(smoothedPosition.current);
        state.camera.lookAt(smoothedLookAt.current);

        if (scroll.offset >= 0.98 && !hasTriggeredEnd.current) {
            hasTriggeredEnd.current = true;
            if (onReachEnd) onReachEnd();
        }
    });
    return null;
}

function Home() {
    const navigate = useNavigate();

    // Use global audio context
    const {
        isMusicEnabled,
        pauseBgMusic,
        resumeBgMusic,
        playEmotionMusic,
        stopEmotionMusic
    } = useAudio();

    // State for memories loaded from database
    const [memories, setMemories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Tracks which memory is currently active
    const [activeMemory, setActiveMemory] = useState(null);

    const openMemory = useCallback((memory) => {
        setActiveMemory(memory);
        pauseBgMusic();

        const tracks = EMOTION_MUSIC[memory.emotion];
        if (tracks && tracks.length > 0) {
            const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
            playEmotionMusic(randomTrack);
        }
    }, [pauseBgMusic, playEmotionMusic]);

    // Helper to close the modal
    const closeMemory = useCallback(() => {
        setActiveMemory(null);
        stopEmotionMusic();
        resumeBgMusic();
    }, [stopEmotionMusic, resumeBgMusic]);

    // Fetch random memories from Supabase
    useEffect(() => {
        async function fetchMemories() {
            try {
                const { data, error } = await supabase
                    .from('memories')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(SHARD_CONFIGS.length * 3);

                if (error) throw error;

                if (data && data.length > 0) {
                    // Shuffle and pick random memories for each shard
                    const shuffled = data.sort(() => Math.random() - 0.5);
                    const selectedMemories = SHARD_CONFIGS.map((config, index) => {
                        const memory = shuffled[index % shuffled.length];
                        return {
                            id: config.id,
                            position: config.position,
                            color: memory ? EMOTION_COLORS[memory.emotion] || config.color : config.color,
                            title: memory ? `${memory.user_name}'s Memory` : "Lost Echo",
                            content: memory ? memory.memory_content : "This memory has faded into the void...",
                            emotion: memory?.emotion || 'hope'
                        };
                    });
                    setMemories(selectedMemories);
                } else {
                    // Fallback if no memories in database
                    setMemories(SHARD_CONFIGS.map(config => ({
                        ...config,
                        title: "Lost Echo",
                        content: "No memories have been sealed yet. Be the first to leave your mark.",
                        emotion: 'hope'
                    })));
                }
            } catch (error) {
                console.error('Error fetching memories:', error);
                // Fallback on error
                setMemories(SHARD_CONFIGS.map(config => ({
                    ...config,
                    title: "Corrupted Fragment",
                    content: "This memory shard appears damaged...",
                    emotion: 'sorrow'
                })));
            } finally {
                setIsLoading(false);
            }
        }

        fetchMemories();
    }, []);

    // Callback when scroll reaches the final point
    const handleReachEnd = useCallback(() => {
        setTimeout(() => {
            navigate('/about');
        }, 2000);
    }, [navigate]);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className={styles.homeContainer}>

            {/* --- UI LAYER --- */}
            <div className={styles.heroContainer}>
                <h1 className={styles.heroTitle} data-text="ECHOES">ECHOES</h1>
                <p className={styles.heroSubtitle}>// FRAGMENTS_OF_THE_FORGOTTEN</p>
                <p className={styles.heroSubtitleSmall}>
                    [MISSION]: RECOVER_LOST_DATA<br />
                    [STATUS]: WAITING_FOR_INPUT...
                </p>
            </div>

            {/* Instructions */}
            <aside className={styles.instructions}>
                <div className={styles.instructionItem}>
                    <p>[SCROLL] TO NAVIGATE RUINS</p>
                </div>

                <div className={styles.instructionItem}>
                    <p>[CLICK] SHARDS TO DECRYPT MEMORY</p>
                </div>
            </aside>

            {/* --- Memory Modal --- */}
            {activeMemory && (
                <div className={styles.modalOverlay}>
                    <div
                        className={styles.modalContent}
                        style={{ border: `2px solid ${activeMemory.color}` }}
                    >
                        <span className={styles.emotionBadge} style={{ background: activeMemory.color }}>
                            {activeMemory.emotion}
                        </span>
                        <h2 style={{ color: activeMemory.color }}>{activeMemory.title}</h2>
                        <p>{activeMemory.content}</p>
                        <button
                            onClick={closeMemory}
                            className={styles.modalButton}
                            style={{ background: activeMemory.color }}
                        >
                            CLOSE FRAGMENT
                        </button>
                    </div>
                </div>
            )}

            {/* --- 3D LAYER --- */}
            <Canvas
                shadows={{ type: THREE.PCFSoftShadowMap }}
                camera={{ fov: isMobile ? 75 : 50 }}
            >

                {/* DEV MODE: Free camera controls */}
                {DEV_MODE && <OrbitControls makeDefault />}

                {/* PRODUCTION MODE: Scroll-controlled camera */}
                {!DEV_MODE && (
                    <ScrollControls pages={1} damping={0.5}>
                        <CameraHandler isMobile={isMobile} onReachEnd={handleReachEnd} />
                    </ScrollControls>
                )}

                <Suspense fallback={<Loader />}>
                    <Stronghold position={[0, 0, 0]} scale={1} />
                </Suspense>


                {/* The Shards */}
                {memories.map((memory) => (
                    <MemoryShard
                        key={memory.id}
                        position={memory.position}
                        color={memory.color}
                        onClick={() => openMemory(memory)}
                    />
                ))}

                {/* POST PROCESSING STACK */}
                <EffectComposer>
                    <Bloom
                        luminanceThreshold={1}
                        intensity={1}
                        mipmapBlur
                    />

                    <Vignette eskil={false} offset={0.1} darkness={1.1} />
                </EffectComposer>
            </Canvas>

        </div>
    );
}

export default Home;

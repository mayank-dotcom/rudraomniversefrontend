import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment, Stars, OrbitControls } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

interface ChromeCoreProps {
    mode: "student" | "enterprise";
    color: string;
    speedMultiplier: number;
}

const ChromeCore = ({ mode, color, speedMultiplier }: ChromeCoreProps) => {
    const ref = useRef<THREE.Mesh>(null);
    const wireRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!ref.current || !wireRef.current) return;
        
        // Base rotation based on time and speed multiplier
        const baseRotY = state.clock.elapsedTime * 0.2 * speedMultiplier;
        const baseRotX = state.clock.elapsedTime * 0.1 * speedMultiplier;
        
        // Smooth target rotation incorporating mouse position
        const targetRotY = baseRotY + state.pointer.x * 0.6;
        const targetRotX = baseRotX - state.pointer.y * 0.6;

        // Smooth lerp (interpolation) for responsive rotation feel
        ref.current.rotation.y += (targetRotY - ref.current.rotation.y) * 0.1;
        ref.current.rotation.x += (targetRotX - ref.current.rotation.x) * 0.1;

        wireRef.current.rotation.y = -state.clock.elapsedTime * 0.08 * speedMultiplier;
        wireRef.current.rotation.z = state.clock.elapsedTime * 0.05 * speedMultiplier;
    });

    return (
        <Float speed={1.8 * speedMultiplier} rotationIntensity={1.2} floatIntensity={1.5}>
            {/* Core morphing mesh */}
            <mesh ref={ref}>
                <icosahedronGeometry args={[1.6, 5]} />
                <MeshDistortMaterial
                    color={color}
                    roughness={0.08}
                    metalness={0.9}
                    distort={mode === "student" ? 0.38 : 0.55}
                    speed={1.8 * speedMultiplier}
                />
            </mesh>
            {/* Wireframe outer shell */}
            <mesh ref={wireRef}>
                <icosahedronGeometry args={[2.0, 2]} />
                <meshBasicMaterial 
                    color={color} 
                    wireframe 
                    transparent 
                    opacity={0.15} 
                />
            </mesh>
        </Float>
    );
};

interface SmallShapeProps {
    position: [number, number, number];
    geometry: "torus" | "ico" | "sphere" | "box";
    scale?: number;
    speed?: number;
    color: string;
}

const SmallShape = ({
    position,
    geometry,
    scale = 1,
    speed = 1,
    color,
}: SmallShapeProps) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (!ref.current) return;
        ref.current.rotation.x = state.clock.elapsedTime * 0.25 * speed;
        ref.current.rotation.y = state.clock.elapsedTime * 0.35 * speed;
        
        // Dynamic floating effect based on mouse cursor
        ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1 + state.pointer.x * 0.25;
        ref.current.position.y = position[1] + Math.cos(state.clock.elapsedTime + position[1]) * 0.1 + state.pointer.y * 0.25;
    });

    return (
        <Float speed={2 * speed} rotationIntensity={0.8} floatIntensity={1.2}>
            <mesh ref={ref} position={position} scale={scale}>
                {geometry === "torus" && <torusGeometry args={[0.8, 0.26, 32, 64]} />}
                {geometry === "ico" && <icosahedronGeometry args={[0.9, 1]} />}
                {geometry === "sphere" && <sphereGeometry args={[0.8, 32, 32]} />}
                {geometry === "box" && <boxGeometry args={[1.0, 1.0, 1.0]} />}
                <meshStandardMaterial 
                    color={color} 
                    metalness={0.9} 
                    roughness={0.15} 
                    transparent
                    opacity={0.8}
                />
            </mesh>
        </Float>
    );
};

interface HeroSceneProps {
    mode?: "student" | "enterprise";
    isDarkMode?: boolean;
}

const HeroScene = ({ mode = "student", isDarkMode = true }: HeroSceneProps) => {
    // Dynamic color values
    const accentColor = mode === "student" ? "#00DDDD" : "#6366F1";
    const speedMultiplier = mode === "student" ? 1.0 : 1.6;

    return (
        <Canvas camera={{ position: [0, 0, 6.5], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
            <Suspense fallback={null}>
                {/* Background Stars for Space/Sci-fi look */}
                <Stars radius={100} depth={50} count={1800} factor={6} saturation={0.5} fade speed={1.5} />
                
                {/* Ambient lighting */}
                <ambientLight intensity={0.5} />
                
                {/* Cyber lights configuration */}
                <spotLight position={[8, 8, 8]} angle={0.2} penumbra={1} intensity={2.5} color={accentColor} />
                <directionalLight position={[5, 3, 5]} intensity={2.5} color="#ffffff" />
                <directionalLight position={[-5, 5, -5]} intensity={1.5} color={accentColor} />
                <pointLight position={[0, -4, 4]} intensity={2.0} color="#ffffff" />
                <pointLight position={[3, 3, -3]} intensity={1.5} color={accentColor} />

                {/* Environment reflections */}
                <Environment preset="night" />

                {/* 3D Meshes */}
                <ChromeCore mode={mode} color={accentColor} speedMultiplier={speedMultiplier} />
                
                {/* Surrounding floating widgets */}
                <SmallShape position={[-3.6, 1.8, -0.5]} geometry="torus" scale={0.5} speed={0.7} color={accentColor} />
                <SmallShape position={[3.6, -1.2, -0.5]} geometry="ico" scale={0.45} speed={1.2} color={accentColor} />
                <SmallShape position={[3.0, 2.2, -1]} geometry="sphere" scale={0.38} speed={0.5} color="#ffffff" />
                <SmallShape position={[-3.0, -2.0, -1]} geometry="box" scale={0.4} speed={0.9} color="#ffffff" />

                <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 2.5} />
            </Suspense>
        </Canvas>
    );
};

export default HeroScene;

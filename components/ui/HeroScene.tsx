import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment, Stars } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

const ChromeCore = () => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (!ref.current) return;
        ref.current.rotation.y = state.clock.elapsedTime * 0.25;
        ref.current.rotation.x = state.clock.elapsedTime * 0.12;
    });
    return (
        <Float speed={1.2} rotationIntensity={0.8} floatIntensity={1.2}>
            <mesh ref={ref}>
                <icosahedronGeometry args={[1.7, 4]} />
                <MeshDistortMaterial
                    color="#ffffff"
                    roughness={0.05}
                    metalness={1}
                    distort={0.35}
                    speed={1.5}
                />
            </mesh>
            <mesh>
                <icosahedronGeometry args={[2.05, 1]} />
                <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.12} />
            </mesh>
        </Float>
    );
};

const SmallShape = ({
    position,
    geometry,
    scale = 1,
    speed = 1,
}: {
    position: [number, number, number];
    geometry: "torus" | "ico" | "sphere" | "box";
    scale?: number;
    speed?: number;
}) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((s) => {
        if (!ref.current) return;
        ref.current.rotation.x = s.clock.elapsedTime * 0.3 * speed;
        ref.current.rotation.y = s.clock.elapsedTime * 0.4 * speed;
    });
    return (
        <Float speed={1.5 * speed} rotationIntensity={0.6} floatIntensity={1.4}>
            <mesh ref={ref} position={position} scale={scale}>
                {geometry === "torus" && <torusGeometry args={[1, 0.32, 32, 96]} />}
                {geometry === "ico" && <icosahedronGeometry args={[1, 1]} />}
                {geometry === "sphere" && <sphereGeometry args={[1, 64, 64]} />}
                {geometry === "box" && <boxGeometry args={[1.2, 1.2, 1.2]} />}
                <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.15} />
            </mesh>
        </Float>
    );
};

const HeroScene = () => {
    return (
        <Canvas camera={{ position: [0, 0, 7], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true }}>
            <Suspense fallback={null}>
                <color attach="background" args={["#0a0a0a"]} />
                <fog attach="fog" args={["#0a0a0a", 5, 20]} />
                
                <ambientLight intensity={0.4} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
                <directionalLight position={[5, 5, 5]} intensity={2} color="#ffffff" />
                <directionalLight position={[-5, 5, -5]} intensity={1} color="#ffffff" />
                <pointLight position={[0, -5, 5]} intensity={1} color="#ffffff" />

                <Environment preset="night" />
                <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />

                <ChromeCore />
                <SmallShape position={[-4, 2, -1]} geometry="torus" scale={0.6} speed={0.8} />
                <SmallShape position={[4, -1.5, -1]} geometry="ico" scale={0.55} speed={1.1} />
                <SmallShape position={[3.5, 2.5, -2]} geometry="sphere" scale={0.45} speed={0.6} />
                <SmallShape position={[-3.5, -2.5, -2]} geometry="box" scale={0.5} speed={0.9} />
            </Suspense>
        </Canvas>
    );
};


export default HeroScene;

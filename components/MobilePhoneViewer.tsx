"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";

function PhoneModel() {
  const groupRef = useRef<THREE.Group>(null);
  const startRef = useRef<number | null>(null);
  const { scene } = useGLTF("/MOBILE_PHONE.glb");
  const model = scene.clone(true);

  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const mat = (child.material as THREE.MeshStandardMaterial).clone();
      mat.metalness = 0.9;
      mat.roughness = 0.1;
      mat.envMapIntensity = 3;
      child.material = mat;
    }
  });

  useFrame((state) => {
    if (!groupRef.current) return;
    if (startRef.current === null) {
      startRef.current = state.clock.elapsedTime;
    }
    const t = Math.min((state.clock.elapsedTime - startRef.current) / 1.5, 1);
    const e = 1 - Math.pow(1 - t, 3);
    groupRef.current.position.x = 0;
    groupRef.current.rotation.x = (Math.PI / 18) * e;
    groupRef.current.rotation.y = (Math.PI / 2) * e;
    groupRef.current.rotation.z = (Math.PI / 2) * e;
  });

  return (
    <Center>
      <primitive ref={groupRef} object={model} scale={3} />
    </Center>
  );
}

export default function MobilePhoneViewer() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <directionalLight position={[-3, 2, -2]} intensity={1} />
      <Suspense fallback={null}>
        <PhoneModel />
      </Suspense>
    </Canvas>
  );
}

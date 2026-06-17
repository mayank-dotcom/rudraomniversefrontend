"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Center, Decal, useVideoTexture, useTexture } from "@react-three/drei";
import * as THREE from "three";

function VideoDecal() {
  const t = useVideoTexture("/phone_video.mp4", {
    unsuspend: "canplay",
    muted: true,
    loop: true,
    start: true,
  });
  t.center.set(0.5, 0.5);
  t.rotation = Math.PI / 2;
  return (
    <Decal position={[0, 0.136, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[-0.88, 0.46, 1]} map={t} depthTest />
  );
}

function PhoneModel() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { scene } = useGLTF("/MOBILE_PHONE.glb");
  const model = scene.clone(true);

  let phoneGeometry: THREE.BufferGeometry | null = null;
  let phoneMaterial: THREE.MeshStandardMaterial | null = null;

  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material && !phoneGeometry) {
      phoneGeometry = child.geometry;
      const mat = (child.material as THREE.MeshStandardMaterial).clone();
      mat.metalness = 0.9;
      mat.roughness = 0.1;
      mat.envMapIntensity = 3;
      phoneMaterial = mat;
    }
  });

  const notchImage = useTexture("/image.png");
  const imgEl = notchImage.image as { width: number; height: number };
  const imgAspect = imgEl ? imgEl.width / imgEl.height : 1;

  const barShape = useMemo(() => {
    const hw = 0.045 / 2;
    const hh = 0.45 / 2;
    const r = 0.035;
    const s = new THREE.Shape();
    s.moveTo(hw, hh);
    s.lineTo(-hw + r, hh);
    s.quadraticCurveTo(-hw, hh, -hw, hh - r);
    s.lineTo(-hw, -hh + r);
    s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    s.lineTo(hw, -hh);
    s.lineTo(hw, hh);
    return s;
  }, []);

  const targetRot = useMemo(() => ({
    x: Math.PI / 18,
    y: Math.PI / 2,
    z: Math.PI / 2,
  }), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const speed = 1.8;
    const f = 1 - Math.exp(-speed * delta);
    groupRef.current.position.x = 0;
    groupRef.current.rotation.x += (targetRot.x - groupRef.current.rotation.x) * f;
    groupRef.current.rotation.y += (targetRot.y - groupRef.current.rotation.y) * f;
    groupRef.current.rotation.z += (targetRot.z - groupRef.current.rotation.z) * f;
  });

  return (
    <Center>
      <group ref={groupRef} scale={3}>
        {phoneGeometry && phoneMaterial && (
          <mesh
            ref={meshRef}
            geometry={phoneGeometry}
            material={phoneMaterial}
          >
            <Suspense fallback={null}>
              <VideoDecal />
            </Suspense>
          </mesh>
        )}
        <mesh position={[0.43, 0.142, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[0.12, 0.12 / imgAspect]} />
          <meshBasicMaterial map={notchImage} transparent />
        </mesh>
        <mesh position={[-0.44, 0.142, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <shapeGeometry args={[barShape]} />
          <meshBasicMaterial color="#111111" side={THREE.DoubleSide} />
        </mesh>
      </group>
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

"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Decal, useVideoTexture } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import * as THREE from "three";

function LapModel({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useLoader(STLLoader, "/Lap.stl");
  const screenTexture = useVideoTexture("/video.mp4", {
    unsuspend: "canplay",
    muted: true,
    loop: true,
    start: true,
  });

  // Optimize texture quality to prevent pixelation/blurriness on large screens
  screenTexture.minFilter = THREE.LinearFilter;
  screenTexture.magFilter = THREE.LinearFilter;
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.generateMipmaps = false;
  screenTexture.needsUpdate = true;

  // Use anisotropic filtering to keep the video sharp at oblique viewing angles
  screenTexture.anisotropy = 16;

  // Center and scale the geometry in render phase so it's ready before Decal mounts
  if (geometry && !geometry.userData.isCenteredAndScaled) {
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3.5 / maxDim;
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.scale(scale, scale, scale);
    geometry.userData.isCenteredAndScaled = true;
  }

  const hasVertexColors = !!(geometry && geometry.attributes.color);

  useFrame((state) => {
    if (meshRef.current) {
      const { width, height } = state.size;
      const aspect = width / height;
      const responsiveScale = aspect < 1 ? aspect * 0.9 : 1.0;

      const baseRot = 1.5 * Math.PI;
      const extraRot = 20 * Math.PI / 180;

      const enterEnd = 1 / 3;
      const zoomEnd = 2 / 3;

      let yPos = 0;
      let scaleMul = 1;
      let rotX = baseRot;

      if (progress < enterEnd) {
        const t = progress / enterEnd;
        const eased = 1 - Math.pow(1 - t, 3);
        yPos = -5 * (1 - eased);
        scaleMul = 1;
        rotX = baseRot;
      } else if (progress < zoomEnd) {
        const t = (progress - enterEnd) / (zoomEnd - enterEnd);
        const eased = t * t;
        yPos = -2.1 * eased;
        scaleMul = 1 + eased;
        rotX = baseRot + extraRot * eased;
      } else {
        const t = (progress - zoomEnd) / (1 - zoomEnd);
        const eased = t * t;
        yPos = -2.1;
        scaleMul = 2 + eased;
        // Bend the screen slightly towards the viewer (tilt forward) in the final step
        const forwardTilt = -10 * Math.PI / 180;
        rotX = baseRot + extraRot - forwardTilt * eased;
      }

      const responsiveY = yPos * (aspect < 1 ? Math.max(0.7, aspect) : 1);

      meshRef.current.rotation.x = rotX;
      meshRef.current.position.y = responsiveY;
      meshRef.current.scale.set(scaleMul * responsiveScale, scaleMul * responsiveScale, scaleMul * responsiveScale);
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      {hasVertexColors ? (
        <meshStandardMaterial vertexColors metalness={0.85} roughness={0.15} envMapIntensity={1.5} />
      ) : (
        <meshStandardMaterial color="#C8C8D0" metalness={0.85} roughness={0.15} envMapIntensity={1.5} />
      )}
      {/* Decal scale matches video's 16:9 aspect ratio (720x406 → ratio ~1.7734):
           width = 3.2, height = 3.2 / 1.7734 ≈ 1.805
           This ensures the video fits perfectly width-wise with no overflow/tearing. */}
      <Decal
        position={[0, 1.13, 0.02]}
        rotation={[Math.PI / 3, 0, 0]}
        scale={[3.2, 1.805, 1]}
        map={screenTexture}
        depthTest
      />
    </mesh>
  );
}

export default function LapViewer({ progress = 0 }: { progress?: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 4]} intensity={1.5} />
      <directionalLight position={[-3, 1, -2]} intensity={0.6} />
      <pointLight position={[0, -2, 0]} intensity={0.4} />
      <Suspense fallback={null}>
        <LapModel progress={progress} />
      </Suspense>
    </Canvas>
  );
}

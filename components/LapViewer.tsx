"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Html, useVideoTexture } from "@react-three/drei";
import ChatOnScreen from "./ChatOnScreen";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import * as THREE from "three";

// Video aspect ratio: 720 x 406 → ~1.7734 (16:9)
// Screen plane width kept at 3.2 to match the laptop screen width.
// Height = 3.2 / 1.7734 ≈ 1.805 so the video fills perfectly with no letterbox/overflow.
const SCREEN_W = 3.2;
const SCREEN_H = SCREEN_W / (720 / 406); // ~1.805

// Position & rotation of the laptop screen surface (same as the old Decal).
// These are in the laptop mesh's local coordinate space (after centering+scaling).
const SCREEN_POS: [number, number, number] = [0, 1.13, 0.02];
const SCREEN_ROT: [number, number, number] = [Math.PI / 3, 0, 0];

function LapModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useLoader(STLLoader, "/Lap.stl");
  const [videoEnded, setVideoEnded] = useState(false);

  const screenTexture = useVideoTexture("/video.mp4", {
    unsuspend: "canplay",
    muted: true,
    loop: false,
    start: true,
  });

  useEffect(() => {
    const video = screenTexture?.image as HTMLVideoElement | undefined;
    if (!video) return;

    const timer = setTimeout(() => {
      setVideoEnded(true);
      video.pause();
    }, 6000);

    const handleEnded = () => {
      setVideoEnded(true);
      clearTimeout(timer);
    };

    video.addEventListener("ended", handleEnded);

    return () => {
      clearTimeout(timer);
      video.removeEventListener("ended", handleEnded);
    };
  }, [screenTexture]);

  // Sharp, high-quality rendering settings
  screenTexture.minFilter = THREE.LinearFilter;
  screenTexture.magFilter = THREE.LinearFilter;
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.generateMipmaps = false;
  screenTexture.anisotropy = 16;
  // ClampToEdge is safe here because PlaneGeometry UVs are exactly [0,1] —
  // there is no overflow so no edge pixel will ever be clamped/repeated.
  screenTexture.wrapS = THREE.ClampToEdgeWrapping;
  screenTexture.wrapT = THREE.ClampToEdgeWrapping;

  // Center and scale the STL geometry once
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
    if (groupRef.current) {
      const { width, height } = state.size;
      const aspect = width / height;
      const responsiveScale = aspect < 1 ? aspect * 0.9 : 1.0;

      const baseRot = 1.5 * Math.PI;
      const extraRot = (20 * Math.PI) / 180;

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
        const forwardTilt = (-10 * Math.PI) / 180;
        rotX = baseRot + extraRot - forwardTilt * eased;
      }

      const responsiveY = yPos * (aspect < 1 ? Math.max(0.7, aspect) : 1);

      groupRef.current.rotation.x = rotX;
      groupRef.current.position.y = responsiveY;
      groupRef.current.scale.set(
        scaleMul * responsiveScale,
        scaleMul * responsiveScale,
        scaleMul * responsiveScale
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* Laptop body */}
      <mesh geometry={geometry}>
        {hasVertexColors ? (
          <meshStandardMaterial
            vertexColors
            metalness={0.85}
            roughness={0.15}
            envMapIntensity={1.5}
          />
        ) : (
          <meshStandardMaterial
            color="#C8C8D0"
            metalness={0.85}
            roughness={0.15}
            envMapIntensity={1.5}
          />
        )}
      </mesh>

      {videoEnded ? (
        <Html
          position={SCREEN_POS}
          rotation={SCREEN_ROT}
          transform
          // With `transform`, drei maps px → world units at distanceFactor/400.
          // distanceFactor=1 ⇒ SCREEN_W*400 px covers the full screen plane exactly.
          distanceFactor={1}
          occlude={false}
          style={{
            width: `${SCREEN_W * 400}px`,
            height: `${SCREEN_H * 400}px`,
            pointerEvents: 'auto',
          }}
        >
          <ChatOnScreen />
        </Html>
      ) : (
        <mesh position={SCREEN_POS} rotation={SCREEN_ROT}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshBasicMaterial
            map={screenTexture}
            toneMapped={false}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      )}
    </group>
  );
}

export default function LapViewer({ progress = 0 }: { progress?: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent", pointerEvents: "none" }}
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

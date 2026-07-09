import React, { useEffect, useRef, useState } from 'react';
import { Lock, X } from 'lucide-react';

interface ReflectiveCardProps {
  blurStrength?: number;
  color?: string;
  metalness?: number;
  roughness?: number;
  overlayColor?: string;
  displacementStrength?: number;
  noiseScale?: number;
  specularConstant?: number;
  grayscale?: number;
  glassDistortion?: number;
  className?: string;
  style?: React.CSSProperties;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  schoolName?: string;
  userRole?: string | null;
  profilePic?: string | null;
  isDarkMode?: boolean;
  onClose?: () => void;
  subscription?: any;
}

const ReflectiveCard: React.FC<ReflectiveCardProps> = ({
  blurStrength = 12,
  color = 'white',
  metalness = 1,
  roughness = 0.4,
  overlayColor = 'rgba(255, 255, 255, 0.1)',
  displacementStrength = 20,
  noiseScale = 1,
  specularConstant = 1.2,
  grayscale = 1,
  glassDistortion = 0,
  className = '',
  style = {},
  userName = "User",
  userEmail = "",
  userPhone = "",
  schoolName = "",
  userRole = null,
  profilePic = null,
  isDarkMode = true,
  onClose,
  subscription
}) => {
  const planName = subscription?.subscription?.plan_name || "Free Trial";
  const roleLabel = userRole === "school_admin" ? "Admin"
    : userRole === "faculty" ? "Faculty"
    : userRole === "enterprise_admin" ? "Admin"
    : userRole === "manager" ? "Manager"
    : userRole === "global_admin" ? "Admin"
    : userRole || "Pro Member";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          setStreamActive(true);
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const baseFrequency = 0.03 / Math.max(0.1, noiseScale);
  const saturation = 1 - Math.max(0, Math.min(1, grayscale));

  const cssVariables = {
    '--blur-strength': `${blurStrength}px`,
    '--metalness': metalness,
    '--roughness': roughness,
    '--overlay-color': overlayColor,
    '--text-color': color,
    '--saturation': saturation
  } as React.CSSProperties;

  return (
    <div
      className={`relative w-[320px] h-[500px] rounded-[20px] overflow-hidden bg-[#1a1a1a] shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)_inset] isolate font-sans ${className}`}
      style={{ ...style, ...cssVariables }}
    >
      <svg className="absolute w-0 h-0 pointer-events-none opacity-0" aria-hidden="true">
        <defs>
          <filter id="metallic-displacement" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency={baseFrequency} numOctaves="2" result="noise" />
            <feColorMatrix in="noise" type="luminanceToAlpha" result="noiseAlpha" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={displacementStrength}
              xChannelSelector="R"
              yChannelSelector="G"
              result="rippled"
            />
            <feSpecularLighting
              in="noiseAlpha"
              surfaceScale={displacementStrength}
              specularConstant={specularConstant}
              specularExponent="20"
              lightingColor="#ffffff"
              result="light"
            >
              <fePointLight x="0" y="0" z="300" />
            </feSpecularLighting>
            <feComposite in="light" in2="rippled" operator="in" result="light-effect" />
            <feBlend in="light-effect" in2="rippled" mode="screen" result="metallic-result" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="solidAlpha"
            />
            <feMorphology in="solidAlpha" operator="erode" radius="45" result="erodedAlpha" />
            <feGaussianBlur in="erodedAlpha" stdDeviation="10" result="blurredMap" />
            <feComponentTransfer in="blurredMap" result="glassMap">
              <feFuncA type="linear" slope="0.5" intercept="0" />
            </feComponentTransfer>
            <feDisplacementMap
              in="metallic-result"
              in2="glassMap"
              scale={glassDistortion}
              xChannelSelector="A"
              yChannelSelector="A"
              result="final"
            />
          </filter>
        </defs>
      </svg>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute top-0 left-0 w-full h-full object-cover -scale-x-100 z-0"
      />

      <div className="relative z-10 h-full flex flex-col justify-between p-8 text-white bg-[var(--overlay-color,rgba(255,255,255,0.05))]">
        <div className="flex justify-between items-center border-b border-white/20 pb-4">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.15em] px-2.5 py-1 bg-black/60 rounded-full">
            <Lock size={12} className="text-white" />
            <span className="text-white">SECURE</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-black/60 hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X size={14} className="text-white" />
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 px-2">
          {profilePic ? (
            <div className="h-20 w-20 rounded-full overflow-hidden ring-2 ring-white/30 shadow-xl">
              <img src={profilePic} alt={userName} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-white/20 shadow-xl">
              <span className="text-3xl font-bold text-white/70">{userName.slice(0, 1).toUpperCase()}</span>
            </div>
          )}
          <div className="text-center space-y-2">
            <h2 className="text-[26px] font-bold tracking-[0.02em] leading-tight drop-shadow-lg text-white">{userName.toUpperCase()}</h2>
            <p className="text-xs font-semibold tracking-[0.25em] opacity-85 uppercase">{roleLabel}</p>
            {userEmail && (
              <p className="text-[11px] tracking-[0.08em] opacity-70 mt-3">{userEmail}</p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-end border-t border-white/20 pt-5">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-semibold tracking-[0.2em] opacity-70 uppercase">Plan</span>
            <span className="text-base font-bold tracking-[0.03em] text-white">{planName}</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-semibold tracking-[0.2em] opacity-70 uppercase">{schoolName ? "School" : "Contact"}</span>
            <p className="text-[10px] opacity-80 mt-0.5">{schoolName || userPhone || userEmail || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReflectiveCard;

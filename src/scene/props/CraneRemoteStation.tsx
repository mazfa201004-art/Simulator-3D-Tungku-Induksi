import React, { useState } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

interface CraneRemoteStationProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * 3D Crane Radio Remote Docking Station (Stasiun Holster Remote Crane).
 * Mounted onto a factory bay column or wall.
 * Allows the operator to physically pick up the crane transmitter or dock it back.
 */
export const CraneRemoteStation: React.FC<CraneRemoteStationProps> = ({
  position = [4.2, 1.35, 1.2],
  rotation = [0, -Math.PI / 2, 0],
}) => {
  const isCraneRemoteHeld = useSimStore((s) => s.isCraneRemoteHeld);
  const setIsCraneRemoteHeld = useSimStore((s) => s.setIsCraneRemoteHeld);
  const setActiveHoverObject = useSimStore((s) => s.setActiveHoverObject);

  const [hovered, setHovered] = useState(false);

  const handleClick = (e: any) => {
    e.stopPropagation();
    inductionAudio.resume();
    inductionAudio.playClick();
    setIsCraneRemoteHeld(!isCraneRemoteHeld);
  };

  return (
    <group
      position={position}
      rotation={rotation}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        setActiveHoverObject(isCraneRemoteHeld ? 'Holster Remote Crane (Klik Kembalikan)' : 'Remote Crane Radio (Klik Ambil)');
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        setActiveHoverObject(null);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 0. Floor Pedestal Support Post */}
      <group position={[0, -0.65, -0.01]}>
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 0.90, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.14, 0.16, 0.04, 20]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* 1. Wall Backing Plate */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.26, 0.44, 0.02]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Yellow Caution Outer Frame */}
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[0.24, 0.42]} />
        <meshStandardMaterial color="#facc15" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.014]}>
        <planeGeometry args={[0.22, 0.40]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>
      {/* 2. Heavy Molded Holster Cradle / Pocket */}
      <group position={[0, -0.04, 0.04]}>
        {/* Back wall of cradle */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.16, 0.22, 0.02]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} />
        </mesh>
        {/* Left side bracket */}
        <mesh position={[-0.08, 0, 0.035]}>
          <boxGeometry args={[0.015, 0.20, 0.07]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        {/* Right side bracket */}
        <mesh position={[0.08, 0, 0.035]}>
          <boxGeometry args={[0.015, 0.20, 0.07]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        {/* Bottom catch shelf */}
        <mesh position={[0, -0.10, 0.035]}>
          <boxGeometry args={[0.16, 0.015, 0.07]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        {/* Front retainer strap */}
        <mesh position={[0, -0.05, 0.072]}>
          <boxGeometry args={[0.165, 0.04, 0.01]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* 3. PHYSICAL 3D CRANE RADIO REMOTE (Visible only when in holster!) */}
      {!isCraneRemoteHeld && (
        <group position={[0, -0.02, 0.055]}>
          {/* Main Yellow Remote Body */}
          <mesh>
            <boxGeometry args={[0.12, 0.24, 0.04]} />
            <meshStandardMaterial
              color={hovered ? '#fde047' : '#eab308'}
              roughness={0.35}
              metalness={0.2}
            />
          </mesh>

          {/* Rubber Side Grips (Black) */}
          {[-0.062, 0.062].map((gx, gi) => (
            <mesh key={`grip-${gi}`} position={[gx, 0, 0]}>
              <boxGeometry args={[0.008, 0.22, 0.038]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
          ))}

          {/* Top Antenna Stub */}
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.008, 0.010, 0.04, 16]} />
            <meshStandardMaterial color="#090d16" roughness={0.8} />
          </mesh>

          {/* Red Mushroom E-Stop Button on Top */}
          <mesh position={[0, 0.08, 0.023]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.012, 16]} />
            <meshStandardMaterial color="#dc2626" roughness={0.3} />
          </mesh>

          {/* Dual Column Push Buttons on Face */}
          {[-0.025, 0.025].map((bx, bi) =>
            [0.03, -0.02, -0.07].map((by, bj) => (
              <mesh key={`btn-${bi}-${bj}`} position={[bx, by, 0.022]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.010, 0.010, 0.006, 16]} />
                <meshStandardMaterial color="#1e293b" metalness={0.6} />
              </mesh>
            ))
          )}

          {/* Radio Link Status LED (Blinking / Glowing Green) */}
          <mesh position={[0.035, 0.08, 0.022]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.005, 12]} />
            <meshStandardMaterial
              color="#22c55e"
              emissive="#22c55e"
              emissiveIntensity={2.5}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

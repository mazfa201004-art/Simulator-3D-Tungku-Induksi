import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

interface LadlePreheaterStationProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Industrial Foundry Gas Ladle Preheating Station (Stasiun Pemanas Ladle).
 * - Crucial foundry safety equipment: Bakes moisture out of ladle refractory lining to prevent steam explosions!
 * - Heavy steel parking cradle for crane-transferred transfer ladles.
 * - Vertical structural pivot mast with articulated counterweighted swing arm.
 * - Conical refractory-lined burner heating hood firing downward.
 * - Combustion air blower, yellow natural gas / propane line with shutoff valve.
 * - Interactive 3D Burner Ignition Button with dynamic roaring flame & radiant heating light!
 */
export const LadlePreheaterStation: React.FC<LadlePreheaterStationProps> = ({
  position = [5.5, 0, 3.5],
  rotation = [0, 0, 0],
}) => {
  const isLadlePreheaterActive = useSimStore((s) => s.isLadlePreheaterActive);
  const toggleLadlePreheater = useSimStore((s) => s.toggleLadlePreheater);
  const [hovered, setHovered] = useState(false);
  const flameRef = useRef<THREE.Mesh>(null);

  // Dynamic flame flutter animation
  useFrame((state) => {
    if (flameRef.current && isLadlePreheaterActive) {
      const t = state.clock.elapsedTime * 25;
      flameRef.current.scale.set(
        1.0 + Math.sin(t) * 0.12,
        1.0 + Math.cos(t * 1.3) * 0.18,
        1.0 + Math.sin(t * 0.9) * 0.12
      );
    }
  });

  const handleTogglePreheater = (e: any) => {
    e.stopPropagation();
    inductionAudio.playClick();
    toggleLadlePreheater();
  };

  const steelMat = { color: '#334155', metalness: 0.8, roughness: 0.3 };
  const yellowGasMat = { color: '#eab308', metalness: 0.7, roughness: 0.3 };
  const refractoryMat = { color: '#b45309', roughness: 0.9 };

  return (
    <group position={position} rotation={rotation} name="LadlePreheaterStation">
      {/* 1. Heavy Floor Cradle Stand for Ladle Parking */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[1.8, 0.16, 1.8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Floor Warning Hazard Ring */}
      <mesh position={[0, 0.161, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.05, 32]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>
      {/* Ladle centering guides */}
      {[-0.65, 0.65].map((gx, gi) => (
        <mesh key={`guide-${gi}`} position={[gx, 0.22, 0]}>
          <boxGeometry args={[0.08, 0.14, 1.2]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}

      {/* 2. Vertical Structural Pivot Mast (Tiang Penyangga Pemanas) */}
      <mesh position={[-1.2, 1.8, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 3.6, 20]} />
        <meshStandardMaterial {...steelMat} />
      </mesh>
      {/* Mast Footing Flange */}
      <mesh position={[-1.2, 0.1, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.1, 16]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* 3. Articulated Swivel Swing Arm & Counterweight */}
      <group position={[-1.2, 2.9, 0]}>
        {/* Horizontal Beam Arm */}
        <mesh position={[0.7, 0, 0]}>
          <boxGeometry args={[1.6, 0.14, 0.14]} />
          <meshStandardMaterial {...steelMat} />
        </mesh>
        {/* Counterweight Block on Rear */}
        <mesh position={[-0.45, 0, 0]}>
          <boxGeometry args={[0.4, 0.3, 0.3]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* 4. Conical Refractory Burner Hood (Tudung Pemanas Ladle) */}
        <group position={[1.2, -0.4, 0]}>
          {/* Outer Steel Hood Casing */}
          <mesh>
            <cylinderGeometry args={[0.32, 0.65, 0.55, 32, 1, true]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Inner Refractory Heat-Resistant Liner */}
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.28, 0.60, 0.45, 32, 1, true]} />
            <meshStandardMaterial
              {...refractoryMat}
              emissive={isLadlePreheaterActive ? '#ea580c' : '#000000'}
              emissiveIntensity={isLadlePreheaterActive ? 1.5 : 0}
            />
          </mesh>

          {/* Combustion Gas Supply Pipe into Hood */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.45, 16]} />
            <meshStandardMaterial {...yellowGasMat} />
          </mesh>

          {/* DYNAMIC ROARING GAS FLAME (Visible when active) */}
          {isLadlePreheaterActive && (
            <group position={[0, -0.35, 0]}>
              {/* Core Hot Blue Flame */}
              <mesh ref={flameRef} rotation={[Math.PI, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.22, 0.55, 16]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0284c7"
                  emissiveIntensity={2.5}
                  transparent
                  opacity={0.85}
                />
              </mesh>
              {/* Outer Radiant Orange Combustion Flame */}
              <mesh position={[0, -0.15, 0]} rotation={[Math.PI, 0, 0]}>
                <cylinderGeometry args={[0.12, 0.35, 0.65, 16]} />
                <meshStandardMaterial
                  color="#ea580c"
                  emissive="#ea580c"
                  emissiveIntensity={3.0}
                  transparent
                  opacity={0.75}
                />
              </mesh>
              {/* Dynamic Preheater Light */}
              <pointLight color="#ea580c" intensity={2.4} distance={6.0} decay={2} />
            </group>
          )}
        </group>
      </group>

      {/* 5. INTERACTIVE BURNER IGNITION CONTROL CONSOLE */}
      <group position={[-1.2, 1.4, 0.25]}>
        <mesh>
          <boxGeometry args={[0.32, 0.46, 0.18]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
        <Text
          position={[0, 0.16, 0.095]}
          fontSize={0.032}
          color="#facc15"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          PEMANAS LADLE
        </Text>

        {/* Status Pilot LED */}
        <mesh position={[-0.08, 0.05, 0.095]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 16]} />
          <meshStandardMaterial
            color={isLadlePreheaterActive ? '#ea580c' : '#64748b'}
            emissive={isLadlePreheaterActive ? '#ea580c' : '#000000'}
            emissiveIntensity={isLadlePreheaterActive ? 2.5 : 0}
          />
        </mesh>
        <Text
          position={[-0.08, -0.01, 0.1]}
          fontSize={0.022}
          color={isLadlePreheaterActive ? '#fb923c' : '#94a3b8'}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {isLadlePreheaterActive ? '750°C' : 'OFF'}
        </Text>

        {/* INTERACTIVE IGNITION BUTTON */}
        <group
          position={[0.07, 0.04, 0.095]}
          onClick={handleTogglePreheater}
          onPointerOver={() => {
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
        >
          <mesh>
            <cylinderGeometry args={[0.038, 0.038, 0.02, 20]} />
            <meshStandardMaterial color={hovered ? '#64748b' : '#334155'} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <cylinderGeometry args={[0.028, 0.028, 0.02, 20]} />
            <meshStandardMaterial color={isLadlePreheaterActive ? '#ea580c' : '#dc2626'} />
          </mesh>
        </group>

        {/* Action Prompt Badge */}
        <Text
          position={[0, -0.12, 0.1]}
          fontSize={0.025}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
        >
          [KLIK TOMBOL IGNITER]
        </Text>
      </group>
    </group>
  );
};

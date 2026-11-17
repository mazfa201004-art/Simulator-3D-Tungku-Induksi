import React, { useState } from 'react';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

interface HydraulicPowerUnitProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Dedicated Hydraulic Power Unit (HPU) for Furnace Tilting Cylinders.
 * - Hydraulic oil reservoir tank with level/temperature sight glass and return line filter.
 * - Electric motor and high-pressure hydraulic gear/piston pump.
 * - Proportional valve block with analog system pressure gauge.
 * - Dual fire-jacketed high-pressure hydraulic hoses routing to the furnace tilting cylinder rams.
 * - Interactive 3D HPU Power Switch that toggles hydraulic tilting pressure!
 */
export const HydraulicPowerUnit: React.FC<HydraulicPowerUnitProps> = ({
  position = [2.4, 0, -2.4],
  rotation = [0, 0, 0],
}) => {
  const isHpuRunning = useSimStore((s) => s.isHpuRunning);
  const toggleHpu = useSimStore((s) => s.toggleHpu);
  const [hovered, setHovered] = useState(false);

  const handleToggleHpu = (e: any) => {
    e.stopPropagation();
    inductionAudio.playClick();
    toggleHpu();
  };

  const tankMat = { color: '#1e293b', metalness: 0.75, roughness: 0.35 };
  const motorMat = { color: '#047857', metalness: 0.65, roughness: 0.4 };
  const valveMat = { color: '#475569', metalness: 0.85, roughness: 0.25 };
  const hoseMat = { color: '#b91c1c', roughness: 0.6 }; // Red fire-resistant pyrojacket

  return (
    <group position={position} rotation={rotation} name="HydraulicPowerUnit">
      {/* 1. Hydraulic Oil Reservoir Tank */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[1.3, 0.72, 0.85]} />
        <meshStandardMaterial {...tankMat} />
      </mesh>
      {/* Tank Skid Base Legs */}
      {[-0.55, 0.55].map((lx, li) => (
        <mesh key={`hpu-leg-${li}`} position={[lx, 0.03, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.85]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      ))}

      {/* Oil Level & Temperature Sight Gauge */}
      <mesh position={[0.66, 0.42, 0]}>
        <boxGeometry args={[0.02, 0.25, 0.06]} />
        <meshStandardMaterial color="#fef08a" transparent opacity={0.85} />
      </mesh>
      {/* Oil Breather / Filler Cap */}
      <mesh position={[0.45, 0.82, 0.25]}>
        <cylinderGeometry args={[0.05, 0.05, 0.08, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
      </mesh>

      {/* 2. Electric Hydraulic Pump Motor (Mounted on Tank Top) */}
      <mesh position={[-0.25, 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.48, 24]} />
        <meshStandardMaterial {...motorMat} />
      </mesh>
      {/* Motor Terminal Box */}
      <mesh position={[-0.25, 1.25, 0]}>
        <boxGeometry args={[0.16, 0.12, 0.14]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* 3. Hydraulic Valve Block & Pressure Gauge */}
      <group position={[0.25, 0.95, -0.1]}>
        {/* Manifold Block */}
        <mesh>
          <boxGeometry args={[0.28, 0.24, 0.28]} />
          <meshStandardMaterial {...valveMat} />
        </mesh>

        {/* Analog Pressure Gauge (0 - 250 Bar) */}
        <group position={[0, 0.22, 0.14]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.025, 24]} />
            <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.015]}>
            <circleGeometry args={[0.05, 24]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Gauge Needle (0 bar when off, 160 bar when running) */}
          <mesh position={[0, 0.015, 0.02]} rotation={[0, 0, isHpuRunning ? -0.6 : 1.3]}>
            <boxGeometry args={[0.005, 0.035, 0.002]} />
            <meshBasicMaterial color="#dc2626" />
          </mesh>
        </group>
      </group>

      {/* 4. Dual Fire-Jacketed High-Pressure Hydraulic Hoses Routing Towards Furnace Tilt Ram */}
      {[-0.06, 0.06].map((hz, hi) => (
        <group key={`hose-${hi}`} position={[0.3, 0.9, -0.25 + hz]}>
          <mesh position={[-0.4, -0.4, 0.5]} rotation={[0.4, 0.8, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 1.2, 12]} />
            <meshStandardMaterial {...hoseMat} />
          </mesh>
        </group>
      ))}

      {/* 5. INTERACTIVE HPU CONTROL SWITCH */}
      <group position={[0.66, 0.58, 0.2]}>
        <mesh position={[0.02, 0, 0]}>
          <boxGeometry args={[0.04, 0.28, 0.22]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <Text
          position={[0.05, 0.10, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.032}
          color="#facc15"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          HPU HIDROLIK
        </Text>

        {/* Status Pilot LED */}
        <mesh position={[0.05, 0.03, -0.05]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.02, 16]} />
          <meshStandardMaterial
            color={isHpuRunning ? '#22c55e' : '#ef4444'}
            emissive={isHpuRunning ? '#22c55e' : '#ef4444'}
            emissiveIntensity={1.8}
          />
        </mesh>

        {/* INTERACTIVE TOGGLE BUTTON */}
        <group
          position={[0.05, 0.02, 0.04]}
          onClick={handleToggleHpu}
          onPointerOver={() => {
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
        >
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
            <meshStandardMaterial color={hovered ? '#64748b' : '#334155'} metalness={0.8} />
          </mesh>
          <mesh position={[0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.02, 16]} />
            <meshStandardMaterial color={isHpuRunning ? '#22c55e' : '#ef4444'} />
          </mesh>
        </group>

        {/* Action Prompt Badge */}
        <Text
          position={[0.05, -0.09, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.025}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
        >
          [KLIK SAKELAR HPU]
        </Text>
      </group>
    </group>
  );
};

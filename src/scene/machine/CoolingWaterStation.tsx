import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

interface CoolingWaterStationProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Closed-Loop Induction Coil & IGBT Cooling Water Circulation Station.
 * - Dual high-pressure centrifugal pumps (Main Pump & Emergency Standby Pump).
 * - Distributor manifold headers with analog pressure gauges, temperature dial, and ball valves.
 * - Flexible braided lines routing into floor utility trench towards Power Cabinet and furnace plinth.
 * - Interactive 3D Pump Power Button that toggles water cooling circulation!
 */
export const CoolingWaterStation: React.FC<CoolingWaterStationProps> = ({
  position = [-4.5, 0, -2.8],
  rotation = [0, 0, 0],
}) => {
  const isWaterPumpRunning = useSimStore((s) => s.isWaterPumpRunning);
  const toggleWaterPump = useSimStore((s) => s.toggleWaterPump);
  const [hovered, setHovered] = useState(false);
  const pumpGroupRef = useRef<THREE.Group>(null);

  // Micro-vibration animation when pump is active
  useFrame((state) => {
    if (pumpGroupRef.current && isWaterPumpRunning) {
      pumpGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 45) * 0.0015;
    }
  });

  const handleTogglePump = (e: any) => {
    e.stopPropagation();
    inductionAudio.playClick();
    toggleWaterPump();
  };

  const bluePipeMat = { color: '#0284c7', metalness: 0.7, roughness: 0.3 };
  const cyanPipeMat = { color: '#38bdf8', metalness: 0.7, roughness: 0.3 };
  const pumpGreenMat = { color: '#16a34a', metalness: 0.6, roughness: 0.4 };
  const brassMat = { color: '#eab308', metalness: 0.85, roughness: 0.25 };

  return (
    <group position={position} rotation={rotation} name="CoolingWaterStation">
      {/* 1. Structural Steel Skid Base */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[2.2, 0.16, 1.4]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 2. DUAL CENTRIFUGAL CIRCULATION PUMPS */}
      <group ref={pumpGroupRef}>
        {[-0.55, 0.55].map((px, pi) => (
          <group key={`pump-${pi}`} position={[px, 0.16, 0.2]}>
            {/* Volute Impeller Casing */}
            <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.22, 0.22, 0.18, 24]} />
              <meshStandardMaterial {...bluePipeMat} />
            </mesh>
            {/* Electric Drive Motor Body */}
            <mesh position={[0, 0.25, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 0.38, 24]} />
              <meshStandardMaterial {...pumpGreenMat} />
            </mesh>
            {/* Motor Cooling Fan Cowling */}
            <mesh position={[0, 0.25, -0.50]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.165, 0.165, 0.08, 20]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {/* Pump Mounting Footing */}
            <mesh position={[0, 0.06, -0.1]}>
              <boxGeometry args={[0.34, 0.12, 0.6]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* Pump Label */}
            <Text
              position={[0, 0.48, 0]}
              fontSize={0.045}
              color="#f8fafc"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {pi === 0 ? 'P-01 (MAIN)' : 'P-02 (STANDBY)'}
            </Text>
          </group>
        ))}
      </group>

      {/* 3. WATER DISTRIBUTOR MANIFOLD HEADERS */}
      <group position={[0, 0.75, -0.35]}>
        {/* Supply Header Pipe (Blue) */}
        <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 2.0, 20]} />
          <meshStandardMaterial {...bluePipeMat} />
        </mesh>
        {/* Return Header Pipe (Cyan) */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 2.0, 20]} />
          <meshStandardMaterial {...cyanPipeMat} />
        </mesh>

        {/* Vertical Branch Pipes with Ball Valves */}
        {[-0.6, -0.2, 0.2, 0.6].map((bx, bi) => (
          <group key={`branch-${bi}`} position={[bx, 0.12, 0]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.25, 16]} />
              <meshStandardMaterial {...bluePipeMat} />
            </mesh>
            {/* Ball valve handle */}
            <mesh position={[0.04, 0, 0.04]}>
              <boxGeometry args={[0.03, 0.08, 0.02]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
          </group>
        ))}

        {/* Analog Pressure Gauges */}
        {[-0.4, 0.4].map((gx, gi) => (
          <group key={`gauge-${gi}`} position={[gx, 0.38, 0.06]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.055, 0.055, 0.025, 20]} />
              <meshStandardMaterial {...brassMat} />
            </mesh>
            <mesh position={[0, 0, 0.015]}>
              <circleGeometry args={[0.045, 20]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Gauge dial needle */}
            <mesh position={[0, 0.015, 0.02]} rotation={[0, 0, isWaterPumpRunning ? -0.4 : 1.2]}>
              <boxGeometry args={[0.005, 0.03, 0.002]} />
              <meshBasicMaterial color="#dc2626" />
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. INTERACTIVE PUMP CONTROLLER TERMINAL BOX */}
      <group position={[0.85, 0.65, 0.45]}>
        <mesh>
          <boxGeometry args={[0.35, 0.45, 0.18]} />
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
          KONTROL POMPA
        </Text>

        {/* Status Indicator Pilot LED */}
        <mesh position={[-0.08, 0.05, 0.095]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 16]} />
          <meshStandardMaterial
            color={isWaterPumpRunning ? '#22c55e' : '#ef4444'}
            emissive={isWaterPumpRunning ? '#22c55e' : '#ef4444'}
            emissiveIntensity={1.8}
          />
        </mesh>
        <Text
          position={[-0.08, -0.01, 0.1]}
          fontSize={0.024}
          color="#f8fafc"
          anchorX="center"
          anchorY="middle"
        >
          {isWaterPumpRunning ? 'RUN' : 'OFF'}
        </Text>

        {/* INTERACTIVE PUSHBUTTON */}
        <group
          position={[0.07, 0.04, 0.095]}
          onClick={handleTogglePump}
          onPointerOver={() => {
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
        >
          {/* Bezel Collar */}
          <mesh>
            <cylinderGeometry args={[0.038, 0.038, 0.02, 20]} />
            <meshStandardMaterial color={hovered ? '#64748b' : '#334155'} metalness={0.8} />
          </mesh>
          {/* Button Cap */}
          <mesh position={[0, 0, 0.01]}>
            <cylinderGeometry args={[0.028, 0.028, 0.02, 20]} />
            <meshStandardMaterial color={isWaterPumpRunning ? '#22c55e' : '#ef4444'} />
          </mesh>
        </group>

        {/* Action Prompt Badge */}
        <Text
          position={[0, -0.12, 0.1]}
          fontSize={0.028}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
        >
          [KLIK TOMBOL POMPA]
        </Text>
      </group>
    </group>
  );
};

import React, { useState } from 'react';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';

interface WallTempDisplayProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Authentic Industrial Digital Melt Temperature Display (Wall / Stanchion Mounted Scoreboard).
 * - Standard foundry melt shop temperature display (e.g. Heraeus DigiTemp-E / Minco Melt-Temp).
 * - High-intensity large 7-segment digital LED readout for immersion pyrometer measurements.
 * - Multi-tier status andon light and audible signal beacon on top.
 * - Shows last measured immersion temperature, status evaluation against target pour range, and lance state.
 * - Suspended on an elevated structural column/beam overlooking the furnace and ladle bay.
 */
export const WallTempDisplay: React.FC<WallTempDisplayProps> = ({
  position = [0.0, 3.85, -2.4],
  rotation = [0, 0, 0],
}) => {
  const immersionTempC = useSimStore((s) => s.immersionTempC);
  const isLanceDipping = useSimStore((s) => s.isLanceDipping);
  const lastImmersionReading = useSimStore((s) => s.lastImmersionReading);
  const selectedMaterial = useSimStore((s) => s.selectedMaterial);
  const triggerLanceDip = useSimStore((s) => s.triggerLanceDip);
  const setActiveHoverObject = useSimStore((s) => s.setActiveHoverObject);

  const [hovered, setHovered] = useState(false);

  // Determine temperature status relative to material melting point and recommended pouring superheat (+80°C to +120°C)
  const meltingPointC = selectedMaterial?.meltingPointC || 1450;
  const targetPourMin = meltingPointC + 60;
  const targetPourMax = meltingPointC + 150;

  const currentTemp = immersionTempC;
  const hasReading = currentTemp !== null && currentTemp > 0;

  const isWithinTapRange = hasReading && currentTemp >= targetPourMin && currentTemp <= targetPourMax;
  const isTooCold = hasReading && currentTemp < targetPourMin;
  const isOverheated = hasReading && currentTemp > targetPourMax;

  // Display texts
  let tempDisplayStr = '---- °C';
  let statusText = 'SIAP CELUP (READY)';
  let statusColor = '#38bdf8'; // sky blue

  if (isLanceDipping) {
    tempDisplayStr = 'M E A S...';
    statusText = 'PENGUKURAN BERJALAN';
    statusColor = '#06b6d4'; // cyan
  } else if (hasReading) {
    tempDisplayStr = `${currentTemp.toFixed(1)} °C`;
    if (isWithinTapRange) {
      statusText = 'SUHU OPTIMAL SIAP TUANG (TAP OK)';
      statusColor = '#22c55e'; // green
    } else if (isTooCold) {
      statusText = `KURANG PANAS (MIN ${targetPourMin}°C)`;
      statusColor = '#f59e0b'; // amber
    } else if (isOverheated) {
      statusText = `OVERHEAT (> ${targetPourMax}°C)`;
      statusColor = '#ef4444'; // red
    }
  }

  return (
    <group
      position={position}
      rotation={rotation}
      name="WallTempDisplayScoreboard"
      onClick={(e) => {
        e.stopPropagation();
        triggerLanceDip();
      }}
      onPointerOver={() => {
        setHovered(true);
        setActiveHoverObject('Display Digital Suhu Celup (Klik untuk Celupkan Pirometer)');
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        setActiveHoverObject(null);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* ========================================================================= */}
      {/* 1. STRUCTURAL WALL MOUNTING CLEAT BRACKETS                                */}
      {/* ========================================================================= */}
      {[-0.55, 0.55].map((cx, ci) => (
        <mesh key={`cleat-${ci}`} position={[cx, 0, -0.10]}>
          <boxGeometry args={[0.08, 0.80, 0.04]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
      ))}

      {/* ========================================================================= */}
      {/* 2. INDUSTRIAL NEMA 4X / IP65 POWDER-COATED STEEL ENCLOSURE                */}
      {/* ========================================================================= */}
      <group position={[0, 0, 0]}>
        {/* Main Enclosure Box */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.35, 0.72, 0.18]} />
          <meshStandardMaterial
            color={hovered ? '#334155' : '#1e293b'}
            metalness={0.7}
            roughness={0.4}
          />
        </mesh>

        {/* Glare Sunshield Hood Overhang */}
        <mesh position={[0, 0.38, 0.08]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[1.39, 0.04, 0.22]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        {/* Side Visor Fins */}
        {[-0.68, 0.68].map((vx, vi) => (
          <mesh key={`visor-${vi}`} position={[vx, 0.15, 0.06]}>
            <boxGeometry args={[0.02, 0.44, 0.14]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
        ))}

        {/* Dark Smoked Anti-Glare Display Glass Window */}
        <mesh position={[0, 0.02, 0.092]}>
          <planeGeometry args={[1.25, 0.58]} />
          <meshStandardMaterial color="#020617" roughness={0.15} metalness={0.9} />
        </mesh>

        {/* Header Badge */}
        <group position={[0, 0.24, 0.095]}>
          <Text
            position={[-0.32, 0, 0]}
            fontSize={0.038}
            color="#94a3b8"
            anchorX="left"
            fontWeight="bold"
          >
            MELT-TEMP PYRO-DIGITAL 8000
          </Text>
          <Text
            position={[0.54, 0, 0]}
            fontSize={0.032}
            color="#facc15"
            anchorX="right"
            fontWeight="bold"
          >
            IMMERSION Pt-Rh S
          </Text>
        </group>

        {/* ========================================================================= */}
        {/* 3. PRIMARY LARGE 7-SEGMENT ULTRA-BRIGHT DIGITAL LED READOUT               */}
        {/* ========================================================================= */}
        <group position={[0, 0.06, 0.096]}>
          {/* Black LED Bezel Backplate */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1.20, 0.22]} />
            <meshBasicMaterial color="#050811" />
          </mesh>

          {/* Digital Temperature Digits */}
          <Text
            position={[0, 0, 0.002]}
            fontSize={0.155}
            color={
              isLanceDipping
                ? '#06b6d4'
                : hasReading
                ? isWithinTapRange
                  ? '#4ade80'
                  : isOverheated
                  ? '#f87171'
                  : '#fbbf24'
                : '#64748b'
            }
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
            letterSpacing={0.06}
          >
            {tempDisplayStr}
          </Text>
        </group>

        {/* ========================================================================= */}
        {/* 4. SECONDARY MATRIX DISPLAY & STATUS BADGE                                */}
        {/* ========================================================================= */}
        <group position={[0, -0.15, 0.096]}>
          {/* Status Bar Container */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1.20, 0.12]} />
            <meshBasicMaterial color="#090d16" />
          </mesh>

          {/* Status Text Evaluation */}
          <Text
            position={[0, 0.015, 0.002]}
            fontSize={0.046}
            color={statusColor}
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {statusText}
          </Text>

          {/* Target Range Guide Subtext */}
          <Text
            position={[0, -0.032, 0.002]}
            fontSize={0.026}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
          >
            TARGET TUANG: {targetPourMin}°C - {targetPourMax}°C{lastImmersionReading ? ` • t=${Math.round(lastImmersionReading.timeSec)}s` : ''}
          </Text>
        </group>

        {/* ========================================================================= */}
        {/* 5. TOP AUDIBLE HORN & MULTI-TIER ANDON SIGNAL TOWER                       */}
        {/* ========================================================================= */}
        <group position={[0.45, 0.45, 0]}>
          {/* Stanchion Base */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.10, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>

          {/* Acoustic Industrial Buzzer Horn */}
          <mesh position={[-0.12, 0.08, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.018, 0.08, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} />
          </mesh>

          {/* Tier 1: Red Light (Overheat) */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.04, 16]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive={isOverheated ? '#ef4444' : '#000000'}
              emissiveIntensity={isOverheated ? 2.5 : 0.1}
            />
          </mesh>
          {/* Tier 2: Amber Light (Heating/Cold) */}
          <mesh position={[0, 0.125, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.04, 16]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive={isTooCold ? '#f59e0b' : '#000000'}
              emissiveIntensity={isTooCold ? 2.5 : 0.1}
            />
          </mesh>
          {/* Tier 3: Green Light (Tap OK) */}
          <mesh position={[0, 0.170, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.04, 16]} />
            <meshStandardMaterial
              color="#22c55e"
              emissive={isWithinTapRange ? '#22c55e' : '#000000'}
              emissiveIntensity={isWithinTapRange ? 2.5 : 0.1}
            />
          </mesh>
          {/* Tier 4: Blue/Cyan Strobe (Measuring) */}
          <mesh position={[0, 0.215, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.04, 16]} />
            <meshStandardMaterial
              color="#06b6d4"
              emissive={isLanceDipping ? '#06b6d4' : '#000000'}
              emissiveIntensity={isLanceDipping ? 3.0 : 0.1}
            />
          </mesh>
        </group>

        {/* Hover Highlight Border */}
        {hovered && (
          <mesh position={[0, 0, 0.09]}>
            <boxGeometry args={[1.38, 0.75, 0.02]} />
            <meshBasicMaterial color="#38bdf8" wireframe />
          </mesh>
        )}
      </group>
    </group>
  );
};

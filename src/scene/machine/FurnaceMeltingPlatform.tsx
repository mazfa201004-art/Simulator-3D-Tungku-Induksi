import React, { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useSimStore } from '../../store/useSimStore';

const NOOP_RAYCAST = () => null;

interface FurnaceMeltingPlatformProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Furnace operating deck and observation platform.
 */
export const FurnaceMeltingPlatform: React.FC<FurnaceMeltingPlatformProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const platformGroupRef = useRef<THREE.Group>(null);
  const isLite = useSimStore((s) => s.performanceProfile === 'lite');

  // Platform and handrails are purely structural/visual; skip pointer raycasting on mobile/desktop for smooth frame rates
  useLayoutEffect(() => {
    if (!platformGroupRef.current) return;
    platformGroupRef.current.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.raycast = NOOP_RAYCAST;
      }
    });
  }, [isLite]);
  const masterPowerOn = useSimStore((s) => s.masterPowerOn);
  const emergencyTripped = useSimStore((s) => s.emergencyTripped);
  const coilOn = useSimStore((s) => s.coilOn);
  const powerSetpoint = useSimStore((s) => s.powerSetpoint);
  const tiltAngle = useSimStore((s) => s.tiltAngle);
  const isTilting = useSimStore((s) => s.isTiltingForward || s.isTiltingBackward);

  // Andon light states
  const isRed = emergencyTripped || (coilOn && powerSetpoint > 0.05);
  const isAmber = !emergencyTripped && (isTilting || tiltAngle > 1.0);
  const isGreen = masterPowerOn && !emergencyTripped && !isRed && !isAmber;

  const deckMat = { color: '#334155', metalness: 0.8, roughness: 0.4 };
  const frameMat = { color: '#0f172a', metalness: 0.7, roughness: 0.5 };
  const handrailYellowMat = { color: '#eab308', metalness: 0.4, roughness: 0.4 };

  const deckHeight = 1.89; // Raised by 1 stair step from 1.68m (9 steps x 0.21m = 1.89m)
  const girderHeight = 1.83;
  const colHeight = 1.83;

  return (
    <group ref={platformGroupRef} position={position} rotation={rotation} name="FurnaceMeltingPlatform">
      {/* 1. STRUCTURAL STEEL COLUMNS (SHS 120x120mm) WITH BASE FOOTING PADS */}
      {[
        [-1.60, -1.82],
        [0.275, -1.82],
        [2.15, -1.82],
        [-1.60, 0.18],
        [-0.85, -0.94],
        [2.15, -0.90],
      ].map(([lx, lz], li) => (
        <group key={`col-${li}`} position={[lx, colHeight / 2, lz]}>
          <mesh>
            <boxGeometry args={[0.12, colHeight, 0.12]} />
            <meshStandardMaterial {...frameMat} />
          </mesh>
          {/* Base footing plate on concrete floor */}
          <mesh position={[0, -colHeight / 2 + 0.02, 0]}>
            <boxGeometry args={[0.24, 0.04, 0.24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Structural Perimeter Girders directly under deck (Y = 1.83m) */}
      {/* Rear Main Girder */}
      <mesh position={[0.275, girderHeight, -1.82]}>
        <boxGeometry args={[3.75, 0.12, 0.08]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>
      {/* Front Main Girder behind furnace */}
      <mesh position={[0.65, girderHeight, -0.90]}>
        <boxGeometry args={[3.00, 0.12, 0.08]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>
      {/* Left Wing Outer Girder */}
      <mesh position={[-1.60, girderHeight, -0.82]}>
        <boxGeometry args={[0.08, 0.12, 2.00]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>
      {/* Right Landing Girder */}
      <mesh position={[2.15, girderHeight, -1.36]}>
        <boxGeometry args={[0.08, 0.12, 0.92]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>

      {/* 2. ELEVATED DIAMOND-PLATE WALKWAY DECKS (y = 1.89m) */}
      {/* Main observation deck behind furnace (x: -1.60 to 2.15, z: -1.85 to -0.90) */}
      <mesh position={[0.275, deckHeight, -1.375]}>
        <boxGeometry args={[3.75, 0.05, 0.95]} />
        <meshStandardMaterial {...deckMat} />
      </mesh>
      {/* Left charging wing deck (x: -1.60 to -0.85, z: -0.90 to 0.20) */}
      <mesh position={[-1.225, deckHeight, -0.35]}>
        <boxGeometry args={[0.75, 0.05, 1.10]} />
        <meshStandardMaterial {...deckMat} />
      </mesh>

      {/* 3. CONTINUOUS OSHA-COMPLIANT TUBULAR SAFETY GUARDRAILS (Deck Y = 1.89m) */}
      {/* Top Rail Y = 2.94m (1.05m above deck), Mid Rail Y = 2.44m (0.55m above deck), Kickplate Y = 1.965m */}

      {/* Rear Guardrail (x: -1.60 to 2.15 at z = -1.82) */}
      <group position={[0.275, 0, -1.82]}>
        <mesh position={[0, deckHeight + 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.021, 0.021, 3.75, 16]} />
          <meshStandardMaterial {...handrailYellowMat} />
        </mesh>
        <mesh position={[0, deckHeight + 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.016, 0.016, 3.75, 16]} />
          <meshStandardMaterial {...handrailYellowMat} />
        </mesh>
        <mesh position={[0, deckHeight + 0.075, 0]}>
          <boxGeometry args={[3.75, 0.15, 0.015]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, deckHeight + 0.075, 0.009]}>
          <planeGeometry args={[3.73, 0.03]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      </group>

      {/* Left Outer Guardrail (z: -1.82 to 0.20 at x = -1.60) */}
      <group position={[-1.60, 0, -0.81]}>
        <mesh position={[0, deckHeight + 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.021, 0.021, 2.02, 16]} />
          <meshStandardMaterial {...handrailYellowMat} />
        </mesh>
        <mesh position={[0, deckHeight + 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 2.02, 16]} />
          <meshStandardMaterial {...handrailYellowMat} />
        </mesh>
        <mesh position={[0, deckHeight + 0.075, 0]}>
          <boxGeometry args={[0.015, 0.15, 2.02]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0.009, deckHeight + 0.075, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.00, 0.03]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      </group>

      {/* Left Wing Front Guardrail (x: -1.60 to -0.85 at z = 0.20) */}
      <group position={[-1.225, 0, 0.20]}>
        <mesh position={[0, deckHeight + 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.021, 0.021, 0.75, 16]} />
          <meshStandardMaterial {...handrailYellowMat} />
        </mesh>
        <mesh position={[0, deckHeight + 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.016, 0.016, 0.75, 16]} />
          <meshStandardMaterial {...handrailYellowMat} />
        </mesh>
        <mesh position={[0, deckHeight + 0.075, 0]}>
          <boxGeometry args={[0.75, 0.15, 0.015]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, deckHeight + 0.075, 0.009]}>
          <planeGeometry args={[0.73, 0.03]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      </group>

      {/* Left Wing Inner Guardrail (z: 0.20 to -0.90 at x = -0.85) */}
      <group position={[-0.85, 0, -0.35]}>
        <mesh position={[0, deckHeight + 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.021, 0.021, 1.10, 16]} />
          <meshStandardMaterial {...handrailYellowMat} />
        </mesh>
        <mesh position={[0, deckHeight + 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 1.10, 16]} />
          <meshStandardMaterial {...handrailYellowMat} />
        </mesh>
        <mesh position={[0, deckHeight + 0.075, 0]}>
          <boxGeometry args={[0.015, 0.15, 1.10]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[-0.009, deckHeight + 0.075, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.08, 0.03]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      </group>

      {/* Front Observation Guardrail Overlooking Furnace (x: -0.85 to 1.45 at z = -0.90) */}
      <group position={[0.30, 0, -0.90]}>
        <mesh position={[0, deckHeight + 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.021, 0.021, 2.30, 16]} />
          <meshStandardMaterial {...handrailYellowMat} />
        </mesh>
        <mesh position={[0, deckHeight + 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.016, 0.016, 2.30, 16]} />
          <meshStandardMaterial {...handrailYellowMat} />
        </mesh>
        <mesh position={[0, deckHeight + 0.075, 0]}>
          <boxGeometry args={[2.30, 0.15, 0.015]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, deckHeight + 0.075, 0.009]}>
          <planeGeometry args={[2.28, 0.03]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      </group>

      {/* Right Landing Outer Guardrail (z: -1.82 to -0.90 at x = 2.15) */}
      <group position={[2.15, 0, -1.36]}>
        <mesh position={[0, deckHeight + 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.021, 0.021, 0.92, 16]} />
          <meshStandardMaterial {...handrailYellowMat} />
        </mesh>
        <mesh position={[0, deckHeight + 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.92, 16]} />
          <meshStandardMaterial {...handrailYellowMat} />
        </mesh>
        <mesh position={[0, deckHeight + 0.075, 0]}>
          <boxGeometry args={[0.015, 0.15, 0.92]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0.009, deckHeight + 0.075, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.90, 0.03]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      </group>

      {/* Tubular Stanchion Vertical Posts with Bolted Base Flanges (Base Y = deckHeight) */}
      {[
        [-1.60, -1.82],
        [0.275, -1.82],
        [2.15, -1.82],
        [-1.60, 0.20],
        [-0.85, 0.20],
        [-0.85, -0.90],
        [0.30, -0.90],
      ].map(([px, pz], pi) => (
        <group key={`hpost-${pi}`} position={[px, deckHeight, pz]}>
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.02, 12]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.525, 0]}>
            <cylinderGeometry args={[0.021, 0.021, 1.05, 16]} />
            <meshStandardMaterial {...handrailYellowMat} />
          </mesh>
        </group>
      ))}

      {/* 4. MASTERFUL PRECISION-ENGINEERED 9-STEP ACCESS STAIRWAY */}
      {/* Climbs from floor (z = 0.60, y = 0) up to platform deck (z = -0.90, y = 1.89m) */}
      {/* Slope angle theta = arctan(1.89 / 1.50) = 0.899 rad */}
      <group position={[1.80, 0, 0]}>
        {/* Dual Structural C-Channel Steel Stringers (Left at x = -0.35, Right at x = +0.35) */}
        {[-0.35, 0.35].map((sx, si) => (
          <group key={`stringer-${si}`}>
            {/* Slanted Stringer Body running exactly from floor (z = 0.60, y = 0.02) to deck (z = -0.90, y = 1.83) */}
            <mesh position={[sx, 0.945, -0.15]} rotation={[0.899, 0, 0]}>
              <boxGeometry args={[0.06, 0.18, 2.44]} />
              <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
            </mesh>
            {/* Horizontal Bottom Floor Anchor Footing */}
            <mesh position={[sx, 0.02, 0.60]}>
              <boxGeometry args={[0.12, 0.04, 0.18]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} />
            </mesh>
            {/* Vertical Top Deck Mounting Bracket Flange */}
            <mesh position={[sx, 1.80, -0.90]}>
              <boxGeometry args={[0.12, 0.18, 0.04]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} />
            </mesh>
          </group>
        ))}

        {/* 9 Open-Riser Anti-Slip Diamond Tread Steps */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((step) => {
          const sy = (step + 1) * 0.21;
          const sz = 0.50 - step * (1.40 / 8);
          return (
            <group key={`stair-step-${step}`} position={[0, sy, sz]}>
              {/* Heavy Galvanized Grating Tread */}
              <mesh>
                <boxGeometry args={[0.66, 0.035, 0.25]} />
                <meshStandardMaterial {...deckMat} />
              </mesh>
              {/* Anti-Slip High-Visibility Yellow Front Edge Nosing */}
              {!isLite && (
                <>
                  <mesh position={[0, 0.018, 0.115]}>
                    <boxGeometry args={[0.65, 0.004, 0.03]} />
                    <meshStandardMaterial color="#eab308" roughness={0.3} />
                  </mesh>
                  {/* Welded Stringer Mounting Cleat Angles on Left & Right */}
                  {[-0.33, 0.33].map((cx, ci) => (
                    <mesh key={`cleat-${ci}`} position={[cx, -0.04, 0]}>
                      <boxGeometry args={[0.02, 0.06, 0.20]} />
                      <meshStandardMaterial color="#0f172a" metalness={0.8} />
                    </mesh>
                  ))}
                </>
              )}
            </group>
          );
        })}

        {/* Continuous Tubular Stair Handrails (Left at x = -0.35, Right at x = +0.35) */}
        {[-0.35, 0.35].map((hx, hi) => (
          <group key={`stair-handrail-${hi}`} position={[hx, 0, 0]}>
            {/* Top Slanted Handrail Pipe (Runs continuously from bottom post to top landing) */}
            <mesh position={[0, 1.995, -0.15]} rotation={[0.899 - Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.021, 0.021, 2.44, 16]} />
              <meshStandardMaterial {...handrailYellowMat} />
            </mesh>

            {/* Mid Slanted Knee-Rail Pipe */}
            <mesh position={[0, 1.495, -0.15]} rotation={[0.899 - Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 2.44, 16]} />
              <meshStandardMaterial {...handrailYellowMat} />
            </mesh>

            {/* Bottom Vertical Stanchion Post (At floor z = 0.60, height = 1.05m) */}
            <mesh position={[0, 0.525, 0.60]}>
              <cylinderGeometry args={[0.021, 0.021, 1.05, 16]} />
              <meshStandardMaterial {...handrailYellowMat} />
            </mesh>
            {/* Bottom Rounded Handrail End Elbow */}
            <mesh position={[0, 1.05, 0.60]}>
              <sphereGeometry args={[0.023, 12, 12]} />
              <meshStandardMaterial {...handrailYellowMat} />
            </mesh>

            {/* Intermediate Mid-Span Stanchion Post on Stringer (z = -0.15) */}
            <mesh position={[0, 1.47, -0.15]}>
              <cylinderGeometry args={[0.021, 0.021, 1.05, 16]} />
              <meshStandardMaterial {...handrailYellowMat} />
            </mesh>

            {/* Top Vertical Stanchion Post at Platform Landing (z = -0.90) */}
            <mesh position={[0, 2.415, -0.90]}>
              <cylinderGeometry args={[0.021, 0.021, 1.05, 16]} />
              <meshStandardMaterial {...handrailYellowMat} />
            </mesh>
            {/* Top Corner Welded Elbow connecting to Platform Railing */}
            <mesh position={[0, 2.94, -0.90]}>
              <sphereGeometry args={[0.023, 12, 12]} />
              <meshStandardMaterial {...handrailYellowMat} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 5. PROFESSIONAL INDUSTRIAL 3-TIER ANDON STATUS TOWER LIGHT */}
      {/* Mounted cleanly on the corner stanchion post via heavy cast clamp bracket (Zero handrail clipping) */}
      <group position={[-1.60, deckHeight, -1.82]}>
        {/* Cast Aluminum Heavy L-Bracket Clamped to Stanchion Post */}
        <mesh position={[0.045, 0.85, 0]}>
          <boxGeometry args={[0.09, 0.04, 0.04]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh position={[0.09, 0.85, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.06, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>

        {/* Polished Aluminum Extension Mast */}
        <mesh position={[0.09, 1.05, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.35, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Andon Tower Enclosure Base Housing */}
        <mesh position={[0.09, 1.25, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.05, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>

        {/* Light Tier 3: GREEN (Bottom - System Ready / Normal) */}
        <mesh position={[0.09, 1.31, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.06, 24]} />
          <meshStandardMaterial
            color={isGreen ? '#22c55e' : '#052e16'}
            emissive={isGreen ? '#22c55e' : '#000000'}
            emissiveIntensity={isGreen ? 2.5 : 0}
            roughness={0.2}
          />
        </mesh>

        {/* Light Tier 2: AMBER (Middle - Tilting / Motion Caution) */}
        <mesh position={[0.09, 1.38, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.06, 24]} />
          <meshStandardMaterial
            color={isAmber ? '#f59e0b' : '#451a03'}
            emissive={isAmber ? '#f59e0b' : '#000000'}
            emissiveIntensity={isAmber ? 2.5 : 0}
            roughness={0.2}
          />
        </mesh>

        {/* Light Tier 1: RED (Top - Heating / Fault / Alarm) */}
        <mesh position={[0.09, 1.45, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.06, 24]} />
          <meshStandardMaterial
            color={isRed ? '#ef4444' : '#450a0a'}
            emissive={isRed ? '#ef4444' : '#000000'}
            emissiveIntensity={isRed ? 2.8 : 0}
            roughness={0.2}
          />
        </mesh>

        {/* Top Acoustic Buzzer / Piezo Sounder Cap */}
        <mesh position={[0.09, 1.50, 0]}>
          <cylinderGeometry args={[0.034, 0.034, 0.035, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        <mesh position={[0.09, 1.52, 0]}>
          <coneGeometry args={[0.034, 0.02, 24]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>
    </group>
  );
};

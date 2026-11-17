import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '../../store/useSimStore';
import { getBlackbodyColor } from '../../sim/blackbody';

interface MetalSolidProps {
  position?: [number, number, number];
}

/**
 * Authentic 3-Stage Solid Metal Batch Charge inside the Induction Furnace Crucible.
 * Visually shows each layer loaded during Adegan 13:
 * - Stage 1 (Bottom): Solid Pig Iron Starting Blocks (for maximum electromagnetic flux coupling)
 * - Stage 2 (Middle): Steel Scrap & Return Scrap Sprues/Risers (prevents scrap bridging)
 * - Stage 3 (Top): Carburizer Graphite Granules & Ferroalloy Lumps (FeSi 75, FeMn)
 * Shrinks and settles realistically as the electromagnetic induction heats and melts the charge.
 */
export const MetalSolid: React.FC<MetalSolidProps> = ({ position = [0, 0, 0] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const stage1Ref = useRef<THREE.Group>(null);
  const stage2Ref = useRef<THREE.Group>(null);
  const stage3Ref = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const { sim, furnaceChargedFraction, furnaceMetalMassKg, chargingStep } = useSimStore.getState();
    const melt = sim.meltFraction; // 0..1
    const temp = sim.temperatureC;

    if (!groupRef.current) return;

    // Visibility: hide if uncharged, drained, or completely melted
    if (furnaceChargedFraction <= 0 || furnaceMetalMassKg <= 0.5 || melt >= 0.99) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    // Show layers according to chargingStep (1, 2, or 3)
    const activeStage = chargingStep > 0 ? chargingStep : 3;
    if (stage1Ref.current) stage1Ref.current.visible = activeStage >= 1;
    if (stage2Ref.current) stage2Ref.current.visible = activeStage >= 2;
    if (stage3Ref.current) stage3Ref.current.visible = activeStage >= 3;

    // Chunks shrink and settle downward as they melt
    const shrinkScale = Math.max(0.01, 1.0 - melt * 0.9);
    const sinkY = -melt * 0.18;

    groupRef.current.scale.set(shrinkScale, shrinkScale, shrinkScale);
    groupRef.current.position.y = position[1] + sinkY;

    // Blackbody incandescence glow color
    if (materialRef.current) {
      const glow = getBlackbodyColor(temp);
      materialRef.current.emissive.setRGB(glow.r, glow.g, glow.b);
      materialRef.current.emissiveIntensity = glow.emissiveIntensity * 0.75;

      if (temp < 300) {
        materialRef.current.color.set('#cbd5e1');
        materialRef.current.roughness = 0.28;
      } else if (temp < 550) {
        materialRef.current.color.set('#d97706');
        materialRef.current.roughness = 0.35;
      } else if (temp < 750) {
        materialRef.current.color.set('#475569');
        materialRef.current.roughness = 0.50;
      } else {
        materialRef.current.color.set('#1e293b');
        materialRef.current.roughness = 0.65;
      }
    }
  });

  return (
    <group ref={groupRef} name="VFX_MetalSolid" position={position}>
      {/* Shared PBR metallic material */}
      <meshStandardMaterial
        ref={materialRef}
        color="#cbd5e1"
        metalness={0.94}
        roughness={0.28}
      />

      {/* STAGE 1 (BOTTOM LAYER): Solid Pig Iron Starting Blocks */}
      <group ref={stage1Ref} name="Layer1_PigIronStartingBlock">
        <mesh position={[-0.06, -0.02, -0.04]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.18, 0.055, 0.11]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.32} />
        </mesh>
        <mesh position={[0.06, -0.02, 0.05]} rotation={[0, -0.25, 0]}>
          <boxGeometry args={[0.18, 0.055, 0.11]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.32} />
        </mesh>
        <mesh position={[0.0, 0.03, -0.01]} rotation={[0.05, 0.8, 0]}>
          <boxGeometry args={[0.20, 0.045, 0.12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.94} roughness={0.28} />
        </mesh>
      </group>

      {/* STAGE 2 (MIDDLE LAYER): Steel Scrap & Return Scrap */}
      <group ref={stage2Ref} name="Layer2_SteelAndReturnScrap">
        <mesh position={[-0.04, 0.08, -0.05]} rotation={[0.15, 0.35, -0.1]}>
          <boxGeometry args={[0.22, 0.035, 0.15]} />
        </mesh>
        <mesh position={[0.06, 0.11, 0.04]} rotation={[-0.2, -0.4, 0.25]}>
          <boxGeometry args={[0.18, 0.030, 0.14]} />
        </mesh>
        {/* Return Scrap Feeder Riser Head */}
        <group position={[0.08, 0.10, -0.07]} rotation={[-0.2, 0.5, 0.1]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.065, 0.07, 0.13, 14]} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <coneGeometry args={[0.045, 0.05, 12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>
        {/* Return Runner Bar */}
        <mesh position={[-0.05, 0.09, 0.08]} rotation={[0.05, -0.7, 0.15]}>
          <boxGeometry args={[0.16, 0.04, 0.06]} />
        </mesh>
      </group>

      {/* STAGE 3 (TOP LAYER): Carburizer Graphite & Ferroalloy Lumps (FeSi 75, FeMn) */}
      <group ref={stage3Ref} name="Layer3_CarburizerAndFerroalloy">
        {/* Graphite Carburizer Dark Lumps */}
        <mesh position={[-0.04, 0.16, -0.03]} rotation={[0.2, 0.5, 0.1]}>
          <dodecahedronGeometry args={[0.048, 0]} />
          <meshStandardMaterial color="#18181b" metalness={0.75} roughness={0.4} />
        </mesh>
        <mesh position={[0.03, 0.165, -0.04]} rotation={[-0.1, 0.3, 0.2]}>
          <dodecahedronGeometry args={[0.042, 0]} />
          <meshStandardMaterial color="#18181b" metalness={0.75} roughness={0.4} />
        </mesh>
        {/* Crystalline FeSi 75 & FeMn Lumps */}
        <mesh position={[0.04, 0.16, 0.05]} rotation={[-0.3, 0.2, -0.4]}>
          <dodecahedronGeometry args={[0.06, 0]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.98} roughness={0.10} />
        </mesh>
        <mesh position={[-0.02, 0.17, 0.03]} rotation={[0.1, 0.6, 0.3]}>
          <boxGeometry args={[0.075, 0.022, 0.075]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.14} />
        </mesh>
      </group>
    </group>
  );
};

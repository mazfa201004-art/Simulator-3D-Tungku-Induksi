import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';

/**
 * 3D Realistic Slag Coagulation, Deslagging & Chemistry Sampling Sequence (Adegan 15/20).
 * Displays:
 * 1. White Drosan coagulant powder particles falling and reacting on the crucible melt pool
 *    (thrown directly from the operator's handheld Kamal KML shovel, with zero duplicate ghost shovel).
 * 2. Rapid aggregation and expansion of dark foamy slag crust on liquid surface (clickable when holding skimmer).
 * 3. Coagulated slag crust dragged out into the slag pot by the operator's handheld skimmer rake.
 * 4. Slag pot collection container on platform catching discarded slag.
 * 5. Sampling spoon dipping into clean liquid bath to extract a molten spectrometer test coin.
 * 6. Hardening spectrometry coin coupon on the platform test anvil.
 */
export const SlagCoagulantVisualSequence: React.FC = () => {
  const isLite = useSimStore((s) => s.performanceProfile === 'lite');
  const slagSequenceStep = useSimStore((s) => s.slagSequenceStep);
  const slagCoagulantAdded = useSimStore((s) => s.slagCoagulantAdded);
  const isDeslagged = useSimStore((s) => s.isDeslagged);
  const chemSampleVerified = useSimStore((s) => s.chemSampleVerified);
  const jobOrder = useSimStore((s) => s.jobOrder);
  const heldTool = useSimStore((s) => s.heldTool);
  const isShovelFilled = useSimStore((s) => s.isShovelFilled);
  const throwCoagulantFromShovel = useSimStore((s) => s.throwCoagulantFromShovel);
  const skimSlagWithRake = useSimStore((s) => s.skimSlagWithRake);

  // Animation refs (No duplicate floating shovel or rake meshes!)
  const powderDropGroupRef = useRef<THREE.Group>(null);
  const spoonGroupRef = useRef<THREE.Group>(null);
  const crustGroupRef = useRef<THREE.Group>(null);
  const coinMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const stepTimeRef = useRef(0);
  const currentStepRef = useRef(slagSequenceStep);

  // Powder particles
  const powderCount = isLite ? 24 : 48;
  const powderPos = useMemo(() => {
    const arr = new Float32Array(powderCount * 3);
    for (let i = 0; i < powderCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.20;
      arr[i * 3] = Math.cos(angle) * r;
      arr[i * 3 + 1] = Math.random() * 0.22;
      arr[i * 3 + 2] = Math.sin(angle) * r;
    }
    return arr;
  }, [powderCount]);

  useFrame((_, delta) => {
    if (currentStepRef.current !== slagSequenceStep) {
      currentStepRef.current = slagSequenceStep;
      stepTimeRef.current = 0;
    }
    stepTimeRef.current += delta;
    const t = Math.min(1.2, stepTimeRef.current);
    const progress = t / 1.2;

    // 1. Falling Drosan Powder Particles in Crucible Mouth (Thrown from Held Shovel)
    if (powderDropGroupRef.current) {
      if (slagSequenceStep === 'powder') {
        powderDropGroupRef.current.visible = true;
        const dropY = THREE.MathUtils.lerp(0.46, 0.22, progress);
        const spread = THREE.MathUtils.lerp(0.45, 1.05, progress);
        powderDropGroupRef.current.position.set(0, dropY, 0);
        powderDropGroupRef.current.scale.set(spread, 1.0, spread);
      } else {
        powderDropGroupRef.current.visible = false;
      }
    }

    // 2. Slag Crust Expansion & Skimming
    if (crustGroupRef.current) {
      if (slagSequenceStep === 'powder') {
        crustGroupRef.current.visible = true;
        const pScale = THREE.MathUtils.lerp(0.05, 0.45, progress);
        crustGroupRef.current.scale.set(pScale, 1.0, pScale);
        crustGroupRef.current.position.set(0, 0.22, 0);
      } else if (slagSequenceStep === 'crusting' || (slagCoagulantAdded && !isDeslagged && slagSequenceStep !== 'skimming')) {
        crustGroupRef.current.visible = true;
        const scale = THREE.MathUtils.lerp(0.45, 1.0, Math.min(1.0, progress * 1.3));
        crustGroupRef.current.scale.set(scale, 1.0, scale);
        crustGroupRef.current.position.set(0, 0.22, 0);
      } else if (slagSequenceStep === 'skimming') {
        crustGroupRef.current.visible = true;
        // Crust dragged along by the handheld skimmer toward side slag pot (x: 0 -> 0.56, z: 0 -> -0.36)
        const dragX = THREE.MathUtils.lerp(0.0, 0.56, progress);
        const dragZ = THREE.MathUtils.lerp(0.0, -0.36, progress);
        const dragY = THREE.MathUtils.lerp(0.22, 0.28, Math.sin(progress * Math.PI));
        const dragScale = THREE.MathUtils.lerp(1.0, 0.22, progress);
        crustGroupRef.current.position.set(dragX, dragY, dragZ);
        crustGroupRef.current.scale.set(dragScale, 1.0, dragScale);
      } else {
        // After skimming, crust is inside the slag pot
        crustGroupRef.current.visible = false;
      }
    }

    // 3. Sampling Spoon Animation
    if (spoonGroupRef.current) {
      if (slagSequenceStep === 'sampling') {
        spoonGroupRef.current.visible = true;
        if (progress < 0.5) {
          // Dip into bath
          const p = progress / 0.5;
          const sx = THREE.MathUtils.lerp(0.40, 0.0, p);
          const sy = THREE.MathUtils.lerp(0.50, 0.22, p);
          const sz = THREE.MathUtils.lerp(-0.25, 0.0, p);
          spoonGroupRef.current.position.set(sx, sy, sz);
          spoonGroupRef.current.rotation.set(0.2, 0.4, 0);
        } else {
          // Lift up and carry over to anvil
          const p = (progress - 0.5) / 0.5;
          const sx = THREE.MathUtils.lerp(0.0, 0.68, p);
          const sy = THREE.MathUtils.lerp(0.22, 0.48, p);
          const sz = THREE.MathUtils.lerp(0.0, -0.36, p);
          spoonGroupRef.current.position.set(sx, sy, sz);
          spoonGroupRef.current.rotation.set(0.1, 0.8, p * 0.6); // Pouring tilt
        }
      } else {
        spoonGroupRef.current.visible = false;
      }
    }

    // 4. Hardening Spectrometry Coin Glow & Color
    if (coinMatRef.current) {
      if (slagSequenceStep === 'sampling') {
        coinMatRef.current.color.set('#f59e0b');
        coinMatRef.current.emissive.set('#ea580c');
        coinMatRef.current.emissiveIntensity = 1.2;
      } else if (chemSampleVerified || slagSequenceStep === 'done') {
        // Cool down to dull silver/grey steel
        coinMatRef.current.color.set('#64748b');
        coinMatRef.current.emissive.set('#000000');
        coinMatRef.current.emissiveIntensity = 0.0;
      }
    }
  });

  return (
    <group name="SlagCoagulantVisualSequence">
      {/* ===================================================================== */}
      {/* 1. SLAG COLLECTION POT (Pot Terak Logam di Samping Tanur)              */}
      {/* ===================================================================== */}
      <group position={[0.62, 0.12, -0.42]}>
        {/* Pot Outer Shell */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.14, 0.28, isLite ? 12 : 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.6} />
        </mesh>
        {/* Pot Heavy Base Rim */}
        <mesh position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.03, isLite ? 12 : 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.4} />
        </mesh>
        {/* Pot Lifting Trunnion Handles */}
        <mesh position={[0.20, 0.05, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.07, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[-0.20, 0.05, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.07, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>

        {/* Discarded Slag Clinkers inside Pot (visible when deslagged) */}
        {(isDeslagged || slagSequenceStep === 'skimming' || slagSequenceStep === 'sampling' || slagSequenceStep === 'done') && (
          <group position={[0, 0.06, 0]}>
            <mesh>
              <cylinderGeometry args={[0.14, 0.12, 0.06, 12]} />
              <meshStandardMaterial
                color="#292524"
                roughness={0.9}
                emissive="#78350f"
                emissiveIntensity={0.3}
              />
            </mesh>
            {/* Rough Crust Bumps */}
            {[-0.04, 0.03, 0.0].map((bx, bi) => (
              <mesh key={`slag-clinker-${bi}`} position={[bx, 0.04, (bi - 1) * 0.04]}>
                <sphereGeometry args={[0.035, 6, 6]} />
                <meshStandardMaterial color="#1c1917" roughness={0.95} />
              </mesh>
            ))}
          </group>
        )}

        <Text
          position={[0, 0.18, 0]}
          fontSize={0.035}
          color="#94a3b8"
          anchorX="center"
          fontWeight="bold"
        >
          POT TERAK
        </Text>
      </group>

      {/* ===================================================================== */}
      {/* 2. SPECTROMETRY SAMPLING ANVIL & HARDENING COIN                      */}
      {/* ===================================================================== */}
      <group position={[0.72, 0.08, -0.15]}>
        {/* Steel Chill Block / Sampling Anvil */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.14, 0.16, 0.14]} />
          <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
        </mesh>

        {/* Solidifying Spectrometer Sample Coin */}
        {(chemSampleVerified || slagSequenceStep === 'sampling' || slagSequenceStep === 'done') && (
          <group position={[0, 0.085, 0]}>
            <mesh>
              <cylinderGeometry args={[0.032, 0.032, 0.010, 16]} />
              <meshStandardMaterial
                ref={coinMatRef}
                color="#64748b"
                metalness={0.7}
                roughness={0.4}
              />
            </mesh>
            <Text
              position={[0, 0.008, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.012}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {jobOrder === 'FC_250' ? 'FC-250' : 'FCD-500'}
            </Text>
          </group>
        )}

        <Text
          position={[0, 0.12, 0.08]}
          fontSize={0.024}
          color="#38bdf8"
          anchorX="center"
          fontWeight="bold"
        >
          ANVIL SAMPEL
        </Text>
      </group>

      {/* ===================================================================== */}
      {/* 3. COAGULATED SLAG CRUST ON BATH SURFACE (Interactive Click Target)   */}
      {/* ===================================================================== */}
      <group
        ref={crustGroupRef}
        visible={false}
        onClick={(e) => {
          e.stopPropagation();
          if (heldTool === 'skimmer') {
            skimSlagWithRake();
          } else if (heldTool === 'shovel' && isShovelFilled) {
            throwCoagulantFromShovel();
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (heldTool === 'skimmer') {
            document.body.style.cursor = 'pointer';
            useSimStore.getState().setActiveHoverObject('Kerak Terak Menggumpal (Klik untuk Menyerok ke Pot Terak)');
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
          useSimStore.getState().setActiveHoverObject(null);
        }}
      >
        {/* Dark Foamy Crust Disc */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.02, isLite ? 16 : 24]} />
          <meshStandardMaterial
            color="#27272a"
            roughness={0.95}
            metalness={0.1}
            emissive="#7c2d12"
            emissiveIntensity={0.22}
          />
        </mesh>
        {/* Crust Agglomeration Lumps */}
        {[
          [0.08, 0.01, 0.06],
          [-0.09, 0.01, -0.05],
          [0.02, 0.015, -0.10],
          [-0.04, 0.01, 0.09],
        ].map(([cx, cy, cz], ci) => (
          <mesh key={`crust-lump-${ci}`} position={[cx, cy, cz]}>
            <cylinderGeometry args={[0.05, 0.06, 0.02, 8]} />
            <meshStandardMaterial color="#18181b" roughness={0.98} />
          </mesh>
        ))}

        {/* Interactive Prompt above Coagulated Slag Crust */}
        {slagSequenceStep === 'crusting' && !isDeslagged && (
          <Text
            position={[0, 0.09, 0]}
            rotation={[-Math.PI / 3, 0, 0]}
            fontSize={0.028}
            color="#4ade80"
            anchorX="center"
            fontWeight="bold"
          >
            {heldTool === 'skimmer'
              ? '[KLIK UNTUK SEROK TERAK KE POT]'
              : 'TERAK MENGGUMPAL (AMBIL SEROKAN DI PEGBOARD)'}
          </Text>
        )}
      </group>

      {/* ===================================================================== */}
      {/* 4. FALLING WHITE DROSAN POWDER PARTICLES IN CRUCIBLE                  */}
      {/* (Thrown directly from the operator's handheld Kamal KML shovel)        */}
      {/* ===================================================================== */}
      <group ref={powderDropGroupRef} visible={false}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[powderPos, 3]}
            />
          </bufferGeometry>
          <pointsMaterial color="#ffffff" size={0.018} transparent opacity={0.9} />
        </points>
      </group>

      {/* ===================================================================== */}
      {/* 5. SPECTROMETRY SAMPLING SPOON                                       */}
      {/* ===================================================================== */}
      <group ref={spoonGroupRef} visible={false}>
        {/* Long Rod Handle */}
        <mesh position={[0.55, 0.16, 0]} rotation={[0, 0, -0.22]}>
          <cylinderGeometry args={[0.008, 0.008, 1.2, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        {/* Spoon Cup */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.035, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#ea580c"
            emissiveIntensity={1.0}
            roughness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
};

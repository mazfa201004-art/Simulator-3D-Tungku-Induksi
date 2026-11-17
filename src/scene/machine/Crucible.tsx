import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { getBlackbodyColor } from '../../sim/blackbody';
import { inductionAudio } from '../fx/InductionAudio';

interface CrucibleProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Authentic Conical Smelting Crucible / Sintering Former (Elemen Gambar 1).
 * Features interactive 3D Inspection Hotspots for Scene 1.3:
 * 1. Bottom Crucible Base & Ground Leakage Electrode (`bottom`)
 * 2. Inner Silica/Alumina Refractory Wall (`wall`)
 * 3. Pouring Spout Beak Lip (`lip`)
 */
export const Crucible: React.FC<CrucibleProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const isLite = useSimStore((s) => s.performanceProfile === 'lite');
  const inspection = useSimStore((s) => s.inspection);
  const activeInspectionScanPoint = useSimStore((s) => s.activeInspectionScanPoint);
  const trigger3DInspectionScan = useSimStore((s) => s.trigger3DInspectionScan);
  const currentSopStepIndex = useSimStore((s) => s.currentSopStepIndex);
  const isSopMode = useSimStore((s) => s.isSopMode);
  const furnaceChargedFraction = useSimStore((s) => s.furnaceChargedFraction);

  const innerWallMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const smoothedTempRef = useRef(25.0);
  const scanRingBottomRef = useRef<THREE.Mesh>(null);
  const scanRingWallRef = useRef<THREE.Mesh>(null);
  const scanRingLipRef = useRef<THREE.Mesh>(null);

  const isAllCrucibleInspected = inspection.bottom && inspection.wall && inspection.lip;
  const showHotspots =
    !isAllCrucibleInspected ||
    activeInspectionScanPoint === 'bottom' ||
    activeInspectionScanPoint === 'wall' ||
    activeInspectionScanPoint === 'lip' ||
    (isSopMode && currentSopStepIndex === 2 && furnaceChargedFraction < 0.1);

  useFrame((state, delta) => {
    const temp = useSimStore.getState().sim.temperatureC;
    smoothedTempRef.current = THREE.MathUtils.lerp(
      smoothedTempRef.current,
      temp,
      delta * 1.5
    );

    if (innerWallMatRef.current) {
      const glow = getBlackbodyColor(smoothedTempRef.current * 0.92);
      innerWallMatRef.current.emissive.setRGB(glow.r, glow.g, glow.b);
      innerWallMatRef.current.emissiveIntensity = glow.emissiveIntensity * 0.20;
    }

    const t = state.clock.elapsedTime;
    const pulse = 1.0 + Math.sin(t * 5.0) * 0.12;

    if (scanRingBottomRef.current) {
      const isScanning = activeInspectionScanPoint === 'bottom';
      const s = isScanning ? 0.6 + ((t * 1.8) % 0.8) : pulse;
      scanRingBottomRef.current.scale.set(s, s, 1);
    }
    if (scanRingWallRef.current) {
      const isScanning = activeInspectionScanPoint === 'wall';
      const s = isScanning ? 0.6 + ((t * 1.8) % 0.8) : pulse;
      scanRingWallRef.current.scale.set(s, s, 1);
      if (isScanning) {
        scanRingWallRef.current.position.y = Math.sin(t * 6.0) * 0.18;
      } else {
        scanRingWallRef.current.position.y = 0.02;
      }
    }
    if (scanRingLipRef.current) {
      const isScanning = activeInspectionScanPoint === 'lip';
      const s = isScanning ? 0.6 + ((t * 1.8) % 0.8) : pulse;
      scanRingLipRef.current.scale.set(s, s, 1);
    }
  });

  const height = 0.96;
  const radiusTop = 0.34;
  const radiusBottom = 0.22;
  const segs = isLite ? 16 : 48;

  return (
    <group
      name="ENV_CrucibleContainer"
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        const st = useSimStore.getState();
        if (!st.inspection.bottom) {
          st.trigger3DInspectionScan('bottom');
        } else if (!st.inspection.wall) {
          st.trigger3DInspectionScan('wall');
        } else if (!st.inspection.lip) {
          st.trigger3DInspectionScan('lip');
        } else if (st.currentSopStepIndex === 12 || (st.isAlloyVerified && st.chargingStep < 3)) {
          inductionAudio.resume();
          inductionAudio.playClick();
          st.setSequentialChargingModalOpen(true);
        } else {
          inductionAudio.resume();
          inductionAudio.playClick();
          st.setInspectionModalOpen(true);
        }
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        const st = useSimStore.getState();
        useSimStore
          .getState()
          .setActiveHoverObject(
            st.currentSopStepIndex === 12 || (st.isAlloyVerified && st.chargingStep < 3)
              ? 'Krusibel Tanur Induksi — Klik untuk Simulasi Pemuatan Bahan 3 Tahap (Adegan 13)'
              : 'Krusibel Refraktori Tanur (Klik Titik Reticle 3D untuk Pindai)'
          );
      }}
      onPointerOut={() => useSimStore.getState().setActiveHoverObject(null)}
    >
      {/* 1. OUTER CONICAL CRUCIBLE SHELL (500kg Heavy Industrial Crucible) */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, segs, 1, true]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>

      {/* Crucible Heavy Floor Base Plate */}
      <mesh position={[0, -height / 2 + 0.017, 0]}>
        <cylinderGeometry args={[radiusBottom, radiusBottom, 0.035, segs]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.5} />
      </mesh>

      {/* 3. INNER REFRACTORY CERAMIC LINING (Dinding Dalam Pijar Termal) */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[radiusTop - 0.025, radiusBottom - 0.025, height - 0.025, segs, 1, true]} />
        <meshStandardMaterial
          ref={innerWallMatRef}
          color="#1e293b"
          roughness={0.8}
          side={THREE.BackSide}
        />
      </mesh>

      {/* ===================================================================== */}
      {/* 4. INTERACTIVE 3D INSPECTION HOTSPOTS (ADEGAN 1.3)                    */}
      {/* ===================================================================== */}
      {showHotspots && (
        <group name="Crucible_3D_Inspection_Hotspots">
          {/* HOTSPOT 1: DASAR KRUSIBEL & ELEKTRODA GROUND LEAKAGE */}
          <group
            position={[0, -0.42, 0]}
            onClick={(e) => {
              e.stopPropagation();
              trigger3DInspectionScan('bottom');
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
              useSimStore
                .getState()
                .setActiveHoverObject('Titik 1: Dasar Krusibel & Sensor Ground Leakage (Klik Pindai)');
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
              useSimStore.getState().setActiveHoverObject(null);
            }}
          >
            {/* Laser Target Ring on Crucible Floor */}
            <mesh ref={scanRingBottomRef} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.09, 0.13, 24]} />
              <meshBasicMaterial
                color={
                  inspection.bottom
                    ? '#22c55e'
                    : activeInspectionScanPoint === 'bottom'
                    ? '#38bdf8'
                    : '#facc15'
                }
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Center Sensor Node */}
            <mesh position={[0, 0.01, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
              <meshBasicMaterial
                color={
                  inspection.bottom
                    ? '#22c55e'
                    : activeInspectionScanPoint === 'bottom'
                    ? '#38bdf8'
                    : '#f59e0b'
                }
              />
            </mesh>
            {/* Vertical Laser Beam When Actively Scanning */}
            {activeInspectionScanPoint === 'bottom' && (
              <mesh position={[0, 0.45, 0]}>
                <cylinderGeometry args={[0.01, 0.12, 0.9, 16, 1, true]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} side={THREE.DoubleSide} />
              </mesh>
            )}
            <Text
              position={[0, 0.08, 0]}
              rotation={[-Math.PI / 3, 0, 0]}
              fontSize={0.032}
              color={inspection.bottom ? '#4ade80' : '#fef08a'}
              anchorX="center"
              fontWeight="bold"
            >
              {inspection.bottom
                ? '✓ 1. DASAR: 96% (NORMAL)'
                : activeInspectionScanPoint === 'bottom'
                ? 'MEMINDAI DASAR KRUSIBEL...'
                : '[1] KLIK PINDAI DASAR'}
            </Text>
          </group>

          {/* HOTSPOT 2: DINDING SAMPING REFRAKTORI (SILIKA/ALUMINA) */}
          <group
            position={[0, 0.08, -0.24]}
            onClick={(e) => {
              e.stopPropagation();
              trigger3DInspectionScan('wall');
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
              useSimStore
                .getState()
                .setActiveHoverObject('Titik 2: Dinding Dalam Refraktori Silika/Alumina (Klik Pindai)');
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
              useSimStore.getState().setActiveHoverObject(null);
            }}
          >
            <mesh ref={scanRingWallRef} position={[0, 0.02, 0.02]}>
              <ringGeometry args={[0.07, 0.10, 24]} />
              <meshBasicMaterial
                color={
                  inspection.wall
                    ? '#22c55e'
                    : activeInspectionScanPoint === 'wall'
                    ? '#38bdf8'
                    : '#facc15'
                }
                side={THREE.DoubleSide}
              />
            </mesh>
            {activeInspectionScanPoint === 'wall' && (
              <mesh position={[0, 0, 0.14]} rotation={[-Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.25, 0.25, 0.015, 24, 1, true]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} side={THREE.DoubleSide} />
              </mesh>
            )}
            <Text
              position={[0, 0.15, 0.04]}
              fontSize={0.032}
              color={inspection.wall ? '#4ade80' : '#fef08a'}
              anchorX="center"
              fontWeight="bold"
            >
              {inspection.wall
                ? '✓ 2. DINDING: 94% AMAN'
                : activeInspectionScanPoint === 'wall'
                ? 'MEMINDAI DINDING LINING...'
                : '[2] KLIK PINDAI DINDING'}
            </Text>
          </group>

          {/* HOTSPOT 3: BIBIR MONCONG TUANG TANUR (SPOUT REFRACTORY) */}
          <group
            position={[0, 0.60, 0.56]}
            onClick={(e) => {
              e.stopPropagation();
              trigger3DInspectionScan('lip');
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
              useSimStore
                .getState()
                .setActiveHoverObject('Titik 3: Bibir Moncong Tuang / Spout Refractory (Klik Pindai)');
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
              useSimStore.getState().setActiveHoverObject(null);
            }}
          >
            <mesh ref={scanRingLipRef} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.06, 0.09, 24]} />
              <meshBasicMaterial
                color={
                  inspection.lip
                    ? '#22c55e'
                    : activeInspectionScanPoint === 'lip'
                    ? '#38bdf8'
                    : '#facc15'
                }
                side={THREE.DoubleSide}
              />
            </mesh>
            {activeInspectionScanPoint === 'lip' && (
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.02, 0.09, 0.24, 16, 1, true]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.45} side={THREE.DoubleSide} />
              </mesh>
            )}
            <Text
              position={[0, 0.14, 0]}
              fontSize={0.032}
              color={inspection.lip ? '#4ade80' : '#fef08a'}
              anchorX="center"
              fontWeight="bold"
            >
              {inspection.lip
                ? '✓ 3. MONCONG SPOUT: BERSIH'
                : activeInspectionScanPoint === 'lip'
                ? 'MEMINDAI CERAT TUANG...'
                : '[3] KLIK PINDAI MONCONG'}
            </Text>
          </group>
        </group>
      )}
    </group>
  );
};

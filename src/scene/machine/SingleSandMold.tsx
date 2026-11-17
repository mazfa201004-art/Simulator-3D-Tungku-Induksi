import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { JOB_ORDER_PRESETS } from '../../sim/storyboardData';
import { inductionAudio } from '../fx/InductionAudio';

interface SingleSandMoldProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * 1 Unit Single Sand Mold (Optimasi Grafis Ringan Smartphone)
 * Sesuai Dokumen Storyboard:
 * - Order A: Cetakan Impeller Pompa - FC 250 (Besi Cor Kelabu)
 * - Order B: Cetakan Roda Gigi - FCD 500 (Besi Cor Nodular)
 * - 1 Cetakan Pasir Sampel Produksi + 1 Pig Mold Kecil untuk Sisa Tuang
 */
export const SingleSandMold: React.FC<SingleSandMoldProps> = ({
  position = [7.8, 0, 0.0],
  rotation = [0, 0, 0],
}) => {
  const jobOrder = useSimStore((s) => s.jobOrder);
  const singleMoldFillLevel = useSimStore((s) => s.singleMoldFillLevel);
  const pigMoldFillLevel = useSimStore((s) => s.pigMoldFillLevel);
  const isSingleMoldSolid = useSimStore((s) => s.isSingleMoldSolid);
  const isSingleMoldCooling = useSimStore((s) => s.isSingleMoldCooling);
  const setSingleMoldState = useSimStore((s) => s.setSingleMoldState);
  const isLadlePouringToMold = useSimStore((s) => s.isLadlePouringToMold);
  const trigger3DInspectionScan = useSimStore((s) => s.trigger3DInspectionScan);
  const activeInspectionScanPoint = useSimStore((s) => s.activeInspectionScanPoint);
  const isInspectionMoldDone = useSimStore((s) => s.inspection.mold);

  const copeRef = useRef<THREE.Group>(null);
  const moltenPoolRef = useRef<THREE.Mesh>(null);
  const riserPoolRef = useRef<THREE.Mesh>(null);
  const pigMoltenPoolRef = useRef<THREE.Mesh>(null);
  const moldLightRef = useRef<THREE.PointLight>(null);
  const solidObjectRef = useRef<THREE.Group>(null);
  const moldScanRingRef = useRef<THREE.Mesh>(null);

  const currentOrder = JOB_ORDER_PRESETS[jobOrder];
  const isFC = jobOrder.startsWith('FC');
  const moldTitle = currentOrder ? currentOrder.moldLabel : 'CETAKAN TUNGGAL PRODUKSI 3D';
  const productTitle = currentOrder ? `${currentOrder.productName} (${currentOrder.id})` : 'Produk Pengecoran';

  useEffect(() => {
    if (singleMoldFillLevel >= 0.98 && !isSingleMoldCooling && !isSingleMoldSolid) {
      setSingleMoldState({ isCooling: true });
      inductionAudio.playSuccess();
      const timer = setTimeout(() => {
        setSingleMoldState({ isCooling: false, isSolid: true });
        inductionAudio.playFanfare();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [singleMoldFillLevel, isSingleMoldCooling, isSingleMoldSolid, setSingleMoldState]);

  useFrame((_, delta) => {
    // Animate Cope (Top flask) lifting up when solid
    if (copeRef.current) {
      const targetY = isSingleMoldSolid ? 2.5 : 0.44;
      copeRef.current.position.y = THREE.MathUtils.lerp(copeRef.current.position.y, targetY, delta * 2.0);
    }

    // Dynamic molten pool fill in pouring basin
    if (moltenPoolRef.current) {
      if ((singleMoldFillLevel > 0.005 || isLadlePouringToMold) && !isSingleMoldSolid) {
        moltenPoolRef.current.visible = true;
        moltenPoolRef.current.position.y = -0.15 + Math.max(0.04, singleMoldFillLevel) * 0.24;
        const sc = 0.52 + singleMoldFillLevel * 0.48;
        moltenPoolRef.current.scale.set(sc, sc, 1);
      } else {
        moltenPoolRef.current.visible = false;
      }
    }

    // Dynamic molten pool fill in riser
    if (riserPoolRef.current) {
      if (singleMoldFillLevel > 0.15 && !isSingleMoldSolid) {
        riserPoolRef.current.visible = true;
        riserPoolRef.current.position.y = -0.14 + (singleMoldFillLevel - 0.15) * 0.23;
        const sc = 0.70 + (singleMoldFillLevel - 0.15) * 0.30;
        riserPoolRef.current.scale.set(sc, sc, 1);
      } else {
        riserPoolRef.current.visible = false;
      }
    }

    // Dynamic molten pool in pig mold
    if (pigMoltenPoolRef.current) {
      if (pigMoldFillLevel > 0.01) {
        pigMoltenPoolRef.current.visible = true;
        pigMoltenPoolRef.current.scale.y = Math.min(1.0, pigMoldFillLevel);
      } else {
        pigMoltenPoolRef.current.visible = false;
      }
    }

    // Incandescent glow light
    if (moldLightRef.current) {
      if (singleMoldFillLevel > 0.01 && !isSingleMoldSolid) {
        moldLightRef.current.visible = true;
        moldLightRef.current.intensity = 0.5 + singleMoldFillLevel * 1.8 + (isLadlePouringToMold ? 1.0 : 0);
      } else {
        moldLightRef.current.visible = false;
      }
    }

    // Finished casting metal emissive cool-down
    if (solidObjectRef.current) {
      if (isSingleMoldSolid) {
        solidObjectRef.current.visible = true;
        solidObjectRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat.emissive && mat.emissiveIntensity !== undefined) {
              mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0.02, delta * 0.35);
            }
          }
        });
      } else {
        solidObjectRef.current.visible = false;
      }
    }

    if (moldScanRingRef.current) {
      const t = performance.now() * 0.001;
      const isScanning = activeInspectionScanPoint === 'mold';
      const s = isScanning ? 0.65 + ((t * 1.8) % 0.7) : 1.0 + Math.sin(t * 5.0) * 0.1;
      moldScanRingRef.current.scale.set(s, s, 1);
    }
  });

  const flaskIronMat = { color: '#27272a', metalness: 0.75, roughness: 0.35 };
  const sandMat = { color: '#453a2e', roughness: 0.95, metalness: 0.05 };
  const pigIronMat = { color: '#3f3f46', metalness: 0.6, roughness: 0.5 };
  const castSteelMat = { color: isFC ? '#64748b' : '#475569', metalness: 0.85, roughness: 0.3 };

  return (
    <group name="ENV_SingleSandMold" position={position} rotation={rotation}>
      {/* 1. Floor Marking & Demarcation Line */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 2.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      {[-1.1, 1.1].map((sx, i) => (
        <mesh key={`yellow-x-${i}`} position={[sx, 0.008, 0]}>
          <boxGeometry args={[0.08, 0.005, 2.2]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
        </mesh>
      ))}
      {[-1.1, 1.1].map((sz, i) => (
        <mesh key={`yellow-z-${i}`} position={[0, 0.008, sz]}>
          <boxGeometry args={[2.2, 0.005, 0.08]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
        </mesh>
      ))}

      {/* 2. Main Single Sand Mold Box (Drag / Lower Flask) */}
      <group
        position={[0, 0.15, 0]}
        onClick={(e) => {
          e.stopPropagation();
          trigger3DInspectionScan('mold');
        }}
      >
        <mesh>
          <boxGeometry args={[1.80, 0.28, 1.60]} />
          <meshStandardMaterial {...flaskIronMat} />
        </mesh>
        {/* Sand core surface */}
        <mesh position={[0, 0.141, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.68, 1.48]} />
          <meshStandardMaterial {...sandMat} />
        </mesh>

        {/* Clamping lugs and alignment pins */}
        {[-0.85, 0.85].map((px, pi) =>
          [-0.70, 0.70].map((pz, pj) => (
            <mesh key={`pin-${pi}-${pj}`} position={[px, 0.08, pz]}>
              <cylinderGeometry args={[0.035, 0.035, 0.24, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
          ))
        )}

        {/* 3D Title Plate on Front Face of Mold */}
        <group position={[0, 0, 0.81]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.40, 0.12, 0.02]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
          </mesh>
          <Text
            position={[0, 0.015, 0.015]}
            fontSize={0.045}
            color={isInspectionMoldDone ? '#22c55e' : '#f59e0b'}
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            {moldTitle}
          </Text>
          <Text
            position={[0, -0.03, 0.015]}
            fontSize={0.03}
            color="#cbd5e1"
            anchorX="center"
            anchorY="middle"
          >
            {isInspectionMoldDone ? '[ TERVERIFIKASI SIAP TUANG ]' : '[ KLIK UNTUK INSPEKSI KESIAPAN ]'}
          </Text>
        </group>
      </group>

      {/* 3. Lifting Cope (Upper Flask with Pouring Basin & Riser) */}
      <group ref={copeRef} position={[0, 0.44, 0]}>
        <mesh>
          <boxGeometry args={[1.80, 0.28, 1.60]} />
          <meshStandardMaterial {...flaskIronMat} />
        </mesh>
        {/* Top sand surface */}
        <mesh position={[0, 0.141, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.68, 1.48]} />
          <meshStandardMaterial {...sandMat} />
        </mesh>

        {/* Pouring Basin (Cawan Tuang) */}
        <group position={[-0.45, 0.14, 0]}>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.22, 0.16, 0.10, 24]} />
            <meshStandardMaterial {...sandMat} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.12, 0.07, 0.26, 24]} />
            <meshStandardMaterial color="#26221d" roughness={0.95} />
          </mesh>
          {/* Molten Liquid Level in Basin */}
          <mesh ref={moltenPoolRef} visible={false} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.15, 24]} />
            <meshStandardMaterial
              color="#fb923c"
              emissive="#ea580c"
              emissiveIntensity={3.2}
              roughness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text position={[0, 0.14, 0]} fontSize={0.04} color="#f8fafc" fontWeight="bold">
            CAWAN TUANG
          </Text>
        </group>

        {/* Riser / Feeder (Penambah) */}
        <group position={[0.45, 0.14, 0]}>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.18, 0.14, 0.10, 24]} />
            <meshStandardMaterial {...sandMat} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.10, 0.08, 0.26, 24]} />
            <meshStandardMaterial color="#26221d" roughness={0.95} />
          </mesh>
          {/* Molten Liquid Level in Riser */}
          <mesh ref={riserPoolRef} visible={false} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.12, 24]} />
            <meshStandardMaterial
              color="#fb923c"
              emissive="#ea580c"
              emissiveIntensity={2.8}
              roughness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text position={[0, 0.14, 0]} fontSize={0.04} color="#f8fafc" fontWeight="bold">
            RISER
          </Text>
        </group>

        {/* Interactive 3D Inspection Reticle Hotspot on Top of Sand Mold (Titik 4) */}
        {(!isInspectionMoldDone || activeInspectionScanPoint === 'mold') && !isSingleMoldSolid && (
          <group
            position={[0, 0.24, 0]}
            onClick={(e) => {
              e.stopPropagation();
              trigger3DInspectionScan('mold');
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
              useSimStore
                .getState()
                .setActiveHoverObject('Titik 4: Kesiapan Cetakan Pasir Tunggal (Klik Pindai)');
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
              useSimStore.getState().setActiveHoverObject(null);
            }}
          >
            <mesh ref={moldScanRingRef} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.16, 0.21, 28]} />
              <meshBasicMaterial
                color={
                  isInspectionMoldDone
                    ? '#22c55e'
                    : activeInspectionScanPoint === 'mold'
                    ? '#38bdf8'
                    : '#facc15'
                }
                side={THREE.DoubleSide}
              />
            </mesh>
            {activeInspectionScanPoint === 'mold' && (
              <mesh position={[0, 0.20, 0]}>
                <cylinderGeometry args={[0.04, 0.24, 0.40, 20, 1, true]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} side={THREE.DoubleSide} />
              </mesh>
            )}
            <Text
              position={[0, 0.16, 0]}
              fontSize={0.042}
              color={isInspectionMoldDone ? '#4ade80' : '#fef08a'}
              anchorX="center"
              fontWeight="bold"
            >
              {isInspectionMoldDone
                ? '✓ 4. CETAKAN PASIR: SIAP TUANG'
                : activeInspectionScanPoint === 'mold'
                ? 'MEMINDAI RONGGA & CAWAN TUANG...'
                : '[4] KLIK PINDAI CETAKAN PASIR'}
            </Text>
          </group>
        )}
      </group>

      {/* 4. Finished Solid Cast Product (Visible when solid after cope lifts) */}
      <group ref={solidObjectRef} visible={false} position={[0, 0.22, 0]}>
        {isFC ? (
          /* PRODUK CORAN A: IMPELLER POMPA SENTRIFUGAL (FC 250) */
          <group>
            {/* Center Boss / Hub */}
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.12, 0.14, 0.24, 32]} />
              <meshStandardMaterial {...castSteelMat} emissive="#f97316" emissiveIntensity={0.5} />
            </mesh>
            {/* Shaft Bore */}
            <mesh position={[0, 0.13, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.26, 24]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* Back Shroud Disc */}
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.55, 0.55, 0.04, 36]} />
              <meshStandardMaterial {...castSteelMat} emissive="#f97316" emissiveIntensity={0.5} />
            </mesh>
            {/* 6 Curved Impeller Vanes */}
            {[...Array(6)].map((_, vi) => {
              const ang = (vi * Math.PI) / 3;
              return (
                <group key={`vane-${vi}`} rotation={[0, ang, 0]}>
                  <mesh position={[0.30, 0.09, 0.05]} rotation={[0, 0.35, 0]}>
                    <boxGeometry args={[0.35, 0.14, 0.025]} />
                    <meshStandardMaterial {...castSteelMat} emissive="#f97316" emissiveIntensity={0.5} />
                  </mesh>
                </group>
              );
            })}
            {/* Front Shroud Ring */}
            <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.42, 0.035, 16, 36]} />
              <meshStandardMaterial {...castSteelMat} emissive="#f97316" emissiveIntensity={0.5} />
            </mesh>
          </group>
        ) : (
          /* PRODUK CORAN B: RODA GIGI TRANSMISI (FCD 500) */
          <group>
            {/* Gear Hub */}
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.24, 32]} />
              <meshStandardMaterial {...castSteelMat} emissive="#f97316" emissiveIntensity={0.5} />
            </mesh>
            {/* Keyway center hole */}
            <mesh position={[0, 0.13, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.26, 24]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* Gear Web Disc */}
            <mesh position={[0, 0.10, 0]}>
              <cylinderGeometry args={[0.50, 0.50, 0.08, 36]} />
              <meshStandardMaterial {...castSteelMat} emissive="#f97316" emissiveIntensity={0.5} />
            </mesh>
            {/* Outer Rim */}
            <mesh position={[0, 0.10, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.54, 0.05, 16, 40]} />
              <meshStandardMaterial {...castSteelMat} emissive="#f97316" emissiveIntensity={0.5} />
            </mesh>
            {/* 16 External Gear Teeth */}
            {[...Array(16)].map((_, ti) => {
              const ang = (ti * Math.PI) / 8;
              return (
                <mesh
                  key={`gear-tooth-${ti}`}
                  position={[Math.cos(ang) * 0.58, 0.10, Math.sin(ang) * 0.58]}
                  rotation={[0, -ang, 0]}
                >
                  <boxGeometry args={[0.07, 0.18, 0.045]} />
                  <meshStandardMaterial {...castSteelMat} emissive="#f97316" emissiveIntensity={0.5} />
                </mesh>
              );
            })}
          </group>
        )}

        {/* Product Inspection Label */}
        <Text
          position={[0, 0.45, 0]}
          fontSize={0.06}
          color="#38bdf8"
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          {productTitle}
        </Text>
      </group>

      {/* 5. Incandescent Molten Light */}
      <pointLight
        ref={moldLightRef}
        position={[0, 0.45, 0]}
        color="#fb923c"
        distance={2.5}
        decay={2}
        intensity={0}
      />

      {/* 6. Pig Mold (Cetakan Sisa Tuang Logam) Beside Single Sand Mold */}
      <group position={[0, 0, -1.8]}>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.90, 0.16, 0.60]} />
          <meshStandardMaterial {...pigIronMat} />
        </mesh>
        {/* Cavity */}
        <mesh position={[0, 0.10, 0]}>
          <boxGeometry args={[0.74, 0.12, 0.44]} />
          <meshStandardMaterial color="#18181b" />
        </mesh>
        {/* Pig Mold Liquid */}
        <mesh
          ref={pigMoltenPoolRef}
          visible={false}
          position={[0, 0.11, 0]}
          scale={[1, 0.01, 1]}
        >
          <boxGeometry args={[0.72, 0.08, 0.42]} />
          <meshStandardMaterial
            color="#fb923c"
            emissive="#ea580c"
            emissiveIntensity={1.8}
            roughness={0.3}
          />
        </mesh>
        <Text
          position={[0, 0.22, 0]}
          fontSize={0.035}
          color="#cbd5e1"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          PIG MOLD (SISA LOGAM)
        </Text>
      </group>
    </group>
  );
};

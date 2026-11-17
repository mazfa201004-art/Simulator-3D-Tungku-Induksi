import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

interface WallUtilitySwitchBoxesProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * WallUtilitySwitchBoxes: Stasiun 3 Box Saklar Utilitas Dinding (Di Sebelah Kanan Rak APD)
 * - Ditempatkan menempel 100% rapat (flush) pada Dinding Belakang Bengkel (Z = -12.0m).
 * - Berjarak ~1.10 meter di sebelah kanan Rak APD (X = -10.90m, batas kanan rak = -10.15m)
 *   sehingga rapi dan tidak terlalu menempel dengan Rak APD.
 * - Terdiri dari 3 Box Saklar Bertuas sesuai Storyboard Babak 02 & Babak 06:
 *   1. Box Tuas Saklar Cooling Tower (X = -8.85m) -> Adegan 2.2 & 6.4
 *   2. Box Tuas Saklar Pompa Sistem Cooling + Manometer Air 0-5 Bar (X = -7.85m) -> Adegan 2.3 & 6.5 (Tunggu 5 Jam)
 *   3. Box Panel Breaker Listrik Utama 380V R-S-T (MCCB) (X = -6.85m) -> Adegan 2.1 & 6.4
 */
export const WallUtilitySwitchBoxes: React.FC<WallUtilitySwitchBoxesProps> = ({
  position = [0, 0, -11.93],
  rotation = [0, 0, 0],
}) => {
  const coolingTowerSwitchOn = useSimStore((s) => s.coolingTowerSwitchOn);
  const setCoolingTowerSwitch = useSimStore((s) => s.setCoolingTowerSwitch);

  const coolingPumpSwitchOn = useSimStore((s) => s.coolingPumpSwitchOn);
  const setCoolingPumpSwitch = useSimStore((s) => s.setCoolingPumpSwitch);
  const waterPressureBar = useSimStore((s) => s.waterPressureBar);

  const panelBreakerOn = useSimStore((s) => s.panelBreakerOn);
  const setPanelBreaker = useSimStore((s) => s.setPanelBreaker);

  const setActiveHoverObject = useSimStore((s) => s.setActiveHoverObject);

  const [hoveredBox, setHoveredBox] = useState<'tower' | 'pump' | 'breaker' | null>(null);

  const towerLeverRef = useRef<THREE.Group>(null);
  const pumpLeverRef = useRef<THREE.Group>(null);
  const breakerLeverRef = useRef<THREE.Group>(null);
  const gaugeNeedleRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    // 1. Animate Cooling Tower Lever: ON = Up (0.05 rad), OFF = Down (+0.82 rad forward)
    if (towerLeverRef.current) {
      const targetRotX = coolingTowerSwitchOn ? 0.05 : 0.82;
      towerLeverRef.current.rotation.x = THREE.MathUtils.lerp(
        towerLeverRef.current.rotation.x,
        targetRotX,
        delta * 10.0
      );
    }

    // 2. Animate Cooling Pump Lever: ON = Up (0.05 rad), OFF = Down (+0.82 rad forward)
    if (pumpLeverRef.current) {
      const targetRotX = coolingPumpSwitchOn ? 0.05 : 0.82;
      pumpLeverRef.current.rotation.x = THREE.MathUtils.lerp(
        pumpLeverRef.current.rotation.x,
        targetRotX,
        delta * 10.0
      );
    }

    // 3. Animate Main Breaker MCCB Handle: ON = Up (0.05 rad), OFF = Down (+0.70 rad forward)
    if (breakerLeverRef.current) {
      const targetRotX = panelBreakerOn ? 0.05 : 0.70;
      breakerLeverRef.current.rotation.x = THREE.MathUtils.lerp(
        breakerLeverRef.current.rotation.x,
        targetRotX,
        delta * 10.0
      );
    }

    // 4. Animate Water Pressure Manometer Needle (0 Bar = +2.1 rad, 5 Bar = -2.1 rad)
    if (gaugeNeedleRef.current) {
      const clampedBar = Math.max(0, Math.min(5.0, waterPressureBar));
      const targetNeedleZ = 2.1 - (clampedBar / 5.0) * 4.2;
      gaugeNeedleRef.current.rotation.z = THREE.MathUtils.lerp(
        gaugeNeedleRef.current.rotation.z,
        targetNeedleZ,
        delta * 6.0
      );
    }
  });

  const handleHover = (e: any, box: 'tower' | 'pump' | 'breaker' | null, label: string | null) => {
    e.stopPropagation();
    setHoveredBox(box);
    setActiveHoverObject(label);
    if (typeof document !== 'undefined') {
      document.body.style.cursor = box ? 'pointer' : 'auto';
    }
  };

  const boxSteelMat = { color: '#1e293b', roughness: 0.45, metalness: 0.65 };
  const doorSteelMat = { color: '#334155', roughness: 0.4, metalness: 0.6 };
  const conduitMat = { color: '#64748b', roughness: 0.35, metalness: 0.8 };

  return (
    <group position={position} rotation={rotation} name="Prop_WallUtilitySwitchBoxes">
      {/* ========================================================================= */}
      {/* FLOOR SAFETY DEMARCATION ZONE IN FRONT OF UTILITY SWITCH BOXES            */}
      {/* ========================================================================= */}
      <group position={[-7.85, 0.004, 0.55]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.10, 1.15]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
        {/* Front Yellow Hazard Line */}
        <mesh position={[0, 0.002, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.10, 0.07]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
        <Text
          position={[0, 0.004, 0.38]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.052}
          color="#38bdf8"
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          AREA PANEL SAKLAR UTILITAS &amp; COOLING SYSTEM
        </Text>
      </group>

      {/* ========================================================================= */}
      {/* BOX 1: BOX TUAS SAKLAR COOLING TOWER (X = -8.85m, Sebelah Kanan Rak APD)  */}
      {/* Jarak aman ~1.05m dari tepi kanan Rak APD (X = -10.15m)                   */}
      {/* ========================================================================= */}
      <group
        position={[-8.85, 1.38, 0]}
        onClick={(e) => {
          e.stopPropagation();
          inductionAudio.resume();
          setCoolingTowerSwitch(!coolingTowerSwitchOn);
        }}
        onPointerOver={(e) =>
          handleHover(
            e,
            'tower',
            coolingTowerSwitchOn
              ? 'Box Tuas Saklar Cooling Tower [ON] (Klik untuk Turunkan Tuas ke OFF)'
              : 'Box Tuas Saklar Cooling Tower [OFF] (Klik untuk Naikkan Tuas ke ON)'
          )
        }
        onPointerOut={(e) => handleHover(e, null, null)}
      >
        {/* Top Conduit Pipe going up the wall */}
        <mesh position={[0, 0.48, -0.02]}>
          <cylinderGeometry args={[0.022, 0.022, 0.45, 12]} />
          <meshStandardMaterial {...conduitMat} />
        </mesh>

        {/* Wall Mounting Backplate Flange */}
        <mesh position={[0, 0, -0.055]}>
          <boxGeometry args={[0.54, 0.64, 0.015]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>

        {/* Main Steel Switch Box Enclosure */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.46, 0.56, 0.12]} />
          <meshStandardMaterial
            color={hoveredBox === 'tower' ? '#334155' : boxSteelMat.color}
            roughness={0.45}
            metalness={0.65}
          />
        </mesh>

        {/* Front Recessed Door Panel */}
        <mesh position={[0, 0, 0.062]}>
          <boxGeometry args={[0.40, 0.50, 0.015]} />
          <meshStandardMaterial {...doorSteelMat} />
        </mesh>

        {/* Header Sign Plate on Box */}
        <mesh position={[0, 0.17, 0.072]}>
          <planeGeometry args={[0.36, 0.09]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
        <Text
          position={[0, 0.185, 0.075]}
          fontSize={0.026}
          color="#ffffff"
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          SAKLAR COOLING TOWER
        </Text>
        <Text
          position={[0, 0.148, 0.075]}
          fontSize={0.019}
          color="#e0f2fe"
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          ADEGAN 2.2 • TUAS UTAMA
        </Text>

        {/* Status Pilot Lamp (Green ON / Red OFF) */}
        <group position={[-0.10, 0.02, 0.072]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.026, 0.026, 0.018, 16]} />
            <meshStandardMaterial
              color={coolingTowerSwitchOn ? '#22c55e' : '#ef4444'}
              emissive={coolingTowerSwitchOn ? '#22c55e' : '#ef4444'}
              emissiveIntensity={coolingTowerSwitchOn ? 2.4 : 1.0}
            />
          </mesh>
          <Text
            position={[0, -0.045, 0.005]}
            fontSize={0.020}
            color={coolingTowerSwitchOn ? '#4ade80' : '#fca5a5'}
            fontWeight="bold"
            anchorX="center"
          >
            {coolingTowerSwitchOn ? 'TOWER ON' : 'TOWER OFF'}
          </Text>
        </group>

        {/* ON / OFF Position Labels Next to Lever Slot */}
        <Text
          position={[0.08, 0.09, 0.075]}
          fontSize={0.022}
          color="#4ade80"
          fontWeight="bold"
          anchorX="center"
        >
          ▲ ON (NAIK)
        </Text>
        <Text
          position={[0.08, -0.11, 0.075]}
          fontSize={0.022}
          color="#f87171"
          fontWeight="bold"
          anchorX="center"
        >
          ▼ OFF (TURUN)
        </Text>

        {/* Heavy Industrial Knife / Cam Lever Mechanism */}
        <group position={[0.08, -0.01, 0.075]}>
          {/* Lever Pivot Housing Base */}
          <mesh>
            <boxGeometry args={[0.08, 0.12, 0.035]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Animated Lever Arm + Red Insulated Grip Handle */}
          <group ref={towerLeverRef} position={[0, -0.02, 0.020]} rotation={[0.82, 0, 0]}>
            {/* Pivot Hinge Pin */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.008, 0.008, 0.038, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Chrome Lever Shaft */}
            <mesh position={[0, 0.075, 0.01]}>
              <boxGeometry args={[0.022, 0.15, 0.018]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Red/Yellow Industrial Grip T-Handle */}
            <mesh position={[0, 0.15, 0.018]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.022, 0.022, 0.095, 14]} />
              <meshStandardMaterial
                color={coolingTowerSwitchOn ? '#22c55e' : '#eab308'}
                roughness={0.3}
              />
            </mesh>
          </group>
        </group>

        {/* Bottom Status Badge on Box */}
        <mesh position={[0, -0.19, 0.072]}>
          <planeGeometry args={[0.36, 0.065]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <Text
          position={[0, -0.19, 0.075]}
          fontSize={0.021}
          color={coolingTowerSwitchOn ? '#34d399' : '#fde047'}
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          {coolingTowerSwitchOn ? 'STATUS: TURBIN AKTIF' : 'KLIK UNTUK NAIKKAN TUAS'}
        </Text>
      </group>

      {/* ========================================================================= */}
      {/* BOX 2: BOX SAKLAR POMPA SISTEM COOLING + MANOMETER AIR (X = -7.85m)       */}
      {/* Sesuai Adegan 2.3 & Adegan 6.5 (Pompa Tetap Hidup ±5 Jam Saat Shutdown)   */}
      {/* ========================================================================= */}
      <group
        position={[-7.85, 1.38, 0]}
        onClick={(e) => {
          e.stopPropagation();
          inductionAudio.resume();
          setCoolingPumpSwitch(!coolingPumpSwitchOn);
        }}
        onPointerOver={(e) =>
          handleHover(
            e,
            'pump',
            coolingPumpSwitchOn
              ? `Box Tuas Pompa Cooling [ON • ${waterPressureBar.toFixed(1)} Bar] (Klik untuk Turunkan Tuas)`
              : 'Box Tuas Saklar Pompa Sistem Cooling & Manometer Air (Klik untuk Naikkan Tuas)'
          )
        }
        onPointerOut={(e) => handleHover(e, null, null)}
      >
        {/* Blue Cooling Water Pipe Manifold Running Vertically Beside the Box */}
        <mesh position={[0.29, 0.0, -0.01]}>
          <cylinderGeometry args={[0.026, 0.026, 0.85, 14]} />
          <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.35} />
        </mesh>

        {/* 3D WATER PRESSURE MANOMETER GAUGE (0 - 5 BAR) Mounted on Top of Box/Pipe */}
        <group position={[0.0, 0.43, 0.02]}>
          {/* Brass Stem Connector */}
          <mesh position={[0, -0.11, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.06, 12]} />
            <meshStandardMaterial color="#ca8a04" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Stainless Gauge Casing */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.045, 24]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* White Gauge Dial Face */}
          <mesh position={[0, 0, 0.024]}>
            <circleGeometry args={[0.096, 24]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
          {/* Red Danger Arc (< 2.5 Bar, Left Half) */}
          <mesh position={[0, 0, 0.025]} rotation={[0, 0, Math.PI * 0.5]}>
            <ringGeometry args={[0.072, 0.088, 16, 1, 0, Math.PI * 0.75]} />
            <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
          </mesh>
          {/* Green Safe Arc (>= 2.5 Bar, Right Half) */}
          <mesh position={[0, 0, 0.025]} rotation={[0, 0, -Math.PI * 0.25]}>
            <ringGeometry args={[0.072, 0.088, 16, 1, 0, Math.PI * 0.75]} />
            <meshBasicMaterial color="#22c55e" side={THREE.DoubleSide} />
          </mesh>
          <Text
            position={[0, 0.036, 0.027]}
            fontSize={0.019}
            color="#0f172a"
            fontWeight="bold"
            anchorX="center"
          >
            MANOMETER AIR
          </Text>
          <Text
            position={[0, -0.045, 0.027]}
            fontSize={0.022}
            color={waterPressureBar >= 2.5 ? '#15803d' : '#b91c1c'}
            fontWeight="bold"
            anchorX="center"
          >
            {waterPressureBar.toFixed(1)} BAR
          </Text>
          {/* Rotating Red Pressure Needle */}
          <group ref={gaugeNeedleRef} position={[0, 0, 0.028]} rotation={[0, 0, 2.1]}>
            <mesh position={[0, 0.035, 0]}>
              <boxGeometry args={[0.007, 0.072, 0.002]} />
              <meshBasicMaterial color="#dc2626" />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.006, 12]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
          </group>
        </group>

        {/* Wall Mounting Backplate */}
        <mesh position={[0, 0, -0.055]}>
          <boxGeometry args={[0.54, 0.64, 0.015]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>

        {/* Main Steel Switch Box Enclosure */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.46, 0.56, 0.12]} />
          <meshStandardMaterial
            color={hoveredBox === 'pump' ? '#334155' : boxSteelMat.color}
            roughness={0.45}
            metalness={0.65}
          />
        </mesh>

        {/* Front Recessed Door Panel */}
        <mesh position={[0, 0, 0.062]}>
          <boxGeometry args={[0.40, 0.50, 0.015]} />
          <meshStandardMaterial {...doorSteelMat} />
        </mesh>

        {/* Header Sign Plate on Box */}
        <mesh position={[0, 0.17, 0.072]}>
          <planeGeometry args={[0.36, 0.09]} />
          <meshBasicMaterial color="#0d9488" />
        </mesh>
        <Text
          position={[0, 0.185, 0.075]}
          fontSize={0.025}
          color="#ffffff"
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          POMPA SISTEM COOLING
        </Text>
        <Text
          position={[0, 0.148, 0.075]}
          fontSize={0.018}
          color="#ccfbf1"
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          ADEGAN 2.3 &amp; 6.5 (WAJIB &gt;= 2.5 BAR)
        </Text>

        {/* Status Pilot Lamp */}
        <group position={[-0.10, 0.02, 0.072]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.026, 0.026, 0.018, 16]} />
            <meshStandardMaterial
              color={coolingPumpSwitchOn ? '#22c55e' : '#ef4444'}
              emissive={coolingPumpSwitchOn ? '#22c55e' : '#ef4444'}
              emissiveIntensity={coolingPumpSwitchOn ? 2.4 : 1.0}
            />
          </mesh>
          <Text
            position={[0, -0.045, 0.005]}
            fontSize={0.020}
            color={coolingPumpSwitchOn ? '#4ade80' : '#fca5a5'}
            fontWeight="bold"
            anchorX="center"
          >
            {coolingPumpSwitchOn ? 'POMPA ON' : 'POMPA OFF'}
          </Text>
        </group>

        {/* ON / OFF Position Labels */}
        <Text
          position={[0.08, 0.09, 0.075]}
          fontSize={0.022}
          color="#4ade80"
          fontWeight="bold"
          anchorX="center"
        >
          ▲ ON (NAIK)
        </Text>
        <Text
          position={[0.08, -0.11, 0.075]}
          fontSize={0.022}
          color="#f87171"
          fontWeight="bold"
          anchorX="center"
        >
          ▼ OFF (TURUN)
        </Text>

        {/* Heavy Industrial Lever Mechanism */}
        <group position={[0.08, -0.01, 0.075]}>
          <mesh>
            <boxGeometry args={[0.08, 0.12, 0.035]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          <group ref={pumpLeverRef} position={[0, -0.02, 0.020]} rotation={[0.82, 0, 0]}>
            {/* Pivot Hinge Pin */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.008, 0.008, 0.038, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.075, 0.01]}>
              <boxGeometry args={[0.022, 0.15, 0.018]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.15, 0.018]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.022, 0.022, 0.095, 14]} />
              <meshStandardMaterial
                color={coolingPumpSwitchOn ? '#22c55e' : '#38bdf8'}
                roughness={0.3}
              />
            </mesh>
          </group>
        </group>

        {/* Bottom Digital Pressure Readout Badge */}
        <mesh position={[0, -0.19, 0.072]}>
          <planeGeometry args={[0.36, 0.065]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <Text
          position={[0, -0.19, 0.075]}
          fontSize={0.021}
          color={waterPressureBar >= 2.5 ? '#4ade80' : '#f87171'}
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          {coolingPumpSwitchOn
            ? `TEKANAN AIR: ${waterPressureBar.toFixed(1)} BAR (AMAN)`
            : 'TEKANAN: 0.0 BAR (POMPA MATI)'}
        </Text>
      </group>

      {/* ========================================================================= */}
      {/* BOX 3: BOX PANEL BREAKER LISTRIK UTAMA 380V R-S-T (X = -6.85m)            */}
      {/* Sesuai Adegan 2.1 & Adegan 6.4 (MCCB Breaker Utama)                       */}
      {/* ========================================================================= */}
      <group
        position={[-6.85, 1.38, 0]}
        onClick={(e) => {
          e.stopPropagation();
          inductionAudio.resume();
          setPanelBreaker(!panelBreakerOn);
        }}
        onPointerOver={(e) =>
          handleHover(
            e,
            'breaker',
            panelBreakerOn
              ? 'Panel Breaker Listrik Utama 380V [ON] (Klik untuk Matikan Breaker)'
              : 'Panel Breaker Listrik Utama 380V [OFF] (Klik untuk Naikkan Tuas MCCB)'
          )
        }
        onPointerOut={(e) => handleHover(e, null, null)}
      >
        {/* Top Heavy 3-Phase Armored Cable Conduit */}
        <mesh position={[0, 0.50, -0.02]}>
          <cylinderGeometry args={[0.032, 0.032, 0.45, 12]} />
          <meshStandardMaterial {...conduitMat} />
        </mesh>

        {/* Wall Mounting Backplate */}
        <mesh position={[0, 0, -0.055]}>
          <boxGeometry args={[0.58, 0.68, 0.015]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>

        {/* Main Steel Breaker Panel Enclosure */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.50, 0.60, 0.13]} />
          <meshStandardMaterial
            color={hoveredBox === 'breaker' ? '#334155' : boxSteelMat.color}
            roughness={0.45}
            metalness={0.65}
          />
        </mesh>

        {/* Front Recessed Door Panel */}
        <mesh position={[0, 0, 0.068]}>
          <boxGeometry args={[0.44, 0.54, 0.015]} />
          <meshStandardMaterial {...doorSteelMat} />
        </mesh>

        {/* Header Sign Plate on Box */}
        <mesh position={[0, 0.19, 0.078]}>
          <planeGeometry args={[0.40, 0.09]} />
          <meshBasicMaterial color="#b45309" />
        </mesh>
        <Text
          position={[0, 0.205, 0.081]}
          fontSize={0.025}
          color="#ffffff"
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          PANEL BREAKER UTAMA
        </Text>
        <Text
          position={[0, 0.168, 0.081]}
          fontSize={0.018}
          color="#fef08a"
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          ADEGAN 2.1 • MCCB 380V 3-FASA
        </Text>

        {/* 3-Phase R - S - T Pilot Lamps (Red, Yellow, Green) */}
        {[
          { label: 'R', x: -0.12, activeColor: '#ef4444', offColor: '#450a0a' },
          { label: 'S', x: -0.05, activeColor: '#eab308', offColor: '#422006' },
          { label: 'T', x: 0.02, activeColor: '#22c55e', offColor: '#052e16' },
        ].map((phase) => (
          <group key={phase.label} position={[phase.x, 0.07, 0.078]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.015, 14]} />
              <meshStandardMaterial
                color={panelBreakerOn ? phase.activeColor : phase.offColor}
                emissive={panelBreakerOn ? phase.activeColor : '#000000'}
                emissiveIntensity={panelBreakerOn ? 2.5 : 0}
              />
            </mesh>
            <Text
              position={[0, -0.032, 0.005]}
              fontSize={0.018}
              color="#cbd5e1"
              fontWeight="bold"
              anchorX="center"
            >
              {phase.label}
            </Text>
          </group>
        ))}

        {/* MCCB Molded Case Circuit Breaker Toggle Handle */}
        <group position={[0.12, -0.02, 0.078]}>
          <mesh>
            <boxGeometry args={[0.11, 0.16, 0.03]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>
          <group ref={breakerLeverRef} position={[0, -0.015, 0.018]} rotation={[0.70, 0, 0]}>
            <mesh position={[0, 0.055, 0.012]}>
              <boxGeometry args={[0.045, 0.11, 0.025]} />
              <meshStandardMaterial
                color={panelBreakerOn ? '#dc2626' : '#facc15'}
                roughness={0.3}
              />
            </mesh>
          </group>
        </group>

        {/* Digital Voltmeter Readout */}
        <mesh position={[-0.08, -0.06, 0.078]}>
          <planeGeometry args={[0.18, 0.07]} />
          <meshBasicMaterial color="#020617" />
        </mesh>
        <Text
          position={[-0.08, -0.06, 0.081]}
          fontSize={0.026}
          color={panelBreakerOn ? '#4ade80' : '#64748b'}
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          {panelBreakerOn ? '380 V' : '000 V'}
        </Text>

        {/* Bottom Status Badge */}
        <mesh position={[0, -0.20, 0.078]}>
          <planeGeometry args={[0.40, 0.065]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <Text
          position={[0, -0.20, 0.081]}
          fontSize={0.021}
          color={panelBreakerOn ? '#4ade80' : '#fde047'}
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          {panelBreakerOn ? 'SUPLAI 380V AKTIF (ON)' : 'KLIK NAIKKAN BREAKER (OFF)'}
        </Text>
      </group>
    </group>
  );
};

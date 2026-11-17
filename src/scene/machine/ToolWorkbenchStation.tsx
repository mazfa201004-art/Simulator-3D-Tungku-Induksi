import React, { useState } from 'react';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

interface ToolWorkbenchStationProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Heavy-duty Industrial Free-Standing Tool Pegboard Stand (Panel Gantungan Perkakas & Ember Koagulan).
 * Located beside the access stairs next to the pouring ladle station.
 *
 * Features:
 * 1. Free-standing tubular steel pegboard frame from floor to top (no horizontal table).
 * 2. 3 vertical tool hangers on the pegboard:
 *    - Hook 1 (Left, x = -0.32): CYY-W330B Immersion Pyrometer Lance
 *    - Hook 2 (Middle, x = 0.0): Long-handled Coagulant Shovel (Skop Koagulan)
 *    - Hook 3 (Right, x = +0.32): Heavy Deslagging Skimmer Rake (Serokan Terak)
 * 3. Bidirectional interactive hanging:
 *    - Click tool to take / equip into hands.
 *    - Click empty hook on pegboard when holding tool to return / hang it back.
 * 4. Drosan Coagulant powder bucket positioned on the floor to the RIGHT of the pegboard.
 */
export const ToolWorkbenchStation: React.FC<ToolWorkbenchStationProps> = ({
  position = [2.65, 0, -0.22],
  rotation = [0, Math.PI / 2, 0],
}) => {
  const isLite = useSimStore((s) => s.performanceProfile === 'lite');
  const heldTool = useSimStore((s) => s.heldTool);
  const setHeldTool = useSimStore((s) => s.setHeldTool);
  const returnLanceToRack = useSimStore((s) => s.returnLanceToRack);
  const isLanceHeld = useSimStore((s) => s.isLanceHeld);
  const setCoagulantModalOpen = useSimStore((s) => s.setCoagulantModalOpen);
  const setActiveHoverObject = useSimStore((s) => s.setActiveHoverObject);
  const isShovelFilled = useSimStore((s) => s.isShovelFilled);
  const coagulantDoseKg = useSimStore((s) => s.coagulantDoseKg);

  const [hoveredObject, setHoveredObject] = useState<string | null>(null);

  // Stand dimensions
  const standWidth = 1.15;
  const standHeight = 1.85;
  const postProfile = 0.04;
  const hookY = 1.42;

  return (
    <group position={position} rotation={rotation} name="ToolWorkbenchStation">
      {/* ===================================================================== */}
      {/* 1. HEAVY INDUSTRIAL FREE-STANDING PEGBOARD STAND FRAME                */}
      {/* ===================================================================== */}
      {/* Left Vertical Post */}
      <mesh position={[-standWidth / 2 + postProfile / 2, standHeight / 2, 0]}>
        <boxGeometry args={[postProfile, standHeight, postProfile]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Right Vertical Post */}
      <mesh position={[standWidth / 2 - postProfile / 2, standHeight / 2, 0]}>
        <boxGeometry args={[postProfile, standHeight, postProfile]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Left Floor Stabilizer Leg (H/T Base) */}
      <group position={[-standWidth / 2 + postProfile / 2, 0.02, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.06, 0.04, 0.50]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.35} />
        </mesh>
        {/* Rubber End Caps */}
        <mesh position={[0, 0, -0.24]}>
          <boxGeometry args={[0.064, 0.042, 0.04]} />
          <meshStandardMaterial color="#020617" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.24]}>
          <boxGeometry args={[0.064, 0.042, 0.04]} />
          <meshStandardMaterial color="#020617" roughness={0.8} />
        </mesh>
        {/* Gusset Plate */}
        <mesh position={[0, 0.06, 0.06]} rotation={[Math.PI / 4, 0, 0]}>
          <boxGeometry args={[0.015, 0.10, 0.08]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
      </group>

      {/* Right Floor Stabilizer Leg (H/T Base) */}
      <group position={[standWidth / 2 - postProfile / 2, 0.02, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.06, 0.04, 0.50]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.35} />
        </mesh>
        {/* Rubber End Caps */}
        <mesh position={[0, 0, -0.24]}>
          <boxGeometry args={[0.064, 0.042, 0.04]} />
          <meshStandardMaterial color="#020617" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.24]}>
          <boxGeometry args={[0.064, 0.042, 0.04]} />
          <meshStandardMaterial color="#020617" roughness={0.8} />
        </mesh>
        {/* Gusset Plate */}
        <mesh position={[0, 0.06, 0.06]} rotation={[Math.PI / 4, 0, 0]}>
          <boxGeometry args={[0.015, 0.10, 0.08]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
      </group>

      {/* Top Crossbeam */}
      <mesh position={[0, standHeight - postProfile / 2, 0]}>
        <boxGeometry args={[standWidth, postProfile, postProfile]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Bottom Crossbeam */}
      <mesh position={[0, 0.20, 0]}>
        <boxGeometry args={[standWidth, postProfile, postProfile]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Main Pegboard Backplate Panel */}
      <mesh position={[0, 1.01, 0]}>
        <boxGeometry args={[standWidth - 0.02, 1.58, 0.016]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.45} />
      </mesh>

      {/* Pegboard Perforated Texture Strips / Slots */}
      {[-0.55, -0.35, -0.15, 0.05, 0.25, 0.45].map((rowY, ri) => (
        <mesh key={`peg-strip-${ri}`} position={[0, 1.01 + rowY, 0.009]}>
          <planeGeometry args={[standWidth - 0.10, 0.014]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
      ))}

      {/* Top Identification Signboard */}
      <group position={[0, 1.73, 0.012]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[standWidth - 0.08, 0.14, 0.008]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* Safety Yellow Hazard Accent Strip */}
        <mesh position={[0, -0.065, 0.005]}>
          <boxGeometry args={[standWidth - 0.08, 0.008, 0.004]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
        <Text
          position={[0, 0.025, 0.01]}
          fontSize={0.032}
          color="#38bdf8"
          anchorX="center"
          fontWeight="bold"
        >
          PANEL GANTUNGAN PERKAKAS & KOAGULAN (K3)
        </Text>
        <Text
          position={[0, -0.025, 0.01]}
          fontSize={0.016}
          color="#94a3b8"
          anchorX="center"
        >
          KLIK ALAT UNTUK MENGAMBIL • KLIK HOOK UNTUK MENGGANTUNG
        </Text>
      </group>

      {/* ===================================================================== */}
      {/* 2. EMBER / DRUM KOAGULAN DROSAN DI SEBELAH KANAN PEGBOARD STAND       */}
      {/* Positioned at local +X: right side of the stand                       */}
      {/* ===================================================================== */}
      <group
        position={[standWidth / 2 + 0.28, 0, 0.05]}
        onClick={(e) => {
          e.stopPropagation();
          inductionAudio.resume();
          inductionAudio.playClick();
          // Equips shovel and opens coagulant dose dialog
          setHeldTool('shovel');
          setCoagulantModalOpen(true);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredObject('bucket');
          setActiveHoverObject('Ember Koagulan Drosan (Klik untuk Mengambil & Menentukan Takaran KG)');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredObject(null);
          setActiveHoverObject(null);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Bucket Outer Conical Body */}
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.18, 0.14, 0.44, isLite ? 16 : 24]} />
          <meshStandardMaterial
            color={hoveredObject === 'bucket' ? '#0284c7' : '#0369a1'}
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>

        {/* Bucket Bottom Steel Rim */}
        <mesh position={[0, 0.015, 0]}>
          <cylinderGeometry args={[0.145, 0.145, 0.03, isLite ? 12 : 20]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>

        {/* Bucket Top Reinforced Lip */}
        <mesh position={[0, 0.43, 0]}>
          <cylinderGeometry args={[0.185, 0.185, 0.025, isLite ? 16 : 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>

        {/* Bucket Steel Wire Bail Handle */}
        <mesh position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.18, 0.008, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>

        {/* White Drosan Powder Surface inside Bucket */}
        <mesh position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.02, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.95} />
        </mesh>

        {/* Stencil Label on Bucket Body - Side A (Facing Right Workshop Aisle) */}
        <Text
          position={[0, 0.25, 0.182]}
          fontSize={0.032}
          color="#ffffff"
          anchorX="center"
          fontWeight="bold"
        >
          DROSAN
        </Text>
        <Text
          position={[0, 0.19, 0.182]}
          fontSize={0.020}
          color="#facc15"
          anchorX="center"
          fontWeight="bold"
        >
          KOAGULAN TERAK
        </Text>

        {/* Stencil Label on Bucket Body - Side B */}
        <Text
          position={[0.182, 0.25, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.032}
          color="#ffffff"
          anchorX="center"
          fontWeight="bold"
        >
          DROSAN
        </Text>
        <Text
          position={[0.182, 0.19, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.020}
          color="#facc15"
          anchorX="center"
          fontWeight="bold"
        >
          KOAGULAN TERAK
        </Text>
      </group>

      {/* ===================================================================== */}
      {/* 3. HOOK 1: GANTUNGAN TERMOMETER CELUP CYY-W330B (KIRI, x = -0.32)     */}
      {/* ===================================================================== */}
      <group
        position={[-0.32, hookY, 0.015]}
        onClick={(e) => {
          e.stopPropagation();
          inductionAudio.resume();
          inductionAudio.playClick();
          if (heldTool === 'lance' || isLanceHeld) {
            // Hang lance back on Hook 1
            returnLanceToRack();
          } else {
            // Pick up lance from Hook 1
            setHeldTool('lance');
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredObject('hook-lance');
          setActiveHoverObject(
            heldTool === 'lance' || isLanceHeld
              ? 'Hook Termometer (Klik untuk Gantungkan Kembali ke Stand)'
              : 'Termometer Celup CYY-W330B (Klik untuk Ambil dari Stand)'
          );
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredObject(null);
          setActiveHoverObject(null);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Steel Hook Mounting Backplate */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.08, 0.10, 0.01]} />
          <meshStandardMaterial
            color={
              hoveredObject === 'hook-lance'
                ? '#0284c7'
                : (heldTool === 'lance' || isLanceHeld)
                ? '#0369a1'
                : '#0f172a'
            }
            metalness={0.8}
            roughness={0.4}
          />
        </mesh>

        {/* Dual Forward Prongs Hook */}
        <mesh position={[-0.024, -0.01, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.09, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <mesh position={[0.024, -0.01, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.09, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        {/* Upward Hook Safety Tips */}
        <mesh position={[-0.024, 0.005, 0.09]}>
          <cylinderGeometry args={[0.007, 0.007, 0.03, 8]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.8} />
        </mesh>
        <mesh position={[0.024, 0.005, 0.09]}>
          <cylinderGeometry args={[0.007, 0.007, 0.03, 8]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.8} />
        </mesh>

        {/* Text Labels */}
        <Text
          position={[0, 0.08, 0.01]}
          fontSize={0.022}
          color="#38bdf8"
          anchorX="center"
          fontWeight="bold"
        >
          1. TERMOMETER
        </Text>
        <Text
          position={[0, 0.055, 0.01]}
          fontSize={0.014}
          color="#94a3b8"
          anchorX="center"
        >
          CYY-W330B
        </Text>
        <Text
          position={[0, -0.075, 0.01]}
          fontSize={0.015}
          color={heldTool === 'lance' || isLanceHeld ? '#facc15' : '#38bdf8'}
          anchorX="center"
          fontWeight="bold"
        >
          {heldTool === 'lance' || isLanceHeld ? '[KLIK GANTUNG]' : '[TERPASANG]'}
        </Text>
      </group>

      {/* ===================================================================== */}
      {/* 4. HOOK 2: GANTUNGAN SKOP KOAGULAN (TENGAH, x = 0.0)                  */}
      {/* ===================================================================== */}
      <group
        position={[0.0, hookY, 0.015]}
        onClick={(e) => {
          e.stopPropagation();
          inductionAudio.resume();
          inductionAudio.playClick();
          if (heldTool === 'shovel') {
            // Hang shovel back on Hook 2
            setHeldTool('none');
          } else {
            // Pick up shovel from Hook 2
            setHeldTool('shovel');
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredObject('hook-shovel');
          setActiveHoverObject(
            heldTool === 'shovel'
              ? 'Hook Skop (Klik untuk Gantungkan Kembali ke Stand)'
              : 'Skop Koagulan (Klik untuk Ambil dari Stand)'
          );
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredObject(null);
          setActiveHoverObject(null);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Steel Hook Mounting Backplate */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.08, 0.10, 0.01]} />
          <meshStandardMaterial
            color={
              hoveredObject === 'hook-shovel'
                ? '#f59e0b'
                : heldTool === 'shovel'
                ? '#b45309'
                : '#0f172a'
            }
            metalness={0.8}
            roughness={0.4}
          />
        </mesh>

        {/* Dual Forward Prongs Hook */}
        <mesh position={[-0.024, -0.01, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.09, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <mesh position={[0.024, -0.01, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.09, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        {/* Upward Hook Safety Tips */}
        <mesh position={[-0.024, 0.005, 0.09]}>
          <cylinderGeometry args={[0.007, 0.007, 0.03, 8]} />
          <meshStandardMaterial color="#facc15" metalness={0.8} />
        </mesh>
        <mesh position={[0.024, 0.005, 0.09]}>
          <cylinderGeometry args={[0.007, 0.007, 0.03, 8]} />
          <meshStandardMaterial color="#facc15" metalness={0.8} />
        </mesh>

        {/* Vertical Hanging Authentic Kamal KML Shovel Model (Visible when NOT held) */}
        {heldTool !== 'shovel' && (
          <group position={[0, -0.015, 0.05]}>
            {/* 1. D-Handle Grip (Dark Polymer D-Loop at Top, resting on Hook 2) */}
            <group position={[0, 0, 0]}>
              {/* Horizontal Top Handgrip Bar */}
              <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.013, 0.013, 0.12, 12]} />
                <meshStandardMaterial color="#1e293b" roughness={0.6} />
              </mesh>
              {/* Left Angled Side Arm */}
              <mesh position={[-0.045, -0.045, 0]} rotation={[0, 0, -Math.PI / 8]}>
                <cylinderGeometry args={[0.010, 0.010, 0.09, 8]} />
                <meshStandardMaterial color="#1e293b" roughness={0.6} />
              </mesh>
              {/* Right Angled Side Arm */}
              <mesh position={[0.045, -0.045, 0]} rotation={[0, 0, Math.PI / 8]}>
                <cylinderGeometry args={[0.010, 0.010, 0.09, 8]} />
                <meshStandardMaterial color="#1e293b" roughness={0.6} />
              </mesh>
              {/* D-Handle Neck Socket (joining to wood shaft) */}
              <mesh position={[0, -0.09, 0]}>
                <cylinderGeometry args={[0.017, 0.015, 0.04, 12]} />
                <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
              </mesh>
            </group>

            {/* 2. Round Wooden Shaft (Tangkai Kayu Alami) */}
            <mesh position={[0, -0.42, 0]}>
              <cylinderGeometry args={[0.014, 0.014, 0.62, 12]} />
              <meshStandardMaterial color="#b4793b" roughness={0.7} metalness={0.05} />
            </mesh>

            {/* 3. KAMAL KML Brand Sticker Label on Wooden Shaft */}
            <group position={[0, -0.28, 0]}>
              {/* Yellow & Red Sticker Base */}
              <mesh position={[0, 0, 0.015]}>
                <boxGeometry args={[0.034, 0.08, 0.003]} />
                <meshStandardMaterial color="#facc15" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0, 0.017]}>
                <boxGeometry args={[0.028, 0.04, 0.002]} />
                <meshStandardMaterial color="#dc2626" />
              </mesh>
              <Text
                position={[0, 0.012, 0.02]}
                fontSize={0.011}
                color="#ffffff"
                anchorX="center"
                fontWeight="bold"
              >
                KAMAL
              </Text>
              <Text
                position={[0, -0.008, 0.02]}
                fontSize={0.009}
                color="#facc15"
                anchorX="center"
                fontWeight="bold"
              >
                KML
              </Text>
            </group>

            {/* 4. Steel Ferrule / Neck Socket (Sambungan Leher Baja Hitam) */}
            <mesh position={[0, -0.74, 0.01]} rotation={[Math.PI / 18, 0, 0]}>
              <cylinderGeometry args={[0.017, 0.022, 0.12, 12]} />
              <meshStandardMaterial color="#1e242d" metalness={0.85} roughness={0.35} />
            </mesh>

            {/* 5. Authentic Square-Nosed Pressed Steel Shovel Scoop Blade (Daun Sekop Kotak) */}
            <group position={[0, -0.92, 0.03]} rotation={[Math.PI / 16, 0, 0]}>
              {/* Flat Center Base Plate */}
              <mesh position={[0, -0.08, 0]}>
                <boxGeometry args={[0.18, 0.006, 0.22]} />
                <meshStandardMaterial
                  color={hoveredObject === 'hook-shovel' ? '#475569' : '#1e242d'}
                  metalness={0.85}
                  roughness={0.35}
                />
              </mesh>

              {/* Left Flanged Up-Turned Lip */}
              <mesh position={[-0.092, -0.065, 0]} rotation={[0, 0, Math.PI / 12]}>
                <boxGeometry args={[0.006, 0.035, 0.22]} />
                <meshStandardMaterial color="#1e242d" metalness={0.85} roughness={0.35} />
              </mesh>

              {/* Right Flanged Up-Turned Lip */}
              <mesh position={[0.092, -0.065, 0]} rotation={[0, 0, -Math.PI / 12]}>
                <boxGeometry args={[0.006, 0.035, 0.22]} />
                <meshStandardMaterial color="#1e242d" metalness={0.85} roughness={0.35} />
              </mesh>

              {/* Rear Lip Wall */}
              <mesh position={[0, -0.065, -0.108]}>
                <boxGeometry args={[0.18, 0.035, 0.006]} />
                <meshStandardMaterial color="#1e242d" metalness={0.85} roughness={0.35} />
              </mesh>

              {/* Stamped Center Strengthening Spine / Ridge */}
              <mesh position={[0, -0.075, 0]}>
                <cylinderGeometry args={[0.008, 0.005, 0.18, 8]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
              </mesh>

              {/* White Granular Drosan Powder (When Filled) */}
              {isShovelFilled && (
                <mesh position={[0, -0.065, 0.01]}>
                  <boxGeometry args={[0.15, 0.02, 0.18]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.95} />
                </mesh>
              )}
            </group>
          </group>
        )}

        {/* Text Labels */}
        <Text
          position={[0, 0.08, 0.01]}
          fontSize={0.022}
          color="#facc15"
          anchorX="center"
          fontWeight="bold"
        >
          2. SKOP KOAGULAN
        </Text>
        <Text
          position={[0, 0.055, 0.01]}
          fontSize={0.014}
          color="#94a3b8"
          anchorX="center"
        >
          {isShovelFilled ? `${coagulantDoseKg.toFixed(1)} KG DROSAN` : 'SERBUK FLUX'}
        </Text>
        <Text
          position={[0, -0.075, 0.01]}
          fontSize={0.015}
          color={heldTool === 'shovel' ? '#facc15' : '#4ade80'}
          anchorX="center"
          fontWeight="bold"
        >
          {heldTool === 'shovel' ? '[KLIK GANTUNG]' : '[TERPASANG]'}
        </Text>
      </group>

      {/* ===================================================================== */}
      {/* 5. HOOK 3: GANTUNGAN SEROKAN TERAK (KANAN, x = +0.32)                 */}
      {/* ===================================================================== */}
      <group
        position={[0.32, hookY, 0.015]}
        onClick={(e) => {
          e.stopPropagation();
          inductionAudio.resume();
          inductionAudio.playClick();
          if (heldTool === 'skimmer') {
            // Hang skimmer back on Hook 3
            setHeldTool('none');
          } else {
            // Pick up skimmer from Hook 3
            setHeldTool('skimmer');
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredObject('hook-skimmer');
          setActiveHoverObject(
            heldTool === 'skimmer'
              ? 'Hook Serokan (Klik untuk Gantungkan Kembali ke Stand)'
              : 'Serokan Terak Logam (Klik untuk Ambil dari Stand)'
          );
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredObject(null);
          setActiveHoverObject(null);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Steel Hook Mounting Backplate */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.08, 0.10, 0.01]} />
          <meshStandardMaterial
            color={
              hoveredObject === 'hook-skimmer'
                ? '#10b981'
                : heldTool === 'skimmer'
                ? '#047857'
                : '#0f172a'
            }
            metalness={0.8}
            roughness={0.4}
          />
        </mesh>

        {/* Dual Forward Prongs Hook */}
        <mesh position={[-0.024, -0.01, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.09, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <mesh position={[0.024, -0.01, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.09, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        {/* Upward Hook Safety Tips */}
        <mesh position={[-0.024, 0.005, 0.09]}>
          <cylinderGeometry args={[0.007, 0.007, 0.03, 8]} />
          <meshStandardMaterial color="#4ade80" metalness={0.8} />
        </mesh>
        <mesh position={[0.024, 0.005, 0.09]}>
          <cylinderGeometry args={[0.007, 0.007, 0.03, 8]} />
          <meshStandardMaterial color="#4ade80" metalness={0.8} />
        </mesh>

        {/* Vertical Hanging Skimmer Model (Visible when NOT held) */}
        {heldTool !== 'skimmer' && (
          <group position={[0, -0.02, 0.045]}>
            {/* Top Hanging Loop resting in hook prongs */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.025, 0.006, 8, 16]} />
              <meshStandardMaterial color="#475569" metalness={0.85} />
            </mesh>

            {/* Heavy Steel Shaft hanging vertically downward (length = 1.15m) */}
            <mesh position={[0, -0.58, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 1.15, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
            </mesh>

            {/* Flat Scraping Rake Blade at bottom */}
            <mesh position={[0, -1.18, 0]}>
              <boxGeometry args={[0.20, 0.045, 0.015]} />
              <meshStandardMaterial
                color={hoveredObject === 'hook-skimmer' ? '#10b981' : '#1e293b'}
                metalness={0.9}
                roughness={0.4}
              />
            </mesh>
          </group>
        )}

        {/* Text Labels */}
        <Text
          position={[0, 0.08, 0.01]}
          fontSize={0.022}
          color="#4ade80"
          anchorX="center"
          fontWeight="bold"
        >
          3. SEROKAN TERAK
        </Text>
        <Text
          position={[0, 0.055, 0.01]}
          fontSize={0.014}
          color="#94a3b8"
          anchorX="center"
        >
          DESLAGGING RAKE
        </Text>
        <Text
          position={[0, -0.075, 0.01]}
          fontSize={0.015}
          color={heldTool === 'skimmer' ? '#facc15' : '#4ade80'}
          anchorX="center"
          fontWeight="bold"
        >
          {heldTool === 'skimmer' ? '[KLIK GANTUNG]' : '[TERPASANG]'}
        </Text>
      </group>
    </group>
  );
};

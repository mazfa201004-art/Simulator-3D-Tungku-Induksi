import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

// Pre-generate authentic APAR instruction label texture
let aparLabelTextureCache: THREE.CanvasTexture | null = null;
const getAparLabelTexture = () => {
  if (aparLabelTextureCache) return aparLabelTextureCache;
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background white label body
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 512);

  // Red top header banner
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, 512, 110);

  // Top header text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('APAR POWDER ABC', 256, 52);
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText('KAPASITAS 6.0 KG', 256, 92);

  // Decorative border
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 500);

  // Instructions Header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText('PETUNJUK PENGGUNAAN (P-A-S-S)', 256, 142);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(25, 154);
  ctx.lineTo(487, 154);
  ctx.stroke();

  // 4 Steps text
  const steps = [
    { num: '1', title: 'CABUT PIN PENGUNCI', desc: 'Tarik pin segel pengaman' },
    { num: '2', title: 'ARAHKAN NOZZLE', desc: 'Arahkan corong ke dasar api' },
    { num: '3', title: 'TEKAN TUAS KATUP', desc: 'Tekan tuas operasional penuh' },
    { num: '4', title: 'SEMPROT SISI KE SISI', desc: 'Ratakan semprotan bubuk racun api' },
  ];

  steps.forEach((step, idx) => {
    const yBase = 172 + idx * 58;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(50, yBase + 14, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(step.num, 50, yBase + 21);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(step.title, 80, yBase + 12);
    ctx.fillStyle = '#475569';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(step.desc, 80, yBase + 30);
  });

  // Divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(25, 412);
  ctx.lineTo(487, 412);
  ctx.stroke();

  // Fire Class symbols A, B, C
  const classes = [
    { letter: 'A', name: 'BENDA PADAT', bg: '#16a34a' },
    { letter: 'B', name: 'CAIRAN MUDAH TERBAKAR', bg: '#dc2626' },
    { letter: 'C', name: 'INSTALASI LISTRIK', bg: '#2563eb' },
  ];

  classes.forEach((cls, i) => {
    const cx = 90 + i * 166;
    ctx.fillStyle = cls.bg;
    ctx.fillRect(cx - 70, 424, 140, 68);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cls.letter, cx, 456);
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText(cls.name, cx, 478);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  aparLabelTextureCache = texture;
  return texture;
};

interface FireExtinguisherProps {
  id?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Authentic Industrial Fire Extinguisher (APAR - Alat Pemadam Api Ringan 6kg Powder/CO2).
 * - High-detail red steel cylinder body with instructional decal label.
 * - Forged brass operating valve, black carry handle, red squeeze lever, yellow safety seal pin.
 * - Dial pressure gauge with green operational arc.
 * - EPDM discharge rubber hose and trumpet nozzle horn.
 * - Wall mount bracket saddle with inspection tag.
 * - Interactive: click to grab APAR from wall bracket.
 * - Dynamic fog plume when spraying!
 */
export const FireExtinguisher: React.FC<FireExtinguisherProps> = ({
  id = 'apar-dock-1',
  position = [11.82, 1.4, 0],
  rotation = [0, -Math.PI / 2, 0],
}) => {
  const isAparHeld = useSimStore((s) => s.isAparHeld);
  const heldAparDockId = useSimStore((s) => s.heldAparDockId);
  const setIsAparHeld = useSimStore((s) => s.setIsAparHeld);
  const aparVerified = useSimStore((s) => s.aparVerified);
  const setAparModalOpen = useSimStore((s) => s.setAparModalOpen);
  const verifyAparOnly = useSimStore((s) => s.verifyAparOnly);
  const setActiveHoverObject = useSimStore((s) => s.setActiveHoverObject);

  const isThisDockEmpty = isAparHeld && heldAparDockId === id;

  const [hovered, setHovered] = useState(false);
  const labelTexture = useMemo(() => getAparLabelTexture(), []);

  const safetyRedMat = { color: '#dc2626', roughness: 0.35, metalness: 0.25 };
  const valveBrassMat = { color: '#ca8a04', roughness: 0.3, metalness: 0.85 };
  const blackRubberMat = { color: '#0f172a', roughness: 0.8, metalness: 0.1 };

  return (
    <group position={position} rotation={rotation} name="Prop_FireExtinguisher">
      {/* 1. WALL MOUNT BACKPLATE & BRACKET SADDLE (Always stays on wall) */}
      <group position={[0, 0, 0]}>
        {/* White Safety Signboard Background */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[0.42, 0.96]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        {/* Red Hazard Border */}
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.38, 0.92]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        <mesh position={[0, 0, 0.014]}>
          <planeGeometry args={[0.34, 0.88]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>

        {/* APAR Header Text */}
        <Text
          position={[0, 0.36, 0.02]}
          fontSize={0.065}
          color="#dc2626"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          APAR
        </Text>
        <Text
          position={[0, 0.30, 0.02]}
          fontSize={0.024}
          color="#0f172a"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          FIRE EXTINGUISHER
        </Text>

        {/* Steel Wall Bracket Saddle & Retention Clamp */}
        <mesh position={[0, -0.05, 0.04]}>
          <boxGeometry args={[0.06, 0.44, 0.04]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Upper cradle fork hook supporting valve neck */}
        <mesh position={[0, 0.18, 0.08]}>
          <boxGeometry args={[0.12, 0.02, 0.08]} />
          <meshStandardMaterial color="#334155" metalness={0.85} />
        </mesh>
        {/* Lower saddle shelf */}
        <mesh position={[0, -0.22, 0.10]}>
          <boxGeometry args={[0.18, 0.03, 0.12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>

        {/* Stainless Steel Quick-Release Retention Band Clamp */}
        <mesh position={[0, -0.02, 0.12]}>
          <cylinderGeometry args={[0.092, 0.092, 0.025, 24, 1, true, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
        {/* Quick-Release Over-Center Toggle Latch */}
        <group position={[0.095, -0.02, 0.12]}>
          <mesh rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.012, 0.04, 0.015]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
          </mesh>
          <mesh position={[0.005, -0.015, 0]}>
            <sphereGeometry args={[0.008, 12, 12]} />
            <meshStandardMaterial color="#dc2626" roughness={0.3} />
          </mesh>
        </group>

        {/* Hanging Yellow K3 Fire Extinguisher Inspection Card Tag (Enlarged & High Contrast) */}
        <group
          position={[-0.19, 0.14, 0.06]}
          rotation={[0, 0, 0.06]}
          onClick={(e) => {
            e.stopPropagation();
            inductionAudio.resume();
            inductionAudio.playClick();
            verifyAparOnly();
            setAparModalOpen(true);
          }}
        >
          {/* Suspension Wire */}
          <mesh position={[0.04, 0.08, 0]}>
            <cylinderGeometry args={[0.0015, 0.0015, 0.10, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} />
          </mesh>
          {/* Card Backing Border */}
          <mesh position={[0, 0, -0.001]}>
            <planeGeometry args={[0.175, 0.235]} />
            <meshBasicMaterial color="#0f172a" side={THREE.DoubleSide} />
          </mesh>
          {/* Card Body */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[0.165, 0.225]} />
            <meshBasicMaterial color="#fef08a" side={THREE.DoubleSide} />
          </mesh>
          {/* Green Status Header Strip */}
          <mesh position={[0, 0.085, 0.001]}>
            <planeGeometry args={[0.155, 0.036]} />
            <meshBasicMaterial color="#15803d" />
          </mesh>
          <Text position={[0, 0.085, 0.003]} fontSize={0.015} color="#ffffff" fontWeight="bold">
            KARTU INSPEKSI K3
          </Text>
          <Text position={[0, 0.042, 0.003]} fontSize={0.0155} color="#15803d" fontWeight="bold">
            TEKANAN: 16.5 BAR
          </Text>
          <Text position={[0, 0.014, 0.003]} fontSize={0.0125} color="#0f172a" fontWeight="bold">
            ZONA HIJAU (14-18 BAR)
          </Text>
          <Text position={[0, -0.016, 0.003]} fontSize={0.0115} color="#1e293b" fontWeight="bold">
            PIN SEGEL: UTUH
          </Text>
          <Text position={[0, -0.044, 0.003]} fontSize={0.011} color="#334155">
            ISI: POWDER 6.0 KG
          </Text>
          <Text position={[0, -0.075, 0.003]} fontSize={0.011} color={aparVerified ? '#15803d' : '#b45309'} fontWeight="bold">
            {aparVerified ? '✓ TERVERIFIKASI' : 'KLIK PERIKSA APAR'}
          </Text>
        </group>

        {/* High-Visibility 3D Pressure Status Plaque on Right Side of Bracket */}
        <group position={[0.20, 0.28, 0.05]}>
          <mesh>
            <boxGeometry args={[0.17, 0.075, 0.012]} />
            <meshStandardMaterial color="#052e16" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, -0.002]}>
            <boxGeometry args={[0.18, 0.085, 0.01]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
          <Text position={[0, 0.015, 0.008]} fontSize={0.016} color="#4ade80" fontWeight="bold">
            16.5 BAR
          </Text>
          <Text position={[0, -0.014, 0.008]} fontSize={0.0115} color="#ffffff" fontWeight="bold">
            ZONA HIJAU NORMAL
          </Text>
        </group>
      </group>

      {/* 2. PHYSICAL EXTINGUISHER TANK (Visible when mounted on wall) */}
      {!isThisDockEmpty && (
        <group
          position={[0, -0.05, 0.15]}
          onClick={(e) => {
            e.stopPropagation();
            inductionAudio.resume();
            inductionAudio.playClick();
            verifyAparOnly();
            setAparModalOpen(true);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
            setActiveHoverObject('APAR 6 kg • Tekanan Manometer: 16.5 Bar (Zona Hijau Normal) — Klik untuk Inspeksi / Ambil APAR');
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = 'auto';
            setActiveHoverObject(null);
          }}
        >
          {/* Action Prompt Badge */}
          {hovered && (
            <group position={[0, 0.50, 0]}>
              <mesh>
                <boxGeometry args={[0.38, 0.06, 0.012]} />
                <meshStandardMaterial color="#0284c7" />
              </mesh>
              <Text position={[0, 0.01, 0.008]} fontSize={0.018} color="#ffffff" fontWeight="bold">
                KLIK: INSPEKSI MANOMETER (16.5 BAR)
              </Text>
              <Text position={[0, -0.013, 0.008]} fontSize={0.013} color="#fde047" fontWeight="bold">
                VERIFIKASI K3 / AMBIL TABUNG APAR
              </Text>
            </group>
          )}

          {/* Main Cylindrical Tank Body (Seamless deep drawn steel with glossy safety red coat) */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.46, 28]} />
            <meshStandardMaterial {...safetyRedMat} />
          </mesh>
          {/* Top Domed Cap */}
          <mesh position={[0, 0.23, 0]}>
            <sphereGeometry args={[0.085, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial {...safetyRedMat} />
          </mesh>
          {/* Molded Black Protective Base Boot / Skirt */}
          <mesh position={[0, -0.23, 0]} rotation={[Math.PI, 0, 0]}>
            <cylinderGeometry args={[0.090, 0.092, 0.045, 28]} />
            <meshStandardMaterial color="#090d16" roughness={0.8} />
          </mesh>

          {/* Operating Instructions Cylindrical Decal (Curved CanvasTexture, 100% flush, 0 floating text) */}
          {labelTexture && (
            <mesh position={[0, -0.015, 0]}>
              <cylinderGeometry args={[0.0855, 0.0855, 0.27, 48, 1, true, Math.PI / 2 - 0.62, 1.24]} />
              <meshStandardMaterial
                map={labelTexture}
                roughness={0.35}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}

          {/* Forged Brass Valve Neck Collar */}
          <mesh position={[0, 0.30, 0]}>
            <cylinderGeometry args={[0.025, 0.035, 0.06, 16]} />
            <meshStandardMaterial {...valveBrassMat} />
          </mesh>

          {/* Black Metal Carry Handle */}
          <mesh position={[0, 0.33, -0.02]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.02, 0.08, 0.015]} />
            <meshStandardMaterial {...blackRubberMat} />
          </mesh>

          {/* Red Squeeze Trigger Operating Lever */}
          <mesh position={[0, 0.36, -0.01]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.022, 0.10, 0.012]} />
            <meshStandardMaterial color="#dc2626" metalness={0.7} />
          </mesh>

          {/* Safety Pull Pin Ring (Kuningan/Kuning) */}
          <mesh position={[0.035, 0.33, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.018, 0.003, 12, 24]} />
            <meshStandardMaterial color="#facc15" metalness={0.9} />
          </mesh>
          {/* Plastic Tamper Seal Loop */}
          <mesh position={[0.035, 0.31, 0]}>
            <boxGeometry args={[0.004, 0.025, 0.004]} />
            <meshBasicMaterial color="#dc2626" />
          </mesh>

          {/* Enlarged High-Clarity Circular Pressure Gauge (Manometer 16.5 Bar Zona Hijau) */}
          <group position={[0, 0.30, 0.052]} rotation={[0.18, 0, 0]}>
            {/* Brass Outer Bezel */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.034, 0.034, 0.012, 24]} />
              <meshStandardMaterial {...valveBrassMat} />
            </mesh>
            {/* Dark Dial Backing */}
            <mesh position={[0, 0, 0.0065]}>
              <circleGeometry args={[0.029, 24]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
            {/* Red Low-Pressure Left Zone (< 12 Bar) */}
            <mesh position={[0, 0, 0.007]}>
              <ringGeometry args={[0.016, 0.027, 16, 1, Math.PI * 0.65, Math.PI * 0.55]} />
              <meshBasicMaterial color="#dc2626" />
            </mesh>
            {/* Green Normal Operating Zone (14 - 18 Bar) */}
            <mesh position={[0, 0, 0.0072]}>
              <ringGeometry args={[0.016, 0.027, 16, 1, Math.PI * 0.2, Math.PI * 0.48]} />
              <meshBasicMaterial color="#22c55e" />
            </mesh>
            {/* Red Overpressure Right Zone (> 20 Bar) */}
            <mesh position={[0, 0, 0.007]}>
              <ringGeometry args={[0.016, 0.027, 16, 1, -Math.PI * 0.25, Math.PI * 0.45]} />
              <meshBasicMaterial color="#dc2626" />
            </mesh>
            {/* White Pointer Needle Pointing Straight into Green Zone (16.5 Bar) */}
            <mesh position={[0.001, 0.008, 0.008]} rotation={[0, 0, -0.08]}>
              <boxGeometry args={[0.0035, 0.020, 0.0015]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Needle Center Brass Cap */}
            <mesh position={[0, 0, 0.0085]}>
              <circleGeometry args={[0.0045, 12]} />
              <meshBasicMaterial color="#facc15" />
            </mesh>
            {/* Numeric Readout Text on Dial Face */}
            <Text position={[0, -0.013, 0.0085]} fontSize={0.0085} color="#4ade80" fontWeight="bold">
              16.5 BAR
            </Text>
            {/* Crystal Protective Lens */}
            <mesh position={[0, 0, 0.009]}>
              <circleGeometry args={[0.030, 24]} />
              <meshPhysicalMaterial transparent opacity={0.32} roughness={0.1} transmission={0.9} />
            </mesh>
          </group>

          {/* REALISTIC DISCHARGE HOSE WITH COMPRESSION FERRULES */}
          {/* Valve Hose Outlet Swivel Fitting (Brass) */}
          <mesh position={[-0.03, 0.29, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.025, 12]} />
            <meshStandardMaterial {...valveBrassMat} />
          </mesh>
          {/* Brass Crimp Ferrule Collar */}
          <mesh position={[-0.045, 0.28, 0]} rotation={[0, 0, 0.4]}>
            <cylinderGeometry args={[0.010, 0.010, 0.018, 12]} />
            <meshStandardMaterial {...valveBrassMat} />
          </mesh>
          {/* Upper Curved Hose Elbow */}
          <mesh position={[-0.065, 0.255, 0]} rotation={[0, 0, 0.65]}>
            <cylinderGeometry args={[0.008, 0.008, 0.09, 12]} />
            <meshStandardMaterial {...blackRubberMat} />
          </mesh>
          {/* Main Vertical Hose Body running down cylinder flank */}
          <mesh position={[-0.094, 0.04, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.34, 12]} />
            <meshStandardMaterial {...blackRubberMat} />
          </mesh>
          {/* Black Hose Retention Clip attached to Tank */}
          <mesh position={[-0.088, 0.02, 0]}>
            <boxGeometry args={[0.016, 0.035, 0.025]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} />
          </mesh>
          {/* Nozzle Coupling Brass Ferrule */}
          <mesh position={[-0.094, -0.115, 0]}>
            <cylinderGeometry args={[0.010, 0.010, 0.016, 12]} />
            <meshStandardMaterial {...valveBrassMat} />
          </mesh>
          {/* Discharge Trumpet Nozzle Horn (Held vertically pointing down) */}
          <mesh position={[-0.094, -0.17, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.018, 0.08, 16]} />
            <meshStandardMaterial {...blackRubberMat} />
          </mesh>
          <mesh position={[-0.094, -0.125, 0]}>
            <cylinderGeometry args={[0.0085, 0.0085, 0.03, 12]} />
            <meshStandardMaterial {...blackRubberMat} />
          </mesh>
        </group>
      )}

      {/* 3. RETURN APAR TO BRACKET (Click empty bracket to return) */}
      {isAparHeld && isThisDockEmpty && (
        <group
          position={[0, -0.05, 0.15]}
          onClick={(e) => {
            e.stopPropagation();
            inductionAudio.resume();
            inductionAudio.playClick();
            setIsAparHeld(false);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
        >
          {/* Transparent click target box */}
          <mesh>
            <boxGeometry args={[0.32, 0.65, 0.28]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Action Prompt Badge */}
          {hovered && (
            <group position={[0, 0.48, 0]}>
              <mesh>
                <boxGeometry args={[0.32, 0.045, 0.01]} />
                <meshStandardMaterial color="#16a34a" />
              </mesh>
              <Text position={[0, 0, 0.01]} fontSize={0.022} color="#ffffff" fontWeight="bold">
                KLIK: KEMBALIKAN APAR
              </Text>
            </group>
          )}
        </group>
      )}
    </group>
  );
};

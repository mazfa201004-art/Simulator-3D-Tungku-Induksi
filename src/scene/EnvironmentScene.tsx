import React, { useRef, useState, useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '../store/useSimStore';
import { inductionAudio } from './fx/InductionAudio';
import { FireExtinguisher } from './props/FireExtinguisher';
import { RawMaterialDepot } from './props/RawMaterialDepot';
import { PPERackStation } from './props/PPERackStation';
import { WallUtilitySwitchBoxes } from './props/WallUtilitySwitchBoxes';

/**
 * Authentic Heavy Industrial Smelting & Foundry Workshop Environment (24m x 24m x 8.5m).
 * - Compact & aesthetically balanced foundry workcell.
 * - Symmetrical rows of 5 heavy exhaust fans on Left Wall AND 5 heavy exhaust fans on Right Wall (Total 10 units).
 * - Back Wall: GERBANG 01 with high clerestory windows, solid wall for 20kV substation.
 * - Front Wall: GERBANG 02 & 03, PT. INDUKSI LOGAM NUSANTARA header, K3 safety banners, emergency exit door.
 * - Right Wall: Electrical LVMDP switchgear, interactive APAR stations, K3 Safety Billboards.
 * - Scrap raw metal inbound bin & floor weighing scale staged right by the central aisle near the furnace (Interactive).
 * - Single-beam ceiling purlin lamp supports with industrial high-bay pendant lamps.
 * - Functional utility switch station for factory lighting and exhaust ventilation.
 */
interface RollupGateProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  gateNumber: string;
  gateTitle: string;
}

// Pre-generate authentic corrugated industrial rollup gate texture
let rollupTextureCache: THREE.CanvasTexture | null = null;
const getRollupGateTexture = () => {
  if (rollupTextureCache) return rollupTextureCache;
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Base industrial galvanized steel
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, 512, 1024);

  // Corrugated horizontal metal slats
  const slatHeight = 32;
  const numSlats = Math.floor(1024 / slatHeight);

  for (let i = 0; i < numSlats; i++) {
    const y = i * slatHeight;
    // Beveled slat gradient
    const grad = ctx.createLinearGradient(0, y, 0, y + slatHeight);
    grad.addColorStop(0.0, '#64748b');
    grad.addColorStop(0.2, '#94a3b8');
    grad.addColorStop(0.5, '#475569');
    grad.addColorStop(0.85, '#334155');
    grad.addColorStop(1.0, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, 512, slatHeight - 2);

    // Dark interlocking joint groove between slats
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, y + slatHeight - 2, 512, 2);

    // Stamped vertical stiffening rib indents
    for (let x = 32; x < 512; x += 48) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(x, y + 4, 12, slatHeight - 10);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(x + 12, y + 4, 2, slatHeight - 10);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  rollupTextureCache = texture;
  return texture;
};

const IndustrialRollupGate: React.FC<RollupGateProps> = ({
  position,
  rotation = [0, 0, 0],
  gateNumber,
  gateTitle,
}) => {
  const gateTexture = useMemo(() => getRollupGateTexture(), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Frame Outer Reveal */}
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[5.4, 4.25, 0.14]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Rolling Shutter Curtain with realistic corrugated metal texture */}
      <mesh position={[0, 2.05, 0.02]}>
        <planeGeometry args={[5.0, 4.1]} />
        <meshStandardMaterial
          color="#94a3b8"
          map={gateTexture || undefined}
          metalness={0.75}
          roughness={0.35}
        />
      </mesh>

      {/* Subtle Raised Slat Emboss Dividers */}
      {[...Array(12)].map((_, si) => (
        <mesh key={`slat-${si}`} position={[0, 0.35 + si * 0.32, 0.028]}>
          <boxGeometry args={[4.96, 0.018, 0.008]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
      ))}

      {/* Left & Right Vertical Guide Tracks (C-channels) */}
      {[-2.52, 2.52].map((tx, ti) => (
        <mesh key={`track-${ti}`} position={[tx, 2.05, 0.06]}>
          <boxGeometry args={[0.16, 4.2, 0.12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}

      {/* Bottom Heavy Weatherseal / Strike Bar with Yellow Safety Striping */}
      <mesh position={[0, 0.08, 0.06]}>
        <boxGeometry args={[5.04, 0.16, 0.10]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.08, 0.115]}>
        <planeGeometry args={[4.98, 0.12]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>

      {/* Top Header Lintel Box Enclosure (Rapi tanpa tabung/silinder melintang) */}
      <mesh position={[0, 4.25, 0.10]}>
        <boxGeometry args={[5.20, 0.36, 0.16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.35} />
      </mesh>
      {/* End Trim Plates */}
      {[-2.60, 2.60].map((cx, ci) => (
        <mesh key={`cap-${ci}`} position={[cx, 4.25, 0.10]}>
          <boxGeometry args={[0.04, 0.38, 0.18]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
      ))}

      {/* Overhead Gate Signboard */}
      <group position={[0, 4.85, 0.08]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[4.6, 0.50, 0.06]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[4.5, 0.44]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        <Text
          position={[0, 0.07, 0.04]}
          fontSize={0.17}
          color="#facc15"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {gateNumber}
        </Text>
        <Text
          position={[0, -0.11, 0.04]}
          fontSize={0.095}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {gateTitle}
        </Text>
      </group>
    </group>
  );
};

interface EnvironmentSceneProps {
  isLiteMode?: boolean;
}

export const EnvironmentScene: React.FC<EnvironmentSceneProps> = ({ isLiteMode: propLite }) => {
  const storeProfile = useSimStore((s) => s.performanceProfile);
  const isLite = propLite !== undefined ? propLite : storeProfile === 'lite';

  const setActiveHoverObject = useSimStore((s) => s.setActiveHoverObject);
  const factoryLightsOn = useSimStore((s) => s.factoryLightsOn);
  const toggleFactoryLights = useSimStore((s) => s.toggleFactoryLights);
  const exhaustFansOn = useSimStore((s) => s.exhaustFansOn);
  const toggleExhaustFans = useSimStore((s) => s.toggleExhaustFans);

  const [hoveredLightSw, setHoveredLightSw] = useState(false);
  const [hoveredExhaustSw, setHoveredExhaustSw] = useState(false);

  // Symmetrical fan coordinates: 5 units per side spaced 4m apart (-8, -4, 0, 4, 8)
  const fanZPositions = [-8.0, -4.0, 0.0, 4.0, 8.0];
  const leftFanRefs = useRef<(THREE.Group | null)[]>([]);
  const rightFanRefs = useRef<(THREE.Group | null)[]>([]);
  const fanSpeedRef = useRef(5.0);

  useFrame((_, delta) => {
    if (isLite) return;
    const targetSpeed = exhaustFansOn ? 5.0 : 0.0;
    fanSpeedRef.current = THREE.MathUtils.lerp(fanSpeedRef.current, targetSpeed, delta * 2.5);

    if (fanSpeedRef.current > 0.02) {
      leftFanRefs.current.forEach((fan, idx) => {
        if (fan) fan.rotation.z += delta * (fanSpeedRef.current + (idx % 3) * 0.4 * (fanSpeedRef.current / 5.0));
      });
      rightFanRefs.current.forEach((fan, idx) => {
        if (fan) fan.rotation.z += delta * (fanSpeedRef.current + ((idx + 1) % 3) * 0.4 * (fanSpeedRef.current / 5.0));
      });
    }
  });

  // Structural Materials
  const industrialFrameMat = { color: '#1e293b', roughness: 0.6, metalness: 0.5 };
  const concreteWallMat = { color: '#64748b', roughness: 0.9, metalness: 0.1 };
  const lightWallMat = { color: '#94a3b8', roughness: 0.85, metalness: 0.1 };

  if (isLite) {
    return (
      <group name="ENV_LiteEnvironment">
        {/* Bright, balanced high-clarity lighting without shadow maps */}
        <ambientLight intensity={factoryLightsOn ? 1.5 : 0.45} color="#f8fafc" />
        <directionalLight position={[6, 14, 6]} intensity={factoryLightsOn ? 1.6 : 0.25} color="#ffffff" />
        <directionalLight position={[-6, 12, -4]} intensity={factoryLightsOn ? 1.1 : 0.2} color="#e2e8f0" />

        {/* Clear Concrete Foundry Floor (24m x 24m) */}
        <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[24, 24]} />
          <meshStandardMaterial color="#334155" roughness={0.75} metalness={0.15} />
        </mesh>

        {/* Lightweight 4-Plane Factory Boundary Walls (Zero GPU Overhead) */}
        <group name="FactoryWalls_Lite">
          {/* Back Wall (z = -12m) */}
          <mesh position={[0, 4.25, -12]}>
            <planeGeometry args={[24, 8.5]} />
            <meshStandardMaterial {...concreteWallMat} />
          </mesh>
          {/* Front Wall (z = 12m) */}
          <mesh position={[0, 4.25, 12]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[24, 8.5]} />
            <meshStandardMaterial {...concreteWallMat} />
          </mesh>
          {/* Left Wall (x = -12m) */}
          <mesh position={[-12, 4.25, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[24, 8.5]} />
            <meshStandardMaterial {...lightWallMat} />
          </mesh>
          {/* Right Wall (x = 12m) */}
          <mesh position={[12, 4.25, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[24, 8.5]} />
            <meshStandardMaterial {...lightWallMat} />
          </mesh>
        </group>

        {/* Pojok Penyimpanan APD & APAR 1 di Pojok Kiri-Belakang Bengkel (X=-12m, Z=-12m) */}
        <PPERackStation position={[-10.9, 0, -11.78]} rotation={[0, 0, 0]} />

        {/* 3 Box Saklar Utilitas Dinding di Sebelah Kanan Rak APD (Cooling Tower, Pompa Cooling + Manometer, Breaker Utama) */}
        <WallUtilitySwitchBoxes />

        {/* Depo Bahan Baku, Timbangan Platform Digital 250 kg, Drying Bin & Meja Job Order (Mode Ringan Hemat GPU) */}
        <RawMaterialDepot isLiteMode={true} />

        {/* APAR 2 Menempel Rapat di Dinding Depan (Z=+12m) */}
        <FireExtinguisher id="apar-dock-2" position={[-1.2, 1.35, 11.99]} rotation={[0, Math.PI, 0]} />
      </group>
    );
  }

  return (
    <group name="ENV_HeavyFactoryEnvironment">
      {/* ========================================================================= */}
      {/* 1. FACTORY LIGHTING (Authentic Foundry Illumination)                      */}
      {/* ========================================================================= */}
      <ambientLight intensity={factoryLightsOn ? 1.35 : 0.35} color="#94a3b8" />
      <hemisphereLight args={['#e2e8f0', '#334155', factoryLightsOn ? 0.9 : 0.2]} />

      {/* High-Bay Overhead Industrial Directional & Fill Lights */}
      <directionalLight position={[8, 16, 8]} intensity={factoryLightsOn ? 1.6 : 0.2} color="#fffbeb" />
      <directionalLight position={[-8, 14, -8]} intensity={factoryLightsOn ? 1.1 : 0.15} color="#fef08a" />
      <directionalLight position={[0, 14, 0]} intensity={factoryLightsOn ? 0.9 : 0.15} color="#ffffff" />
      <directionalLight position={[0, 10, 10]} intensity={factoryLightsOn ? 0.8 : 0.1} color="#f1f5f9" />

      {/* Furnace/Molten Metal Glow Base Light */}
      <pointLight position={[0, 2.2, 0]} intensity={1.3} color="#ea580c" distance={16} decay={2} />

      {/* ========================================================================= */}
      {/* 2. REINFORCED CONCRETE FACTORY FLOOR (24m x 24m)                          */}
      {/* ========================================================================= */}
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#475569" roughness={0.82} metalness={0.12} />
      </mesh>


      {/* ========================================================================= */}
      {/* 3. FACTORY BOUNDARY ENCLOSURE WALLS (24m x 8.5m)                          */}
      {/* ========================================================================= */}
      <group name="FactoryWalls">
        {/* Back Wall (z = -12m) */}
        <mesh position={[0, 4.25, -12]}>
          <planeGeometry args={[24, 8.5]} />
          <meshStandardMaterial {...concreteWallMat} />
        </mesh>

        {/* Front Wall (z = 12m) */}
        <mesh position={[0, 4.25, 12]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[24, 8.5]} />
          <meshStandardMaterial {...concreteWallMat} />
        </mesh>

        {/* Left Wall (x = -12m) */}
        <mesh position={[-12, 4.25, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[24, 8.5]} />
          <meshStandardMaterial {...lightWallMat} />
        </mesh>

        {/* Right Wall (x = 12m) */}
        <mesh position={[12, 4.25, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[24, 8.5]} />
          <meshStandardMaterial {...lightWallMat} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 3B. FACTORY INDUSTRIAL STEEL ROOF STRUCTURE (24m x 24m, y = 8.50m)        */}
      {/* ========================================================================= */}
      <group name="FactoryRoof" position={[0, 8.50, 0]}>
        {/* Main Solid Corrugated Steel Roof Decking (facing down towards the floor) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[24, 24]} />
          <meshStandardMaterial
            color="#334155"
            roughness={0.8}
            metalness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Industrial Translucent Daylighting Skylight Strips */}
        {[-6, 6].map((sx, si) => (
          <group key={`skylight-${si}`} position={[sx, -0.015, 0]}>
            {/* Translucent Frosted Glass / Polycarbonate Strip */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[2.0, 22]} />
              <meshStandardMaterial
                color="#e0f2fe"
                transparent
                opacity={0.4}
                roughness={0.3}
                emissive="#bae6fd"
                emissiveIntensity={0.25}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Skylight Transverse Structural Mullions */}
            {[-8, -4, 0, 4, 8].map((mz, mi) => (
              <mesh key={`mullion-${mi}`} position={[0, -0.01, mz]}>
                <boxGeometry args={[2.04, 0.04, 0.06]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Longitudinal Heavy Roof Purlins running along Z-axis */}
        {[-9, -3, 3, 9].map((px, pi) => (
          <mesh key={`purlin-long-${pi}`} position={[px, -0.06, 0]}>
            <boxGeometry args={[0.12, 0.12, 23.8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* ========================================================================= */}
      {/* 4. OVERHEAD SINGLE-BEAM CEILING PURLINS & HIGH-BAY PENDANT LIGHTS (y = 8.15m) */}
      {/* (Sebatang balok I-beam horizontal penopang lampu sesuai kebutuhan realistis) */}
      {/* ========================================================================= */}
      {[-8, -4, 0, 4, 8].map((tz, ti) => (
        <group key={`purlin-beam-${ti}`} position={[0, 8.15, tz]}>
          {/* Sebatang balok I-beam baja horizontal melintang 23.6m */}
          <mesh>
            <boxGeometry args={[23.6, 0.20, 0.14]} />
            <meshStandardMaterial {...industrialFrameMat} />
          </mesh>
          {/* Wall Mounting Flange Plates di kedua ujung dinding */}
          {[-11.75, 11.75].map((fx, fi) => (
            <mesh key={`flange-${fi}`} position={[fx, 0, 0]}>
              <boxGeometry args={[0.08, 0.36, 0.24]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </mesh>
          ))}
          {/* Industrial Pendant High-Bay Light Fixtures */}
          {[-7, -2.5, 2.5, 7].map((lx, li) => (
            <group key={`pendant-${li}`} position={[lx, -0.9, 0]}>
              <mesh position={[0, 0.45, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.9, 8]} />
                <meshBasicMaterial color="#020617" />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.12, 0.38, 0.25, 16]} />
                <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
              </mesh>
              {/* Bohlam lampu (menyala terang jika lampu aktif, kaca gelap jika mati) */}
              <mesh position={[0, -0.09, 0]}>
                <sphereGeometry args={[0.12, 12, 12]} />
                <meshBasicMaterial color={factoryLightsOn ? '#fffbeb' : '#1e293b'} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* ========================================================================= */}
      {/* 5. FULL SYMMETRICAL ROW OF 5 EXHAUST FANS ON LEFT WALL (x = -11.85m, y = 7.20m) */}
      {/* (Elevated safely above crane runway rail at y = 5.60m for 100% clear clearance) */}
      {/* ========================================================================= */}
      {fanZPositions.map((z, i) => (
        <group key={`l-fan-${i}`} position={[-11.85, 7.20, z]} rotation={[0, Math.PI / 2, 0]}>
          {/* Steel Housing Frame */}
          <mesh>
            <boxGeometry args={[1.5, 1.5, 0.24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.4} />
          </mesh>
          {/* Yellow Hazard Outer Border Flange */}
          <mesh position={[0, 0, 0.125]}>
            <ringGeometry args={[0.63, 0.74, 32]} />
            <meshBasicMaterial color="#eab308" side={THREE.DoubleSide} />
          </mesh>
          {/* Recessed Fan Air Duct Tunnel */}
          <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.62, 0.62, 0.20, 32]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
          {/* Protective Steel Wire Safety Mesh Ring */}
          <mesh position={[0, 0, 0.13]}>
            <ringGeometry args={[0.15, 0.61, 32]} />
            <meshStandardMaterial color="#475569" wireframe />
          </mesh>
          {/* Rotating Fan Assembly (Motor Hub + 4 Aerodynamic Blades) */}
          <group ref={(el) => (leftFanRefs.current[i] = el)} position={[0, 0, 0.11]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.12, 20]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            {[0, 1, 2, 3].map((b) => (
              <group key={`blade-${b}`} rotation={[0, 0, (Math.PI / 2) * b]}>
                <mesh position={[0, 0.34, 0]} rotation={[0.25, 0, 0]}>
                  <boxGeometry args={[0.13, 0.52, 0.02]} />
                  <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.35} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      ))}

      {/* ========================================================================= */}
      {/* 6. FULL SYMMETRICAL ROW OF 5 EXHAUST FANS ON RIGHT WALL (x = 11.85m, y = 7.20m)*/}
      {/* ========================================================================= */}
      {fanZPositions.map((z, i) => (
        <group key={`r-fan-${i}`} position={[11.85, 7.20, z]} rotation={[0, -Math.PI / 2, 0]}>
          {/* Steel Housing Frame */}
          <mesh>
            <boxGeometry args={[1.5, 1.5, 0.24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.4} />
          </mesh>
          {/* Yellow Hazard Outer Border Flange */}
          <mesh position={[0, 0, 0.125]}>
            <ringGeometry args={[0.63, 0.74, 32]} />
            <meshBasicMaterial color="#eab308" side={THREE.DoubleSide} />
          </mesh>
          {/* Recessed Fan Air Duct Tunnel */}
          <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.62, 0.62, 0.20, 32]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
          {/* Protective Steel Wire Safety Mesh Ring */}
          <mesh position={[0, 0, 0.13]}>
            <ringGeometry args={[0.15, 0.61, 32]} />
            <meshStandardMaterial color="#475569" wireframe />
          </mesh>
          {/* Rotating Fan Assembly (Motor Hub + 4 Aerodynamic Blades) */}
          <group ref={(el) => (rightFanRefs.current[i] = el)} position={[0, 0, 0.11]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.12, 20]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            {[0, 1, 2, 3].map((b) => (
              <group key={`blade-${b}`} rotation={[0, 0, (Math.PI / 2) * b]}>
                <mesh position={[0, 0.34, 0]} rotation={[0.25, 0, 0]}>
                  <boxGeometry args={[0.13, 0.52, 0.02]} />
                  <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.35} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      ))}

      {/* ========================================================================= */}
      {/* 7. K3 SAFETY EQUIPMENT: 3D PPE RACK & STRATEGIC APAR STATIONS              */}
      {/* Sesuai Permenakertrans No. 04/1980 & NFPA 10 (Pojok Bengkel & Pintu Keluar) */}
      {/* ========================================================================= */}
      {/* Pojok Penyimpanan APD & APAR 1 di Pojok Kiri-Belakang Bengkel (X=-12m, Z=-12m) */}
      <PPERackStation position={[-10.9, 0, -11.78]} rotation={[0, 0, 0]} />

      {/* 3 Box Saklar Utilitas Dinding di Sebelah Kanan Rak APD (Cooling Tower, Pompa Cooling + Manometer, Breaker Utama) */}
      <WallUtilitySwitchBoxes />

      {/* APAR 2: Proteksi Jalur Evakuasi Darurat (Menempel Rapat pada Dinding Depan Z=+12m) */}
      <FireExtinguisher id="apar-dock-2" position={[-1.2, 1.35, 11.99]} rotation={[0, Math.PI, 0]} />

      {/* ========================================================================= */}
      {/* 9. FRONT WALL: GATES, K3 SIGNS & COMPANY HEADER (z = 11.88m)              */}
      {/* ========================================================================= */}
      <group position={[0, 0, 11.88]}>
        {/* Two Standardized Industrial Rolling Cargo Gates (GERBANG 02 & GERBANG 03) */}
        <IndustrialRollupGate
          position={[-5.0, 0, 0]}
          rotation={[0, Math.PI, 0]}
          gateNumber="GERBANG 02"
          gateTitle="LOGISTIK MASUK"
        />
        <IndustrialRollupGate
          position={[5.0, 0, 0]}
          rotation={[0, Math.PI, 0]}
          gateNumber="GERBANG 03"
          gateTitle="DISPATCH & PENGIRIMAN"
        />

        {/* Center Emergency Personnel Exit Door (Realistic Steel Fire Door) */}
        <group position={[0, 0, 0]} rotation={[0, Math.PI, 0]}>
          {/* Steel Door Frame Outer Reveal (1.2m x 2.3m) */}
          <mesh position={[0, 1.15, 0]}>
            <boxGeometry args={[1.26, 2.36, 0.14]} />
            <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.35} />
          </mesh>

          {/* Door Leaf (Industrial Forest Green RAL 6005) */}
          <mesh position={[0, 1.13, 0.02]}>
            <boxGeometry args={[1.16, 2.26, 0.07]} />
            <meshStandardMaterial color="#14532d" metalness={0.4} roughness={0.45} />
          </mesh>

          {/* Stainless Steel Kickplate at bottom */}
          <mesh position={[0, 0.22, 0.06]}>
            <boxGeometry args={[1.12, 0.36, 0.015]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
          </mesh>

          {/* Wire-Glass Vision Panel Window (Rectangular upper window) */}
          <group position={[0, 1.55, 0.06]}>
            <mesh>
              <boxGeometry args={[0.32, 0.65, 0.02]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 0, 0.005]}>
              <planeGeometry args={[0.26, 0.59]} />
              <meshStandardMaterial color="#93c5fd" transparent opacity={0.65} roughness={0.1} />
            </mesh>
            {/* Embedded Security Wire Grid Mesh */}
            <mesh position={[0, 0, 0.008]}>
              <planeGeometry args={[0.25, 0.58]} />
              <meshBasicMaterial color="#334155" wireframe />
            </mesh>
          </group>

          {/* Commercial Overhead Hydraulic Door Closer */}
          <group position={[0, 2.20, 0.08]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.26, 16]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
            <mesh position={[0.08, 0.04, 0.04]} rotation={[0.4, 0, 0.3]}>
              <boxGeometry args={[0.015, 0.12, 0.015]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} />
            </mesh>
          </group>

          {/* Heavy Panic Push Bar (Crash bar at waist height ~1.0m) */}
          <group position={[0, 1.0, 0.08]}>
            {[-0.45, 0.45].map((bx, bi) => (
              <mesh key={`crash-bkt-${bi}`} position={[bx, 0, 0]}>
                <boxGeometry args={[0.08, 0.14, 0.06]} />
                <meshStandardMaterial color="#475569" metalness={0.8} />
              </mesh>
            ))}
            <mesh position={[0, 0, 0.04]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.022, 0.022, 0.94, 16]} />
              <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.4} />
            </mesh>
            <Text position={[0, 0, 0.065]} fontSize={0.032} color="#ffffff" fontWeight="bold">
              PUSH TO OPEN
            </Text>
          </group>

          {/* Overhead Illuminated Emergency EXIT Sign Box (Fits text cleanly with zero overflow) */}
          <group position={[0, 2.50, 0.08]}>
            {/* Dark Enclosure Case */}
            <mesh>
              <boxGeometry args={[0.92, 0.22, 0.08]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </mesh>
            {/* Illuminated Green Faceplate */}
            <mesh position={[0, 0, 0.042]}>
              <planeGeometry args={[0.88, 0.18]} />
              <meshBasicMaterial color="#15803d" />
            </mesh>
            {/* White Sub-frame Border */}
            <mesh position={[0, 0, 0.044]}>
              <planeGeometry args={[0.84, 0.15]} />
              <meshBasicMaterial color="#166534" />
            </mesh>
            {/* Cleanly sized text inside green box */}
            <Text
              position={[0, 0, 0.048]}
              fontSize={0.044}
              color="#4ade80"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              PINTU DARURAT / EXIT -&gt;
            </Text>
            <pointLight position={[0, 0, 0.10]} intensity={0.35} distance={2.5} color="#4ade80" />
          </group>
        </group>

        {/* Wall Utility Switch Station beside Emergency Exit Door (Clean in-wall industrial dual switch) */}
        <group position={[1.05, 1.35, 0]} rotation={[0, Math.PI, 0]}>
          {/* Flush-mounted Industrial Metallic Faceplate */}
          <mesh>
            <boxGeometry args={[0.22, 0.36, 0.035]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.018]}>
            <planeGeometry args={[0.19, 0.33]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* SWITCH 1: LAMPU PABRIK */}
          <group
            position={[0, 0.075, 0.02]}
            onClick={(e) => {
              e.stopPropagation();
              inductionAudio.playClick();
              toggleFactoryLights();
            }}
            onPointerOver={() => {
              setHoveredLightSw(true);
              setActiveHoverObject('Saklar Lampu Pabrik');
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHoveredLightSw(false);
              setActiveHoverObject(null);
              document.body.style.cursor = 'auto';
            }}
          >
            {/* Rocker Base Frame */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.15, 0.09, 0.015]} />
              <meshStandardMaterial color={hoveredLightSw ? '#475569' : '#0f172a'} />
            </mesh>
            {/* Rocker Button Paddle */}
            <mesh position={[0, 0, 0.01]} rotation={[factoryLightsOn ? -0.15 : 0.15, 0, 0]}>
              <boxGeometry args={[0.13, 0.075, 0.015]} />
              <meshStandardMaterial color={factoryLightsOn ? '#0f766e' : '#475569'} metalness={0.6} />
            </mesh>
            {/* Status Pilot LED Dot */}
            <mesh position={[0, 0.022, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.007, 0.007, 0.006, 16]} />
              <meshStandardMaterial
                color={factoryLightsOn ? '#22c55e' : '#d97706'}
                emissive={factoryLightsOn ? '#22c55e' : '#d97706'}
                emissiveIntensity={2.5}
              />
            </mesh>
            {/* Crisp Simple Label */}
            <Text position={[0, -0.016, 0.02]} fontSize={0.018} color="#f8fafc" fontWeight="bold">
              LAMPU
            </Text>
          </group>

          {/* SWITCH 2: KIPAS EXHAUST */}
          <group
            position={[0, -0.075, 0.02]}
            onClick={(e) => {
              e.stopPropagation();
              inductionAudio.playClick();
              toggleExhaustFans();
            }}
            onPointerOver={() => {
              setHoveredExhaustSw(true);
              setActiveHoverObject('Saklar Kipas Exhaust');
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHoveredExhaustSw(false);
              setActiveHoverObject(null);
              document.body.style.cursor = 'auto';
            }}
          >
            {/* Rocker Base Frame */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.15, 0.09, 0.015]} />
              <meshStandardMaterial color={hoveredExhaustSw ? '#475569' : '#0f172a'} />
            </mesh>
            {/* Rocker Button Paddle */}
            <mesh position={[0, 0, 0.01]} rotation={[exhaustFansOn ? -0.15 : 0.15, 0, 0]}>
              <boxGeometry args={[0.13, 0.075, 0.015]} />
              <meshStandardMaterial color={exhaustFansOn ? '#0369a1' : '#475569'} metalness={0.6} />
            </mesh>
            {/* Status Pilot LED Dot */}
            <mesh position={[0, 0.022, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.007, 0.007, 0.006, 16]} />
              <meshStandardMaterial
                color={exhaustFansOn ? '#22c55e' : '#ef4444'}
                emissive={exhaustFansOn ? '#22c55e' : '#ef4444'}
                emissiveIntensity={2.5}
              />
            </mesh>
            {/* Crisp Simple Label */}
            <Text position={[0, -0.016, 0.02]} fontSize={0.018} color="#f8fafc" fontWeight="bold">
              EXHAUST
            </Text>
          </group>
        </group>

        {/* Factory Title Banner on Front Wall Header */}
        <group position={[0, 7.5, 0]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[14, 0.9]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <Text
            position={[0, 0.14, 0.05]}
            fontSize={0.26}
            color="#f8fafc"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            PT. INDUKSI LOGAM SIMULATOR
          </Text>
          <Text
            position={[0, -0.18, 0.05]}
            fontSize={0.13}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            SISTEM SIMULASI PELEBURAN INDUKSI & PENGECORAN LOGAM
          </Text>
        </group>

        {/* K3 Safety Notification Board on Front Wall (Width 4.2m fits neatly between gates without colliding) */}
        <group position={[0, 5.0, 0]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[4.2, 1.25]} />
            <meshStandardMaterial color="#b45309" />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[4.1, 1.15]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <Text
            position={[0, 0.35, 0.04]}
            fontSize={0.12}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            UTAMAKAN KESELAMATAN & KESEHATAN KERJA (K3)
          </Text>
          <Text
            position={[0, 0.05, 0.04]}
            fontSize={0.088}
            color="#fef08a"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            ⚠️ ZONA SUHU TINGGI (&gt;1000°C) • DILARANG MELINTAS TANPA APD
          </Text>
          <Text
            position={[0, -0.26, 0.04]}
            fontSize={0.072}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            WAJIB: HELM SAFETY • KACAMATA PELINDUNG • SEPATU SAFETY • APRON TAHAN PANAS
          </Text>
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 9C. KOMPLEKS GUDANG, BUNKER SCRAP & BAHAN PADUAN FOUNDRY */}
      {/* Real-world industrial raw materials: SUS 310 scrap, return sprues/risers,  */}
      {/* mild steel scrap, open FeCr drum with crystals, Ni cathode squares,       */}
      {/* sealed CaSi drums, FeSi/FeMn, Kraft recarburizer sacks, scale & skip.     */}
      {/* ========================================================================= */}
      <RawMaterialDepot />

      {/* ========================================================================= */}
      {/* 10. BACK WALL: GERBANG 01 LOGISTIK (z = -11.90m, x = 5.0m)                */}
      {/* (Sudut kiri X = -12m..0m adalah dinding beton solid gardu listrik 20kV)   */}
      {/* ========================================================================= */}
      <IndustrialRollupGate
        position={[5.0, 0, -11.90]}
        rotation={[0, 0, 0]}
        gateNumber="GERBANG 01"
        gateTitle="LOGISTIK & BAHAN BAKU"
      />
    </group>
  );
};

import React from 'react';
import { Text } from '@react-three/drei';

interface CastingCoolingAndDispatchBayProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Authentic Industrial Casting Cooling Yard, Shakeout Bed, Finished Goods Dispatch Bay & Ladle Stand.
 * Populates the rear-right factory quadrant (X: 4.5m to 11.0m, Z: -10.5m to -1.5m).
 * Balances the factory layout according to real-world foundry flow:
 * - Left side (Gate 02): Raw materials, Scrap Bunkers, Skip Scale, 20kV Substation.
 * - Center: Induction Furnace, Melting Platform, Pouring Bay.
 * - Right side (Gate 03): Cooling Bed, Finished Goods Staging, QC Inspection & Outbound Dispatch.
 */
export const CastingCoolingAndDispatchBay: React.FC<CastingCoolingAndDispatchBayProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const steelMat = { color: '#1e293b', metalness: 0.85, roughness: 0.35 };
  const castIronMat = { color: '#334155', metalness: 0.7, roughness: 0.6 };
  const woodPalletMat = { color: '#78350f', roughness: 0.85 };
  const brassBronzeMat = { color: '#d97706', metalness: 0.9, roughness: 0.3 };

  return (
    <group position={position} rotation={rotation} name="CastingCoolingAndDispatchBay">
      {/* ========================================================================= */}
      {/* 1. CASTING COOLING BAY & SHAKEOUT BED (X: 4.5m to 8.2m, Z: -5.5m to -2.2m) */}
      {/* Slotted Cast Iron Floor Cooling Grid for heat dissipation of hot castings   */}
      {/* ========================================================================= */}
      <group position={[6.35, 0, -3.85]}>
        {/* Heavy Perimeter Curb / Concrete Foundation Plinth (3.8m x 3.4m) */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[3.80, 0.10, 3.40]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>

        {/* Slotted Cast Iron Cooling Floor Plate */}
        <mesh position={[0, 0.105, 0]}>
          <boxGeometry args={[3.60, 0.02, 3.20]} />
          <meshStandardMaterial {...castIronMat} />
        </mesh>

        {/* Heat Dissipation Ventilation Slot Recesses */}
        {[-1.3, -0.65, 0, 0.65, 1.3].map((sx, si) => (
          <mesh key={`cooling-slot-${si}`} position={[sx, 0.116, 0]}>
            <boxGeometry args={[0.08, 0.005, 2.90]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
        ))}

        {/* Yellow Safety Boundary Border around Cooling Bed */}
        <mesh position={[0, 0.11, 0]}>
          <boxGeometry args={[3.66, 0.008, 3.26]} />
          <meshStandardMaterial color="#facc15" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.112, 0]}>
          <boxGeometry args={[3.54, 0.01, 3.14]} />
          <meshStandardMaterial {...castIronMat} />
        </mesh>

        {/* Heavy Oak Dunnage Timbers supporting fresh hot castings */}
        {[-0.85, 0.85].map((tz, ti) => (
          <mesh key={`timber-${ti}`} position={[0, 0.18, tz]}>
            <boxGeometry args={[2.80, 0.12, 0.22]} />
            <meshStandardMaterial {...woodPalletMat} />
          </mesh>
        ))}

        {/* FRESHLY STRIPPED HOT CASTINGS COOLING DOWN */}
        {/* 1. Large Cast Marine Bronze Propeller sitting on timbers */}
        <group position={[-0.45, 0.28, 0]} rotation={[0, 0.35, 0]}>
          {/* Propeller Central Boss / Hub */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.26, 0.34, 24]} />
            <meshStandardMaterial {...brassBronzeMat} />
          </mesh>
          {/* Central Shaft Bore Hole */}
          <mesh position={[0, 0.171, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.02, 20]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          {/* 4 Swept Propeller Hydrofoil Blades */}
          {[0, 1, 2, 3].map((b) => (
            <group key={`prop-blade-${b}`} rotation={[0, (Math.PI / 2) * b, 0]}>
              <mesh position={[0.55, 0, 0]} rotation={[0.3, 0.15, 0]}>
                <boxGeometry args={[0.78, 0.045, 0.36]} />
                <meshStandardMaterial {...brassBronzeMat} />
              </mesh>
            </group>
          ))}
          {/* Riser cutoff witness stump */}
          <mesh position={[0, 0.20, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.08, 16]} />
            <meshStandardMaterial color="#78350f" metalness={0.6} roughness={0.7} />
          </mesh>
        </group>

        {/* 2. Heavy Cast Steel Gears on A-Frame Slanted Staging Rack */}
        <group position={[1.15, 0.12, -0.40]}>
          {/* Steel Support A-frame */}
          <mesh position={[0, 0.40, 0]}>
            <boxGeometry args={[0.08, 0.75, 1.20]} />
            <meshStandardMaterial {...steelMat} />
          </mesh>
          {/* Slanted Heavy Cast Spur Gear 1 */}
          <mesh position={[0.16, 0.42, -0.28]} rotation={[0, 0, 0.25]}>
            <cylinderGeometry args={[0.38, 0.38, 0.14, 24]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
          </mesh>
          {/* Gear teeth hub rim */}
          <mesh position={[0.16, 0.42, -0.28]} rotation={[0, 0, 0.25]}>
            <torusGeometry args={[0.36, 0.04, 12, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} />
          </mesh>
          {/* Slanted Cast Spur Gear 2 */}
          <mesh position={[0.16, 0.38, 0.32]} rotation={[0, 0, 0.25]}>
            <cylinderGeometry args={[0.32, 0.32, 0.12, 24]} />
            <meshStandardMaterial color="#334155" metalness={0.88} roughness={0.32} />
          </mesh>
        </group>

        {/* Row of Freshly Stripped Ingot Bars */}
        {[-0.6, -0.2, 0.2, 0.6].map((bx, bi) => (
          <mesh key={`bar-${bi}`} position={[bx, 0.16, 1.15]} rotation={[0, 0.08 * bi, 0]}>
            <boxGeometry args={[0.18, 0.10, 0.58]} />
            <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.35} />
          </mesh>
        ))}

        {/* K3 High-Temperature Warning Stanchion Sign Post */}
        <group position={[-1.75, 0, 1.55]}>
          <mesh position={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 1.30, 16]} />
            <meshStandardMaterial color="#eab308" metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 0.04, 20]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          {/* Yellow Hazard Sign Plate */}
          <group position={[0, 1.15, 0.02]}>
            <mesh>
              <boxGeometry args={[0.85, 0.48, 0.02]} />
              <meshStandardMaterial color="#ca8a04" />
            </mesh>
            <mesh position={[0, 0, 0.011]}>
              <planeGeometry args={[0.81, 0.44]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <Text position={[0, 0.12, 0.015]} fontSize={0.048} color="#facc15" fontWeight="bold">
              ZONA PENDINGINAN LOGAM
            </Text>
            <Text position={[0, 0.02, 0.015]} fontSize={0.038} color="#ef4444" fontWeight="bold">
              SUHU MAKS 400°C • LOGAM PANAS
            </Text>
            <Text position={[0, -0.11, 0.015]} fontSize={0.027} color="#cbd5e1">
              DILARANG MENYENTUH TANPA APD TERMAL
            </Text>
          </group>
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 2. FINISHED GOODS DISPATCH STAGING YARD (X: 5.0m to 10.5m, Z: -10.5m to -7.0m) */}
      {/* Palletized finished castings inspected & ready for Gate 03 Outbound Truck  */}
      {/* ========================================================================= */}
      <group position={[7.80, 0, -8.60]}>
        {/* Floor Yellow-Black Caution Perimeter Demarcation Line */}
        <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5.20, 3.60]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5.10, 3.50]} />
          <meshBasicMaterial color="#334155" />
        </mesh>

        {/* Floor Stencil: DISPATCH STAGING FORKLIFT LANE */}
        <Text
          position={[0, 0.006, 1.62]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.10}
          color="#facc15"
          fontWeight="bold"
        >
          STAGING PRODUK JADI • MENUJU GERBANG 03 DISPATCH &gt;&gt;&gt;
        </Text>

        {/* PALLET 1: 1-TON BANDED STEEL INGOT PALLET BUNDLE */}
        <group position={[-1.65, 0, -0.65]}>
          {/* Euro Pallet Wood Base (1.2m x 0.8m) */}
          <mesh position={[0, 0.07, 0]}>
            <boxGeometry args={[1.20, 0.14, 0.85]} />
            <meshStandardMaterial {...woodPalletMat} />
          </mesh>
          {/* Stack of Precision Cast Billets / Ingots (3 tiers) */}
          <mesh position={[0, 0.38, 0]}>
            <boxGeometry args={[1.10, 0.48, 0.78]} />
            <meshStandardMaterial color="#475569" metalness={0.92} roughness={0.25} />
          </mesh>
          {/* Tension Strapping Bands */}
          <mesh position={[0, 0.38, 0]}>
            <boxGeometry args={[1.12, 0.50, 0.02]} />
            <meshStandardMaterial color="#020617" />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <boxGeometry args={[0.02, 0.50, 0.80]} />
            <meshStandardMaterial color="#020617" />
          </mesh>
          {/* Green QC Passed Shipping Tag */}
          <group position={[0.56, 0.42, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <planeGeometry args={[0.22, 0.14]} />
              <meshBasicMaterial color="#15803d" />
            </mesh>
            <Text position={[0, 0.02, 0.005]} fontSize={0.025} color="#ffffff" fontWeight="bold">
              QC PASSED
            </Text>
            <Text position={[0, -0.03, 0.005]} fontSize={0.018} color="#bbf7d0">
              LOT #ST-204 • 1.2 TON
            </Text>
          </group>
        </group>

        {/* PALLET 2: 1-TON ALUMINIUM INGOT PALLET */}
        <group position={[-0.25, 0, -0.65]}>
          <mesh position={[0, 0.07, 0]}>
            <boxGeometry args={[1.20, 0.14, 0.85]} />
            <meshStandardMaterial {...woodPalletMat} />
          </mesh>
          {/* Gleaming Aluminium Ingot Stack */}
          <mesh position={[0, 0.36, 0]}>
            <boxGeometry args={[1.12, 0.44, 0.76]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.18} />
          </mesh>
          {/* Ingot row grooves */}
          {[-0.14, 0, 0.14].map((iy, ii) => (
            <mesh key={`al-groove-${ii}`} position={[0, 0.36 + iy, 0.385]}>
              <boxGeometry args={[1.08, 0.08, 0.015]} />
              <meshStandardMaterial color="#f1f5f9" metalness={0.98} />
            </mesh>
          ))}
          {/* Blue Shipping Tag */}
          <group position={[0.57, 0.40, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <planeGeometry args={[0.22, 0.14]} />
              <meshBasicMaterial color="#0284c7" />
            </mesh>
            <Text position={[0, 0.02, 0.005]} fontSize={0.024} color="#ffffff" fontWeight="bold">
              ALUMINIUM 99.7%
            </Text>
            <Text position={[0, -0.03, 0.005]} fontSize={0.018} color="#e0f2fe">
              LOT #AL-88 • 800 KG
            </Text>
          </group>
        </group>

        {/* PALLET 3: HEAVY INDUSTRIAL WOODEN CRATE WITH MACHINED GEAR CASTINGS */}
        <group position={[1.25, 0, -0.65]}>
          {/* Slatted Wood Shipping Crate */}
          <mesh position={[0, 0.36, 0]}>
            <boxGeometry args={[1.15, 0.70, 0.85]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
          {/* Outer corner iron reinforcements */}
          {[-0.56, 0.56].map((cx, ci) =>
            [-0.41, 0.41].map((cz, czi) => (
              <mesh key={`corner-${ci}-${czi}`} position={[cx, 0.36, cz]}>
                <boxGeometry args={[0.04, 0.71, 0.04]} />
                <meshStandardMaterial {...steelMat} />
              </mesh>
            ))
          )}
          {/* Stenciled FRAGILE / HANDLE WITH CARE */}
          <Text position={[0, 0.45, 0.43]} fontSize={0.042} color="#0f172a" fontWeight="bold">
            GEARBOX HOUSINGS
          </Text>
          <Text position={[0, 0.36, 0.43]} fontSize={0.032} color="#991b1b" fontWeight="bold">
            ▲▲ HANDLE WITH CARE ▲▲
          </Text>
        </group>

        {/* QC INSPECTION DESK & QUALITY ASSURANCE WORKBENCH */}
        <group position={[1.45, 0, 0.95]}>
          {/* Heavy Steel Workbench Table */}
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[1.50, 0.88, 0.75]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
          </mesh>
          {/* Stainless Steel Table Top */}
          <mesh position={[0, 0.90, 0]}>
            <boxGeometry args={[1.56, 0.04, 0.80]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.2} />
          </mesh>
          {/* Inspection Digital Vernier Caliper Box */}
          <mesh position={[-0.40, 0.94, 0]}>
            <boxGeometry args={[0.35, 0.04, 0.16]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          {/* Quality Control Clipboard / Dispatch Manifest */}
          <mesh position={[0.20, 0.93, 0.05]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[0.24, 0.02, 0.32]} />
            <meshStandardMaterial color="#d97706" />
          </mesh>
          <mesh position={[0.20, 0.942, 0.05]} rotation={[0, 0.2, 0]}>
            <planeGeometry args={[0.20, 0.28]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
          {/* Inspection Go/No-Go Ring Gauges */}
          {[-0.10, 0.02].map((gx, gi) => (
            <mesh key={`gauge-${gi}`} position={[gx, 0.94, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.065, 0.065, 0.03, 20]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
            </mesh>
          ))}
          {/* Articulated QC LED Task Lamp */}
          <group position={[-0.60, 0.92, -0.22]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.50, 12]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            <mesh position={[0.15, 0.48, 0]} rotation={[0, 0, -0.6]}>
              <cylinderGeometry args={[0.06, 0.04, 0.12, 16]} />
              <meshStandardMaterial color="#0284c7" />
            </mesh>
            <pointLight position={[0.20, 0.45, 0]} intensity={0.6} distance={2.5} color="#ffffff" />
          </group>
        </group>
      </group>

      {/* Ladle preheater completely removed per user request */}
    </group>
  );
};

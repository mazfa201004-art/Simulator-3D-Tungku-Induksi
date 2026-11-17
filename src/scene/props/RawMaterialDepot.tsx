import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

/**
 * Authentic Industrial Raw Materials & Base Stock Logistics Depot (Depo Bahan Baku).
 * Fully polished according to real-world foundry metallurgy standards:
 * 
 * 1. Bunker 01: Scrap SUS 310 (Austenitic Stainless Steel sheared plate offcuts, Schedule 40 hollow pipes with weld bevels,
 *               laser punchout flange rings, compressed scrap bales with steel strapping, and yellow inspection stencils)
 * 2. Bunker 02: Return Scrap (Rt SUS 310) (Conical downsprues with pouring basins, trapezoidal runner bars,
 *               feeder risers with signature funnel shrinkage pipe cavities, exothermic sleeve collars, torch-cut slag)
 * 3. Bunker 03: Scrap Baja Karbon (Mild steel structural H-beams with torch dross, bundled spiral deformed rebar with wire ties,
 *               angle iron, dark mill scale, and rich natural rust patina)
 * 4. Stasiun Timbangan Lantai & Charging Skip: Mettler Toledo checkered floor scale (159.02 KG LED) & heavy crane bucket
 * 5. Pallet FeCr LC: 4 steel drums with 1 open drum showing glittering crystalline cleavage lumps & stainless scoop
 * 6. Pallet Nikel Murni (Ni 99.9%): 4 cobalt-blue drums, open drum with 1"x1" cathode squares & pillow briquettes
 * 7. Pallet CaSi Flux: Sealed forest-green drums with Class 4.3 "Dangerous When Wet" hazard diamond decals & Tri-Sure bungs
 * 8. Pallet FeSi 75 & FeMn: Bronze & charcoal drums with iridescent silicon & dense manganese alloy rocks
 * 9. Pallet Karbon, Drosan & Ramming Mass: Kraft paper valve sacks of 98.5% C recarburizer, Drosan & Silica ramming mass
 * 10. Hydraulic Hand Pallet Jack: Industrial yellow pallet truck with forks, steer wheels & tiller handle
 * 11. QC & Material Inspection Desk: Test certificates, handheld XRF scrap analyzer, and sample tray
 */

// --- SHARED INDUSTRIAL PALLET COMPONENT ---
const EuroPallet: React.FC<{ position?: [number, number, number]; rotation?: [number, number, number] }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => (
  <group position={position} rotation={rotation}>
    {/* 3 Longitudinal Bottom Skids / Stringer Runners */}
    {[-0.50, 0, 0.50].map((sx, si) => (
      <mesh key={`skid-${si}`} position={[sx, 0.02, 0]}>
        <boxGeometry args={[0.10, 0.04, 1.20]} />
        <meshStandardMaterial color="#78350f" roughness={0.88} />
      </mesh>
    ))}
    {/* 9 Solid Hardwood Spacer Blocks */}
    {[-0.50, 0, 0.50].map((bx, bi) =>
      [-0.48, 0, 0.48].map((bz, bzi) => (
        <mesh key={`block-${bi}-${bzi}`} position={[bx, 0.07, bz]}>
          <boxGeometry args={[0.10, 0.06, 0.12]} />
          <meshStandardMaterial color="#92400e" roughness={0.9} />
        </mesh>
      ))
    )}
    {/* 3 Cross Support Stringer Boards */}
    {[-0.48, 0, 0.48].map((cz, ci) => (
      <mesh key={`cross-${ci}`} position={[0, 0.11, cz]}>
        <boxGeometry args={[1.20, 0.02, 0.12]} />
        <meshStandardMaterial color="#854d0e" roughness={0.85} />
      </mesh>
    ))}
    {/* 7 Top Deck Slats with realistic nail head dimples and spacing */}
    {[-0.52, -0.35, -0.18, 0, 0.18, 0.35, 0.52].map((tx, ti) => (
      <group key={`deck-${ti}`} position={[tx, 0.13, 0]}>
        <mesh>
          <boxGeometry args={[0.13, 0.02, 1.20]} />
          <meshStandardMaterial color="#a16207" roughness={0.82} />
        </mesh>
        {/* Steel Nail Head Dimples */}
        {[-0.48, 0, 0.48].map((nz, ni) => (
          <mesh key={`nail-${ni}`} position={[0, 0.011, nz]}>
            <cylinderGeometry args={[0.004, 0.004, 0.002, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>
    ))}
  </group>
);

// --- 1. BUNKER 01: SCRAP STAINLESS STEEL SUS 310 ---
const BunkerSUS310Scrap: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Bunker Concrete Retaining Walls with Top Chamfer */}
      <mesh position={[0, 0.55, -0.90]}>
        <boxGeometry args={[2.80, 1.10, 0.18]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.55, 0.90]}>
        <boxGeometry args={[2.80, 1.10, 0.18]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      {/* Front Yellow/Black Safety Curb with Steel Angle Guard */}
      <mesh position={[1.35, 0.12, 0]}>
        <boxGeometry args={[0.14, 0.24, 1.80]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.5} />
      </mesh>
      <mesh position={[1.38, 0.22, 0]}>
        <boxGeometry args={[0.04, 0.04, 1.78]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Stencil Information Signboard (Mounted on back wall, facing +X towards furnace aisle) */}
      <group position={[-1.44, 1.45, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.50, 0.28]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
        </mesh>
        <Text position={[0, 0, 0.01]} fontSize={0.088} color="#f8fafc" fontWeight="bold">
          BUNKER 01: SCRAP SUS 310
        </Text>
      </group>

      {/* --- REAL-WORLD STAINLESS STEEL SCRAP PILE --- */}
      <group position={[0, 0, 0]}>
        {/* Element 1: Hydraulically Compressed Stainless Scrap Bale (Briket Bal Padat SUS 310) */}
        <group position={[0.40, 0.16, -0.45]} rotation={[0, 0.25, 0]}>
          <mesh>
            <boxGeometry args={[0.45, 0.30, 0.40]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.24} />
          </mesh>
          {/* Black Steel Strapping Bands wrapping the bale */}
          {[-0.12, 0.12].map((bx, bi) => (
            <mesh key={`bale-band-${bi}`} position={[bx, 0, 0]}>
              <boxGeometry args={[0.018, 0.305, 0.405]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
            </mesh>
          ))}
          {/* Yellow Spray Lot Stencil on Bale */}
          <Text position={[0, 0, 0.203]} fontSize={0.038} color="#ca8a04" fontWeight="bold">
            BALED 310S
          </Text>
        </group>

        {/* Element 2: Sheared Plates & Slabs (Laser/Guillotine cut offcuts with passivated mill luster) */}
        <mesh position={[-0.45, 0.08, -0.30]} rotation={[0.05, 0.25, 0.02]}>
          <boxGeometry args={[0.85, 0.035, 0.65]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.96} roughness={0.18} />
        </mesh>
        <mesh position={[-0.20, 0.14, 0.25]} rotation={[-0.08, -0.40, 0.10]}>
          <boxGeometry args={[0.75, 0.04, 0.55]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.20} />
        </mesh>
        <mesh position={[0.15, 0.10, -0.10]} rotation={[0.12, 0.55, -0.06]}>
          <boxGeometry args={[0.70, 0.03, 0.50]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.97} roughness={0.16} />
        </mesh>

        {/* Yellow Stencil Stamp on Top Sheared Plate */}
        <group position={[-0.18, 0.165, 0.24]} rotation={[-Math.PI / 2 + 0.1, 0, 0.4]}>
          <Text fontSize={0.055} color="#ca8a04" fontWeight="bold">
            SUS 310S • THK 16MM
          </Text>
        </group>

        {/* Element 3: Hollow Schedule 40 Pipe Offcuts with Visible Wall Thickness & Open Bore */}
        {[
          { pos: [-0.35, 0.24, 0.05] as [number, number, number], rot: [0.1, 0.6, Math.PI / 2] as [number, number, number], r: 0.08, len: 0.65 },
          { pos: [0.10, 0.22, 0.20] as [number, number, number], rot: [-0.15, -0.3, Math.PI / 2] as [number, number, number], r: 0.07, len: 0.58 },
          { pos: [-0.10, 0.30, -0.25] as [number, number, number], rot: [0.2, 0.9, Math.PI / 2] as [number, number, number], r: 0.09, len: 0.70 },
        ].map((pipe, pidx) => (
          <group key={`pipe-${pidx}`} position={pipe.pos} rotation={pipe.rot}>
            {/* Outer Stainless Steel Pipe Wall */}
            <mesh>
              <cylinderGeometry args={[pipe.r, pipe.r, pipe.len, 16, 1, true]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.96} roughness={0.22} side={THREE.DoubleSide} />
            </mesh>
            {/* Inner Hollow Bore Cavity */}
            <mesh>
              <cylinderGeometry args={[pipe.r * 0.82, pipe.r * 0.82, pipe.len * 0.99, 16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.5} />
            </mesh>
            {/* Weld Prep Bevel Lip Ring at Ends (37.5 deg bevel) */}
            {[-pipe.len / 2, pipe.len / 2].map((ep, ei) => (
              <mesh key={`end-${ei}`} position={[0, ep, 0]}>
                <ringGeometry args={[pipe.r * 0.82, pipe.r, 16]} />
                <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.15} side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Element 4: Laser-Cut Flange Punchout Rings (Rondel Plat Bolong) */}
        {[
          { pos: [0.35, 0.28, -0.15] as [number, number, number], rot: [0.4, 0.2, 0.1] as [number, number, number], rOut: 0.14, rIn: 0.06 },
          { pos: [-0.05, 0.38, 0.12] as [number, number, number], rot: [-0.3, 0.7, 0.2] as [number, number, number], rOut: 0.16, rIn: 0.07 },
          { pos: [0.22, 0.34, 0.05] as [number, number, number], rot: [0.2, -0.5, 0.3] as [number, number, number], rOut: 0.13, rIn: 0.05 },
        ].map((ring, ridx) => (
          <group key={`ring-${ridx}`} position={ring.pos} rotation={ring.rot}>
            <mesh>
              <cylinderGeometry args={[ring.rOut, ring.rOut, 0.028, 18, 1, false]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.20} />
            </mesh>
            <mesh position={[0, 0.001, 0]}>
              <cylinderGeometry args={[ring.rIn, ring.rIn, 0.030, 14]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>
          </group>
        ))}

        {/* Element 5: Solid Turned Round Bar Offcuts with Saw-Cut End Faces */}
        <mesh position={[-0.25, 0.40, -0.05]} rotation={[0.3, 0.1, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.45, 14]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.96} roughness={0.16} />
        </mesh>
        <mesh position={[0.05, 0.44, -0.10]} rotation={[-0.2, 0.5, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.40, 14]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.94} roughness={0.22} />
        </mesh>
      </group>
    </group>
  );
};

// --- 2. BUNKER 02: RETURN SCRAP SUS 310 (Rt INTERNAL FOUNDRY) ---
const BunkerReturnScrap: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Bunker Walls */}
      <mesh position={[0, 0.55, 0.90]}>
        <boxGeometry args={[2.80, 1.10, 0.18]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      <mesh position={[1.35, 0.12, 0]}>
        <boxGeometry args={[0.14, 0.24, 1.80]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.5} />
      </mesh>
      <mesh position={[1.38, 0.22, 0]}>
        <boxGeometry args={[0.04, 0.04, 1.78]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Stencil Information Signboard (Mounted on back wall, facing +X towards furnace aisle) */}
      <group position={[-1.44, 1.45, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.50, 0.28]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
        </mesh>
        <Text position={[0, 0, 0.01]} fontSize={0.088} color="#f8fafc" fontWeight="bold">
          BUNKER 02: RETURN SCRAP (Rt)
        </Text>
      </group>

      {/* --- REAL-WORLD FOUNDRY RETURNS GEOMETRY --- */}
      <group position={[0, 0, 0]}>
        {/* 1. Downsprues (Conical Tapered Cast Gating with Top Pouring Funnel Cup) */}
        {[
          { pos: [-0.45, 0.24, -0.20] as [number, number, number], rot: [0.2, 0.4, 0.3] as [number, number, number] },
          { pos: [0.10, 0.28, 0.25] as [number, number, number], rot: [-0.3, -0.5, 0.2] as [number, number, number] },
        ].map((sprue, sidx) => (
          <group key={`sprue-${sidx}`} position={sprue.pos} rotation={sprue.rot}>
            {/* Tapered conical downsprue body */}
            <mesh position={[0, 0.20, 0]}>
              <cylinderGeometry args={[0.05, 0.08, 0.45, 14]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.42} metalness={0.88} />
            </mesh>
            {/* Top Pouring Basin / Cup */}
            <mesh position={[0, 0.44, 0]}>
              <cylinderGeometry args={[0.11, 0.05, 0.08, 16]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.45} metalness={0.85} />
            </mesh>
            {/* Indented cup pouring cavity */}
            <mesh position={[0, 0.465, 0]}>
              <cylinderGeometry args={[0.09, 0.03, 0.05, 14]} />
              <meshStandardMaterial color="#334155" roughness={0.6} />
            </mesh>
          </group>
        ))}

        {/* 2. Trapezoidal Cast Runner Bars with Cross In-gates */}
        <mesh position={[-0.15, 0.16, 0]} rotation={[0.05, 0.8, 0]}>
          <boxGeometry args={[0.65, 0.08, 0.10]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.44} metalness={0.88} />
        </mesh>
        <mesh position={[0.25, 0.20, -0.15]} rotation={[-0.1, -0.6, 0]}>
          <boxGeometry args={[0.55, 0.07, 0.09]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.46} metalness={0.86} />
        </mesh>
        {/* In-gate branches (Saluran Masuk Coran) */}
        {[-0.20, 0.10].map((igx, igi) => (
          <mesh key={`ingate-${igi}`} position={[igx, 0.14, 0.14]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[0.08, 0.04, 0.14]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.45} metalness={0.86} />
          </mesh>
        ))}

        {/* 3. Feeder Risers with SIGNATURE SHRINKAGE PIPE CAVITY & EXOTHERMIC SLEEVE */}
        {[
          { pos: [-0.15, 0.32, -0.22] as [number, number, number], r: 0.11, h: 0.30, rot: [0.1, 0.2, 0] as [number, number, number], hasSleeve: true },
          { pos: [0.35, 0.30, 0.10] as [number, number, number], r: 0.13, h: 0.34, rot: [-0.15, 0.3, 0.05] as [number, number, number], hasSleeve: false },
          { pos: [-0.28, 0.40, 0.15] as [number, number, number], r: 0.095, h: 0.26, rot: [0.2, -0.4, 0.1] as [number, number, number], hasSleeve: false },
        ].map((riser, ridx) => (
          <group key={`riser-${ridx}`} position={riser.pos} rotation={riser.rot}>
            {/* Main Cast Cylinder Body */}
            <mesh position={[0, riser.h / 2, 0]}>
              <cylinderGeometry args={[riser.r, riser.r * 1.05, riser.h, 18]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.40} metalness={0.90} />
            </mesh>
            {/* SIGNATURE SHRINKAGE PIPE CAVITY (Deep conical sinkhole on top where metal fed the casting) */}
            <mesh position={[0, riser.h - 0.02, 0]}>
              <coneGeometry args={[riser.r * 0.70, 0.12, 16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.5} />
            </mesh>
            {/* Exothermic Riser Sleeve Collar Residue (Selongsong Eksotermik Tahan Panas) */}
            {riser.hasSleeve && (
              <mesh position={[0, riser.h * 0.65, 0]}>
                <cylinderGeometry args={[riser.r * 1.10, riser.r * 1.10, riser.h * 0.45, 18, 1, true]} />
                <meshStandardMaterial color="#c2410c" roughness={0.88} />
              </mesh>
            )}
            {/* Torch-Cut Heat Tint & Slag at Bottom Severed Face */}
            <mesh position={[0, 0.015, 0]}>
              <cylinderGeometry args={[riser.r * 1.06, riser.r * 1.06, 0.03, 18]} />
              <meshStandardMaterial color="#78350f" roughness={0.65} metalness={0.75} />
            </mesh>
          </group>
        ))}

        {/* 4. Foundry Leftover Metal Ingot / Pig Casting with Draft Angles */}
        <mesh position={[0.05, 0.14, -0.32]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.32, 0.12, 0.16]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.42} metalness={0.88} />
        </mesh>
      </group>
    </group>
  );
};

// --- 3. BUNKER 03: SCRAP BAJA KARBON (MILD STEEL) ---
const BunkerCarbonScrap: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Bunker Walls */}
      <mesh position={[0, 0.55, 0.90]}>
        <boxGeometry args={[2.80, 1.10, 0.18]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      <mesh position={[1.35, 0.12, 0]}>
        <boxGeometry args={[0.14, 0.24, 1.80]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.5} />
      </mesh>
      <mesh position={[1.38, 0.22, 0]}>
        <boxGeometry args={[0.04, 0.04, 1.78]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Stencil Information Signboard (Mounted on back wall, facing +X towards furnace aisle) */}
      <group position={[-1.44, 1.45, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.50, 0.28]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
        </mesh>
        <Text position={[0, 0, 0.01]} fontSize={0.088} color="#f8fafc" fontWeight="bold">
          BUNKER 03: SCRAP BAJA KARBON
        </Text>
      </group>

      {/* --- REAL-WORLD CARBON STEEL SCRAP GEOMETRY --- */}
      <group position={[0, 0, 0]}>
        {/* 1. Bundled Spiral Deformed Rebar (Besi Beton Ulir) with Steel Tie Wire */}
        <group position={[-0.30, 0.18, -0.15]} rotation={[0.05, 0.35, 0]}>
          {[-0.06, 0, 0.06].map((rx, ri) =>
            [-0.04, 0.04].map((rz, rzi) => (
              <group key={`rebar-${ri}-${rzi}`} position={[rx, 0, rz]}>
                {/* Cylindrical core with dark mill scale */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.024, 0.024, 0.95, 12]} />
                  <meshStandardMaterial color="#27272a" metalness={0.82} roughness={0.55} />
                </mesh>
                {/* Spiral Deformed Rib Bands (Ulir Rusuk Timbul) */}
                {[-0.35, -0.20, -0.05, 0.10, 0.25, 0.40].map((yb, ybi) => (
                  <mesh key={`rib-${ybi}`} position={[0, 0, yb]} rotation={[0.3, 0, 0]}>
                    <torusGeometry args={[0.026, 0.005, 8, 12]} />
                    <meshStandardMaterial color="#9a3412" roughness={0.65} />
                  </mesh>
                ))}
              </group>
            ))
          )}
          {/* Binding Wire Ring Ties around bundle */}
          {[-0.30, 0.30].map((wz, wi) => (
            <mesh key={`wire-${wi}`} position={[0, 0, wz]}>
              <torusGeometry args={[0.095, 0.008, 8, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.3} />
            </mesh>
          ))}
        </group>

        {/* 2. Oxy-Torch Cut Structural H-Beam Offcuts with Melted Slag Dross Edges */}
        {[
          { pos: [0.30, 0.22, 0.15] as [number, number, number], rot: [0.1, -0.4, 0.05] as [number, number, number], l: 0.60, w: 0.24, h: 0.24 },
          { pos: [-0.05, 0.30, 0.22] as [number, number, number], rot: [-0.2, 0.5, 0.1] as [number, number, number], l: 0.50, w: 0.20, h: 0.20 },
        ].map((beam, bidx) => (
          <group key={`beam-${bidx}`} position={beam.pos} rotation={beam.rot}>
            {/* Top Flange */}
            <mesh position={[0, beam.h / 2, 0]}>
              <boxGeometry args={[beam.l, 0.022, beam.w]} />
              <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.52} />
            </mesh>
            {/* Bottom Flange */}
            <mesh position={[0, -beam.h / 2, 0]}>
              <boxGeometry args={[beam.l, 0.022, beam.w]} />
              <meshStandardMaterial color="#27272a" metalness={0.85} roughness={0.50} />
            </mesh>
            {/* Vertical Center Web */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[beam.l, beam.h - 0.03, 0.020]} />
              <meshStandardMaterial color="#1e293b" metalness={0.80} roughness={0.55} />
            </mesh>
            {/* Torch-Cut Melted Slag Dross at Cut Edge */}
            <mesh position={[beam.l / 2 + 0.002, 0, 0]}>
              <boxGeometry args={[0.016, beam.h * 1.02, beam.w * 1.02]} />
              <meshStandardMaterial color="#7c2d12" roughness={0.75} />
            </mesh>
          </group>
        ))}

        {/* 3. Structural Angle Iron (Baja Siku L) */}
        <group position={[0.20, 0.12, -0.28]} rotation={[-0.1, 0.3, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.55, 0.02, 0.12]} />
            <meshStandardMaterial color="#3f3f46" metalness={0.78} roughness={0.60} />
          </mesh>
          <mesh position={[0, 0.06, 0.05]}>
            <boxGeometry args={[0.55, 0.12, 0.02]} />
            <meshStandardMaterial color="#3f3f46" metalness={0.78} roughness={0.60} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// --- 4. DIGITAL FLOOR SCALE & HEAVY CRANE CHARGING SKIP ---
const StationFloorScaleAndSkip: React.FC<{
  position: [number, number, number];
  onOpenSequentialCharging?: (e: any) => void;
  onOpenScrapSorting?: (e: any) => void;
  scrapSortedDry?: boolean;
}> = ({ position, onOpenSequentialCharging, onOpenScrapSorting, scrapSortedDry = false }) => {
  return (
    <group position={position}>
      {/* Heavy Low-Profile Platform Floor Scale */}
      <group position={[0, 0, 0]}>
        {/* Yellow Safety Perimeter Ramp */}
        <mesh position={[0, 0.035, 0]}>
          <boxGeometry args={[1.56, 0.07, 1.56]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Checkered Steel Weighing Plate */}
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[1.42, 0.072, 1.42]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
        </mesh>
        {/* 4 Load Cell Corner Foot Mounts */}
        {[-0.65, 0.65].map((cx, ci) =>
          [-0.65, 0.65].map((cz, czi) => (
            <mesh key={`lc-${ci}-${czi}`} position={[cx, 0.025, cz]}>
              <cylinderGeometry args={[0.04, 0.04, 0.05, 12]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
            </mesh>
          ))
        )}

        {/* Pedestal Stand & Digital Weight Indicator Console (Positioned at front aisle for clear visibility) */}
        <group position={[0.95, 0, 0.65]}>
          {/* Heavy Steel Pedestal Column */}
          <mesh position={[0, 0.68, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 1.36, 16]} />
            <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Base Flange with Anchor Bolts */}
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.10, 0.10, 0.04, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* IP67 Stainless Enclosure Box (Facing +X towards furnace aisle) */}
          <mesh position={[0.04, 1.35, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.36, 0.24, 0.09]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.2} />
          </mesh>
          {/* Black Glass Display Bezel */}
          <mesh position={[0.088, 1.35, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.30, 0.18]} />
            <meshStandardMaterial color="#020617" roughness={0.1} />
          </mesh>
          {/* High-Contrast Emerald Green LED Readout */}
          <group position={[0.092, 1.35, 0]} rotation={[0, Math.PI / 2, 0]}>
            <Text position={[0, 0.050, 0]} fontSize={0.032} color="#94a3b8" fontWeight="bold">
              TIMBANGAN BATCH
            </Text>
            <Text position={[0, -0.015, 0]} fontSize={0.068} color="#10b981" fontWeight="bold">
              250.0 KG
            </Text>
            <Text position={[0.08, -0.054, 0]} fontSize={0.022} color="#34d399">
              NET OK
            </Text>
          </group>
        </group>
      </group>

      {/* --- HEAVY STEEL CRANE CHARGING SKIP (WADAH PENGISI BATCH 3 TAHAP) --- */}
      <group
        position={[0, 0.40, 0]}
        onClick={onOpenSequentialCharging}
      >
        {/* Main Welded Bucket Body (Heavy Steel Fabricated Tub) */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.08, 0.62, 0.92]} />
          <meshStandardMaterial color="#92400e" metalness={0.82} roughness={0.4} />
        </mesh>
        {/* Sloped Pouring Front Lip Chute (Corong Tuang) */}
        <mesh position={[0.56, 0.12, 0]} rotation={[0, 0, -0.38]}>
          <boxGeometry args={[0.32, 0.04, 0.88]} />
          <meshStandardMaterial color="#78350f" metalness={0.85} roughness={0.35} />
        </mesh>
        {/* Reinforced Top Rim Channel Angle */}
        <mesh position={[0, 0.31, 0]}>
          <boxGeometry args={[1.12, 0.05, 0.96]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
        </mesh>
        {/* Bucket Interior Cavity */}
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[0.96, 0.52, 0.80]} />
          <meshStandardMaterial color="#451a03" roughness={0.65} />
        </mesh>

        {/* Heavy Side Lifting Trunnions (Poros Angkat Crane) */}
        {[-0.49, 0.49].map((tz, ti) => (
          <group key={`trunnion-${ti}`} position={[0, 0.15, tz]} rotation={[Math.PI / 2, 0, 0]}>
            {/* Solid Trunnion Shaft */}
            <mesh>
              <cylinderGeometry args={[0.048, 0.048, 0.18, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.18} />
            </mesh>
            {/* Outer Safety Retaining Collar Disc */}
            <mesh position={[0, 0.09, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.025, 16]} />
            </mesh>
          </group>
        ))}

        {/* Crane Wire Rope 2-Leg Rigging Sling Hanging Above */}
        <group position={[0, 0.75, 0]}>
          {/* Top Master Link Oblong Ring */}
          <mesh position={[0, 0.50, 0]}>
            <torusGeometry args={[0.07, 0.015, 12, 24]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.18} />
          </mesh>
          {/* Two Wire Rope Legs to Trunnions */}
          {[-0.48, 0.48].map((wz, wi) => (
            <mesh
              key={`sling-${wi}`}
              position={[0, 0.22, wz * 0.5]}
              rotation={[wz > 0 ? 0.38 : -0.38, 0, 0]}
            >
              <cylinderGeometry args={[0.012, 0.012, 0.65, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.92} roughness={0.3} />
            </mesh>
          ))}
        </group>

        {/* --- AUTHENTIC BATCH CHARGE CONTENTS INSIDE SKIP --- */}
        <group position={[0, 0.15, 0]}>
          <mesh position={[-0.15, 0, -0.1]} rotation={[0.1, 0.3, 0]}>
            <boxGeometry args={[0.55, 0.12, 0.40]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.96} roughness={0.2} />
          </mesh>
          <mesh position={[0.18, 0.06, 0.12]} rotation={[-0.15, -0.4, 0.2]}>
            <boxGeometry args={[0.42, 0.10, 0.14]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.35} />
          </mesh>
          <mesh position={[0.05, 0.12, -0.18]} rotation={[0.3, 0.2, 0]}>
            <boxGeometry args={[0.12, 0.03, 0.12]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.12} />
          </mesh>
          <mesh position={[-0.05, 0.14, 0.16]} rotation={[0.4, -0.6, 0.2]}>
            <dodecahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.98} roughness={0.10} />
          </mesh>
        </group>

        {/* Stenciled Batch ID on Skip Face */}
        <group position={[0.545, -0.14, 0]} rotation={[0, Math.PI / 2, 0]}>
          <Text fontSize={0.044} color="#ffffff" fontWeight="bold">
            KERANJANG MUAT 3 TAHAP (250 KG)
          </Text>
          <Text position={[0, -0.055, 0]} fontSize={0.030} color="#38bdf8" fontWeight="bold">
            KLIK UNTUK SIMULASI PEMUATAN 3 TAHAP (ADEGAN 13)
          </Text>
        </group>
      </group>

      {/* --- DRYING BIN / MEJA KARANTINA SORTIR SKRAP BASAH & BEROLI (ADEGAN 12) --- */}
      <group
        position={[0.25, 0, 1.02]}
        onClick={onOpenScrapSorting}
      >
        <mesh position={[0, 0.30, 0]}>
          <boxGeometry args={[1.05, 0.60, 0.72]} />
          <meshStandardMaterial color={scrapSortedDry ? '#065f46' : '#991b1b'} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.61, 0]}>
          <boxGeometry args={[1.10, 0.04, 0.76]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        <group position={[0.535, 0.32, 0]} rotation={[0, Math.PI / 2, 0]}>
          <Text position={[0, 0.07, 0]} fontSize={0.042} color="#ffffff" fontWeight="bold">
            DRYING BIN (SORTIR SKRAP)
          </Text>
          <Text position={[0, -0.02, 0]} fontSize={0.030} color="#fde047" fontWeight="bold">
            {scrapSortedDry ? '✓ SKRAP 100% KERING & BEBAS OLI' : 'KLIK SORTIR AIR & OLI (ADEGAN 12)'}
          </Text>
        </group>
      </group>
    </group>
  );
};

// --- 5. PALLET ROW 1: FERRO CHROMIUM LOW CARBON (FeCr LC) ---
const PalletFeCrLC: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      <EuroPallet />

      {/* 3 Sealed Graphite Gray Drums + 1 OPEN DRUM showing crystalline FeCr lumps */}
      {[
        { pos: [-0.32, -0.32] as [number, number], open: false },
        { pos: [0.32, -0.32] as [number, number], open: false },
        { pos: [-0.32, 0.32] as [number, number], open: false },
        { pos: [0.32, 0.32] as [number, number], open: true }, // OPEN DRUM
      ].map((drum, di) => (
        <group key={`fecr-drum-${di}`} position={[drum.pos[0], 0.58, drum.pos[1]]}>
          {/* Main Drum Cylinder with Rolled Rib Chimes */}
          <mesh>
            <cylinderGeometry args={[0.26, 0.26, 0.86, 24]} />
            <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.35} />
          </mesh>
          {/* Drum Reinforcing Hoop Rings */}
          {[-0.16, 0.16].map((hy, hi) => (
            <mesh key={`hoop-${hi}`} position={[0, hy, 0]}>
              <cylinderGeometry args={[0.268, 0.268, 0.035, 24]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}

          {/* Stencil Code on Drum Belly (Facing +X towards furnace aisle) */}
          <group position={[0.265, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <Text fontSize={0.048} color="#f8fafc" fontWeight="bold">
              FeCr LC #068
            </Text>
            <Text position={[0, -0.05, 0]} fontSize={0.034} color="#38bdf8">
              NET 250 KG
            </Text>
          </group>

          {drum.open ? (
            /* --- REALISTIC OPEN DRUM WITH VISIBLE CRYSTALLINE CLEAVAGE LUMPS --- */
            <group>
              {/* Recessed Interior Cavity */}
              <mesh position={[0, 0.38, 0]}>
                <cylinderGeometry args={[0.245, 0.245, 0.12, 20]} />
                <meshStandardMaterial color="#1e293b" roughness={0.7} />
              </mesh>
              {/* Heap of Glistening Crystalline FeCr Rocks inside with Sparkling Facets */}
              <group position={[0, 0.36, 0]}>
                {[
                  { pos: [0, 0.04, 0] as [number, number, number], s: 0.10, rot: [0.2, 0.4, 0.1] as [number, number, number] },
                  { pos: [-0.08, 0.02, 0.07] as [number, number, number], s: 0.08, rot: [0.5, -0.3, 0.4] as [number, number, number] },
                  { pos: [0.08, 0.03, -0.06] as [number, number, number], s: 0.09, rot: [-0.2, 0.6, 0.3] as [number, number, number] },
                  { pos: [-0.06, 0.02, -0.08] as [number, number, number], s: 0.07, rot: [0.3, 0.8, -0.2] as [number, number, number] },
                  { pos: [0.07, 0.02, 0.08] as [number, number, number], s: 0.08, rot: [-0.4, -0.5, 0.1] as [number, number, number] },
                ].map((lump, li) => (
                  <mesh key={`lump-${li}`} position={lump.pos} rotation={lump.rot}>
                    <dodecahedronGeometry args={[lump.s, 0]} />
                    <meshStandardMaterial
                      color="#f8fafc"
                      metalness={0.98}
                      roughness={0.10}
                    />
                  </mesh>
                ))}
              </group>
              {/* Drum Lid Placed Tilted on Pallet Beside Drum */}
              <group position={[0.15, -0.42, 0.28]} rotation={[0.3, 0.2, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.265, 0.265, 0.02, 20]} />
                  <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
                </mesh>
                {/* Unbolted Drum Clamp Ring */}
                <mesh position={[0, 0.015, 0]}>
                  <torusGeometry args={[0.268, 0.012, 8, 24]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
                </mesh>
              </group>
              {/* Stainless Steel Sampling Scoop Resting on Rim */}
              <group position={[-0.16, 0.44, 0.12]} rotation={[0.2, -0.6, -0.3]}>
                <mesh>
                  <boxGeometry args={[0.14, 0.06, 0.20]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.96} roughness={0.18} />
                </mesh>
                <mesh position={[0, 0.04, -0.16]} rotation={[0.4, 0, 0]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.16, 8]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.25} />
                </mesh>
                <mesh position={[0, 0.02, 0.02]}>
                  <octahedronGeometry args={[0.035, 0]} />
                  <meshStandardMaterial color="#ffffff" metalness={0.98} roughness={0.10} />
                </mesh>
              </group>
            </group>
          ) : (
            /* Sealed Drum Head with Threaded Screw Bungs */
            <group position={[0, 0.435, 0]}>
              <mesh>
                <cylinderGeometry args={[0.262, 0.262, 0.02, 24]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
              </mesh>
              {/* 2" Screw Bung Plug */}
              <mesh position={[0.12, 0.015, 0]}>
                <cylinderGeometry args={[0.032, 0.032, 0.015, 12]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
};

// --- 6. PALLET ROW 2: PURE NICKEL (Ni 99.9%) IN COBALT-BLUE DRUMS ---
const PalletPureNickel: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      <EuroPallet />

      {/* 4 Royal Cobalt-Blue Steel Drums */}
      {[
        [-0.32, -0.32],
        [0.32, -0.32],
        [-0.32, 0.32],
        [0.32, 0.32],
      ].map(([dx, dz], di) => (
        <group key={`ni-drum-${di}`} position={[dx, 0.58, dz]}>
          {/* Cobalt Blue Drum Body */}
          <mesh>
            <cylinderGeometry args={[0.26, 0.26, 0.86, 24]} />
            <meshStandardMaterial color="#1e3a8a" metalness={0.78} roughness={0.28} />
          </mesh>
          {/* Rolling Hoops */}
          {[-0.16, 0.16].map((hy, hi) => (
            <mesh key={`hoop-${hi}`} position={[0, hy, 0]}>
              <cylinderGeometry args={[0.268, 0.268, 0.035, 24]} />
              <meshStandardMaterial color="#93c5fd" metalness={0.85} roughness={0.2} />
            </mesh>
          ))}
          {/* Sealed Top Lid with clamp */}
          <mesh position={[0, 0.435, 0]}>
            <cylinderGeometry args={[0.262, 0.262, 0.02, 24]} />
            <meshStandardMaterial color="#172554" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Specification Decal Stencil (Facing +X towards furnace aisle) */}
          <group position={[0.265, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <Text fontSize={0.044} color="#f8fafc" fontWeight="bold">
              PURE NICKEL 99.9%
            </Text>
            <Text position={[0, -0.05, 0]} fontSize={0.032} color="#fbbf24">
              CLASS 1 ELECTROLYTIC
            </Text>
          </group>
        </group>
      ))}

      {/* --- REAL-WORLD 1"x1" CUT CATHODE SQUARES & BRIQUETTES ON STAINLESS SAMPLING TRAY --- */}
      <group position={[0.42, 0.22, 0]}>
        {/* Stainless Steel Weighing Tray Pan */}
        <mesh>
          <boxGeometry args={[0.34, 0.035, 0.45]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.96} roughness={0.16} />
        </mesh>
        {/* Pile of 1" x 1" Cut Electrolytic Cathode Squares */}
        {[
          { pos: [-0.06, 0.025, -0.10] as [number, number, number], rot: [0, 0.2, 0] as [number, number, number] },
          { pos: [0.06, 0.025, -0.08] as [number, number, number], rot: [0, -0.3, 0] as [number, number, number] },
          { pos: [-0.02, 0.042, -0.06] as [number, number, number], rot: [0, 0.7, 0] as [number, number, number] },
          { pos: [0.04, 0.038, 0.04] as [number, number, number], rot: [0.1, 0.4, 0] as [number, number, number] },
          { pos: [-0.08, 0.025, 0.08] as [number, number, number], rot: [0, -0.5, 0] as [number, number, number] },
        ].map((sq, si) => (
          <mesh key={`sq-${si}`} position={sq.pos} rotation={sq.rot}>
            <boxGeometry args={[0.065, 0.015, 0.065]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.14} />
          </mesh>
        ))}
        {/* Pillow-Shaped Rounded Nickel Briquettes */}
        {[
          { pos: [0.08, 0.028, 0.12] as [number, number, number], rot: [0.2, 0.8, 0] as [number, number, number] },
          { pos: [-0.02, 0.030, 0.14] as [number, number, number], rot: [-0.1, 0.3, 0.2] as [number, number, number] },
        ].map((briq, bi) => (
          <mesh key={`briq-${bi}`} position={briq.pos} rotation={briq.rot}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.97} roughness={0.18} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// --- 7. PALLET ROW 3: CALCIUM SILICON (CaSi) FLUX & DEOXIDIZER ---
const PalletCaSiFlux: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      <EuroPallet />

      {/* 4 Hermetically Sealed Forest Green Steel Drums with Class 4.3 Hazard Diamond Placards */}
      {[
        [-0.32, -0.32],
        [0.32, -0.32],
        [-0.32, 0.32],
        [0.32, 0.32],
      ].map(([dx, dz], di) => (
        <group key={`casi-drum-${di}`} position={[dx, 0.58, dz]}>
          {/* Forest Green Drum Body */}
          <mesh>
            <cylinderGeometry args={[0.26, 0.26, 0.86, 24]} />
            <meshStandardMaterial color="#064e3b" metalness={0.72} roughness={0.35} />
          </mesh>
          {/* Chime Rings */}
          {[-0.16, 0.16].map((hy, hi) => (
            <mesh key={`hoop-${hi}`} position={[0, hy, 0]}>
              <cylinderGeometry args={[0.268, 0.268, 0.035, 24]} />
              <meshStandardMaterial color="#34d399" metalness={0.8} roughness={0.25} />
            </mesh>
          ))}
          {/* Sealed Lid */}
          <mesh position={[0, 0.435, 0]}>
            <cylinderGeometry args={[0.262, 0.262, 0.02, 24]} />
            <meshStandardMaterial color="#022c22" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Dual Threaded Bung Caps (2" & 3/4" Tri-Sure bungs) */}
          <mesh position={[0.12, 0.448, 0]}>
            <cylinderGeometry args={[0.030, 0.030, 0.016, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.2} />
          </mesh>
          <mesh position={[-0.12, 0.448, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.014, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.2} />
          </mesh>

          {/* CLASS 4.3 HAZARD DIAMOND PLACARD (Facing +X towards furnace aisle) */}
          <group position={[0.265, 0.06, 0]} rotation={[0, Math.PI / 2, Math.PI / 4]}>
            <mesh>
              <planeGeometry args={[0.11, 0.11]} />
              <meshStandardMaterial color="#0284c7" roughness={0.3} />
            </mesh>
          </group>
          {/* Hazard & Spec Text (Facing +X towards furnace aisle) */}
          <group position={[0.266, -0.06, 0]} rotation={[0, Math.PI / 2, 0]}>
            <Text fontSize={0.038} color="#f8fafc" fontWeight="bold">
              CaSi 30/60 FLUX
            </Text>
            <Text position={[0, -0.045, 0]} fontSize={0.026} color="#f87171" fontWeight="bold">
              DANGEROUS WHEN WET
            </Text>
          </group>
        </group>
      ))}
    </group>
  );
};

// --- 8. PALLET ROW 4: FERRO SILICON 75 & FERRO MANGANESE ---
const PalletFeSiAndFeMn: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      <EuroPallet />

      {/* 2 Drums FeSi 75 (Amber Bronze) */}
      {[-0.32, 0.32].map((dx, di) => (
        <group key={`fesi-${di}`} position={[dx, 0.58, -0.32]}>
          <mesh>
            <cylinderGeometry args={[0.26, 0.26, 0.86, 24]} />
            <meshStandardMaterial color="#78350f" metalness={0.72} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.435, 0]}>
            <cylinderGeometry args={[0.262, 0.262, 0.02, 24]} />
            <meshStandardMaterial color="#451a03" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* FeSi Drum Belly Stencil (Facing +X towards furnace aisle) */}
          <group position={[0.265, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <Text fontSize={0.046} color="#f8fafc" fontWeight="bold">
              FeSi 75% Si
            </Text>
            <Text position={[0, -0.05, 0]} fontSize={0.032} color="#fbbf24">
              NET 250 KG
            </Text>
          </group>
        </group>
      ))}

      {/* 2 Drums FeMn LC (Jet Charcoal Black) */}
      {[-0.32, 0.32].map((dx, di) => (
        <group key={`femn-${di}`} position={[dx, 0.58, 0.32]}>
          <mesh>
            <cylinderGeometry args={[0.26, 0.26, 0.86, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.80} roughness={0.30} />
          </mesh>
          <mesh position={[0, 0.435, 0]}>
            <cylinderGeometry args={[0.262, 0.262, 0.02, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* FeMn Drum Belly Stencil (Facing +X towards furnace aisle) */}
          <group position={[0.265, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <Text fontSize={0.046} color="#f8fafc" fontWeight="bold">
              FeMn LC ~78%
            </Text>
            <Text position={[0, -0.05, 0]} fontSize={0.032} color="#94a3b8">
              NET 250 KG
            </Text>
          </group>
        </group>
      ))}
    </group>
  );
};

// --- 9. PALLET ROW 5: KARUNG RECARBURIZER, DROSAN & RAMMING MASS ---
const PalletCarbonAndSlagAdditives: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      <EuroPallet />

      {/* --- REALISTIC MULTI-WALL KRAFT PAPER VALVE SACKS STACKED ON PALLET --- */}
      <group position={[0, 0, 0]}>
        {/* Layer 1: 4 Sacks Stacking Base */}
        {[
          { pos: [-0.28, 0.21, -0.26] as [number, number, number], rot: [0, 0.05, 0] as [number, number, number], type: 'carbon' },
          { pos: [0.28, 0.21, -0.26] as [number, number, number], rot: [0, -0.08, 0] as [number, number, number], type: 'carbon' },
          { pos: [-0.28, 0.21, 0.26] as [number, number, number], rot: [0, -0.04, 0] as [number, number, number], type: 'drosan' },
          { pos: [0.28, 0.21, 0.26] as [number, number, number], rot: [0, 0.06, 0] as [number, number, number], type: 'ramming' },
        ].map((sack, si) => (
          <group key={`sack-l1-${si}`} position={sack.pos} rotation={sack.rot}>
            {/* Pillowed Sack Body with rounded edges */}
            <mesh>
              <boxGeometry args={[0.52, 0.14, 0.38]} />
              <meshStandardMaterial
                color={sack.type === 'carbon' ? '#b45309' : sack.type === 'drosan' ? '#f8fafc' : '#059669'}
                roughness={0.88}
              />
            </mesh>
            {/* Sewn Closure Seam Bands */}
            {[-0.25, 0.25].map((sx, sxi) => (
              <mesh key={`seam-${sxi}`} position={[sx, 0, 0]}>
                <boxGeometry args={[0.02, 0.145, 0.385]} />
                <meshStandardMaterial color="#451a03" roughness={0.9} />
              </mesh>
            ))}
            {/* Stenciled Sack Print (Facing readable from furnace aisle) */}
            <group position={[0, 0.072, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
              <Text fontSize={0.038} color={sack.type === 'drosan' ? '#1e3a8a' : '#ffffff'} fontWeight="bold">
                {sack.type === 'carbon' ? 'GRAPHITE RECARBURIZER' : sack.type === 'drosan' ? 'SLAG COAGULANT (DROSAN)' : 'SILICA RAMMING MASS'}
              </Text>
              <Text position={[0, -0.04, 0]} fontSize={0.026} color={sack.type === 'drosan' ? '#0f172a' : '#fef08a'}>
                {sack.type === 'carbon' ? 'FIXED C: 98.5% • 25 KG' : sack.type === 'drosan' ? 'PERLITE BASE • 20 KG' : 'SiO2 98.5% • LINING 25 KG'}
              </Text>
            </group>
          </group>
        ))}

        {/* Layer 2: Cross-Stacked Sacks */}
        {[
          { pos: [0, 0.35, -0.26] as [number, number, number], rot: [0, Math.PI / 2 + 0.05, 0] as [number, number, number], type: 'carbon' },
          { pos: [0, 0.35, 0.26] as [number, number, number], rot: [0, Math.PI / 2 - 0.04, 0] as [number, number, number], type: 'drosan' },
        ].map((sack, si) => (
          <group key={`sack-l2-${si}`} position={sack.pos} rotation={sack.rot}>
            <mesh>
              <boxGeometry args={[0.52, 0.14, 0.38]} />
              <meshStandardMaterial
                color={sack.type === 'carbon' ? '#b45309' : '#f8fafc'}
                roughness={0.88}
              />
            </mesh>
            <group position={[0, 0.072, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <Text fontSize={0.040} color={sack.type === 'drosan' ? '#1e3a8a' : '#ffffff'} fontWeight="bold">
                {sack.type === 'carbon' ? 'GRAPHITE RECARBURIZER' : 'SLAG COAGULANT'}
              </Text>
              <Text position={[0, -0.04, 0]} fontSize={0.028} color={sack.type === 'drosan' ? '#0f172a' : '#fef08a'}>
                {sack.type === 'carbon' ? 'NET WT 25 KG' : 'NET WT 20 KG'}
              </Text>
            </group>
          </group>
        ))}

        {/* Layer 3: Top Open Slit Sack with Spilled Glistening Carbon Granules */}
        <group position={[0, 0.49, 0]} rotation={[0, 0.15, 0]}>
          <mesh>
            <boxGeometry args={[0.50, 0.13, 0.36]} />
            <meshStandardMaterial color="#b45309" roughness={0.88} />
          </mesh>
          {/* Slit in Bag Top */}
          <mesh position={[0.08, 0.068, 0]}>
            <boxGeometry args={[0.18, 0.015, 0.12]} />
            <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Glistening Carbon / Graphite Granules Heap */}
          <mesh position={[0.08, 0.08, 0]}>
            <dodecahedronGeometry args={[0.055, 0]} />
            <meshStandardMaterial color="#18181b" roughness={0.35} metalness={0.8} />
          </mesh>
          {/* Hand Dispenser Scoop */}
          <group position={[0.18, 0.09, 0.05]} rotation={[0.4, 0.2, -0.5]}>
            <mesh>
              <boxGeometry args={[0.06, 0.03, 0.09]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.02, -0.07]} rotation={[0.5, 0, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.08, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

// --- 10. HYDRAULIC HAND PALLET TRUCK (PALLET JACK KUNING INDUSTRI) ---
const HydraulicPalletJack: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
  position,
  rotation = [0, 0, 0],
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* 1. Heavy Fabricated Dual Forks (Safety Yellow Powder-Coated Steel) */}
      {[-0.20, 0.20].map((fz, fi) => (
        <group key={`fork-${fi}`} position={[0.55, 0.075, fz]}>
          {/* Main Tapered C-Channel Fork */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.10, 0.05, 0.15]} />
            <meshStandardMaterial color="#eab308" roughness={0.35} metalness={0.65} />
          </mesh>
          {/* Entry/Exit Nose Ramp Taper */}
          <mesh position={[0.57, -0.012, 0]} rotation={[0, 0, -0.32]}>
            <boxGeometry args={[0.08, 0.035, 0.15]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Tandem Front Polyurethane Load Rollers */}
          <mesh position={[0.48, -0.040, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.075, 16]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* 2. Reinforced Rear A-Frame Transverse Crosshead Beam */}
      <mesh position={[0.02, 0.11, 0]}>
        <boxGeometry args={[0.18, 0.12, 0.55]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* 3. Cast Iron Hydraulic Pump & Swivel Turntable Housing */}
      <group position={[-0.10, 0.16, 0]}>
        {/* Main Pump Reservoir Body */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 0.22, 18]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.8} />
        </mesh>
        {/* Polished Hard-Chrome Hydraulic Lift Ram Piston */}
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.14, 16]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.08} />
        </mesh>
        {/* Foot Pumping Pedal / Valve Block */}
        <mesh position={[-0.10, 0.02, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.08, 0.025, 0.05]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>

        {/* Dual Rear Steering Wheels mounted on underside swivel hub */}
        {[-0.11, 0.11].map((wy, wi) => (
          <mesh key={`steer-wheel-${wi}`} position={[0, -0.08, wy]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.05, 18]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
        ))}

        {/* 4. Ergonomic Operating Drawbar / Tiller Handle */}
        <group position={[0, 0.24, 0]} rotation={[0, 0, -0.42]}>
          {/* Main Drawbar Tube */}
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.018, 0.020, 0.84, 14]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Heavy Base Pivot Joint & Return Spring */}
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.06, 14]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Top Loop Handle - Industrial D-Shaped Loop */}
          <group position={[0, 0.84, 0]}>
            {/* Horizontal Grip Bar */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.28, 14]} />
              <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Left & Right Side Handle Uprights */}
            {[-0.13, 0.13].map((hx, hi) => (
              <mesh key={`h-up-${hi}`} position={[0, -0.06, hx]}>
                <cylinderGeometry args={[0.014, 0.014, 0.12, 12]} />
                <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.4} />
              </mesh>
            ))}
            {/* Rubber Grip Coating on Top Crossbar */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.020, 0.020, 0.18, 14]} />
              <meshStandardMaterial color="#020617" roughness={0.8} />
            </mesh>
            {/* 3-Position Finger Trigger Release Lever (Raise - Neutral - Lower) */}
            <mesh position={[0.025, -0.04, 0.04]} rotation={[0, 0, 0.35]}>
              <boxGeometry args={[0.012, 0.06, 0.018]} />
              <meshStandardMaterial color="#dc2626" roughness={0.4} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

// --- MAIN INTEGRATED RAW MATERIAL DEPOT COMPONENT ---
export interface RawMaterialDepotProps {
  isLiteMode?: boolean;
}

export const RawMaterialDepot: React.FC<RawMaterialDepotProps> = ({ isLiteMode = false }) => {
  const setMeltingJobSheetOpen = useSimStore((s) => s.setMeltingJobSheetOpen);
  const setScrapSortingModalOpen = useSimStore((s) => s.setScrapSortingModalOpen);
  const setSequentialChargingModalOpen = useSimStore((s) => s.setSequentialChargingModalOpen);
  const scrapSortedDry = useSimStore((s) => s.scrapSortedDry);
  const furnaceMetalMassKg = useSimStore((s) => s.furnaceMetalMassKg);
  const setActiveHoverObject = useSimStore((s) => s.setActiveHoverObject);

  const handleOpenJobSheet = (e: any) => {
    e.stopPropagation();
    inductionAudio.resume();
    inductionAudio.playClick();
    setMeltingJobSheetOpen(true);
  };

  const handleSortScrapBin = (e: any) => {
    e.stopPropagation();
    inductionAudio.resume();
    inductionAudio.playClank();
    setScrapSortingModalOpen(true);
  };

  const handleOpenSequentialCharging = (e: any) => {
    e.stopPropagation();
    inductionAudio.resume();
    inductionAudio.playClick();
    setSequentialChargingModalOpen(true);
  };

  // ===========================================================================
  // LITE MODE (MOBILE-OPTIMIZED LOW-POLY RAW MATERIAL DEPOT, SCALE & DRYING BIN)
  // ===========================================================================
  if (isLiteMode) {
    return (
      <group name="RawMaterialDepot_Lite" position={[-10.35, 0, 1.40]}>
        {/* Safety Demarcation Floor Pad */}
        <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.20, 14.20]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        <mesh position={[1.62, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.10, 14.20]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>

        {/* Back Retaining Wall & Depot Header Signboard */}
        <group position={[-1.50, 0, 0]}>
          <mesh position={[0, 1.15, 0]}>
            <boxGeometry args={[0.16, 2.30, 14.0]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          <group position={[0.10, 2.05, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <planeGeometry args={[7.2, 0.38]} />
              <meshBasicMaterial color="#0284c7" />
            </mesh>
            <Text position={[0, 0, 0.01]} fontSize={0.14} color="#ffffff" fontWeight="bold">
              DEPO BAHAN BAKU, TIMBANGAN &amp; FORMULASI (250 KG)
            </Text>
          </group>
        </group>

        {/* 1. BUNKER 01: PIG IRON / BESI KASAR (Z = -5.2m) */}
        <group
          position={[0, 0, -5.2]}
          onClick={handleOpenJobSheet}
          onPointerOver={(e) => {
            e.stopPropagation();
            setActiveHoverObject('Bunker 01: Pig Iron (Klik untuk Formulasi & Muat Bahan)');
          }}
          onPointerOut={() => setActiveHoverObject(null)}
        >
          <mesh position={[0, 0.45, -0.85]}>
            <boxGeometry args={[2.5, 0.9, 0.14]} />
            <meshStandardMaterial color="#475569" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.45, 0.85]}>
            <boxGeometry args={[2.5, 0.9, 0.14]} />
            <meshStandardMaterial color="#475569" roughness={0.85} />
          </mesh>
          <mesh position={[1.22, 0.12, 0]}>
            <boxGeometry args={[0.12, 0.24, 1.7]} />
            <meshBasicMaterial color="#ca8a04" />
          </mesh>
          {/* Low-Poly Pig Iron Ingots Pile */}
          <mesh position={[-0.2, 0.16, -0.25]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[0.9, 0.28, 0.55]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.35} />
          </mesh>
          <mesh position={[0.25, 0.14, 0.22]} rotation={[0, -0.3, 0]}>
            <boxGeometry args={[0.8, 0.24, 0.5]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[-0.05, 0.34, 0.0]} rotation={[0.1, 0.4, 0]}>
            <boxGeometry args={[0.65, 0.20, 0.42]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.25} />
          </mesh>
          <Text
            position={[-1.38, 1.32, 0]}
            rotation={[0, Math.PI / 2, 0]}
            fontSize={0.085}
            color="#38bdf8"
            fontWeight="bold"
          >
            BUNKER 01: PIG IRON (STARTING BLOCK)
          </Text>
        </group>

        {/* 2. BUNKER 02: RETURN SCRAP FC 250 / FCD 500 (Z = -3.3m) */}
        <group
          position={[0, 0, -3.3]}
          onClick={handleOpenJobSheet}
          onPointerOver={(e) => {
            e.stopPropagation();
            setActiveHoverObject('Bunker 02: Return Scrap FC/FCD (Klik untuk Formulasi & Muat Bahan)');
          }}
          onPointerOut={() => setActiveHoverObject(null)}
        >
          <mesh position={[0, 0.45, 0.85]}>
            <boxGeometry args={[2.5, 0.9, 0.14]} />
            <meshStandardMaterial color="#475569" roughness={0.85} />
          </mesh>
          <mesh position={[1.22, 0.12, 0]}>
            <boxGeometry args={[0.12, 0.24, 1.7]} />
            <meshBasicMaterial color="#ca8a04" />
          </mesh>
          {/* Low-Poly Return Sprues & Risers */}
          <mesh position={[-0.15, 0.18, -0.15]} rotation={[0.2, 0.5, 0]}>
            <cylinderGeometry args={[0.18, 0.24, 0.36, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0.25, 0.15, 0.2]} rotation={[0, -0.4, 0]}>
            <boxGeometry args={[0.85, 0.22, 0.45]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.4} />
          </mesh>
          <Text
            position={[-1.38, 1.32, 0]}
            rotation={[0, Math.PI / 2, 0]}
            fontSize={0.085}
            color="#facc15"
            fontWeight="bold"
          >
            BUNKER 02: RETURN SCRAP (FC / FCD)
          </Text>
        </group>

        {/* 3. BUNKER 03: STEEL SCRAP / SKRAP BAJA (Z = -1.4m) */}
        <group
          position={[0, 0, -1.4]}
          onClick={handleOpenJobSheet}
          onPointerOver={(e) => {
            e.stopPropagation();
            setActiveHoverObject('Bunker 03: Steel Scrap / Skrap Baja (Klik untuk Formulasi & Muat Bahan)');
          }}
          onPointerOut={() => setActiveHoverObject(null)}
        >
          <mesh position={[0, 0.45, 0.85]}>
            <boxGeometry args={[2.5, 0.9, 0.14]} />
            <meshStandardMaterial color="#475569" roughness={0.85} />
          </mesh>
          <mesh position={[1.22, 0.12, 0]}>
            <boxGeometry args={[0.12, 0.24, 1.7]} />
            <meshBasicMaterial color="#ca8a04" />
          </mesh>
          {/* Low-Poly Steel Scrap Beams & Plates */}
          <mesh position={[-0.1, 0.16, -0.1]} rotation={[0, 0.35, 0]}>
            <boxGeometry args={[0.95, 0.26, 0.55]} />
            <meshStandardMaterial color="#78350f" metalness={0.6} roughness={0.55} />
          </mesh>
          <mesh position={[0.2, 0.28, 0.15]} rotation={[0.1, -0.25, 0]}>
            <boxGeometry args={[0.75, 0.18, 0.42]} />
            <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.4} />
          </mesh>
          <Text
            position={[-1.38, 1.32, 0]}
            rotation={[0, Math.PI / 2, 0]}
            fontSize={0.085}
            color="#fb923c"
            fontWeight="bold"
          >
            BUNKER 03: STEEL SCRAP (SKRAP BAJA)
          </Text>
        </group>

        {/* 4. DIGITAL FLOOR WEIGHING SCALE & CHARGING SKIP BUCKET (Z = +0.7m) */}
        <group
          position={[0.05, 0, 0.7]}
          onClick={handleOpenJobSheet}
          onPointerOver={(e) => {
            e.stopPropagation();
            setActiveHoverObject('Timbangan Platform Digital 250 kg & Keranjang Muat (Klik untuk Buka Melting Job Sheet)');
          }}
          onPointerOut={() => setActiveHoverObject(null)}
        >
          {/* Yellow Safety Scale Frame & Steel Platform */}
          <mesh position={[0, 0.035, 0]}>
            <boxGeometry args={[1.55, 0.07, 1.55]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
          <mesh position={[0, 0.048, 0]}>
            <boxGeometry args={[1.40, 0.07, 1.40]} />
            <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.35} />
          </mesh>

          {/* Charging Skip Bucket on Scale (Click to open 3-Stage Sequential Charging) */}
          <mesh
            position={[0, 0.36, 0]}
            onClick={handleOpenSequentialCharging}
            onPointerOver={(e) => {
              e.stopPropagation();
              setActiveHoverObject('Keranjang Muat (Skip Bucket) 250 kg — Klik untuk Simulasi Pemuatan 3 Tahap (Adegan 13)');
            }}
            onPointerOut={() => setActiveHoverObject(null)}
          >
            <boxGeometry args={[1.02, 0.56, 0.88]} />
            <meshStandardMaterial color="#92400e" metalness={0.7} roughness={0.45} />
          </mesh>
          {/* Metal Charge Inside Bucket */}
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[0.86, 0.22, 0.72]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
          </mesh>

          {/* Digital Scale Pedestal & Emerald Green Readout Display */}
          <group position={[0.92, 0, 0.62]}>
            <mesh position={[0, 0.68, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 1.36, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
            <mesh position={[0.04, 1.35, 0]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.42, 0.26, 0.08]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <group position={[0.085, 1.35, 0]} rotation={[0, Math.PI / 2, 0]}>
              <Text position={[0, 0.055, 0]} fontSize={0.034} color="#38bdf8" fontWeight="bold">
                TIMBANGAN PLATFORM
              </Text>
              <Text position={[0, -0.015, 0]} fontSize={0.068} color="#4ade80" fontWeight="bold">
                {furnaceMetalMassKg > 0 ? `${furnaceMetalMassKg.toFixed(0)} KG` : '250.0 KG'}
              </Text>
              <Text position={[0, -0.068, 0]} fontSize={0.024} color="#facc15" fontWeight="bold">
                KLIK ATUR FORMULASI
              </Text>
            </group>
          </group>
        </group>

        {/* 5. DRYING BIN / KOTAK KARANTINA SKRAP BASAH (Z = +2.3m, Adegan 4.2 Anti Steam Explosion) */}
        <group
          position={[0.15, 0, 2.3]}
          onClick={handleSortScrapBin}
          onPointerOver={(e) => {
            e.stopPropagation();
            setActiveHoverObject('Drying Bin • Karantina Skrap Basah (Klik untuk Sortir Skrap Bebas Air - Adegan 4.2)');
          }}
          onPointerOut={() => setActiveHoverObject(null)}
        >
          <mesh position={[0, 0.32, 0]}>
            <boxGeometry args={[1.15, 0.64, 0.95]} />
            <meshStandardMaterial color={scrapSortedDry ? '#065f46' : '#991b1b'} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.65, 0]}>
            <boxGeometry args={[1.20, 0.04, 1.00]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
          <group position={[0.585, 0.34, 0]} rotation={[0, Math.PI / 2, 0]}>
            <Text position={[0, 0.08, 0]} fontSize={0.048} color="#ffffff" fontWeight="bold">
              DRYING BIN (SKRAP BASAH)
            </Text>
            <Text position={[0, -0.02, 0]} fontSize={0.035} color="#fde047" fontWeight="bold">
              {scrapSortedDry ? '✓ SKRAP 100% KERING AMAN' : 'KLIK SORTIR BEBAS AIR (ADEGAN 4.2)'}
            </Text>
          </group>
        </group>

        {/* 6. FERROALLOY & RECARBURIZER PALLETS (Carburizer, FeSi 75, FeMn, FeSiMg) (Z = +4.0m) */}
        <group
          position={[0.0, 0, 4.0]}
          onClick={handleOpenJobSheet}
          onPointerOver={(e) => {
            e.stopPropagation();
            setActiveHoverObject('Palet Bahan Imbuh: Carburizer, FeSi 75, FeMn & Inoculant FeSiMg (Klik untuk Buka Job Sheet)');
          }}
          onPointerOut={() => setActiveHoverObject(null)}
        >
          {/* Wooden Pallet Base */}
          <mesh position={[0, 0.07, 0]}>
            <boxGeometry args={[1.30, 0.14, 1.80]} />
            <meshStandardMaterial color="#854d0e" roughness={0.85} />
          </mesh>
          {/* 4 Alloy Drums (FeSi 75, FeMn, FeSiMg, Carburizer) */}
          {[
            { pos: [-0.32, 0.52, -0.45] as [number, number, number], color: '#0284c7', label: 'FeSi 75' },
            { pos: [0.32, 0.52, -0.45] as [number, number, number], color: '#0d9488', label: 'FeSiMg' },
            { pos: [-0.32, 0.52, 0.45] as [number, number, number], color: '#475569', label: 'FeMn' },
            { pos: [0.32, 0.52, 0.45] as [number, number, number], color: '#b45309', label: 'CARBURIZER' },
          ].map((d, i) => (
            <group key={`lite-drum-${i}`} position={d.pos}>
              <mesh>
                <cylinderGeometry args={[0.25, 0.25, 0.78, 12]} />
                <meshStandardMaterial color={d.color} metalness={0.5} roughness={0.4} />
              </mesh>
              <Text
                position={[0.26, 0, 0]}
                rotation={[0, Math.PI / 2, 0]}
                fontSize={0.048}
                color="#ffffff"
                fontWeight="bold"
              >
                {d.label}
              </Text>
            </group>
          ))}
        </group>
      </group>
    );
  }

  return (
    <group
      name="RawMaterialDepot"
      position={[-10.35, 0, 1.40]}
      onClick={handleOpenJobSheet}
    >
      {/* Safety Demarcation Boundary Lines around entire Raw Materials Complex */}
      <mesh position={[1.65, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12, 15.60]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>
      <mesh position={[0, 0.003, -7.80]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.30, 0.12]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>
      <mesh position={[0, 0.003, 7.80]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.30, 0.12]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>

      {/* Armored Concrete Floor Pad */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.20, 15.40]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* Back Retaining Wall along building perimeter with Stencil Board */}
      <group position={[-1.55, 0, 0]}>
        <mesh position={[0, 1.20, 0]}>
          <boxGeometry args={[0.20, 2.40, 15.40]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>

        {/* Wall Identification Signboard (Facing +X towards factory aisle) */}
        <group position={[0.12, 2.15, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <boxGeometry args={[8.0, 0.42, 0.04]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.25} />
          </mesh>
          <Text position={[0, 0, 0.025]} fontSize={0.16} color="#f8fafc" fontWeight="bold">
            DEPO BAHAN BAKU PELEBURAN
          </Text>
        </group>
      </group>

      {/* 1. BUNKER 01: SCRAP SUS 310 (Z = -6.0m) */}
      <BunkerSUS310Scrap position={[0, 0, -6.0]} />

      {/* 2. BUNKER 02: RETURN SCRAP SUS 310 (Rt) (Z = -4.0m) */}
      <BunkerReturnScrap position={[0, 0, -4.0]} />

      {/* 3. BUNKER 03: SCRAP BAJA KARBON (Z = -2.0m) */}
      <BunkerCarbonScrap position={[0, 0, -2.0]} />

      {/* 4. STASIUN TIMBANGAN LANTAI DIGITAL, CHARGING SKIP & DRYING BIN (Z = 0.0m) */}
      <StationFloorScaleAndSkip
        position={[0, 0, 0.0]}
        onOpenSequentialCharging={handleOpenSequentialCharging}
        onOpenScrapSorting={handleSortScrapBin}
        scrapSortedDry={scrapSortedDry}
      />

      {/* 5. PALLET ROW 1: FERRO CHROMIUM LOW CARBON (FeCr LC) (Z = 1.9m) */}
      <PalletFeCrLC position={[0, 0, 1.90]} />

      {/* 6. PALLET ROW 2: PURE NICKEL BRIQUETTES & CATHODES (Ni) (Z = 3.4m) */}
      <PalletPureNickel position={[0, 0, 3.40]} />

      {/* 7. PALLET ROW 3: CALCIUM SILICON (CaSi) (Z = 4.8m) */}
      <PalletCaSiFlux position={[0, 0, 4.80]} />

      {/* 8. PALLET ROW 4: FERRO SILICON 75 & FERRO MANGANESE (Z = 6.2m) */}
      <PalletFeSiAndFeMn position={[0, 0, 6.20]} />

      {/* 9. PALLET ROW 5: KARUNG RECARBURIZER, DROSAN & RAMMING MASS (Z = 7.3m) */}
      <PalletCarbonAndSlagAdditives position={[0, 0, 7.30]} />

      {/* 10. HYDRAULIC HAND PALLET TRUCK (Z = 4.0m) */}
      <HydraulicPalletJack position={[1.15, 0, 4.0]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
};

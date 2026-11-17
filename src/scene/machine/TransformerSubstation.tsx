import React, { useState } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

interface TransformerSubstationProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Dedicated Induction Furnace Substation & Step-Down Transformer (Trafo Peleburan 400 kVA).
 * - Converts 20 kV Medium Voltage grid power down to 380V/660V for the GW Induction Power Cabinet.
 * - Heavy transformer tank with oil conservator drum, cooling radiator fins, and high-voltage ceramic bushings.
 * - Enclosed safety cage with high-voltage warning plaques.
 * - Interactive Main Circuit Isolator Switch / VCB lever that toggles facility master power!
 */
export const TransformerSubstation: React.FC<TransformerSubstationProps> = ({
  position = [-8.5, 0, -12.0],
  rotation = [0, 0, 0],
}) => {
  const transformerBreakerOn = useSimStore((s) => s.transformerBreakerOn);
  const toggleTransformerBreaker = useSimStore((s) => s.toggleTransformerBreaker);
  const setActiveHoverObject = useSimStore((s) => s.setActiveHoverObject);

  const [hoveredLever, setHoveredLever] = useState(false);
  const [hoveredTrip, setHoveredTrip] = useState(false);

  const handleToggleBreaker = (e: any) => {
    e.stopPropagation();
    inductionAudio.playClick();
    toggleTransformerBreaker();
  };

  const handleEmergencyTrip = (e: any) => {
    e.stopPropagation();
    inductionAudio.playClick();
    if (transformerBreakerOn) {
      toggleTransformerBreaker();
    }
  };

  const steelMat = { color: '#334155', metalness: 0.8, roughness: 0.3 };
  const tankMat = { color: '#64748b', metalness: 0.65, roughness: 0.35 };
  const radiatorMat = { color: '#334155', metalness: 0.75, roughness: 0.4 };
  const copperMat = { color: '#b45309', metalness: 0.9, roughness: 0.2 };
  const porcelainMat = { color: '#7c2d12', roughness: 0.2, metalness: 0.1 };
  const fenceWireMat = { color: '#94a3b8', wireframe: true, side: THREE.DoubleSide };

  return (
    <group position={position} rotation={rotation} name="TransformerSubstation">
      {/* ========================================================================= */}
      {/* 0. HIGH VOLTAGE 20kV INCOMER FEED FROM POWER GRID (Dinding Belakang Masif) */}
      {/* ========================================================================= */}
      <group position={[0, 0, 0]}>
        {/* Overhead Heavy Cable Tray extending from Rear Wall (z = -3.0) to Bushings (z = 0.35) */}
        <mesh position={[0, 4.4, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[1.1, 3.4, 0.10]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
        </mesh>
        {/* Cable Tray Side Rails & Brackets */}
        {[-0.55, 0.55].map((sx, si) => (
          <mesh key={`tray-rail-${si}`} position={[sx, 4.48, -1.3]}>
            <boxGeometry args={[0.04, 0.16, 3.4]} />
            <meshStandardMaterial color="#475569" metalness={0.85} />
          </mesh>
        ))}
        {/* Tray Cross Rungs */}
        {[-2.8, -2.2, -1.6, -1.0, -0.4, 0.2].map((rz, ri) => (
          <mesh key={`rung-${ri}`} position={[0, 4.42, rz]}>
            <boxGeometry args={[1.05, 0.03, 0.06]} />
            <meshStandardMaterial color="#475569" metalness={0.9} />
          </mesh>
        ))}

        {/* 3 Heavy High-Voltage 20kV Armored Feeder Cables (Phase R, S, T) */}
        {[-0.45, 0, 0.45].map((cx, ci) => (
          <group key={`hvcable-${ci}`}>
            {/* Horizontal run along overhead cable tray */}
            <mesh position={[cx, 4.46, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 3.4, 16]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
            {/* Clean 90-degree vertical drop down to ceramic bushing terminal */}
            <mesh position={[cx, 3.30, 0.35]}>
              <cylinderGeometry args={[0.032, 0.032, 2.3, 16]} />
              <meshStandardMaterial color="#020617" roughness={0.7} />
            </mesh>
            {/* Cast-resin Pothead Termination / Cable Head Collar */}
            <mesh position={[cx, 2.22, 0.35]}>
              <cylinderGeometry args={[0.055, 0.045, 0.14, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Overhead High-Voltage Warning Sign Board */}
        <group position={[0, 4.9, -1.3]}>
          <mesh>
            <boxGeometry args={[2.5, 0.55, 0.04]} />
            <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[2.4, 0.48]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          <Text
            position={[0, 0.07, 0.03]}
            fontSize={0.12}
            color="#facc15"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            ⚡ PLN 20.000 V • GARDU INDUK SUBSTATION
          </Text>
          <Text
            position={[0, -0.11, 0.03]}
            fontSize={0.075}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
          >
            SUMBER LISTRIK TEGANGAN MENENGAH PABRIK
          </Text>
        </group>
      </group>

      {/* 1. Concrete Foundation Plinth with Hazard Yellow-Black Border */}
      <mesh position={[0, 0.15, 0.15]}>
        <boxGeometry args={[3.4, 0.30, 3.1]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>

      {/* 2. Heavy Galvanized Chain-Link Security Enclosure */}
      {/* Structural Steel Corner & Mid Posts */}
      {[
        [-1.68, -1.38],
        [1.68, -1.38],
        [-1.68, 1.38],
        [1.68, 1.38],
        [-1.68, 0],
        [1.68, 0],
      ].map(([px, pz], pi) => (
        <group key={`fence-post-${pi}`} position={[px, 1.25, pz]}>
          <mesh>
            <boxGeometry args={[0.07, 2.2, 0.07]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[0, 1.12, 0]}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      ))}
      {/* Top & Bottom Horizontal Rail Bars */}
      {[0.35, 2.30].map((ry, ri) => (
        <React.Fragment key={`rail-bar-${ri}`}>
          <mesh position={[0, ry, -1.38]}>
            <boxGeometry args={[3.36, 0.04, 0.04]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[-1.68, ry, 0]}>
            <boxGeometry args={[0.04, 0.04, 2.76]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[1.68, ry, 0]}>
            <boxGeometry args={[0.04, 0.04, 2.76]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </React.Fragment>
      ))}

      {/* Chain-Link Wire Mesh Screens */}
      {/* Back screen */}
      <mesh position={[0, 1.32, -1.38]}>
        <planeGeometry args={[3.3, 1.9]} />
        <meshStandardMaterial {...fenceWireMat} />
      </mesh>
      {/* Left screen */}
      <mesh position={[-1.68, 1.32, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.7, 1.9]} />
        <meshStandardMaterial {...fenceWireMat} />
      </mesh>
      {/* Right screen */}
      <mesh position={[1.68, 1.32, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.7, 1.9]} />
        <meshStandardMaterial {...fenceWireMat} />
      </mesh>
      {/* Front Gate Left & Right Wire Mesh Wings */}
      <mesh position={[-1.1, 1.32, 1.38]}>
        <planeGeometry args={[1.0, 1.9]} />
        <meshStandardMaterial {...fenceWireMat} />
      </mesh>
      <mesh position={[1.1, 1.32, 1.38]}>
        <planeGeometry args={[1.0, 1.9]} />
        <meshStandardMaterial {...fenceWireMat} />
      </mesh>

      {/* 3. Main Transformer Oil Tank Body (Industrial Transformer Grey RAL 7035) */}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[1.7, 1.4, 1.3]} />
        <meshStandardMaterial {...tankMat} />
      </mesh>
      {/* Tank Top Stiffener Flange Rim */}
      <mesh position={[0, 1.83, 0]}>
        <boxGeometry args={[1.76, 0.05, 1.36]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      {/* Tank Lifting Lugs */}
      {[-0.82, 0.82].map((lx, li) => (
        <group key={`lug-${li}`} position={[lx, 1.80, 0]}>
          <mesh>
            <boxGeometry args={[0.04, 0.12, 0.16]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Radiator Cooling Fins (Left and Right Sides - Charcoal Grey contrast) */}
      {[-1, 1].map((side) => (
        <group key={`rad-${side}`} position={[side * 0.98, 1.15, 0]}>
          {[-0.45, -0.25, -0.05, 0.15, 0.35].map((rz, ri) => (
            <mesh key={`fin-${ri}`} position={[0, 0, rz]}>
              <boxGeometry args={[0.26, 1.1, 0.04]} />
              <meshStandardMaterial {...radiatorMat} />
            </mesh>
          ))}
          {/* Top & Bottom Header Pipes */}
          <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.1, 16]} />
            <meshStandardMaterial {...steelMat} />
          </mesh>
          <mesh position={[0, -0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.1, 16]} />
            <meshStandardMaterial {...steelMat} />
          </mesh>
        </group>
      ))}

      {/* 4. Top Oil Conservator Drum (Tangki Konservator Oli) & Buchholz Relay */}
      <group position={[0, 2.05, -0.1]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 1.4, 24]} />
          <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.35} />
        </mesh>
        {/* Conservator support brackets */}
        {[-0.45, 0.45].map((bx, bi) => (
          <mesh key={`bkt-${bi}`} position={[bx, -0.10, 0]}>
            <boxGeometry args={[0.06, 0.25, 0.08]} />
            <meshStandardMaterial {...steelMat} />
          </mesh>
        ))}
        {/* Oil level sight glass gauge with MIN/NORM/MAX markings */}
        <group position={[0.68, 0, 0.23]}>
          <mesh>
            <cylinderGeometry args={[0.022, 0.022, 0.26, 12]} />
            <meshStandardMaterial color="#fef08a" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, 0.08, 0.02]}>
            <boxGeometry args={[0.03, 0.005, 0.005]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[0.03, 0.005, 0.005]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
          <mesh position={[0, -0.08, 0.02]}>
            <boxGeometry args={[0.03, 0.005, 0.005]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>

      {/* BUCHHOLZ RELAY (Proteksi Gas & Arc Internal Trafo Antara Tangki Utama dan Konservator) */}
      <group position={[0, 1.94, 0.03]}>
        {/* Main Angled Connecting Pipe */}
        <mesh position={[0, 0, 0]} rotation={[0.45, 0, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 0.32, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        {/* Buchholz Relay Body Chamber */}
        <mesh position={[0, 0, 0]} rotation={[0.45, 0, 0]}>
          <cylinderGeometry args={[0.068, 0.068, 0.16, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
        </mesh>
        {/* Pipe Flanges */}
        {[-0.08, 0.08].map((fy, fi) => (
          <mesh key={`bflange-${fi}`} position={[0, fy * Math.cos(0.45), -fy * Math.sin(0.45)]} rotation={[0.45, 0, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.02, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.9} />
          </mesh>
        ))}
        {/* Glass Inspection Sight Window */}
        <mesh position={[0.068, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.032, 16]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.7} />
        </mesh>
        {/* Test Petcock Valve on top */}
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.04, 12]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.115, 0]}>
          <boxGeometry args={[0.04, 0.01, 0.015]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        {/* Identification Plaque */}
        <Text position={[0.075, 0, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.018} color="#facc15" fontWeight="bold">
          BUCHHOLZ
        </Text>
      </group>

      {/* Silica Gel Dehydrating Breather Canister (Pernapasan Udara Bebas Kelembaban) */}
      <group position={[0.74, 1.62, -0.1]}>
        {/* Breathing Pipe from Conservator */}
        <mesh position={[0, 0.20, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.28, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        {/* Transparent Glass Canister Body */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.22, 16]} />
          <meshStandardMaterial color="#94a3b8" transparent opacity={0.5} roughness={0.1} />
        </mesh>
        {/* Blue Silica Gel Crystals Visible Inside */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.052, 0.052, 0.16, 16]} />
          <meshStandardMaterial color="#0284c7" roughness={0.6} />
        </mesh>
        {/* Oil Seal Reservoir Cup at Bottom */}
        <mesh position={[0, -0.13, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.06, 16]} />
          <meshStandardMaterial color="#ca8a04" transparent opacity={0.85} roughness={0.2} />
        </mesh>
        <Text position={[0, -0.01, 0.065]} fontSize={0.018} color="#f8fafc" fontWeight="bold">
          SILICA GEL
        </Text>
      </group>

      {/* Oil Dial Temperature Gauge on Front Tank Wall */}
      <group position={[0.55, 1.35, 0.66]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.025, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.014]}>
          <circleGeometry args={[0.07, 24]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
        {/* Gauge Pointer */}
        <mesh position={[0, 0.02, 0.016]} rotation={[0, 0, -0.6]}>
          <boxGeometry args={[0.008, 0.045, 0.002]} />
          <meshBasicMaterial color="#dc2626" />
        </mesh>
        <Text position={[0, -0.03, 0.016]} fontSize={0.018} color="#0f172a" fontWeight="bold">
          52°C OIL
        </Text>
      </group>

      {/* Official Transformer Rating Specification Nameplate (Plat Nama Trafo) */}
      <group position={[-0.20, 1.32, 0.66]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.62, 0.42]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[0.60, 0.40]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} />
        </mesh>
        <Text position={[0, 0.15, 0.005]} fontSize={0.026} color="#facc15" fontWeight="bold">
          TRANSFORMATOR STEP-DOWN 20 kV / 400 V
        </Text>
        <Text position={[0, 0.08, 0.005]} fontSize={0.021} color="#38bdf8">
          KAPASITAS DAYA: 1250 kVA • 3-PHASE • 50 Hz
        </Text>
        <Text position={[0, 0.01, 0.005]} fontSize={0.018} color="#f8fafc">
          PRIMER: 20.000 V (HV) • ARUS: 36.1 A
        </Text>
        <Text position={[0, -0.05, 0.005]} fontSize={0.018} color="#f8fafc">
          SEKUNDER: 400 V (LV) • ARUS: 1804.2 A
        </Text>
        <Text position={[0, -0.11, 0.005]} fontSize={0.017} color="#94a3b8">
          STANDAR: IEC 60076 / SPLN D3.002 • ONAF COOLING
        </Text>
        <Text position={[0, -0.16, 0.005]} fontSize={0.016} color="#22c55e" fontWeight="bold">
          ✓ STATUS: TERA LAIK OPERASI (PLN CERTIFIED)
        </Text>
      </group>

      {/* Transformer Earth Boss & Grounding Copper Braid */}
      <group position={[-0.82, 0.50, 0.4]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.04, 12]} />
          <meshStandardMaterial color="#b45309" metalness={0.9} />
        </mesh>
        {/* Copper Ground Braid down to Plinth */}
        <mesh position={[0, -0.22, 0]}>
          <boxGeometry args={[0.01, 0.40, 0.03]} />
          <meshStandardMaterial color="#b45309" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* 5. High-Voltage Ceramic Insulator Bushings with Arcing Horns (20 kV Primary Input) */}
      {[-0.45, 0, 0.45].map((bx, bi) => (
        <group key={`bushing-${bi}`} position={[bx, 1.95, 0.35]}>
          {/* Ribbed Porcelain Insulator */}
          <mesh>
            <cylinderGeometry args={[0.045, 0.07, 0.35, 16]} />
            <meshStandardMaterial {...porcelainMat} />
          </mesh>
          {/* Shed rings */}
          {[0.08, 0.0, -0.08].map((sy, si) => (
            <mesh key={`shed-${si}`} position={[0, sy, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.025, 16]} />
              <meshStandardMaterial {...porcelainMat} />
            </mesh>
          ))}
          {/* Copper Terminal Lug */}
          <mesh position={[0, 0.20, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.08, 12]} />
            <meshStandardMaterial {...copperMat} />
          </mesh>

          {/* ARCING HORNS (Spark-Gap Surge Electrodes) */}
          {/* Upper Arcing Horn pointing down */}
          <mesh position={[0.07, 0.12, 0]} rotation={[0, 0, 0.25]}>
            <cylinderGeometry args={[0.005, 0.005, 0.16, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
          {/* Lower Arcing Horn pointing up */}
          <mesh position={[0.09, -0.06, 0]} rotation={[0, 0, -0.25]}>
            <cylinderGeometry args={[0.005, 0.005, 0.16, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* 6. Heavy Low-Voltage Copper Busbar Duct (Exits down to floor trench) */}
      <group position={[0, 0.8, -0.7]}>
        <mesh>
          <boxGeometry args={[0.5, 0.6, 0.25]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Copper busbars into floor */}
        {[-0.15, 0, 0.15].map((cx, ci) => (
          <mesh key={`bus-${ci}`} position={[cx, -0.4, 0]}>
            <boxGeometry args={[0.04, 0.4, 0.08]} />
            <meshStandardMaterial {...copperMat} />
          </mesh>
        ))}
      </group>

      {/* ========================================================================= */}
      {/* 7. 20kV MEDIUM VOLTAGE SWITCHGEAR CUBICLE (PANEL KUBIKEL GARDU DISTRIBUSI) */}
      {/* (Authentic 1.65m Freestanding Industrial Cubicle with VCB Breaker & Trip)   */}
      {/* ========================================================================= */}
      <group position={[0, 0, 1.45]}>
        {/* Plinth Base Rim */}
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[0.92, 0.12, 0.58]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Main Switchgear Enclosure Body (RAL 7035 Industrial Light Grey) */}
        <mesh position={[0, 0.88, 0]}>
          <boxGeometry args={[0.90, 1.52, 0.54]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.35} />
        </mesh>
        {/* Structural Dark Edge Trims */}
        {[-0.45, 0.45].map((cx, ci) => (
          <mesh key={`ctrim-${ci}`} position={[cx, 0.88, 0]}>
            <boxGeometry args={[0.03, 1.54, 0.56]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
        ))}

        {/* Top Lifting Eyebolts */}
        {[-0.38, 0.38].map((lx, li) => (
          <group key={`ceye-${li}`} position={[lx, 1.68, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.025, 0.006, 12, 24]} />
              <meshStandardMaterial color="#475569" metalness={0.9} />
            </mesh>
          </group>
        ))}

        {/* ----------------------------------------------------------------------- */}
        {/* A. KOMPARTEMEN ATAS: METERING & DETEKSI TEGANGAN (Y = 1.30 .. 1.60)       */}
        {/* ----------------------------------------------------------------------- */}
        <mesh position={[0, 1.45, 0.275]}>
          <planeGeometry args={[0.84, 0.34]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>

        {/* Header Title */}
        <Text position={[0, 1.58, 0.28]} fontSize={0.026} color="#facc15" fontWeight="bold">
          KUBIKEL 20 kV • INCOMING VCB BREAKER
        </Text>

        {/* 3 Analog Voltmeters (L1, L2, L3) */}
        {[-0.26, 0.0, 0.26].map((mx, mi) => (
          <group key={`vmeter-${mi}`} position={[mx, 1.46, 0.28]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.048, 0.048, 0.012, 24]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 0, 0.008]}>
              <circleGeometry args={[0.042, 24]} />
              <meshBasicMaterial color="#f8fafc" />
            </mesh>
            {/* Needle (Points to 20kV if Breaker ON, 0 if Breaker OFF) */}
            <mesh
              position={[0, 0.012, 0.01]}
              rotation={[0, 0, transformerBreakerOn ? -0.45 : 1.1]}
            >
              <boxGeometry args={[0.004, 0.028, 0.001]} />
              <meshBasicMaterial color="#dc2626" />
            </mesh>
            <Text position={[0, -0.022, 0.01]} fontSize={0.014} color="#0f172a" fontWeight="bold">
              {mi === 0 ? 'V R-S' : mi === 1 ? 'V S-T' : 'V T-R'}
            </Text>
            <Text position={[0, -0.034, 0.01]} fontSize={0.012} color="#475569">
              0-25 kV
            </Text>
          </group>
        ))}

        {/* 3 Live Phase Neon Pilot Lamps (R - Red, S - Amber, T - Green) */}
        <group position={[0, 1.34, 0.28]}>
          {[-0.22, 0.0, 0.22].map((px, pi) => (
            <group key={`phase-lamp-${pi}`} position={[px, 0, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.022, 0.022, 0.01, 16]} />
                <meshStandardMaterial color="#475569" metalness={0.9} />
              </mesh>
              <mesh position={[0, 0, 0.006]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.016, 0.016, 0.014, 16]} />
                <meshStandardMaterial
                  color={pi === 0 ? '#ef4444' : pi === 1 ? '#eab308' : '#22c55e'}
                  emissive={pi === 0 ? '#ef4444' : pi === 1 ? '#eab308' : '#22c55e'}
                  emissiveIntensity={2.5}
                />
              </mesh>
              <Text position={[0, -0.024, 0.008]} fontSize={0.014} color="#f8fafc" fontWeight="bold">
                {pi === 0 ? 'PHASE R' : pi === 1 ? 'PHASE S' : 'PHASE T'}
              </Text>
            </group>
          ))}
        </group>

        {/* ----------------------------------------------------------------------- */}
        {/* B. KOMPARTEMEN TENGAH: VCB OPERASI & TRIP DARURAT (Y = 0.70 .. 1.25)       */}
        {/* ----------------------------------------------------------------------- */}
        <mesh position={[0, 0.98, 0.275]}>
          <planeGeometry args={[0.84, 0.56]} />
          <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.3} />
        </mesh>

        {/* Status Indicator Flags Window (Mechanical Position Indicator) */}
        <group position={[-0.22, 1.12, 0.28]}>
          <mesh>
            <boxGeometry args={[0.18, 0.08, 0.02]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 0, 0.012]}>
            <planeGeometry args={[0.16, 0.06]} />
            <meshBasicMaterial color={transformerBreakerOn ? '#991b1b' : '#14532d'} />
          </mesh>
          <Text position={[0, 0, 0.015]} fontSize={0.028} color="#ffffff" fontWeight="bold">
            {transformerBreakerOn ? 'CLOSED ( I )' : 'OPEN ( O )'}
          </Text>
          <Text position={[0, -0.055, 0.01]} fontSize={0.016} color="#f8fafc">
            STATUS KONTAK VCB
          </Text>
        </group>

        {/* Pilot Indicator Lamps (RED = Closed/Live, GREEN = Open/Isolated) */}
        <group position={[0.22, 1.12, 0.28]}>
          <group position={[-0.045, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.024, 0.024, 0.01, 16]} />
              <meshStandardMaterial color="#475569" metalness={0.9} />
            </mesh>
            <mesh position={[0, 0, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.014, 16]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#ef4444"
                emissiveIntensity={transformerBreakerOn ? 2.5 : 0.2}
              />
            </mesh>
            <Text position={[0, -0.028, 0.01]} fontSize={0.013} color="#f8fafc">
              LIVE (I)
            </Text>
          </group>
          <group position={[0.045, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.024, 0.024, 0.01, 16]} />
              <meshStandardMaterial color="#475569" metalness={0.9} />
            </mesh>
            <mesh position={[0, 0, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.014, 16]} />
              <meshStandardMaterial
                color="#22c55e"
                emissive="#22c55e"
                emissiveIntensity={!transformerBreakerOn ? 2.5 : 0.2}
              />
            </mesh>
            <Text position={[0, -0.028, 0.01]} fontSize={0.013} color="#f8fafc">
              SAFE (O)
            </Text>
          </group>
        </group>

        {/* INTERACTIVE SPRING-CHARGED VCB OPERATING LEVER */}
        <group
          position={[0.22, 0.92, 0.28]}
          onClick={handleToggleBreaker}
          onPointerOver={() => {
            setHoveredLever(true);
            setActiveHoverObject('Tuas VCB Breaker 20kV');
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHoveredLever(false);
            setActiveHoverObject(null);
            document.body.style.cursor = 'auto';
          }}
        >
          {/* Base escutcheon disc */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.015, 24]} />
            <meshStandardMaterial color={hoveredLever ? '#475569' : '#0f172a'} metalness={0.8} />
          </mesh>
          {/* Lever handle */}
          <group rotation={[0, 0, transformerBreakerOn ? 0 : -Math.PI / 3]}>
            <mesh position={[0, 0.04, 0.035]}>
              <boxGeometry args={[0.026, 0.10, 0.026]} />
              <meshStandardMaterial color={transformerBreakerOn ? '#dc2626' : '#64748b'} metalness={0.7} />
            </mesh>
            <mesh position={[0, 0.085, 0.035]}>
              <sphereGeometry args={[0.022, 16, 16]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
          </group>
          <Text position={[0, -0.055, 0.01]} fontSize={0.018} color="#38bdf8" fontWeight="bold">
            TUAS VCB [KLIK]
          </Text>
        </group>

        {/* INTERACTIVE EMERGENCY TRIP PUSHBUTTON (TOMBOL TRIP DARURAT) */}
        <group
          position={[-0.22, 0.92, 0.28]}
          onClick={handleEmergencyTrip}
          onPointerOver={() => {
            setHoveredTrip(true);
            setActiveHoverObject('Tombol Trip Darurat 20kV');
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHoveredTrip(false);
            setActiveHoverObject(null);
            document.body.style.cursor = 'auto';
          }}
        >
          {/* Yellow Hazard Bezel Collar */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.058, 0.058, 0.015, 24]} />
            <meshStandardMaterial color="#eab308" metalness={0.3} roughness={0.4} />
          </mesh>
          {/* Red Mushroom Head Pushbutton */}
          <mesh position={[0, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.042, 0.035, 0.03, 24]} />
            <meshStandardMaterial color={hoveredTrip ? '#ef4444' : '#dc2626'} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.042]}>
            <sphereGeometry args={[0.035, 20, 16]} />
            <meshStandardMaterial color={hoveredTrip ? '#ef4444' : '#dc2626'} roughness={0.3} />
          </mesh>
          <Text position={[0, -0.055, 0.01]} fontSize={0.018} color="#ef4444" fontWeight="bold">
            TRIP DARURAT [KLIK]
          </Text>
        </group>

        {/* Spring Charge Flag & Guide */}
        <group position={[0, 0.81, 0.28]}>
          <mesh>
            <planeGeometry args={[0.38, 0.05]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <Text position={[0, 0, 0.005]} fontSize={0.017} color="#22c55e" fontWeight="bold">
            SPRING: CHARGED (SIAP TUTUP)
          </Text>
        </group>

        {/* ----------------------------------------------------------------------- */}
        {/* C. KOMPARTEMEN BAWAH: MIMIC SLD, INTERLOCK & K3 (Y = 0.15 .. 0.65)        */}
        {/* ----------------------------------------------------------------------- */}
        <mesh position={[0, 0.42, 0.275]}>
          <planeGeometry args={[0.84, 0.50]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>

        {/* Mimic Single Line Diagram (SLD) */}
        <group position={[0, 0.54, 0.28]}>
          {/* Busbar Line Incomer */}
          <mesh position={[0, 0.05, 0]}>
            <planeGeometry args={[0.01, 0.08]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
          {/* Disconnector Symbol */}
          <mesh position={[0, 0, 0]}>
            <circleGeometry args={[0.015, 12]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          {/* Outgoing to Breaker */}
          <mesh position={[0, -0.05, 0]}>
            <planeGeometry args={[0.01, 0.08]} />
            <meshBasicMaterial color={transformerBreakerOn ? '#ef4444' : '#22c55e'} />
          </mesh>
          <Text position={[0.12, 0, 0]} fontSize={0.018} color="#94a3b8">
            MIMIC SLD 20kV
          </Text>
        </group>

        {/* Trapped-Key Mechanical Interlock Keyhole */}
        <group position={[0.26, 0.38, 0.28]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.01, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0, 0.008]}>
            <boxGeometry args={[0.005, 0.018, 0.002]} />
            <meshBasicMaterial color="#020617" />
          </mesh>
          <Text position={[0, -0.024, 0.005]} fontSize={0.012} color="#94a3b8">
            INTERLOCK KUNCI
          </Text>
        </group>

        {/* Ventilation Louver Slots */}
        {[-0.04, -0.01, 0.02].map((ly, li) => (
          <mesh key={`louver-${li}`} position={[-0.20, 0.38 + ly, 0.28]}>
            <planeGeometry args={[0.22, 0.015]} />
            <meshBasicMaterial color="#020617" />
          </mesh>
        ))}

        {/* Prominent High Voltage Warning Placard */}
        <group position={[0, 0.22, 0.28]}>
          <mesh>
            <planeGeometry args={[0.76, 0.12]} />
            <meshStandardMaterial color="#991b1b" />
          </mesh>
          <Text position={[0, 0.024, 0.005]} fontSize={0.028} color="#fef08a" fontWeight="bold">
            ⚡ AWAS TEGANGAN TINGGI 20.000 VOLT
          </Text>
          <Text position={[0, -0.028, 0.005]} fontSize={0.018} color="#ffffff">
            DILARANG MEMBUKA PINTU KUBIKEL TANPA WEWENANG RESMI
          </Text>
        </group>
      </group>
    </group>
  );
};

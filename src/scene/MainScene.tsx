import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { SimulationDriver } from './SimulationDriver';
import { EnvironmentScene } from './EnvironmentScene';
import { PowerCabinet } from './machine/PowerCabinet';
import { IndustrialFurnace } from './machine/IndustrialFurnace';
import { PouringLadle } from './machine/PouringLadle';
import { IngotCastingMold } from './machine/IngotCastingMold';
import { SingleSandMold } from './machine/SingleSandMold';
import { OverheadFactoryCrane } from './machine/OverheadFactoryCrane';
import { TiltControlBox } from './machine/TiltControlBox';
import { ConnectedWaterCables } from './machine/ConnectedWaterCables';
import { FurnaceMeltingPlatform } from './machine/FurnaceMeltingPlatform';
import { ThermocoupleLance } from './machine/ThermocoupleLance';
import { ToolWorkbenchStation } from './machine/ToolWorkbenchStation';
import { HandheldSkimmerAndShovel } from './machine/HandheldSkimmerAndShovel';
import { HandheldFireExtinguisher } from './props/HandheldFireExtinguisher';
import { CraneRemoteStation } from './props/CraneRemoteStation';
import { HeatHaze } from './fx/HeatHaze';
import { CameraRig } from './camera/CameraRig';
import { Effects } from './fx/Effects';
import { useSimStore } from '../store/useSimStore';
import { getBlackbodyColor } from '../sim/blackbody';

interface MainSceneProps {
  enableBloom?: boolean;
}

/**
 * Main 3D scene containing the induction furnace, platform, crane, and molds.
 */
export const MainScene: React.FC<MainSceneProps> = ({ enableBloom = true }) => {
  const [isDraggingKnob, setIsDraggingKnob] = useState(false);
  const pouringTarget = useSimStore((s) => s.pouringTarget);
  const performanceProfile = useSimStore((s) => s.performanceProfile);
  const singleMoldFillLevel = useSimStore((s) => s.singleMoldFillLevel);
  const cranePosition = useSimStore((s) => s.cranePosition);
  const isLiteMode = performanceProfile === 'lite';
  const isLadleAtStandby = Math.hypot(cranePosition[0] - 4.0, cranePosition[2] - 0.0) <= 1.25;

  const currentCranePos = useRef(new THREE.Vector3(...useSimStore.getState().cranePosition));

  const moltenLightRef = useRef<THREE.PointLight>(null);
  const floorLightRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.05);
    const state = useSimStore.getState();
    const { craneDestination, craneTargetPosition, craneMoveDirs, sim, isPouringStreamActive } = state;

    if (craneDestination === 'manual') {
      const horizontalSpeed = 1.5; // m/s
      const hoistSpeed = 1.0; // m/s
      currentCranePos.current.x += craneMoveDirs.x * horizontalSpeed * safeDelta;
      currentCranePos.current.y += craneMoveDirs.y * hoistSpeed * safeDelta;
      currentCranePos.current.z += craneMoveDirs.z * horizontalSpeed * safeDelta;

      // Enforce physical bounds across full workshop
      currentCranePos.current.x = Math.max(-9.5, Math.min(9.5, currentCranePos.current.x));
      currentCranePos.current.y = Math.max(0.0, Math.min(5.2, currentCranePos.current.y));
      currentCranePos.current.z = Math.max(-9.5, Math.min(9.5, currentCranePos.current.z));

      // Keep target synchronized so it doesn't jump back
      state.craneTargetPosition = [currentCranePos.current.x, currentCranePos.current.y, currentCranePos.current.z];
    } else {
      // Smooth lerp of crane and ladle travel across workshop floor towards preset target
      const craneLerpAlpha = Math.min(1, safeDelta * 3.5);
      currentCranePos.current.x = THREE.MathUtils.lerp(currentCranePos.current.x, craneTargetPosition[0], craneLerpAlpha);
      currentCranePos.current.y = THREE.MathUtils.lerp(currentCranePos.current.y, craneTargetPosition[1], craneLerpAlpha);
      currentCranePos.current.z = THREE.MathUtils.lerp(currentCranePos.current.z, craneTargetPosition[2], craneLerpAlpha);
    }

    // Sync store position if noticeably moved (throttled to > 0.08m to avoid unnecessary UI HUD churn)
    const currStorePos = state.cranePosition;
    if (
      Math.abs(currStorePos[0] - currentCranePos.current.x) > 0.08 ||
      Math.abs(currStorePos[1] - currentCranePos.current.y) > 0.08 ||
      Math.abs(currStorePos[2] - currentCranePos.current.z) > 0.08
    ) {
      state.setCranePosition([currentCranePos.current.x, currentCranePos.current.y, currentCranePos.current.z]);
    }

    const glow = getBlackbodyColor(sim.temperatureC);

    if (moltenLightRef.current) {
      if (sim.temperatureC >= 450) {
        moltenLightRef.current.visible = true;
        moltenLightRef.current.color.setRGB(glow.r, glow.g, glow.b);
        moltenLightRef.current.intensity = Math.min(1.4, glow.emissiveIntensity * 0.8);
      } else {
        moltenLightRef.current.visible = false;
      }
    }

    if (floorLightRef.current) {
      const isLadleReceiving =
        Math.hypot(currentCranePos.current.x - 0.0, currentCranePos.current.z - 1.16) <= 1.85 &&
        currentCranePos.current.y <= 2.8;

      // Only illuminate the floor when metal actually pours onto the floor (i.e. ladle is not catching it)
      if (isPouringStreamActive && !isLadleReceiving && sim.temperatureC >= 450) {
        floorLightRef.current.visible = true;
        floorLightRef.current.color.setRGB(glow.r, glow.g, glow.b);
        floorLightRef.current.intensity = Math.min(1.1, glow.emissiveIntensity * 0.65);
      } else {
        floorLightRef.current.visible = false;
      }
    }
  });

  return (
    <>
      {/* Simulation Physics Driver */}
      <SimulationDriver />

      {/* Free Pan & Orbit Camera Rig */}
      <CameraRig isDraggingKnob={isDraggingKnob} />

      {/* Factory Environment */}
      <EnvironmentScene isLiteMode={isLiteMode} />

      {/* Incandescent Dynamic Light inside Furnace Crucible */}
      <pointLight
        ref={moltenLightRef}
        position={[0, 1.20, 0]}
        distance={2.2}
        decay={2}
        intensity={0}
      />

      {/* Incandescent Dynamic Light on Pouring Floor Impact */}
      <pointLight
        ref={floorLightRef}
        position={[0, 0.40, 0.88]}
        distance={1.8}
        decay={2}
        intensity={0}
      />


      {/* 2. ELEVATED FURNACE MELTING PLATFORM DECK & OBSERVATION VIEW */}
      <FurnaceMeltingPlatform position={[0, 0, 0]} />

      {/* 3. MELT SHOP IMMERSION THERMOCOUPLE LANCE */}
      <ThermocoupleLance position={[0, 0, 0]} />

      {/* 3A. TOOL WORKBENCH STATION & COAGULANT BUCKET (Beside stairs, behind crane remote stand, outside platform deck) */}
      <ToolWorkbenchStation position={[2.65, 0, -0.22]} rotation={[0, Math.PI / 2, 0]} />

      {/* 3B. HANDHELD OPERATOR FIRE EXTINGUISHER (APAR) VIEWMODEL */}
      <HandheldFireExtinguisher />

      {/* 3C. HANDHELD FOUNDRY TOOL VIEWMODELS (Coagulant Shovel & Deslagging Skimmer) */}
      <HandheldSkimmerAndShovel />

      {/* 6. INTERMEDIATE FREQUENCY POWER CABINET (Orange Doors, Left Side - Squared to Grid) */}
      <PowerCabinet
        position={[-2.40, 0, 0.0]}
        rotation={[0, 0, 0]}
        onDragStateChange={setIsDraggingKnob}
      />

      {/* 7. REALISTIC WATER-COOLED CABLES (Directly emerging through yellow plate holes) */}
      <ConnectedWaterCables
        gland1Pos={[-1.767, 0.58, 0.055]}
        gland2Pos={[-1.767, 0.58, -0.055]}
        furnacePivotPos={[0.0, 1.39, 0.0]}
      />

      {/* 8. CENTERPIECE: GW TILTING INDUCTION SMELTING FURNACE WITH GREEN MOTOR */}
      <IndustrialFurnace position={[0, 0, 0]} />

      {/* 9. OVERHEAD FACTORY TRAVELING CRANE */}
      <OverheadFactoryCrane cranePosRef={currentCranePos} isLiteMode={isLiteMode} />

      {/* 10. HEAVY CRANE TRANSFER POURING LADLE */}
      <PouringLadle
        ladlePosRef={currentCranePos}
        onDragStateChange={setIsDraggingKnob}
      />

      {/* 10B. LADLE ORIGINAL STANDBY FLOOR PARKING ZONE AT [4.0, 0.003, 0.0] */}
      <group position={[4.0, 0.003, 0.0]} name="ENV_LadleStandbyParkingZone">
        <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <planeGeometry args={[1.65, 1.65]} />
          <meshStandardMaterial
            color={isLadleAtStandby ? '#064e3b' : singleMoldFillLevel >= 0.90 ? '#422006' : '#0f172a'}
            roughness={0.9}
          />
        </mesh>
        {/* Outer Safety Border Ring */}
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[0.76, 0.84, 4]} />
          <meshBasicMaterial
            color={isLadleAtStandby ? '#22c55e' : singleMoldFillLevel >= 0.90 ? '#facc15' : '#eab308'}
          />
        </mesh>
        <Text
          position={[0, 0.005, 0.62]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.075}
          color={isLadleAtStandby ? '#4ade80' : '#fde047'}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {isLadleAtStandby
            ? '✓ POSISI SEMULA LADEL (STANDBY)'
            : 'POSISI SEMULA LADEL (STANDBY [X: 4.0m, Z: 0.0m])'}
        </Text>
      </group>

      {/* 11. SINGLE SAND MOLD (1 Unit Cetakan Pasir Tunggal Sesuai Tiket Pesanan & Optimasi Ringan Smartphone) */}
      <group position={[7.8, 0.002, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.8, 6.4]} />
          <meshStandardMaterial color="#1a202c" roughness={0.95} />
        </mesh>
        {[-1.4, 1.4].map((lx, li) => (
          <mesh key={`cast-lane-${li}`} position={[lx, 0.004, 0]}>
            <boxGeometry args={[0.08, 0.003, 6.4]} />
            <meshStandardMaterial color="#facc15" roughness={0.4} />
          </mesh>
        ))}
      </group>
      <SingleSandMold position={[7.8, 0, 0.0]} />

      {pouringTarget === 'mold' && <IngotCastingMold position={[0, 0, 0.96]} />}

      {/* Thermal Shimmer Heat Haze */}
      {!isLiteMode && <HeatHaze position={[0, 1.70, 0]} />}

      {/* 12. TILT CONTROL BOX */}
      <TiltControlBox position={[2.40, 0, 0.80]} rotation={[0, 0, 0]} />

      {/* 13. PHYSICAL WIRELESS CRANE REMOTE DOCKING STATION */}
      <CraneRemoteStation position={[2.90, 1.15, 0.80]} rotation={[0, 0, 0]} />

      {/* Selective HDR Bloom Postprocessing */}
      <Effects enableBloom={enableBloom} />
    </>
  );
};

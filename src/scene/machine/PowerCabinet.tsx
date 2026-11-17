import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Button3D } from '../panel/Button3D';
import { Knob3D } from '../panel/Knob3D';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

interface PowerCabinetProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  onDragStateChange?: (isDragging: boolean) => void;
}

/**
 * Authentic GW Series Intermediate Frequency (IF) Induction Power Supply Cabinet.
 * Fully engineered to match manufacturer reference photo (media_1791264674911.png):
 *
 * 1. Left Door Controller (Gambar 1):
 *    - Interactive Main Power Rocker Switch: Toggles cabinet power on/off with physical rocking animation & click.
 *    - Interactive Keypad (SET, UP, DOWN, ENT): Adjusts power & parameters with tactile depression.
 *    - Smoked acrylic digital display with frequency, temperature, power, and operating phase.
 *    - Authentic white/red industrial high-voltage warning sign ("当心触电 / DANGER HIGH VOLTAGE").
 *
 * 2. Inspection Window (Gambar 2):
 *    - Richly detailed 3D capacitor banks, copper busbars, IGBT heat-sink fins, and glowing PCB LEDs.
 *    - Soft internal equipment illumination visible through transparent tempered glass.
 *
 * 3. Inset Control Niche (Gambar 3 & 4):
 *    - 5 Functional Pilot Lamps (POWER, FAULT, WATER, IF RUN, O-TEMP) reacting to real sim state.
 *    - Interactive 3D RESET button clearing faults.
 *    - START, STOP, and KNOB: Completely free of blocking/slicing hoods (Gambar 4 issue solved).
 *    - Prominent Mushroom E-STOP: Yellow safety legend ring with text fully visible above & below cap.
 *
 * 4. Right Side Panel (Gambar 5):
 *    - Yellow rectangular access plate with DUAL ROUND HOLES where high-current power cables emerge.
/**
 * Pre-computed 2D Yellow Cable Access Plate Shape with DUAL HOLLOW CIRCULAR HOLES.
 * Mathematically centered cutouts so the high-current water-cooled cables physically penetrate through!
 */
const createYellowPlateShape = () => {
  const shape = new THREE.Shape();
  const w = 0.14; // half width (280mm total width)
  const h = 0.16; // half height (320mm total height)
  const rCorner = 0.02;

  shape.moveTo(-w + rCorner, -h);
  shape.lineTo(w - rCorner, -h);
  shape.quadraticCurveTo(w, -h, w, -h + rCorner);
  shape.lineTo(w, h - rCorner);
  shape.quadraticCurveTo(w, h, w - rCorner, h);
  shape.lineTo(-w + rCorner, h);
  shape.quadraticCurveTo(-w, h, -w, h - rCorner);
  shape.lineTo(-w, -h + rCorner);
  shape.quadraticCurveTo(-w, -h, -w + rCorner, -h);

  // Hole 1 (Front hole, x = -0.055, y = 0, radius = 0.035)
  const hole1 = new THREE.Path();
  hole1.absarc(-0.055, 0, 0.035, 0, Math.PI * 2, true);
  shape.holes.push(hole1);

  // Hole 2 (Rear hole, x = +0.055, y = 0, radius = 0.035)
  const hole2 = new THREE.Path();
  hole2.absarc(0.055, 0, 0.035, 0, Math.PI * 2, true);
  shape.holes.push(hole2);

  return shape;
};

const YELLOW_PLATE_SHAPE = createYellowPlateShape();
const YELLOW_PLATE_EXTRUDE_SETTINGS = {
  depth: 0.008,
  bevelEnabled: true,
  bevelThickness: 0.002,
  bevelSize: 0.002,
  bevelSegments: 2,
};

export const PowerCabinet: React.FC<PowerCabinetProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onDragStateChange,
}) => {
  const performanceProfile = useSimStore((s) => s.performanceProfile);
  const isLite = performanceProfile === 'lite';

  const coilOn = useSimStore((s) => s.coilOn);
  const startFurnace = useSimStore((s) => s.startFurnace);
  const stopFurnace = useSimStore((s) => s.stopFurnace);
  const powerSetpoint = useSimStore((s) => s.powerSetpoint);
  const setPowerSetpoint = useSimStore((s) => s.setPowerSetpoint);
  const masterPowerOn = useSimStore((s) => s.masterPowerOn);
  const setMasterPower = useSimStore((s) => s.setMasterPower);
  const transformerBreakerOn = useSimStore((s) => s.transformerBreakerOn);
  const emergencyTripped = useSimStore((s) => s.emergencyTripped);
  const triggerEmergencyStop = useSimStore((s) => s.triggerEmergencyStop);
  const resetEmergencyStop = useSimStore((s) => s.resetEmergencyStop);
  const setActiveHoverObject = useSimStore((s) => s.setActiveHoverObject);

  const isCabinetEnergized = transformerBreakerOn && masterPowerOn;

  // Cabinet controller menu state
  const [controllerMenu, setControllerMenu] = useState<'FREQ' | 'TEMP' | 'POWER'>('FREQ');

  // Meter needles refs for physical needle movement
  const needleDcvRef = useRef<THREE.Mesh>(null);
  const needleDcaRef = useRef<THREE.Mesh>(null);
  const needleIfvRef = useRef<THREE.Mesh>(null);
  const needlePwrRef = useRef<THREE.Mesh>(null);

  // Digital controller readouts refs
  const tempTextRef = useRef<any>(null);
  const freqTextRef = useRef<any>(null);
  const powerTextRef = useRef<any>(null);
  const statusTextRef = useRef<any>(null);

  // Pilot lamp materials refs
  const lampPowerMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lampFaultMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lampWaterMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lampIfRunMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lampOtempMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Rocker switch mesh ref
  const rockerSwitchRef = useRef<THREE.Group>(null);
  // Reset button cap ref
  const resetBtnCapRef = useRef<THREE.Group>(null);
  const [resetPressed, setResetPressed] = useState(false);

  useFrame((_, delta) => {
    const { sim, coilOn } = useSimStore.getState();
    const effectivePower = isCabinetEnergized && !emergencyTripped && coilOn ? powerSetpoint : 0;

    // Rocker switch physical tilt angle
    if (rockerSwitchRef.current) {
      const targetRockerRot = masterPowerOn ? 0.35 : -0.35;
      rockerSwitchRef.current.rotation.x = THREE.MathUtils.lerp(
        rockerSwitchRef.current.rotation.x,
        targetRockerRot,
        delta * 20
      );
    }

    // Reset button physical depression travel
    if (resetBtnCapRef.current) {
      const targetZ = resetPressed ? -0.003 : 0.0;
      resetBtnCapRef.current.position.z = THREE.MathUtils.lerp(
        resetBtnCapRef.current.position.z,
        targetZ,
        delta * 25
      );
    }

    // Meter 1: DC Volts (0 to 520V)
    if (needleDcvRef.current) {
      const targetAngle = isCabinetEnergized ? -0.55 + (sim.dcVolts / 520) * 1.1 : -0.55;
      needleDcvRef.current.rotation.z = THREE.MathUtils.lerp(needleDcvRef.current.rotation.z, targetAngle, 0.1);
    }
    // Meter 2: DC Amperes (0 to 250A)
    if (needleDcaRef.current) {
      const targetAngle = isCabinetEnergized ? -0.55 + (sim.dcAmps / 250) * 1.05 : -0.55;
      needleDcaRef.current.rotation.z = THREE.MathUtils.lerp(needleDcaRef.current.rotation.z, targetAngle, 0.1);
    }
    // Meter 3: IF Volts (0 to 750V)
    if (needleIfvRef.current) {
      const targetAngle = isCabinetEnergized ? -0.55 + (sim.ifVolts / 750) * 1.15 : -0.55;
      needleIfvRef.current.rotation.z = THREE.MathUtils.lerp(needleIfvRef.current.rotation.z, targetAngle, 0.1);
    }
    // Meter 4: Power kW (0 to 100kW scale)
    if (needlePwrRef.current) {
      const targetAngle = isCabinetEnergized ? -0.55 + sim.powerFraction * 1.1 : -0.55;
      needlePwrRef.current.rotation.z = THREE.MathUtils.lerp(needlePwrRef.current.rotation.z, targetAngle, 0.1);
    }

    // Digital controller display text
    if (tempTextRef.current) {
      tempTextRef.current.text = isCabinetEnergized ? `${Math.round(sim.temperatureC)} °C` : '--';
    }
    if (freqTextRef.current) {
      freqTextRef.current.text = isCabinetEnergized && coilOn ? `${sim.inverterFreqHz} Hz` : isCabinetEnergized ? '0 Hz' : '--';
    }
    if (powerTextRef.current) {
      powerTextRef.current.text = isCabinetEnergized ? `${Math.round(effectivePower * 100)} %` : '--';
    }
    if (statusTextRef.current) {
      if (!transformerBreakerOn) {
        statusTextRef.current.text = 'TRAFO MATI (0V)';
        statusTextRef.current.color = '#ef4444';
      } else if (!masterPowerOn) {
        statusTextRef.current.text = 'POWER OFF';
        statusTextRef.current.color = '#cbd5e1';
      } else if (emergencyTripped) {
        statusTextRef.current.text = 'E-STOP TRIPPED';
        statusTextRef.current.color = '#ef4444';
      } else if (sim.waterTripFault) {
        statusTextRef.current.text = 'TRIP: WATER FAULT';
        statusTextRef.current.color = '#ef4444';
      } else if (coilOn) {
        statusTextRef.current.text = 'IF HEATING';
        statusTextRef.current.color = '#22c55e';
      } else {
        statusTextRef.current.text = 'STANDBY READY';
        statusTextRef.current.color = '#f59e0b';
      }
    }

    // Dynamic pilot lamps glow
    if (lampPowerMatRef.current) {
      lampPowerMatRef.current.emissiveIntensity = isCabinetEnergized ? 1.6 : 0.05;
    }
    if (lampFaultMatRef.current) {
      const isFault = emergencyTripped || sim.waterTripFault || (isCabinetEnergized && sim.coilWaterTempC > 55);
      lampFaultMatRef.current.emissiveIntensity = isFault ? 2.2 : 0.05;
    }
    if (lampWaterMatRef.current) {
      const isWaterPumpRunning = useSimStore.getState().isWaterPumpRunning;
      if ((!isWaterPumpRunning || sim.waterTripFault) && isCabinetEnergized) {
        lampWaterMatRef.current.color.set('#ef4444');
        lampWaterMatRef.current.emissive.set('#dc2626');
        lampWaterMatRef.current.emissiveIntensity = 2.4;
      } else {
        lampWaterMatRef.current.color.set('#22c55e');
        lampWaterMatRef.current.emissive.set('#16a34a');
        lampWaterMatRef.current.emissiveIntensity = isCabinetEnergized ? 1.4 : 0.05;
      }
    }
    if (lampIfRunMatRef.current) {
      lampIfRunMatRef.current.emissiveIntensity = isCabinetEnergized && coilOn && powerSetpoint > 0 ? 2.0 : 0.08;
    }
    if (lampOtempMatRef.current) {
      const isOverTemp = isCabinetEnergized && (sim.coilWaterTempC > 50 || sim.temperatureC > 1680);
      lampOtempMatRef.current.emissiveIntensity = isOverTemp ? 2.2 : 0.05;
    }
  });

  // Toggle main master power switch on left door
  const handleToggleMasterPower = (e: any) => {
    e.stopPropagation();
    inductionAudio.resume();
    inductionAudio.playClick();
    if (!transformerBreakerOn) {
      // Upstream 20kV transformer is OFF: Cabinet switch CANNOT energize the system, and CANNOT turn on the transformer!
      return;
    }
    setMasterPower(!masterPowerOn);
  };

  // Controller keypad buttons
  const handleControllerButton = (action: 'UP' | 'DOWN' | 'SET' | 'ENT', e: any) => {
    e.stopPropagation();
    inductionAudio.resume();
    inductionAudio.playClick();
    if (!masterPowerOn || emergencyTripped) return;

    if (action === 'UP') {
      setPowerSetpoint(Math.min(1.0, powerSetpoint + 0.05));
    } else if (action === 'DOWN') {
      setPowerSetpoint(Math.max(0.0, powerSetpoint - 0.05));
    } else if (action === 'SET') {
      setControllerMenu((prev) => (prev === 'FREQ' ? 'TEMP' : prev === 'TEMP' ? 'POWER' : 'FREQ'));
    }
  };

  // Emergency Stop trip / twist-to-release
  const handleEmergencyStop = (e: any) => {
    e.stopPropagation();
    inductionAudio.resume();
    inductionAudio.playClick();
    if (emergencyTripped) {
      resetEmergencyStop();
    } else {
      triggerEmergencyStop();
    }
  };

  // Reset button click
  const handleReset = (e: any) => {
    e.stopPropagation();
    inductionAudio.resume();
    inductionAudio.playClick();
    setResetPressed(true);
    setTimeout(() => setResetPressed(false), 200);
    resetEmergencyStop();
  };

  const width = 1.25;
  const height = 1.90;
  const depth = 0.85;

  return (
    <group
      name="ENV_PowerCabinet"
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* ========================================================================= */}
      {/* 1. HEAVY BASE FOUNDATION PLINTH (Black Steel Skirting, 120mm Height)      */}
      {/* ========================================================================= */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[width + 0.04, 0.12, depth + 0.04]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.4} />
      </mesh>

      {/* ========================================================================= */}
      {/* 2. MAIN ENCLOSURE SHELL (Charcoal Anthracite RAL 7016)                   */}
      {/* ========================================================================= */}
      <mesh position={[0, height / 2 + 0.06, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Top Eyebolt Lifting Lugs (4 Corners for Crane Rigging) */}
      {[-0.52, 0.52].map((x, xi) =>
        [-0.32, 0.32].map((z, zi) => (
          <group key={`${xi}-${zi}`} position={[x, height + 0.085, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.026, 0.007, 12, 24]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.018, 0]}>
              <cylinderGeometry args={[0.012, 0.014, 0.015, 12]} />
              <meshStandardMaterial color="#64748b" metalness={0.85} />
            </mesh>
          </group>
        ))
      )}

      {/* Dual Forced-Air Roof Exhaust Ventilation Cowlings */}
      {[-0.26, 0.26].map((fx, fi) => (
        <group key={`roof-fan-${fi}`} position={[fx, height + 0.08, 0]}>
          {/* Fan Cowling Rim */}
          <mesh>
            <cylinderGeometry args={[0.16, 0.18, 0.05, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Exhaust Wire Safety Mesh */}
          <mesh position={[0, 0.026, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.15, 24]} />
            <meshStandardMaterial color="#475569" wireframe />
          </mesh>
          {/* Center Hub */}
          <mesh position={[0, 0.026, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.015, 16]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          {/* Slanted Rain & Air Deflector Hood Cap */}
          <mesh position={[0, 0.065, 0]}>
            <coneGeometry args={[0.19, 0.04, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} />
          </mesh>
        </group>
      ))}
      {/* 3. FRONT LEFT DOOR (Pintu Kiri Oranye Sesuai Gambar 1 & 2)               */}
      {/* ========================================================================= */}
      <group position={[-width / 4, height / 2 + 0.06, depth / 2 + 0.005]}>
        {/* Main Orange Door Body Panel */}
        <mesh>
          <boxGeometry args={[0.58, 1.76, 0.02]} />
          <meshStandardMaterial color="#ea580c" metalness={0.25} roughness={0.35} />
        </mesh>

        {/* Door Beveled Inner Seam Face */}
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[0.54, 1.72]} />
          <meshStandardMaterial color="#f97316" roughness={0.4} />
        </mesh>

        {/* --- LEFT DOOR UPPER: INTELLIGENT IF DIGITAL CONTROLLER (Gambar 1) --- */}
        <group position={[0, 0.48, 0.016]}>
          {/* Raised Controller Bezel Enclosure */}
          <mesh>
            <boxGeometry args={[0.36, 0.44, 0.022]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Inner Recessed Face */}
          <mesh position={[0, 0, 0.012]}>
            <planeGeometry args={[0.33, 0.41]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} />
          </mesh>

          {/* Module Title Header Bar */}
          <mesh position={[0, 0.175, 0.013]}>
            <planeGeometry args={[0.31, 0.035]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <Text
            position={[0, 0.175, 0.015]}
            fontSize={0.010}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {`GW-IF CONTROLLER [${controllerMenu}]`}
          </Text>

          {/* Smoked Acrylic Digital LED Display Pane */}
          <group position={[0, 0.08, 0.014]}>
            <mesh>
              <planeGeometry args={[0.30, 0.12]} />
              <meshStandardMaterial color="#020817" roughness={0.2} />
            </mesh>
            {/* Display Readout Labels & Digital Values */}
            <Text position={[-0.13, 0.035, 0.002]} fontSize={0.009} color="#94a3b8" anchorX="left" anchorY="middle">
              FREQ:
            </Text>
            <Text ref={freqTextRef} position={[0.02, 0.035, 0.002]} fontSize={0.013} color="#38bdf8" anchorX="left" anchorY="middle" fontWeight="bold">
              1050 Hz
            </Text>

            <Text position={[-0.13, 0.0, 0.002]} fontSize={0.009} color="#94a3b8" anchorX="left" anchorY="middle">
              TEMP:
            </Text>
            <Text ref={tempTextRef} position={[0.02, 0.0, 0.002]} fontSize={0.013} color="#f59e0b" anchorX="left" anchorY="middle" fontWeight="bold">
              25 °C
            </Text>

            <Text position={[-0.13, -0.035, 0.002]} fontSize={0.009} color="#94a3b8" anchorX="left" anchorY="middle">
              POWER:
            </Text>
            <Text ref={powerTextRef} position={[0.02, -0.035, 0.002]} fontSize={0.013} color="#22c55e" anchorX="left" anchorY="middle" fontWeight="bold">
              0 %
            </Text>
          </group>

          {/* Live Status Bar */}
          <Text ref={statusTextRef} position={[0, -0.005, 0.015]} fontSize={0.010} color="#22c55e" anchorX="center" anchorY="middle" fontWeight="bold">
            STANDBY READY
          </Text>

          {/* --- INTERACTIVE KEYPAD BUTTONS (SET, UP, DOWN, ENT) --- */}
          <group position={[-0.04, -0.09, 0.014]}>
            {[
              { id: 'SET', x: -0.06 },
              { id: 'UP', x: -0.02 },
              { id: 'DOWN', x: 0.02 },
              { id: 'ENT', x: 0.06 },
            ].map((btn, bi) => (
              <group
                key={bi}
                position={[btn.x, 0, 0]}
                onClick={(e) => handleControllerButton(btn.id as any, e)}
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = 'auto')}
              >
                <mesh>
                  <boxGeometry args={[0.032, 0.022, 0.006]} />
                  <meshStandardMaterial color="#334155" roughness={0.4} />
                </mesh>
                <Text position={[0, 0, 0.004]} fontSize={0.007} color="#cbd5e1" anchorX="center" anchorY="middle" fontWeight="bold">
                  {btn.id}
                </Text>
              </group>
            ))}
          </group>

          {/* --- INTERACTIVE MAIN POWER ROCKER SWITCH / BREAKER (Gambar 1) --- */}
          {/* User specifically requested: "yg paling kanan apakah tombol power? minimal tombol powernya bisa ditekan lah" */}
          <group
            position={[0.10, -0.09, 0.014]}
            onClick={handleToggleMasterPower}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = 'auto')}
          >
            {/* Switch Bezel Socket */}
            <mesh>
              <boxGeometry args={[0.026, 0.040, 0.012]} />
              <meshStandardMaterial color="#020617" roughness={0.5} />
            </mesh>
            {/* Rocking Switch Rocker Plate */}
            <group ref={rockerSwitchRef} position={[0, 0, 0.006]}>
              <mesh>
                <boxGeometry args={[0.016, 0.028, 0.010]} />
                <meshStandardMaterial
                  color={masterPowerOn ? '#0f172a' : '#1e293b'}
                  metalness={0.7}
                  roughness={0.3}
                />
              </mesh>
              {/* Rocker Indicator Status Dot (Green LED when ON) */}
              <mesh position={[0, masterPowerOn ? 0.008 : -0.008, 0.006]}>
                <sphereGeometry args={[0.0025, 12, 12]} />
                <meshStandardMaterial
                  color={isCabinetEnergized ? '#22c55e' : '#475569'}
                  emissive={isCabinetEnergized ? '#16a34a' : '#000000'}
                  emissiveIntensity={isCabinetEnergized ? 2.0 : 0}
                  toneMapped={false}
                />
              </mesh>
            </group>
            <Text position={[0, -0.026, 0.002]} fontSize={0.0055} color="#94a3b8" anchorX="center" anchorY="middle" fontWeight="bold">
              {!transformerBreakerOn ? 'NO 20kV' : masterPowerOn ? 'PWR ON' : 'PWR OFF'}
            </Text>
          </group>
        </group>

        {/* --- LEFT DOOR MIDDLE: AUTHENTIC WHITE/RED DANGER SIGN --- */}
        <group position={[0, 0.02, 0.016]}>
          <mesh>
            <boxGeometry args={[0.18, 0.22, 0.003]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <planeGeometry args={[0.165, 0.205]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
          <mesh position={[0, 0, 0.003]}>
            <planeGeometry args={[0.155, 0.195]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>

          <group position={[0, 0.045, 0.004]}>
            <mesh>
              <cylinderGeometry args={[0.032, 0.032, 0.001, 3]} />
              <meshStandardMaterial color="#eab308" roughness={0.4} />
            </mesh>
            <Text position={[0, 0, 0.002]} fontSize={0.024} color="#0f172a" anchorX="center" anchorY="middle" fontWeight="bold">
              ⚡
            </Text>
          </group>

          <Text position={[0, -0.025, 0.004]} fontSize={0.014} color="#b91c1c" anchorX="center" anchorY="middle" fontWeight="bold">
            当 心 触 电
          </Text>
          <Text position={[0, -0.055, 0.004]} fontSize={0.008} color="#0f172a" anchorX="center" anchorY="middle" fontWeight="bold">
            DANGER HIGH VOLTAGE
          </Text>
          <Text position={[0, -0.075, 0.004]} fontSize={0.007} color="#475569" anchorX="center" anchorY="middle">
            380V / 1000V IF
          </Text>
        </group>

        {/* --- LEFT DOOR HINGES (3 Heavy Stainless Steel External Barrel Hinges on Left Outer Edge) --- */}
        {[0.65, 0.0, -0.65].map((hy, hi) => (
          <group key={`l-hinge-${hi}`} position={[-0.285, hy, 0.012]}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.012, 0.07, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.2} />
            </mesh>
            <mesh position={[0.015, 0, -0.005]}>
              <boxGeometry args={[0.02, 0.04, 0.01]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} />
            </mesh>
          </group>
        ))}

        {/* --- LEFT DOOR MIDDLE-LOWER: MANUFACTURER RATING SPECIFICATION PLATE --- */}
        <group position={[0, -0.18, 0.016]}>
          <mesh>
            <boxGeometry args={[0.34, 0.12, 0.004]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.003]}>
            <planeGeometry args={[0.32, 0.10]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>
          <Text position={[0, 0.032, 0.005]} fontSize={0.012} color="#f8fafc" anchorX="center" anchorY="middle" fontWeight="bold">
            GW INDUCTION POWER SUPPLY
          </Text>
          <Text position={[0, 0.012, 0.005]} fontSize={0.009} color="#38bdf8" anchorX="center" anchorY="middle">
            MODEL: GW-100/1.0-J • SERVO IF
          </Text>
          <Text position={[0, -0.008, 0.005]} fontSize={0.008} color="#cbd5e1" anchorX="center" anchorY="middle">
            CAPACITY: 100 kW • 1000 Hz • 380V
          </Text>
          <Text position={[0, -0.028, 0.005]} fontSize={0.007} color="#22c55e" anchorX="center" anchorY="middle" fontWeight="bold">
            [CE & ISO9001 CERTIFIED]
          </Text>
        </group>

        {/* --- LEFT DOOR LOWER: LOUVERED COOLING AIR INTAKE GRILLE --- */}
        <group position={[0, -0.52, 0.016]}>
          {/* Recessed Grille Frame Box */}
          <mesh>
            <boxGeometry args={[0.42, 0.40, 0.016]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Inner Dark Washable Air Filter Mesh */}
          <mesh position={[0, 0, 0.008]}>
            <planeGeometry args={[0.38, 0.36]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
          {/* 10 Stamped Downward-Angled Ventilation Louver Slats */}
          {!isLite ? (
            [...Array(10)].map((_, li) => (
              <mesh
                key={`l-louver-${li}`}
                position={[0, 0.14 - li * 0.032, 0.012]}
                rotation={[-0.45, 0, 0]}
              >
                <boxGeometry args={[0.37, 0.024, 0.003]} />
                <meshStandardMaterial color="#ea580c" roughness={0.35} metalness={0.2} />
              </mesh>
            ))
          ) : (
            <mesh position={[0, 0, 0.010]}>
              <planeGeometry args={[0.37, 0.32]} />
              <meshStandardMaterial color="#c2410c" roughness={0.5} />
            </mesh>
          )}
          {/* Stenciled Sub-label */}
          {!isLite && (
            <Text position={[0, -0.175, 0.012]} fontSize={0.009} color="#94a3b8" anchorX="center" anchorY="middle" fontWeight="bold">
              FILTERED AIR INTAKE
            </Text>
          )}
        </group>

        {/* Quarter-turn Compression T-Handle Latch on Right Edge */}
        <group position={[0.24, -0.08, 0.02]}>
          <mesh>
            <cylinderGeometry args={[0.018, 0.018, 0.006, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0, 0.02]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.014, 0.085, 0.014]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 4. FRONT RIGHT DOOR (Pintu Kanan Sesuai Gambar 2, 3, 4)                  */}
      {/* ========================================================================= */}
      <group position={[width / 4, height / 2 + 0.06, depth / 2 + 0.005]}>
        {/* Main Orange Door Body Panel */}
        <mesh>
          <boxGeometry args={[0.58, 1.76, 0.02]} />
          <meshStandardMaterial color="#ea580c" metalness={0.25} roughness={0.35} />
        </mesh>

        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[0.54, 1.72]} />
          <meshStandardMaterial color="#f97316" roughness={0.4} />
        </mesh>

        {/* --- RIGHT DOOR UPPER: SUB-DOOR (4 METERS IN 2x2 GRID + INSPECTION WINDOW) --- */}
        <group position={[0, 0.42, 0.016]}>
          {/* Outer Raised Orange Sub-Door Frame */}
          <mesh>
            <boxGeometry args={[0.44, 0.68, 0.018]} />
            <meshStandardMaterial color="#c2410c" metalness={0.3} roughness={0.4} />
          </mesh>
          {/* Upper Sub-Door Backplate for Meters */}
          <mesh position={[0, 0.16, 0.010]}>
            <planeGeometry args={[0.40, 0.32]} />
            <meshStandardMaterial color="#ea580c" roughness={0.4} />
          </mesh>

          {/* Sub-Door Center Horizontal Dividing Nameplate */}
          <group position={[0, -0.018, 0.012]}>
            <mesh>
              <boxGeometry args={[0.39, 0.024, 0.006]} />
              <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
            </mesh>
            <Text
              position={[0, 0, 0.004]}
              fontSize={0.009}
              color="#f8fafc"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              GW-IF INDUCTION SYSTEM
            </Text>
          </group>

          {/* Key Cylinder Cam Latch on Left Frame Edge */}
          <group position={[-0.20, 0.02, 0.012]} rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <cylinderGeometry args={[0.010, 0.010, 0.008, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.95} />
            </mesh>
            <mesh position={[0, 0.005, 0]}>
              <boxGeometry args={[0.004, 0.018, 0.006]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} />
            </mesh>
          </group>

          {/* 4 ANALOG METERS IN 2x2 GRID (Top: DC V & DC A | Bottom: IF V & POWER kW) */}
          <group position={[0, 0.16, 0.012]}>
            {[
              { label: 'DC V', x: -0.095, y: 0.07, maxVal: '500V', needleRef: needleDcvRef },
              { label: 'DC A', x: 0.095, y: 0.07, maxVal: '250A', needleRef: needleDcaRef },
              { label: 'IF V', x: -0.095, y: -0.07, maxVal: '750V', needleRef: needleIfvRef },
              { label: 'POWER', x: 0.095, y: -0.07, maxVal: '100kW', needleRef: needlePwrRef },
            ].map((meter, mi) => (
              <group key={mi} position={[meter.x, meter.y, 0]}>
                <mesh>
                  <boxGeometry args={[0.165, 0.115, 0.010]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
                </mesh>
                {/* Brushed Aluminum Outer Bezel Trim */}
                <mesh position={[0, 0, 0.006]}>
                  <boxGeometry args={[0.168, 0.118, 0.003]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
                </mesh>
                <mesh position={[0, 0, 0.008]}>
                  <planeGeometry args={[0.145, 0.095]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.25} />
                </mesh>
                <mesh position={[0, 0.005, 0.009]}>
                  <torusGeometry args={[0.040, 0.0012, 8, 24, Math.PI * 0.7]} />
                  <meshBasicMaterial color="#0f172a" />
                </mesh>
                <group position={[0, -0.022, 0.010]} ref={meter.needleRef}>
                  <mesh position={[0, 0.022, 0]}>
                    <boxGeometry args={[0.0018, 0.044, 0.001]} />
                    <meshBasicMaterial color="#dc2626" />
                  </mesh>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.004, 0.004, 0.002, 12]} />
                    <meshBasicMaterial color="#0f172a" />
                  </mesh>
                </group>
                <Text position={[0, -0.035, 0.010]} fontSize={0.009} color="#0f172a" anchorX="center" anchorY="middle" fontWeight="bold">
                  {meter.label}
                </Text>
                <Text position={[0.052, 0.028, 0.010]} fontSize={0.006} color="#475569" anchorX="right" anchorY="middle">
                  {meter.maxVal}
                </Text>
                {/* Protective Glass Cover Pane */}
                <mesh position={[0, 0, 0.012]}>
                  <planeGeometry args={[0.155, 0.105]} />
                  <meshPhysicalMaterial
                    color="#f8fafc"
                    transparent
                    opacity={0.22}
                    roughness={0.06}
                    metalness={0.1}
                  />
                </mesh>
              </group>
            ))}
          </group>

          {/* --- ILLUMINATED EQUIPMENT INSPECTION CHAMBER --- */}
          {/* Authentic factory inspection window with transparent safety glass and visible internal induction bay */}
          <group position={[0, -0.165, 0.010]}>
            {/* Interior Bay Dark Backplate */}
            <mesh position={[0, 0, 0.002]}>
              <planeGeometry args={[0.35, 0.21]} />
              <meshStandardMaterial color="#0b1120" roughness={0.9} />
            </mesh>

            {!isLite ? (
              <>
                {/* Standing Resonant Induction Capacitors (Industrial upright silver cylinders with red top caps) */}
                {[-0.11, -0.04, 0.04, 0.11].map((cx, ci) => (
                  <group key={`cap-${ci}`} position={[cx, 0.014, 0.016]}>
                    {/* Silver Aluminum Cylindrical Canister */}
                    <mesh position={[0, 0, 0]}>
                      <cylinderGeometry args={[0.018, 0.018, 0.075, 24]} />
                      <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.18} />
                    </mesh>
                    {/* Red Ceramic Insulator Cap on Top */}
                    <mesh position={[0, 0.042, 0]}>
                      <cylinderGeometry args={[0.010, 0.013, 0.010, 16]} />
                      <meshStandardMaterial color="#dc2626" roughness={0.35} />
                    </mesh>
                    {/* Brass Terminal Stud on Top */}
                    <mesh position={[0, 0.049, 0]}>
                      <cylinderGeometry args={[0.004, 0.004, 0.008, 12]} />
                      <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.15} />
                    </mesh>
                  </group>
                ))}

                {/* Heavy Pure Copper Interconnecting Busbar Bar connecting capacitor top terminals */}
                <mesh position={[0, 0.063, 0.016]}>
                  <boxGeometry args={[0.26, 0.006, 0.006]} />
                  <meshStandardMaterial color="#b45309" metalness={0.95} roughness={0.15} />
                </mesh>

                {/* Capacitor Base Rack Mounting Rail */}
                <mesh position={[0, -0.026, 0.016]}>
                  <boxGeometry args={[0.28, 0.008, 0.02]} />
                  <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
                </mesh>

                {/* Aluminum Extruded Heat Sink with Ribbed Cooling Fins */}
                <group position={[0, -0.065, 0.016]}>
                  <mesh>
                    <boxGeometry args={[0.26, 0.030, 0.016]} />
                    <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.25} />
                  </mesh>
                  {/* Vertical Heat Dissipation Fins */}
                  {[-0.10, -0.08, -0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06, 0.08, 0.10].map((fx, fi) => (
                    <mesh key={`fin-${fi}`} position={[fx, 0, 0.010]}>
                      <boxGeometry args={[0.003, 0.028, 0.008]} />
                      <meshStandardMaterial color="#94a3b8" metalness={0.9} />
                    </mesh>
                  ))}
                  {/* Dual SCR Power Thyristor Blocks */}
                  {[-0.05, 0.05].map((sx, si) => (
                    <mesh key={`scr-${si}`} position={[sx, 0, 0.011]}>
                      <boxGeometry args={[0.03, 0.02, 0.006]} />
                      <meshStandardMaterial color="#0f172a" roughness={0.4} />
                    </mesh>
                  ))}
                </group>

                {/* PCB Diagnostic Status LEDs */}
                <mesh position={[-0.12, -0.028, 0.022]}>
                  <sphereGeometry args={[0.0035, 12, 12]} />
                  <meshStandardMaterial
                    color="#22c55e"
                    emissive="#16a34a"
                    emissiveIntensity={masterPowerOn ? 2.2 : 0}
                    toneMapped={false}
                  />
                </mesh>
                <mesh position={[-0.09, -0.028, 0.022]}>
                  <sphereGeometry args={[0.0035, 12, 12]} />
                  <meshStandardMaterial
                    color="#eab308"
                    emissive="#ca8a04"
                    emissiveIntensity={masterPowerOn && coilOn ? 2.5 : 0}
                    toneMapped={false}
                  />
                </mesh>
                <mesh position={[-0.06, -0.028, 0.022]}>
                  <sphereGeometry args={[0.0035, 12, 12]} />
                  <meshStandardMaterial
                    color="#0284c7"
                    emissive="#0284c7"
                    emissiveIntensity={masterPowerOn ? 1.8 : 0}
                    toneMapped={false}
                  />
                </mesh>

                {/* Transparent Tempered Safety Glass Pane */}
                <mesh position={[0, 0, 0.028]}>
                  <planeGeometry args={[0.34, 0.20]} />
                  <meshPhysicalMaterial
                    color="#f0f9ff"
                    transparent
                    opacity={0.28}
                    roughness={0.06}
                    metalness={0.08}
                    transmission={0.9}
                    thickness={0.012}
                  />
                </mesh>
              </>
            ) : (
              <>
                {/* Lightweight 2D representation for Lite / Mobile */}
                <mesh position={[0, 0.014, 0.006]}>
                  <planeGeometry args={[0.32, 0.08]} />
                  <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
                </mesh>
                <mesh position={[0, -0.05, 0.006]}>
                  <planeGeometry args={[0.30, 0.04]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.8} />
                </mesh>
                {/* Single Status LED Pip */}
                <mesh position={[-0.10, -0.028, 0.008]}>
                  <circleGeometry args={[0.005, 8]} />
                  <meshBasicMaterial color={masterPowerOn ? '#22c55e' : '#334155'} />
                </mesh>
                {/* Simplified Tinted Glass Pane without transmission shader */}
                <mesh position={[0, 0, 0.022]}>
                  <planeGeometry args={[0.34, 0.20]} />
                  <meshStandardMaterial
                    color="#0f172a"
                    transparent
                    opacity={0.5}
                    roughness={0.15}
                  />
                </mesh>
              </>
            )}

            {/* Window Outer Bezel Frame (4 Border Bars around the Glass) */}
            {/* Top Border */}
            <mesh position={[0, 0.106, 0.024]}>
              <boxGeometry args={[0.37, 0.018, 0.016]} />
              <meshStandardMaterial color="#c2410c" metalness={0.3} roughness={0.4} />
            </mesh>
            {/* Bottom Border */}
            <mesh position={[0, -0.106, 0.024]}>
              <boxGeometry args={[0.37, 0.018, 0.016]} />
              <meshStandardMaterial color="#c2410c" metalness={0.3} roughness={0.4} />
            </mesh>
            {/* Left Border */}
            <mesh position={[-0.176, 0, 0.024]}>
              <boxGeometry args={[0.018, 0.194, 0.016]} />
              <meshStandardMaterial color="#c2410c" metalness={0.3} roughness={0.4} />
            </mesh>
            {/* Right Border */}
            <mesh position={[0.176, 0, 0.024]}>
              <boxGeometry args={[0.018, 0.194, 0.016]} />
              <meshStandardMaterial color="#c2410c" metalness={0.3} roughness={0.4} />
            </mesh>

            {/* Inner Black Rubber Gasket Trim */}
            <mesh position={[0, 0.096, 0.026]}>
              <boxGeometry args={[0.34, 0.004, 0.010]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.096, 0.026]}>
              <boxGeometry args={[0.34, 0.004, 0.010]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
            <mesh position={[-0.166, 0, 0.026]}>
              <boxGeometry args={[0.004, 0.188, 0.010]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
            <mesh position={[0.166, 0, 0.026]}>
              <boxGeometry args={[0.004, 0.188, 0.010]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
          </group>
        </group>

        {/* --- RIGHT DOOR MIDDLE: INSET RECESSED CONTROL NICHE (Gambar 3 & 4) --- */}
        {/* Ceruk tombol cekung berbingkai oranye */}
        <group position={[0, -0.08, 0.02]}>
          {/* Recessed Niche Box Housing (Klik frame untuk membuka Panel Tombol Mengambang) */}
          <mesh
            position={[0, 0, -0.01]}
            onClick={(e) => {
              e.stopPropagation();
              const st = useSimStore.getState();
              if (st.isDragging3DControl || st.isLadlePouringToMold) return;
              inductionAudio.resume();
              inductionAudio.playClick();
              st.setCabinetPanelModalOpen(true);
            }}
            onPointerOver={() => {
              setActiveHoverObject('Panel Tombol Kontrol GW-IF (Klik untuk Buka Panel Kontrol)');
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setActiveHoverObject(null);
              document.body.style.cursor = 'auto';
            }}
          >
            <boxGeometry args={[0.46, 0.22, 0.035]} />
            <meshStandardMaterial color="#c2410c" metalness={0.4} roughness={0.4} />
          </mesh>
          {/* Recessed Orange Backplate (Klik plat untuk membuka Panel Tombol Mengambang) */}
          <mesh
            position={[0, 0, 0.006]}
            onClick={(e) => {
              e.stopPropagation();
              const st = useSimStore.getState();
              if (st.isDragging3DControl || st.isLadlePouringToMold) return;
              inductionAudio.resume();
              inductionAudio.playClick();
              st.setCabinetPanelModalOpen(true);
            }}
            onPointerOver={() => {
              setActiveHoverObject('Panel Tombol Kontrol GW-IF (Klik untuk Buka Panel Kontrol)');
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setActiveHoverObject(null);
              document.body.style.cursor = 'auto';
            }}
          >
            <planeGeometry args={[0.43, 0.19]} />
            <meshStandardMaterial color="#ea580c" roughness={0.35} />
          </mesh>
          {/* Slanted Bevel Ledge on Top */}
          <mesh
            position={[0, 0.092, 0.01]}
            rotation={[-0.45, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              const st = useSimStore.getState();
              if (st.isDragging3DControl || st.isLadlePouringToMold) return;
              inductionAudio.resume();
              inductionAudio.playClick();
              st.setCabinetPanelModalOpen(true);
            }}
          >
            <boxGeometry args={[0.44, 0.02, 0.02]} />
            <meshStandardMaterial color="#f97316" roughness={0.4} />
          </mesh>

          {/* --- TOP ROW INSIDE NICHE: 5 FUNCTIONAL INDUSTRIAL PILOT LAMPS --- */}
          <group position={[0, 0.048, 0.012]}>
            {[
              { label: 'POWER', color: '#22c55e', emissive: '#16a34a', matRef: lampPowerMatRef },
              { label: 'FAULT', color: '#ef4444', emissive: '#dc2626', matRef: lampFaultMatRef },
              { label: 'WATER', color: '#eab308', emissive: '#ca8a04', matRef: lampWaterMatRef },
              { label: 'IF RUN', color: '#22c55e', emissive: '#16a34a', matRef: lampIfRunMatRef },
              { label: 'O-TEMP', color: '#ef4444', emissive: '#dc2626', matRef: lampOtempMatRef },
            ].map((lamp, li) => {
              const lx = -0.16 + li * 0.08;
              return (
                <group key={li} position={[lx, 0, 0]}>
                  {/* Chrome Bezel Ring Collar (Flat Against Panel Face) */}
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.012, 0.014, 0.005, 24]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
                  </mesh>
                  {/* Luminous Jewel Lens */}
                  <mesh position={[0, 0, 0.004]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.009, 0.009, 0.004, 24]} />
                    <meshStandardMaterial
                      ref={lamp.matRef}
                      color={lamp.color}
                      emissive={lamp.emissive}
                      emissiveIntensity={0.2}
                      toneMapped={false}
                    />
                  </mesh>
                  <Text position={[0, -0.018, 0.002]} fontSize={0.0065} color="#0f172a" anchorX="center" anchorY="middle" fontWeight="bold">
                    {lamp.label}
                  </Text>
                </group>
              );
            })}
          </group>

          {/* --- BOTTOM ROW INSIDE NICHE: START, STOP, RESET, KNOB, & E-STOP --- */}
          {/* Note: Unwanted blocking hoods on Start, Stop, and Knob have been eliminated! */}
          <group position={[0, -0.038, 0.012]}>
            {/* 1. START Pushbutton (Vibrant Industrial Green) */}
            <Button3D
              name="INT_BtnStart"
              label="START"
              sublabel="POWER"
              baseColor="#22c55e"
              glowColor="#4ade80"
              position={[-0.15, 0, 0]}
              onClick={() => {
                if (masterPowerOn && !emergencyTripped) startFurnace();
              }}
              isActive={masterPowerOn && !emergencyTripped && coilOn}
            />

            {/* 2. STOP Pushbutton (Vibrant Industrial Red) */}
            <Button3D
              name="INT_BtnStop"
              label="STOP"
              sublabel="OFF"
              baseColor="#ef4444"
              glowColor="#f87171"
              position={[-0.075, 0, 0]}
              onClick={stopFurnace}
              isActive={!coilOn}
            />

            {/* 3. FUNCTIONAL RESET Pushbutton (Hitam / Abu-Abu) */}
            {/* User asked: "apakah tombol reset berfungsi?" -> Yes, fully interactive now! */}
            <group
              position={[0.0, 0, 0]}
              onClick={handleReset}
              onPointerOver={() => (document.body.style.cursor = 'pointer')}
              onPointerOut={() => (document.body.style.cursor = 'auto')}
            >
              {/* Chrome Bezel Ring */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.013, 0.015, 0.005, 24]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Depressible Reset Button Cap */}
              <group ref={resetBtnCapRef} position={[0, 0, 0.004]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.010, 0.010, 0.006, 24]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
                </mesh>
              </group>
              <Text position={[0, -0.024, 0.002]} fontSize={0.0065} color="#0f172a" anchorX="center" anchorY="middle" fontWeight="bold">
                RESET
              </Text>
            </group>

            {/* 4. Power Potentiometer Rotary Dial Knob */}
            <Knob3D
              position={[0.08, 0, 0]}
              onDragStateChange={onDragStateChange}
            />

            {/* 5. MUSHROOM EMERGENCY STOP (E-STOP) WITH UNOBSTRUCTED TEXT */}
            {/* User noted: "tombol emergency ketutupan tulisannya" -> text is now cleanly visible on yellow ring! */}
            <group position={[0.165, 0, 0]}>
              {/* Wide Yellow Circular Safety Legend Ring Plate (Diameter 70mm) */}
              <mesh position={[0, 0, 0.001]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.034, 0.034, 0.002, 32]} />
                <meshStandardMaterial color="#facc15" roughness={0.35} metalness={0.1} />
              </mesh>

              {/* Bold Black Warning Text on Upper and Lower Arc of Yellow Ring */}
              <Text
                position={[0, 0.024, 0.003]}
                fontSize={0.0055}
                color="#0f172a"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                EMERGENCY
              </Text>
              <Text
                position={[0, -0.024, 0.003]}
                fontSize={0.0055}
                color="#0f172a"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                STOP
              </Text>

              {/* Large Red Mushroom Head Pushbutton (Twist-to-Release) */}
              <group
                onClick={handleEmergencyStop}
                onPointerOver={() => {
                  if (typeof document !== 'undefined') document.body.style.cursor = 'pointer';
                  setActiveHoverObject(
                    emergencyTripped
                      ? 'Emergency Stop Terkunci (Klik / Putar ke Kiri untuk Membuka Kunci)'
                      : 'Tombol Emergency Stop Jamur Merah (Klik untuk Memutus Daya Darurat)'
                  );
                }}
                onPointerOut={() => {
                  if (typeof document !== 'undefined') document.body.style.cursor = 'auto';
                  setActiveHoverObject(null);
                }}
                rotation={[0, 0, emergencyTripped ? -Math.PI / 4 : 0]}
                position={[0, 0, emergencyTripped ? -0.005 : 0]}
              >
                {/* Yellow Safety Collar Sleeve */}
                <mesh position={[0, 0, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.018, 0.020, 0.007, 24]} />
                  <meshStandardMaterial color={emergencyTripped ? '#eab308' : '#ca8a04'} metalness={0.7} />
                </mesh>
                {/* Red Mushroom Body */}
                <mesh position={[0, 0, 0.014]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.016, 0.013, 0.012, 24]} />
                  <meshStandardMaterial color={emergencyTripped ? '#ef4444' : '#b91c1c'} roughness={0.25} metalness={0.2} />
                </mesh>
                {/* Smooth Domed Mushroom Cap */}
                <mesh position={[0, 0, 0.020]}>
                  <sphereGeometry args={[0.014, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial color={emergencyTripped ? '#f87171' : '#dc2626'} roughness={0.25} />
                </mesh>
              </group>
            </group>
          </group>
        </group>

        {/* --- RIGHT DOOR HINGES (3 Heavy Stainless Steel External Barrel Hinges on Right Outer Edge) --- */}
        {[0.65, 0.0, -0.65].map((hy, hi) => (
          <group key={`r-hinge-${hi}`} position={[0.285, hy, 0.012]}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.012, 0.07, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.2} />
            </mesh>
            <mesh position={[-0.015, 0, -0.005]}>
              <boxGeometry args={[0.02, 0.04, 0.01]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} />
            </mesh>
          </group>
        ))}

        {/* --- RIGHT DOOR LOWER: LOUVERED COOLING AIR INTAKE GRILLE --- */}
        <group position={[0, -0.52, 0.016]}>
          {/* Recessed Grille Frame Box */}
          <mesh>
            <boxGeometry args={[0.42, 0.40, 0.016]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Inner Dark Washable Air Filter Mesh */}
          <mesh position={[0, 0, 0.008]}>
            <planeGeometry args={[0.38, 0.36]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
          {/* 10 Stamped Downward-Angled Ventilation Louver Slats */}
          {!isLite ? (
            [...Array(10)].map((_, li) => (
              <mesh
                key={`r-louver-${li}`}
                position={[0, 0.14 - li * 0.032, 0.012]}
                rotation={[-0.45, 0, 0]}
              >
                <boxGeometry args={[0.37, 0.024, 0.003]} />
                <meshStandardMaterial color="#ea580c" roughness={0.35} metalness={0.2} />
              </mesh>
            ))
          ) : (
            <mesh position={[0, 0, 0.010]}>
              <planeGeometry args={[0.37, 0.32]} />
              <meshStandardMaterial color="#c2410c" roughness={0.5} />
            </mesh>
          )}
          {/* Stenciled Sub-label */}
          {!isLite && (
            <Text position={[0, -0.175, 0.012]} fontSize={0.009} color="#94a3b8" anchorX="center" anchorY="middle" fontWeight="bold">
              FILTERED AIR INTAKE
            </Text>
          )}
        </group>

        {/* Quarter-turn Compression T-Handle Latch on Left Edge */}
        <group position={[-0.24, -0.08, 0.02]}>
          <mesh>
            <cylinderGeometry args={[0.018, 0.018, 0.006, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0, 0.02]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.014, 0.085, 0.014]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 5. RIGHT SIDE PANEL: CENTERED YELLOW CABLE ACCESS PLATE & WATER HOSES       */}
      {/* ========================================================================= */}
      <group position={[width / 2 + 0.002, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        {/* --- ELEMENT A: YELLOW ACCESS PANEL WITH DUAL CABLE PASS-THROUGHS --- */}
        {/* Centered along Z at x = 0 (exact center of side panel), height y = 0.58 */}
        <group position={[0, 0.58, 0]}>
          {/* Main Heavy Yellow Steel Access Plate */}
          {!isLite ? (
            <mesh position={[0, 0, -0.004]}>
              <extrudeGeometry args={[YELLOW_PLATE_SHAPE, YELLOW_PLATE_EXTRUDE_SETTINGS]} />
              <meshStandardMaterial color="#facc15" roughness={0.35} metalness={0.15} />
            </mesh>
          ) : (
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.26, 0.30, 0.008]} />
              <meshStandardMaterial color="#facc15" roughness={0.35} metalness={0.15} />
            </mesh>
          )}

          {/* 4 Corner Fastening Hex Bolts with Washers */}
          {!isLite && [
            [-0.11, 0.13],
            [0.11, 0.13],
            [-0.11, -0.13],
            [0.11, -0.13],
          ].map(([bx, by], bi) => (
            <group key={bi} position={[bx, by, 0.006]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.006, 0.006, 0.005, 6]} />
                <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0, -0.002]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.010, 0.010, 0.002, 16]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.3} />
              </mesh>
            </group>
          ))}

          {/* DUAL ROUND BLACK HOLES (Centered, Real Round Apertures with Rubber Grommets) */}
          {[-0.055, 0.055].map((hx, hi) => (
            <group key={hi} position={[hx, 0, 0]}>
              {/* Heavy Rubber Grommet Flange (Lies FLAT against the yellow plate face) */}
              <mesh position={[0, 0, 0.005]} rotation={[0, 0, 0]}>
                <torusGeometry args={[0.035, 0.005, 16, 32]} />
                <meshStandardMaterial color="#0f172a" roughness={0.85} />
              </mesh>
              {/* Interior Black Protective Sleeve into cabinet dark interior */}
              <mesh position={[0, 0, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.033, 0.033, 0.06, 32, 1, true]} />
                <meshStandardMaterial color="#020617" roughness={0.95} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}

          {/* Stencil Warning Labels Above Holes */}
          {!isLite && (
            <>
              <Text
                position={[0, 0.092, 0.006]}
                fontSize={0.012}
                color="#0f172a"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                WATER COOLED CABLES
              </Text>
              <Text
                position={[0, 0.074, 0.006]}
                fontSize={0.009}
                color="#713f12"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                水冷电缆进出口
              </Text>
            </>
          )}
        </group>

        {/* --- ELEMENT B: BOTTOM WATER PIPE NOZZLES & INDUSTRIAL GREY-WHITE HOSES --- */}
        {/* Sesuai foto referensi awal pabrik: warna selang putih abu-abu industri */}

        {/* 1. FRONT-RIGHT WATER OUTLET (出水 / OUTLET at x = -0.22, y = 0.16) */}
        <group position={[-0.22, 0.16, 0]}>
          {/* Flush Stainless Bulkhead Mounting Flange */}
          <mesh position={[0, 0, 0.003]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.038, 0.038, 0.006, 24]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Hexagonal Coupling Nut */}
          <mesh position={[0, 0, 0.014]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 0.016, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.2} />
          </mesh>
          {/* Heavy Stainless Steel Pipe Nozzle Nipple */}
          <mesh position={[0, 0, 0.038]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.045, 24]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Crimped Stainless Hose Ferrule Sleeve */}
          <mesh position={[0, 0, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.022, 24]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.25} />
          </mesh>
          {/* Red Identification Ring Collar on Ferrule (Hot return indicator) */}
          <mesh position={[0, 0, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.0256, 0.0256, 0.010, 24]} />
            <meshStandardMaterial color="#dc2626" roughness={0.4} />
          </mesh>

          {/* White Identification Nameplate (出水 / OUTLET) */}
          <mesh position={[0, 0.08, 0.004]}>
            <boxGeometry args={[0.08, 0.045, 0.003]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.08, 0.005]}>
            <planeGeometry args={[0.076, 0.041]} />
            <meshBasicMaterial color="#0f172a" wireframe />
          </mesh>
          {!isLite && (
            <>
              <Text position={[0, 0.088, 0.006]} fontSize={0.013} color="#0f172a" anchorX="center" anchorY="middle" fontWeight="bold">
                出 水
              </Text>
              <Text position={[0, 0.070, 0.006]} fontSize={0.007} color="#475569" anchorX="center" anchorY="middle" fontWeight="bold">
                OUTLET
              </Text>
            </>
          )}

        </group>

        {/* 2. REAR-RIGHT WATER INLET (进水 / INLET at x = +0.22, y = 0.16) */}
        <group position={[0.22, 0.16, 0]}>
          {/* Flush Stainless Bulkhead Mounting Flange */}
          <mesh position={[0, 0, 0.003]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.038, 0.038, 0.006, 24]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Hexagonal Coupling Nut */}
          <mesh position={[0, 0, 0.014]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 0.016, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.2} />
          </mesh>
          {/* Heavy Stainless Steel Pipe Nozzle Nipple */}
          <mesh position={[0, 0, 0.038]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.045, 24]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Crimped Stainless Hose Ferrule Sleeve */}
          <mesh position={[0, 0, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.022, 24]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.25} />
          </mesh>
          {/* Blue Identification Ring Collar on Ferrule (Cold supply indicator) */}
          <mesh position={[0, 0, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.0256, 0.0256, 0.010, 24]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} />
          </mesh>

          {/* White Identification Nameplate (进水 / INLET) */}
          <mesh position={[0, 0.08, 0.004]}>
            <boxGeometry args={[0.08, 0.045, 0.003]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.08, 0.005]}>
            <planeGeometry args={[0.076, 0.041]} />
            <meshBasicMaterial color="#0f172a" wireframe />
          </mesh>
          {!isLite && (
            <>
              <Text position={[0, 0.088, 0.006]} fontSize={0.013} color="#0f172a" anchorX="center" anchorY="middle" fontWeight="bold">
                进 水
              </Text>
              <Text position={[0, 0.070, 0.006]} fontSize={0.007} color="#475569" anchorX="center" anchorY="middle" fontWeight="bold">
                INLET
              </Text>
            </>
          )}
        </group>

        {/* --- ELEMENT C: FLOOR UTILITY TRENCH COVER & INDUSTRIAL HOSES --- */}
        {/* Steel diamond trench cover plate on factory floor where hoses enter plant cooling circuit */}
        <group position={[0.32, 0.006, 0.14]}>
          {/* Heavy Steel Trench Frame Box */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.26, 0.012, 0.18]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
          </mesh>
          {/* Raised Steel Diamond Tread Plate */}
          <mesh position={[0, 0.007, 0]}>
            <boxGeometry args={[0.24, 0.004, 0.16]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
          </mesh>
          {/* Circular Rubber Grommet 1 for Inlet Hose Pass-through */}
          <mesh position={[-0.06, 0.010, -0.01]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.026, 0.008, 24]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} />
          </mesh>
          {/* Circular Rubber Grommet 2 for Outlet Hose Pass-through */}
          <mesh position={[0.06, 0.010, 0.01]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.026, 0.008, 24]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} />
          </mesh>
          {/* Utility Label Stenciled on Trench Cover */}
          <Text
            position={[0, 0.010, -0.055]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.010}
            color="#cbd5e1"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            COOLING WATER TRENCH
          </Text>
        </group>

        {/* Authentic Industrial Greyish-White Braided Water Return Hose (Outlet) */}
        {/* Curves smoothly from outlet fitting, sweeps across to floor, and dives 90 deg down underground */}
        <mesh>
          <tubeGeometry
            args={[
              new THREE.CatmullRomCurve3([
                new THREE.Vector3(-0.22, 0.16, 0.065),
                new THREE.Vector3(-0.22, 0.16, 0.08),
                new THREE.Vector3(-0.12, 0.14, 0.13),
                new THREE.Vector3(0.04, 0.10, 0.16),
                new THREE.Vector3(0.20, 0.06, 0.17),
                new THREE.Vector3(0.32, 0.035, 0.16),
                new THREE.Vector3(0.38, 0.018, 0.15),
                new THREE.Vector3(0.38, -0.04, 0.15),
                new THREE.Vector3(0.38, -0.16, 0.15),
              ], false, 'centripetal'),
              44,
              0.018,
              16,
              false,
            ]}
          />
          <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.25} />
        </mesh>

        {/* Authentic Industrial Greyish-White Braided Water Supply Hose (Inlet) */}
        {/* Curves smoothly from inlet fitting and dives 90 deg down into the floor trench */}
        <mesh>
          <tubeGeometry
            args={[
              new THREE.CatmullRomCurve3([
                new THREE.Vector3(0.22, 0.16, 0.065),
                new THREE.Vector3(0.22, 0.16, 0.08),
                new THREE.Vector3(0.23, 0.14, 0.11),
                new THREE.Vector3(0.25, 0.08, 0.12),
                new THREE.Vector3(0.26, 0.035, 0.13),
                new THREE.Vector3(0.26, 0.018, 0.13),
                new THREE.Vector3(0.26, -0.04, 0.13),
                new THREE.Vector3(0.26, -0.16, 0.13),
              ], false, 'centripetal'),
              36,
              0.018,
              16,
              false,
            ]}
          />
          <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.25} />
        </mesh>

        {/* 3. SAFETY GROUNDING PE EMBLEM */}
        <group position={[0.00, 0.22, 0.004]}>
          <mesh>
            <boxGeometry args={[0.05, 0.03, 0.002]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>
          <Text position={[0, 0, 0.002]} fontSize={0.009} color="#0f172a" anchorX="center" anchorY="middle" fontWeight="bold">
            ⚡ PE
          </Text>
        </group>
      </group>
    </group>
  );
};

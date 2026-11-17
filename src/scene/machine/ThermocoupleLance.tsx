import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { getBlackbodyColor } from '../../sim/blackbody';
import { inductionAudio } from '../fx/InductionAudio';

interface ThermocoupleLanceProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Authentic CYY-W330B Handheld Molten Metal Smelting Thermometer (Termometer Celup Portabel).
 * Full interactive manual control:
 * - Picked up immediately to operator hands when clicked (isLanceHeld).
 * - Carried around everywhere across the workshop with WASD walking in POV mode.
 * - Smooth viewmodel attached to operator camera with natural footstep bobbing.
 * - The operator manually directs and dips the lance into the crucible:
 *   - Hold [SPACEBAR] or [ARROW DOWN] to dip; release to raise.
 *   - Scroll mouse wheel up/down to adjust depth.
 *   - Or use the manual depth slider in the HUD toolbar.
 * - Live physical immersion contact detection:
 *   - Detects real 3D spatial entry of the KB-602 sensor tip into the crucible melt bath.
 *   - Tip glows with incandescent blackbody radiation.
 *   - After 2.0s contact: BEEP! Reading locks onto the exact melt temperature.
 * - Digital display beside the black button shows ONLY the temperature value and °C.
 */
export const ThermocoupleLance: React.FC<ThermocoupleLanceProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const isLanceHeld = useSimStore((s) => s.isLanceHeld);
  const setIsLanceHeld = useSimStore((s) => s.setIsLanceHeld);
  const isLanceDipping = useSimStore((s) => s.isLanceDipping);
  const lanceManualDepth = useSimStore((s) => s.lanceManualDepth);
  const setLanceManualDepth = useSimStore((s) => s.setLanceManualDepth);
  const recordImmersionReading = useSimStore((s) => s.recordImmersionReading);
  const setIsDragging3DControl = useSimStore((s) => s.setIsDragging3DControl);
  const setActiveHoverObject = useSimStore((s) => s.setActiveHoverObject);
  const immersionTempC = useSimStore((s) => s.immersionTempC);
  const storedLancePos = useSimStore((s) => s.storedLancePos);
  const storeLanceAtPos = useSimStore((s) => s.storeLanceAtPos);
  const isLanceOnRack = useSimStore((s) => s.isLanceOnRack);
  const cameraPreset = useSimStore((s) => s.cameraPreset);
  const selectedMaterial = useSimStore((s) => s.selectedMaterial);
  const { camera } = useThree();

  // Track when lance is put away to record position under user's feet (unless returned to pegboard rack)
  const prevIsHeldRef = useRef(isLanceHeld);
  useEffect(() => {
    if (prevIsHeldRef.current && !isLanceHeld) {
      if (!isLanceOnRack) {
        const camPos = camera.position;
        const floorY = Math.max(0.04, camPos.y - 1.68);
        const forward = new THREE.Vector3(0, 0, -0.45).applyQuaternion(camera.quaternion);
        forward.y = 0;
        storeLanceAtPos([camPos.x + forward.x, floorY + 0.04, camPos.z + forward.z]);
      }
    }
    prevIsHeldRef.current = isLanceHeld;
  }, [isLanceHeld, isLanceOnRack, camera, storeLanceAtPos]);

  // Escape key handler to put lance down without jumping camera
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLanceHeld) {
        inductionAudio.resume();
        inductionAudio.playClick();
        setIsLanceHeld(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isLanceHeld, setIsLanceHeld]);

  const [hovered, setHovered] = useState(false);
  const [isDraggingLance, setIsDraggingLance] = useState(false);
  const [displayTempStr, setDisplayTempStr] = useState<string>('25.0 °C');
  const [isMeasuringNow, setIsMeasuringNow] = useState(false);
  const lastDisplayUpdateRef = useRef(0);

  useEffect(() => {
    if (immersionTempC !== null && immersionTempC > 0) {
      setDisplayTempStr(`${immersionTempC.toFixed(1)} °C`);
    } else {
      setDisplayTempStr(`${(selectedMaterial?.ambientTempC || 25.0).toFixed(1)} °C`);
    }
  }, [immersionTempC, selectedMaterial?.ambientTempC]);

  const lanceGroupRef = useRef<THREE.Group>(null);
  const tipMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Dragging state tracking refs
  const dragStartYRef = useRef(0);
  const initialDragDepthRef = useRef(0);
  const isSpaceKeyDownRef = useRef(false);

  // Immersion contact & measurement refs
  const immersionContactTimeRef = useRef(0);
  const hasMeasuredThisDipRef = useRef(false);
  const tipCoolingIntensityRef = useRef(0);

  // Global Pointer Events for Manual Drag-to-Dip
  useEffect(() => {
    if (!isDraggingLance) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaY = e.clientY - dragStartYRef.current;
      // Dragging down (deltaY > 0) dips lance into crucible, up raises it
      const newDepth = Math.max(0.0, Math.min(1.0, initialDragDepthRef.current + deltaY * 0.0035));
      setLanceManualDepth(newDepth);
    };

    const handlePointerUp = () => {
      setIsDraggingLance(false);
      setIsDragging3DControl(false);
      document.body.style.cursor = 'auto';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingLance, setLanceManualDepth, setIsDragging3DControl]);

  // Global Keyboard Controls (Hold SPACE / ARROW DOWN to Dip)
  useEffect(() => {
    if (!isLanceHeld && cameraPreset !== 'lance') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' && !e.repeat) {
        e.preventDefault();
        isSpaceKeyDownRef.current = true;
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const curr = useSimStore.getState().lanceManualDepth;
        setLanceManualDepth(Math.max(0.0, curr - 0.1));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        isSpaceKeyDownRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isLanceHeld, cameraPreset, setLanceManualDepth]);

  // Optional mouse wheel scroll to dip/raise while holding lance
  useEffect(() => {
    if (!isLanceHeld && cameraPreset !== 'lance') return;

    const handleWheel = (e: WheelEvent) => {
      // Scroll down (deltaY > 0) dips in, scroll up raises
      const curr = useSimStore.getState().lanceManualDepth;
      const step = e.deltaY > 0 ? 0.08 : -0.08;
      setLanceManualDepth(curr + step);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isLanceHeld, cameraPreset, setLanceManualDepth]);

  useFrame((_, delta) => {
    if (!lanceGroupRef.current) return;

    // Handle smooth left-click / arrow down / HUD button hold-to-dip driving
    const isHoldingHudDip = useSimStore.getState().isHoldingLanceDip;
    if (isSpaceKeyDownRef.current || isHoldingHudDip) {
      const current = useSimStore.getState().lanceManualDepth;
      if (current < 1.0) {
        setLanceManualDepth(Math.min(1.0, current + delta * 2.2));
      }
    } else if (!isDraggingLance && isLanceHeld && !isLanceDipping) {
      // Gentle return towards 0 if released
      const current = useSimStore.getState().lanceManualDepth;
      if (current > 0) {
        setLanceManualDepth(Math.max(0.0, current - delta * 1.6));
      }
    }

    const effectiveTargetDepth = isLanceDipping || isHoldingHudDip ? Math.max(lanceManualDepth, isLanceDipping ? 1.0 : lanceManualDepth) : lanceManualDepth;

    if (isLanceHeld) {
      // Handheld first-person viewmodel (carried in operator hands across workshop)
      const depth = effectiveTargetDepth;

      // Viewmodel position so handle and digital display are clearly in operator view
      const localOffset = new THREE.Vector3(
        0.16 - depth * 0.10,
        -0.07 - depth * 0.28,
        -0.38 - depth * 0.35
      );
      const worldTargetPos = camera.position.clone().add(localOffset.applyQuaternion(camera.quaternion));

      // Orientation relative to camera:
      // Lance local +Z points forward into the scene; rear panel tilted comfortably towards eye level.
      const pitch = THREE.MathUtils.lerp(0.24, 0.46, depth);
      const yaw = Math.PI - 0.02;
      const roll = 0.02;
      const heldEuler = new THREE.Euler(pitch, yaw, roll, 'YXZ');
      const heldQuat = new THREE.Quaternion().setFromEuler(heldEuler);
      const worldTargetQuat = camera.quaternion.clone().multiply(heldQuat);

      lanceGroupRef.current.position.lerp(worldTargetPos, Math.min(1, delta * 30));
      lanceGroupRef.current.quaternion.slerp(worldTargetQuat, Math.min(1, delta * 30));
    } else {
      // Resting position:
      // If on pegboard stand rack (Hook 1), orient hanging vertically down with handle on hook and body sideways.
      // If dropped on floor under operator feet, orient lying horizontally.
      const isAtRack = isLanceOnRack || (Math.abs(storedLancePos[0] - 2.70) < 0.20 && Math.abs(storedLancePos[1] - 1.42) < 0.20);
      const restTargetPos = new THREE.Vector3(...storedLancePos);
      const restTargetQuat = isAtRack
        ? new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))
        : new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, -Math.PI / 2));

      lanceGroupRef.current.position.lerp(restTargetPos, Math.min(1, delta * 12));
      lanceGroupRef.current.quaternion.slerp(restTargetQuat, Math.min(1, delta * 12));
    }

    // =========================================================================
    // PHYSICAL IMMERSION CONTACT DETECTION IN CRUCIBLE MELT BATH
    // =========================================================================
    const tipLocal = new THREE.Vector3(0, -0.29, 1.36);
    const tipWorldPos = tipLocal.applyMatrix4(lanceGroupRef.current.matrixWorld);

    // Crucible melt bath cylinder in world coordinates:
    // Center at [0, Y, 0], radius <= 0.65m, elevation 0.65m to 2.10m
    const tipDistFromCenter = Math.hypot(tipWorldPos.x, tipWorldPos.z);
    const isTipInMelt = isLanceHeld && (
      isLanceDipping ||
      effectiveTargetDepth >= 0.58 ||
      (cameraPreset === 'lance' && effectiveTargetDepth >= 0.45) ||
      (tipDistFromCenter <= 1.2 && tipWorldPos.y >= 0.50 && tipWorldPos.y <= 2.30)
    );

    const simState = useSimStore.getState().sim;

    if (isTipInMelt) {
      // Tip is in molten bath: glowing blackbody radiation
      if (tipMatRef.current && tipMatRef.current.emissive) {
        if (simState.temperatureC >= 450) {
          const glow = getBlackbodyColor(simState.temperatureC);
          tipMatRef.current.color.setRGB(glow.r, glow.g, glow.b);
          tipMatRef.current.emissive.setRGB(glow.r, glow.g, glow.b);
          tipCoolingIntensityRef.current = Math.min(3.0, glow.emissiveIntensity * 2.0);
          tipMatRef.current.emissiveIntensity = tipCoolingIntensityRef.current;
        }
      }

      // Contact timer accumulates
      immersionContactTimeRef.current += delta;
      const contactSecs = immersionContactTimeRef.current;

      // Throttle display updates to ~6.6 Hz during immersion
      const now = performance.now();
      if (now - lastDisplayUpdateRef.current > 150) {
        lastDisplayUpdateRef.current = now;
        if (!hasMeasuredThisDipRef.current) {
          const riseFactor = Math.min(1.0, 0.35 + 0.65 * (contactSecs / 2.0));
          const dynamicTemp = Math.round(simState.temperatureC * riseFactor * 10) / 10;
          setDisplayTempStr(`${dynamicTemp.toFixed(1)} °C`);
          setIsMeasuringNow(true);
        }
      }

      // Stable immersion requires 2.0s contact
      if (contactSecs >= 2.0 && !hasMeasuredThisDipRef.current) {
        hasMeasuredThisDipRef.current = true;
        const measured = Math.round(simState.temperatureC * 10) / 10;
        recordImmersionReading(measured);
        setDisplayTempStr(`${measured.toFixed(1)} °C`);
        setIsMeasuringNow(false);
      }
    } else {
      // Tip pulled out of bath: reset contact timer and smoothly cool glowing probe tip
      if (effectiveTargetDepth < 0.35 || !isTipInMelt) {
        immersionContactTimeRef.current = 0;
        hasMeasuredThisDipRef.current = false;
        if (isMeasuringNow) {
          setIsMeasuringNow(false);
          const currentReading = useSimStore.getState().immersionTempC;
          if (currentReading !== null && currentReading > 0) {
            setDisplayTempStr(`${currentReading.toFixed(1)} °C`);
          } else {
            setDisplayTempStr(`${(selectedMaterial?.ambientTempC || 25.0).toFixed(1)} °C`);
          }
        }
      }

      if (tipMatRef.current && tipMatRef.current.emissive) {
        if (tipCoolingIntensityRef.current > 0.05) {
          tipCoolingIntensityRef.current = Math.max(0, tipCoolingIntensityRef.current - delta * 0.7);
          tipMatRef.current.emissiveIntensity = tipCoolingIntensityRef.current;
        } else {
          tipMatRef.current.color.set('#d4be98');
          tipMatRef.current.emissive.set('#000000');
          tipMatRef.current.emissiveIntensity = 0;
        }
      }
    }
  });

  const currentTemp = immersionTempC;
  const hasReading = currentTemp !== null && currentTemp > 0;
  const isReadingComplete = hasReading;

  return (
    <group position={position} rotation={rotation} name="CYY_W330B_Thermometer_System">
      {/* ========================================================================= */}
      {/* DYNAMIC CYY-W330B HAND-HELD SMELTING THERMOMETER (CLICK & DRAG TO DIP)   */}
      {/* ========================================================================= */}
      <group
        ref={lanceGroupRef}
        name="CYY_W330B_Handheld_Thermometer"
        onClick={(e) => {
          e.stopPropagation();
          if (!isLanceHeld) {
            inductionAudio.resume();
            inductionAudio.playClick();
            setIsLanceHeld(true);
          }
        }}
        onPointerOver={() => {
          setHovered(true);
          setActiveHoverObject(
            !isLanceHeld
              ? 'Termometer Celup CYY-W330B (Klik untuk Ambil)'
              : 'Termometer Celup CYY-W330B (Dipegang - Gunakan Tombol Merah HUD untuk Mencelupkan)'
          );
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          setActiveHoverObject(null);
          if (!isDraggingLance) document.body.style.cursor = 'auto';
        }}
      >
        {/* ======================================================================= */}
        {/* A. STAINLESS STEEL METER HOUSING BOX (W330B Body)                       */}
        {/* Width = 0.13m (X), Height = 0.085m (Y), Length = 0.20m (Z)              */}
        {/* ======================================================================= */}
        <group position={[0, 0, 0]}>
          {/* Main Brushed 304 Stainless Steel Case */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.13, 0.085, 0.20]} />
            <meshStandardMaterial
              color={hovered && !isLanceHeld ? '#ffffff' : '#e2e8f0'}
              metalness={0.92}
              roughness={0.22}
            />
          </mesh>

          {/* Chamfered Top Plate Trim */}
          <mesh position={[0, 0.044, 0]}>
            <boxGeometry args={[0.126, 0.006, 0.196]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.18} />
          </mesh>

          {/* Corner Assembly Screws on Top Plate */}
          {[
            [-0.052, -0.08],
            [0.052, -0.08],
            [-0.052, 0.08],
            [0.052, 0.08],
          ].map(([sx, sz], si) => (
            <mesh key={`top-screw-${si}`} position={[sx, 0.048, sz]}>
              <cylinderGeometry args={[0.0035, 0.0035, 0.003, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.9} />
            </mesh>
          ))}

          {/* Top Rating & Calibration Specification Plaque (Facing operator) */}
          <group position={[0, 0.048, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, Math.PI]}>
              <planeGeometry args={[0.09, 0.13]} />
              <meshBasicMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, Math.PI]}>
              <planeGeometry args={[0.086, 0.126]} />
              <meshBasicMaterial color="#e2e8f0" />
            </mesh>
            <Text
              position={[0, 0.002, 0.045]}
              rotation={[-Math.PI / 2, 0, Math.PI]}
              fontSize={0.012}
              color="#0f172a"
              anchorX="center"
              fontWeight="bold"
            >
              CYY-W330B 测温仪
            </Text>
            <Text
              position={[0, 0.002, 0.025]}
              rotation={[-Math.PI / 2, 0, Math.PI]}
              fontSize={0.009}
              color="#334155"
              anchorX="center"
            >
              PtRh10-Pt (S) • 0-1750°C
            </Text>
            <Text
              position={[0, 0.002, -0.01]}
              rotation={[-Math.PI / 2, 0, Math.PI]}
              fontSize={0.0075}
              color="#475569"
              anchorX="center"
            >
              HANDHELD SMELTING THERMOMETER
            </Text>
          </group>

          {/* ===================================================================== */}
          {/* B. REAR CONTROL PANEL: DIGITAL TEMPERATURE DISPLAY + BLACK BUTTON     */}
          {/* Angled slightly upward towards operator eye line for crisp readout     */}
          {/* ===================================================================== */}
          <group position={[0, 0.014, -0.101]} rotation={[-0.42, Math.PI, 0]}>
            {/* Stainless Bezel Panel Face */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[0.130, 0.084]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.25} />
            </mesh>

            {/* ----------------------------------------------------------------- */}
            {/* 1. DIGITAL TEMPERATURE INDICATOR SCREEN (Directly beside button)  */}
            {/* Positioned on Screen Left (Local X = +0.022)                       */}
            {/* ----------------------------------------------------------------- */}
            <group position={[0.022, 0.004, 0.002]}>
              {/* Outer Screen Bezel Frame */}
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[0.082, 0.054]} />
                <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
              </mesh>

              {/* Inner High-Contrast Glowing Dark Display Screen */}
              <mesh position={[0, 0, 0.001]}>
                <planeGeometry args={[0.078, 0.050]} />
                <meshBasicMaterial color="#052e16" />
              </mesh>

              {/* Accent Border around Display */}
              <lineSegments position={[0, 0, 0.002]}>
                <edgesGeometry args={[new THREE.PlaneGeometry(0.078, 0.050)]} />
                <lineBasicMaterial color={hasReading ? '#22c55e' : isMeasuringNow ? '#38bdf8' : '#34d399'} />
              </lineSegments>

              {/* Primary Digital Temperature Readout (Centered, Crisp, Fits Screen Neatly) */}
              <Text
                position={[0, 0, 0.005]}
                fontSize={0.016}
                color={hasReading ? '#4ade80' : isMeasuringNow ? '#38bdf8' : '#22c55e'}
                outlineWidth={0.001}
                outlineColor="#020617"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
                letterSpacing={0.01}
              >
                {displayTempStr}
              </Text>
            </group>

            {/* ----------------------------------------------------------------- */}
            {/* 2. ROUND BLACK BUTTON (Tombol Hitam Bulat) & PILOT LEDS           */}
            {/* Positioned on Screen Right (Local X = -0.034)                      */}
            {/* ----------------------------------------------------------------- */}
            <group position={[-0.034, 0.006, 0]}>
              {/* Raised Metallic Collar */}
              <mesh position={[0, 0, 0.002]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.013, 0.013, 0.004, 24]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
              </mesh>

              {/* Round Black Button Actuator Cap (Tombol Hitam Bulat) */}
              <mesh position={[0, 0, 0.006]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.0095, 0.0095, 0.006, 24]} />
                <meshStandardMaterial color="#0f172a" roughness={0.65} metalness={0.2} />
              </mesh>

              {/* Power Switch Stencil Label */}
              <Text
                position={[0, -0.013, 0.002]}
                fontSize={0.0065}
                color="#1e293b"
                anchorX="center"
                fontWeight="bold"
              >
                POWER
              </Text>

              {/* Pilot Status Indicators Under Button */}
              <group position={[0, -0.024, 0.002]}>
                {/* Pilot LED 1: Ready (Green) */}
                <mesh position={[-0.008, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.003, 0.003, 0.004, 12]} />
                  <meshStandardMaterial
                    color="#22c55e"
                    emissive={!isMeasuringNow ? '#22c55e' : '#000000'}
                    emissiveIntensity={!isMeasuringNow ? 2.5 : 0.1}
                  />
                </mesh>
                <Text position={[-0.008, -0.006, 0.001]} fontSize={0.0045} color="#334155" anchorX="center">
                  RDY
                </Text>

                {/* Pilot LED 2: Beep / Finish (Red) */}
                <mesh position={[0.008, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.003, 0.003, 0.004, 12]} />
                  <meshStandardMaterial
                    color="#ef4444"
                    emissive={isReadingComplete ? '#ef4444' : '#000000'}
                    emissiveIntensity={isReadingComplete ? 3.0 : 0.1}
                  />
                </mesh>
                <Text position={[0.008, -0.006, 0.001]} fontSize={0.0045} color="#334155" anchorX="center">
                  BEEP
                </Text>
              </group>
            </group>
          </group>

          {/* ===================================================================== */}
          {/* C. ERGONOMIC VERTICAL PISTOL GRIP HANDLE (Bawah Case)                  */}
          {/* ===================================================================== */}
          <group position={[0, -0.042, -0.01]}>
            <mesh position={[0, -0.01, 0]}>
              <boxGeometry args={[0.042, 0.02, 0.05]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>

            <mesh position={[0, -0.075, 0]}>
              <cylinderGeometry args={[0.016, 0.019, 0.13, 16]} />
              <meshStandardMaterial color="#3b1d1d" roughness={0.65} metalness={0.3} />
            </mesh>

            {[-0.045, -0.075, -0.105].map((gy, gi) => (
              <mesh key={`groove-${gi}`} position={[0, gy, 0.015]}>
                <boxGeometry args={[0.028, 0.012, 0.008]} />
                <meshStandardMaterial color="#2d1515" roughness={0.8} />
              </mesh>
            ))}

            <mesh position={[0, -0.145, 0]}>
              <sphereGeometry args={[0.020, 16, 12]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
          </group>
        </group>

        {/* ======================================================================= */}
        {/* D. FRONT EXTENSION LANCE PIPE WITH 45° ANGLED ELBOW NECK               */}
        {/* ======================================================================= */}
        <mesh
          position={[0, 0.008, 0.11]}
          rotation={[Math.PI / 2, 0, 0]}
          raycast={!isLanceHeld ? () => null : undefined}
        >
          <cylinderGeometry args={[0.018, 0.018, 0.025, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.2} />
        </mesh>

        <mesh
          position={[0, 0.008, 0.585]}
          rotation={[Math.PI / 2, 0, 0]}
          raycast={!isLanceHeld ? () => null : undefined}
        >
          <cylinderGeometry args={[0.009, 0.009, 0.95, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.94} roughness={0.2} />
        </mesh>

        {/* ======================================================================= */}
        {/* 3. 45° ANGLED ELBOW BEND (Leher Bengkok 45° Khas CYY-W330B)             */}
        {/* ======================================================================= */}
        <group
          position={[0, 0.008, 1.06]}
          raycast={!isLanceHeld ? () => null : undefined}
        >
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.013, 16, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} />
          </mesh>

          <group rotation={[Math.PI / 4, 0, 0]}>
            <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.009, 0.009, 0.16, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.94} roughness={0.2} />
            </mesh>

            {/* KB-602 Fast-Mount Chuck (Brass Connector Collar) */}
            <mesh position={[0, 0, 0.175]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.014, 0.014, 0.030, 16]} />
              <meshStandardMaterial color="#d97706" metalness={0.92} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.011, 0.175]}>
              <boxGeometry args={[0.016, 0.005, 0.020]} />
              <meshStandardMaterial color="#b45309" metalness={0.8} />
            </mesh>

            {/* 4. Disposable Beige Ceramic/Cardboard Sleeve Tube (KB-602 Type S) */}
            <mesh position={[0, 0, 0.29]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.014, 0.014, 0.20, 16]} />
              <meshStandardMaterial
                ref={tipMatRef}
                color="#d4be98"
                roughness={0.8}
                metalness={0.1}
              />
            </mesh>

            {/* White Ceramic Sensor Block */}
            <mesh position={[0, 0, 0.40]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.009, 0.013, 0.022, 16]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.5} />
            </mesh>

            {/* Protective Steel Quartz Cap at Extreme Tip */}
            <mesh position={[0, 0, 0.415]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.005, 0.007, 0.012, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.422]}>
              <sphereGeometry args={[0.005, 12, 12]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

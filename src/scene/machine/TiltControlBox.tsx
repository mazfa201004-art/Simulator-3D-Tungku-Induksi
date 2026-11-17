import React, { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

interface TiltControlBoxProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Authentic Industrial Tilting Control Console Station & Connected Remote Pendant.
 * Faithfully re-engineered to match the manufacturer reference photos (Gambar 3 & Gambar 4):
 * 1. Faceplate Layout (Gambar 4):
 *    - Top Analog Meter: Large rectangular meter with black bezel, white graduated dial arc,
 *      and dynamic pointer needle tracking furnace tilt angle.
 *    - Right Handle: Chrome door latch lever with blue center lock key.
 *    - Exactly 4 Industrial 22mm Devices ("2 ATAS, 2 BAWAH"):
 *        Row 1 (atas): Green button (START) & Amber pilot lamp (RUN).
 *        Row 2 (bawah): Red button (STOP) & Black rotary selector switch (TILT MODE).
 *      Each device features a chrome bezel collar, raised cap, and black engraved nametag plate.
 * 2. Complete Physical Wiring & Zero-Floating:
 *    - Orange Remote Pendant (Gambar 3) hangs on a dedicated steel holster on the right side of the box.
 *    - Heavy flexible black coiled cable runs from the box bottom gland directly into the pendant's top boot.
 *    - Heavy industrial flexible conduit runs along the floor from the box pedestal base directly
 *      to the furnace tilting motor junction box and towards the power cabinet.
 */
export const TiltControlBox: React.FC<TiltControlBoxProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const performanceProfile = useSimStore((s) => s.performanceProfile);
  const isLite = performanceProfile === 'lite';

  const tiltAngle = useSimStore((s) => s.tiltAngle);
  const tiltPowerOn = useSimStore((s) => s.tiltPowerOn);
  const tiltPermit = useSimStore((s) => s.tiltPermit);
  const masterPowerOn = useSimStore((s) => s.masterPowerOn);
  const emergencyTripped = useSimStore((s) => s.emergencyTripped);
  const startTiltSystem = useSimStore((s) => s.startTiltSystem);
  const stopTiltSystem = useSimStore((s) => s.stopTiltSystem);
  const toggleTiltPermit = useSimStore((s) => s.toggleTiltPermit);
  const startTiltingForward = useSimStore((s) => s.startTiltingForward);
  const stopTiltingForward = useSimStore((s) => s.stopTiltingForward);
  const startTiltingBackward = useSimStore((s) => s.startTiltingBackward);
  const stopTiltingBackward = useSimStore((s) => s.stopTiltingBackward);
  const isRemoteHeld = useSimStore((s) => s.isRemoteHeld);
  const setIsRemoteHeld = useSimStore((s) => s.setIsRemoteHeld);

  const transformerBreakerOn = useSimStore((s) => s.transformerBreakerOn);

  const isConsolePowered = transformerBreakerOn && masterPowerOn && !emergencyTripped && tiltPowerOn;

  const [hoverDown, setHoverDown] = useState(false);
  const [hoverUp, setHoverUp] = useState(false);
  const [pressDown, setPressDown] = useState(false);
  const [pressUp, setPressUp] = useState(false);

  const [hoverStart, setHoverStart] = useState(false);
  const [hoverStop, setHoverStop] = useState(false);
  const [hoverTilt, setHoverTilt] = useState(false);
  const [pressStart, setPressStart] = useState(false);
  const [pressStop, setPressStop] = useState(false);

  const btnDownRef = useRef<THREE.Mesh>(null);
  const btnUpRef = useRef<THREE.Mesh>(null);
  const btnStartRef = useRef<THREE.Mesh>(null);
  const btnStopRef = useRef<THREE.Mesh>(null);
  const tiltKnobRef = useRef<THREE.Group>(null);
  const meterNeedleRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    // Dynamic needle deflection on analog meter (0 deg = left, 90 deg = right)
    if (meterNeedleRef.current) {
      const t = Math.min(1, Math.max(0, tiltAngle / 90));
      const targetNeedleRad = THREE.MathUtils.lerp(0.68, -0.68, t);
      meterNeedleRef.current.rotation.z = THREE.MathUtils.lerp(
        meterNeedleRef.current.rotation.z,
        targetNeedleRad,
        delta * 10
      );
    }

    if (btnDownRef.current) {
      const targetZ = pressDown ? 0.002 : 0.006;
      btnDownRef.current.position.z = THREE.MathUtils.lerp(btnDownRef.current.position.z, targetZ, delta * 25);
    }
    if (btnUpRef.current) {
      const targetZ = pressUp ? 0.002 : 0.006;
      btnUpRef.current.position.z = THREE.MathUtils.lerp(btnUpRef.current.position.z, targetZ, delta * 25);
    }
    if (btnStartRef.current) {
      const targetZ = pressStart ? 0.002 : 0.006;
      btnStartRef.current.position.z = THREE.MathUtils.lerp(btnStartRef.current.position.z, targetZ, delta * 25);
    }
    if (btnStopRef.current) {
      const targetZ = pressStop ? 0.002 : 0.006;
      btnStopRef.current.position.z = THREE.MathUtils.lerp(btnStopRef.current.position.z, targetZ, delta * 25);
    }
    if (tiltKnobRef.current) {
      // 0 rad when permitted (ON), -Math.PI / 4 when locked (OFF)
      const targetRot = tiltPermit ? 0 : -Math.PI / 4;
      tiltKnobRef.current.rotation.z = THREE.MathUtils.lerp(tiltKnobRef.current.rotation.z, targetRot, delta * 15);
    }
  });

  // Flexible coiled cable linking box bottom gland to pendant top strain relief
  // Routed cleanly BEHIND and to the outer right of the pendant so it NEVER obstructs the buttons!
  const pendantCableCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.14, -0.14, 0.02),   // Box bottom gland (rear side)
      new THREE.Vector3(0.20, -0.24, -0.01),  // Hanging down behind the box plane
      new THREE.Vector3(0.30, -0.26, -0.01),  // Graceful bottom loop behind pendant
      new THREE.Vector3(0.35, -0.08, 0.01),   // Ascends along the outer right side
      new THREE.Vector3(0.32, 0.10, 0.03),    // Reaches above holster height
      new THREE.Vector3(0.26, 0.18, 0.055),   // Enters top boot of pendant from above
    ]);
  }, []);

  // Hanging trailing cable when pendant is removed from holster by operator
  const trailingCableCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.14, -0.14, 0.02),   // Box bottom gland
      new THREE.Vector3(0.19, -0.26, 0.04),
      new THREE.Vector3(0.26, -0.38, 0.10),
      new THREE.Vector3(0.34, -0.44, 0.22),
    ]);
  }, []);

  return (
    <group name="ENV_TiltControlStation" position={position} rotation={rotation}>
      {/* ========================================================================= */}
      {/* 1. SUPPORT PEDESTAL & MAIN WHITE ENCLOSURE BOX ON FLOOR                   */}
      {/* ========================================================================= */}
      <group position={[0, 0.52, 0]}>
        {/* Heavy Steel Pedestal Floor Base Plate */}
        <mesh position={[0, -0.51, 0]}>
          <cylinderGeometry args={[0.22, 0.24, 0.02, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.35} />
        </mesh>
        {/* 4 Pedestal Floor Anchor Studs */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, ai) => (
          <mesh key={ai} position={[Math.cos(ang) * 0.17, -0.495, Math.sin(ang) * 0.17]}>
            <cylinderGeometry args={[0.010, 0.010, 0.018, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
        ))}

        {/* Vertical Steel Support Post */}
        <mesh position={[0, -0.24, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 0.54, 24]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} />
        </mesh>

        {/* Main Box Enclosure (Industrial RAL 7035 Light Grey Powder-Coated Steel) */}
        <mesh position={[0, 0.14, 0]}>
          <boxGeometry args={[0.38, 0.54, 0.18]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.65} roughness={0.35} />
        </mesh>

        {/* Front Hinged Door Plate with Beveled Seam Frame */}
        <mesh position={[0, 0.14, 0.091]}>
          <planeGeometry args={[0.36, 0.52]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.3} />
        </mesh>

        {/* Left Door Hinges (3 engsel terpasang kokoh pada kusen pintu, tanpa elemen melayang) */}
        {[-0.08, 0.14, 0.36].map((hy, hi) => (
          <mesh key={hi} position={[-0.185, hy, 0.09]}>
            <cylinderGeometry args={[0.007, 0.007, 0.032, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.9} />
          </mesh>
        ))}

        {/* ======================================================================= */}
        {/* TOP: RECTANGULAR ANALOG POINTER METER (Sesuai Gambar 4)                 */}
        {/* ======================================================================= */}
        <group position={[0, 0.28, 0.095]}>
          {/* Black Outer Meter Bezel Housing */}
          <mesh>
            <boxGeometry args={[0.22, 0.13, 0.018]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
          </mesh>

          {/* White Dial Plate Scale */}
          <mesh position={[0, 0, 0.010]}>
            <planeGeometry args={[0.20, 0.11]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} />
          </mesh>

          {/* Meter Graduation Curved Scale Arc (Centered at Needle Pivot y = -0.032, radius 0.058 - 0.061) */}
          <mesh position={[0, -0.032, 0.011]}>
            <ringGeometry args={[0.058, 0.061, 32, 1, Math.PI * 0.25, Math.PI * 0.5]} />
            <meshBasicMaterial color="#334155" />
          </mesh>

          {/* Scale Degree Numbers cleanly positioned inside dial */}
          {!isLite && (
            <>
              <Text position={[-0.046, 0.016, 0.012]} fontSize={0.010} color="#0f172a" fontWeight="bold">0°</Text>
              <Text position={[0, 0.036, 0.012]} fontSize={0.010} color="#0f172a" fontWeight="bold">45°</Text>
              <Text position={[0.046, 0.016, 0.012]} fontSize={0.010} color="#0f172a" fontWeight="bold">90°</Text>
            </>
          )}

          {/* Live Digital Angle Readout Overlay */}
          <Text
            position={[0, -0.012, 0.012]}
            fontSize={0.016}
            color="#0f172a"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {Math.round(tiltAngle)}°
          </Text>

          {/* Dynamic Analog Meter Pointer Needle (Pivoted at bottom center) */}
          <group ref={meterNeedleRef} position={[0, -0.032, 0.012]}>
            {/* Pivot Pin */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.004, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} />
            </mesh>
            {/* Needle Arm */}
            <mesh position={[0, 0.026, 0]}>
              <boxGeometry args={[0.002, 0.052, 0.002]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
          </group>

          {/* Clear Glass Cover Lens */}
          <mesh position={[0, 0, 0.014]}>
            <planeGeometry args={[0.20, 0.11]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.25} roughness={0.05} />
          </mesh>

          {/* Meter Label Plate underneath */}
          <Text
            position={[0, -0.072, 0.005]}
            fontSize={0.011}
            color="#334155"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            TILT ANGLE METER
          </Text>
        </group>

        {/* ======================================================================= */}
        {/* RIGHT: CHROME DOOR LATCH LEVER & BLUE LOCK CYLINDER (Sesuai Gambar 4)   */}
        {/* ======================================================================= */}
        <group position={[0.13, 0.04, 0.095]}>
          {/* Flush Rectangular Escutcheon Base Plate flat against door */}
          <mesh position={[0, -0.015, 0.003]}>
            <boxGeometry args={[0.024, 0.082, 0.005]} />
            <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Circular Lock Barrel Hub (Oriented flat against door panel with rotation PI/2) */}
          <mesh position={[0, 0.012, 0.006]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.013, 0.013, 0.006, 24]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.2} />
          </mesh>
          {/* Blue Center Key Cylinder */}
          <mesh position={[0, 0.012, 0.009]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.006, 16]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} />
          </mesh>
          {/* Chrome Vertical Swing Lever Handle (extends downward cleanly from pivot) */}
          <mesh position={[0, -0.024, 0.009]}>
            <boxGeometry args={[0.012, 0.055, 0.010]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[0, -0.052, 0.009]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.012, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>

        {/* ======================================================================= */}
        {/* 4 CONTROLS: START (BUTTON), RUN (LAMP), STOP (BUTTON), TILT (SWITCH)    */}
        {/* ======================================================================= */}
        {/* BARIS 1 (ATAS, y = 0.04m): TOMBOL HIJAU & LAMPU INDIKATOR AMBER */}
        <group position={[0, 0.04, 0.095]}>
          {/* KIRI: Tombol Push Button Hijau (START) - Menyalakan Daya Tilting Konsol */}
          <group position={[-0.07, 0, 0]}>
            {/* Chrome Bezel Outer Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.020, 0.010, 24]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
            </mesh>
            {/* Interactive Elevated Green Button Cap */}
            <mesh
              ref={btnStartRef}
              position={[0, 0, 0.006]}
              rotation={[Math.PI / 2, 0, 0]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoverStart(true);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoverStart(false);
                setPressStart(false);
                document.body.style.cursor = 'auto';
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setPressStart(true);
                inductionAudio.resume();
                inductionAudio.playClick();
                startTiltSystem();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                setPressStart(false);
              }}
            >
              <cylinderGeometry args={[0.013, 0.013, 0.010, 24]} />
              <meshStandardMaterial
                color={pressStart ? '#22c55e' : hoverStart ? '#16a34a' : '#15803d'}
                emissive="#22c55e"
                emissiveIntensity={isConsolePowered ? 0.35 : 0.05}
                roughness={0.25}
                metalness={0.3}
              />
            </mesh>
            {/* Nametag Plate */}
            <mesh position={[0, -0.028, 0]}>
              <boxGeometry args={[0.042, 0.014, 0.002]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <Text position={[0, -0.028, 0.002]} fontSize={0.007} color="#ffffff" fontWeight="bold">
              START
            </Text>
            {/* Easy Click Hitbox */}
            <mesh
              position={[0, 0, 0.01]}
              onPointerDown={(e) => {
                e.stopPropagation();
                setPressStart(true);
                inductionAudio.resume();
                inductionAudio.playClick();
                startTiltSystem();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                setPressStart(false);
              }}
            >
              <boxGeometry args={[0.045, 0.045, 0.03]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>

          {/* KANAN: Lampu Indikator Amber/Kuning (RUN) - BUKAN TOMBOL, Menyala saat sistem aktif */}
          <group position={[0.01, 0, 0]}>
            {/* Chrome Bezel Outer Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.020, 0.010, 24]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
            </mesh>
            {/* Faceted Translucent Amber Lens Dome (Menyala terang saat RUN / START aktif) */}
            <mesh position={[0, 0, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
              <sphereGeometry args={[0.013, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#f59e0b"
                emissiveIntensity={isConsolePowered ? 2.4 : 0.05}
                roughness={0.2}
                transparent
                opacity={isConsolePowered ? 0.95 : 0.4}
              />
            </mesh>
            {/* Nametag Plate */}
            <mesh position={[0, -0.028, 0]}>
              <boxGeometry args={[0.042, 0.014, 0.002]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <Text position={[0, -0.028, 0.002]} fontSize={0.007} color="#ffffff" fontWeight="bold">
              RUN
            </Text>
          </group>
        </group>

        {/* BARIS 2 (BAWAH, y = -0.055m): TOMBOL MERAH & SELECTOR SWITCH HITAM */}
        <group position={[0, -0.055, 0.095]}>
          {/* KIRI: Tombol Push Button Merah (STOP) - Mematikan Daya Tilting Konsol */}
          <group position={[-0.07, 0, 0]}>
            {/* Chrome Bezel Outer Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.020, 0.010, 24]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
            </mesh>
            {/* Interactive Elevated Red Button Cap */}
            <mesh
              ref={btnStopRef}
              position={[0, 0, 0.006]}
              rotation={[Math.PI / 2, 0, 0]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoverStop(true);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoverStop(false);
                setPressStop(false);
                document.body.style.cursor = 'auto';
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setPressStop(true);
                inductionAudio.resume();
                inductionAudio.playClick();
                stopTiltSystem();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                setPressStop(false);
              }}
            >
              <cylinderGeometry args={[0.013, 0.013, 0.010, 24]} />
              <meshStandardMaterial
                color={pressStop ? '#ef4444' : hoverStop ? '#dc2626' : '#b91c1c'}
                emissive="#dc2626"
                emissiveIntensity={hoverStop ? 0.4 : 0.1}
                roughness={0.25}
                metalness={0.3}
              />
            </mesh>
            {/* Nametag Plate */}
            <mesh position={[0, -0.028, 0]}>
              <boxGeometry args={[0.042, 0.014, 0.002]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <Text position={[0, -0.028, 0.002]} fontSize={0.007} color="#ffffff" fontWeight="bold">
              STOP
            </Text>
            {/* Easy Click Hitbox */}
            <mesh
              position={[0, 0, 0.01]}
              onPointerDown={(e) => {
                e.stopPropagation();
                setPressStop(true);
                inductionAudio.resume();
                inductionAudio.playClick();
                stopTiltSystem();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                setPressStop(false);
              }}
            >
              <boxGeometry args={[0.045, 0.045, 0.03]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>

          {/* KANAN: Rotary Selector Switch Hitam (TILT MODE) - Saklar Putar Izin Tilting */}
          <group position={[0.01, 0, 0]}>
            {/* Chrome Bezel Outer Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.020, 0.010, 24]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
            </mesh>
            {/* Rotating Knob Group */}
            <group
              ref={tiltKnobRef}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoverTilt(true);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoverTilt(false);
                document.body.style.cursor = 'auto';
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                inductionAudio.resume();
                inductionAudio.playClick();
                toggleTiltPermit();
              }}
            >
              {/* Black Knurled Knob Body */}
              <mesh position={[0, 0, 0.009]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.014, 24]} />
                <meshStandardMaterial
                  color={hoverTilt ? '#1e293b' : '#0f172a'}
                  roughness={0.4}
                  metalness={0.7}
                />
              </mesh>
              {/* White Pointer Notch on Knob Face */}
              <mesh position={[0, 0.005, 0.017]}>
                <boxGeometry args={[0.003, 0.012, 0.003]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
            </group>
            {/* Nametag Plate */}
            <mesh position={[0, -0.028, 0]}>
              <boxGeometry args={[0.042, 0.014, 0.002]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <Text position={[0, -0.028, 0.002]} fontSize={0.007} color="#ffffff" fontWeight="bold">
              TILT
            </Text>
            {/* Status Feedback Subtitle */}
            <Text
              position={[0, -0.038, 0.002]}
              fontSize={0.0055}
              color={!masterPowerOn ? '#64748b' : emergencyTripped ? '#ef4444' : tiltPermit ? '#22c55e' : '#f87171'}
              fontWeight="bold"
            >
              {!masterPowerOn ? 'NO PWR' : emergencyTripped ? 'E-STOP' : tiltPermit ? 'ARMED' : 'LOCK'}
            </Text>
            {/* Easy Click Hitbox */}
            <mesh
              position={[0, 0, 0.01]}
              onPointerDown={(e) => {
                e.stopPropagation();
                inductionAudio.resume();
                inductionAudio.playClick();
                toggleTiltPermit();
              }}
            >
              <boxGeometry args={[0.045, 0.045, 0.03]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        </group>

        {/* Bottom Cable Exit Gland on Enclosure Bottom Plate (Aligned to clean rear cable path) */}
        <mesh position={[0.14, -0.13, 0.02]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.014, 0.025, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} />
        </mesh>

        {/* Dedicated Steel Holster Bracket on Right Side for Orange Remote Pendant */}
        {/* Cradles the pendant firmly from the rear and bottom with ZERO front face obstruction */}
        <group
          position={[0, 0, 0]}
          onPointerDown={(e) => {
            if (isRemoteHeld) {
              e.stopPropagation();
              inductionAudio.resume();
              inductionAudio.playClick();
              setIsRemoteHeld(false);
            }
          }}
          onPointerOver={() => {
            if (isRemoteHeld) document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            if (isRemoteHeld) document.body.style.cursor = 'auto';
          }}
        >
          {/* Welded Extension Arm from Box Wall (X = 0.19 to X = 0.26) */}
          <mesh position={[0.225, 0.02, 0.020]}>
            <boxGeometry args={[0.070, 0.018, 0.020]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
          </mesh>
          {/* Cradle Rear Rest Plate (Behind the pendant body at Z = 0.022) */}
          <mesh position={[0.260, 0.02, 0.022]}>
            <boxGeometry args={[0.082, 0.090, 0.008]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Cradle Bottom Support Shelf (Supports the pendant bottom at Y = -0.082) */}
          <mesh position={[0.260, -0.082, 0.046]}>
            <boxGeometry args={[0.080, 0.010, 0.040]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
          </mesh>
          {/* Rear Side Retaining Tabs (stays strictly at Z <= 0.048, never covering the front face) */}
          {[-0.040, 0.040].map((tx, ti) => (
            <mesh key={`tab-${ti}`} position={[0.260 + tx, 0.02, 0.038]}>
              <boxGeometry args={[0.006, 0.060, 0.024]} />
              <meshStandardMaterial color="#475569" metalness={0.85} />
            </mesh>
          ))}

          {/* When remote is currently held, show interactive prompt to place it back on stand */}
          {isRemoteHeld && (
            <group position={[0.260, 0.02, 0.04]}>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.076, 0.16, 0.03]} />
                <meshBasicMaterial transparent opacity={0.12} color="#22c55e" depthWrite={false} />
              </mesh>
              <Text position={[0, 0.012, 0.018]} fontSize={0.0075} color="#22c55e" fontWeight="bold">
                KLIK UNTUK
              </Text>
              <Text position={[0, -0.006, 0.018]} fontSize={0.0075} color="#22c55e" fontWeight="bold">
                TARUH REMOT
              </Text>
            </group>
          )}
        </group>

        {/* ======================================================================= */}
        {/* 2. DOCKED ORANGE INDUSTRIAL REMOTE PENDANT (COB-61 Style, Gambar 3)     */}
        {/* ======================================================================= */}
        {!isRemoteHeld && (
          <group
            name="INT_OrangeTiltPendant"
            position={[0.260, 0.02, 0.055]}
            rotation={[0, 0, 0]}
          >
            {/* Pick-up Hint Badge above Pendant */}
            <group
              position={[0, 0.17, 0]}
              onPointerDown={(e) => {
                e.stopPropagation();
                inductionAudio.resume();
                inductionAudio.playClick();
                setIsRemoteHeld(true);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }}
            >
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.072, 0.015, 0.004]} />
                <meshStandardMaterial color="#0284c7" />
              </mesh>
              <Text position={[0, 0, 0.003]} fontSize={0.0065} color="#ffffff" fontWeight="bold">
                AMBIL REMOT
              </Text>
            </group>

            {/* Top Rubber Strain Relief Boot */}
            <mesh position={[0, 0.13, 0]}>
              <cylinderGeometry args={[0.010, 0.016, 0.05, 16]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>

            {/* Molded Orange ABS Enclosure Body (Click to pick up remote) */}
            <mesh
              onPointerDown={(e) => {
                e.stopPropagation();
                inductionAudio.resume();
                inductionAudio.playClick();
                setIsRemoteHeld(true);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }}
            >
              <boxGeometry args={[0.075, 0.20, 0.045]} />
              <meshStandardMaterial color="#ea580c" roughness={0.35} metalness={0.2} />
            </mesh>

          {/* Black Recessed Switch Faceplate */}
          <mesh position={[0, 0, 0.024]}>
            <planeGeometry args={[0.065, 0.17]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>

          {/* TOP BUTTON: POUR (▼ Panah Bawah untuk Menuang ke Depan) */}
          <group position={[0, 0.045, 0.024]}>
            {/* Raised Protective Bezel Collar Ring (Black Rubber/ABS) */}
            <mesh position={[0, 0, 0.003]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.023, 0.024, 0.008, 24]} />
              <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.2} />
            </mesh>

            {/* Circular Industrial Push Button Cap (Oriented facing user, NOT horizontal bar) */}
            <mesh
              ref={btnDownRef}
              name="INT_BtnTiltPour"
              position={[0, 0, 0.006]}
              rotation={[Math.PI / 2, 0, 0]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoverDown(true);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoverDown(false);
                setPressDown(false);
                stopTiltingForward();
                document.body.style.cursor = 'auto';
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setPressDown(true);
                inductionAudio.resume();
                inductionAudio.playClick();
                startTiltingForward();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                setPressDown(false);
                stopTiltingForward();
              }}
            >
              <cylinderGeometry args={[0.0185, 0.0185, 0.008, 24]} />
              <meshStandardMaterial
                color={pressDown ? '#fb923c' : hoverDown ? '#f97316' : '#c2410c'}
                emissive="#ea580c"
                emissiveIntensity={hoverDown ? 0.6 : 0.15}
                toneMapped={false}
                roughness={0.3}
              />
            </mesh>

            {/* Crisp Arrow Icon dead-center inside the circular button face */}
            <Text
              position={[0, -0.0016, 0.0115]}
              fontSize={0.013}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              ▼
            </Text>

            {/* Engraved Nametag Plate & Text below Button (100% Unobstructed) */}
            <mesh position={[0, -0.027, 0.002]}>
              <boxGeometry args={[0.048, 0.012, 0.002]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <Text
              position={[0, -0.027, 0.004]}
              fontSize={0.007}
              color="#f8fafc"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              POUR
            </Text>

            {/* Generous Hit Box for easy clicking */}
            <mesh
              position={[0, 0, 0.01]}
              onPointerDown={(e) => {
                e.stopPropagation();
                setPressDown(true);
                inductionAudio.resume();
                startTiltingForward();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                setPressDown(false);
                stopTiltingForward();
              }}
            >
              <boxGeometry args={[0.055, 0.055, 0.03]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>

          {/* BOTTOM BUTTON: RETURN (▲ Panah Atas untuk Kembali Tegak) */}
          <group position={[0, -0.045, 0.024]}>
            {/* Raised Protective Bezel Collar Ring (Black Rubber/ABS) */}
            <mesh position={[0, 0, 0.003]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.023, 0.024, 0.008, 24]} />
              <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.2} />
            </mesh>

            {/* Circular Industrial Push Button Cap (Oriented facing user, NOT horizontal bar) */}
            <mesh
              ref={btnUpRef}
              name="INT_BtnTiltReturn"
              position={[0, 0, 0.006]}
              rotation={[Math.PI / 2, 0, 0]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoverUp(true);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoverUp(false);
                setPressUp(false);
                stopTiltingBackward();
                document.body.style.cursor = 'auto';
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setPressUp(true);
                inductionAudio.resume();
                inductionAudio.playClick();
                startTiltingBackward();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                setPressUp(false);
                stopTiltingBackward();
              }}
            >
              <cylinderGeometry args={[0.0185, 0.0185, 0.008, 24]} />
              <meshStandardMaterial
                color={pressUp ? '#38bdf8' : hoverUp ? '#0284c7' : '#0369a1'}
                emissive="#0284c7"
                emissiveIntensity={hoverUp ? 0.6 : 0.15}
                toneMapped={false}
                roughness={0.3}
              />
            </mesh>

            {/* Crisp Arrow Icon dead-center inside the circular button face */}
            <Text
              position={[0, 0.0016, 0.0115]}
              fontSize={0.013}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              ▲
            </Text>

            {/* Engraved Nametag Plate & Text below Button (100% Unobstructed) */}
            <mesh position={[0, -0.027, 0.002]}>
              <boxGeometry args={[0.054, 0.012, 0.002]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <Text
              position={[0, -0.027, 0.004]}
              fontSize={0.007}
              color="#f8fafc"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              RETURN
            </Text>

            {/* Generous Hit Box for easy clicking */}
            <mesh
              position={[0, 0, 0.01]}
              onPointerDown={(e) => {
                e.stopPropagation();
                setPressUp(true);
                inductionAudio.resume();
                startTiltingBackward();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                setPressUp(false);
                stopTiltingBackward();
              }}
            >
              <boxGeometry args={[0.055, 0.055, 0.03]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        </group>
      )}

      {/* 3. FLEXIBLE BLACK COILED CABLE CONNECTING BOX TO PENDANT */}
      <mesh>
        <tubeGeometry args={[isRemoteHeld ? trailingCableCurve : pendantCableCurve, 32, 0.007, 12, false]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.2} />
      </mesh>
      </group>
    </group>
  );
};

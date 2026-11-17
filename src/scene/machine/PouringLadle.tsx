import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { getBlackbodyColor } from '../../sim/blackbody';

interface PouringLadleProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  onDragStateChange?: (isDragging: boolean) => void;
  ladlePosRef?: React.RefObject<THREE.Vector3>;
}

/**
 * Creates authentic compact flared trapezoidal pouring spout geometry (Gambar 4 & 5).
 * Proportionally scaled down:
 * - Root at upper section (y = 0.22m, z = 0.364m, width = 0.09m).
 * - Compact beak lip at y = 0.375m (subtle 2.5cm above rim), z = 0.445m (only 6.5cm forward), width = 0.17m.
 * - Watertight with counter-clockwise outward normals.
 */
function createFlaredSpoutGeometry(isInner = false) {
  const geo = new THREE.BufferGeometry();
  const xInset = isInner ? 0.005 : 0;
  const yInset = isInner ? -0.005 : 0;
  const zInset = isInner ? -0.005 : 0;

  // Key Vertices:
  // Root on upper drum section (y = 0.22)
  const v0 = [-0.045 + xInset, 0.22 - yInset, 0.364 + zInset]; // Root Left
  const v1 = [ 0.045 - xInset, 0.22 - yInset, 0.364 + zInset]; // Root Right
  // Compact Peaked Lip Tip (y = 0.375, z = 0.445)
  const v2 = [ 0.085 - xInset, 0.375 + yInset, 0.445 + zInset]; // Beak Lip Right
  const v3 = [-0.085 + xInset, 0.375 + yInset, 0.445 + zInset]; // Beak Lip Left
  // Junction where cheek meets drum rim (y = 0.35, z = 0.371)
  const v4 = [-0.080 + xInset, 0.350 + yInset, 0.371 + zInset]; // Rim Left
  const v5 = [ 0.080 - xInset, 0.350 + yInset, 0.371 + zInset]; // Rim Right

  // Front Apron (2 triangles) + Left Cheek (1 triangle) + Right Cheek (1 triangle)
  const positions = new Float32Array([
    // Apron underside (sloping upward and forward to beak tip)
    ...v0, ...v1, ...v2,
    ...v0, ...v2, ...v3,
    // Left Cheek (triangular cheek wall, normal pointing -X)
    ...v0, ...v4, ...v3,
    // Right Cheek (triangular cheek wall, normal pointing +X)
    ...v1, ...v2, ...v5,
  ]);

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

const SPOUT_OUTER_GEO = createFlaredSpoutGeometry(false);
const SPOUT_INNER_GEO = createFlaredSpoutGeometry(true);

/**
 * Metal transfer and pouring ladle assembly with tilt controls.
 */
export const PouringLadle: React.FC<PouringLadleProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onDragStateChange,
  ladlePosRef,
}) => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const liquidMeshRef = useRef<THREE.Mesh>(null);
  const liquidMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const fumeRef = useRef<THREE.Mesh>(null);
  const ladleStreamRef = useRef<THREE.Mesh>(null);
  const tiltingBucketRef = useRef<THREE.Group>(null);
  const handwheelRef = useRef<THREE.Group>(null);

  const setIsDragging3DControl = useSimStore((s) => s.setIsDragging3DControl);
  const setActiveHoverObject = useSimStore((s) => s.setActiveHoverObject);
  const performanceProfile = useSimStore((s) => s.performanceProfile);
  const singleMoldFillLevel = useSimStore((s) => s.singleMoldFillLevel);
  const cranePosition = useSimStore((s) => s.cranePosition);
  const ladleTiltDeg = useSimStore((s) => s.ladleTiltDeg);
  const setLadleTiltDeg = useSimStore((s) => s.setLadleTiltDeg);
  const setIsLadleControlOpen = useSimStore((s) => s.setIsLadleControlOpen);
  const isLite = performanceProfile === 'lite';

  const isMoldPourComplete = singleMoldFillLevel >= 0.90;
  const isReturnedToStandby = Math.hypot(cranePosition[0] - 4.0, cranePosition[2] - 0.0) <= 1.25;

  // Authentic industrial dimensions
  const ladleHeight = 0.70;
  const radiusTop = 0.38;
  const radiusBottom = 0.31;
  const trunnionY = 0.44; // Trunnion pivot height relative to ladle base
  const stanchionX = 0.45; // Half-width between vertical bail arms
  const beamY = 1.08; // Height of top spreader double C-beam
  const beamLength = 1.04;
  const suspensionElevation = 0.0; // Ladle bottom touches floor at y = 0.0

  // Handwheel rotation & bucket tilt state with strict mechanical 90° stop
  const MAX_TILT_RAD = Math.PI / 2; // Exact 90 degrees
  const GEAR_RATIO = 0.05; // 1 full turn (2*PI rad) = 0.314 rad (~18 degrees)

  const [isDraggingWheel, setIsDraggingWheel] = useState(false);
  const [isHoveredWheel, setIsHoveredWheel] = useState(false);
  const dragLastYRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number; moved: boolean }>({ x: 0, y: 0, moved: false });
  const dragCleanupRef = useRef<(() => void) | null>(null);

  const releaseWheelDrag = (shouldOpenOnTap = false) => {
    if (dragCleanupRef.current) {
      const cleanup = dragCleanupRef.current;
      dragCleanupRef.current = null;
      cleanup();
    }
    const wasQuickTap = !dragStartPosRef.current.moved;
    activePointerIdRef.current = null;
    setIsDraggingWheel(false);
    setIsDragging3DControl(false);
    setActiveHoverObject(null);
    onDragStateChange?.(false);
    document.body.style.cursor = 'auto';

    if (shouldOpenOnTap && wasQuickTap) {
      setIsLadleControlOpen(true);
    }
  };

  // Guarantee cleanup if component unmounts while dragging
  useEffect(() => {
    return () => {
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
        dragCleanupRef.current = null;
      }
      useSimStore.getState().setIsDragging3DControl(false);
      onDragStateChange?.(false);
    };
  }, [onDragStateChange]);

  const bucketTiltDeg = ladleTiltDeg;
  const bucketTiltRad = useMemo(() => {
    return Math.max(0, Math.min(MAX_TILT_RAD, (ladleTiltDeg * Math.PI) / 180));
  }, [ladleTiltDeg, MAX_TILT_RAD]);

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.05);

    // Direct transform update via ladlePosRef without React re-render
    if (ladlePosRef?.current && rootGroupRef.current) {
      rootGroupRef.current.position.set(
        ladlePosRef.current.x,
        ladlePosRef.current.y + suspensionElevation,
        ladlePosRef.current.z
      );
    }

    const latestTiltDeg = useSimStore.getState().ladleTiltDeg;
    const targetBucketRad = Math.max(0, Math.min(MAX_TILT_RAD, (latestTiltDeg * Math.PI) / 180));
    const targetWheelRad = targetBucketRad / GEAR_RATIO;

    // Clamped exponential damping guarantees smooth tilt with zero low-FPS overshoot
    if (tiltingBucketRef.current) {
      const bucketAlpha = 1 - Math.exp(-16 * safeDelta);
      tiltingBucketRef.current.rotation.x = THREE.MathUtils.lerp(
        tiltingBucketRef.current.rotation.x,
        targetBucketRad,
        bucketAlpha
      );
    }

    if (handwheelRef.current) {
      const wheelAlpha = 1 - Math.exp(-20 * safeDelta);
      handwheelRef.current.rotation.x = THREE.MathUtils.lerp(
        handwheelRef.current.rotation.x,
        targetWheelRad,
        wheelAlpha
      );
    }

    // Dynamic molten liquid surface
    if (!liquidMeshRef.current || !liquidMatRef.current) return;

    const currentFilled = useSimStore.getState().ladleFilledFraction;

    if (currentFilled <= 0.005) {
      liquidMeshRef.current.visible = false;
      if (fumeRef.current) fumeRef.current.visible = false;
    } else {
      liquidMeshRef.current.visible = true;

      // Liquid surface rises from bottom (y = -0.30m) to near top rim (y = 0.28m)
      const currentY = -0.30 + currentFilled * 0.58;
      liquidMeshRef.current.position.y = currentY;

      // Conical meniscus expands with fill height
      const currentRadius = radiusBottom + (radiusTop - radiusBottom) * currentFilled - 0.035;
      const rScale = currentRadius / (radiusTop - 0.035);
      liquidMeshRef.current.scale.set(rScale, 1, rScale);

      const temp = useSimStore.getState().sim.temperatureC;
      const glow = getBlackbodyColor(temp);
      liquidMatRef.current.emissive.setRGB(glow.r, glow.g, glow.b);
      liquidMatRef.current.emissiveIntensity = glow.emissiveIntensity;

      if (fumeRef.current) {
        if (currentFilled > 0.02 && temp >= 450) {
          fumeRef.current.visible = true;
          fumeRef.current.rotation.y += 0.005;
          const mat = fumeRef.current.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.min(0.22, currentFilled * 0.28);
        } else {
          fumeRef.current.visible = false;
        }
      }
    }

    // Dynamic vertical stream pouring from ladle spout (Gravity-aligned)
    const currentTilt = tiltingBucketRef.current ? tiltingBucketRef.current.rotation.x : bucketTiltRad;
    const currentTiltDeg = (currentTilt * 180) / Math.PI;
    const isPouringFromLadle = currentTiltDeg >= 26 && currentFilled > 0.002;

    if (ladleStreamRef.current) {
      if (isPouringFromLadle) {
        ladleStreamRef.current.visible = true;

        // Dynamic spout lip position relative to ladle base:
        // Spout beak lip in bucket coordinates is at y = 0.375, z = 0.445
        const cosT = Math.cos(currentTilt);
        const sinT = Math.sin(currentTilt);
        const lipLocalY = trunnionY + 0.375 * cosT - 0.445 * sinT;
        const lipLocalZ = 0.375 * sinT + 0.445 * cosT;

        const posX = ladlePosRef?.current ? ladlePosRef.current.x : position[0];
        const posY = ladlePosRef?.current ? ladlePosRef.current.y : position[1];
        const posZ = ladlePosRef?.current ? ladlePosRef.current.z : position[2];

        const worldX = posX;
        const worldZ = posZ + lipLocalZ;
        const worldLipY = posY + suspensionElevation + lipLocalY;

        // Standardized mold targets:
        // 1. Single Sand Mold at [7.8, 0, 0] (Top flask surface ~0.58m, radius 2.2m covers cawan tuang & riser)
        // 2. Pig Mold at [7.8, 0, 1.2]
        // 3. Fallback floor ingot mold at [0.0, 0.45, 0.96]
        const MOLD_TARGETS = [
          { type: 'single' as const, x: 7.8, z: 0.0, topY: 0.58, radius: 2.2 },
          { type: 'pig' as const, x: 7.8, z: 1.2, topY: 0.25, radius: 1.1 },
          { type: 'ingot' as const, x: 0.0, z: 0.96, topY: 0.45, radius: 1.4 },
        ];

        const activeMold = MOLD_TARGETS.find(
          (m) => Math.hypot(worldX - m.x, worldZ - m.z) <= m.radius
        );

        const targetWorldY = activeMold ? activeMold.topY : 0.005;
        const streamLength = Math.max(0.12, worldLipY - targetWorldY);

        // Position vertical stream cylinder pointing straight down with gravity (-Y)
        ladleStreamRef.current.position.set(0, lipLocalY - streamLength / 2, lipLocalZ);
        ladleStreamRef.current.scale.set(1, streamLength, 1);

        // Transfer molten metal into mold or drain onto floor
        const pourAmount = safeDelta * 0.10;
        if (activeMold) {
          if (activeMold.type === 'single') {
            useSimStore.getState().pourToSingleSandMold(pourAmount);
          } else if (activeMold.type === 'pig') {
            useSimStore.getState().pourToPigMold(pourAmount);
          } else {
            useSimStore.getState().pourFromLadleToMold(pourAmount, 'ingot');
          }
        } else {
          // Pouring on floor: decreases both ladle fraction and mass
          useSimStore.setState((s) => {
            const currentMass = Math.max(s.sim.ladleMetalMassKg, s.ladleFilledFraction * 160.0);
            const transferKg = Math.min(currentMass, pourAmount * 100.0);
            const newMass = Math.max(0, currentMass - transferKg);
            const newFrac = Math.max(0, newMass / 160.0);
            return {
              ladleFilledFraction: newFrac,
              isLadlePouringToMold: false,
              sim: {
                ...s.sim,
                ladleMetalMassKg: newMass,
              },
            };
          });
        }
      } else {
        ladleStreamRef.current.visible = false;
        if (useSimStore.getState().isLadlePouringToMold) {
          useSimStore.setState({ isLadlePouringToMold: false });
        }
      }
    }
  });

  // Material palettes (Clean Industrial Cast Steel Gray / Machined Silver)
  const steelMat = useMemo(
    () => ({
      color: '#78889b',
      metalness: 0.65,
      roughness: 0.32,
    }),
    []
  );

  const darkSteelMat = useMemo(
    () => ({
      color: '#4f5d73',
      metalness: 0.60,
      roughness: 0.36,
    }),
    []
  );

  const brightSteelMat = useMemo(
    () => ({
      color: '#f1f5f9',
      metalness: 0.90,
      roughness: 0.16,
    }),
    []
  );

  // Dark charred refractory ceramic liner (prevents flat white circle illusion)
  const refractoryMat = useMemo(
    () => ({
      color: '#2d3748',
      roughness: 0.94,
      metalness: 0.10,
    }),
    []
  );

  const craneHookMat = useMemo(
    () => ({
      color: '#334155',
      metalness: 0.75,
      roughness: 0.25,
    }),
    []
  );

  const cranePulleyMat = useMemo(
    () => ({
      color: '#eab308',
      metalness: 0.35,
      roughness: 0.40,
    }),
    []
  );

  // Authentic Inverted-U Forged Crane Hook Bail Loop on Ladle (Apex underside is at y = 1.272m)
  const bailLoopCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.065, 1.14, 0),
      new THREE.Vector3(-0.055, 1.20, 0),
      new THREE.Vector3(-0.035, 1.26, 0),
      new THREE.Vector3(0.0, 1.285, 0),
      new THREE.Vector3(0.035, 1.26, 0),
      new THREE.Vector3(0.055, 1.20, 0),
      new THREE.Vector3(0.065, 1.14, 0),
    ]);
  }, []);

  // Forged Heavy Crane Hook Curve (Hangs down, loops through bail eyelet, cradles underside of apex bar with 0.00mm gap!)
  const forgedCraneHookCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.48, 0.00),    // Upper shank base
      new THREE.Vector3(0, 1.41, -0.025),  // Hook neck
      new THREE.Vector3(0, 1.34, -0.065),  // Rear spine
      new THREE.Vector3(0, 1.275, -0.052), // Entering loop eyelet from rear
      new THREE.Vector3(0, 1.250, 0.000),  // Bottom saddle bowl (passes directly UNDER loop apex!)
      new THREE.Vector3(0, 1.275, 0.052),  // Exiting loop eyelet going up
      new THREE.Vector3(0, 1.340, 0.068),  // Front throat
      new THREE.Vector3(0, 1.385, 0.050),  // Hook bill tip
    ]);
  }, []);

  // Top rim rolled pipe curve (sweeps circumference, leaving spout mouth 100% hollow & open)
  const rimCurve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const r = radiusTop;
    const thetaGap = Math.asin(0.08 / r); // ~0.212 rad
    const segments = 32;
    for (let i = 0; i <= segments; i++) {
      const alpha = thetaGap + (i * (Math.PI * 2 - 2 * thetaGap)) / segments;
      points.push(new THREE.Vector3(r * Math.sin(alpha), ladleHeight / 2, r * Math.cos(alpha)));
    }
    return new THREE.CatmullRomCurve3(points);
  }, [radiusTop, ladleHeight]);

  return (
    <group
      ref={rootGroupRef}
      name="ENV_HeavyIndustrialCraneLadle"
      position={[position[0], position[1] + suspensionElevation, position[2]]}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        setIsLadleControlOpen(true);
      }}
    >
      {/* ========================================================================= */}
      {/* 1. CRANE RIGGING: HOOK PHYSICALLY INTERLOCKED THROUGH BAIL EYELET (GAMBAR 1) */}
      {/* ========================================================================= */}
      <group>
        {/* Forged Heavy Crane Hook Assembly */}
        <group>
          {/* Swivel Shank Pin extending up to pulley block */}
          <mesh position={[0, 1.53, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.10, 16]} />
            <meshStandardMaterial {...brightSteelMat} />
          </mesh>
          {/* Swivel Thrust Bearing Collar */}
          <mesh position={[0, 1.47, 0]}>
            <cylinderGeometry args={[0.044, 0.044, 0.035, 20]} />
            <meshStandardMaterial {...craneHookMat} />
          </mesh>

          {/* Curved Forged Hook Body: Loops cleanly THROUGH the eyelet and cradles under the bar! */}
          <mesh>
            <tubeGeometry args={[forgedCraneHookCurve, 40, 0.022, 16, false]} />
            <meshStandardMaterial {...craneHookMat} />
          </mesh>

          {/* Spherical Rounded Hook Bill Tip */}
          <mesh position={[0, 1.385, 0.050]}>
            <sphereGeometry args={[0.022, 16, 16]} />
            <meshStandardMaterial {...craneHookMat} />
          </mesh>

          {/* Safety Spring Latch resting against the hook throat */}
          <mesh position={[0, 1.42, 0.025]} rotation={[-0.55, 0, 0]}>
            <boxGeometry args={[0.010, 0.12, 0.006]} />
            <meshStandardMaterial {...brightSteelMat} />
          </mesh>
        </group>

        {/* Traveling Pulley Block Housing (Industrial Safety Yellow) */}
        <group position={[0, 1.66, 0]}>
          <mesh>
            <boxGeometry args={[0.24, 0.28, 0.18]} />
            <meshStandardMaterial {...cranePulleyMat} />
          </mesh>
          {/* Sheave Inspection Flanges & Bolts */}
          {[-0.08, 0.08].map((px, pi) => (
            <mesh key={pi} position={[px, 0, 0.092]}>
              <cylinderGeometry args={[0.012, 0.012, 0.008, 6]} />
              <meshStandardMaterial {...brightSteelMat} />
            </mesh>
          ))}
          <Text
            position={[0, 0, 0.092]}
            fontSize={0.032}
            color="#0f172a"
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            10 T
          </Text>
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 2. RIGID CRANE BAIL FRAME (Tetap Tegak Lurus Menggantung Stabil di Udara) */}
      {/* ========================================================================= */}
      <group>
        {/* --- LEFT & RIGHT VERTICAL BAIL STANCHIONS --- */}
        {[-1, 1].map((side) => {
          const sx = side * stanchionX;
          return (
            <group key={side} position={[sx, 0, 0]}>
              {/* Main Vertical Heavy Rectangular Column */}
              <mesh position={[0, (trunnionY + beamY) / 2 + 0.02, 0]}>
                <boxGeometry args={[0.055, beamY - trunnionY + 0.08, 0.08]} />
                <meshStandardMaterial {...steelMat} />
              </mesh>

              {/* Stepped Stanchion Head Protruding Above Top Beam (Gambar 4 & 5) */}
              <mesh position={[0, beamY + 0.075, 0]}>
                <boxGeometry args={[0.065, 0.085, 0.085]} />
                <meshStandardMaterial {...darkSteelMat} />
              </mesh>
              {/* Central Notch in Stanchion Head */}
              <mesh position={[0, beamY + 0.11, 0]}>
                <boxGeometry args={[0.035, 0.025, 0.09]} />
                <meshStandardMaterial {...steelMat} />
              </mesh>

              {/* Outer Horizontal Stiffener Ribs on Stanchion (Gambar 5) */}
              {[0.68, 0.88].map((ry, ri) => (
                <mesh key={ri} position={[side * 0.032, ry, 0]}>
                  <boxGeometry args={[0.015, 0.030, 0.095]} />
                  <meshStandardMaterial {...darkSteelMat} />
                </mesh>
              ))}

              {/* Large Lower Trunnion Pivot Hub Boss Flange (Gambar 3 & 5) */}
              <group position={[0, trunnionY, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.075, 0.075, 0.075, 32]} />
                  <meshStandardMaterial {...darkSteelMat} />
                </mesh>
                <mesh position={[side * 0.042, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.055, 0.055, 0.015, 24]} />
                  <meshStandardMaterial {...steelMat} />
                </mesh>
                {/* Hub Retention Bolt Circle */}
                {[0, 1, 2, 3, 4, 5].map((bi) => {
                  const ang = (bi * Math.PI) / 3;
                  const by = Math.sin(ang) * 0.038;
                  const bz = Math.cos(ang) * 0.038;
                  return (
                    <mesh key={bi} position={[side * 0.052, by, bz]} rotation={[0, 0, Math.PI / 2]}>
                      <cylinderGeometry args={[0.005, 0.005, 0.008, 6]} />
                      <meshStandardMaterial {...brightSteelMat} />
                    </mesh>
                  );
                })}
              </group>
            </group>
          );
        })}

        {/* --- DOUBLE C-CHANNEL SPREADER TOP BEAM (Gambar 4 & 5) --- */}
        <group position={[0, beamY, 0]}>
          {/* Front C-Channel Beam (facing +Z) */}
          <group position={[0, 0, 0.036]}>
            <mesh>
              <boxGeometry args={[beamLength, 0.115, 0.016]} />
              <meshStandardMaterial {...steelMat} />
            </mesh>
            <mesh position={[0, 0.052, 0.018]}>
              <boxGeometry args={[beamLength, 0.014, 0.045]} />
              <meshStandardMaterial {...steelMat} />
            </mesh>
            <mesh position={[0, -0.052, 0.018]}>
              <boxGeometry args={[beamLength, 0.014, 0.045]} />
              <meshStandardMaterial {...steelMat} />
            </mesh>

            {/* 8 Heavy Clamping Bolts on Front Channel */}
            {[-0.38, -0.16, 0.16, 0.38].map((bx, bi) => (
              <React.Fragment key={bi}>
                <group position={[bx, 0.032, 0.014]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.008, 0.008, 0.025, 12]} />
                    <meshStandardMaterial {...brightSteelMat} />
                  </mesh>
                  <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.013, 0.013, 0.012, 6]} />
                    <meshStandardMaterial {...brightSteelMat} />
                  </mesh>
                </group>
                <group position={[bx, -0.032, 0.014]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.008, 0.008, 0.025, 12]} />
                    <meshStandardMaterial {...brightSteelMat} />
                  </mesh>
                  <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.013, 0.013, 0.012, 6]} />
                    <meshStandardMaterial {...brightSteelMat} />
                  </mesh>
                </group>
              </React.Fragment>
            ))}
          </group>

          {/* Rear C-Channel Beam (facing -Z) */}
          <group position={[0, 0, -0.036]}>
            <mesh>
              <boxGeometry args={[beamLength, 0.115, 0.016]} />
              <meshStandardMaterial {...steelMat} />
            </mesh>
            <mesh position={[0, 0.052, -0.018]}>
              <boxGeometry args={[beamLength, 0.014, 0.045]} />
              <meshStandardMaterial {...steelMat} />
            </mesh>
            <mesh position={[0, -0.052, -0.018]}>
              <boxGeometry args={[beamLength, 0.014, 0.045]} />
              <meshStandardMaterial {...steelMat} />
            </mesh>
            {/* 8 Rear Clamping Bolts */}
            {[-0.38, -0.16, 0.16, 0.38].map((bx, bi) => (
              <React.Fragment key={bi}>
                <group position={[bx, 0.032, -0.014]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.008, 0.008, 0.025, 12]} />
                    <meshStandardMaterial {...brightSteelMat} />
                  </mesh>
                  <mesh position={[0, 0, -0.012]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.013, 0.013, 0.012, 6]} />
                    <meshStandardMaterial {...brightSteelMat} />
                  </mesh>
                </group>
                <group position={[bx, -0.032, -0.014]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.008, 0.008, 0.025, 12]} />
                    <meshStandardMaterial {...brightSteelMat} />
                  </mesh>
                  <mesh position={[0, 0, -0.012]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.013, 0.013, 0.012, 6]} />
                    <meshStandardMaterial {...brightSteelMat} />
                  </mesh>
                </group>
              </React.Fragment>
            ))}
          </group>

          {/* Heavy Under-Beam Spacer Bar (Gambar 4) */}
          <mesh position={[0, -0.075, 0]}>
            <boxGeometry args={[beamLength - 0.16, 0.045, 0.075]} />
            <meshStandardMaterial {...darkSteelMat} />
          </mesh>
        </group>

        {/* --- AUTHENTIC INVERTED-U FORGED CRANE HOOK BAIL LOOP (Gambar 4) --- */}
        <group position={[0, 0, 0]}>
          <mesh position={[-0.052, beamY + 0.075, 0]} rotation={[0, 0, -0.20]}>
            <cylinderGeometry args={[0.022, 0.025, 0.11, 20]} />
            <meshStandardMaterial {...darkSteelMat} />
          </mesh>
          <mesh position={[0.052, beamY + 0.075, 0]} rotation={[0, 0, 0.20]}>
            <cylinderGeometry args={[0.022, 0.025, 0.11, 20]} />
            <meshStandardMaterial {...darkSteelMat} />
          </mesh>
          <mesh>
            <tubeGeometry args={[bailLoopCurve, 32, 0.013, 16, false]} />
            <meshStandardMaterial {...brightSteelMat} />
          </mesh>
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 3. TILTING WORM GEARBOX REDUCER (Rigidly anchored to left bail stanchion) */}
      {/* ========================================================================= */}
      <group position={[-stanchionX - 0.11, trunnionY, 0]}>
        <mesh position={[0, 0.035, 0]}>
          <boxGeometry args={[0.16, 0.13, 0.22]} />
          <meshStandardMaterial {...darkSteelMat} />
        </mesh>

        <mesh position={[0, -0.025, -0.02]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.088, 0.088, 0.155, 32]} />
          <meshStandardMaterial {...darkSteelMat} />
        </mesh>

        {/* Transverse Cooling Ribs on Gearbox Lid (Gambar 2 & 3) */}
        {!isLite && [-0.07, -0.04, -0.01, 0.02, 0.05, 0.08].map((fz, fi) => (
          <mesh key={fi} position={[0, 0.106, fz]}>
            <boxGeometry args={[0.14, 0.014, 0.010]} />
            <meshStandardMaterial {...steelMat} />
          </mesh>
        ))}

        <mesh position={[0, 0.102, 0.005]}>
          <boxGeometry args={[0.15, 0.008, 0.18]} />
          <meshStandardMaterial {...darkSteelMat} />
        </mesh>

        {/* Front Circular Bearing Cap with 6 Perimeter Bolts */}
        <group position={[0, 0.035, 0.112]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.018, 24]} />
            <meshStandardMaterial {...steelMat} />
          </mesh>
          {!isLite && [0, 1, 2, 3, 4, 5].map((bi) => {
            const ang = (bi * Math.PI) / 3;
            const bx = Math.cos(ang) * 0.032;
            const by = Math.sin(ang) * 0.032;
            return (
              <mesh key={bi} position={[bx, by, 0.011]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.0045, 0.0045, 0.008, 6]} />
                <meshStandardMaterial {...brightSteelMat} />
              </mesh>
            );
          })}
        </group>

        {/* Side Bearing Cap */}
        <mesh position={[-0.082, -0.025, -0.02]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.048, 0.048, 0.016, 24]} />
          <meshStandardMaterial {...steelMat} />
        </mesh>

        {/* Rigid Torque Reaction Bracket Anchored to Stanchion */}
        <mesh position={[0.09, -0.01, 0]}>
          <boxGeometry args={[0.05, 0.09, 0.10]} />
          <meshStandardMaterial {...darkSteelMat} />
        </mesh>
        <mesh position={[0.10, -0.04, 0]} rotation={[0, 0, -0.45]}>
          <boxGeometry args={[0.08, 0.025, 0.08]} />
          <meshStandardMaterial {...darkSteelMat} />
        </mesh>

        {/* Horizontal Worm Input Shaft */}
        <mesh position={[-0.10, 0.035, 0.05]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.016, 0.016, 0.09, 16]} />
          <meshStandardMaterial {...brightSteelMat} />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE HANDWHEEL: 360° CONTINUOUS ROTATION                        */}
      {/* ========================================================================= */}
      <group
        position={[-stanchionX - 0.24, trunnionY + 0.035, 0.05]}
        onClick={(e) => {
          e.stopPropagation();
          if (!dragStartPosRef.current.moved) {
            setIsLadleControlOpen(true);
          }
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          const ptrId = (e as any).pointerId ?? (e.nativeEvent as PointerEvent | undefined)?.pointerId ?? 0;
          if (activePointerIdRef.current === null || ptrId === activePointerIdRef.current) {
            releaseWheelDrag(true);
          }
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          (e.nativeEvent as any)?.stopImmediatePropagation?.();
          if (dragCleanupRef.current) {
            dragCleanupRef.current();
            dragCleanupRef.current = null;
          }
          const ptrId = (e as any).pointerId ?? (e.nativeEvent as PointerEvent | undefined)?.pointerId ?? 0;
          activePointerIdRef.current = ptrId;
          const clientX = (e as any).clientX ?? 0;
          const clientY = (e as any).clientY ?? 0;
          dragStartPosRef.current = { x: clientX, y: clientY, moved: false };
          dragLastYRef.current = clientY;
          setIsDraggingWheel(true);
          setIsDragging3DControl(true);
          setActiveHoverObject('ladle-wheel');
          onDragStateChange?.(true);
          document.body.style.cursor = 'grabbing';

          const handlePointerMove = (ev: PointerEvent) => {
            if (activePointerIdRef.current !== null && ev.pointerId !== activePointerIdRef.current) {
              return;
            }
            const rawDeltaY = dragLastYRef.current - ev.clientY;
            dragLastYRef.current = ev.clientY;

            const distMoved = Math.hypot(
              ev.clientX - dragStartPosRef.current.x,
              ev.clientY - dragStartPosRef.current.y
            );
            if (distMoved > 8) {
              dragStartPosRef.current.moved = true;
            }

            const clampedDeltaY = Math.max(-35, Math.min(35, rawDeltaY));
            const degStep = clampedDeltaY * 0.24;
            const currDeg = useSimStore.getState().ladleTiltDeg;
            setLadleTiltDeg(currDeg + degStep);
          };

          const handlePointerEnd = (ev?: PointerEvent) => {
            if (ev && activePointerIdRef.current !== null && ev.pointerId !== activePointerIdRef.current) {
              return;
            }
            releaseWheelDrag(ev?.type === 'pointerup');
          };

          const handleWindowBlur = () => releaseWheelDrag(false);

          window.addEventListener('pointermove', handlePointerMove);
          window.addEventListener('pointerup', handlePointerEnd);
          window.addEventListener('pointercancel', handlePointerEnd);
          window.addEventListener('blur', handleWindowBlur);

          dragCleanupRef.current = () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerEnd);
            window.removeEventListener('pointercancel', handlePointerEnd);
            window.removeEventListener('blur', handleWindowBlur);
          };
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHoveredWheel(true);
          setActiveHoverObject('ladle-wheel');
          document.body.style.cursor = isDraggingWheel ? 'grabbing' : 'grab';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHoveredWheel(false);
          if (!isDraggingWheel) {
            setActiveHoverObject(null);
            document.body.style.cursor = 'auto';
          }
        }}
      >
        {/* Invisible enlarged cylindrical hit collider for easy grabbing */}
        <mesh position={[-0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.16, 24]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Floating Interactive HUD Status Label */}
        <group position={[-0.08, 0.34, 0]}>
          <mesh position={[0, 0, -0.002]}>
            <planeGeometry args={[isMoldPourComplete && !isReturnedToStandby ? 0.56 : 0.36, 0.105]} />
            <meshBasicMaterial color="#0f172a" transparent opacity={0.85} />
          </mesh>
          <Text
            position={[0, 0.022, 0]}
            fontSize={0.022}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {`KEMIRINGAN: ${bucketTiltDeg.toFixed(1)}°`}
          </Text>
          <Text
            position={[0, -0.004, 0]}
            fontSize={0.014}
            color={
              bucketTiltDeg >= 89.9
                ? '#ef4444'
                : isDraggingWheel
                ? '#facc15'
                : isHoveredWheel
                ? '#38bdf8'
                : '#cbd5e1'
            }
            anchorX="center"
            anchorY="middle"
          >
            {bucketTiltDeg >= 89.9
              ? 'BATAS MAKSIMAL 90°'
              : isDraggingWheel
              ? 'MEMUTAR LADLE...'
              : 'TAP KONTROL / GESER PUTAR'}
          </Text>
          {isMoldPourComplete && (
            <Text
              position={[0, -0.030, 0]}
              fontSize={0.013}
              color={isReturnedToStandby ? '#4ade80' : '#fde047'}
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {isReturnedToStandby
                ? '✓ LADEL SUDAH DI POSISI SEMULA (STANDBY)'
                : '⚠ KEMBALIKAN LADEL KE POSISI SEMULA (REMOT CRANE)'}
            </Text>
          )}
        </group>

        {/* Rotating Wheel Mesh Assembly */}
        <group ref={handwheelRef}>
          {!isLite ? (
            <>
              {/* Central Hub with Chrome Retention Nut */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.030, 0.030, 0.045, 24]} />
                <meshStandardMaterial {...darkSteelMat} />
              </mesh>
              <mesh position={[-0.026, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.016, 0.016, 0.015, 6]} />
                <meshStandardMaterial {...brightSteelMat} />
              </mesh>

              {/* Large Outer Tubular Rim (Torus in Y-Z plane) */}
              <mesh rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.22, 0.012, 16, 48]} />
                <meshStandardMaterial
                  color={isHoveredWheel || isDraggingWheel ? '#cbd5e1' : '#78889b'}
                  metalness={0.7}
                  roughness={0.25}
                />
              </mesh>

              {/* 4 Slender Radial Spokes (Gambar 5) */}
              <mesh>
                <cylinderGeometry args={[0.006, 0.006, 0.43, 16]} />
                <meshStandardMaterial {...brightSteelMat} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.006, 0.006, 0.43, 16]} />
                <meshStandardMaterial {...brightSteelMat} />
              </mesh>

              {/* Revolving Operator Crank Handle Peg on Rim (Gambar 2 & 5) */}
              <group position={[0, 0, 0.195]}>
                <mesh position={[-0.030, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.007, 0.007, 0.06, 12]} />
                  <meshStandardMaterial {...brightSteelMat} />
                </mesh>
                <mesh position={[-0.070, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.014, 0.014, 0.075, 20]} />
                  <meshStandardMaterial
                    color={isHoveredWheel || isDraggingWheel ? '#e2e8f0' : '#4f5d73'}
                    metalness={0.65}
                    roughness={0.3}
                  />
                </mesh>
                <mesh position={[-0.110, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.018, 0.018, 0.008, 20]} />
                  <meshStandardMaterial {...brightSteelMat} />
                </mesh>
              </group>
            </>
          ) : (
            <>
              {/* Authentic Spoked Handwheel ("Velg Motor") Optimized for Mobile/Lite Mode */}
              {/* Central Hub */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.028, 0.028, 0.035, 12]} />
                <meshStandardMaterial {...darkSteelMat} />
              </mesh>
              <mesh position={[-0.020, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.014, 0.014, 0.012, 6]} />
                <meshStandardMaterial {...brightSteelMat} />
              </mesh>

              {/* Tubular Outer Rim (Low-Poly Torus) */}
              <mesh rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.22, 0.011, 8, 24]} />
                <meshStandardMaterial
                  color={isHoveredWheel || isDraggingWheel ? '#cbd5e1' : '#78889b'}
                  metalness={0.7}
                  roughness={0.25}
                />
              </mesh>

              {/* 4 Radial Spokes ("Jari-Jari Velg Motor" - Cross Pattern) */}
              <mesh>
                <cylinderGeometry args={[0.005, 0.005, 0.43, 8]} />
                <meshStandardMaterial {...brightSteelMat} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 0.43, 8]} />
                <meshStandardMaterial {...brightSteelMat} />
              </mesh>

              {/* Revolving Crank Handle on Rim */}
              <group position={[0, 0, 0.195]}>
                <mesh position={[-0.025, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.006, 0.006, 0.05, 8]} />
                  <meshStandardMaterial {...brightSteelMat} />
                </mesh>
                <mesh position={[-0.065, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.013, 0.013, 0.065, 12]} />
                  <meshStandardMaterial
                    color={isHoveredWheel || isDraggingWheel ? '#e2e8f0' : '#4f5d73'}
                    metalness={0.65}
                    roughness={0.3}
                  />
                </mesh>
              </group>
            </>
          )}
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 5. TILTING LADLE BUCKET VESSEL (Berputar Miring di Sekitar Sumbu Trunnion) */}
      {/* ========================================================================= */}
      <group position={[0, trunnionY, 0]}>
        <group ref={tiltingBucketRef}>
          {/* Offset down to bucket center (y = -0.09 relative to trunnion axis) */}
          <group position={[0, ladleHeight / 2 - trunnionY, 0]}>
            {/* --- CONICAL STEEL DRUM WITH OPEN POUR NOTCH (BAGIAN DALAM CORONG BOLONG PLONG!) --- */}
            {/* 1. Cangkang Baja Bawah (Solid Menyimpan Logam Cair hingga y = 0.22m) */}
            <mesh position={[0, -0.065, 0]}>
              <cylinderGeometry args={[0.367, radiusBottom, 0.57, 64, 1, true]} />
              <meshStandardMaterial {...steelMat} side={THREE.DoubleSide} />
            </mesh>

            {/* 2. Cangkang Baja Atas dengan Bukaan Coakan Corong (y = 0.22m - 0.35m: BOLONG DI SISI CORONG!) */}
            <mesh position={[0, 0.285, 0]}>
              <cylinderGeometry args={[radiusTop, 0.367, 0.13, 64, 1, true, 0.212, Math.PI * 2 - 0.424]} />
              <meshStandardMaterial {...steelMat} side={THREE.DoubleSide} />
            </mesh>

            {/* Solid Flat Base Bottom Disc Plate (Alas paling bawah) */}
            <mesh position={[0, -ladleHeight / 2 + 0.016, 0]}>
              <cylinderGeometry args={[radiusBottom, radiusBottom, 0.032, 48]} />
              <meshStandardMaterial {...darkSteelMat} />
            </mesh>

            {/* 3. Refraktori Keramik Bawah Dalam (Solid hingga y = 0.22m) */}
            <mesh position={[0, -0.065, 0]}>
              <cylinderGeometry
                args={[0.367 - 0.035, radiusBottom - 0.035, 0.57, 64, 1, true]}
              />
              <meshStandardMaterial {...refractoryMat} side={THREE.DoubleSide} />
            </mesh>

            {/* 4. Refraktori Keramik Atas Dalam dengan Bukaan Coakan Corong (BOLONG PLONG MENUJU CORONG!) */}
            <mesh position={[0, 0.285, 0]}>
              <cylinderGeometry
                args={[radiusTop - 0.035, 0.367 - 0.035, 0.13, 64, 1, true, 0.212, Math.PI * 2 - 0.424]}
              />
              <meshStandardMaterial {...refractoryMat} side={THREE.DoubleSide} />
            </mesh>

            {/* Refractory Ceramic Base Floor Inside */}
            <mesh position={[0, -ladleHeight / 2 + 0.036, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[radiusBottom - 0.035, 48]} />
              <meshStandardMaterial {...refractoryMat} />
            </mesh>

            {/* Solid Top Rim Refractory Ring (Cincin Bibir Atas dengan Bukaan di Corong) */}
            <mesh position={[0, ladleHeight / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[radiusTop - 0.035, radiusTop, 64, 1, -Math.PI / 2 + 0.212, Math.PI * 2 - 0.424]} />
              <meshStandardMaterial {...darkSteelMat} side={THREE.DoubleSide} />
            </mesh>

            {/* --- THREE CIRCUMFERENTIAL BELLY BANDS (Gambar 2, 3, 5) --- */}
            {!isLite ? (
              <>
                {/* Band 1: Upper Rim Reinforcement Band (Memiliki coakan agar tidak menutupi corong) */}
                <mesh position={[0, ladleHeight / 2 - 0.03, 0]}>
                  <cylinderGeometry args={[radiusTop + 0.012, radiusTop + 0.012, 0.045, 64, 1, true, 0.212, Math.PI * 2 - 0.424]} />
                  <meshStandardMaterial {...darkSteelMat} side={THREE.DoubleSide} />
                </mesh>

                {/* Band 2: Midsection Circumferential Belly Band */}
                <mesh position={[0, 0.03, 0]}>
                  <cylinderGeometry args={[0.354, 0.354, 0.048, 64, 1, true]} />
                  <meshStandardMaterial {...darkSteelMat} side={THREE.DoubleSide} />
                </mesh>

                {/* Band 3: Lower Circumferential Belly Band near Base */}
                <mesh position={[0, -ladleHeight / 2 + 0.08, 0]}>
                  <cylinderGeometry args={[0.324, 0.324, 0.048, 64, 1, true]} />
                  <meshStandardMaterial {...darkSteelMat} side={THREE.DoubleSide} />
                </mesh>
              </>
            ) : (
              <mesh position={[0, 0.03, 0]}>
                <cylinderGeometry args={[0.354, 0.354, 0.065, 24, 1, true]} />
                <meshStandardMaterial {...darkSteelMat} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Rolled Top Rim Lip Pipe Collar: Berhenti presisi di dinding corong (Mulut Corong 100% Bolong Bebas Halangan!) */}
            <mesh>
              <tubeGeometry args={[rimCurve, 48, 0.012, 16, false]} />
              <meshStandardMaterial {...steelMat} />
            </mesh>

            {/* --- COMPACT AUTHENTIC FLARING SPOUT (GAMBAR 4 & 5) --- */}
            {/* 100% di sisi depan (+Z). Proporsi ramping & anggun sesuai referensi! */}
            <group>
              {/* Outer Steel Spout Shell */}
              <mesh geometry={SPOUT_OUTER_GEO}>
                <meshStandardMaterial {...steelMat} side={THREE.DoubleSide} />
              </mesh>

              {/* Inner Refractory Chute Lining */}
              <mesh geometry={SPOUT_INNER_GEO}>
                <meshStandardMaterial {...refractoryMat} side={THREE.DoubleSide} />
              </mesh>

              {/* Beak Pouring Lip Horizontal Rolled Edge (x = -0.085 to +0.085 at y = 0.375, z = 0.445) */}
              <mesh position={[0, 0.375, 0.445]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.006, 0.006, 0.170, 16]} />
                <meshStandardMaterial {...steelMat} />
              </mesh>

              {/* Left Cheek Slanted Rolled Rim Edge */}
              <mesh position={[-0.0825, 0.3625, 0.408]} rotation={[1.245, 0, 0]}>
                <cylinderGeometry args={[0.006, 0.006, 0.078, 16]} />
                <meshStandardMaterial {...steelMat} />
              </mesh>

              {/* Right Cheek Slanted Rolled Rim Edge */}
              <mesh position={[0.0825, 0.3625, 0.408]} rotation={[1.245, 0, 0]}>
                <cylinderGeometry args={[0.006, 0.006, 0.078, 16]} />
                <meshStandardMaterial {...steelMat} />
              </mesh>
            </group>

            {/* --- HEAVY CAST TRUNNION MOUNTING SADDLES (GAMBAR 2: GAP 100% ELIMINATED!) --- */}
            {/* Centered at y = 0.09m (the trunnion axis), seamlessly joining bucket to stanchions */}
            {[-1, 1].map((side) => (
              <group key={side} position={[0, 0.09, 0]}>
                {/* Thick Heavy Saddle Mounting Pad Welded to Bucket Belly Band */}
                <mesh position={[side * 0.358, 0, 0]}>
                  <boxGeometry args={[0.025, 0.18, 0.15]} />
                  <meshStandardMaterial {...darkSteelMat} />
                </mesh>

                {/* Upper Reinforcing Gusset Fin */}
                <mesh position={[side * 0.358, 0.10, 0]} rotation={[0, 0, side * -0.48]}>
                  <boxGeometry args={[0.020, 0.08, 0.10]} />
                  <meshStandardMaterial {...darkSteelMat} />
                </mesh>

                {/* Lower Reinforcing Gusset Fin */}
                <mesh position={[side * 0.358, -0.10, 0]} rotation={[0, 0, side * 0.48]}>
                  <boxGeometry args={[0.020, 0.08, 0.10]} />
                  <meshStandardMaterial {...darkSteelMat} />
                </mesh>

                {/* Solid Cylindrical Trunnion Boss Hub */}
                <mesh position={[side * 0.388, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.062, 0.062, 0.065, 28]} />
                  <meshStandardMaterial {...steelMat} />
                </mesh>

                {/* Heavy Retaining Spacer Collar Flange */}
                <mesh position={[side * 0.418, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.052, 0.052, 0.020, 24]} />
                  <meshStandardMaterial {...darkSteelMat} />
                </mesh>
              </group>
            ))}

            {/* --- DYNAMIC MOLTEN LIQUID METAL SURFACE --- */}
            <mesh
              ref={liquidMeshRef}
              name="VFX_LadleMoltenLiquid"
              position={[0, -0.20, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              visible={false}
            >
              <circleGeometry args={[radiusTop - 0.038, 48]} />
              <meshStandardMaterial
                ref={liquidMatRef}
                color="#f97316"
                metalness={0.85}
                roughness={0.20}
              />
            </mesh>


            {/* Dynamic Thermal Steam / Fume Column */}
            <mesh
              ref={fumeRef}
              name="VFX_LadleThermalFumes"
              position={[0, ladleHeight / 2 + 0.24, 0]}
              visible={false}
            >
              <cylinderGeometry args={[radiusTop + 0.10, radiusTop * 0.7, 0.55, 24, 1, true]} />
              <meshBasicMaterial
                color="#cbd5e1"
                transparent
                opacity={0.16}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>

          {/* Left & Right Heavy Chrome Trunnion Shaft Pins (Fully seated inside boss hubs) */}
          <mesh position={[-0.435, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.034, 0.034, 0.14, 28]} />
            <meshStandardMaterial {...brightSteelMat} />
          </mesh>
          <mesh position={[0.435, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.034, 0.034, 0.14, 28]} />
            <meshStandardMaterial {...brightSteelMat} />
          </mesh>
        </group>
      </group>

      {/* Dynamic Vertical Molten Stream pouring down from ladle beak lip (Gravity-Aligned, 100% Vertical) */}
      <mesh
        ref={ladleStreamRef}
        name="VFX_LadlePouringStream"
        position={[0, 0, 0]}
        visible={false}
      >
        <cylinderGeometry args={[0.018, 0.013, 1.0, 16]} />
        <meshStandardMaterial
          color="#ff7a00"
          emissive="#ff4400"
          emissiveIntensity={2.5}
          metalness={0.8}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
};

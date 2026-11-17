import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '../../store/useSimStore';

interface ConnectedWaterCablesProps {
  gland1Pos?: [number, number, number];
  gland2Pos?: [number, number, number];
  furnacePivotPos?: [number, number, number];
}

/**
 * Authentic Procedural Water-Cooled Secondary Power Leads (Kabel Fleksibel Berpendingin Air).
 * 
 * Engineering & Routing Specifications:
 * 1. Monolithic Smooth Catenary Arc:
 *    - Emerges horizontally from the Power Cabinet yellow access panel glands along +X.
 *    - Gracefully sweeps downward and rearward under natural cable self-weight into a generous catenary sag.
 *    - Passes completely clear of both the furnace left concrete plinth and the operator platform column footing (zero clipping).
 *    - Smoothly ascends into the furnace rear copper terminal busbars without sharp 90-degree pipe elbows or kinks.
 * 2. Kinematic Dynamic Flex:
 *    - Accommodates full 0° to 75° tilting motion smoothly.
 *    - As the furnace tilts forward, the loop naturally lifts and flexes with realistic slack.
 * 3. Elimination of Clutter:
 *    - Removed artificial rigid floor clamps that previously sandwiched the platform column and pinned the cables.
 *    - Real water-cooled cables are suspended flexible conduits that flex dynamically during pouring.
 */
function buildCableCurves(
  tiltRad: number,
  cStart1: THREE.Vector3,
  cStart2: THREE.Vector3,
  pivotX = 0.0,
  pivotY = 1.39,
  pivotZ = 0.0
) {
  const cosT = Math.cos(tiltRad);
  const sinT = Math.sin(tiltRad);

  // Kinematic formula matching authentic IndustrialFurnace rear copper busbar terminal blocks:
  // Sesuai permintaan user: kabel langsung disambungkan ke ujung plat & pipa tembaga di x = ±0.069m, y = -0.285m, z = -0.75m
  // Terminal 1: x = -0.069, y = -0.285, z = -0.75
  // Terminal 2: x = +0.069, y = -0.285, z = -0.75
  const yRot = -0.285 * cosT + 0.75 * sinT;
  const zRot = -0.285 * sinT - 0.75 * cosT;

  const fPos1 = new THREE.Vector3(pivotX - 0.069, pivotY + yRot, pivotZ + zRot);
  const fPos2 = new THREE.Vector3(pivotX + 0.069, pivotY + yRot, pivotZ + zRot);

  // Monolithic smooth CatmullRom spline points for Cable 1 (Front Lead)
  // X coordinates increase strictly monotonically -> zero backward loops or kinks!
  const p1 = [
    new THREE.Vector3(cStart1.x - 0.06, cStart1.y, cStart1.z),
    new THREE.Vector3(cStart1.x, cStart1.y, cStart1.z),
    new THREE.Vector3(cStart1.x + 0.08, cStart1.y, cStart1.z),
    new THREE.Vector3(-1.54, 0.42, -0.10),
    new THREE.Vector3(-1.32, 0.25, -0.34),
    new THREE.Vector3(-1.08, 0.12 + 0.08 * sinT, -0.56 - 0.02 * sinT),
    new THREE.Vector3(-0.85, 0.08 + 0.18 * sinT, -0.66 - 0.03 * sinT),
    new THREE.Vector3(-0.58, 0.14 + 0.38 * sinT, -0.72 - 0.03 * sinT),
    new THREE.Vector3(-0.35, 0.30 + 0.62 * sinT, -0.76 - 0.02 * sinT),
    new THREE.Vector3(fPos1.x - 0.14, fPos1.y - 0.14, fPos1.z - 0.04),
    new THREE.Vector3(fPos1.x - 0.05, fPos1.y - 0.05, fPos1.z - 0.01),
    fPos1,
  ];

  // Monolithic smooth CatmullRom spline points for Cable 2 (Rear Lead)
  // Runs parallel to Cable 1 with consistent 6-7cm separation
  const p2 = [
    new THREE.Vector3(cStart2.x - 0.06, cStart2.y, cStart2.z),
    new THREE.Vector3(cStart2.x, cStart2.y, cStart2.z),
    new THREE.Vector3(cStart2.x + 0.08, cStart2.y, cStart2.z),
    new THREE.Vector3(-1.54, 0.42, -0.18),
    new THREE.Vector3(-1.32, 0.25, -0.42),
    new THREE.Vector3(-1.08, 0.12 + 0.08 * sinT, -0.63 - 0.02 * sinT),
    new THREE.Vector3(-0.85, 0.08 + 0.18 * sinT, -0.72 - 0.03 * sinT),
    new THREE.Vector3(-0.58, 0.14 + 0.38 * sinT, -0.77 - 0.03 * sinT),
    new THREE.Vector3(-0.35, 0.30 + 0.62 * sinT, -0.80 - 0.02 * sinT),
    new THREE.Vector3(fPos2.x - 0.14, fPos2.y - 0.14, fPos2.z - 0.04),
    new THREE.Vector3(fPos2.x - 0.05, fPos2.y - 0.05, fPos2.z - 0.01),
    fPos2,
  ];

  const curve1 = new THREE.CatmullRomCurve3(p1, false, 'centripetal');
  const curve2 = new THREE.CatmullRomCurve3(p2, false, 'centripetal');

  return { curve1, curve2, fPos1, fPos2 };
}

const NOOP_RAYCAST = () => null;

export const ConnectedWaterCables: React.FC<ConnectedWaterCablesProps> = ({
  gland1Pos = [-1.767, 0.58, 0.055],
  gland2Pos = [-1.767, 0.58, -0.055],
  furnacePivotPos = [0.0, 1.39, 0.0],
}) => {
  const isLite = useSimStore((s) => s.performanceProfile === 'lite');
  const tubeSegments = isLite ? 20 : 64;
  const radialSegments = isLite ? 6 : 16;

  const mesh1Ref = useRef<THREE.Mesh>(null);
  const mesh2Ref = useRef<THREE.Mesh>(null);
  const currentTiltRadRef = useRef<number>(0);
  const lastRenderedRadRef = useRef<number>(-999);

  const cStart1 = useMemo(() => new THREE.Vector3(...gland1Pos), [gland1Pos]);
  const cStart2 = useMemo(() => new THREE.Vector3(...gland2Pos), [gland2Pos]);

  const initialCurves = useMemo(() => {
    return buildCableCurves(
      0,
      cStart1,
      cStart2,
      furnacePivotPos[0],
      furnacePivotPos[1],
      furnacePivotPos[2]
    );
  }, [cStart1, cStart2, furnacePivotPos]);

  useFrame((_, delta) => {
    const targetRad = (useSimStore.getState().tiltAngle * Math.PI) / 180;

    // Synchronize smoothly with IndustrialFurnace.tsx lerp speed
    currentTiltRadRef.current = THREE.MathUtils.lerp(
      currentTiltRadRef.current,
      targetRad,
      delta * 12
    );

    const tiltRad = currentTiltRadRef.current;
    // Step threshold (~1.4 deg) prevents per-frame GPU buffer thrashing on mobile while keeping motion smooth
    if (Math.abs(tiltRad - lastRenderedRadRef.current) < 0.024 && Math.abs(tiltRad - targetRad) > 0.002) return;
    if (Math.abs(tiltRad - lastRenderedRadRef.current) < 0.002) return;
    lastRenderedRadRef.current = tiltRad;

    const { curve1, curve2 } = buildCableCurves(
      tiltRad,
      cStart1,
      cStart2,
      furnacePivotPos[0],
      furnacePivotPos[1],
      furnacePivotPos[2]
    );

    if (mesh1Ref.current) {
      mesh1Ref.current.geometry.dispose();
      mesh1Ref.current.geometry = new THREE.TubeGeometry(curve1, tubeSegments, 0.024, radialSegments, false);
    }
    if (mesh2Ref.current) {
      mesh2Ref.current.geometry.dispose();
      mesh2Ref.current.geometry = new THREE.TubeGeometry(curve2, tubeSegments, 0.024, radialSegments, false);
    }
  });

  return (
    <group name="ENV_ConnectedWaterCables">
      {/* Heavy Vulcanized Synthetic Rubber Water-Cooled Power Cable 1 */}
      <mesh ref={mesh1Ref} raycast={NOOP_RAYCAST}>
        <tubeGeometry args={[initialCurves.curve1, tubeSegments, 0.024, radialSegments, false]} />
        <meshStandardMaterial color="#1e293b" roughness={0.65} metalness={0.12} />
      </mesh>

      {/* Heavy Vulcanized Synthetic Rubber Water-Cooled Power Cable 2 */}
      <mesh ref={mesh2Ref} raycast={NOOP_RAYCAST}>
        <tubeGeometry args={[initialCurves.curve2, tubeSegments, 0.024, radialSegments, false]} />
        <meshStandardMaterial color="#0f172a" roughness={0.65} metalness={0.12} />
      </mesh>

      {/* Industrial Brass Cable Gland Compression Nuts & Strain Relief Boots at Power Cabinet Exit */}
      {[cStart1, cStart2].map((cStart, ci) => (
        <group key={`gland-hardware-${ci}`} position={[cStart.x, cStart.y, cStart.z]}>
          {/* Heavy Brass Hex Compression Nut */}
          <mesh position={[0.012, 0, 0]} rotation={[0, 0, Math.PI / 2]} raycast={NOOP_RAYCAST}>
            <cylinderGeometry args={[0.038, 0.038, 0.022, 6]} />
            <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Flexible Molded Neoprene Strain Relief Boot */}
          <mesh position={[0.048, 0, 0]} rotation={[0, 0, Math.PI / 2]} raycast={NOOP_RAYCAST}>
            <cylinderGeometry args={[0.026, 0.036, 0.052, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.15} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

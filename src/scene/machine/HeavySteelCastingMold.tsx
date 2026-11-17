import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';

interface HeavySteelCastingMoldProps {
  moldType: 'gear' | 'propeller' | 'ingot' | 'valve';
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const HeavySteelCastingMold: React.FC<HeavySteelCastingMoldProps> = ({
  moldType,
  position = [2.40, 0, 2.20],
  rotation = [0, 0, 0],
}) => {
  const moldState = useSimStore((s) => s.molds[moldType]);
  const { fillLevel, isCooling, isSolid } = moldState;
  const setMoldState = useSimStore((s) => s.setMoldState);
  
  const isLadlePouringToMold = useSimStore((s) => s.isLadlePouringToMold);

  const copeRef = useRef<THREE.Group>(null);
  const moltenPoolRef = useRef<THREE.Mesh>(null);
  const riserPoolRef = useRef<THREE.Mesh>(null);
  const moldLightRef = useRef<THREE.PointLight>(null);
  const steamRef = useRef<THREE.Mesh>(null);
  const solidObjectRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (fillLevel >= 0.99 && !isCooling && !isSolid) {
      setMoldState(moldType, { isCooling: true });
      setTimeout(() => {
        setMoldState(moldType, { isCooling: false, isSolid: true });
      }, 4000); // 4 seconds cooling simulation
    }
  }, [fillLevel, isCooling, isSolid, moldType, setMoldState]);

  useFrame((_, delta) => {
    // Animate Cope (Top half of mold) opening if solid
    if (copeRef.current) {
      if (isSolid) {
        copeRef.current.position.y = THREE.MathUtils.lerp(copeRef.current.position.y, 2.8, delta * 1.5);
      } else {
        copeRef.current.position.y = THREE.MathUtils.lerp(copeRef.current.position.y, 0.44, delta * 3.0);
      }
    }

    if (solidObjectRef.current) {
      if (isSolid) {
        solidObjectRef.current.visible = true;
        // Cool down color from red-hot to gleaming industrial cast steel
        solidObjectRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat.emissive && mat.emissive.r > 0 && mat.emissiveIntensity !== undefined) {
              mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0.05, delta * 0.45);
            }
          }
        });
      } else {
        solidObjectRef.current.visible = false;
        solidObjectRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat.emissive && mat.emissive.r > 0 && mat.emissiveIntensity !== undefined) {
              mat.emissiveIntensity = 2.0;
            }
          }
        });
      }
    }

    // Dynamic molten pool fill height in basin (naik dari kedalaman lubang tenggorokan)
    if (moltenPoolRef.current) {
      if (fillLevel > 0.005 && !isSolid) {
        moltenPoolRef.current.visible = true;
        moltenPoolRef.current.position.y = -0.15 + fillLevel * 0.24;
        const sc = 0.52 + fillLevel * 0.48;
        moltenPoolRef.current.scale.set(sc, sc, 1);
      } else {
        moltenPoolRef.current.visible = false;
      }
    }

    if (riserPoolRef.current) {
      if (fillLevel > 0.15 && !isSolid) {
        riserPoolRef.current.visible = true;
        riserPoolRef.current.position.y = -0.14 + (fillLevel - 0.15) * 0.23;
        const sc = 0.70 + (fillLevel - 0.15) * 0.30;
        riserPoolRef.current.scale.set(sc, sc, 1);
      } else {
        riserPoolRef.current.visible = false;
      }
    }

    // Incandescent molten glow light
    if (moldLightRef.current) {
      if (fillLevel > 0.01 && !isSolid) {
        moldLightRef.current.visible = true;
        moldLightRef.current.intensity = 0.4 + fillLevel * 1.6 + (isLadlePouringToMold ? 0.8 : 0);
      } else {
        moldLightRef.current.visible = false;
      }
    }

    // Thermal casting fumes
    if (steamRef.current) {
      if ((fillLevel > 0.05 || isCooling || isSolid) && steamRef.current.visible !== false) {
        steamRef.current.visible = true;
        steamRef.current.rotation.y += delta * 0.2;
        const mat = steamRef.current.material as THREE.MeshBasicMaterial;
        // Fade out steam after solidifying
        const targetOpacity = isSolid ? 0 : (isCooling ? 0.6 : Math.min(0.28, fillLevel * 0.35));
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 0.5);
        if (isSolid && mat.opacity < 0.01) {
          steamRef.current.visible = false;
        }
      } else {
        if (!isSolid) steamRef.current.visible = false;
      }
    }
  });

  // Materials
  const castIronMat = {
    color: '#334155',
    metalness: 0.7,
    roughness: 0.4,
  };

  const foundrySandMat = {
    color: '#3b3731',
    roughness: 0.95,
    metalness: 0.05,
  };

  const steelClampMat = {
    color: '#94a3b8',
    metalness: 0.85,
    roughness: 0.25,
  };

  const castTitle =
    moldType === 'gear'
      ? 'Roda Gigi Raksasa (Gear)'
      : moldType === 'propeller'
      ? 'Baling Kapal (Propeller)'
      : moldType === 'valve'
      ? 'Bodi Katup Industri (Valve)'
      : 'Balok Baja (Ingot)';

  return (
    <group name={`ENV_CastingMold_${moldType}`} position={position} rotation={rotation}>
      {/* Casting pit and border */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 2.1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Warning border lines */}
      {[-1.0, 1.0].map((sideZ, i) => (
        <mesh key={i} position={[0, 0.008, sideZ * 1.0]}>
          <boxGeometry args={[2.4, 0.005, 0.06]} />
          <meshStandardMaterial color="#facc15" roughness={0.4} />
        </mesh>
      ))}
      {[-1.0, 1.0].map((sideX, i) => (
        <mesh key={i} position={[sideX * 1.2, 0.008, 0]}>
          <boxGeometry args={[0.06, 0.005, 2.0]} />
          <meshStandardMaterial color="#facc15" roughness={0.4} />
        </mesh>
      ))}

      {/* Lower flask (drag) */}
      {moldType === 'gear' ? (
        <group position={[0, 0.15, 0]}>
          <mesh>
            <cylinderGeometry args={[0.76, 0.76, 0.28, 36]} />
            <meshStandardMaterial {...castIronMat} />
          </mesh>
          {/* Top & Bottom Circumferential Flange Rings */}
          <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.77, 0.022, 12, 36]} />
            <meshStandardMaterial {...castIronMat} />
          </mesh>
          <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.77, 0.022, 12, 36]} />
            <meshStandardMaterial {...castIronMat} />
          </mesh>
          {/* 6 Radial Vertical Stiffening Ribs */}
          {[...Array(6)].map((_, ri) => {
            const angle = (ri * Math.PI) / 3;
            return (
              <mesh
                key={`gear-drag-rib-${ri}`}
                position={[Math.cos(angle) * 0.77, 0, Math.sin(angle) * 0.77]}
                rotation={[0, -angle, 0]}
              >
                <boxGeometry args={[0.04, 0.24, 0.05]} />
                <meshStandardMaterial {...castIronMat} />
              </mesh>
            );
          })}
        </group>
      ) : moldType === 'propeller' ? (
        /* B. PROPELLER: LARGE SQUARE FABRICATED FLASK DRAG WITH X-BRACING */
        <group position={[0, 0.15, 0]}>
          <mesh>
            <boxGeometry args={[1.90, 0.28, 1.90]} />
            <meshStandardMaterial {...castIronMat} />
          </mesh>
          {/* 4 Corner Interlocking Guide Pin Sleeves */}
          {[-0.92, 0.92].map((gx, gi) =>
            [-0.92, 0.92].map((gz, gj) => (
              <group key={`pin-sleeve-${gi}-${gj}`} position={[gx, 0, gz]}>
                <mesh>
                  <cylinderGeometry args={[0.045, 0.045, 0.28, 16]} />
                  <meshStandardMaterial {...steelClampMat} />
                </mesh>
                <mesh position={[0, 0.14, 0]}>
                  <cylinderGeometry args={[0.065, 0.065, 0.03, 16]} />
                  <meshStandardMaterial {...castIronMat} />
                </mesh>
              </group>
            ))
          )}
          {/* External Wall Diagonal Stiffeners on Each Face */}
          {[-0.96, 0.96].map((wx, wi) => (
            <React.Fragment key={`drag-x-${wi}`}>
              <mesh position={[wx, 0, 0]} rotation={[0, 0, 0.45]}>
                <boxGeometry args={[0.03, 0.35, 0.03]} />
                <meshStandardMaterial {...steelClampMat} />
              </mesh>
              <mesh position={[0, 0, wx]} rotation={[0.45, 0, 0]}>
                <boxGeometry args={[0.03, 0.35, 0.03]} />
                <meshStandardMaterial {...steelClampMat} />
              </mesh>
            </React.Fragment>
          ))}
        </group>
      ) : moldType === 'valve' ? (
        /* D. VALVE: RECTANGULAR FLASK DRAG WITH GUIDE SLEEVES */
        <group position={[0, 0.15, 0]}>
          <mesh>
            <boxGeometry args={[1.60, 0.28, 1.20]} />
            <meshStandardMaterial {...castIronMat} />
          </mesh>
          {/* Guide sleeves */}
          {[-0.75, 0.75].map((gx, gi) =>
            [-0.55, 0.55].map((gz, gj) => (
              <mesh key={`valve-pin-${gi}-${gj}`} position={[gx, 0.05, gz]}>
                <cylinderGeometry args={[0.035, 0.035, 0.25, 16]} />
                <meshStandardMaterial {...steelClampMat} />
              </mesh>
            ))
          )}
          {/* Side stiffeners */}
          {[-0.81, 0.81].map((rx, ri) => (
            <mesh key={`valve-rib-${ri}`} position={[rx, 0, 0]}>
              <boxGeometry args={[0.03, 0.26, 1.10]} />
              <meshStandardMaterial {...steelClampMat} />
            </mesh>
          ))}
        </group>
      ) : (
        /* C. INGOT: HEAVY SOLID BASE STOOL (KOKIL BASE PLATE ON RUNNERS) */
        <group position={[0, 0.12, 0]}>
          {/* Main Heavy Cast Iron Base Block */}
          <mesh>
            <boxGeometry args={[1.48, 0.22, 1.15]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.5} />
          </mesh>
          {/* Longitudinal Floor Skid Runners */}
          {[-0.45, 0.45].map((sx, si) => (
            <mesh key={`skid-${si}`} position={[sx, -0.12, 0]}>
              <boxGeometry args={[0.16, 0.06, 1.30]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.4} />
            </mesh>
          ))}
          {/* Forklift Lifting Channels through Base */}
          {[-0.32, 0.32].map((fx, fi) => (
            <mesh key={`fork-${fi}`} position={[fx, -0.02, 0]}>
              <boxGeometry args={[0.18, 0.10, 1.18]} />
              <meshStandardMaterial color="#020617" roughness={0.9} />
            </mesh>
          ))}
        </group>
      )}

      {/* Heavy Parting Line Flange between Cope & Drag */}
      {moldType === 'gear' ? (
        <mesh position={[0, 0.29, 0]}>
          <cylinderGeometry args={[0.82, 0.82, 0.035, 36]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
      ) : moldType === 'propeller' ? (
        <mesh position={[0, 0.29, 0]}>
          <boxGeometry args={[2.02, 0.035, 2.02]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
      ) : moldType === 'valve' ? (
        <mesh position={[0, 0.29, 0]}>
          <boxGeometry args={[1.68, 0.035, 1.28]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
      ) : (
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[1.56, 0.040, 1.22]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
        </mesh>
      )}

      {/* Solid Cast Object (Visible when isSolid is true) */}
      <group ref={solidObjectRef} position={[0, 0.44, 0]} visible={false}>
        {/* MODEL 1: RODA GIGI BAJA RAKSASA (HEAVY INDUSTRIAL SPUR GEAR) */}
        {moldType === 'gear' && (
          <group>
            {/* Central Hub (Boss) */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.26, 32]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} emissive="#ff4400" emissiveIntensity={2} />
            </mesh>
            {/* Center Bore (Shaft Hole) */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.075, 0.075, 0.28, 24]} />
              <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.7} />
            </mesh>
            {/* Keyway Slot */}
            <mesh position={[0.075, 0, 0]}>
              <boxGeometry args={[0.03, 0.28, 0.03]} />
              <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.7} />
            </mesh>
            {/* Hub Retaining Flange Lips */}
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.20, 0.20, 0.03, 32]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} emissive="#ff4400" emissiveIntensity={2} />
            </mesh>
            <mesh position={[0, -0.12, 0]}>
              <cylinderGeometry args={[0.20, 0.20, 0.03, 32]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} emissive="#ff4400" emissiveIntensity={2} />
            </mesh>

            {/* Outer Rim Ring */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.53, 0.53, 0.22, 48]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} emissive="#ff4400" emissiveIntensity={2} />
            </mesh>
            {/* Inner Rim Hollow Inset */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.45, 0.45, 0.24, 48]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.35} emissive="#ff4400" emissiveIntensity={2} />
            </mesh>

            {/* 20 Involute Gear Teeth around Circumference */}
            {[...Array(20)].map((_, i) => {
              const angle = (i * 2 * Math.PI) / 20;
              const r = 0.545;
              return (
                <group key={`tooth-${i}`} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]} rotation={[0, -angle, 0]}>
                  {/* Main Tooth Root */}
                  <mesh>
                    <boxGeometry args={[0.075, 0.22, 0.08]} />
                    <meshStandardMaterial color="#e2e8f0" metalness={0.82} roughness={0.25} emissive="#ff4400" emissiveIntensity={2} />
                  </mesh>
                  {/* Tapered Involute Tooth Crown */}
                  <mesh position={[0.038, 0, 0]}>
                    <boxGeometry args={[0.032, 0.20, 0.055]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.82} roughness={0.25} emissive="#ff4400" emissiveIntensity={2} />
                  </mesh>
                </group>
              );
            })}

            {/* 6 Structural Spokes connecting Hub to Rim */}
            {[...Array(6)].map((_, i) => {
              const angle = (i * 2 * Math.PI) / 6;
              const r = 0.315;
              return (
                <group key={`spoke-${i}`} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]} rotation={[0, -angle, 0]}>
                  {/* Spoke Web Arm */}
                  <mesh>
                    <boxGeometry args={[0.26, 0.14, 0.055]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.78} roughness={0.32} emissive="#ff4400" emissiveIntensity={2} />
                  </mesh>
                  {/* Top & Bottom Stiffener Ribs */}
                  <mesh position={[0, 0.08, 0]}>
                    <boxGeometry args={[0.24, 0.02, 0.09]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.78} roughness={0.32} emissive="#ff4400" emissiveIntensity={2} />
                  </mesh>
                  <mesh position={[0, -0.08, 0]}>
                    <boxGeometry args={[0.24, 0.02, 0.09]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.78} roughness={0.32} emissive="#ff4400" emissiveIntensity={2} />
                  </mesh>
                </group>
              );
            })}
          </group>
        )}

        {/* MODEL 2: BALING-BALING KAPAL / TURBIN (MARINE HYDROFOIL PROPELLER) */}
        {moldType === 'propeller' && (
          <group>
            {/* Central Streamlined Bullet Hub */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.16, 0.20, 0.30, 32]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} emissive="#ff4400" emissiveIntensity={2} />
            </mesh>
            {/* Top Nose Dome */}
            <mesh position={[0, 0.15, 0]}>
              <sphereGeometry args={[0.16, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} emissive="#ff4400" emissiveIntensity={2} />
            </mesh>
            {/* Center Shaft Bore */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.075, 0.075, 0.34, 24]} />
              <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.7} />
            </mesh>

            {/* 4 Hydrofoil Twisted Propeller Blades */}
            {[0, 1, 2, 3].map((i) => {
              const angle = (i * Math.PI) / 2;
              return (
                <group key={`prop-blade-${i}`} rotation={[0, angle, 0]}>
                  {/* Blade Root Section */}
                  <mesh position={[0.22, 0, 0]} rotation={[0.42, 0, 0]}>
                    <boxGeometry args={[0.14, 0.06, 0.20]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} emissive="#ff4400" emissiveIntensity={2} />
                  </mesh>
                  {/* Main Hydrofoil Foil (Mid Span) */}
                  <mesh position={[0.42, 0.02, 0]} rotation={[0.40, 0, -0.06]}>
                    <boxGeometry args={[0.30, 0.038, 0.26]} />
                    <meshStandardMaterial color="#e2e8f0" metalness={0.82} roughness={0.25} emissive="#ff4400" emissiveIntensity={2} />
                  </mesh>
                  {/* Blade Tip Foil (Curved Outer Span) */}
                  <mesh position={[0.62, 0.04, -0.02]} rotation={[0.36, 0, -0.12]}>
                    <boxGeometry args={[0.22, 0.025, 0.18]} />
                    <meshStandardMaterial color="#e2e8f0" metalness={0.82} roughness={0.25} emissive="#ff4400" emissiveIntensity={2} />
                  </mesh>
                </group>
              );
            })}
          </group>
        )}

        {/* MODEL 3: INGOT BAJA TEMPA RAKSASA (HEAVY FORGING STEEL INGOT) */}
        {moldType === 'ingot' && (
          <group>
            {/* Main Tapered Rectangular Ingot Body */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.25, 0.34, 0.62]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.78} roughness={0.35} emissive="#ff4400" emissiveIntensity={2} />
            </mesh>

            {/* Top Hot-Top / Feeder Head (Beveled Sinkhead) */}
            <mesh position={[0, 0.19, 0]}>
              <boxGeometry args={[1.05, 0.06, 0.48]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.78} roughness={0.38} emissive="#ff4400" emissiveIntensity={2} />
            </mesh>

            {/* Side Cooling Flute Ridges */}
            {[-0.20, 0, 0.20].map((fz, fi) => (
              <mesh key={`flute-${fi}`} position={[0, 0.175, fz]}>
                <boxGeometry args={[1.15, 0.015, 0.06]} />
                <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} emissive="#ff4400" emissiveIntensity={2} />
              </mesh>
            ))}

            {/* Heavy Crane Lifting Trunnions (Lug Pins) */}
            {[-1, 1].map((side) => (
              <group key={`trunnion-${side}`} position={[side * 0.66, 0.02, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.06, 0.06, 0.16, 24]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} emissive="#ff4400" emissiveIntensity={2} />
                </mesh>
                <mesh position={[side * 0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.09, 0.09, 0.03, 24]} />
                  <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} emissive="#ff4400" emissiveIntensity={2} />
                </mesh>
              </group>
            ))}

            {/* Raised Foundry Identification Stamp */}
            <mesh position={[0, 0.175, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.52, 0.14]} />
              <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.6} />
            </mesh>
            <Text
              position={[0, 0.18, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.048}
              color="#f8fafc"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              HEAT-804 • 500KG
            </Text>
          </group>
        )}

        {/* MODEL 4: BODI KATUP INDUSTRI BERFLENS (HEAVY FLANGED INDUSTRIAL VALVE BODY) */}
        {moldType === 'valve' && (
          <group>
            {/* Main Horizontal Valve Pipe Barrel */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.16, 0.16, 0.82, 32]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.3} emissive="#ff4400" emissiveIntensity={2} />
            </mesh>
            {/* Center Cavity Bore */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.10, 0.10, 0.84, 24]} />
              <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.7} />
            </mesh>
            {/* Left & Right Pipe Flanges with Bolt Holes */}
            {[-0.41, 0.41].map((fx, fi) => (
              <group key={`valve-flange-${fi}`} position={[fx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh>
                  <cylinderGeometry args={[0.26, 0.26, 0.05, 32]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.88} roughness={0.25} emissive="#ff4400" emissiveIntensity={2} />
                </mesh>
                {/* 8 Bolt Holes on Flange Rim */}
                {[...Array(8)].map((_, bi) => {
                  const ang = (bi * 2 * Math.PI) / 8;
                  return (
                    <mesh key={`bolt-${bi}`} position={[Math.cos(ang) * 0.20, 0, Math.sin(ang) * 0.20]}>
                      <cylinderGeometry args={[0.016, 0.016, 0.052, 12]} />
                      <meshStandardMaterial color="#020617" />
                    </mesh>
                  );
                })}
              </group>
            ))}
            {/* Vertical Valve Bonnet Neck Tower */}
            <group position={[0, 0.18, 0]}>
              <mesh>
                <cylinderGeometry args={[0.15, 0.17, 0.24, 28]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.3} emissive="#ff4400" emissiveIntensity={2} />
              </mesh>
              {/* Top Bonnet Mounting Flange */}
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.04, 32]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.88} roughness={0.25} emissive="#ff4400" emissiveIntensity={2} />
              </mesh>
              {/* Stem Hole */}
              <mesh position={[0, 0.14, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
                <meshStandardMaterial color="#020617" />
              </mesh>
            </group>
          </group>
        )}
      </group>

      {/* Dedicated Inspection Highlight Light onto Cast Piece when Solid */}
      {isSolid && (
        <pointLight
          position={[0, 2.0, 0]}
          intensity={1.6}
          color="#f8fafc"
          distance={5.0}
          decay={2}
        />
      )}

      {/* 3. UPPER FLASK / CHILL MOLD BODY (COPE: y = 0.30..0.58m) */}
      <group ref={copeRef} position={[0, 0.44, 0]}>
        {moldType === 'gear' ? (
          /* A. GEAR: CIRCULAR CAST IRON COPE FLASK */
          <group>
            <mesh>
              <cylinderGeometry args={[0.76, 0.76, 0.28, 36]} />
              <meshStandardMaterial {...castIronMat} />
            </mesh>
            {/* Top Flange Lip Ring */}
            <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.77, 0.022, 12, 36]} />
              <meshStandardMaterial {...castIronMat} />
            </mesh>
            {/* 6 Radial Vertical Stiffening Ribs */}
            {[...Array(6)].map((_, ri) => {
              const angle = (ri * Math.PI) / 3;
              return (
                <mesh
                  key={`gear-cope-rib-${ri}`}
                  position={[Math.cos(angle) * 0.77, 0, Math.sin(angle) * 0.77]}
                  rotation={[0, -angle, 0]}
                >
                  <boxGeometry args={[0.04, 0.24, 0.05]} />
                  <meshStandardMaterial {...castIronMat} />
                </mesh>
              );
            })}
            {/* 4 Circumferential Clamping Wedges */}
            {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, ci) => (
              <mesh
                key={`gear-clamp-${ci}`}
                position={[Math.cos(angle) * 0.80, -0.10, Math.sin(angle) * 0.80]}
                rotation={[0, -angle, 0]}
              >
                <boxGeometry args={[0.05, 0.12, 0.04]} />
                <meshStandardMaterial {...steelClampMat} />
              </mesh>
            ))}
            {/* Side Lifting Rigging Trunnions */}
            {[-1, 1].map((side) => (
              <group key={`gear-trunnion-${side}`} position={[side * 0.82, 0, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.12, 16]} />
                  <meshStandardMaterial {...steelClampMat} />
                </mesh>
                <mesh position={[side * 0.07, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
                  <meshStandardMaterial {...castIronMat} />
                </mesh>
              </group>
            ))}
            {/* Circular Molding Sand Bed at Top Surface */}
            <mesh position={[0, 0.142, 0]}>
              <cylinderGeometry args={[0.72, 0.72, 0.015, 36]} />
              <meshStandardMaterial {...foundrySandMat} />
            </mesh>
          </group>
        ) : moldType === 'propeller' ? (
          /* B. PROPELLER: SQUARE FABRICATED FLASK COPE WITH X-BRACING */
          <group>
            <mesh>
              <boxGeometry args={[1.90, 0.28, 1.90]} />
              <meshStandardMaterial {...castIronMat} />
            </mesh>
            {/* 4 Corner Guide Pins that Interlock into Drag */}
            {[-0.92, 0.92].map((gx, gi) =>
              [-0.92, 0.92].map((gz, gj) => (
                <group key={`pin-cope-${gi}-${gj}`} position={[gx, 0, gz]}>
                  <mesh position={[0, -0.10, 0]}>
                    <cylinderGeometry args={[0.025, 0.025, 0.32, 16]} />
                    <meshStandardMaterial {...steelClampMat} />
                  </mesh>
                </group>
              ))
            )}
            {/* External Wall Diagonal X-Braces */}
            {[-0.96, 0.96].map((wx, wi) => (
              <React.Fragment key={`cope-x-${wi}`}>
                <mesh position={[wx, 0, 0]} rotation={[0, 0, -0.45]}>
                  <boxGeometry args={[0.03, 0.35, 0.03]} />
                  <meshStandardMaterial {...steelClampMat} />
                </mesh>
                <mesh position={[0, 0, wx]} rotation={[-0.45, 0, 0]}>
                  <boxGeometry args={[0.03, 0.35, 0.03]} />
                  <meshStandardMaterial {...steelClampMat} />
                </mesh>
              </React.Fragment>
            ))}
            {/* Four Heavy Clamps */}
            {[-0.8, 0.8].map((cx, ci) => (
              <React.Fragment key={`prop-clamp-${ci}`}>
                <mesh position={[cx, -0.10, 0.96]}>
                  <boxGeometry args={[0.06, 0.12, 0.04]} />
                  <meshStandardMaterial {...steelClampMat} />
                </mesh>
                <mesh position={[cx, -0.10, -0.96]}>
                  <boxGeometry args={[0.06, 0.12, 0.04]} />
                  <meshStandardMaterial {...steelClampMat} />
                </mesh>
              </React.Fragment>
            ))}
            {/* Side Lifting Trunnions */}
            {[-1, 1].map((side) => (
              <group key={`prop-trunnion-${side}`} position={[side * 0.98, 0, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.045, 0.045, 0.12, 20]} />
                  <meshStandardMaterial {...steelClampMat} />
                </mesh>
              </group>
            ))}
            {/* Square Sand Bed */}
            <mesh position={[0, 0.142, 0]}>
              <boxGeometry args={[1.78, 0.015, 1.78]} />
              <meshStandardMaterial {...foundrySandMat} />
            </mesh>
          </group>
        ) : moldType === 'ingot' ? (
          /* C. INGOT: MASSIVE TAPERED PERMANENT CHILL MOLD BODY (KOKIL INGOT BAJA BERAT) */
          <group>
            {/* Lower Chill Body Section */}
            <mesh position={[0, -0.06, 0]}>
              <boxGeometry args={[1.28, 0.18, 0.96]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.4} />
            </mesh>
            {/* Upper Chill Body Section (Tapers Inward slightly) */}
            <mesh position={[0, 0.08, 0]}>
              <boxGeometry args={[1.16, 0.18, 0.86]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
            </mesh>
            {/* Vertical Heavy Radiating Cooling Ribs along Walls */}
            {[-0.45, -0.15, 0.15, 0.45].map((rx, ri) => (
              <React.Fragment key={`ingot-rib-${ri}`}>
                <mesh position={[rx, 0, 0.50]}>
                  <boxGeometry args={[0.04, 0.32, 0.06]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.85} />
                </mesh>
                <mesh position={[rx, 0, -0.50]}>
                  <boxGeometry args={[0.04, 0.32, 0.06]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.85} />
                </mesh>
              </React.Fragment>
            ))}
            {/* Massive Cast Lifting Crane Lugs / Ears on Sides */}
            {[-1, 1].map((side) => (
              <group key={`ingot-lug-${side}`} position={[side * 0.65, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh>
                  <torusGeometry args={[0.07, 0.025, 16, 24]} />
                  <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0, -0.04]}>
                  <cylinderGeometry args={[0.045, 0.055, 0.08, 16]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.85} />
                </mesh>
              </group>
            ))}
            {/* Insulated Refractory Hot-Top Feeder Collar Box on Ingot Top */}
            <mesh position={[0, 0.18, 0]}>
              <boxGeometry args={[0.82, 0.08, 0.62]} />
              <meshStandardMaterial color="#c2410c" roughness={0.85} />
            </mesh>
            {/* Ingot Mold Sand / Refractory Top Bed */}
            <mesh position={[0, 0.142, 0]}>
              <boxGeometry args={[1.05, 0.015, 0.76]} />
              <meshStandardMaterial {...foundrySandMat} />
            </mesh>
          </group>
        ) : (
          /* D. VALVE: RECTANGULAR FABRICATED FLASK COPE */
          <group>
            <mesh>
              <boxGeometry args={[1.60, 0.28, 1.20]} />
              <meshStandardMaterial {...castIronMat} />
            </mesh>
            {/* Corner guide pins */}
            {[-0.75, 0.75].map((gx, gi) =>
              [-0.55, 0.55].map((gz, gj) => (
                <mesh key={`valve-pin-c-${gi}-${gj}`} position={[gx, -0.10, gz]}>
                  <cylinderGeometry args={[0.025, 0.025, 0.30, 16]} />
                  <meshStandardMaterial {...steelClampMat} />
                </mesh>
              ))
            )}
            {/* Clamps */}
            {[-0.6, 0.6].map((cx, ci) => (
              <mesh key={`v-clamp-${ci}`} position={[cx, -0.10, 0.61]}>
                <boxGeometry args={[0.06, 0.12, 0.04]} />
                <meshStandardMaterial {...steelClampMat} />
              </mesh>
            ))}
            {/* Side Lifting Trunnions */}
            {[-1, 1].map((side) => (
              <group key={`v-trunnion-${side}`} position={[side * 0.83, 0, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.10, 16]} />
                  <meshStandardMaterial {...steelClampMat} />
                </mesh>
              </group>
            ))}
            {/* Sand bed */}
            <mesh position={[0, 0.142, 0]}>
              <boxGeometry args={[1.48, 0.015, 1.08]} />
              <meshStandardMaterial {...foundrySandMat} />
            </mesh>
          </group>
        )}

        {/* 5. AUTHENTIC HOLLOW REFRACTORY CERAMIC POURING BASIN & RISER (Corong Tuang & Penambah yang Benar-Benar Berlubang) */}
        {/* A. CAWAN TUANG KERAMIK BERLUBANG DENGAN KEDALAMAN ASLI (Hollow Ceramic Pouring Basin) */}
        <group position={[0, 0.145, 0.0]}>
          {/* Outer Tapered Ceramic Cup Shell (openEnded: true - Tidak ada tutup datar!) */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.22, 0.16, 0.12, 32, 1, true]} />
            <meshStandardMaterial color="#c2410c" roughness={0.85} side={THREE.DoubleSide} />
          </mesh>

          {/* Smooth Rounded Ceramic Lip Rim Connecting Outer & Inner Shells */}
          <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.20, 0.018, 16, 32]} />
            <meshStandardMaterial color="#ea580c" roughness={0.80} />
          </mesh>

          {/* Inner Funnel Wall Cavity (openEnded: true - Tapering downward into downsprue throat) */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.18, 0.09, 0.12, 32, 1, true]} />
            <meshStandardMaterial color="#431407" roughness={0.92} side={THREE.DoubleSide} />
          </mesh>

          {/* Bottom Basin Step Rim */}
          <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.09, 0.16, 32]} />
            <meshStandardMaterial color="#2d0f05" roughness={0.95} side={THREE.DoubleSide} />
          </mesh>

          {/* Deep Down-Sprue Throat Bore (Saluran Turun Vertikal Menembus Pasir ke Bawah) */}
          <mesh position={[0, -0.11, 0]}>
            <cylinderGeometry args={[0.09, 0.08, 0.22, 24, 1, true]} />
            <meshStandardMaterial color="#050811" roughness={0.98} side={THREE.DoubleSide} />
          </mesh>

          {/* Deep Throat Bottom Shadow Void (Dasar Gelap di Kedalaman) */}
          <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.08, 24]} />
            <meshStandardMaterial color="#020408" roughness={1.0} />
          </mesh>

          {/* Dynamic Molten Pool - Naik dari kedalaman tenggorokan ke bibir corong */}
          <mesh
            ref={moltenPoolRef}
            position={[0, -0.12, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
          >
            <circleGeometry args={[0.175, 32]} />
            <meshStandardMaterial
              color="#ff6b00"
              emissive="#ff4400"
              emissiveIntensity={2.8}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* B. CAWAN PENAMBAH RISER EKSOTERMIK BERLUBANG (Hollow Insulating Feeder Riser Sleeve) */}
        <group position={[0.42, 0.145, 0.32]}>
          {/* Outer Refractory Sleeve Body (openEnded: true) */}
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.13, 0.12, 0.14, 28, 1, true]} />
            <meshStandardMaterial color="#d97706" roughness={0.85} side={THREE.DoubleSide} />
          </mesh>

          {/* Rounded Lip Rim */}
          <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.118, 0.014, 16, 28]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.80} />
          </mesh>

          {/* Inner Hollow Vent Cavity Wall (openEnded: true) */}
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.105, 0.09, 0.14, 28, 1, true]} />
            <meshStandardMaterial color="#78350f" roughness={0.92} side={THREE.DoubleSide} />
          </mesh>

          {/* Deep Riser Vent Bore into Casting Cavity */}
          <mesh position={[0, -0.10, 0]}>
            <cylinderGeometry args={[0.09, 0.085, 0.20, 24, 1, true]} />
            <meshStandardMaterial color="#050811" roughness={0.98} side={THREE.DoubleSide} />
          </mesh>

          {/* Bottom Dark Void */}
          <mesh position={[0, -0.20, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.085, 24]} />
            <meshStandardMaterial color="#020408" roughness={1.0} />
          </mesh>

          {/* Dynamic Molten Riser Pool */}
          <mesh
            ref={riserPoolRef}
            position={[0, -0.10, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
          >
            <circleGeometry args={[0.10, 24]} />
            <meshStandardMaterial
              color="#ff6b00"
              emissive="#ff4400"
              emissiveIntensity={2.4}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* C. DEGASSING VENT WIRE PRICK HOLES IN FOUNDRY SAND (Lubang Jarum Pelepasan Gas Pasir Cetak) */}
        {[
          [-0.30, 0.25],
          [-0.25, -0.25],
          [0.25, -0.30],
          [-0.45, -0.10],
          [0.35, 0.15],
        ].map(([vx, vz], vi) => (
          <mesh key={`vent-hole-${vi}`} position={[vx, 0.143, vz]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.012, 12]} />
            <meshStandardMaterial color="#050811" roughness={1.0} />
          </mesh>
        ))}
      </group>

      {/* Dynamic Incandescent PointLight inside Casting Cavity */}
      <pointLight
        ref={moldLightRef}
        position={[0, 0.70, 0]}
        color="#ff6b00"
        distance={2.5}
        decay={2}
        intensity={0}
      />

      {/* Dynamic Thermal Steam & Smoke Column */}
      <mesh
        ref={steamRef}
        position={[0, 1.15, 0]}
        visible={false}
      >
        <cylinderGeometry args={[0.26, 0.08, 0.9, 16, 1, true]} />
        <meshBasicMaterial
          color="#cbd5e1"
          transparent
          opacity={0.18}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 6. INTERACTIVE 3D STATUS SIGNBOARD (Diposisikan di BELAKANG cetakan pada +X, terangkat di Y=1.45m agar cetakan tampak utuh) */}
      <group position={[1.25, 1.45, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Support Steel Stanchion Posts Rising from Floor to Board */}
        {[-0.55, 0.55].map((sx, si) => (
          <group key={`stanchion-${si}`} position={[sx, -0.72, 0]}>
            {/* Vertical Support Pipe down to Floor */}
            <mesh>
              <cylinderGeometry args={[0.022, 0.022, 1.45, 16]} />
              <meshStandardMaterial {...steelClampMat} />
            </mesh>
            {/* Floor Base Anchor Flange */}
            <mesh position={[0, -0.71, 0]}>
              <cylinderGeometry args={[0.065, 0.065, 0.02, 16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Horizontal Stiffener Crossbar */}
        <mesh position={[0, -0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.016, 0.016, 1.15, 12]} />
          <meshStandardMaterial {...steelClampMat} />
        </mesh>

        {/* Main Signboard Enclosure Housing (Double-sided finished casing) */}
        <group
          onClick={(e) => {
            e.stopPropagation();
            setMoldState(moldType, { fillLevel: 0, isCooling: false, isSolid: false });
          }}
          onPointerOver={() => {
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          {/* Main Enclosure Box */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.56, 0.38, 0.04]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
          </mesh>

          {/* Yellow Caution Bevel Border Frame */}
          <mesh position={[0, 0, 0.021]}>
            <planeGeometry args={[1.52, 0.34]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>

          {/* Dark Industrial Faceplate */}
          <mesh position={[0, 0, 0.023]}>
            <planeGeometry args={[1.48, 0.30]} />
            <meshStandardMaterial color="#090d16" roughness={0.5} />
          </mesh>

          {/* Mold Title Header */}
          <Text
            position={[0, 0.082, 0.028]}
            fontSize={0.058}
            color="#facc15"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {castTitle}
          </Text>

          {/* Live Fill Telemetry Status */}
          <Text
            position={[0, 0.012, 0.028]}
            fontSize={0.046}
            color={fillLevel > 0.01 ? '#fb923c' : '#94a3b8'}
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {`TERISI: ${(fillLevel * 100).toFixed(1)}% ${
              isSolid ? '(SELESAI - SOLID)' : isCooling ? '(PENDINGINAN...)' : fillLevel >= 0.99 ? '(CETAKAN PENUH)' : isLadlePouringToMold ? '(MENUANGKAN...)' : ''
            }`}
          </Text>

          {/* Interactive Reset Instruction */}
          <Text
            position={[0, -0.065, 0.028]}
            fontSize={0.034}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
          >
            [KLIK PAPAN INI UNTUK RESET CETAKAN]
          </Text>

          {/* Rear Backing Plate with Stamped Industrial Identification (Facing Right Wall) */}
          <mesh position={[0, 0, -0.021]}>
            <planeGeometry args={[1.50, 0.32]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
          </mesh>
          <Text
            position={[0, 0, -0.023]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.036}
            color="#64748b"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            FOUNDRY MOLD STATION • 500 KG CAPACITY
          </Text>
        </group>
      </group>
    </group>
  );
};

/**
 * Staged Ingot Chill Molds & Foundry Stool Bed (Auxiliary Mold Staging Area)
 * Adds authentic depth to the casting bay with staged heavy chills ready for the next melt cycle.
 */
export const AuxiliaryIngotStation: React.FC<{ position?: [number, number, number]; rotation?: [number, number, number] }> = ({
  position = [-8.2, 0, 6.0],
  rotation = [0, 0, 0],
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Heavy Steel Transfer Rail Track / Plinth */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[1.5, 0.10, 3.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      {/* Rails on Plinth */}
      {[-0.50, 0.50].map((rx, ri) => (
        <mesh key={`aux-rail-${ri}`} position={[rx, 0.12, 0]}>
          <boxGeometry args={[0.07, 0.05, 3.1]} />
          <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.3} />
        </mesh>
      ))}

      {/* Row of 2 Staged Chill Molds */}
      {[-0.8, 0.8].map((mz, mi) => (
        <group key={`chill-mold-${mi}`} position={[0, 0.15, mz]}>
          {/* Base Ingot Stool Plate */}
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[1.15, 0.16, 0.95]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.5} />
          </mesh>
          {/* Tapered Ingot Chill Body */}
          <mesh position={[0, 0.40, 0]}>
            <boxGeometry args={[0.92, 0.50, 0.72]} />
            <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.4} />
          </mesh>
          {/* Vertical Heat Dissipation Ribs */}
          {[-0.28, 0, 0.28].map((fx, fi) => (
            <mesh key={`f-${fi}`} position={[fx, 0.40, 0.38]}>
              <boxGeometry args={[0.03, 0.44, 0.04]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          ))}
          {/* Crane Ingot Tongs Lifting Lugs */}
          {[-0.48, 0.48].map((lx, li) => (
            <mesh key={`l-${li}`} position={[lx, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.10, 16]} />
              <meshStandardMaterial color="#64748b" metalness={0.85} />
            </mesh>
          ))}
          {/* Top Refractory Hot-Top Ring */}
          <mesh position={[0, 0.68, 0]}>
            <boxGeometry args={[0.62, 0.08, 0.48]} />
            <meshStandardMaterial color="#ea580c" roughness={0.85} />
          </mesh>
          {/* Cavity Ingot Metal Top */}
          <mesh position={[0, 0.65, 0]}>
            <boxGeometry args={[0.52, 0.02, 0.38]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
          {/* Ingot Mold Serial Number Stencil */}
          <Text
            position={[0, 0.40, 0.38]}
            fontSize={0.042}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {`CHILL #${mi + 5}`}
          </Text>
        </group>
      ))}

      {/* Auxiliary Station Master Information Signboard (Positioned BEHIND at +X, elevated to Y=1.35m) */}
      <group position={[1.15, 1.35, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Floor Stanchion Posts */}
        {[-0.60, 0.60].map((sx, si) => (
          <group key={`aux-post-${si}`} position={[sx, -0.67, 0]}>
            <mesh>
              <cylinderGeometry args={[0.02, 0.02, 1.35, 14]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.66, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
          </group>
        ))}
        {/* Board Enclosure */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.56, 0.36, 0.04]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.021]}>
          <planeGeometry args={[1.52, 0.32]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        <mesh position={[0, 0, 0.023]}>
          <planeGeometry args={[1.48, 0.28]} />
          <meshStandardMaterial color="#090d16" roughness={0.5} />
        </mesh>
        <Text
          position={[0, 0.065, 0.028]}
          fontSize={0.052}
          color="#facc15"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          STASIUN KOKIL INGOT CADANGAN
        </Text>
        <Text
          position={[0, -0.015, 0.028]}
          fontSize={0.038}
          color="#f8fafc"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          2 UNIT KOKIL PERMANEN BAJA • SIAP OPERASI
        </Text>
        <Text
          position={[0, -0.08, 0.028]}
          fontSize={0.028}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
        >
          TOTAL KAPASITAS STANDBY: 1000 KG (2 x 500 KG)
        </Text>
      </group>
    </group>
  );
};

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '../../store/useSimStore';
import { getCoilGlow } from '../../sim/blackbody';

interface CoilProps {
  position?: [number, number, number];
}

export const COPPER_COLOR = '#c25e1a';

export const COPPER_MATERIAL_PROPS = {
  color: COPPER_COLOR,
  metalness: 0.90,
  roughness: 0.22,
};

/**
 * Procedural Helical Tapered Copper Induction Coil (Lilitan Tembaga Tungku Induksi).
 * - 12 heavy copper hollow turns winding around the refractory crucible.
 * - Ujung bawah (t = 0) berada di belakang sisi kiri (x = +0.045) dan terhubung langsung
 *   ke konduktor tembaga kiri di terminal belakang.
 * - Ujung atas (t = 1) berada di belakang sisi kanan (x = -0.045) dan terhubung via pipa tembaga vertikal
 *   bersih tanpa cincin penahan, turun lurus ke konduktor tembaga kanan di terminal belakang.
 * - Warna tembaga 100% konsisten antara koil dan sambungan terminal bawah.
 */
class InductionCoilHelixCurve extends THREE.Curve<THREE.Vector3> {
  private rBottom: number;
  private rTop: number;
  private yBottom: number;
  private yTop: number;
  private thetaStart: number;
  private thetaEnd: number;

  constructor(
    rBottom = 0.27,
    rTop = 0.37,
    yBottom = -0.40,
    yTop = 0.40,
    turns = 12
  ) {
    super();
    this.rBottom = rBottom;
    this.rTop = rTop;
    this.yBottom = yBottom;
    this.yTop = yTop;

    // Start at bottom rear-left (x = +0.075, z < 0)
    this.thetaStart = Math.asin(0.075 / rBottom);

    // End at top rear-right (x = -0.075, z < 0)
    this.thetaEnd = turns * Math.PI * 2 - Math.asin(0.075 / rTop);
  }

  getPoint(t: number): THREE.Vector3 {
    const angle = this.thetaStart + t * (this.thetaEnd - this.thetaStart);
    const r = THREE.MathUtils.lerp(this.rBottom, this.rTop, t);
    const x = Math.sin(angle) * r;
    const z = -Math.cos(angle) * r;
    const y = THREE.MathUtils.lerp(this.yBottom, this.yTop, t);
    return new THREE.Vector3(x, y, z);
  }
}

export const Coil: React.FC<CoilProps> = ({ position = [0, 0, 0] }) => {
  const isLite = useSimStore((s) => s.performanceProfile === 'lite');
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // 1. 12-Turn Helical Induction Winding around crucible
  const helixCurve = useMemo(
    () => new InductionCoilHelixCurve(0.27, 0.37, -0.40, 0.40, 12),
    []
  );

  // 2. Bottom lead connecting bottom end of coil (x = +0.069) exiting window onto Left Copper Busbar Plate
  // Sesuai instruksi: Posisi digeser presisi ke x = +0.069, y = -0.285m agar menyatu tepat di tengah plat tembaga
  const bottomLeadCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.069, -0.40, -0.261),
      new THREE.Vector3(0.069, -0.34, -0.38),
      new THREE.Vector3(0.069, -0.285, -0.48),
      new THREE.Vector3(0.069, -0.285, -0.60),
      new THREE.Vector3(0.069, -0.285, -0.75),
    ], false, 'catmullrom', 0.15);
  }, []);

  // 3. Top lead connecting top end of coil (x = -0.069) down rear wall, exiting window onto Right Copper Busbar Plate
  // Sesuai instruksi: Berada di x = -0.069, y = -0.285m, bebas tabrakan dari kotak besi & frame lubang tungku
  const topLeadCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-0.069, 0.40, -0.363),
        new THREE.Vector3(-0.069, 0.38, -0.41),
        new THREE.Vector3(-0.069, 0.10, -0.41),
        new THREE.Vector3(-0.069, -0.15, -0.41),
        new THREE.Vector3(-0.069, -0.24, -0.43),
        new THREE.Vector3(-0.069, -0.285, -0.50),
        new THREE.Vector3(-0.069, -0.285, -0.62),
        new THREE.Vector3(-0.069, -0.285, -0.75),
      ],
      false,
      'catmullrom',
      0.15
    );
  }, []);

  useFrame(() => {
    if (!materialRef.current) return;
    const power = useSimStore.getState().sim.powerFraction;
    const glow = getCoilGlow(power);

    // Dynamic electromagnetic thermal glow when energized
    materialRef.current.emissive.setRGB(glow.r, glow.g, glow.b);
    materialRef.current.emissiveIntensity = glow.emissiveIntensity * 0.75;
  });

  const tubeSegs = isLite ? 72 : 240;
  const radSegs = isLite ? 6 : 16;

  return (
    <group name="VFX_Coil" position={position}>
      {/* 12-Turn Heavy Induction Copper Coil */}
      <mesh>
        <tubeGeometry args={[helixCurve, tubeSegs, 0.016, radSegs, false]} />
        <meshStandardMaterial
          ref={materialRef}
          {...COPPER_MATERIAL_PROPS}
          emissive="#ea580c"
          emissiveIntensity={0.0}
        />
      </mesh>

      {/* Sambungan Ujung Bawah Koil ke Terminal Tembaga Kiri (x = +0.075) */}
      <mesh>
        <tubeGeometry args={[bottomLeadCurve, isLite ? 16 : 48, 0.016, radSegs, false]} />
        <meshStandardMaterial
          {...COPPER_MATERIAL_PROPS}
          emissive="#ea580c"
          emissiveIntensity={0.0}
        />
      </mesh>

      {/* Sambungan Ujung Atas Koil ke Terminal Tembaga Kanan via Pipa Vertikal Bersih Mulus (x = -0.075) */}
      <mesh>
        <tubeGeometry args={[topLeadCurve, isLite ? 24 : 80, 0.016, radSegs, false]} />
        <meshStandardMaterial
          {...COPPER_MATERIAL_PROPS}
          emissive="#ea580c"
          emissiveIntensity={0.0}
        />
      </mesh>

      {/* Sesuai Gambar 1 Asli: Batang Pemandu & Blok Klem Isolator Kuning Penyangga Lilitan Koil */}
      {!isLite && [-0.14, 0.14].map((bx, bi) => (
        <group key={`coil-tie-rod-${bi}`} position={[bx, 0, 0.35]}>
          {/* Batang penarik baja vertikal */}
          <mesh>
            <cylinderGeometry args={[0.007, 0.007, 0.72, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Blok klem isolator G10 kuning penahan lilitan koil (Sesuai Gambar 1) */}
          {[-0.24, -0.08, 0.08, 0.24].map((cy, ci) => (
            <mesh key={`g10-clamp-${ci}`} position={[0, cy, 0]}>
              <boxGeometry args={[0.026, 0.034, 0.038]} />
              <meshStandardMaterial color="#ca8a04" roughness={0.45} metalness={0.12} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

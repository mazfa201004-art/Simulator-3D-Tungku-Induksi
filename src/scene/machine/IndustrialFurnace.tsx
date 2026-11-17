import React, { useRef, useMemo, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '../../store/useSimStore';
import { Crucible } from './Crucible';
import { Coil } from './Coil';
import { MetalSolid } from '../metal/MetalSolid';
import { MetalLiquid } from '../metal/MetalLiquid';
import { SlagCoagulantVisualSequence } from './SlagCoagulantVisualSequence';
import { getBlackbodyColor } from '../../sim/blackbody';

const NOOP_RAYCAST = () => null;

interface IndustrialFurnaceProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}



/**
 * Conformal Cylindrical Port Infill Shell Geometry.
 * Melengkung presisi 100% mengikuti silinder cangkang tungku (radius 0.525m) dengan 32 titik subdivisi padat
 * di sisi atas dan bawah, sehingga chord error lengkungan < 0.04 mm (sub-millimeter perfection).
 * Menghilangkan 100% tonjolan sudut/sliver runcing di bawah bibir cincin dan celah sambungan.
 */
const createCurvedPortShellGeometry = () => {
  const radius = 0.525;
  const halfAngle = 0.204; // 0.204 rad memberikan overlap mikro ke dinding samping agar bebas celah
  const W = radius * halfAngle; // 0.1071m
  const yMax = 0.272; // Overlap 2mm ke dinding silinder atas & bawah agar bebas retak rasterisasi
  const rHole = 0.088; // Jari-jari lubang lonjong (stadium)
  const yH = 0.16; // Setengah tinggi bagian lurus lonjong
  const segs = 32;

  const shape = new THREE.Shape();
  // Sisi bawah melengkung: 32 titik subdivisi padat mengikuti lengkungan silinder murni
  shape.moveTo(-W, -yMax);
  for (let i = 1; i <= segs; i++) {
    const u = -W + (i / segs) * (2 * W);
    shape.lineTo(u, -yMax);
  }
  // Sisi kanan lurus vertikal pada phi konstan
  shape.lineTo(W, yMax);
  // Sisi atas melengkung: 32 titik subdivisi padat mengikuti lengkungan silinder murni
  for (let i = 1; i <= segs; i++) {
    const u = W - (i / segs) * (2 * W);
    shape.lineTo(u, yMax);
  }
  // Sisi kiri lurus vertikal pada phi konstan
  shape.lineTo(-W, -yMax);
  shape.closePath();

  // Lubang dalam konsentris berbentuk lonjong (stadium)
  const hole = new THREE.Path();
  hole.moveTo(rHole, -yH);
  hole.lineTo(rHole, yH);
  for (let i = 1; i <= segs; i++) {
    const ang = (i / segs) * Math.PI;
    hole.lineTo(rHole * Math.cos(ang), yH + rHole * Math.sin(ang));
  }
  hole.lineTo(-rHole, -yH);
  for (let i = 1; i <= segs; i++) {
    const ang = Math.PI + (i / segs) * Math.PI;
    hole.lineTo(rHole * Math.cos(ang), -yH + rHole * Math.sin(ang));
  }
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ShapeGeometry(shape, 32);
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;

  // Warp setiap vertex agar berbaris 100% presisi di permukaan silinder cangkang radius 0.525m
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i);
    const v = pos.getY(i);
    const phi = u / radius;
    // Titik singgung (u=0) ada di z=0; sumbu silinder ada di z = -radius
    pos.setXYZ(i, radius * Math.sin(phi), v, radius * Math.cos(phi) - radius);
    norm.setXYZ(i, Math.sin(phi), 0, Math.cos(phi));
  }
  pos.needsUpdate = true;
  norm.needsUpdate = true;
  return geo;
};

const CURVED_PORT_SHELL_GEOMETRY = createCurvedPortShellGeometry();

/**
 * 3D Seamless Oval Inspection Port (Cincin Lonjong Tunggal Sesuai Gambar 1 & Gambar 2).
 * Menyatu 100% melengkung mulus dengan silinder cangkang tanpa ada pelat datar, tanpa sliver, dan tanpa celah!
 */
interface OvalInspectionPortProps {
  position: [number, number, number];
  rotation: [number, number, number];
}

const OvalInspectionPort: React.FC<OvalInspectionPortProps> = ({ position, rotation }) => {
  const isLite = useSimStore((s) => s.performanceProfile === 'lite');
  return (
    <group position={position} rotation={rotation}>
      {/* 1. Curved Conformal Cylinder Shell Wall (Menyatu mulus melengkung mengikuti silinder cangkang tungku) */}
      <mesh geometry={CURVED_PORT_SHELL_GEOMETRY}>
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.38}
          roughness={0.36}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Raised Tubular Cast Oval Bezel Rim (High-detail only for ultra profile) */}
      {!isLite && (
        <>
          {/* Sisi Kiri Vertikal */}
          <mesh position={[-0.09, 0, 0.003]}>
            <cylinderGeometry args={[0.014, 0.014, 0.32, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.48} roughness={0.30} />
          </mesh>
          {/* Sisi Kanan Vertikal */}
          <mesh position={[0.09, 0, 0.003]}>
            <cylinderGeometry args={[0.014, 0.014, 0.32, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.48} roughness={0.30} />
          </mesh>
          {/* Busur Setengah-Torus Atas */}
          <mesh position={[0, 0.16, 0.003]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.09, 0.014, 12, 20, Math.PI]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.48} roughness={0.30} />
          </mesh>
          {/* Busur Setengah-Torus Bawah */}
          <mesh position={[0, -0.16, 0.003]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.09, 0.014, 12, 20, Math.PI]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.48} roughness={0.30} />
          </mesh>
        </>
      )}
    </group>
  );
};

/**
 * Trunnion Mounting Hub Flange with Stiffeners (Sesuai Gambar 2 & 3 Asli Pabrik).
 */
interface TrunnionMountFlangeProps {
  position: [number, number, number];
  rotation: [number, number, number];
}

const TrunnionMountFlange: React.FC<TrunnionMountFlangeProps> = ({ position, rotation }) => {
  const isLite = useSimStore((s) => s.performanceProfile === 'lite');
  const castSteelMat = { color: '#cbd5e1', metalness: 0.42, roughness: 0.36 };
  const darkSteelMat = { color: '#64748b', metalness: 0.85, roughness: 0.30 };
  const boltMat = { color: '#e2e8f0', metalness: 0.95, roughness: 0.18 };
  const chromeMat = { color: '#f1f5f9', metalness: 0.96, roughness: 0.15 };

  return (
    <group position={position} rotation={rotation}>
      {/* 1. Heavy Conformal Cast Mounting Base Boss Pad (Menempel kokoh & menembus dinding silinder) */}
      <mesh position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.155, 0.155, 0.09, 32]} />
        <meshStandardMaterial {...castSteelMat} />
      </mesh>

      {/* 2. Heavy Cast Flanged Hub Collar */}
      <mesh position={[0.030, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.135, 0.135, 0.030, 32]} />
        <meshStandardMaterial {...darkSteelMat} />
      </mesh>

      {/* Center Shaft Pilot Collar */}
      <mesh position={[0.050, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.082, 0.082, 0.020, 32]} />
        <meshStandardMaterial {...chromeMat} />
      </mesh>

      {/* Center Shaft Pilot Bore Hole */}
      <mesh position={[0.061, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.045, 0.045, 0.005, 24]} />
        <meshBasicMaterial color="#020617" />
      </mesh>

      {/* 8 Heavy Perimeter Clamping Stud Bolts with Hex Nuts */}
      {!isLite && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const ang = (i / 8) * Math.PI * 2;
        return (
          <group
            key={`hub-bolt-${i}`}
            position={[0.046, Math.cos(ang) * 0.11, Math.sin(ang) * 0.11]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <mesh>
              <cylinderGeometry args={[0.007, 0.007, 0.014, 6]} />
              <meshStandardMaterial {...boltMat} />
            </mesh>
            <mesh position={[0, -0.005, 0]}>
              <cylinderGeometry args={[0.010, 0.010, 0.003, 16]} />
              <meshStandardMaterial {...boltMat} />
            </mesh>
          </group>
        );
      })}

      {/* 3. Circular Cast Steel Flanged Reinforcement Collar (Rapi, Mulus & Bebas Tabrakan Sesuai Gambar 3 & 4) */}
      {/* Menggantikan sirip-sirip kotak radial kasar yang sebelumnya menonjol kaku dan bertabrakan dengan lubang oval */}
      <mesh position={[-0.005, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.170, 0.170, 0.030, 36]} />
        <meshStandardMaterial {...castSteelMat} />
      </mesh>
      <mesh position={[0.012, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.150, 0.165, 0.020, 36]} />
        <meshStandardMaterial {...castSteelMat} />
      </mesh>
    </group>
  );
};

/**
 * Authentic Cast Housing & Magnetic Yoke Assembly (Sesuai Gambar 2 Tungku Asli).
 * - Housing cor logam abu-abu industrial (cast steel/aluminum) menyatu dengan cangkang silinder tungku.
 * - Sirip-sirip penguat vertikal (cast vertical ribs) pada bagian muka, bukan balok hitam.
 * - Flens atas dan bawah horizontal dari logam cor tebal.
 * - Telinga flens samping dengan baut tanam dan mur heksagonal stainless/galvanis.
 */
/**
 * Authentic Cast Ribbed Housing Block (Sesuai Gambar 4 & Gambar 5 Tungku Asli).
 * - Warna 100% sama dengan cangkang mesin tungku (#cbd5e1) dan menyatu dengan bodi.
 * - Lebar (width = 0.28m) lebih ramping dari lebar lubang jendela (width = 0.34m).
 * - Memiliki alur/sirip cor vertikal pada muka (vertical flutes).
 * - Bagian depan: posisi lebih rendah (height 0.15m, yPos 0.31m) karena berada di bawah corong tuang.
 * - Bagian belakang: posisi lebih tinggi (height 0.29m, yPos 0.38m) menjulang hingga ke flens dek atas.
 */
interface FurnaceMagneticYokeBlockProps {
  yPos: number;
  height?: number;
  width?: number;
}

/**
 * Authentic Magnetic Yoke Lamination Pack (Kukus Magnetik Baja Silikon Bertumpuk).
 * Sesuai permintaan user:
 * 1. Ukuran kotak atas dan kotak bawah sama (height = 0.18m).
 * 2. Lebar diperkecil (width = 0.23m).
 * 3. Garis-garis adalah lempengan-lempengan besi yang ditumpuk, sehingga warnanya sama (#cbd5e1)
 *    dengan warna bodi mesin tungku. Garis tampak karena adanya celah sempit (shadow slit) antar lempengan.
 */
const FurnaceMagneticYokeBlock: React.FC<FurnaceMagneticYokeBlockProps> = ({
  yPos,
  height = 0.18,
  width = 0.23,
}) => {
  const isLite = useSimStore((s) => s.performanceProfile === 'lite');
  const steelPlateMat = { color: '#cbd5e1', metalness: 0.42, roughness: 0.36 };
  const shadowSlitMat = { color: '#0f172a', roughness: 0.85, metalness: 0.15 };
  const clampFlangeMat = { color: '#cbd5e1', metalness: 0.44, roughness: 0.34 };
  const boltMat = { color: '#e2e8f0', metalness: 0.95, roughness: 0.18 };

  // Optimized lightweight solid block for Lite / Mobile mode
  if (isLite) {
    return (
      <group position={[0, yPos, 0.032]}>
        <mesh position={[0, 0, 0.005]}>
          <boxGeometry args={[width, height * 0.96, 0.065]} />
          <meshStandardMaterial {...steelPlateMat} />
        </mesh>
      </group>
    );
  }

  const numPlates = 7;
  const plateWidth = 0.026;
  const slitWidth = 0.0025;
  const totalPackWidth = numPlates * plateWidth + (numPlates - 1) * slitWidth;
  const startX = -totalPackWidth / 2 + plateWidth / 2;

  return (
    <group position={[0, yPos, 0.032]}>
      {/* Backing Cavity Shadow Plate (Latar gelap celah rongga antar lempengan) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, height * 0.96, 0.058]} />
        <meshStandardMaterial {...shadowSlitMat} />
      </mesh>

      {/* Lempengan-lempengan Besi Bertumpuk (Stacked Steel Laminations Pack) */}
      {Array.from({ length: numPlates }).map((_, pi) => {
        const px = startX + pi * (plateWidth + slitWidth);
        return (
          <mesh key={`lam-plate-${pi}`} position={[px, 0, 0.006]}>
            <boxGeometry args={[plateWidth, height * 0.94, 0.060]} />
            <meshStandardMaterial {...steelPlateMat} />
          </mesh>
        );
      })}

      {/* Top & Bottom Heavy Integrated Cast Clamping Ledge Flanges */}
      <mesh position={[0, height / 2, 0.005]}>
        <boxGeometry args={[width + 0.014, 0.016, 0.075]} />
        <meshStandardMaterial {...clampFlangeMat} />
      </mesh>
      <mesh position={[0, -height / 2, 0.005]}>
        <boxGeometry args={[width + 0.014, 0.016, 0.075]} />
        <meshStandardMaterial {...clampFlangeMat} />
      </mesh>

      {/* Two Front Clamping Stud Bolts with Hex Heads */}
      {[-0.07, 0.07].map((bx, bi) => (
        <group key={`f-bolt-${bi}`} position={[bx, 0, 0.038]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.007, 0.007, 0.016, 6]} />
            <meshStandardMaterial {...boltMat} />
          </mesh>
        </group>
      ))}

      {/* Authentic Side Clamping Gusset Wings & Stud Bolts (Menjepit pack ke cangkang silinder) */}
      {[-1, 1].map((dir, sidx) => {
        const wingX = dir * (width / 2 + 0.032);
        return (
          <group key={`side-gussets-${sidx}`}>
            {[-height * 0.28, height * 0.28].map((gy, gidx) => (
              <group key={`gusset-${gidx}`} position={[wingX, gy, -0.005]}>
                <mesh position={[-dir * 0.014, 0, 0]}>
                  <boxGeometry args={[0.036, 0.020, 0.042]} />
                  <meshStandardMaterial {...clampFlangeMat} />
                </mesh>
                <mesh position={[0, 0, 0.016]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.006, 0.006, 0.026, 6]} />
                  <meshStandardMaterial {...boltMat} />
                </mesh>
                <mesh position={[dir * 0.011, 0, 0.016]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.009, 0.009, 0.006, 6]} />
                  <meshStandardMaterial {...boltMat} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
};

/**
 * Generates a clean, watertight structured quad-strip 3D mesh for the curved window frame.
 * Eliminates all Earcut triangulation artifacts, diagonal folds, and V-creases ("bengkok-bengkok").
 * - Sisi atas dan bawah 100% lurus, rata, dan mulus secara horizontal.
 * - Ditekuk presisi mengikuti busur kelengkungan silinder tungku (R = 0.525m).
 * - Menempel rapat (zero gap) ke bodi silinder tungku.
 */
function createStructuredCurvedFrameGeometry(
  outerWidth: number,
  outerHeight: number,
  cutoutWidth: number,
  cutoutTop: number,
  cutoutBottom: number,
  innerRadius = 0.032,
  outerRadius = 0.040,
  depth = 0.024,
  curveRadius = 0.525,
  embedDepth = 0.004
) {
  const halfOuterW = outerWidth / 2;
  const halfOuterH = outerHeight / 2;
  const halfInnerW = cutoutWidth / 2;

  const rIn = Math.min(innerRadius, halfInnerW * 0.45, (cutoutTop - cutoutBottom) * 0.25);
  const rOut = Math.min(outerRadius, halfOuterW * 0.45, halfOuterH * 0.25);

  const xInMin = -halfInnerW + rIn;
  const xInMax = halfInnerW - rIn;
  const xOutMin = -halfOuterW + rOut;
  const xOutMax = halfOuterW - rOut;

  const yInMin = cutoutBottom + rIn;
  const yInMax = cutoutTop - rIn;
  const yOutMin = -halfOuterH + rOut;
  const yOutMax = halfOuterH - rOut;

  const pairs: Array<{ inX: number; inY: number; outX: number; outY: number }> = [];

  const N_HORIZ = 14; // Subdivisi sisi horizontal agar kurva busur silinder mulus sempurna
  const N_VERT = 16;  // Subdivisi sisi vertikal
  const N_CORNER = 6; // Subdivisi sudut melengkung

  // 1. Sisi Bawah: Garis horizontal presisi dari kiri (-X) ke kanan (+X)
  for (let i = 0; i <= N_HORIZ; i++) {
    const t = i / N_HORIZ;
    pairs.push({
      inX: xInMin + t * (xInMax - xInMin),
      inY: cutoutBottom,
      outX: xOutMin + t * (xOutMax - xOutMin),
      outY: -halfOuterH,
    });
  }

  // 2. Sudut Kanan-Bawah: Busur radial dari -PI/2 ke 0
  for (let j = 1; j <= N_CORNER; j++) {
    const theta = -Math.PI / 2 + (j / N_CORNER) * (Math.PI / 2);
    pairs.push({
      inX: xInMax + rIn * Math.cos(theta),
      inY: yInMin + rIn * Math.sin(theta),
      outX: xOutMax + rOut * Math.cos(theta),
      outY: yOutMin + rOut * Math.sin(theta),
    });
  }

  // 3. Sisi Kanan: Garis vertikal presisi dari bawah (-Y) ke atas (+Y)
  for (let i = 1; i <= N_VERT; i++) {
    const t = i / N_VERT;
    pairs.push({
      inX: halfInnerW,
      inY: yInMin + t * (yInMax - yInMin),
      outX: halfOuterW,
      outY: yOutMin + t * (yOutMax - yOutMin),
    });
  }

  // 4. Sudut Kanan-Atas: Busur radial dari 0 ke PI/2
  for (let j = 1; j <= N_CORNER; j++) {
    const theta = (j / N_CORNER) * (Math.PI / 2);
    pairs.push({
      inX: xInMax + rIn * Math.cos(theta),
      inY: yInMax + rIn * Math.sin(theta),
      outX: xOutMax + rOut * Math.cos(theta),
      outY: yOutMax + rOut * Math.sin(theta),
    });
  }

  // 5. Sisi Atas: Garis horizontal presisi dari kanan (+X) ke kiri (-X)
  for (let i = 1; i <= N_HORIZ; i++) {
    const t = i / N_HORIZ;
    pairs.push({
      inX: xInMax - t * (xInMax - xInMin),
      inY: cutoutTop,
      outX: xOutMax - t * (xOutMax - xOutMin),
      outY: halfOuterH,
    });
  }

  // 6. Sudut Kiri-Atas: Busur radial dari PI/2 ke PI
  for (let j = 1; j <= N_CORNER; j++) {
    const theta = Math.PI / 2 + (j / N_CORNER) * (Math.PI / 2);
    pairs.push({
      inX: xInMin + rIn * Math.cos(theta),
      inY: yInMax + rIn * Math.sin(theta),
      outX: xOutMin + rOut * Math.cos(theta),
      outY: yOutMax + rOut * Math.sin(theta),
    });
  }

  // 7. Sisi Kiri: Garis vertikal presisi dari atas (+Y) ke bawah (-Y)
  for (let i = 1; i <= N_VERT; i++) {
    const t = i / N_VERT;
    pairs.push({
      inX: -halfInnerW,
      inY: yInMax - t * (yInMax - yInMin),
      outX: -halfOuterW,
      outY: yOutMax - t * (yOutMax - yOutMin),
    });
  }

  // 8. Sudut Kiri-Bawah: Busur radial dari PI ke 3*PI/2 (sampai N_CORNER - 1 agar tidak duplikat titik awal)
  for (let j = 1; j < N_CORNER; j++) {
    const theta = Math.PI + (j / N_CORNER) * (Math.PI / 2);
    pairs.push({
      inX: xInMin + rIn * Math.cos(theta),
      inY: yInMin + rIn * Math.sin(theta),
      outX: xOutMin + rOut * Math.cos(theta),
      outY: yOutMin + rOut * Math.sin(theta),
    });
  }

  const K = pairs.length;
  const positions: number[] = [];
  const indices: number[] = [];

  const R = curveRadius;
  const getZArc = (x: number) => Math.sqrt(Math.max(0, R * R - x * x)) - R;

  // Generate 4 verteks per pasangan:
  // [0: InFront, 1: OutFront, 2: OutBack, 3: InBack]
  for (let k = 0; k < K; k++) {
    const { inX, inY, outX, outY } = pairs[k];

    const inZArc = getZArc(inX);
    const outZArc = getZArc(outX);

    // 0: InFront
    positions.push(inX, inY, depth - embedDepth + inZArc);
    // 1: OutFront
    positions.push(outX, outY, depth - embedDepth + outZArc);
    // 2: OutBack
    positions.push(outX, outY, -embedDepth + outZArc);
    // 3: InBack
    positions.push(inX, inY, -embedDepth + inZArc);
  }

  // Generate indeks segitiga untuk 4 muka di sekeliling loop terstruktur:
  for (let k = 0; k < K; k++) {
    const next = (k + 1) % K;

    const inFrontA = k * 4 + 0;
    const outFrontA = k * 4 + 1;
    const outBackA = k * 4 + 2;
    const inBackA = k * 4 + 3;

    const inFrontB = next * 4 + 0;
    const outFrontB = next * 4 + 1;
    const outBackB = next * 4 + 2;
    const inBackB = next * 4 + 3;

    // 1. Muka Depan (Front Face)
    indices.push(inFrontA, outFrontA, outFrontB);
    indices.push(inFrontA, outFrontB, inFrontB);

    // 2. Muka Luar Samping (Outer Rim)
    indices.push(outFrontA, outBackA, outBackB);
    indices.push(outFrontA, outBackB, outFrontB);

    // 3. Muka Dalam Lubang (Inner Rim)
    indices.push(inFrontA, inFrontB, inBackB);
    indices.push(inFrontA, inBackB, inBackA);

    // 4. Muka Belakang Menempel Silinder Tungku (Back Face)
    indices.push(inBackA, inBackB, outBackB);
    indices.push(inBackA, outBackB, outBackA);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Curved Cast Rectangular Window Frame (Sesuai Gambar 1 & Gambar 2).
 * - Sisi atas dan bawah 100% lurus, rapi, dan terpoles mulus tanpa tekukan miring/bengkok.
 * - Ditekuk presisi mengikuti busur silinder cangkang tungku (R = 0.525m).
 * - Menempel rapat ke bodi silinder tungku tanpa celah (zero gap).
 */
interface CurvedWindowFrameProps {
  yPos?: number;
  outerWidth?: number;
  outerHeight?: number;
  cutoutWidth?: number;
  cutoutTop?: number;
  cutoutBottom?: number;
  curveRadius?: number;
}

const CurvedWindowFrame: React.FC<CurvedWindowFrameProps> = ({
  yPos = -0.055,
  outerWidth = 0.348,
  outerHeight = 0.548,
  cutoutWidth = 0.252,
  cutoutTop = 0.2505,
  cutoutBottom = -0.2505,
  curveRadius = 0.525,
}) => {
  const frameMat = { color: '#cbd5e1', metalness: 0.42, roughness: 0.34 };
  const boltMat = { color: '#e2e8f0', metalness: 0.95, roughness: 0.18 };

  const curvedGeometry = useMemo(
    () =>
      createStructuredCurvedFrameGeometry(
        outerWidth,
        outerHeight,
        cutoutWidth,
        cutoutTop,
        cutoutBottom,
        0.032,
        0.040,
        0.024,
        curveRadius,
        0.004
      ),
    [outerWidth, outerHeight, cutoutWidth, cutoutTop, cutoutBottom, curveRadius]
  );

  const halfOuterW = outerWidth / 2;
  const boltX = halfOuterW - 0.012;
  const boltZArc = Math.sqrt(Math.max(0, curveRadius * curveRadius - boltX * boltX)) - curveRadius;
  const boltAngle = Math.asin(Math.min(0.99, boltX / curveRadius));

  return (
    <group position={[0, yPos, 0]}>
      {/* Curved Seamless Cast Bezel Frame (Dipoles halus, 100% lurus di sisi horizontal, rapat tanpa celah) */}
      <mesh geometry={curvedGeometry}>
        <meshStandardMaterial {...frameMat} />
      </mesh>

      {/* Side Mounting Stud Bolts pada Bibir Frame yang Menekuk */}
      {[-boltX, boltX].map((fx, fi) => {
        const dir = fx < 0 ? -1 : 1;
        const boltZ = 0.024 + boltZArc;
        return [-0.14, 0.14].map((by, bi) => (
          <group key={`frame-bolt-${fi}-${bi}`} position={[fx, by, boltZ]}>
            <mesh rotation={[Math.PI / 2, 0, -dir * boltAngle]}>
              <cylinderGeometry args={[0.005, 0.005, 0.012, 6]} />
              <meshStandardMaterial {...boltMat} />
            </mesh>
          </group>
        ));
      })}
    </group>
  );
};

/**
 * Authentic Rear Power & Water Cable Terminal Assembly (Sesuai Gambar 1 & 2 Asli Pabrik).
 * - Sesuai instruksi user:
 *   1. Pelat kuning diturunkan hingga sejajar penuh dengan kotak bawah (yPos = -0.475m).
 *   2. Di sisi luar pelat kuning ditambahkan plat tembaga tebal yang ditempel dengan baut dari sisi luar.
 *   3. Plat tembaga menjulang beberapa cm di atas pelat kuning hingga y = -0.285m,
 *      menyatu tepat di tengah sumbu pipa/kawat tembaga (x = ±0.069m, y = -0.285m).
 *   4. Kawat tembaga bebas melintas tanpa menabrak/menembus kotak besi maupun frame lubang tungku.
 *   5. Blok terminal plat tembaga masif dengan klem baut 2x2 dan nepel pendingin air 45° di z = -0.75m.
 *   6. Terhubung langsung dan mulus dengan ConnectedWaterCables.
 */
const RearPowerTerminalAssembly: React.FC = () => {
  const isLite = useSimStore((s) => s.performanceProfile === 'lite');
  const copperMat = {
    color: '#c25e1a',
    metalness: 0.90,
    roughness: 0.22,
  };
  const g10InsulatorMat = {
    color: '#ca8a04',
    roughness: 0.45,
    metalness: 0.12,
  };
  const steelMat = {
    color: '#cbd5e1',
    metalness: 0.42,
    roughness: 0.36,
  };
  const boltMat = {
    color: '#e2e8f0',
    metalness: 0.95,
    roughness: 0.18,
  };

  return (
    <group name="Rear_Power_Terminal_Assembly">
      {/* 1. Pelat Isolator G10 Kuning & Plat Tembaga Luar (Kiri di x = -0.056/-0.069 & Kanan di x = +0.056/+0.069) */}
      {[-1, 1].map((dir, gi) => {
        const yellowX = dir * 0.056;
        const copperPlateX = dir * 0.069;
        const outerBoltX = dir * 0.076;
        const innerNutX = dir * 0.046;

        return (
          <group key={`terminal-pole-${gi}`}>
            {/* 1a. Pelat Isolator G10 Ramping Vertikal Sejajar Penuh dengan Kotak Bawah (y = -0.565 s/d -0.385) */}
            <mesh position={[yellowX, -0.475, -0.647]}>
              <boxGeometry args={[0.016, 0.180, 0.124]} />
              <meshStandardMaterial {...g10InsulatorMat} />
            </mesh>

            {/* Flens Braket Baja Pengikat Pelat Isolator ke Muka Balok Cor Bawah */}
            <group position={[yellowX, -0.475, -0.585]}>
              <mesh>
                <boxGeometry args={[0.034, 0.150, 0.010]} />
                <meshStandardMaterial {...steelMat} />
              </mesh>
              {/* Baut klem heksagonal pengunci braket */}
              {!isLite && [-0.055, 0.055].map((by, bi) => (
                <mesh key={`mount-bolt-${bi}`} position={[0, by, -0.006]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.005, 0.005, 0.012, 6]} />
                  <meshStandardMaterial {...boltMat} />
                </mesh>
              ))}
            </group>

            {/* 1b. Sesuai Permintaan User: Plat Tembaga di Sisi Luar Pelat Kuning */}
            <mesh position={[copperPlateX, -0.425, -0.649]}>
              <boxGeometry args={[0.010, 0.280, 0.128]} />
              <meshStandardMaterial {...copperMat} />
            </mesh>

            {/* Baut-Baut Pengikat Plat Tembaga ke Pelat Kuning dari Sisi Luar (3 Baut Vertikal) */}
            {!isLite && [-0.520, -0.460, -0.400].map((by, bi) => (
              <group key={`cu-bolt-${bi}`} position={[0, by, -0.645]}>
                {/* Kepala Baut Heksagonal di Sisi Luar Plat Tembaga */}
                <mesh position={[outerBoltX, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.0055, 0.0055, 0.008, 6]} />
                  <meshStandardMaterial {...boltMat} />
                </mesh>
                {/* Batang Baut Tembus */}
                <mesh position={[yellowX, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.0035, 0.0035, 0.030, 8]} />
                  <meshStandardMaterial {...boltMat} />
                </mesh>
                {/* Mur & Ring di Sisi Dalam Pelat Isolator */}
                <mesh position={[innerNutX, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.0055, 0.0055, 0.006, 6]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.90} roughness={0.2} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}

      {/* 2. Dua Blok Terminal Plat Tembaga Langsung di Ujung Pipa Tembaga (x = ±0.069, y = -0.285, z = -0.75) */}
      {/* Sesuai instruksi: pipa tembaga & plat tembaga menyatu tepat di tengah, kabel langsung disambung ke ujung tembaga */}
      {[-0.069, 0.069].map((tx, ti) => (
        <group key={`cable-terminal-lug-${ti}`} position={[tx, -0.285, -0.75]}>
          {/* Blok Klem Plat Tembaga Berat Pengikat Ujung Pipa & Kabel */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.038, 0.052, 0.048]} />
            <meshStandardMaterial {...copperMat} />
          </mesh>

          {/* 4 Baut Klem Baja Heksagonal (Pola 2x2 Presisi) */}
          {[-0.016, 0.016].map((by, bi) =>
            [-0.014, 0.014].map((bz, bj) => (
              <group key={`term-bolt-${bi}-${bj}`} position={[0, by, bz]}>
                <mesh position={[ti === 0 ? -0.021 : 0.021, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.006, 0.006, 0.012, 6]} />
                  <meshStandardMaterial {...boltMat} />
                </mesh>
                <mesh position={[ti === 0 ? 0.021 : -0.021, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.006, 0.006, 0.012, 6]} />
                  <meshStandardMaterial color="#f1f5f9" metalness={0.96} roughness={0.15} />
                </mesh>
              </group>
            ))
          )}

          {/* Nepel Pipa Tembaga Pendingin Air Miring 45° Keluar ke Belakang/Bawah */}
          <group position={[0, -0.028, 0.020]} rotation={[-0.45, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.012, 0.07, 16]} />
              <meshStandardMaterial {...copperMat} />
            </mesh>
            {/* Cincin barb selang */}
            {[-0.012, 0.012].map((ry, ri) => (
              <mesh key={`hose-barb-${ri}`} position={[0, ry, 0]}>
                <torusGeometry args={[0.0135, 0.002, 10, 16]} />
                <meshStandardMaterial {...copperMat} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
    </group>
  );
};

/**
 * Authentic Slender Architectural Concrete Foundation Plinth (Penopang Tungku Bercorak).
 * - Sesuai permintaan user:
 *   1. Dibuat ramping (lebar 0.36m, panjang 0.84m, tinggi 1.30m).
 *   2. Memiliki corak arsitektural (stepped spread footing, alur corak/groove horizontal & vertikal,
 *      panel inset, titik angkur bekisting cor, serta sole plate baja dengan 4 baut angkur M24).
 */
interface ConcreteFoundationPlinthProps {
  xPos: number;
  isLeft: boolean;
  children?: React.ReactNode;
}

const ConcreteFoundationPlinth: React.FC<ConcreteFoundationPlinthProps> = ({
  xPos,
  isLeft,
  children,
}) => {
  const concreteMat = { color: '#94a3b8', roughness: 0.88, metalness: 0.06 };
  const insetMat = { color: '#78889b', roughness: 0.92, metalness: 0.04 };
  const grooveMat = { color: '#475569', roughness: 0.85, metalness: 0.10 };
  const steelMat = { color: '#334155', metalness: 0.85, roughness: 0.32 };
  const boltMat = { color: '#cbd5e1', metalness: 0.92, roughness: 0.20 };

  const plinthWidth = 0.36;
  const plinthLength = 0.84;

  return (
    <group position={[xPos, 0, 0]}>
      {/* 1. Stepped Spread Footing Base Pad (Alas Bawah Bertingkat) */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[plinthWidth + 0.08, 0.12, plinthLength + 0.08]} />
        <meshStandardMaterial {...concreteMat} />
      </mesh>
      {/* Chamfer collar step */}
      <mesh position={[0, 0.135, 0]}>
        <boxGeometry args={[plinthWidth + 0.03, 0.03, plinthLength + 0.03]} />
        <meshStandardMaterial {...insetMat} />
      </mesh>

      {/* 2. Main Slender Column Shaft (Tinggi 1.10m, dari y = 0.15 ke 1.25) */}
      <mesh position={[0, 0.70, 0]}>
        <boxGeometry args={[plinthWidth, 1.10, plinthLength]} />
        <meshStandardMaterial {...concreteMat} />
      </mesh>

      {/* 3. Architectural Reveals & Inset Panels (Corak Panel & Alur Beton) */}
      {/* Outer side inset panel */}
      <group position={[isLeft ? -plinthWidth / 2 - 0.002 : plinthWidth / 2 + 0.002, 0.70, 0]}>
        <mesh>
          <boxGeometry args={[0.006, 0.82, 0.60]} />
          <meshStandardMaterial {...insetMat} />
        </mesh>
        {/* Horizontal reveal grooves (Alur Cor Horizontal) */}
        {[-0.24, 0, 0.24].map((gy, gi) => (
          <mesh key={`groove-${gi}`} position={[isLeft ? -0.002 : 0.002, gy, 0]}>
            <boxGeometry args={[0.008, 0.016, 0.64]} />
            <meshStandardMaterial {...grooveMat} />
          </mesh>
        ))}
        {/* Formwork tie-rod dots (Titik angkur cetakan beton) */}
        {[-0.30, 0.30].map((ty, ti) =>
          [-0.22, 0.22].map((tz, iZ) => (
            <mesh
              key={`tie-${ti}-${iZ}`}
              position={[isLeft ? -0.003 : 0.003, ty, tz]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.012, 0.012, 0.004, 16]} />
              <meshStandardMaterial {...grooveMat} />
            </mesh>
          ))
        )}
      </group>

      {/* Front & Rear vertical fluted reveals (Alur Vertikal Muka Depan & Belakang) */}
      {[-plinthLength / 2 - 0.002, plinthLength / 2 + 0.002].map((fz, fi) => (
        <mesh key={`flute-${fi}`} position={[0, 0.70, fz]}>
          <boxGeometry args={[0.22, 0.84, 0.006]} />
          <meshStandardMaterial {...insetMat} />
        </mesh>
      ))}

      {/* 4. Top Pier Capital Collar & Heavy Cast-Steel Sole Plate */}
      <mesh position={[0, 1.265, 0]}>
        <boxGeometry args={[plinthWidth + 0.02, 0.03, plinthLength + 0.02]} />
        <meshStandardMaterial {...concreteMat} />
      </mesh>
      {/* Heavy Steel Sole Plate */}
      <mesh position={[0, 1.290, 0]}>
        <boxGeometry args={[plinthWidth - 0.03, 0.02, plinthLength - 0.03]} />
        <meshStandardMaterial {...steelMat} />
      </mesh>

      {/* 4 Heavy M24 Anchor Studs with Hex Nuts & Washers */}
      {[-0.12, 0.12].map((bx, bi) =>
        [-0.33, 0.33].map((bz, bj) => (
          <group key={`anchor-${bi}-${bj}`} position={[bx, 1.30, bz]}>
            <mesh position={[0, 0.015, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.03, 12]} />
              <meshStandardMaterial {...boltMat} />
            </mesh>
            <mesh position={[0, 0.008, 0]}>
              <cylinderGeometry args={[0.019, 0.019, 0.012, 6]} />
              <meshStandardMaterial {...boltMat} />
            </mesh>
          </group>
        ))
      )}

      {/* Mechanical equipment mounted on top of plinth */}
      {children}
    </group>
  );
};

/**
 * Creates authentic monolithic refractory top collar geometry (Precast Cap Block).
 * - Berfungsi menutup 100% rapat bibir krusibel (r = 0.340m, y = 0.460m) dan rongga koil ke dek (y = 0.540m).
 * - Menghilangkan efek "lingkaran putih mengambang" yang terpotong kasar di dekat moncong:
 *   1. Kedua ujung collar (k = 0 dan k = numSegs) berakhir tepat di bidang vertikal dinding moncong (x = ±0.110m).
 *   2. Memiliki solid end-cap faces yang menutup rapat dan menyatu mulus ke sidewalls moncong tanpa celah.
 *   3. Memiliki chamfer bevel mulut tuang 45° yang mengalirkan skrap/cairan dengan mulus ke dalam krusibel.
 *   4. Bersifat 100% kedap (watertight), bebas rongga bolong, dan melindungi koil pendingin air.
 */
function createMonolithicRefractoryCollarGeometry() {
  const geo = new THREE.BufferGeometry();

  const rIn = 0.339;          // Menempel presisi ke bibir dalam mulut krusibel
  const rTopChamfer = 0.352;  // Radius chamfer bevel mulut tuang di muka atas
  const rOut = 0.385;         // Menempel dan overlap 5mm di bawah lubang dek baja (r = 0.380m)
  const yTop = 0.542;         // Menempel rapat ke dasar pelat dek
  const yChamfer = 0.522;     // Kedalaman chamfer bevel
  const yBot = 0.445;         // Turun melampaui puncak krusibel (0.460m) menutup rapat koil di bawahnya

  const wCut = 0.110;         // Setengah lebar moncong corong tuang (x = ±0.110m)

  // Sudut radial awal pada dinding kanan moncong (x = +wCut)
  const angInStart = Math.asin(wCut / rIn);
  const angInEnd = Math.PI * 2 - angInStart;

  const angChamferStart = Math.asin(wCut / rTopChamfer);
  const angChamferEnd = Math.PI * 2 - angChamferStart;

  const angOutStart = Math.asin(wCut / rOut);
  const angOutEnd = Math.PI * 2 - angOutStart;

  const numSegs = 48;
  const sections: Array<{
    pTopOut: [number, number, number];
    pTopChamfer: [number, number, number];
    pInChamfer: [number, number, number];
    pInBot: [number, number, number];
    pOutBot: [number, number, number];
  }> = [];

  for (let i = 0; i <= numSegs; i++) {
    const t = i / numSegs;

    // Outer vertices (i = 0 di x = +wCut, i = numSegs di x = -wCut)
    let xOut: number, zOut: number;
    if (i === 0) {
      xOut = wCut;
      zOut = Math.sqrt(Math.max(0, rOut * rOut - wCut * wCut));
    } else if (i === numSegs) {
      xOut = -wCut;
      zOut = Math.sqrt(Math.max(0, rOut * rOut - wCut * wCut));
    } else {
      const aOut = angOutStart + t * (angOutEnd - angOutStart);
      xOut = rOut * Math.sin(aOut);
      zOut = rOut * Math.cos(aOut);
    }

    // Top Chamfer vertices
    let xCh: number, zCh: number;
    if (i === 0) {
      xCh = wCut;
      zCh = Math.sqrt(Math.max(0, rTopChamfer * rTopChamfer - wCut * wCut));
    } else if (i === numSegs) {
      xCh = -wCut;
      zCh = Math.sqrt(Math.max(0, rTopChamfer * rTopChamfer - wCut * wCut));
    } else {
      const aCh = angChamferStart + t * (angChamferEnd - angChamferStart);
      xCh = rTopChamfer * Math.sin(aCh);
      zCh = rTopChamfer * Math.cos(aCh);
    }

    // Inner vertices
    let xIn: number, zIn: number;
    if (i === 0) {
      xIn = wCut;
      zIn = Math.sqrt(Math.max(0, rIn * rIn - wCut * wCut));
    } else if (i === numSegs) {
      xIn = -wCut;
      zIn = Math.sqrt(Math.max(0, rIn * rIn - wCut * wCut));
    } else {
      const aIn = angInStart + t * (angInEnd - angInStart);
      xIn = rIn * Math.sin(aIn);
      zIn = rIn * Math.cos(aIn);
    }

    sections.push({
      pTopOut: [xOut, yTop, zOut],
      pTopChamfer: [xCh, yTop, zCh],
      pInChamfer: [xIn, yChamfer, zIn],
      pInBot: [xIn, yBot, zIn],
      pOutBot: [xOut, yBot, zOut],
    });
  }

  const positions: number[] = [];

  for (let i = 0; i < numSegs; i++) {
    const s0 = sections[i];
    const s1 = sections[i + 1];

    // 1. Top Flat Face (+Y)
    positions.push(...s0.pTopChamfer, ...s0.pTopOut, ...s1.pTopOut);
    positions.push(...s0.pTopChamfer, ...s1.pTopOut, ...s1.pTopChamfer);

    // 2. Beveled Funnel Chamfer (Miring ke bawah ke mulut krusibel)
    positions.push(...s0.pInChamfer, ...s0.pTopChamfer, ...s1.pTopChamfer);
    positions.push(...s0.pInChamfer, ...s1.pTopChamfer, ...s1.pInChamfer);

    // 3. Inner Cylindrical Throat Wall (-Radial, menghadap rongga krusibel)
    positions.push(...s0.pInBot, ...s0.pInChamfer, ...s1.pInChamfer);
    positions.push(...s0.pInBot, ...s1.pInChamfer, ...s1.pInBot);

    // 4. Bottom Annular Base (-Y, menutup ruang koil di bawah)
    positions.push(...s0.pOutBot, ...s0.pInBot, ...s1.pInBot);
    positions.push(...s0.pOutBot, ...s1.pInBot, ...s1.pOutBot);

    // 5. Outer Cylindrical Wall (+Radial, tertutup di balik cangkang tungku)
    positions.push(...s0.pTopOut, ...s1.pTopOut, ...s1.pOutBot);
    positions.push(...s0.pTopOut, ...s1.pOutBot, ...s0.pOutBot);
  }

  // 6. Right Solid End Cap di x = +wCut (Menutup rapat & menempel ke dinding kanan moncong)
  const sR = sections[0];
  positions.push(...sR.pTopOut, ...sR.pTopChamfer, ...sR.pInChamfer);
  positions.push(...sR.pTopOut, ...sR.pInChamfer, ...sR.pInBot);
  positions.push(...sR.pTopOut, ...sR.pInBot, ...sR.pOutBot);

  // 7. Left Solid End Cap di x = -wCut (Menutup rapat & menempel ke dinding kiri moncong)
  const sL = sections[numSegs];
  positions.push(...sL.pTopOut, ...sL.pOutBot, ...sL.pInBot);
  positions.push(...sL.pTopOut, ...sL.pInBot, ...sL.pInChamfer);
  positions.push(...sL.pTopOut, ...sL.pInChamfer, ...sL.pTopChamfer);

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates authentic upturned refractory ceramic pouring chute geometry.
 * Sesuai permintaan: Moncong corong mendongak ke atas seperti corong/moncong cerat ladle.
 * - Berawal dari dalam tenggorokan krusibel (z = 0.322m) melintasi notch dek (z = 0.525m).
 * - Menjulur ke depan dan MENDONGAK KE ATAS (z = 0.44m hingga z = 0.695m).
 * - Dasar palung naik dari y = -0.012m ke y = +0.080m (+9.2cm kenaikan ke atas).
 * - Bibir samping naik ke y = +0.115m membentuk cerat V penuangan terfokus.
 * - 100% kedap (watertight), bebas celah, dengan normal verteks mulus.
 */
function createUpturnedRefractorySpoutGeometry() {
  const geo = new THREE.BufferGeometry();
  const numZ = 16;
  const numTrough = 10;
  const zMin = 0.322; // Rata dan menyatu presisi dengan bukaan end-caps leher keramik refraktori (z = 0.322m)
  const zMax = 0.695;

  const sections: Array<{
    z: number;
    troughVerts: [number, number, number][];
    leftTopOuter: [number, number, number];
    leftBotOuter: [number, number, number];
    rightBotOuter: [number, number, number];
    rightTopOuter: [number, number, number];
  }> = [];

  for (let iz = 0; iz <= numZ; iz++) {
    const fracZ = iz / numZ;
    const z = zMin + fracZ * (zMax - zMin);

    let yFloor = -0.012;
    let yBot = -0.065;
    let yRim = 0.060;
    let wOuter = 0.110; // Menutup presisi 0.220m bukaan notch dek tanpa celah samping
    let wInner = 0.082;

    if (z > 0.525) {
      // Menjulur ke depan melewati bibir dek: mendongak ke atas dan meramping
      const u = (z - 0.525) / (zMax - 0.525);
      const rise = Math.pow(u, 1.35);
      yFloor = -0.012 + 0.092 * rise; // Mendongak ke atas mencapai +0.080m pada puncak paruh cerat
      yBot = -0.065 + 0.105 * rise;   // Dasar luar naik ke +0.040m
      yRim = 0.060 + 0.055 * rise;    // Dinding samping naik ke +0.115m
      wOuter = 0.110 - 0.038 * u;     // Meramping ke 0.072m di paruh moncong
      wInner = 0.082 - 0.034 * u;     // Cerat tuang meramping ke 0.048m
    }

    const troughVerts: [number, number, number][] = [];
    for (let it = 0; it <= numTrough; it++) {
      const s = -1 + 2 * (it / numTrough);
      const x = s * wInner;
      const y = yFloor + (s * s) * (yRim - yFloor);
      troughVerts.push([x, y, z]);
    }

    const leftTopOuter: [number, number, number] = [-wOuter, yRim, z];
    const leftBotOuter: [number, number, number] = [-wOuter, yBot, z];
    const rightBotOuter: [number, number, number] = [wOuter, yBot, z];
    const rightTopOuter: [number, number, number] = [wOuter, yRim, z];

    sections.push({
      z,
      troughVerts,
      leftTopOuter,
      leftBotOuter,
      rightBotOuter,
      rightTopOuter,
    });
  }

  const positions: number[] = [];

  for (let iz = 0; iz < numZ; iz++) {
    const s0 = sections[iz];
    const s1 = sections[iz + 1];

    for (let it = 0; it < numTrough; it++) {
      const p00 = s0.troughVerts[it];
      const p01 = s0.troughVerts[it + 1];
      const p10 = s1.troughVerts[it];
      const p11 = s1.troughVerts[it + 1];

      positions.push(...p00, ...p10, ...p11);
      positions.push(...p00, ...p11, ...p01);
    }

    // Left top rim strip (+Y)
    positions.push(...s0.leftTopOuter, ...s1.leftTopOuter, ...s1.troughVerts[0]);
    positions.push(...s0.leftTopOuter, ...s1.troughVerts[0], ...s0.troughVerts[0]);

    // Right top rim strip (+Y)
    positions.push(...s0.troughVerts[numTrough], ...s1.troughVerts[numTrough], ...s1.rightTopOuter);
    positions.push(...s0.troughVerts[numTrough], ...s1.rightTopOuter, ...s0.rightTopOuter);

    // Left outer wall (-X)
    positions.push(...s0.leftTopOuter, ...s0.leftBotOuter, ...s1.leftBotOuter);
    positions.push(...s0.leftTopOuter, ...s1.leftBotOuter, ...s1.leftTopOuter);

    // Right outer wall (+X)
    positions.push(...s0.rightTopOuter, ...s1.rightTopOuter, ...s1.rightBotOuter);
    positions.push(...s0.rightTopOuter, ...s1.rightBotOuter, ...s0.rightBotOuter);

    // Bottom exterior (-Y, normal mengarah ke bawah sehingga tampak solid saat dilihat dari bawah)
    positions.push(...s0.leftBotOuter, ...s1.rightBotOuter, ...s1.leftBotOuter);
    positions.push(...s0.leftBotOuter, ...s0.rightBotOuter, ...s1.rightBotOuter);
  }

  // Front Cap at zMax (beak tip) (+Z)
  const sf = sections[numZ];
  positions.push(...sf.leftTopOuter, ...sf.leftBotOuter, ...sf.troughVerts[0]);
  positions.push(...sf.rightTopOuter, ...sf.troughVerts[numTrough], ...sf.rightBotOuter);
  for (let i = 0; i < numTrough; i++) {
    const pA = sf.troughVerts[i];
    const pB = sf.troughVerts[i + 1];
    const bA: [number, number, number] = [
      sf.leftBotOuter[0] + (sf.rightBotOuter[0] - sf.leftBotOuter[0]) * (i / numTrough),
      sf.leftBotOuter[1],
      sf.leftBotOuter[2],
    ];
    const bB: [number, number, number] = [
      sf.leftBotOuter[0] + (sf.rightBotOuter[0] - sf.leftBotOuter[0]) * ((i + 1) / numTrough),
      sf.leftBotOuter[1],
      sf.leftBotOuter[2],
    ];
    positions.push(...pA, ...bA, ...bB);
    positions.push(...pA, ...bB, ...pB);
  }

  // Back Cap at zMin (-Z)
  const sb = sections[0];
  positions.push(...sb.leftTopOuter, ...sb.troughVerts[0], ...sb.leftBotOuter);
  positions.push(...sb.rightTopOuter, ...sb.rightBotOuter, ...sb.troughVerts[numTrough]);
  for (let i = 0; i < numTrough; i++) {
    const pA = sb.troughVerts[i];
    const pB = sb.troughVerts[i + 1];
    const bA: [number, number, number] = [
      sb.leftBotOuter[0] + (sb.rightBotOuter[0] - sb.leftBotOuter[0]) * (i / numTrough),
      sb.leftBotOuter[1],
      sb.leftBotOuter[2],
    ];
    const bB: [number, number, number] = [
      sb.leftBotOuter[0] + (sb.rightBotOuter[0] - sb.leftBotOuter[0]) * ((i + 1) / numTrough),
      sb.leftBotOuter[1],
      sb.leftBotOuter[2],
    ];
    positions.push(...pA, ...pB, ...bB);
    positions.push(...pA, ...bB, ...bA);
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Solid Fabricated Steel Spout Cradle & Nose Shield Geometry.
 * Penopang baja pejal di bawah moncong yang mendongak ke atas mengikuti cerat refraktori.
 * 100% rapat, poliedron tertutup solid, bebas bug tembus pandang saat dilihat dari bawah.
 */
function createSpoutCradleGeometry() {
  const geo = new THREE.BufferGeometry();
  const numZ = 10;
  const zMin = 0.520;
  const zMax = 0.678;

  const sections: Array<{
    z: number;
    lt: [number, number, number];
    lb: [number, number, number];
    rt: [number, number, number];
    rb: [number, number, number];
  }> = [];

  for (let iz = 0; iz <= numZ; iz++) {
    const fracZ = iz / numZ;
    const z = zMin + fracZ * (zMax - zMin);

    const u = (z - 0.525) / (0.695 - 0.525);
    const rise = Math.pow(Math.max(0, u), 1.35);
    // Bagian atas menempel rapat ke dasar keramik
    const yTop = -0.065 + 0.105 * rise + 0.002;
    // Bagian bawah membentuk dagu baja miring pejal
    const yBot = -0.075 + 0.105 * rise;
    const w = 0.110 - 0.038 * Math.max(0, u);

    sections.push({
      z,
      lt: [-w, yTop, z],
      lb: [-w, yBot, z],
      rt: [ w, yTop, z],
      rb: [ w, yBot, z],
    });
  }

  const positions: number[] = [];

  for (let iz = 0; iz < numZ; iz++) {
    const s0 = sections[iz];
    const s1 = sections[iz + 1];

    // 1. Muka Atas (+Y)
    positions.push(...s0.lt, ...s1.lt, ...s1.rt);
    positions.push(...s0.lt, ...s1.rt, ...s0.rt);

    // 2. Muka Bawah (-Y, normal mengarah ke bawah ke arah pengamat)
    positions.push(...s0.lb, ...s1.rb, ...s1.lb);
    positions.push(...s0.lb, ...s0.rb, ...s1.rb);

    // 3. Muka Kiri (-X)
    positions.push(...s0.lt, ...s0.lb, ...s1.lb);
    positions.push(...s0.lt, ...s1.lb, ...s1.lt);

    // 4. Muka Kanan (+X)
    positions.push(...s0.rt, ...s1.rt, ...s1.rb);
    positions.push(...s0.rt, ...s1.rb, ...s0.rb);
  }

  // Muka Depan (+Z)
  const sf = sections[numZ];
  positions.push(...sf.lt, ...sf.lb, ...sf.rb);
  positions.push(...sf.lt, ...sf.rb, ...sf.rt);

  // Muka Belakang (-Z, menempel rapat ke dinding dek depan)
  const sb = sections[0];
  positions.push(...sb.lt, ...sb.rt, ...sb.rb);
  positions.push(...sb.lt, ...sb.rb, ...sb.lb);

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates dynamic molten metal ribbon geometry flowing through the upturned chute.
 * Pita cairan logam mengikuti kontur dasar palung yang mendongak ke atas menuju bibir tuang.
 */
function createChuteFlowRibbonGeometry() {
  const geo = new THREE.BufferGeometry();
  const numZ = 16;
  const numW = 6;
  const zMin = 0.324;
  const zMax = 0.693;

  const positions: number[] = [];

  for (let iz = 0; iz < numZ; iz++) {
    const z0 = zMin + (iz / numZ) * (zMax - zMin);
    const z1 = zMin + ((iz + 1) / numZ) * (zMax - zMin);

    const getProfile = (z: number) => {
      let yFloor = -0.012;
      let wInner = 0.082;
      if (z > 0.525) {
        const u = (z - 0.525) / (0.695 - 0.525);
        const rise = Math.pow(u, 1.35);
        yFloor = -0.012 + 0.092 * rise;
        wInner = 0.082 - 0.034 * u;
      }
      return { yFloor, wFlow: wInner * 0.72 };
    };

    const p0 = getProfile(z0);
    const p1 = getProfile(z1);

    for (let iw = 0; iw < numW; iw++) {
      const s0A = -1 + 2 * (iw / numW);
      const s0B = -1 + 2 * ((iw + 1) / numW);
      const s1A = s0A;
      const s1B = s0B;

      const v00: [number, number, number] = [s0A * p0.wFlow, p0.yFloor + 0.005 + (s0A * s0A) * 0.008, z0];
      const v01: [number, number, number] = [s0B * p0.wFlow, p0.yFloor + 0.005 + (s0B * s0B) * 0.008, z0];
      const v10: [number, number, number] = [s1A * p1.wFlow, p1.yFloor + 0.005 + (s1A * s1A) * 0.008, z1];
      const v11: [number, number, number] = [s1B * p1.wFlow, p1.yFloor + 0.005 + (s1B * s1B) * 0.008, z1];

      positions.push(...v00, ...v10, ...v11);
      positions.push(...v00, ...v11, ...v01);
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Authentic GW Series Coreless Tilting Induction Melting Furnace.
 * Updated to user specifications:
 * 1. Tungku diperkecil sedikit lagi (radius 0.525m, dek 1.05m x 1.05m).
 * 2. Moncong corong dibuat mendongak ke atas (upturned beak lip) seperti corong/moncong cerat ladle.
 * 3. Penopang tungku ramping & bercorak arsitektural.
 * 4. Panggung operator dinaikkan 1 anak tangga (9 trap, y = 1.89m) & X-brace dihapus.
 * 5. Ladle dapat diturunkan penuh hingga menyentuh lantai (y = 0.0m).
 */
export const IndustrialFurnace: React.FC<IndustrialFurnaceProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const rootFurnaceRef = useRef<THREE.Group>(null);
  const tiltingBodyRef = useRef<THREE.Group>(null);
  const streamMeshRef = useRef<THREE.Mesh>(null);
  const streamMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const splashMeshRef = useRef<THREE.Mesh>(null);
  const sparksRef = useRef<THREE.Points>(null);
  const chuteFlowMeshRef = useRef<THREE.Mesh>(null);
  const chuteFlowMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const tiltAngle = useSimStore((s) => s.tiltAngle);
  const isPouring = useSimStore((s) => s.isPouringStreamActive);
  const xrayMode = useSimStore((s) => s.xrayMode);
  const isLite = useSimStore((s) => s.performanceProfile === 'lite');

  // Disable raycasting on purely decorative/structural furnace meshes (preserving raycast on interactive Crucible, MetalLiquid, SlagCoagulant)
  useLayoutEffect(() => {
    if (!rootFurnaceRef.current) return;
    const interactiveNames = new Set([
      'ENV_CrucibleContainer',
      'VFX_MetalLiquid',
      'VFX_SlagCoagulantSequence',
    ]);
    const markNonInteractive = (obj: THREE.Object3D) => {
      if (interactiveNames.has(obj.name)) return; // Keep interactive subtree raycastable
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints) {
        obj.raycast = NOOP_RAYCAST;
      }
      for (let i = 0; i < obj.children.length; i++) {
        markNonInteractive(obj.children[i]);
      }
    };
    markNonInteractive(rootFurnaceRef.current);
  }, [isLite, xrayMode]);

  // Translucent cutaway shader material when X-Ray mode is enabled
  const shellMatProps = useMemo(
    () => ({
      color: xrayMode ? '#38bdf8' : '#cbd5e1',
      metalness: xrayMode ? 0.2 : 0.38,
      roughness: xrayMode ? 0.1 : 0.36,
      transparent: xrayMode,
      opacity: xrayMode ? 0.28 : 1.0,
      depthWrite: !xrayMode,
      side: THREE.DoubleSide,
    }),
    [xrayMode]
  );

  useFrame((_, delta) => {
    if (tiltingBodyRef.current) {
      const targetRad = (tiltAngle * Math.PI) / 180;
      tiltingBodyRef.current.rotation.x = THREE.MathUtils.lerp(
        tiltingBodyRef.current.rotation.x,
        targetRad,
        delta * 12
      );
    }

    const temp = useSimStore.getState().sim.temperatureC;
    const glow = getBlackbodyColor(temp);

    // Update glowing molten metal flow ribbon in the U-chute
    if (chuteFlowMeshRef.current && chuteFlowMatRef.current) {
      chuteFlowMeshRef.current.visible = isPouring;
      if (isPouring) {
        chuteFlowMatRef.current.emissive.setRGB(glow.r, glow.g, glow.b);
        chuteFlowMatRef.current.emissiveIntensity = glow.emissiveIntensity * 1.1;
      }
    }

    if (streamMeshRef.current && streamMatRef.current) {
      if (isPouring) {
        streamMeshRef.current.visible = true;
        const currentRad = tiltingBodyRef.current ? tiltingBodyRef.current.rotation.x : 0;
        const cosT = Math.cos(currentRad);
        const sinT = Math.sin(currentRad);

        // Dynamic spout lip position in furnace coordinate frame (pivot elevated to 1.39m)
        // With authentic upturned beak lip (reach z = 0.695m, elevated y = 0.620m)
        const yLip = 1.39 + 0.620 * cosT - 0.695 * sinT;
        const zLip = 0.620 * sinT + 0.695 * cosT;

        // Fluid falls directly into the receiving vessel if present, or onto the floor
        const { ladleFilledFraction: ladleFilled, pouringTarget, cranePosition, craneDestination } = useSimStore.getState();
        const isLadleUnderSpout =
          pouringTarget === 'ladle' &&
          (craneDestination === 'furnace' ||
            (Math.hypot(cranePosition[0] - 0.0, cranePosition[2] - 1.16) <= 1.85 &&
              cranePosition[1] <= 2.8));

        let xImpact = 0.0;
        let yImpact = 0.005; // Fall to floor when no vessel is under spout
        let zImpact = 0.96;

        if (isLadleUnderSpout) {
          // Stream terminates cleanly at the liquid surface INSIDE the ladle crucible (never pierces through bottom!)
          const ladleBaseY = Math.max(0, cranePosition[1] || 0);
          xImpact = THREE.MathUtils.clamp(cranePosition[0] * 0.45, -0.18, 0.18);
          yImpact = Math.min(yLip - 0.14, ladleBaseY + 0.18 + ladleFilled * 0.42);
          zImpact = THREE.MathUtils.clamp(cranePosition[2] - 0.06, zLip + 0.06, 1.32);
        } else if (pouringTarget === 'mold') {
          yImpact = 0.04 + ladleFilled * 0.14;
          zImpact = 0.94;
        }

        // Zero-allocation transform between spout lip (0, yLip, zLip) and impact point (xImpact, yImpact, zImpact)
        const dx = xImpact - 0.0;
        const dy = yImpact - yLip;
        const dz = zImpact - zLip;
        const streamLen = Math.max(0.12, Math.hypot(dx, dy, dz));

        streamMeshRef.current.position.set(
          dx * 0.5,
          (yLip + yImpact) * 0.5,
          (zLip + zImpact) * 0.5
        );

        // Align cylinder axis (+Y) along vector from impact to lip
        const dirX = -dx / streamLen;
        const dirY = -dy / streamLen;
        const dirZ = -dz / streamLen;
        const pitchX = Math.atan2(dirZ, dirY);
        const rollZ = -Math.atan2(dirX, Math.hypot(dirY, dirZ));
        streamMeshRef.current.rotation.set(pitchX, 0, rollZ);

        const fluidPulse = 1.0 + Math.sin(Date.now() * 0.025) * 0.10;
        streamMeshRef.current.scale.set(fluidPulse, streamLen, fluidPulse);

        streamMatRef.current.emissive.setRGB(glow.r, glow.g, glow.b);
        streamMatRef.current.emissiveIntensity = glow.emissiveIntensity * 1.15;

        if (splashMeshRef.current) {
          splashMeshRef.current.visible = true;
          splashMeshRef.current.position.set(xImpact, yImpact + 0.002, zImpact);
          const splashPulse = 0.085 + Math.sin(Date.now() * 0.035) * 0.01;
          splashMeshRef.current.scale.set(splashPulse, splashPulse, splashPulse);
        }

        if (sparksRef.current) {
          sparksRef.current.visible = true;
          sparksRef.current.position.set(xImpact, yImpact + 0.02, zImpact);
          sparksRef.current.rotation.y += delta * 7.0;
        }
      } else {
        streamMeshRef.current.visible = false;
        if (splashMeshRef.current) splashMeshRef.current.visible = false;
        if (sparksRef.current) sparksRef.current.visible = false;
      }
    }
  });

  const plinthHeight = 1.30;

  const sparkGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 45;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 0.18;
      pos[i * 3 + 1] = Math.random() * 0.14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.18;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  const deckShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Dimensi lebar dek luar kompak proporsional (1.05m x 1.05m, half = 0.525m)
    // Kapasitas krusibel 500kg di dalam (rMouth = 0.38m) 100% dipertahankan
    const half = 0.525;
    const notchHalf = 0.11;
    const rMouth = 0.38;
    const yNotch = -Math.sqrt(rMouth * rMouth - notchHalf * notchHalf);

    shape.moveTo(notchHalf, -half);
    shape.lineTo(half, -half);
    shape.lineTo(half, half);
    shape.lineTo(-half, half);
    shape.lineTo(-half, -half);
    shape.lineTo(-notchHalf, -half);
    shape.lineTo(-notchHalf, yNotch);

    const startAng = Math.atan2(yNotch, -notchHalf);
    const endAng = Math.atan2(yNotch, notchHalf);
    const mouthSegs = 48;
    const deltaAng = (2 * Math.PI) - (endAng - startAng);
    for (let i = 1; i <= mouthSegs; i++) {
      const ang = startAng - (i / mouthSegs) * deltaAng;
      shape.lineTo(rMouth * Math.cos(ang), rMouth * Math.sin(ang));
    }

    shape.lineTo(notchHalf, -half);
    shape.closePath();
    return shape;
  }, []);

  const deckExtrudeSettings = useMemo(
    () => ({
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 3,
    }),
    []
  );

  const checkerExtrudeSettings = useMemo(
    () => ({
      depth: 0.002,
      bevelEnabled: false,
    }),
    []
  );

  // Monolithic Refractory Top Collar Ring Geometry (Precast Cap Block Menutup Rapat Bibir Krusibel & Dek)
  const refractoryCollarGeometry = useMemo(() => createMonolithicRefractoryCollarGeometry(), []);

  // Aerodynamic Cast Steel Spout Side Wing Plates (Flanking pouring notch)
  // Monolithic Solid Refractory Ceramic Pouring Chute Geometry (Mendongak ke Atas)
  const upturnedSpoutGeometry = useMemo(() => createUpturnedRefractorySpoutGeometry(), []);

  // Fabricated Steel Spout Cradle & Nose Shield Geometry
  const spoutCradleGeometry = useMemo(() => createSpoutCradleGeometry(), []);

  // Dynamic Molten Liquid Chute Flow Ribbon Geometry
  const chuteFlowRibbonGeometry = useMemo(() => createChuteFlowRibbonGeometry(), []);

  return (
    <group ref={rootFurnaceRef} name="ENV_GW_InductionFurnace" position={position} rotation={rotation}>
      {/* ========================================================================= */}
      {/* 1. LEFT CONCRETE FOUNDATION PILLAR & TILTING MACHINE REDUCER             */}
      {/* Sesuai Gambar 3: Ramping (0.36x0.84m) & bercorak arsitektural            */}
      {/* ========================================================================= */}
      <ConcreteFoundationPlinth xPos={-0.80} isLeft={true}>
        {/* =================================================================== */}
        {/* TILTING MACHINE REDUCER & DRIVE MOTOR ASSEMBLY (Dudukan Mesin Rapi)  */}
        {/* Terpusat presisi di atas plinth, tanpa melenceng & tanpa melayang   */}
        {/* =================================================================== */}
        <group position={[0, 0, 0]}>
          {/* 1. Cast Iron Worm Reducer Gearbox Housing (Kotak Girboks Rapi Duduk Langsung di Atas Tiang) */}
          {/* Duduk langsung di atas sole plate tiang pondasi tanpa pelat gantung di bawah motor */}
          <group position={[0, 0, 0]}>
            {/* Main Reducer Body (Tinggi 0.22m, dari y = 1.320 ke y = 1.540, sumbu poros di y = 1.39m) */}
            <mesh position={[0, 1.430, 0]}>
              <boxGeometry args={[0.22, 0.22, 0.32]} />
              <meshStandardMaterial color="#15803d" metalness={0.75} roughness={0.35} />
            </mesh>

            {/* Reducer Cast Base Foot Rim with 4 Heavy Holding-Down Bolts (Duduk langsung di pelat alas pondasi) */}
            <mesh position={[0, 1.310, 0]}>
              <boxGeometry args={[0.25, 0.020, 0.36]} />
              <meshStandardMaterial color="#14532d" metalness={0.78} roughness={0.32} />
            </mesh>
            {!isLite && [-0.09, 0.09].map((bx, bi) =>
              [-0.15, 0.15].map((bz, bj) => (
                <group key={`rb-${bi}-${bj}`} position={[bx, 1.320, bz]}>
                  <mesh>
                    <cylinderGeometry args={[0.009, 0.009, 0.022, 6]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.92} />
                  </mesh>
                  <mesh position={[0, -0.006, 0]}>
                    <cylinderGeometry args={[0.013, 0.013, 0.004, 16]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.92} />
                  </mesh>
                </group>
              ))
            )}

            {/* Reducer Top Inspection Cover Plate */}
            <mesh position={[0, 1.548, 0]}>
              <boxGeometry args={[0.16, 0.008, 0.22]} />
              <meshStandardMaterial color="#166534" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Authentic DIN 580 Heavy Lifting Eyebolt (Baut Cincin Angkat Crane) */}
            {/* Berfungsi sebagai titik kait sling crane/hoist saat instalasi dan maintenance */}
            {!isLite && (
              <group position={[0, 1.552, 0]}>
                {/* Dudukan Mur Heksagonal Cor Berulir (Threaded Boss Collar) */}
                <mesh position={[0, 0.006, 0]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.012, 6]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.2} />
                </mesh>
                {/* Cincin Lingkaran Angkat (Forged Lifting Loop) */}
                <mesh position={[0, 0.024, 0]}>
                  <torusGeometry args={[0.015, 0.0045, 12, 16]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.2} />
                </mesh>
              </group>
            )}

            {/* Oil Level Sight Glass on front face */}
            <mesh position={[0, 1.385, 0.162]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.004, 16]} />
              <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Output Shaft Bearing Snout Collar (Facing furnace, towards +X) */}
            <mesh position={[0.12, 1.39, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.095, 0.095, 0.025, 16]} />
              <meshStandardMaterial color="#166534" metalness={0.8} roughness={0.3} />
            </mesh>
            {!isLite && [0, 1, 2, 3, 4, 5].map((i) => {
              const ang = (i / 6) * Math.PI * 2;
              return (
                <mesh
                  key={`snout-bolt-${i}`}
                  position={[0.133, 1.39 + Math.cos(ang) * 0.075, Math.sin(ang) * 0.075]}
                  rotation={[0, 0, Math.PI / 2]}
                >
                  <cylinderGeometry args={[0.006, 0.006, 0.008, 6]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
                </mesh>
              );
            })}

            {/* Flexible Flanged Coupling (Kopling Flens Menghubungkan Girboks ke Trunnion Tungku) */}
            <group position={[0.18, 1.39, 0]}>
              {/* Coupling Half A (Sisi girboks) */}
              <mesh position={[-0.025, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.078, 0.078, 0.035, 16]} />
                <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.28} />
              </mesh>
              {/* Coupling Elastic Cushion Ring */}
              <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.080, 0.080, 0.014, 16]} />
                <meshStandardMaterial color="#0f172a" roughness={0.8} />
              </mesh>
              {/* Coupling Half B (Sisi poros tungku) */}
              <mesh position={[0.025, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.078, 0.078, 0.035, 16]} />
                <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.28} />
              </mesh>
              {/* Coupling clamping bolts */}
              {!isLite && [0, 1, 2, 3, 4, 5].map((i) => {
                const ang = (i / 6) * Math.PI * 2;
                return (
                  <mesh
                    key={`c-bolt-${i}`}
                    position={[0, Math.cos(ang) * 0.060, Math.sin(ang) * 0.060]}
                    rotation={[0, 0, Math.PI / 2]}
                  >
                    <cylinderGeometry args={[0.006, 0.006, 0.070, 6]} />
                    <meshStandardMaterial color="#e2e8f0" metalness={0.95} />
                  </mesh>
                );
              })}
            </group>
          </group>

          {/* 4. Electric Drive Motor Assembly (Terpasang Rapi di Braket Penyangga Kiri) */}
          <group position={[-0.24, 1.39, 0]}>
            {/* Input Bell Housing Flange Adapter ke Girboks */}
            <mesh position={[0.11, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.082, 0.082, 0.04, 24]} />
              <meshStandardMaterial color="#166534" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Motor Main Cylindrical Stator Frame (dengan sirip pendingin) */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.076, 0.076, 0.20, 24]} />
              <meshStandardMaterial color="#14532d" metalness={0.7} roughness={0.35} />
            </mesh>

            {/* Flange-Mounted Direct Coupling to Gearbox (Tanpa Kaki Gantung Sesuai Standar B5) */}

            {/* Rear Fan Cowl Shroud */}
            <mesh position={[-0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.074, 0.074, 0.045, 24]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>

            {/* Top Terminal Junction Box */}
            <mesh position={[0, 0.082, 0]}>
              <boxGeometry args={[0.055, 0.040, 0.065]} />
              <meshStandardMaterial color="#15803d" roughness={0.4} />
            </mesh>
          </group>
        </group>
      </ConcreteFoundationPlinth>

      {/* ========================================================================= */}
      {/* 2. RIGHT FOUNDATION PILLAR & TRUNNION BEARING PEDESTAL (Plummer Block)   */}
      {/* Sesuai Gambar 3: Ramping (0.36x0.84m), bercorak, terpusat rapi & sejajar  */}
      {/* ========================================================================= */}
      <ConcreteFoundationPlinth xPos={0.80} isLeft={false}>
        {/* Heavy Cast Iron Split Pillow Block Bearing Pedestal (SN/SNL Series) */}
        {/* Terpusat presisi di x = 0 (tengah plinth), sumbu poros persis di y = 1.39m */}
        <group position={[0, 0, 0]}>
          {/* Cast Iron Base Sole Foot (Duduk rata di atas sole plate beton pada y = 1.30m) */}
          <mesh position={[0, 1.315, 0]}>
            <boxGeometry args={[0.18, 0.030, 0.32]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.35} />
          </mesh>

          {/* 4 Heavy Holding-Down Foundation Bolts at the Base Pad */}
          {!isLite && [-0.06, 0.06].map((bx, bi) =>
            [-0.12, 0.12].map((bz, bj) => (
              <group key={`pbb-${bi}-${bj}`} position={[bx, 1.325, bz]}>
                <mesh position={[0, 0.010, 0]}>
                  <cylinderGeometry args={[0.008, 0.008, 0.024, 6]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
                </mesh>
                <mesh position={[0, 0.005, 0]}>
                  <cylinderGeometry args={[0.013, 0.013, 0.010, 6]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.95} />
                </mesh>
              </group>
            ))
          )}

          {/* Pedestal Neck Upright Riser */}
          <mesh position={[0, 1.350, 0]}>
            <boxGeometry args={[0.14, 0.045, 0.22]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.35} />
          </mesh>

          {/* Heavy Split Cylindrical Bearing Housing (Pusat poros persis di y = 1.39m) */}
          <mesh position={[0, 1.390, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.078, 0.078, 0.14, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.35} />
          </mesh>

          {/* Split Cap Joint Flanges & 2 Heavy Clamping Stud Bolts on Top */}
          <mesh position={[0, 1.415, 0]}>
            <boxGeometry args={[0.14, 0.018, 0.18]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.35} />
          </mesh>
          {!isLite && [-0.065, 0.065].map((cz, ci) => (
            <group key={`cap-bolt-${ci}`} position={[0, 1.425, cz]}>
              <mesh position={[0, 0.020, 0]}>
                <cylinderGeometry args={[0.008, 0.008, 0.040, 6]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
              </mesh>
              <mesh position={[0, 0.012, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.010, 6]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.95} />
              </mesh>
            </group>
          ))}

          {/* Brass Grease Zerk Lubrication Fitting on top */}
          <mesh position={[0, 1.472, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.008, 6]} />
            <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.2} />
          </mesh>

          {/* Labyrinth Dust Seals on Left & Right Shaft Openings */}
          {!isLite && [-0.071, 0.071].map((sx, si) => (
            <mesh key={`seal-${si}`} position={[sx, 1.390, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.064, 0.064, 0.006, 16]} />
              <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
            </mesh>
          ))}
        </group>
      </ConcreteFoundationPlinth>

      {/* ========================================================================= */}
      {/* 3. TILTING FURNACE BODY ASSEMBLY (Suspended at Trunnion y = 1.39m)        */}
      {/* ========================================================================= */}
      <group
        ref={tiltingBodyRef}
        name="VFX_TiltingFurnaceBody"
        position={[0, plinthHeight + 0.09, 0]}
      >
        {/* Left Trunnion Shaft: from hub (x = -0.525) to flexible coupling (x = -0.59) */}
        <mesh position={[-0.56, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.050, 0.050, 0.070, 24]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Right Trunnion Shaft: from hub (x = +0.525) through pillow block bearing (x = +0.80) to outer end cap (x = +0.885) */}
        <mesh position={[0.70, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.050, 0.050, 0.35, 24]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Right Shaft Retainer End Cap with Center Bolt */}
        <mesh position={[0.880, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.062, 0.062, 0.018, 24]} />
          <meshStandardMaterial color="#64748b" metalness={0.90} roughness={0.25} />
        </mesh>
        <mesh position={[0.892, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.010, 0.010, 0.008, 6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
        </mesh>

        {/* Trunnion Side Hub Flanges (Mounted firmly on the SOLID side shell walls at 90 deg) */}
        <TrunnionMountFlange position={[-0.525, 0, 0]} rotation={[0, Math.PI, 0]} />
        <TrunnionMountFlange position={[0.525, 0, 0]} rotation={[0, 0, 0]} />

        {/* ----------------------------------------------------------------------- */}
        {/* REALISTIC CONTINUOUS SOLID CYLINDRICAL SHELL (Radius 0.525m, 500kg):    */}
        {/* - 4 Lubang Serong Lengkap (Depan Kanan, Depan Kiri, Belakang Kanan,     */}
        {/*   Belakang Kiri) dengan dinding pejal presisi di atas dan bawahnya.     */}
        {/* - Dinding pejal penuh di sisi kanan (90°), sisi kiri (270°), & belakang */}
        {/* ----------------------------------------------------------------------- */}
        <group name="Furnace_Cylindrical_Shell">
          {/* Upper Solid Collar Ring Flange (Continuous 360° cylindrical collar, radius 0.526m with vertical micro-overlap to eliminate seam lines & seal front gap) */}
          <mesh position={[0, 0.488, 0]}>
            <cylinderGeometry args={[0.526, 0.526, 0.124, 48, 1, true]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* Lower Solid Collar Ring Flange (Continuous 360° cylindrical collar with micro-overlap to eliminate seam lines) */}
          <mesh position={[0, -0.498, 0]}>
            <cylinderGeometry args={[0.526, 0.526, 0.142, 48, 1, true]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* Heavy Rolled Base Flange Rim (Lekukan Cincin Bibir Bawah Cangkang Abu-Putih Sesuai Gambar 2) */}
          <mesh position={[0, -0.565, 0]}>
            <cylinderGeometry args={[0.536, 0.536, 0.035, 48]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* Heavy Shell Base Bottom Plate (Dasar Bawah Pejal Abu-Putih Bebas Z-Fighting) */}
          <mesh position={[0, -0.578, 0]}>
            <cylinderGeometry args={[0.520, 0.520, 0.024, 48]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* ===================================================================== */}
          {/* DINDING SILINDER PEJAL KOKOH DI SEPANJANG KELILING (Height 0.87m):   */}
          {/* ===================================================================== */}
          {/* 1. Dinding Pejal Antara Yoke Depan dan Serong Kanan Depan (15.5° to 34.1°) */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.87, 16, 1, true, 0.27, 0.325]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* 2. Dinding Atas & Bawah Lubang Serong Kanan Depan (45°) */}
          <mesh position={[0, 0.3525, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.165, 16, 1, true, 0.595, 0.38]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>
          <mesh position={[0, -0.3525, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.165, 16, 1, true, 0.595, 0.38]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* 3. Dinding Pejal Sisi Kanan Poros (55.9° to 124.1°, melewati 90° di belakang bearing!) */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.87, 24, 1, true, 0.975, 1.191]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* 4. Dinding Atas & Bawah Lubang Serong Kanan Belakang (135°) */}
          <mesh position={[0, 0.3525, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.165, 16, 1, true, 2.166, 0.38]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>
          <mesh position={[0, -0.3525, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.165, 16, 1, true, 2.166, 0.38]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* 5. Dinding Silinder Belakang: Sisi Kanan Belakang, Atas Jendela Belakang, & Sisi Kiri Belakang */}
          {/* 5a. Dinding Pejal Antara Serong Kanan Belakang dan Jendela Belakang (145.9° s/d 164.5°) */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.87, 16, 1, true, 2.546, 0.326]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* 5b. Dinding Silinder Jendela Belakang (Atas & Bawah Ambang Jendela) */}
          {/* 5b-top. Dinding Atas Jendela Belakang: y = 0.270m s/d 0.435m */}
          <mesh position={[0, 0.3525, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.165, 16, 1, true, 2.872, 0.54]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>
          {/* 5b-bottom. Dinding Bawah Jendela Belakang (Menutup dari y = -0.435m s/d y = -0.300m agar tidak ada bolongan di bawah ambang jendela) */}
          <mesh position={[0, -0.3675, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.135, 16, 1, true, 2.872, 0.54]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* 5c. Dinding Pejal Antara Jendela Belakang dan Serong Kiri Belakang (195.5° s/d 214.1°) */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.87, 16, 1, true, 3.412, 0.325]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* 6. Dinding Atas & Bawah Lubang Serong Kiri Belakang (225°) */}
          <mesh position={[0, 0.3525, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.165, 16, 1, true, 3.737, 0.38]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>
          <mesh position={[0, -0.3525, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.165, 16, 1, true, 3.737, 0.38]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* 7. Dinding Pejal Sisi Kiri Poros (235.9° to 304.1°, melewati 270° di belakang motor!) */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.87, 24, 1, true, 4.117, 1.191]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* 8. Dinding Atas & Bawah Lubang Serong Kiri Depan (315°) */}
          <mesh position={[0, 0.3525, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.165, 16, 1, true, 5.308, 0.38]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>
          <mesh position={[0, -0.3525, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.165, 16, 1, true, 5.308, 0.38]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* 9. Dinding Pejal Antara Serong Kiri Depan dan Yoke Depan (325.9° to 344.5°) */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.87, 16, 1, true, 5.688, 0.325]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* 10. Dinding Silinder Lubang Jendela Depan (Atas & Bawah) */}
          {/* 10-top. Dinding Atas di Balik Balok Yoke Depan Atas yang Dinaikkan (y = 0.262m s/d 0.435m) */}
          <mesh position={[0, 0.3485, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.173, 16, 1, true, -0.27, 0.54]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>
          {/* 10-bottom. Dinding Bawah di Balik Balok Yoke Depan Bawah (y = -0.435m s/d -0.355m) */}
          <mesh position={[0, -0.395, 0]}>
            <cylinderGeometry args={[0.525, 0.525, 0.080, 16, 1, true, -0.27, 0.54]} />
            <meshStandardMaterial {...shellMatProps} />
          </mesh>

          {/* Interior Heat Shield Cavity Liner (Bebas dari halangan di corong depan: theta = 0.28 to 2*PI - 0.28) */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.44, 0.44, 1.10, 48, 1, true, 0.28, Math.PI * 2 - 0.56]} />
            <meshStandardMaterial color="#0f172a" roughness={0.85} side={THREE.BackSide} />
          </mesh>
        </group>

        {/* ----------------------------------------------------------------------- */}
        {/* 4. FRONT INSPECTION WINDOW & HOUSING (Depan, theta = 0° Sesuai Permintaan User) */}
        {/* - Kotak atas dinaikkan ke yPos = 0.360m (blok abu bawah corong dihilangkan) */}
        {/* - Tinggi lubang jendela diperbesar dan ditinggikan (outerHeight = 0.639m) */}
        {/* - Kotak bawah tetap sejajar dasar tungku (yPos = -0.475m)                */}
        {/* ----------------------------------------------------------------------- */}
        <group name="Front_Inspection_Window" position={[0, 0, 0.525]}>
          {/* Curved Cast Bezel Frame (Ditinggikan & diperbesar lubangnya, rapat tanpa celah) */}
          <CurvedWindowFrame
            yPos={-0.0575}
            outerWidth={0.348}
            outerHeight={0.639}
            cutoutWidth={0.252}
            cutoutTop={0.2955}
            cutoutBottom={-0.2955}
          />

          {/* Upper Magnetic Yoke Block (Dinaikkan mendekati dek corong tuang di y = 0.450m) */}
          <FurnaceMagneticYokeBlock yPos={0.360} height={0.18} width={0.23} />

          {/* Lower Magnetic Yoke Block (Sejajar penuh dengan bagian bawah tungku) */}
          <FurnaceMagneticYokeBlock yPos={-0.475} height={0.18} width={0.23} />
        </group>


        {/* ----------------------------------------------------------------------- */}
        {/* 5. 4 LUBANG OVAL SERONG (2 Depan + 2 Belakang Sesuai Permintaan User):   */}
        {/* (Batang besi/pelat di dalam lubang telah dihilangkan sesuai Gambar 1)    */}
        {/* ----------------------------------------------------------------------- */}
        {/* 1. LUBANG SERONG KANAN DEPAN (theta = 45°) */}
        <OvalInspectionPort
          position={[0.371, 0, 0.371]}
          rotation={[0, Math.PI / 4, 0]}
        />

        {/* 2. LUBANG SERONG KANAN BELAKANG (theta = 135°) */}
        <OvalInspectionPort
          position={[0.371, 0, -0.371]}
          rotation={[0, (3 * Math.PI) / 4, 0]}
        />

        {/* 3. LUBANG SERONG KIRI BELAKANG (theta = 225° / -135°) */}
        <OvalInspectionPort
          position={[-0.371, 0, -0.371]}
          rotation={[0, -(3 * Math.PI) / 4, 0]}
        />

        {/* 4. LUBANG SERONG KIRI DEPAN (theta = 315° / -45°) */}
        <OvalInspectionPort
          position={[-0.371, 0, 0.371]}
          rotation={[0, -Math.PI / 4, 0]}
        />

        {/* ----------------------------------------------------------------------- */}
        {/* 6. REAR INSPECTION WINDOW & HOUSING (Belakang, theta = 180° Sesuai Permintaan User) */}
        {/* - Sesuai Gambar 1: Lubang kotak tidak terlalu ke bawah, apron pejal menutup celah */}
        {/* - Sesuai Gambar 2: Frame ditekuk mengikuti lekukan tungku dan menempel rapat     */}
        {/* ----------------------------------------------------------------------- */}
        <group name="Rear_Inspection_Window" position={[0, 0, -0.525]} rotation={[0, Math.PI, 0]}>
          {/* Curved Cast Bezel Frame (Ditekuk mengikuti kelengkungan tungku & rapat tanpa celah) */}
          {/* Ambang bawah lubang dinaikkan ke y = -0.300m (cutoutBottom = -0.2475), tidak ada bolongan menganga */}
          <CurvedWindowFrame
            yPos={-0.0525}
            outerWidth={0.348}
            outerHeight={0.649}
            cutoutWidth={0.252}
            cutoutTop={0.3005}
            cutoutBottom={-0.2475}
          />

          {/* Upper Magnetic Yoke Block (Dinaikkan ke arah flens atas) */}
          <FurnaceMagneticYokeBlock yPos={0.370} height={0.18} width={0.23} />

          {/* Lower Magnetic Yoke Block (Sejajar penuh dengan bagian bawah tungku) */}
          <FurnaceMagneticYokeBlock yPos={-0.475} height={0.18} width={0.23} />
        </group>

        {/* ----------------------------------------------------------------------- */}
        {/* 7. SAMBUNGAN TERMINAL BUSBAR DAYA & AIR PENDINGIN DI BELAKANG TUNGKU    */}
        {/* Sesuai Foto 2, 4, 5 (Kingsa & Lanshuo): Konduktor tembaga, isolator G10, */}
        {/* plat busbar tembaga ganda dengan 4 baut klem, dan nepel air 45°         */}
        {/* ----------------------------------------------------------------------- */}
        <RearPowerTerminalAssembly />

        {/* ----------------------------------------------------------------------- */}
        {/* 8. TOP SQUARE CHARGING DECK & POURING SPOUT                             */}
        {/* ----------------------------------------------------------------------- */}
        <group position={[0, 0.54, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <extrudeGeometry args={[deckShape, deckExtrudeSettings]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.42} roughness={0.36} />
          </mesh>

          <mesh position={[0, 0.051, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <extrudeGeometry args={[deckShape, checkerExtrudeSettings]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.42} roughness={0.36} />
          </mesh>

          {/* Protective Trim - Frame around deck border (Abu-Putih Serasi dengan Cangkang Tungku) */}
          {[-0.520, 0.520].map((fx, fi) => (
            <mesh key={fi} position={[fx, 0.025, 0]}>
              <boxGeometry args={[0.015, 0.05, 1.05]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.42} roughness={0.36} />
            </mesh>
          ))}
          <mesh position={[0, 0.025, -0.520]}>
            <boxGeometry args={[1.05, 0.05, 0.015]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.42} roughness={0.36} />
          </mesh>
          <mesh position={[-0.315, 0.025, 0.520]}>
            <boxGeometry args={[0.41, 0.05, 0.015]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.42} roughness={0.36} />
          </mesh>
          <mesh position={[0.315, 0.025, 0.520]}>
            <boxGeometry args={[0.41, 0.05, 0.015]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.42} roughness={0.36} />
          </mesh>

          {/* ========================================================================= */}
          {/* MONOLITHIC REFRACTORY & STEEL POURING SPOUT ASSEMBLY (Authentic Kingsa/ABP) */}
          {/* Moncong Mendongak ke Atas (Upturned Pouring Beak Lip) Seperti Cerat Ladle  */}
          {/* ========================================================================= */}
          <group name="Integrated_Pouring_Spout_Assembly">
            {/* 1. Monolithic Solid Refractory Ceramic Pouring Chute (Warna Disamakan dengan Bodi Mesin Tungku) */}
            <mesh geometry={upturnedSpoutGeometry}>
              <meshStandardMaterial
                color="#cbd5e1"
                metalness={0.42}
                roughness={0.36}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* 2. Solid Fabricated Steel Spout Cradle (Dagu / Penopang Baja Pejal Bawah Moncong) */}
            <mesh geometry={spoutCradleGeometry}>
              <meshStandardMaterial color="#cbd5e1" metalness={0.44} roughness={0.34} side={THREE.DoubleSide} />
            </mesh>

            {/* 3. Solid Deck Notch Underside Enclosure (Menutup 100% Rongga Bawah Dek & Moncong agar Bebas Celah) */}
            <mesh position={[0, -0.055, 0.44]}>
              <boxGeometry args={[0.222, 0.110, 0.17]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.42} roughness={0.36} />
            </mesh>

            {/* 5. Glowing Molten Liquid Stream Ribbon in Chute (Aliran Logam Cair Mulus di Dasar Palung Mendongak saat Menuang) */}
            <mesh
              ref={chuteFlowMeshRef}
              visible={false}
              geometry={chuteFlowRibbonGeometry}
            >
              <meshStandardMaterial
                ref={chuteFlowMatRef}
                color="#fbbf24"
                emissive="#ea580c"
                emissiveIntensity={1.1}
                roughness={0.2}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </group>

        {/* ----------------------------------------------------------------------- */}
        {/* 8. MONOLITHIC REFRACTORY TOP COLLAR BLOCK (Authentic Precast Cap Ring)  */}
        {/* Menutup 100% rapat bibir krusibel & koil ke dek tanpa celah bolong.     */}
        {/* Berwarna abu-abu semen tahan api alami (#526070), menyatu mulus ke moncong. */}
        {/* ----------------------------------------------------------------------- */}
        <mesh name="Crucible_Mouth_Refractory_Collar" geometry={refractoryCollarGeometry}>
          <meshStandardMaterial
            color="#526070"
            roughness={0.88}
            metalness={0.08}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* ----------------------------------------------------------------------- */}
        {/* 10. INTERNAL CORE: COIL, CRUCIBLE, SCRAP & LIQUID METAL                 */}
        {/* ----------------------------------------------------------------------- */}
        <Crucible position={[0, -0.02, 0]} />
        <Coil position={[0, -0.02, 0]} />
        <MetalSolid position={[0, -0.04, 0]} />
        <MetalLiquid position={[0, -0.04, 0]} />
        <SlagCoagulantVisualSequence />
      </group>

      {/* ========================================================================= */}
      {/* 4. DYNAMIC VERTICAL MOLTEN POURING STREAM, SPLASH & SPARKS                */}
      {/* ========================================================================= */}
      <group name="VFX_GravityPouringStream">
        <mesh ref={streamMeshRef} visible={false}>
          <cylinderGeometry args={[0.020, 0.015, 1.0, 14]} />
          <meshStandardMaterial
            ref={streamMatRef}
            color="#fbbf24"
            emissive="#ea580c"
            emissiveIntensity={1.15}
            roughness={0.15}
            metalness={0.8}
          />
        </mesh>

        <mesh ref={splashMeshRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1, 32]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#ea580c"
            emissiveIntensity={1.1}
            roughness={0.2}
          />
        </mesh>

        <points ref={sparksRef} geometry={sparkGeo} visible={false}>
          <pointsMaterial
            color="#fbbf24"
            size={0.016}
            transparent
            opacity={0.9}
          />
        </points>
      </group>
    </group>
  );
};

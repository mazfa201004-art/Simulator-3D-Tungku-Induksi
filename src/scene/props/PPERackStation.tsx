import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';
import { FireExtinguisher } from './FireExtinguisher';

interface PPERackStationProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * PPERackStation: Authentic Foundry PPE Corner Station (Pojok APD & APAR Bengkel).
 * - Placed directly in the actual corner of the workshop walls (Back Wall Z=-12m & Left Wall X=-12m).
 * - Back of the steel rack sits 100% flush against the Back Wall.
 * - APAR (apar-dock-1) mounts 100% flush against the adjacent Left Wall in the corner (zero floating).
 * - Features independent individual slots for all foundry K3 equipment:
 *   1. Helm Proyek Kuning (2 slot: Slot 0 Kiri, Slot 1 Tengah)
 *   2. Masker Respirator Cartridge Abu-Abu & Kacamata Safety (mask)
 *   3. Baju Coverall / Wearpack Putih Bertudung (3 slot: Slot 0 Kiri, Slot 1 Tengah, Slot 2 Kanan)
 *   4. Sarung Tangan Kerja Rajut Abu-Abu Gelap (3 slot: Slot 0 Kiri, Slot 1 Tengah, Slot 2 Kanan)
 *   5. Sepatu Boot Safety Kuning Tinggi Bersol Hitam (3 slot: Slot 0 Kiri, Slot 1 Tengah, Slot 2 Kanan)
 */
export const PPERackStation: React.FC<PPERackStationProps> = ({
  position = [-10.9, 0, -11.78],
  rotation = [0, 0, 0],
}) => {
  const setActiveHoverObject = useSimStore((s) => s.setActiveHoverObject);
  const apdItems = useSimStore((s) => s.apdItems);
  const equippedApdSlots = useSimStore((s) => s.equippedApdSlots);
  const interactApdSlot = useSimStore((s) => s.interactApdSlot);
  const isJobOrderModalOpen = useSimStore((s) => s.isJobOrderModalOpen);
  const setJobOrderModalOpen = useSimStore((s) => s.setJobOrderModalOpen);
  const isJobOrderPinned = useSimStore((s) => s.isJobOrderPinned);
  const isInspectionModalOpen = useSimStore((s) => s.isInspectionModalOpen);
  const setInspectionModalOpen = useSimStore((s) => s.setInspectionModalOpen);
  const inspection = useSimStore((s) => s.inspection);

  const inspectionVerifiedCount =
    (inspection.bottom ? 1 : 0) +
    (inspection.wall ? 1 : 0) +
    (inspection.lip ? 1 : 0) +
    (inspection.mold ? 1 : 0);

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setFeedbackToast(null);
    }, 2800);
  };

  const equippedCount =
    (apdItems.helmet ? 1 : 0) +
    (apdItems.mask ? 1 : 0) +
    (apdItems.apron ? 1 : 0) +
    (apdItems.gloves ? 1 : 0) +
    (apdItems.boots ? 1 : 0);

  const allEquipped = equippedCount === 5;

  const handleSlotClick = (
    e: any,
    category: 'helmet' | 'mask' | 'apron' | 'gloves' | 'boots',
    slotIndex: number
  ) => {
    e.stopPropagation();
    inductionAudio.resume();
    inductionAudio.playClick();
    const result = interactApdSlot(category, slotIndex);
    if (result.message) {
      showToast(result.message);
      setActiveHoverObject(result.message);
    }
  };

  const getSlotHoverText = (
    category: 'helmet' | 'mask' | 'apron' | 'gloves' | 'boots',
    slotIndex: number,
    slotName: string
  ) => {
    if (category === 'mask') {
      return equippedApdSlots.mask
        ? 'Dudukan Masker & Kacamata (Klik untuk Menyimpan Kembali)'
        : 'Masker Respirator Cartridge & Kacamata Safety (Klik untuk Memakai)';
    }

    const currentSlot = equippedApdSlots[category];
    if (currentSlot === slotIndex) {
      return `Dudukan Kosong ${slotName} (Klik untuk Menyimpan Kembali)`;
    }
    if (currentSlot === null) {
      return `${slotName} (Klik untuk Memakai)`;
    }
    return `${slotName} (Terkunci: Anda sedang memakai APD ini dari slot lain)`;
  };

  const setHover = (e: any, name: string | null) => {
    e.stopPropagation();
    setHoveredItem(name);
    setActiveHoverObject(name);
    if (typeof document !== 'undefined') {
      document.body.style.cursor = name ? 'pointer' : 'auto';
    }
  };

  const clearHover = (e: any) => {
    e.stopPropagation();
    setHoveredItem(null);
    setActiveHoverObject(null);
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'auto';
    }
  };

  const steelRackMat = { color: '#0f172a', roughness: 0.6, metalness: 0.5 };
  const shelfMat = { color: '#1e293b', roughness: 0.65, metalness: 0.6 };

  return (
    <group position={position} rotation={rotation} name="Prop_PPERackStation_WorkshopCorner">
      {/* ========================================================================= */}
      {/* 1. WORKSHOP CORNER FLOOR DEMARCATION PAD & OVERHEAD LUMINAIRE             */}
      {/* ========================================================================= */}
      <group name="Corner_Safety_Floor_Zone">
        {/* Dark Industrial Floor Mat in the Workshop Corner (Extended to cover Document Desk beside APAR) */}
        <mesh position={[-0.05, 0.003, 1.32]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.1, 3.15]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        {/* Front Yellow Hazard Line */}
        <mesh position={[-0.05, 0.005, 2.88]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.1, 0.09]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
        {/* Right Side Yellow Hazard Line */}
        <mesh position={[0.98, 0.005, 1.32]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[3.15, 0.09]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
        <Text
          position={[0.0, 0.008, 2.70]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.055}
          color="#facc15"
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          AREA POJOK APD, APAR &amp; DOKUMEN KERJA
        </Text>

        {/* Overhead Fluorescent Luminaire Mounted Flush on Back Wall */}
        <group position={[0.0, 2.48, -0.14]}>
          <mesh>
            <boxGeometry args={[1.5, 0.06, 0.12]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.035, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.015, 0.015, 1.4, 10]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 2. WALL-MOUNTED APAR ON LEFT WORKSHOP WALL (X = -12.0m, 100% Flush)       */}
      {/* Local x = -1.095 -> World X = -10.9 - 1.095 = -11.995m (Right on Left Wall) */}
      {/* ========================================================================= */}
      <group position={[-1.095, 0, 0.92]}>
        {/* Floor Demarcation Box Below APAR */}
        <mesh position={[0.32, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.56, 0.56]} />
          <meshBasicMaterial color="#dc2626" />
        </mesh>
        <mesh position={[0.32, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.48, 0.48]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <Text
          position={[0.32, 0.009, 0]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          fontSize={0.038}
          color="#facc15"
          fontWeight="bold"
        >
          APAR K3
        </Text>

        {/* FireExtinguisher mounted directly at x=0 (flush against Left Wall X=-12.0m) */}
        <FireExtinguisher
          id="apar-dock-1"
          position={[0, 1.35, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
      </group>

      {/* ========================================================================= */}
      {/* 2B. OPERATOR DOCUMENT DESK BESIDE APAR ON LEFT WALL (JOB ORDER & INSPEKSI) */}
      {/* Placed at local [-0.74, 0, 2.08] facing +X into the workshop room         */}
      {/* ========================================================================= */}
      <group
        position={[-0.74, 0, 2.08]}
        rotation={[0, Math.PI / 2, 0]}
        name="Operator_Document_Desk_Beside_APAR"
      >
        {/* Wall Signboard Above Document Desk (Flush against Left Wall) */}
        <group position={[0, 1.30, -0.34]}>
          <mesh>
            <boxGeometry args={[1.18, 0.22, 0.025]} />
            <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <boxGeometry args={[1.22, 0.25, 0.015]} />
            <meshStandardMaterial color="#eab308" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.014]}>
            <planeGeometry args={[1.14, 0.19]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          <Text
            position={[0, 0.035, 0.018]}
            fontSize={0.042}
            color="#f8fafc"
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            MEJA DOKUMEN KERJA OPERATOR
          </Text>
          <Text
            position={[0, -0.038, 0.018]}
            fontSize={0.029}
            color="#38bdf8"
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            KLIK KERTAS JOB ORDER ATAU LAPORAN INSPEKSI UNTUK MEMEGANG
          </Text>
        </group>

        {/* Industrial Steel Workbench Frame & Tabletop */}
        {/* Tabletop Surface (1.24m wide x 0.68m deep, at height 0.80m) */}
        <mesh position={[0, 0.80, 0]}>
          <boxGeometry args={[1.24, 0.045, 0.68]} />
          <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.35} />
        </mesh>
        {/* Safety Yellow Front Trim Edge */}
        <mesh position={[0, 0.80, 0.342]}>
          <boxGeometry args={[1.24, 0.046, 0.012]} />
          <meshStandardMaterial color="#eab308" roughness={0.35} />
        </mesh>
        {/* Back Splash Lip against Left Wall */}
        <mesh position={[0, 0.86, -0.325]}>
          <boxGeometry args={[1.24, 0.08, 0.025]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Lower Storage Shelf */}
        <mesh position={[0, 0.26, 0]}>
          <boxGeometry args={[1.14, 0.025, 0.58]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* 4 Square Steel Legs */}
        {[-0.56, 0.56].map((lx, li) =>
          [-0.29, 0.29].map((lz, lzi) => (
            <mesh key={`doc-desk-leg-${li}-${lzi}`} position={[lx, 0.40, lz]}>
              <boxGeometry args={[0.045, 0.78, 0.045]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
            </mesh>
          ))
        )}

        {/* =================================================================== */}
        {/* DOCUMENT 1 (LEFT SLOT ON DESK): KERTAS JOB ORDER (SPK CUSTOMER)     */}
        {/* =================================================================== */}
        <group
          position={[-0.30, 0.826, 0.02]}
          onClick={(e) => {
            e.stopPropagation();
            inductionAudio.resume();
            inductionAudio.playClick();
            const nextState = !isJobOrderModalOpen;
            setJobOrderModalOpen(nextState);
            showToast(
              nextState
                ? 'Kertas Job Order diambil (Tampil di sebelah kanan layar)'
                : 'Kertas Job Order diletakkan kembali di meja'
            );
          }}
          onPointerOver={(e) =>
            setHover(
              e,
              isJobOrderModalOpen
                ? 'Slot Kertas Job Order (Klik untuk Meletakkan Kembali ke Meja)'
                : 'Kertas Job Order / SPK Customer (Klik untuk Mengambil & Membaca di Kanan Layar)'
            )
          }
          onPointerOut={clearHover}
        >
          {!isJobOrderModalOpen ? (
            <group rotation={[0, 0.05, 0]}>
              {/* Wooden Clipboard Backing */}
              <mesh position={[0, 0.006, 0]}>
                <boxGeometry args={[0.36, 0.012, 0.46]} />
                <meshStandardMaterial
                  color={hoveredItem?.includes('Kertas Job Order') ? '#b45309' : '#78350f'}
                  roughness={0.65}
                />
              </mesh>
              {/* Metallic Spring Clip at Top of Clipboard */}
              <mesh position={[0, 0.018, -0.19]}>
                <boxGeometry args={[0.14, 0.018, 0.045]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Crisp White Job Order Paper Sheet */}
              <mesh position={[0, 0.014, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.31, 0.40]} />
                <meshStandardMaterial color="#fcfaf2" roughness={0.5} />
              </mesh>
              {/* Blue Header Strip on Paper */}
              <mesh position={[0, 0.015, -0.14]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.28, 0.06]} />
                <meshBasicMaterial color="#0284c7" />
              </mesh>
              <Text
                position={[0, 0.017, -0.14]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.022}
                color="#ffffff"
                fontWeight="bold"
                anchorX="center"
                anchorY="middle"
              >
                KERTAS JOB ORDER
              </Text>
              <Text
                position={[0, 0.017, -0.06]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.017}
                color="#0f172a"
                fontWeight="bold"
                anchorX="center"
                anchorY="middle"
              >
                SPESIFIKASI &amp; KOMPOSISI 250 KG
              </Text>
              {/* Simulated Table Lines on Paper */}
              {[-0.01, 0.03, 0.07, 0.11].map((pz, pi) => (
                <mesh key={`jo-line-${pi}`} position={[0, 0.015, pz]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.26, 0.008]} />
                  <meshBasicMaterial color="#94a3b8" />
                </mesh>
              ))}
              <Text
                position={[0, 0.017, 0.165]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.018}
                color={isJobOrderPinned ? '#15803d' : '#b45309'}
                fontWeight="bold"
                anchorX="center"
                anchorY="middle"
              >
                {isJobOrderPinned ? '✓ SUDAH DISEMATKAN' : 'KLIK UNTUK AMBIL'}
              </Text>
            </group>
          ) : (
            /* Empty Slot Outline when Paper is Held on Right Side of Screen */
            <group position={[0, 0.003, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.36, 0.46]} />
                <meshBasicMaterial color="#0284c7" transparent opacity={0.28} />
              </mesh>
              <Text
                position={[0, 0.005, -0.03]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.021}
                color="#38bdf8"
                fontWeight="bold"
                anchorX="center"
                anchorY="middle"
              >
                JOB ORDER DIPEGANG
              </Text>
              <Text
                position={[0, 0.005, 0.04]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.017}
                color="#facc15"
                fontWeight="bold"
                anchorX="center"
                anchorY="middle"
              >
                KLIK UNTUK LETAKKAN
              </Text>
            </group>
          )}
        </group>

        {/* =================================================================== */}
        {/* DOCUMENT 2 (RIGHT SLOT ON DESK): KERTAS LAPORAN INSPEKSI            */}
        {/* =================================================================== */}
        <group
          position={[0.30, 0.826, 0.02]}
          onClick={(e) => {
            e.stopPropagation();
            inductionAudio.resume();
            inductionAudio.playClick();
            const nextState = !isInspectionModalOpen;
            setInspectionModalOpen(nextState);
            showToast(
              nextState
                ? 'Kertas Laporan Inspeksi diambil (Tampil di sebelah kanan layar)'
                : 'Kertas Laporan Inspeksi diletakkan kembali di meja'
            );
          }}
          onPointerOver={(e) =>
            setHover(
              e,
              isInspectionModalOpen
                ? 'Slot Kertas Laporan Inspeksi (Klik untuk Meletakkan Kembali ke Meja)'
                : 'Kertas Laporan Inspeksi Krusibel & Cetakan (Klik untuk Mengambil & Memegang di Kanan Layar)'
            )
          }
          onPointerOut={clearHover}
        >
          {!isInspectionModalOpen ? (
            <group rotation={[0, -0.05, 0]}>
              {/* Wooden Clipboard Backing */}
              <mesh position={[0, 0.006, 0]}>
                <boxGeometry args={[0.36, 0.012, 0.46]} />
                <meshStandardMaterial
                  color={hoveredItem?.includes('Kertas Laporan Inspeksi') ? '#b45309' : '#78350f'}
                  roughness={0.65}
                />
              </mesh>
              {/* Metallic Spring Clip at Top of Clipboard */}
              <mesh position={[0, 0.018, -0.19]}>
                <boxGeometry args={[0.14, 0.018, 0.045]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Crisp White Inspection Report Paper Sheet */}
              <mesh position={[0, 0.014, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.31, 0.40]} />
                <meshStandardMaterial color="#fcfaf2" roughness={0.5} />
              </mesh>
              {/* Amber/Emerald Header Strip on Paper */}
              <mesh position={[0, 0.015, -0.14]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.28, 0.06]} />
                <meshBasicMaterial color={inspectionVerifiedCount === 4 ? '#15803d' : '#d97706'} />
              </mesh>
              <Text
                position={[0, 0.017, -0.14]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.020}
                color="#ffffff"
                fontWeight="bold"
                anchorX="center"
                anchorY="middle"
              >
                LAPORAN INSPEKSI
              </Text>
              <Text
                position={[0, 0.017, -0.06]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.016}
                color="#0f172a"
                fontWeight="bold"
                anchorX="center"
                anchorY="middle"
              >
                KRUSIBEL, SPOUT &amp; CETAKAN
              </Text>
              {/* Simulated Checklist Rows on Paper */}
              {[-0.01, 0.03, 0.07, 0.11].map((pz, pi) => (
                <mesh key={`insp-line-${pi}`} position={[0, 0.015, pz]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.26, 0.008]} />
                  <meshBasicMaterial color="#94a3b8" />
                </mesh>
              ))}
              <Text
                position={[0, 0.017, 0.165]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.018}
                color={inspectionVerifiedCount === 4 ? '#15803d' : '#b45309'}
                fontWeight="bold"
                anchorX="center"
                anchorY="middle"
              >
                {inspectionVerifiedCount === 4
                  ? '✓ LULUS [4/4]'
                  : `KLIK AMBIL [${inspectionVerifiedCount}/4]`}
              </Text>
            </group>
          ) : (
            /* Empty Slot Outline when Inspection Paper is Held on Right Side of Screen */
            <group position={[0, 0.003, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.36, 0.46]} />
                <meshBasicMaterial color="#10b981" transparent opacity={0.28} />
              </mesh>
              <Text
                position={[0, 0.005, -0.03]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.020}
                color="#34d399"
                fontWeight="bold"
                anchorX="center"
                anchorY="middle"
              >
                LAPORAN DIPEGANG
              </Text>
              <Text
                position={[0, 0.005, 0.04]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.017}
                color="#facc15"
                fontWeight="bold"
                anchorX="center"
                anchorY="middle"
              >
                KLIK UNTUK LETAKKAN
              </Text>
            </group>
          )}
        </group>
      </group>

      {/* ========================================================================= */}
      {/* 3. STEEL PPE RACK MOUNTED FLUSH AGAINST BACK WORKSHOP WALL (Z = -12.0m)   */}
      {/* Local z = -0.20 -> World Z = -11.78 - 0.20 = -11.98m (Flush on Back Wall)  */}
      {/* ========================================================================= */}
      <group position={[0.0, 0, 0]} name="Steel_PPE_Rack_Assembly">
        {/* Heavy Base Footing Skid */}
        <mesh position={[0, 0.04, -0.02]}>
          <boxGeometry args={[1.52, 0.08, 0.42]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.6} />
        </mesh>

        {/* Main Structural Backing Board (Flush against Back Wall) */}
        <mesh position={[0, 1.12, -0.20]}>
          <boxGeometry args={[1.46, 2.12, 0.03]} />
          <meshStandardMaterial {...steelRackMat} />
        </mesh>

        {/* Safety Yellow Outer Frame Posts */}
        <mesh position={[0, 2.20, -0.19]}>
          <boxGeometry args={[1.50, 0.06, 0.04]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>
        <mesh position={[-0.73, 1.12, -0.19]}>
          <boxGeometry args={[0.06, 2.12, 0.04]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>
        <mesh position={[0.73, 1.12, -0.19]}>
          <boxGeometry args={[0.06, 2.12, 0.04]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>

        {/* Top Header Signboard with 5/5 K3 Readiness Status */}
        <group position={[0, 2.04, -0.17]}>
          <mesh>
            <planeGeometry args={[1.38, 0.22]} />
            <meshStandardMaterial
              color={allEquipped ? '#065f46' : '#1e3a8a'}
              roughness={0.4}
            />
          </mesh>
          <Text
            position={[0, 0.042, 0.005]}
            fontSize={0.05}
            color="#f8fafc"
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            POJOK PENYIMPANAN APD BENGKEL
          </Text>
          <Text
            position={[0, -0.048, 0.005]}
            fontSize={0.031}
            color={allEquipped ? '#34d399' : '#fde047'}
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            {allEquipped
              ? 'STATUS: 5/5 APD LENGKAP • SIAP OPERASI TANUR'
              : `STATUS: ${equippedCount}/5 APD TERPAKAI • KLIK ITEM DI RAK`}
          </Text>
        </group>

        {/* --------------------------------------------------------------------- */}
        {/* TIER 1 (TOP SHELF): HELM PROYEK KUNING & MASKER RESPIRATOR + KACAMATA */}
        {/* --------------------------------------------------------------------- */}
        <mesh position={[0, 1.70, -0.02]}>
          <boxGeometry args={[1.40, 0.03, 0.36]} />
          <meshStandardMaterial {...shelfMat} />
        </mesh>

        {/* ITEM 1: HELM PROYEK SAFETY KUNING - SLOT 0 KIRI (Interactive) */}
        <group
          position={[-0.42, 1.73, 0.0]}
          onClick={(e) => handleSlotClick(e, 'helmet', 0)}
          onPointerOver={(e) =>
            setHover(e, getSlotHoverText('helmet', 0, 'Helm Proyek Safety Kuning #1 (Kiri)'))
          }
          onPointerOut={clearHover}
        >
          {equippedApdSlots.helmet !== 0 ? (
            <group>
              {/* Yellow Hard Hat Dome */}
              <mesh position={[0, 0.02, 0]}>
                <sphereGeometry
                  args={[0.115, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]}
                />
                <meshStandardMaterial
                  color={hoveredItem?.includes('Helm Proyek Safety Kuning #1') ? '#fde047' : '#eab308'}
                  roughness={0.25}
                  metalness={0.1}
                />
              </mesh>
              {/* Raised Top Crown Reinforcement Ridge */}
              <mesh position={[0, 0.125, 0]}>
                <boxGeometry args={[0.03, 0.022, 0.19]} />
                <meshStandardMaterial color="#ca8a04" roughness={0.3} />
              </mesh>
              {/* Front Hard Hat Visor Brim */}
              <mesh position={[0, 0.022, 0.095]} rotation={[0.15, 0, 0]}>
                <boxGeometry args={[0.18, 0.01, 0.065]} />
                <meshStandardMaterial color="#eab308" roughness={0.25} />
              </mesh>
              {/* Dark Chin Strap */}
              <mesh position={[0, 0.01, 0.01]} rotation={[0, 0, 0]}>
                <torusGeometry args={[0.085, 0.006, 6, 14, Math.PI]} />
                <meshStandardMaterial color="#0f172a" roughness={0.8} />
              </mesh>
            </group>
          ) : (
            <group position={[0, 0.005, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.07, 0.095, 18]} />
                <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}
        </group>

        {/* ITEM 1B: HELM PROYEK SAFETY KUNING - SLOT 1 TENGAH (Interactive) */}
        <group
          position={[-0.08, 1.73, 0.0]}
          onClick={(e) => handleSlotClick(e, 'helmet', 1)}
          onPointerOver={(e) =>
            setHover(e, getSlotHoverText('helmet', 1, 'Helm Proyek Safety Kuning #2 (Tengah)'))
          }
          onPointerOut={clearHover}
        >
          {equippedApdSlots.helmet !== 1 ? (
            <group>
              <mesh position={[0, 0.02, 0]}>
                <sphereGeometry args={[0.11, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
                <meshStandardMaterial
                  color={hoveredItem?.includes('Helm Proyek Safety Kuning #2') ? '#fde047' : '#eab308'}
                  roughness={0.28}
                />
              </mesh>
              <mesh position={[0, 0.12, 0]}>
                <boxGeometry args={[0.028, 0.02, 0.18]} />
                <meshStandardMaterial color="#ca8a04" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.02, 0.09]} rotation={[0.15, 0, 0]}>
                <boxGeometry args={[0.17, 0.01, 0.06]} />
                <meshStandardMaterial
                  color={hoveredItem?.includes('Helm Proyek Safety Kuning #2') ? '#fde047' : '#eab308'}
                  roughness={0.28}
                />
              </mesh>
            </group>
          ) : (
            <group position={[0, 0.005, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.065, 0.09, 16]} />
                <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}
        </group>

        {/* ITEM 2: MASKER RESPIRATOR CARTRIDGE ABU-ABU & KACAMATA SAFETY (Interactive) */}
        <group
          position={[0.36, 1.80, 0.0]}
          onClick={(e) => handleSlotClick(e, 'mask', 0)}
          onPointerOver={(e) =>
            setHover(e, getSlotHoverText('mask', 0, 'Masker Respirator Cartridge & Kacamata Safety'))
          }
          onPointerOut={clearHover}
        >
          {/* Small Stand Pedestal */}
          <mesh position={[0, -0.05, -0.02]}>
            <cylinderGeometry args={[0.02, 0.04, 0.06, 10]} />
            <meshStandardMaterial color="#475569" metalness={0.6} />
          </mesh>

          {!equippedApdSlots.mask ? (
            <group>
              {/* Clear Safety Goggles (Top) */}
              <group position={[0, 0.055, 0.02]}>
                {/* Black Goggle Frame */}
                <mesh position={[0, 0.018, 0]}>
                  <boxGeometry args={[0.15, 0.014, 0.025]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.5} />
                </mesh>
                {/* Clear Lens */}
                <mesh position={[0, -0.004, 0.005]}>
                  <boxGeometry args={[0.142, 0.042, 0.012]} />
                  <meshStandardMaterial
                    color="#e0f2fe"
                    transparent
                    opacity={0.65}
                    roughness={0.15}
                    metalness={0.3}
                  />
                </mesh>
                {/* Black Elastic Headband */}
                <mesh position={[0, 0.005, -0.035]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.068, 0.006, 6, 14]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.8} />
                </mesh>
              </group>

              {/* Half-Face Cartridge Respirator Mask (Bottom) */}
              <group position={[0, -0.015, 0.02]}>
                {/* Dark Grey Facepiece Body */}
                <mesh scale={[0.95, 1.05, 1.0]}>
                  <sphereGeometry args={[0.058, 12, 10]} />
                  <meshStandardMaterial
                    color={hoveredItem?.includes('Masker') ? '#64748b' : '#334155'}
                    roughness={0.6}
                  />
                </mesh>
                {/* Light Grey Front Filter Holder Collar */}
                <mesh position={[0, -0.006, 0.052]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.042, 0.046, 0.024, 14]} />
                  <meshStandardMaterial color="#94a3b8" roughness={0.4} />
                </mesh>
                {/* Prominent Round Light-Grey Filter Cartridge (Sesuai Foto) */}
                <mesh position={[0, -0.008, 0.076]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.038, 0.038, 0.028, 14]} />
                  <meshStandardMaterial color="#cbd5e1" roughness={0.35} />
                </mesh>
                {/* Filter Intake Center Vent */}
                <mesh position={[0, -0.008, 0.091]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.022, 0.022, 0.004, 12]} />
                  <meshStandardMaterial color="#475569" roughness={0.7} />
                </mesh>
              </group>
            </group>
          ) : (
            <mesh position={[0, -0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.05, 0.075, 16]} />
              <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>

        {/* --------------------------------------------------------------------- */}
        {/* TIER 2 (HANGING RAIL): BAJU COVERALL / WEARPACK PUTIH BERTUDUNG       */}
        {/* --------------------------------------------------------------------- */}
        <mesh position={[0, 1.50, -0.14]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 1.34, 10]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* ITEM 3: BAJU COVERALL PUTIH BERTUDUNG - SLOT 0 KIRI (Interactive) */}
        <group
          position={[-0.38, 1.15, -0.10]}
          onClick={(e) => handleSlotClick(e, 'apron', 0)}
          onPointerOver={(e) =>
            setHover(e, getSlotHoverText('apron', 0, 'Baju Coverall / Wearpack Putih #1 (Kiri)'))
          }
          onPointerOut={clearHover}
        >
          {/* Metal Hanger Hook */}
          <mesh position={[0, 0.33, -0.02]}>
            <torusGeometry args={[0.028, 0.005, 6, 12, Math.PI]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} />
          </mesh>

          {equippedApdSlots.apron !== 0 ? (
            <group>
              {/* White Protective Hood (Tudung Kepala Putih) */}
              <mesh position={[0, 0.24, 0]}>
                <sphereGeometry args={[0.072, 12, 10]} />
                <meshStandardMaterial
                  color={hoveredItem?.includes('Coverall') ? '#e0f2fe' : '#f8fafc'}
                  roughness={0.65}
                />
              </mesh>
              {/* Hood Face Opening */}
              <mesh position={[0, 0.24, 0.066]}>
                <circleGeometry args={[0.042, 12]} />
                <meshBasicMaterial color="#1e293b" />
              </mesh>

              {/* Main White Coverall Torso */}
              <mesh position={[0, 0.04, 0]}>
                <boxGeometry args={[0.24, 0.30, 0.045]} />
                <meshStandardMaterial
                  color={hoveredItem?.includes('Coverall') ? '#e0f2fe' : '#f8fafc'}
                  roughness={0.65}
                />
              </mesh>
              {/* Front Center Zipper Seam & Waist Line */}
              <mesh position={[0, 0.04, 0.024]}>
                <boxGeometry args={[0.008, 0.29, 0.004]} />
                <meshStandardMaterial color="#cbd5e1" />
              </mesh>
              <mesh position={[0, -0.03, 0]}>
                <boxGeometry args={[0.245, 0.012, 0.048]} />
                <meshStandardMaterial color="#e2e8f0" />
              </mesh>

              {/* Left & Right Long White Sleeves */}
              <mesh position={[-0.145, 0.05, 0]} rotation={[0, 0, 0.16]}>
                <cylinderGeometry args={[0.034, 0.028, 0.26, 8]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.65} />
              </mesh>
              <mesh position={[0.145, 0.05, 0]} rotation={[0, 0, -0.16]}>
                <cylinderGeometry args={[0.034, 0.028, 0.26, 8]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.65} />
              </mesh>

              {/* Left & Right Coverall Pants Legs */}
              <mesh position={[-0.062, -0.20, 0]}>
                <cylinderGeometry args={[0.048, 0.040, 0.22, 8]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.65} />
              </mesh>
              <mesh position={[0.062, -0.20, 0]}>
                <cylinderGeometry args={[0.048, 0.040, 0.22, 8]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.65} />
              </mesh>
            </group>
          ) : (
            <mesh position={[0, 0.26, -0.02]}>
              <cylinderGeometry args={[0.006, 0.006, 0.10, 8]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
          )}
        </group>

        {/* 2 Spare White Hooded Coveralls Hanging on Right Side - SLOT 1 & 2 (Interactive) */}
        {[0.04, 0.42].map((ax, ai) => {
          const slotIdx = ai + 1;
          const slotName = `Baju Coverall / Wearpack Putih #${slotIdx + 1} (${ai === 0 ? 'Tengah' : 'Kanan'})`;
          return (
            <group
              key={`coverall-spare-${ai}`}
              position={[ax, 1.15, -0.10]}
              onClick={(e) => handleSlotClick(e, 'apron', slotIdx)}
              onPointerOver={(e) => setHover(e, getSlotHoverText('apron', slotIdx, slotName))}
              onPointerOut={clearHover}
            >
              {equippedApdSlots.apron !== slotIdx ? (
                <group>
                  <mesh position={[0, 0.33, -0.02]}>
                    <torusGeometry args={[0.028, 0.005, 6, 12, Math.PI]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.85} />
                  </mesh>
                  <mesh position={[0, 0.24, 0]}>
                    <sphereGeometry args={[0.068, 10, 8]} />
                    <meshStandardMaterial
                      color={hoveredItem?.includes(slotName) ? '#ffffff' : '#f1f5f9'}
                      roughness={0.7}
                    />
                  </mesh>
                  <mesh position={[0, 0.04, 0]}>
                    <boxGeometry args={[0.22, 0.29, 0.04]} />
                    <meshStandardMaterial
                      color={hoveredItem?.includes(slotName) ? '#ffffff' : '#f1f5f9'}
                      roughness={0.7}
                    />
                  </mesh>
                  <mesh position={[-0.135, 0.05, 0]} rotation={[0, 0, 0.15]}>
                    <cylinderGeometry args={[0.032, 0.026, 0.25, 8]} />
                    <meshStandardMaterial
                      color={hoveredItem?.includes(slotName) ? '#ffffff' : '#f1f5f9'}
                      roughness={0.7}
                    />
                  </mesh>
                  <mesh position={[0.135, 0.05, 0]} rotation={[0, 0, -0.15]}>
                    <cylinderGeometry args={[0.032, 0.026, 0.25, 8]} />
                    <meshStandardMaterial
                      color={hoveredItem?.includes(slotName) ? '#ffffff' : '#f1f5f9'}
                      roughness={0.7}
                    />
                  </mesh>
                  <mesh position={[-0.058, -0.19, 0]}>
                    <cylinderGeometry args={[0.044, 0.038, 0.20, 8]} />
                    <meshStandardMaterial
                      color={hoveredItem?.includes(slotName) ? '#ffffff' : '#f1f5f9'}
                      roughness={0.7}
                    />
                  </mesh>
                  <mesh position={[0.058, -0.19, 0]}>
                    <cylinderGeometry args={[0.044, 0.038, 0.20, 8]} />
                    <meshStandardMaterial
                      color={hoveredItem?.includes(slotName) ? '#ffffff' : '#f1f5f9'}
                      roughness={0.7}
                    />
                  </mesh>
                </group>
              ) : (
                <mesh position={[0, 0.26, -0.02]}>
                  <cylinderGeometry args={[0.005, 0.005, 0.08, 8]} />
                  <meshBasicMaterial color="#10b981" />
                </mesh>
              )}
            </group>
          );
        })}

        {/* --------------------------------------------------------------------- */}
        {/* TIER 3 (MIDDLE SHELF): SARUNG TANGAN KERJA RAJUT ABU-ABU GELAP        */}
        {/* --------------------------------------------------------------------- */}
        <mesh position={[0, 0.72, -0.02]}>
          <boxGeometry args={[1.40, 0.03, 0.36]} />
          <meshStandardMaterial {...shelfMat} />
        </mesh>

        {/* ITEM 4: SARUNG TANGAN KERJA ABU-ABU GELAP - SLOT 0 KIRI (Interactive) */}
        <group
          position={[-0.36, 0.76, 0.0]}
          onClick={(e) => handleSlotClick(e, 'gloves', 0)}
          onPointerOver={(e) =>
            setHover(e, getSlotHoverText('gloves', 0, 'Sarung Tangan Kerja Rajut Abu-Abu #1 (Kiri)'))
          }
          onPointerOut={clearHover}
        >
          {equippedApdSlots.gloves !== 0 ? (
            <group>
              {[-0.058, 0.058].map((gx, gi) => (
                <group key={`glove-hand-${gi}`} position={[gx, 0, 0]}>
                  {/* Dark Ribbed Wrist Cuff */}
                  <mesh position={[0, 0, -0.065]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.028, 0.03, 0.048, 8]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.85} />
                  </mesh>
                  {/* Charcoal Knit Palm Body */}
                  <mesh position={[0, 0, -0.005]}>
                    <boxGeometry args={[0.066, 0.022, 0.082]} />
                    <meshStandardMaterial
                      color={hoveredItem?.includes('Sarung Tangan Kerja Rajut Abu-Abu #1') ? '#64748b' : '#334155'}
                      roughness={0.8}
                    />
                  </mesh>
                  {/* 4 Knit Fingers */}
                  {[-0.022, -0.007, 0.007, 0.022].map((fx, fi) => (
                    <mesh
                      key={`f-${fi}`}
                      position={[fx, 0, 0.056]}
                      rotation={[Math.PI / 2, 0, 0]}
                    >
                      <cylinderGeometry args={[0.007, 0.006, 0.05, 6]} />
                      <meshStandardMaterial
                        color={hoveredItem?.includes('Sarung Tangan Kerja Rajut Abu-Abu #1') ? '#64748b' : '#334155'}
                        roughness={0.8}
                      />
                    </mesh>
                  ))}
                  {/* Thumb */}
                  <mesh
                    position={[gi === 0 ? 0.04 : -0.04, 0, 0.012]}
                    rotation={[Math.PI / 2, 0, gi === 0 ? -0.45 : 0.45]}
                  >
                    <cylinderGeometry args={[0.008, 0.007, 0.042, 6]} />
                    <meshStandardMaterial color="#334155" roughness={0.8} />
                  </mesh>
                </group>
              ))}
            </group>
          ) : (
            <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.22, 0.22]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.65} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>

        {/* Spare Dark Grey Gloves on Shelf - SLOT 1 & 2 (Interactive) */}
        {[0.04, 0.40].map((sx, si) => {
          const slotIdx = si + 1;
          const slotName = `Sarung Tangan Kerja Rajut Abu-Abu #${slotIdx + 1} (${si === 0 ? 'Tengah' : 'Kanan'})`;
          return (
            <group
              key={`gloves-spare-${si}`}
              position={[sx, 0.76, 0.0]}
              onClick={(e) => handleSlotClick(e, 'gloves', slotIdx)}
              onPointerOver={(e) => setHover(e, getSlotHoverText('gloves', slotIdx, slotName))}
              onPointerOut={clearHover}
            >
              {equippedApdSlots.gloves !== slotIdx ? (
                <group>
                  {[-0.052, 0.052].map((gx, gi) => (
                    <group key={`sp-g-${gi}`} position={[gx, 0, 0]}>
                      <mesh position={[0, 0, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.026, 0.028, 0.045, 8]} />
                        <meshStandardMaterial color="#1e293b" roughness={0.85} />
                      </mesh>
                      <mesh position={[0, 0, 0.01]}>
                        <boxGeometry args={[0.062, 0.022, 0.11]} />
                        <meshStandardMaterial
                          color={hoveredItem?.includes(slotName) ? '#64748b' : '#334155'}
                          roughness={0.8}
                        />
                      </mesh>
                    </group>
                  ))}
                </group>
              ) : (
                <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.18, 0.18]} />
                  <meshBasicMaterial color="#10b981" transparent opacity={0.65} side={THREE.DoubleSide} />
                </mesh>
              )}
            </group>
          );
        })}

        {/* --------------------------------------------------------------------- */}
        {/* TIER 4 (BOTTOM SHELF): SEPATU BOOT SAFETY KUNING TINGGI BERSOL HITAM  */}
        {/* --------------------------------------------------------------------- */}
        <mesh position={[0, 0.26, -0.02]}>
          <boxGeometry args={[1.40, 0.03, 0.36]} />
          <meshStandardMaterial {...shelfMat} />
        </mesh>

        {/* ITEM 5: SEPATU BOOT SAFETY KUNING BERSOL HITAM - SLOT 0 KIRI (Interactive) */}
        <group
          position={[-0.38, 0.28, -0.01]}
          onClick={(e) => handleSlotClick(e, 'boots', 0)}
          onPointerOver={(e) =>
            setHover(e, getSlotHoverText('boots', 0, 'Sepatu Boot Safety Kuning #1 (Kiri)'))
          }
          onPointerOut={clearHover}
        >
          {equippedApdSlots.boots !== 0 ? (
            <group>
              {[-0.062, 0.062].map((bx, bi) => (
                <group key={`boot-pair-${bi}`} position={[bx, 0, 0]}>
                  {/* Tall Bright Yellow Boot Shaft (Sesuai Foto) */}
                  <mesh position={[0, 0.13, -0.015]}>
                    <cylinderGeometry args={[0.043, 0.037, 0.21, 12]} />
                    <meshStandardMaterial
                      color={hoveredItem?.includes('Sepatu Boot Safety Kuning #1') ? '#fde047' : '#eab308'}
                      roughness={0.3}
                    />
                  </mesh>
                  {/* Yellow Instep & Rounded Toe Vamp */}
                  <mesh position={[0, 0.038, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.035, 0.039, 0.14, 10]} />
                    <meshStandardMaterial
                      color={hoveredItem?.includes('Sepatu Boot Safety Kuning #1') ? '#fde047' : '#eab308'}
                      roughness={0.3}
                    />
                  </mesh>
                  {/* Thick Black Rubber Lugged Sole (Sol Hitam Tebal Sesuai Foto) */}
                  <mesh position={[0, 0.012, 0.022]}>
                    <boxGeometry args={[0.082, 0.024, 0.185]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.85} />
                  </mesh>
                </group>
              ))}
            </group>
          ) : (
            <mesh position={[0, 0.005, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.22, 0.22]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.65} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>

        {/* Spare Tall Yellow Safety Boots with Black Soles - SLOT 1 & 2 (Interactive) */}
        {[0.02, 0.40].map((sx, si) => {
          const slotIdx = si + 1;
          const slotName = `Sepatu Boot Safety Kuning #${slotIdx + 1} (${si === 0 ? 'Tengah' : 'Kanan'})`;
          return (
            <group
              key={`boot-spare-${si}`}
              position={[sx, 0.28, -0.01]}
              onClick={(e) => handleSlotClick(e, 'boots', slotIdx)}
              onPointerOver={(e) => setHover(e, getSlotHoverText('boots', slotIdx, slotName))}
              onPointerOut={clearHover}
            >
              {equippedApdSlots.boots !== slotIdx ? (
                <group>
                  {[-0.058, 0.058].map((bx, bi) => (
                    <group key={`sp-b-${bi}`} position={[bx, 0, 0]}>
                      <mesh position={[0, 0.125, -0.015]}>
                        <cylinderGeometry args={[0.041, 0.036, 0.20, 10]} />
                        <meshStandardMaterial
                          color={hoveredItem?.includes(slotName) ? '#fde047' : '#eab308'}
                          roughness={0.35}
                        />
                      </mesh>
                      <mesh position={[0, 0.036, 0.028]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.034, 0.038, 0.13, 10]} />
                        <meshStandardMaterial
                          color={hoveredItem?.includes(slotName) ? '#fde047' : '#eab308'}
                          roughness={0.35}
                        />
                      </mesh>
                      <mesh position={[0, 0.012, 0.02]}>
                        <boxGeometry args={[0.078, 0.024, 0.175]} />
                        <meshStandardMaterial color="#0f172a" roughness={0.85} />
                      </mesh>
                    </group>
                  ))}
                </group>
              ) : (
                <mesh position={[0, 0.005, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.18, 0.18]} />
                  <meshBasicMaterial color="#10b981" transparent opacity={0.65} side={THREE.DoubleSide} />
                </mesh>
              )}
            </group>
          );
        })}

        {/* Floating 3D Feedback Toast Banner (Warning / Confirmation) */}
        {feedbackToast && (
          <group position={[0, 2.58, 0]}>
            <mesh>
              <planeGeometry args={[1.40, 0.18]} />
              <meshBasicMaterial color={feedbackToast.includes('sudah memakai') ? '#b91c1c' : '#059669'} />
            </mesh>
            <Text
              position={[0, 0, 0.01]}
              fontSize={0.032}
              color="#ffffff"
              fontWeight="bold"
              anchorX="center"
              anchorY="middle"
              maxWidth={1.35}
            >
              {feedbackToast}
            </Text>
          </group>
        )}

        {/* Floating 3D Tooltip Over Active Hovered Item */}
        {hoveredItem && !feedbackToast && (
          <group position={[0, 2.38, 0]}>
            <mesh>
              <planeGeometry args={[1.15, 0.16]} />
              <meshBasicMaterial color="#0284c7" />
            </mesh>
            <Text
              position={[0, 0, 0.01]}
              fontSize={0.034}
              color="#ffffff"
              fontWeight="bold"
              anchorX="center"
              anchorY="middle"
            >
              {hoveredItem}
            </Text>
          </group>
        )}
      </group>
    </group>
  );
};

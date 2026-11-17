import { create } from 'zustand';
import {
  SimState,
  SimInputs,
  createInitialSimState,
  stepSimulation,
  mixAlloyBatch,
} from '../sim/engine';
import { ALUMINUM_PROPERTIES, METAL_PRESETS, MetalProperties } from '../sim/materials';
import { SimulationPhase } from '../sim/phase';
import { inductionAudio } from '../scene/fx/InductionAudio';
import {
  JobOrderType,
  JOB_ORDER_PRESETS,
  STORYBOARD_SCENES,
  StoryboardScene,
  calculateStudentScore,
} from '../sim/storyboardData';

export type SopStep = StoryboardScene;
export const SOP_STEPS = STORYBOARD_SCENES;
export { JOB_ORDER_PRESETS, calculateStudentScore };

export const ALL_JOB_ORDERS: JobOrderType[] = ['FC_150', 'FC_250', 'FC_300', 'FCD_450', 'FCD_500'];

export const getRandomJobOrder = (): JobOrderType => {
  const idx = Math.floor(Math.random() * ALL_JOB_ORDERS.length);
  return ALL_JOB_ORDERS[idx];
};

export const getMaterialKeyForJob = (job: JobOrderType): string => {
  switch (job) {
    case 'FC_150': return 'fc150';
    case 'FC_250': return 'fc250';
    case 'FC_300': return 'fc300';
    case 'FCD_450': return 'fcd450';
    case 'FCD_500': return 'fcd500';
    default: return 'fc250';
  }
};

export interface HistoryPoint {
  timeSec: number;
  tempC: number;
  meltFraction: number;
  powerFraction: number;
  phase: SimulationPhase;
}

export type CameraPreset =
  | 'overview'
  | 'cabinet'
  | 'cabinet-niche'
  | 'furnace'
  | 'ladle'
  | 'control-box'
  | 'mold-gear'
  | 'mold-propeller'
  | 'mold-ingot'
  | 'mold-valve'
  | 'depot'
  | 'ppe-rack'
  | 'utility-panels'
  | 'platform'
  | 'lance';

export type CameraMode = 'orbit' | 'pov';

export type CraneDestination =
  | 'furnace'
  | 'mold-gear'
  | 'mold-propeller'
  | 'mold-ingot'
  | 'mold-valve'
  | 'standby'
  | 'manual';

export const CRANE_PRESET_POSITIONS: Record<Exclude<CraneDestination, 'manual'>, [number, number, number]> = {
  furnace: [0.0, 0, 1.16],
  'mold-ingot': [7.8, 0, -3.6],
  'mold-valve': [7.8, 0, 0.0],
  'mold-gear': [7.8, 0, 3.6],
  'mold-propeller': [7.8, 0, 7.2],
  standby: [4.0, 0, 0.0],
};

export interface HeatRecipe {
  heatNumber: string;        // e.g. "25 E 103"
  targetGrade: string;       // e.g. "SUS 310"
  baseReturnKg: number;      // e.g. 70 kg (Rt)
  baseScrapKg: number;       // e.g. 80 kg (Scrap SUS 310)
  alloyFeCrKg: number;       // e.g. 7.0 kg (FeCr LC)
  alloyNiKg: number;         // e.g. 1.42 kg (Ni)
  fluxCaSiKg: number;        // e.g. 0.6 kg (CaSi)
  alloyFeSiKg?: number;      // e.g. 0.5 kg (FeSi 75)
  carbonKg?: number;         // e.g. 0.15 kg (Recarburizer)
  slagCoagulantKg?: number;  // e.g. 0.5 kg (Slag Remover)
  totalWeightKg?: number;
}

export type PerformanceProfile = 'ultra' | 'lite';

export const DEFAULT_HEAT_RECIPE: HeatRecipe = {
  heatNumber: '25 E 103',
  targetGrade: 'SUS 310',
  baseReturnKg: 70,
  baseScrapKg: 80,
  alloyFeCrKg: 7.0,
  alloyNiKg: 1.42,
  fluxCaSiKg: 0.6,
  totalWeightKg: 159.02,
};

export interface SimStoreState {
  // --- STORYBOARD 20-SCENE PRACTICUM STATE ---
  // 1. Job Order System
  jobOrder: JobOrderType;
  isJobOrderModalOpen: boolean;
  isJobOrderPinned: boolean;
  setJobOrderModalOpen: (open: boolean) => void;
  pinJobOrderToHud: () => void;
  randomizeJobOrder: () => void;

  // 2. K3 APD System
  isPpeModalOpen: boolean;
  setPpeModalOpen: (open: boolean) => void;
  apdItems: { helmet: boolean; mask: boolean; apron: boolean; gloves: boolean; boots: boolean };
  equippedApdSlots: {
    helmet: number | null;
    mask: boolean;
    apron: number | null;
    gloves: number | null;
    boots: number | null;
  };
  interactApdSlot: (
    category: 'helmet' | 'mask' | 'apron' | 'gloves' | 'boots',
    slotIndex: number
  ) => { success: boolean; message?: string; action?: 'equipped' | 'unequipped' | 'blocked' };
  toggleApdItem: (key: 'helmet' | 'mask' | 'apron' | 'gloves' | 'boots') => void;

  // 3. Inspection System
  isInspectionModalOpen: boolean;
  setInspectionModalOpen: (open: boolean) => void;
  inspection: { bottom: boolean; wall: boolean; lip: boolean; mold: boolean };
  verifyInspectionPoint: (point: 'bottom' | 'wall' | 'lip' | 'mold') => void;
  activeInspectionScanPoint: 'bottom' | 'wall' | 'lip' | 'mold' | null;
  trigger3DInspectionScan: (point: 'bottom' | 'wall' | 'lip' | 'mold') => void;
  emergencyVerified: boolean;
  aparVerified: boolean;
  verifyEstopAndApar: () => void;
  isAparModalOpen: boolean;
  setAparModalOpen: (open: boolean) => void;
  verifyEmergencyStopOnly: () => void;
  verifyAparOnly: () => void;

  // 4. Utility & Power Controls
  panelBreakerOn: boolean;
  setPanelBreaker: (on: boolean) => void;
  coolingTowerSwitchOn: boolean;
  setCoolingTowerSwitch: (on: boolean) => void;
  coolingPumpSwitchOn: boolean;
  setCoolingPumpSwitch: (on: boolean) => void;
  waterPressureBar: number;

  bushbar1On: boolean;
  bushbar2On: boolean;
  setBushbar1: (on: boolean) => void;
  setBushbar2: (on: boolean) => void;
  controlPowerKeyOn: boolean;
  setControlPowerKey: (on: boolean) => void;
  ac1On: boolean;
  setAc1: (on: boolean) => void;
  ac2Pressed: boolean;
  pressAc2: () => void;
  potensioKw: number;
  setPotensioKw: (kw: number) => void;
  preheatTimerRemaining: number;
  isPreheatDone: boolean;

  // 5. Formula, Scrap & Charging
  isMeltingJobSheetOpen: boolean;
  setMeltingJobSheetOpen: (open: boolean) => void;
  isScrapSortingModalOpen: boolean;
  setScrapSortingModalOpen: (open: boolean) => void;
  isSequentialChargingModalOpen: boolean;
  setSequentialChargingModalOpen: (open: boolean) => void;
  selectedFormula: JobOrderType | null;
  setSelectedFormula: (formula: JobOrderType) => void;
  isAlloyVerified: boolean;
  verifyAlloyDose: () => void;
  scrapSortedDry: boolean;
  setScrapSortedDry: (dry: boolean) => void;
  chargingStep: number;
  advanceChargingStep: (step: number) => void;

  // 6. Quality & Tapping & Single Sand Mold
  slagCoagulantAdded: boolean;
  addSlagCoagulant: () => void;
  chemSampleVerified: boolean;
  verifyChemSample: () => void;
  ladlePreheatedVerified: boolean;
  verifyLadlePreheated: () => void;
  fcdReactionActive: boolean;

  singleMoldFillLevel: number;
  pigMoldFillLevel: number;
  isSingleMoldCooling: boolean;
  isSingleMoldSolid: boolean;
  setSingleMoldState: (updates: { isCooling?: boolean; isSolid?: boolean; fillLevel?: number }) => void;
  pourToSingleSandMold: (amount: number) => void;
  pourToPigMold: (amount: number) => void;

  // 7. Shutdown & Time-Lapse & Evaluation
  shutdownPotensioZero: boolean;
  shutdownAc2Off: boolean;
  shutdownBushbarOff: boolean;
  shutdownCoolingTowerOff: boolean;
  shutdownPanelBreakerOff: boolean;
  shutdownCoolingPumpOff: boolean;
  timeLapse5HoursActive: boolean;
  timeLapse5HoursDone: boolean;
  startTimeLapse5Hours: () => void;

  isReportCardOpen: boolean;
  setReportCardOpen: (open: boolean) => void;
  // Performance and Launcher Management
  isAppLaunched: boolean;
  isAboutModalOpen: boolean;
  setAboutModalOpen: (open: boolean) => void;
  isTutorialGuideOpen: boolean;
  setTutorialGuideOpen: (open: boolean) => void;
  performanceProfile: PerformanceProfile;
  setPerformanceProfile: (profile: PerformanceProfile) => void;
  launchSimulation: (profile?: PerformanceProfile) => void;
  setIsAppLaunched: (launched: boolean) => void;

  // Facility Master & Safety Circuit Logic
  transformerBreakerOn: boolean;
  masterPowerOn: boolean;
  emergencyTripped: boolean;

  // Material & Capacity Selection
  materialKey: string;
  selectedMaterial: MetalProperties;

  // User Inputs
  coilOn: boolean;
  powerSetpoint: number;
  timeScale: number;

  // Mechanical Tilting & Pouring State
  tiltAngle: number;
  isTiltingForward: boolean;
  isTiltingBackward: boolean;
  ladleFilledFraction: number;
  isPouringStreamActive: boolean;
  pouringTarget: 'ladle' | 'mold';
  tiltPowerOn: boolean;
  tiltPermit: boolean;
  xrayMode: boolean;

  // Real-time Physics State
  sim: SimState;

  // Mass & Metallurgy Management
  furnaceMetalMassKg: number;
  isColdChargeLoaded: boolean;
  isAlloysAdded: boolean;
  slagMassKg: number;
  isDeslagged: boolean;
  interlockFaultReason: string | null;

  // Temperature & Power History Ring Buffer for 3D Graph
  history: HistoryPoint[];
  lastHistorySampleTime: number;

  // Camera and Audio Diegetic Interaction State
  cameraPreset: CameraPreset;
  cameraMode: CameraMode;
  joystickVector: { x: number; y: number };
  setJoystickVector: (vec: { x: number; y: number }) => void;
  isRemoteHeld: boolean;
  audioEnabled: boolean;
  activeHoverObject: string | null;
  isDragging3DControl: boolean;

  // Actions
  setIsDragging3DControl: (dragging: boolean) => void;
  setTransformerBreaker: (on: boolean) => void;
  toggleTransformerBreaker: () => void;
  setMasterPower: (on: boolean) => void;
  triggerEmergencyStop: () => void;
  resetEmergencyStop: () => void;
  setMaterial: (key: string) => void;
  setPouringTarget: (target: 'ladle' | 'mold') => void;
  toggleXrayMode: () => void;
  setPowerSetpoint: (val: number) => void;
  startFurnace: () => void;
  stopFurnace: () => void;
  toggleFurnace: () => void;
  setTimeScale: (val: number) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setCameraMode: (mode: CameraMode) => void;
  setIsRemoteHeld: (held: boolean) => void;
  enableAudio: () => void;
  setActiveHoverObject: (name: string | null) => void;
  resetSimulation: () => void;

  // Tilting Control Actions
  startTiltSystem: () => void;
  stopTiltSystem: () => void;
  toggleTiltPermit: () => void;
  startTiltingForward: () => void;
  stopTiltingForward: () => void;
  startTiltingBackward: () => void;
  stopTiltingBackward: () => void;
  setTiltAngle: (angle: number) => void;
  resetLadle: () => void;

  // Ladle Handwheel & Mobile Camera Lock State
  ladleTiltDeg: number;
  isLadleCameraLocked: boolean;
  isLadleControlOpen: boolean;
  setLadleTiltDeg: (deg: number) => void;
  setIsLadleCameraLocked: (locked: boolean) => void;
  setIsLadleControlOpen: (open: boolean) => void;

  // Overhead Crane & Mobile Transfer Ladle System
  craneDestination: CraneDestination;
  cranePosition: [number, number, number];
  craneTargetPosition: [number, number, number];
  craneMoveDirs: { x: number; y: number; z: number };
  moldFilledFraction: number;

  molds: {
    gear: { fillLevel: number; isCooling: boolean; isSolid: boolean };
    propeller: { fillLevel: number; isCooling: boolean; isSolid: boolean };
    ingot: { fillLevel: number; isCooling: boolean; isSolid: boolean };
    valve: { fillLevel: number; isCooling: boolean; isSolid: boolean };
  };

  isLadlePouringToMold: boolean;

  setCraneDestination: (dest: CraneDestination) => void;
  setCranePosition: (pos: [number, number, number]) => void;
  setCraneMoveDir: (axis: 'x' | 'y' | 'z', dir: number) => void;
  pourFromLadleToMold: (amount: number, moldType?: 'gear' | 'propeller' | 'ingot' | 'valve') => void;
  setMoldState: (moldType: 'gear' | 'propeller' | 'ingot' | 'valve', updates: any) => void;
  resetMold: () => void;

  // Foundry Heat & Charge Form Management
  furnaceChargedFraction: number;
  activeHeat: HeatRecipe | null;
  heatNumberCounter: number;
  isHeatModalOpen: boolean;
  setHeatModalOpen: (open: boolean) => void;
  chargeHeatBatch: (recipe: HeatRecipe) => void;
  removeSlag: () => void;
  startNewHeatCycle: () => void;

  // Auxiliaries
  isWaterPumpRunning: boolean;
  isHpuRunning: boolean;
  isLadlePreheaterActive: boolean;
  toggleWaterPump: () => void;
  toggleHpu: () => void;
  toggleLadlePreheater: () => void;
  factoryLightsOn: boolean;
  toggleFactoryLights: () => void;
  exhaustFansOn: boolean;
  toggleExhaustFans: () => void;
  isAparHeld: boolean;
  heldAparDockId: string | null;
  setIsAparHeld: (held: boolean, dockId?: string) => void;
  isAparSpraying: boolean;
  setIsAparSpraying: (spraying: boolean) => void;
  isCraneRemoteHeld: boolean;
  setIsCraneRemoteHeld: (held: boolean) => void;
  toggleCraneRemote: () => void;

  // SOP Mode & Interactive Mission Task System
  isSopMode: boolean;
  toggleSopMode: () => void;
  currentSopStepIndex: number;
  sopStepCompletedMap: Record<number, boolean>;
  setSopStepIndex: (index: number) => void;
  nextSopStep: () => void;
  prevSopStep: () => void;
  activeClue: string | null;
  setActiveClue: (clue: string | null) => void;
  isSopPanelOpen: boolean;
  setIsSopPanelOpen: (open: boolean) => void;

  // Immersion Pyrometer Lance Measurement System
  isLanceHeld: boolean;
  setIsLanceHeld: (held: boolean) => void;
  isLanceDipping: boolean;
  isHoldingLanceDip: boolean;
  setIsHoldingLanceDip: (holding: boolean) => void;
  lanceManualDepth: number;
  setLanceManualDepth: (depth: number) => void;
  recordImmersionReading: (tempC: number) => void;
  immersionTempC: number | null;
  lastImmersionReading: { tempC: number; timeSec: number } | null;
  triggerLanceDip: () => void;
  resetImmersionTemp: () => void;

  // Stored Lance Floor Position (Under User Feet or On Pegboard Stand)
  storedLancePos: [number, number, number];
  storeLanceAtPos: (pos: [number, number, number]) => void;
  isLanceOnRack: boolean;
  returnLanceToRack: () => void;

  // Handheld Foundry Tools System (Exclusive: Lance / Shovel / Skimmer)
  heldTool: 'none' | 'lance' | 'shovel' | 'skimmer';
  setHeldTool: (tool: 'none' | 'lance' | 'shovel' | 'skimmer') => void;
  isCoagulantModalOpen: boolean;
  setCoagulantModalOpen: (open: boolean) => void;
  coagulantDoseKg: number;
  setCoagulantDoseKg: (kg: number) => void;
  isShovelFilled: boolean;
  setIsShovelFilled: (filled: boolean) => void;
  setPotensioHolding35Kw: () => void;

  // Quick Melting 60s Fast-Forward
  isMeltingFastForward: boolean;
  meltingCountdown: number;
  triggerQuickMelt60s: () => void;

  // Slag Coagulant & Deslagging 3D Sequence
  isSlagSequenceActive: boolean;
  slagSequenceStep: 'idle' | 'powder' | 'crusting' | 'skimming' | 'sampling' | 'done';
  throwCoagulantFromShovel: () => void;
  skimSlagWithRake: () => void;
  startSlagCoagulantSequence: () => void;

  // Floating Cabinet Control Panel Modal
  isCabinetPanelModalOpen: boolean;
  setCabinetPanelModalOpen: (open: boolean) => void;

  // Loop Step
  tick: (dtRealSeconds: number) => void;
}

const getInitialPerformanceProfile = (): PerformanceProfile => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('tungku_perf_profile');
    if (saved === 'lite' || saved === 'ultra') {
      return saved;
    }
  }
  // Default to 'lite' for universal smooth performance on all laptops
  return 'lite';
};

const MAX_HISTORY_POINTS = 120;
const HISTORY_SAMPLE_INTERVAL_SEC = 0.5;
let lastUiSyncTimestamp = 0;

export const useSimStore = create<SimStoreState>((set, get) => ({
  isAppLaunched: false,
  isAboutModalOpen: false,
  isTutorialGuideOpen: false,
  performanceProfile: getInitialPerformanceProfile(),

  // 1. Job Order System (FC 150 / FC 250 / FC 300 / FCD 450 / FCD 500)
  jobOrder: getRandomJobOrder(),
  isJobOrderModalOpen: false,
  isJobOrderPinned: false,
  setJobOrderModalOpen: (open: boolean) =>
    set((s) => ({
      isJobOrderModalOpen: open,
      isInspectionModalOpen: open ? false : s.isInspectionModalOpen,
    })),
  pinJobOrderToHud: () => {
    const { jobOrder } = get();
    const matKey = getMaterialKeyForJob(jobOrder);
    const mat = METAL_PRESETS[matKey] || METAL_PRESETS.castIron;
    set({
      isJobOrderPinned: true,
      materialKey: matKey,
      selectedMaterial: mat,
      sim: createInitialSimState(mat),
    });
  },
  randomizeJobOrder: () => {
    const randomOrder = getRandomJobOrder();
    const matKey = getMaterialKeyForJob(randomOrder);
    const mat = METAL_PRESETS[matKey] || METAL_PRESETS.castIron;
    set({
      jobOrder: randomOrder,
      materialKey: matKey,
      selectedMaterial: mat,
      sim: createInitialSimState(mat),
    });
  },

  // 2. K3 APD System
  isPpeModalOpen: false,
  setPpeModalOpen: (open: boolean) => set({ isPpeModalOpen: open }),
  apdItems: { helmet: false, mask: false, apron: false, gloves: false, boots: false },
  equippedApdSlots: {
    helmet: null,
    mask: false,
    apron: null,
    gloves: null,
    boots: null,
  },
  interactApdSlot: (category, slotIndex) => {
    let result: { success: boolean; message?: string; action?: 'equipped' | 'unequipped' | 'blocked' } = {
      success: true,
    };

    set((s) => {
      if (category === 'mask') {
        const nextMask = !s.equippedApdSlots.mask;
        result = {
          success: true,
          action: nextMask ? 'equipped' : 'unequipped',
          message: nextMask
            ? 'Masker Respirator & Kacamata Safety Dipakai'
            : 'Masker & Kacamata Dilepas dan Disimpan ke Rak',
        };
        return {
          equippedApdSlots: { ...s.equippedApdSlots, mask: nextMask },
          apdItems: { ...s.apdItems, mask: nextMask },
        };
      }

      const currentSlot = s.equippedApdSlots[category];
      const catName =
        category === 'helmet'
          ? 'Helm Proyek'
          : category === 'apron'
            ? 'Baju Coverall'
            : category === 'gloves'
              ? 'Sarung Tangan'
              : 'Sepatu Boot';

      // Kasus 1: Klik slot yang sedang dipakai -> LEPAS APD ke rak
      if (currentSlot === slotIndex) {
        result = {
          success: true,
          action: 'unequipped',
          message: `${catName} dilepas dan disimpan kembali ke rak`,
        };
        return {
          equippedApdSlots: { ...s.equippedApdSlots, [category]: null },
          apdItems: { ...s.apdItems, [category]: false },
        };
      }

      // Kasus 2: Belum memakai APD kategori ini -> PAKAI APD dari slot ini
      if (currentSlot === null) {
        result = {
          success: true,
          action: 'equipped',
          message: `${catName} (Slot #${slotIndex + 1}) berhasil dipakai`,
        };
        return {
          equippedApdSlots: { ...s.equippedApdSlots, [category]: slotIndex },
          apdItems: { ...s.apdItems, [category]: true },
        };
      }

      // Kasus 3: Sudah memakai APD dari slot lain -> BLOKIR sesuai konfirmasi user!
      result = {
        success: false,
        action: 'blocked',
        message: `Anda sudah memakai ${catName}! Simpan kembali ke dudukannya terlebih dahulu sebelum mengambil ${catName} lain.`,
      };
      return s; // no state change
    });

    return result;
  },
  toggleApdItem: (key) =>
    set((s) => {
      if (key === 'mask') {
        const next = !s.equippedApdSlots.mask;
        return {
          equippedApdSlots: { ...s.equippedApdSlots, mask: next },
          apdItems: { ...s.apdItems, mask: next },
        };
      }
      const isEquipped = s.equippedApdSlots[key] !== null;
      if (isEquipped) {
        return {
          equippedApdSlots: { ...s.equippedApdSlots, [key]: null },
          apdItems: { ...s.apdItems, [key]: false },
        };
      } else {
        return {
          equippedApdSlots: { ...s.equippedApdSlots, [key]: 0 },
          apdItems: { ...s.apdItems, [key]: true },
        };
      }
    }),

  // 3. Inspection System
  isInspectionModalOpen: false,
  setInspectionModalOpen: (open: boolean) =>
    set((s) => ({
      isInspectionModalOpen: open,
      isJobOrderModalOpen: open ? false : s.isJobOrderModalOpen,
    })),
  inspection: { bottom: false, wall: false, lip: false, mold: false },
  verifyInspectionPoint: (point) =>
    set((s) => ({
      inspection: { ...s.inspection, [point]: true },
    })),
  activeInspectionScanPoint: null,
  trigger3DInspectionScan: (point) => {
    inductionAudio.resume();
    inductionAudio.playBeep();
    inductionAudio.vibrate(35);
    set({ activeInspectionScanPoint: point });
    setTimeout(() => {
      inductionAudio.playSuccess();
      set((s) => ({
        inspection: { ...s.inspection, [point]: true },
        activeInspectionScanPoint: s.activeInspectionScanPoint === point ? null : s.activeInspectionScanPoint,
      }));
    }, 1150);
  },
  emergencyVerified: false,
  aparVerified: false,
  verifyEstopAndApar: () => set({ emergencyVerified: true, aparVerified: true }),
  isAparModalOpen: false,
  setAparModalOpen: (open: boolean) => set({ isAparModalOpen: open }),
  verifyEmergencyStopOnly: () => set({ emergencyVerified: true }),
  verifyAparOnly: () => set({ aparVerified: true, emergencyVerified: !get().emergencyTripped ? true : get().emergencyVerified }),

  // 4. Utility & Power Controls
  panelBreakerOn: false,
  setPanelBreaker: (on: boolean) => {
    const prev = get().panelBreakerOn;
    const updates: Partial<SimStoreState> = { panelBreakerOn: on, transformerBreakerOn: on };
    if (!on && prev) {
      updates.shutdownPanelBreakerOff = true;
    }
    set(updates);
    inductionAudio.playContactor();
  },
  coolingTowerSwitchOn: false,
  setCoolingTowerSwitch: (on: boolean) => {
    const prev = get().coolingTowerSwitchOn;
    const updates: Partial<SimStoreState> = { coolingTowerSwitchOn: on };
    if (!on && prev) {
      updates.shutdownCoolingTowerOff = true;
    }
    set(updates);
    inductionAudio.playClick();
  },
  coolingPumpSwitchOn: false,
  setCoolingPumpSwitch: (on: boolean) => {
    const prev = get().coolingPumpSwitchOn;
    const updates: Partial<SimStoreState> = {
      coolingPumpSwitchOn: on,
      isWaterPumpRunning: on,
      waterPressureBar: on ? 3.2 : 0.0,
    };
    if (!on && (prev || get().timeLapse5HoursDone)) {
      updates.shutdownCoolingPumpOff = true;
    }
    set(updates);
    inductionAudio.playClick();
  },
  waterPressureBar: 0.0,

  bushbar1On: false,
  bushbar2On: false,
  setBushbar1: (on: boolean) => {
    const prev = get().bushbar1On;
    const updates: Partial<SimStoreState> = { bushbar1On: on };
    if (!on) {
      updates.bushbar2On = false;
      if (prev) {
        updates.shutdownBushbarOff = true;
      }
    }
    set(updates);
    inductionAudio.playContactor();
  },
  setBushbar2: (on: boolean) => {
    const { bushbar1On, bushbar2On } = get();
    if (on && !bushbar1On) return; // Sekuensial saat menghidupkan
    const updates: Partial<SimStoreState> = { bushbar2On: on };
    if (!on && bushbar2On && !bushbar1On) {
      updates.shutdownBushbarOff = true;
    } else if (!on && bushbar2On) {
      updates.shutdownBushbarOff = true;
    }
    set(updates);
    inductionAudio.playContactor();
  },
  controlPowerKeyOn: false,
  setControlPowerKey: (on: boolean) => {
    set({ controlPowerKeyOn: on, masterPowerOn: on });
    inductionAudio.playClick();
  },
  ac1On: false,
  setAc1: (on: boolean) => {
    const { controlPowerKeyOn, potensioKw } = get();
    if (!controlPowerKeyOn) return;
    const currentKw = potensioKw ?? 0;
    const syncedPowerSetpoint = on ? Math.max(0, Math.min(1.0, currentKw / 150)) : 0;
    set({
      ac1On: on,
      coilOn: on,
      powerSetpoint: syncedPowerSetpoint,
      ac2Pressed: false,
      bushbar1On: true,
      bushbar2On: true,
    });
    inductionAudio.playClick();
  },
  ac2Pressed: false,
  pressAc2: () => {
    set({ ac1On: false, coilOn: false, ac2Pressed: true, shutdownAc2Off: true, shutdownBushbarOff: true });
    inductionAudio.playClick();
  },
  potensioKw: 0,
  setPotensioKw: (kw: number) => {
    const clampedKw = Math.max(0, Math.min(150, kw));
    const powerFrac = clampedKw / 150;
    const updates: any = { potensioKw: clampedKw, powerSetpoint: powerFrac };
    if (clampedKw <= 0) updates.shutdownPotensioZero = true;
    set(updates);
  },
  preheatTimerRemaining: 15,
  isPreheatDone: false,

  // 5. Formula, Scrap & Charging
  isMeltingJobSheetOpen: false,
  setMeltingJobSheetOpen: (open: boolean) => set({ isMeltingJobSheetOpen: open }),
  isScrapSortingModalOpen: false,
  setScrapSortingModalOpen: (open: boolean) => set({ isScrapSortingModalOpen: open }),
  isSequentialChargingModalOpen: false,
  setSequentialChargingModalOpen: (open: boolean) => set({ isSequentialChargingModalOpen: open }),
  selectedFormula: null,
  setSelectedFormula: (formula: JobOrderType) => set({ selectedFormula: formula }),
  isAlloyVerified: false,
  verifyAlloyDose: () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    inductionAudio.playSuccess();
    const s = get();
    const shouldCheckStep11 =
      s.isSopMode &&
      s.currentSopStepIndex === 10 &&
      s.selectedFormula === s.jobOrder &&
      !s.sopStepCompletedMap[11];

    set({
      isAlloyVerified: true,
      ...(shouldCheckStep11
        ? {
            sopStepCompletedMap: { ...s.sopStepCompletedMap, 11: true },
            currentSopStepIndex: Math.min(SOP_STEPS.length - 1, 11),
          }
        : {}),
    });
  },
  scrapSortedDry: false,
  setScrapSortedDry: (dry: boolean) => set({ scrapSortedDry: dry }),
  chargingStep: 0,
  advanceChargingStep: (step: number) => {
    const fraction = step === 1 ? 0.55 : step === 2 ? 0.95 : 1.0;
    const mass = step === 1 ? 138 : step === 2 ? 238 : 250;
    inductionAudio.resume();
    inductionAudio.playClank();
    if (step >= 3) {
      inductionAudio.playSuccess();
    } else {
      inductionAudio.playBeep();
    }
    set({
      chargingStep: Math.max(get().chargingStep, step),
      furnaceChargedFraction: fraction,
      furnaceMetalMassKg: mass,
      isColdChargeLoaded: true,
      isAlloysAdded: step >= 3,
      slagMassKg: step >= 3 ? Math.max(get().slagMassKg, 1.2) : Math.max(get().slagMassKg, 0.4),
      isDeslagged: false,
    });
  },

  // 6. Quality & Tapping & Single Sand Mold
  slagCoagulantAdded: false,
  addSlagCoagulant: () => set({ slagCoagulantAdded: true }),
  isSlagSequenceActive: false,
  slagSequenceStep: 'idle',
  throwCoagulantFromShovel: () => {
    const s = get();
    if (s.isSlagSequenceActive) return;
    set({
      isSlagSequenceActive: true,
      slagSequenceStep: 'powder',
      isShovelFilled: false,
    });
    inductionAudio.resume();
    inductionAudio.playClick();

    setTimeout(() => {
      set({
        isSlagSequenceActive: false,
        slagSequenceStep: 'crusting',
        slagCoagulantAdded: true,
      });
      inductionAudio.playSuccess();
    }, 1250);
  },
  skimSlagWithRake: () => {
    const s = get();
    if (s.isSlagSequenceActive) return;
    set({
      isSlagSequenceActive: true,
      slagSequenceStep: 'skimming',
      slagCoagulantAdded: true,
    });
    inductionAudio.resume();
    inductionAudio.playClank();

    setTimeout(() => {
      set({ slagSequenceStep: 'sampling', isDeslagged: true });
    }, 1300);

    setTimeout(() => {
      set({
        isSlagSequenceActive: false,
        slagSequenceStep: 'done',
        chemSampleVerified: true,
      });
      inductionAudio.playSuccess();
    }, 2500);
  },
  startSlagCoagulantSequence: () => {
    const s = get();
    if (s.isSlagSequenceActive) return;
    // Stepwise dispatch based on currently held tool
    if (s.heldTool === 'shovel') {
      get().throwCoagulantFromShovel();
      return;
    }
    if (s.heldTool === 'skimmer') {
      get().skimSlagWithRake();
      return;
    }
    // Fallback if triggered from SOP Guide button without a tool in hand:
    if (!s.slagCoagulantAdded) {
      set({ heldTool: 'shovel', isShovelFilled: true });
      get().throwCoagulantFromShovel();
    } else {
      set({ heldTool: 'skimmer' });
      get().skimSlagWithRake();
    }
  },
  chemSampleVerified: false,
  verifyChemSample: () => set({ chemSampleVerified: true }),
  ladlePreheatedVerified: false,
  verifyLadlePreheated: () => set({ ladlePreheatedVerified: true, isLadlePreheaterActive: true }),
  fcdReactionActive: false,

  singleMoldFillLevel: 0.0,
  pigMoldFillLevel: 0.0,
  isSingleMoldCooling: false,
  isSingleMoldSolid: false,
  setSingleMoldState: (updates) =>
    set((s) => ({
      isSingleMoldCooling: updates.isCooling !== undefined ? updates.isCooling : s.isSingleMoldCooling,
      isSingleMoldSolid: updates.isSolid !== undefined ? updates.isSolid : s.isSingleMoldSolid,
      singleMoldFillLevel: updates.fillLevel !== undefined ? updates.fillLevel : s.singleMoldFillLevel,
    })),
  pourToSingleSandMold: (amount: number) => {
    set((s) => {
      if (s.ladleFilledFraction <= 0.005) {
        return { isLadlePouringToMold: false };
      }
      const effectiveMass = Math.max(s.sim.ladleMetalMassKg, s.ladleFilledFraction * 160.0);
      const transferKg = Math.min(effectiveMass, amount * 120.0);
      const newLadleMass = Math.max(0, effectiveMass - transferKg);
      const newLadleFrac = Math.max(0, newLadleMass / 160.0);
      const newFill = Math.min(1.0, s.singleMoldFillLevel + amount * 0.95);
      return {
        singleMoldFillLevel: newFill,
        moldFilledFraction: newFill,
        ladleFilledFraction: newLadleFrac,
        isLadlePouringToMold: true,
        sim: {
          ...s.sim,
          ladleMetalMassKg: newLadleMass,
        },
      };
    });
  },
  pourToPigMold: (amount: number) => {
    set((s) => {
      if (s.ladleFilledFraction <= 0.005) {
        return { isLadlePouringToMold: false };
      }
      const effectiveMass = Math.max(s.sim.ladleMetalMassKg, s.ladleFilledFraction * 160.0);
      const transferKg = Math.min(effectiveMass, amount * 100.0);
      const newLadleMass = Math.max(0, effectiveMass - transferKg);
      const newLadleFrac = Math.max(0, newLadleMass / 160.0);
      const newPig = Math.min(1.0, s.pigMoldFillLevel + amount * 0.85);
      return {
        pigMoldFillLevel: newPig,
        ladleFilledFraction: newLadleFrac,
        isLadlePouringToMold: true,
        sim: {
          ...s.sim,
          ladleMetalMassKg: newLadleMass,
        },
      };
    });
  },

  // 7. Shutdown & Time-Lapse & Evaluation
  shutdownPotensioZero: false,
  shutdownAc2Off: false,
  shutdownBushbarOff: false,
  shutdownCoolingTowerOff: false,
  shutdownPanelBreakerOff: false,
  shutdownCoolingPumpOff: false,
  timeLapse5HoursActive: false,
  timeLapse5HoursDone: false,
  startTimeLapse5Hours: () => {
    set({ timeLapse5HoursActive: true });
    setTimeout(() => {
      set({ timeLapse5HoursActive: false, timeLapse5HoursDone: true });
      inductionAudio.playSuccess();
    }, 3500);
  },

  isReportCardOpen: false,
  setReportCardOpen: (open: boolean) => set({ isReportCardOpen: open }),

  transformerBreakerOn: true,
  masterPowerOn: false,
  emergencyTripped: false,
  materialKey: 'fc250',
  selectedMaterial: METAL_PRESETS.fc250 || METAL_PRESETS.castIron,

  coilOn: false,
  powerSetpoint: 0.0,
  timeScale: 10.0,

  tiltAngle: 0.0,
  isTiltingForward: false,
  isTiltingBackward: false,
  ladleFilledFraction: 0.0,
  ladleTiltDeg: 0.0,
  isLadleCameraLocked: false,
  isLadleControlOpen: false,
  isPouringStreamActive: false,
  pouringTarget: 'ladle',
  tiltPowerOn: false,
  tiltPermit: false,
  xrayMode: false,

  craneDestination: 'standby',
  cranePosition: [4.0, 0.0, 0.0],
  craneTargetPosition: [4.0, 0.0, 0.0],
  craneMoveDirs: { x: 0, y: 0, z: 0 },
  moldFilledFraction: 0.0,
  molds: {
    gear: { fillLevel: 0, isCooling: false, isSolid: false },
    propeller: { fillLevel: 0, isCooling: false, isSolid: false },
    ingot: { fillLevel: 0, isCooling: false, isSolid: false },
    valve: { fillLevel: 0, isCooling: false, isSolid: false },
  },
  isLadlePouringToMold: false,

  furnaceMetalMassKg: 0.0,
  isColdChargeLoaded: false,
  isAlloysAdded: false,
  slagMassKg: 0.0,
  isDeslagged: false,
  interlockFaultReason: null,

  furnaceChargedFraction: 0.0,
  activeHeat: DEFAULT_HEAT_RECIPE,
  heatNumberCounter: 103,
  isHeatModalOpen: false,
  isWaterPumpRunning: true,
  isHpuRunning: true,
  isLadlePreheaterActive: true,
  factoryLightsOn: true,
  exhaustFansOn: true,
  isAparHeld: false,
  heldAparDockId: null as string | null,
  isAparSpraying: false,
  isCraneRemoteHeld: false,

  sim: createInitialSimState(METAL_PRESETS.sus310 || ALUMINUM_PROPERTIES),

  history: [
    {
      timeSec: 0,
      tempC: 25.0,
      meltFraction: 0.0,
      powerFraction: 0.0,
      phase: 'Idle',
    },
  ],
  lastHistorySampleTime: 0,

  cameraPreset: 'overview',
  cameraMode: 'pov',
  joystickVector: { x: 0, y: 0 },
  isRemoteHeld: false,
  audioEnabled: false,
  activeHoverObject: null,
  isDragging3DControl: false,

  setTransformerBreaker: (on: boolean) => {
    set((state) => {
      if (!on) {
        return {
          transformerBreakerOn: false,
          coilOn: false,
          powerSetpoint: 0,
          isTiltingForward: false,
          isTiltingBackward: false,
          tiltPowerOn: false,
        };
      }
      return {
        transformerBreakerOn: true,
        tiltPowerOn: state.masterPowerOn,
      };
    });
  },

  toggleTransformerBreaker: () => {
    const { transformerBreakerOn, setTransformerBreaker } = get();
    setTransformerBreaker(!transformerBreakerOn);
  },

  setMasterPower: (on: boolean) => {
    const { transformerBreakerOn } = get();
    if (on && !transformerBreakerOn) {
      set({ masterPowerOn: false });
      return;
    }
    set({
      masterPowerOn: on,
      ...(on
        ? { tiltPowerOn: true }
        : {
            coilOn: false,
            powerSetpoint: 0,
            isTiltingForward: false,
            isTiltingBackward: false,
            tiltPowerOn: false,
          }),
    });
  },

  triggerEmergencyStop: () => {
    set({
      emergencyTripped: true,
      coilOn: false,
      powerSetpoint: 0,
      isTiltingForward: false,
      isTiltingBackward: false,
    });
  },

  resetEmergencyStop: () => {
    set({ emergencyTripped: false, emergencyVerified: true });
  },

  setMaterial: (key: string) => {
    const mat = METAL_PRESETS[key] || METAL_PRESETS.sus310;
    set({
      materialKey: key,
      selectedMaterial: mat,
      furnaceMetalMassKg: mat.massKg,
      sim: createInitialSimState(mat),
      history: [
        {
          timeSec: 0,
          tempC: mat.ambientTempC,
          meltFraction: 0.0,
          powerFraction: 0.0,
          phase: 'Idle',
        },
      ],
      lastHistorySampleTime: 0,
      ladleFilledFraction: 0.0,
      isPouringStreamActive: false,
    });
  },

  setPowerSetpoint: (val: number) => {
    const clamped = Math.max(0, Math.min(val, 1));
    const kw = Math.round(clamped * 150);
    set((state) => {
      const updates: Partial<SimStoreState> = {
        powerSetpoint: clamped,
        potensioKw: kw,
      };
      if (kw <= 0) {
        updates.shutdownPotensioZero = true;
      }
      if (clamped <= 0.001 && state.coilOn) {
        updates.coilOn = false;
      }
      return updates;
    });
  },

  setPerformanceProfile: (profile: PerformanceProfile) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('tungku_perf_profile', profile);
      } catch (e) {
        console.warn('Could not save performance profile to localStorage', e);
      }
    }
    set({ performanceProfile: profile });
  },

  launchSimulation: (profile?: PerformanceProfile) => {
    const selectedProfile = profile || get().performanceProfile;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('tungku_perf_profile', selectedProfile);
      } catch (e) {
        console.warn('Could not save performance profile to localStorage', e);
      }
    }
    set({
      isAppLaunched: true,
      isAboutModalOpen: false,
      isTutorialGuideOpen: false,
      performanceProfile: selectedProfile,
      cameraPreset: 'ppe-rack',
      cameraMode: 'pov',
    });
  },

  setIsAppLaunched: (launched: boolean) => set({ isAppLaunched: launched }),
  setAboutModalOpen: (open: boolean) => set({ isAboutModalOpen: open }),
  setTutorialGuideOpen: (open: boolean) => set({ isTutorialGuideOpen: open }),

  setHeatModalOpen: (open: boolean) => set({ isHeatModalOpen: open }),

  chargeHeatBatch: (recipe: HeatRecipe) => {
    inductionAudio.resume();
    inductionAudio.playClank();
    const state = get();
    const susMat = state.selectedMaterial || METAL_PRESETS.sus310;

    const baseMass = recipe.baseReturnKg + recipe.baseScrapKg;
    const alloyMass = recipe.alloyFeCrKg + recipe.alloyNiKg + recipe.fluxCaSiKg;
    const totalBatchWeight = baseMass + alloyMass;

    // Detect if this is an Alloy Addition to an existing hot melt
    if (state.furnaceMetalMassKg > 20 && state.sim.temperatureC > 300) {
      // HOT ALLOYING ADDITION (Conserves melt temperature!)
      const { newMassKg, newEnthalpyJ, newTempC, newMeltFraction } = mixAlloyBatch(
        state.sim.enthalpyJ,
        state.furnaceMetalMassKg,
        alloyMass > 0 ? alloyMass : 8.42,
        susMat
      );

      set({
        furnaceMetalMassKg: newMassKg,
        furnaceChargedFraction: Math.min(1.0, newMassKg / 250.0),
        isAlloysAdded: true,
        slagMassKg: state.slagMassKg + 1.2,
        isDeslagged: false,
        isHeatModalOpen: false,
        sim: {
          ...state.sim,
          enthalpyJ: newEnthalpyJ,
          temperatureC: newTempC,
          meltFraction: newMeltFraction,
        },
      });
    } else {
      // COLD BASE CHARGE (Initial furnace loading at ambient temperature)
      set({
        activeHeat: { ...recipe, totalWeightKg: totalBatchWeight },
        furnaceMetalMassKg: baseMass > 0 ? baseMass : 150.0,
        furnaceChargedFraction: Math.min(1.0, Math.max(0.1, totalBatchWeight / 250.0)),
        isColdChargeLoaded: true,
        isAlloysAdded: false,
        slagMassKg: 0.2,
        isDeslagged: false,
        isHeatModalOpen: false,
        ladleFilledFraction: 0.0,
        moldFilledFraction: 0.0,
        sim: createInitialSimState(susMat),
      });
    }
  },

  removeSlag: () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    set({
      slagMassKg: 0.0,
      isDeslagged: true,
    });
  },

  startNewHeatCycle: () => {
    const nextCounter = get().heatNumberCounter + 1;
    set({
      heatNumberCounter: nextCounter,
      furnaceChargedFraction: 0.0,
      furnaceMetalMassKg: 0.0,
      isColdChargeLoaded: false,
      isAlloysAdded: false,
      slagMassKg: 0.0,
      isDeslagged: false,
      activeHeat: null,
      ladleFilledFraction: 0.0,
      moldFilledFraction: 0.0,
      isHeatModalOpen: true,
      coilOn: false,
      powerSetpoint: 0.0,
      tiltAngle: 0.0,
      isTiltingForward: false,
      isTiltingBackward: false,
      isPouringStreamActive: false,
      isLadlePouringToMold: false,
    });
  },

  startFurnace: () => {
    const {
      masterPowerOn,
      emergencyTripped,
      potensioKw,
      tiltAngle,
    } = get();

    if (!masterPowerOn) {
      set({ interlockFaultReason: 'INTERLOCK: Daya Utama Kabinet Belum Aktif!' });
      return;
    }
    if (emergencyTripped) {
      set({ interlockFaultReason: 'INTERLOCK: Tombol E-Stop Masih Terkunci!' });
      return;
    }

    if (tiltAngle > 30) {
      set({ interlockFaultReason: 'INTERLOCK: Kemiringan Tanur > 30°! Tegakkan tanur terlebih dahulu.' });
      return;
    }

    const currentKw = potensioKw ?? 0;
    const syncedPowerSetpoint = Math.max(0, Math.min(1.0, currentKw / 150));

    set({
      coilOn: true,
      powerSetpoint: syncedPowerSetpoint,
      interlockFaultReason: null,
    });
  },

  stopFurnace: () => {
    set({ coilOn: false });
  },

  toggleFurnace: () => {
    const { coilOn, startFurnace, stopFurnace } = get();
    if (coilOn) {
      stopFurnace();
    } else {
      startFurnace();
    }
  },

  setPouringTarget: (target: 'ladle' | 'mold') => {
    set({ pouringTarget: target });
  },

  toggleXrayMode: () => {
    set((state) => ({ xrayMode: !state.xrayMode }));
  },

  setTimeScale: (val: number) => {
    set({ timeScale: Math.max(1, Math.min(val, 50)) });
  },

  setCameraPreset: (preset: CameraPreset) => {
    set({ cameraPreset: preset });
  },

  setCameraMode: (mode: CameraMode) => {
    set({ cameraMode: mode });
  },

  setJoystickVector: (vec: { x: number; y: number }) => {
    // Analog joystick strictly drives POV walking, never moves overhead crane
    const prev = get().joystickVector;
    if (prev.x === vec.x && prev.y === vec.y) return;
    set({ joystickVector: { x: vec.x, y: vec.y } });
  },

  setIsRemoteHeld: (held: boolean) => {
    set({
      isRemoteHeld: held,
      ...(held
        ? {
            isCraneRemoteHeld: false,
            craneMoveDirs: { x: 0, y: 0, z: 0 },
            heldTool: 'none' as const,
            isLanceHeld: false,
            isHoldingLanceDip: false,
            isLanceDipping: false,
          }
        : {
            isTiltingForward: false,
            isTiltingBackward: false,
          }),
    });
  },

  enableAudio: () => {
    set({ audioEnabled: true });
  },

  setActiveHoverObject: (name: string | null) => {
    set({ activeHoverObject: name });
  },

  setIsDragging3DControl: (dragging: boolean) => {
    set({ isDragging3DControl: dragging });
  },

  startTiltSystem: () => {
    const { masterPowerOn, emergencyTripped } = get();
    if (!masterPowerOn || emergencyTripped) return;
    set({ tiltPowerOn: true, interlockFaultReason: null });
  },

  stopTiltSystem: () => {
    set({ tiltPowerOn: false, isTiltingForward: false, isTiltingBackward: false });
  },

  toggleTiltPermit: () => {
    const { masterPowerOn, emergencyTripped } = get();
    if (!masterPowerOn || emergencyTripped) return;
    set((state) => ({
      tiltPermit: !state.tiltPermit,
      ...(state.tiltPermit ? { isTiltingForward: false, isTiltingBackward: false } : {}),
    }));
  },

  toggleWaterPump: () => {
    set((s) => ({ isWaterPumpRunning: !s.isWaterPumpRunning }));
  },

  toggleHpu: () => {
    set((s) => ({ isHpuRunning: !s.isHpuRunning }));
  },

  toggleLadlePreheater: () => {
    set((s) => ({ isLadlePreheaterActive: !s.isLadlePreheaterActive }));
  },

  toggleFactoryLights: () => {
    set((s) => ({ factoryLightsOn: !s.factoryLightsOn }));
  },

  toggleExhaustFans: () => {
    set((s) => ({ exhaustFansOn: !s.exhaustFansOn }));
  },

  setIsAparHeld: (held: boolean, dockId?: string) => {
    set({
      isAparHeld: held,
      heldAparDockId: held ? (dockId || 'dock-1') : null,
      ...(held ? {} : { isAparSpraying: false }),
    });
  },

  setIsAparSpraying: (spraying: boolean) => {
    const state = get();
    if (spraying) {
      const updates: Partial<SimStoreState> = { isAparSpraying: true };
      // Real APAR logic: extinguishes fire & clears emergency circuit fault
      if (state.emergencyTripped || state.interlockFaultReason) {
        updates.emergencyTripped = false;
        updates.interlockFaultReason = null;
      }
      if (state.sim.waterTripFault) {
        updates.sim = { ...state.sim, waterTripFault: false };
      }
      // If crucible metal is severely overheated (>1680°C), foam helps knock down temperature slightly
      if (state.sim.temperatureC > 1650) {
        updates.sim = {
          ...(updates.sim || state.sim),
          temperatureC: Math.max(1600, state.sim.temperatureC - 15),
        };
      }
      set(updates);
    } else {
      set({ isAparSpraying: false });
    }
  },

  setIsCraneRemoteHeld: (held: boolean) => {
    set({
      isCraneRemoteHeld: held,
      ...(held
        ? {
            isRemoteHeld: false,
            isTiltingForward: false,
            isTiltingBackward: false,
            heldTool: 'none' as const,
            isLanceHeld: false,
            isHoldingLanceDip: false,
            isLanceDipping: false,
          }
        : {
            craneMoveDirs: { x: 0, y: 0, z: 0 },
            isLadleControlOpen: false,
            isLadleCameraLocked: false,
          }),
    });
  },

  toggleCraneRemote: () => {
    set((s) => {
      const next = !s.isCraneRemoteHeld;
      return {
        isCraneRemoteHeld: next,
        ...(next
          ? {
              isRemoteHeld: false,
              isTiltingForward: false,
              isTiltingBackward: false,
              heldTool: 'none' as const,
              isLanceHeld: false,
              isHoldingLanceDip: false,
              isLanceDipping: false,
            }
          : {
              craneMoveDirs: { x: 0, y: 0, z: 0 },
              isLadleControlOpen: false,
              isLadleCameraLocked: false,
            }),
      };
    });
  },

  startTiltingForward: () => {
    const { masterPowerOn, emergencyTripped, tiltPowerOn, tiltPermit } = get();
    if (!masterPowerOn || emergencyTripped || !tiltPowerOn || !tiltPermit) return;
    set({ isTiltingForward: true, isTiltingBackward: false });
  },

  stopTiltingForward: () => {
    set({ isTiltingForward: false });
  },

  startTiltingBackward: () => {
    const { masterPowerOn, emergencyTripped, tiltPowerOn, tiltPermit } = get();
    if (!masterPowerOn || emergencyTripped || !tiltPowerOn || !tiltPermit) return;
    set({ isTiltingBackward: true, isTiltingForward: false });
  },

  stopTiltingBackward: () => {
    set({ isTiltingBackward: false });
  },

  setTiltAngle: (angle: number) => {
    set({ tiltAngle: Math.max(0, Math.min(90, angle)) });
  },

  setLadleTiltDeg: (deg: number) => {
    const clamped = Math.max(0, Math.min(90, Number.isFinite(deg) ? deg : 0));
    set({ ladleTiltDeg: clamped });
  },

  setIsLadleCameraLocked: (locked: boolean) => {
    set({ isLadleCameraLocked: locked });
  },

  setIsLadleControlOpen: (open: boolean) => {
    set({ isLadleControlOpen: open });
  },

  resetLadle: () => {
    set((s) => ({
      ladleFilledFraction: 0.0,
      ladleTiltDeg: 0.0,
      isLadlePouringToMold: false,
      sim: {
        ...s.sim,
        ladleMetalMassKg: 0.0,
        ladleMetalTempC: s.selectedMaterial.ambientTempC,
        ladleIsSkulled: false,
      },
    }));
  },

  setCraneDestination: (dest: CraneDestination) => {
    if (dest !== 'manual') {
      const pos = CRANE_PRESET_POSITIONS[dest];
      set({ craneDestination: dest, craneTargetPosition: [...pos] });
    } else {
      set({ craneDestination: 'manual' });
    }
  },

  setCranePosition: (pos: [number, number, number]) => {
    set({ cranePosition: pos });
  },

  setCraneMoveDir: (axis: 'x' | 'y' | 'z', dir: number) => {
    set((state) => ({
      craneDestination: 'manual',
      craneMoveDirs: { ...state.craneMoveDirs, [axis]: dir },
    }));
  },

  setMoldState: (moldType: 'gear' | 'propeller' | 'ingot' | 'valve', updates: any) => {
    set((state) => ({
      molds: {
        ...state.molds,
        [moldType]: { ...state.molds[moldType], ...updates },
      },
    }));
  },

  pourFromLadleToMold: (amount: number, moldType: 'gear' | 'propeller' | 'ingot' | 'valve' = 'ingot') => {
    set((state) => {
      if (state.sim.ladleIsSkulled || state.ladleFilledFraction <= 0.005) {
        return { isLadlePouringToMold: false };
      }

      const effectiveMass = Math.max(state.sim.ladleMetalMassKg, state.ladleFilledFraction * 160.0);
      if (effectiveMass <= 0.2) {
        return { isLadlePouringToMold: false };
      }

      // Convert fractional pour amount to mass kg
      const transferKg = Math.min(effectiveMass, amount * 120.0);
      const newLadleMass = Math.max(0, effectiveMass - transferKg);
      const newLadleFraction = Math.max(0, newLadleMass / 160.0);

      const mold = state.molds[moldType] || { fillLevel: 0, isCooling: false, isSolid: false };
      const newFill = Math.min(1.0, mold.fillLevel + (transferKg / 60.0));
      const newSingleFill = Math.min(1.0, state.singleMoldFillLevel + (transferKg / 60.0));

      return {
        ladleFilledFraction: newLadleFraction,
        singleMoldFillLevel: newSingleFill,
        molds: {
          ...state.molds,
          [moldType]: {
            ...mold,
            fillLevel: newFill,
          },
        },
        moldFilledFraction: newFill,
        isLadlePouringToMold: transferKg > 0.01,
        sim: {
          ...state.sim,
          ladleMetalMassKg: newLadleMass,
        },
      };
    });
  },

  resetMold: () => {
    set({
      moldFilledFraction: 0.0,
      molds: {
        gear: { fillLevel: 0, isCooling: false, isSolid: false },
        propeller: { fillLevel: 0, isCooling: false, isSolid: false },
        ingot: { fillLevel: 0, isCooling: false, isSolid: false },
        valve: { fillLevel: 0, isCooling: false, isSolid: false },
      },
      isLadlePouringToMold: false,
    });
  },

  resetSimulation: () => {
    const randomOrder = getRandomJobOrder();
    const matKey = getMaterialKeyForJob(randomOrder);
    const mat = METAL_PRESETS[matKey] || METAL_PRESETS.castIron;
    set({
      jobOrder: randomOrder,
      isJobOrderPinned: false,
      isJobOrderModalOpen: false,
      materialKey: matKey,
      selectedMaterial: mat,
      selectedFormula: null,
      isAlloyVerified: false,
      apdItems: { helmet: false, mask: false, apron: false, gloves: false, boots: false },
      equippedApdSlots: { helmet: null, mask: false, apron: null, gloves: null, boots: null },
      inspection: { bottom: false, wall: false, lip: false, mold: false },
      emergencyVerified: false,
      aparVerified: false,
      panelBreakerOn: false,
      coolingTowerSwitchOn: false,
      coolingPumpSwitchOn: false,
      waterPressureBar: 0.0,
      bushbar1On: false,
      bushbar2On: false,
      controlPowerKeyOn: false,
      ac1On: false,
      ac2Pressed: false,
      potensioKw: 0,
      preheatTimerRemaining: 15,
      isPreheatDone: false,
      scrapSortedDry: false,
      chargingStep: 0,
      slagCoagulantAdded: false,
      chemSampleVerified: false,
      ladlePreheatedVerified: false,
      fcdReactionActive: false,
      singleMoldFillLevel: 0.0,
      pigMoldFillLevel: 0.0,
      isSingleMoldCooling: false,
      isSingleMoldSolid: false,
      shutdownPotensioZero: false,
      shutdownAc2Off: false,
      shutdownBushbarOff: false,
      shutdownCoolingTowerOff: false,
      shutdownPanelBreakerOff: false,
      shutdownCoolingPumpOff: false,
      timeLapse5HoursActive: false,
      timeLapse5HoursDone: false,
      isReportCardOpen: false,
      coilOn: false,
      powerSetpoint: 0.0,
      transformerBreakerOn: false,
      masterPowerOn: false,
      emergencyTripped: false,
      tiltAngle: 0.0,
      furnaceChargedFraction: 0.0,
      furnaceMetalMassKg: 0.0,
      isColdChargeLoaded: false,
      isAlloysAdded: false,
      slagMassKg: 0.0,
      isDeslagged: false,
      interlockFaultReason: null,
      isTiltingForward: false,
      isTiltingBackward: false,
      ladleFilledFraction: 0.0,
      ladleTiltDeg: 0.0,
      isLadleCameraLocked: false,
      isLadleControlOpen: false,
      moldFilledFraction: 0.0,
      molds: {
        gear: { fillLevel: 0, isCooling: false, isSolid: false },
        propeller: { fillLevel: 0, isCooling: false, isSolid: false },
        ingot: { fillLevel: 0, isCooling: false, isSolid: false },
        valve: { fillLevel: 0, isCooling: false, isSolid: false },
      },
      isLadlePouringToMold: false,
      isPouringStreamActive: false,
      craneDestination: 'standby',
      cranePosition: [4.0, 0.0, 0.0],
      craneTargetPosition: [4.0, 0.0, 0.0],
      craneMoveDirs: { x: 0, y: 0, z: 0 },
      tiltPowerOn: false,
      tiltPermit: false,
      currentSopStepIndex: 0,
      sopStepCompletedMap: {},
      cameraPreset: 'ppe-rack',
      cameraMode: 'pov',
      joystickVector: { x: 0, y: 0 },
      isRemoteHeld: false,
      isCraneRemoteHeld: false,
      activeHeat: DEFAULT_HEAT_RECIPE,
      isHeatModalOpen: false,
      isMeltingJobSheetOpen: false,
      isAparModalOpen: false,
      isScrapSortingModalOpen: false,
      isSequentialChargingModalOpen: false,
      isAparHeld: false,
      heldAparDockId: null,
      isAparSpraying: false,
      isLanceHeld: false,
      heldTool: 'none',
      isLanceOnRack: true,
      storedLancePos: [2.70, 1.42, 0.152],
      isHoldingLanceDip: false,
      isCabinetPanelModalOpen: false,
      isAboutModalOpen: false,
      isTutorialGuideOpen: false,
      lanceManualDepth: 0.0,
      immersionTempC: null,
      lastImmersionReading: null,
      sim: createInitialSimState(mat),
      history: [
        {
          timeSec: 0,
          tempC: mat.ambientTempC,
          meltFraction: 0.0,
          powerFraction: 0.0,
          phase: 'Idle',
        },
      ],
      lastHistorySampleTime: 0,
    });
  },

  // SOP Mode Actions
  isSopMode: false,
  toggleSopMode: () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    set((s) => ({
      isSopMode: !s.isSopMode,
      isSopPanelOpen: !s.isSopMode ? true : s.isSopPanelOpen,
    }));
  },
  currentSopStepIndex: 0,
  sopStepCompletedMap: {},
  setSopStepIndex: (index: number) => {
    inductionAudio.resume();
    inductionAudio.playClick();
    set({ currentSopStepIndex: Math.max(0, Math.min(SOP_STEPS.length - 1, index)) });
  },
  nextSopStep: () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    set((s) => ({ currentSopStepIndex: Math.min(SOP_STEPS.length - 1, s.currentSopStepIndex + 1) }));
  },
  prevSopStep: () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    set((s) => ({ currentSopStepIndex: Math.max(0, s.currentSopStepIndex - 1) }));
  },
  activeClue: null,
  setActiveClue: (clue: string | null) => set({ activeClue: clue }),
  isSopPanelOpen: false,
  setIsSopPanelOpen: (open: boolean) => set({ isSopPanelOpen: open }),

  // Pyrometer Lance
  isLanceHeld: false,
  setIsLanceHeld: (held: boolean) => {
    set({
      isLanceHeld: held,
      heldTool: held ? 'lance' : 'none',
      ...(held
        ? {
            isLanceOnRack: false,
            isRemoteHeld: false,
            isTiltingForward: false,
            isTiltingBackward: false,
            isCraneRemoteHeld: false,
            craneMoveDirs: { x: 0, y: 0, z: 0 },
          }
        : {}),
      ...(!held ? { lanceManualDepth: 0.0, isHoldingLanceDip: false, isLanceDipping: false } : {}),
    });
  },
  isLanceDipping: false,
  isHoldingLanceDip: false,
  setIsHoldingLanceDip: (holding: boolean) => {
    set({ isHoldingLanceDip: holding });
  },
  lanceManualDepth: 0.0,
  setLanceManualDepth: (depth: number) => {
    set({ lanceManualDepth: Math.max(0.0, Math.min(1.0, depth)) });
  },
  recordImmersionReading: (tempC: number) => {
    const s = get();
    inductionAudio.playBeep();
    set({
      immersionTempC: tempC,
      lastImmersionReading: { tempC, timeSec: s.sim.simTimeSeconds },
    });
  },
  immersionTempC: null,
  lastImmersionReading: null,
  triggerLanceDip: () => {
    const s = get();
    if (s.isLanceDipping) return;
    inductionAudio.resume();
    inductionAudio.playClick();
    set({ isLanceHeld: true, isLanceDipping: true, cameraPreset: 'lance', lanceManualDepth: 1.0 });

    setTimeout(() => {
      const currentSim = get().sim;
      const measured = Math.round(currentSim.temperatureC * 10) / 10;
      inductionAudio.playBeep();
      set({
        immersionTempC: measured,
        lastImmersionReading: { tempC: measured, timeSec: currentSim.simTimeSeconds },
      });
    }, 2000);

    setTimeout(() => {
      set({ isLanceDipping: false, lanceManualDepth: 0.0 });
    }, 3600);
  },
  resetImmersionTemp: () => set({ immersionTempC: null, lastImmersionReading: null }),

  // Stored Lance Floor Position (Under User Feet or On Pegboard Stand)
  storedLancePos: [2.70, 1.42, 0.152],
  isLanceOnRack: true,
  storeLanceAtPos: (pos: [number, number, number]) => {
    set({ storedLancePos: pos });
  },
  returnLanceToRack: () => {
    set({
      isLanceHeld: false,
      heldTool: 'none',
      isLanceOnRack: true,
      storedLancePos: [2.70, 1.42, 0.152],
      lanceManualDepth: 0.0,
      isHoldingLanceDip: false,
      isLanceDipping: false,
    });
  },

  // Handheld Foundry Tools System (Exclusive: Lance / Shovel / Skimmer)
  heldTool: 'none',
  setHeldTool: (tool: 'none' | 'lance' | 'shovel' | 'skimmer') => {
    set({
      heldTool: tool,
      isLanceHeld: tool === 'lance',
      ...(tool !== 'none'
        ? {
            isRemoteHeld: false,
            isTiltingForward: false,
            isTiltingBackward: false,
            isCraneRemoteHeld: false,
            craneMoveDirs: { x: 0, y: 0, z: 0 },
          }
        : {}),
      ...(tool === 'lance' ? { isLanceOnRack: false } : {}),
      ...(tool !== 'lance' ? { lanceManualDepth: 0.0, isHoldingLanceDip: false, isLanceDipping: false } : {}),
    });
  },
  isCoagulantModalOpen: false,
  setCoagulantModalOpen: (open: boolean) => set({ isCoagulantModalOpen: open }),
  coagulantDoseKg: 1.0,
  setCoagulantDoseKg: (kg: number) => set({ coagulantDoseKg: kg }),
  isShovelFilled: false,
  setIsShovelFilled: (filled: boolean) => set({ isShovelFilled: filled }),
  setPotensioHolding35Kw: () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    set({
      potensioKw: 35,
      powerSetpoint: 35 / 150,
      coilOn: true,
      ac1On: true,
      masterPowerOn: true,
      controlPowerKeyOn: true,
    });
  },

  // Quick Melting 60s Fast-Forward
  isMeltingFastForward: false,
  meltingCountdown: 60,
  triggerQuickMelt60s: () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    set({
      isMeltingFastForward: true,
      meltingCountdown: 60,
      potensioKw: 150,
      powerSetpoint: 1.0,
      coilOn: true,
      ac1On: true,
      masterPowerOn: true,
      controlPowerKeyOn: true,
      chargingStep: 3,
      furnaceChargedFraction: 1.0,
      furnaceMetalMassKg: 250,
      isColdChargeLoaded: true,
      isAlloysAdded: true,
    });
  },

  // Floating Cabinet Control Panel Modal
  isCabinetPanelModalOpen: false,
  setCabinetPanelModalOpen: (open: boolean) => set({ isCabinetPanelModalOpen: open }),

  // Transient Simulation Step with Throttled React UI Sync
  tick: (dtRealSeconds: number) => {
    const state = get();

    // 1. Rigorous Safety & Interlock Validation
    const isTiltSafe = state.tiltAngle <= 30.0;
    const isEffectiveCoilOn =
      state.masterPowerOn &&
      !state.emergencyTripped &&
      state.coilOn &&
      isTiltSafe;

    const canTilt =
      state.masterPowerOn &&
      !state.emergencyTripped &&
      state.tiltPowerOn &&
      state.tiltPermit;

    // 2. Advance Physics Subsystems
    const inputs: SimInputs = {
      coilOn: isEffectiveCoilOn,
      powerSetpoint: isEffectiveCoilOn ? state.powerSetpoint : 0,
      timeScale: state.timeScale,
      isWaterPumpRunning: true,
      isHpuRunning: true,
      isLadlePreheaterActive: true,
      tiltAngleDeg: state.tiltAngle,
      currentMetalMassKg: state.furnaceMetalMassKg,
    };

    const newSim = stepSimulation(state.sim, dtRealSeconds, inputs, state.selectedMaterial);

    // 2b. 60-second Fast-Forward Melting Override
    let newCountdown = state.meltingCountdown;
    let newFastForward = state.isMeltingFastForward;

    if (newFastForward) {
      newCountdown = Math.max(0, newCountdown - dtRealSeconds);
      const progress = Math.min(1.0, (60 - newCountdown) / 60);

      const targetMeltTemp = 1450;
      const baseTemp = 25;
      const targetTemp = baseTemp + progress * (targetMeltTemp - baseTemp);

      if (newSim.temperatureC < targetTemp) {
        newSim.temperatureC = targetTemp;
      }
      if (newSim.meltFraction < progress) {
        newSim.meltFraction = progress;
      }

      const m = state.furnaceMetalMassKg || 250;
      const mat = state.selectedMaterial;
      const H_s = m * mat.specificHeatSolid * (mat.meltingPointC - mat.ambientTempC);
      const H_l = H_s + m * mat.latentHeatFusion;

      if (progress >= 1.0) {
        newSim.phase = 'Liquid';
        newSim.temperatureC = Math.max(newSim.temperatureC, 1450);
        newSim.meltFraction = 1.0;
        newSim.enthalpyJ = H_l + m * mat.specificHeatLiquid * Math.max(0, newSim.temperatureC - mat.meltingPointC);
        newFastForward = false;
        inductionAudio.playSuccess();
      } else {
        if (progress > 0.05 && progress < 0.95) {
          newSim.phase = 'Melting';
        }
        if (targetTemp < mat.meltingPointC) {
          newSim.enthalpyJ = m * mat.specificHeatSolid * (targetTemp - mat.ambientTempC);
        } else {
          newSim.enthalpyJ = H_l + m * mat.specificHeatLiquid * Math.max(0, targetTemp - mat.meltingPointC);
        }
      }
    }

    // 2c. Molten Metal Superheat Holding Continuity
    // Prevents artificial re-freezing between melting, deslagging, pyrometer dipping, and tapping
    if (!newFastForward && state.chargingStep >= 3 && (state.sim.meltFraction >= 0.90 || state.sim.temperatureC >= 1200)) {
      if (state.potensioKw >= 20 || state.coilOn || state.tiltAngle >= 20.0) {
        if (newSim.temperatureC < 1380) {
          newSim.temperatureC = Math.max(newSim.temperatureC, 1420);
          newSim.meltFraction = 1.0;
          newSim.phase = 'Liquid';
          const m = state.furnaceMetalMassKg || 250;
          const mat = state.selectedMaterial;
          const H_s = m * mat.specificHeatSolid * (mat.meltingPointC - mat.ambientTempC);
          const H_l = H_s + m * mat.latentHeatFusion;
          newSim.enthalpyJ = H_l + m * mat.specificHeatLiquid * Math.max(0, newSim.temperatureC - mat.meltingPointC);
        }
      }
    }

    // 3. Tilting Mechanical Motion
    let currentTilt = state.tiltAngle;
    const tiltSpeedDegPerSec = 16.0;
    if (canTilt && state.isTiltingForward) {
      currentTilt = Math.min(90.0, currentTilt + tiltSpeedDegPerSec * dtRealSeconds);
    } else if (canTilt && state.isTiltingBackward) {
      currentTilt = Math.max(0.0, currentTilt - tiltSpeedDegPerSec * dtRealSeconds);
    }

    // 4. Physical Pouring Mechanics & Mass Conservation
    const remainingFraction = Math.min(1.0, Math.max(0, state.furnaceMetalMassKg / 250.0));
    const reqTiltDeg = 30.0 + (1.0 - Math.pow(Math.max(0, remainingFraction), 0.6)) * 45.0;
    const canPour =
      currentTilt >= reqTiltDeg &&
      state.furnaceMetalMassKg > 0.5 &&
      newSim.meltFraction > 0.05;

    let newFurnaceMassKg = state.furnaceMetalMassKg;
    let newLadleMassKg = newSim.ladleMetalMassKg;
    let newLadleMetalTempC = newSim.ladleMetalTempC;
    let newLadlePreheatedVerified = state.ladlePreheatedVerified;

    if (canPour) {
      const overflowDeg = Math.max(0.5, currentTilt - reqTiltDeg);
      const pourRateKgPerSec = 48.0 * Math.min(1.0, overflowDeg / 5.0) * newSim.meltFraction;
      const pouredKg = Math.min(newFurnaceMassKg, pourRateKgPerSec * dtRealSeconds);

      const cranePos = state.cranePosition;
      const isLadleUnderSpout =
        state.pouringTarget === 'ladle' &&
        (state.craneDestination === 'furnace' ||
          (Math.hypot(cranePos[0] - 0.0, cranePos[2] - 1.16) <= 1.85 && cranePos[1] <= 2.8));

      newFurnaceMassKg = Math.max(0, newFurnaceMassKg - pouredKg);
      if (newFurnaceMassKg <= 0.8) {
        newFurnaceMassKg = 0;
      }

      if (isLadleUnderSpout) {
        newLadlePreheatedVerified = true;
        const prevMass = newLadleMassKg;
        newLadleMassKg = Math.min(250.0, newLadleMassKg + pouredKg);

        // When ladle reaches full capacity during tapping, finish emptying the crucible cleanly
        if (newLadleMassKg >= 200.0 && newFurnaceMassKg <= 35.0) {
          newFurnaceMassKg = 0;
        }

        const isPreheated = newSim.ladleRefractoryTempC >= 500.0;
        const entryTempDrop = isPreheated ? 30.0 : 120.0;
        const streamTemp = Math.max(newSim.temperatureC - entryTempDrop, state.selectedMaterial.ambientTempC);

        if (prevMass < 0.5) {
          newLadleMetalTempC = streamTemp;
        } else {
          newLadleMetalTempC = (newLadleMetalTempC * prevMass + streamTemp * pouredKg) / (prevMass + pouredKg);
        }
      }
    }

    const newLadleFraction = Math.min(1.0, newLadleMassKg / 200.0);
    const newFurnaceChargedFraction = Math.min(1.0, newFurnaceMassKg / 250.0);
    newSim.ladleMetalMassKg = newLadleMassKg;
    newSim.ladleMetalTempC = newLadleMetalTempC;

    // 5. Update history ring buffer periodically
    let newHistory = state.history;
    let newLastSampleTime = state.lastHistorySampleTime;

    let newPreheatTimer = state.preheatTimerRemaining;
    let newIsPreheatDone = state.isPreheatDone;
    if (state.coilOn && state.potensioKw >= 10 && !state.isPreheatDone) {
      newPreheatTimer = Math.max(0, state.preheatTimerRemaining - dtRealSeconds);
      if (newPreheatTimer <= 0) {
        newIsPreheatDone = true;
        inductionAudio.playBeep();
      }
    }

    if (newSim.simTimeSeconds - state.lastHistorySampleTime >= HISTORY_SAMPLE_INTERVAL_SEC) {
      newLastSampleTime = newSim.simTimeSeconds;
      const point: HistoryPoint = {
        timeSec: Math.round(newSim.simTimeSeconds),
        tempC: Math.round(newSim.temperatureC * 10) / 10,
        meltFraction: Math.round(newSim.meltFraction * 1000) / 1000,
        powerFraction: Math.round(newSim.powerFraction * 100) / 100,
        phase: newSim.phase,
      };

      newHistory = [...state.history, point];
      if (newHistory.length > MAX_HISTORY_POINTS) {
        newHistory = newHistory.slice(newHistory.length - MAX_HISTORY_POINTS);
      }
    }

    // 6. Validate SOP criteria (21 Scenes from Storyboard Revisi)
    let updatedStepIndex = state.currentSopStepIndex;
    let updatedCompletedMap = state.sopStepCompletedMap;

    if (state.isSopMode && !state.sopStepCompletedMap[state.currentSopStepIndex + 1]) {
      const stepIdx = state.currentSopStepIndex;
      let stepJustPassed = false;

      switch (stepIdx) {
        case 0:
          // Scene 1.1: APD K3 [5/5]
          if (state.apdItems.helmet && state.apdItems.mask && state.apdItems.apron && state.apdItems.gloves && state.apdItems.boots) {
            stepJustPassed = true;
          }
          break;
        case 1:
          // Scene 1.2: Job Order Pinned to HUD
          if (state.isJobOrderPinned) {
            stepJustPassed = true;
          }
          break;
        case 2:
          // Scene 1.3: Inspeksi Krusibel & 1 Cetakan Pasir
          if (state.inspection.bottom && state.inspection.wall && state.inspection.lip && state.inspection.mold) {
            stepJustPassed = true;
          }
          break;
        case 3:
          // Scene 1.4: Emergency stop & APAR
          if (!state.emergencyTripped && state.emergencyVerified && state.aparVerified) {
            stepJustPassed = true;
          }
          break;
        case 4:
          // Scene 2.1: Panel Breaker Listrik Utama ON
          if (state.panelBreakerOn && state.transformerBreakerOn) {
            stepJustPassed = true;
          }
          break;
        case 5:
          // Scene 2.2: Cooling Tower ON
          if (state.coolingTowerSwitchOn) {
            stepJustPassed = true;
          }
          break;
        case 6:
          // Scene 2.3: Pompa Cooling ON & Tekanan Air >= 2.5 Bar
          if (state.coolingPumpSwitchOn && state.waterPressureBar >= 2.5) {
            stepJustPassed = true;
          }
          break;
        case 7:
          // Scene 3.1: Control Power ke kanan ON
          if (state.controlPowerKeyOn && state.masterPowerOn) {
            stepJustPassed = true;
          }
          break;
        case 8:
          // Scene 3.2: Tombol hijau AC ON (Sirkuit AC No. 1) ON
          if (state.ac1On || state.coilOn) {
            stepJustPassed = true;
          }
          break;
        case 9:
          // Scene 3.3: Potensio 10 kW Preheating Selesai (Timer 15s)
          if (state.potensioKw >= 10 && newIsPreheatDone) {
            stepJustPassed = true;
          }
          break;
        case 10:
          // Scene 4.1: Pemilihan Formula & Verifikasi Imbuh Sesuai Job Order
          if (state.selectedFormula === state.jobOrder && state.isAlloyVerified) {
            stepJustPassed = true;
          }
          break;
        case 11:
          // Scene 4.2: Skrap Kering Bebas Air (Anti Steam Explosion)
          if (state.scrapSortedDry) {
            stepJustPassed = true;
          }
          break;
        case 12:
          // Scene 4.3: Pemuatan Berurutan (Starting Block -> Scrap -> Imbuh)
          if (state.chargingStep >= 3 && newFurnaceChargedFraction >= 0.85) {
            stepJustPassed = true;
          }
          break;
        case 13:
          // Scene 4.4: Pull Power 150 kW & Peleburan
          if (state.potensioKw >= 140 && (newSim.meltFraction >= 0.85 || newSim.temperatureC >= 1150)) {
            stepJustPassed = true;
          }
          break;
        case 14:
          // Scene 5.1: Penaburan Koagulan, Deslagging & Sampel Komposisi
          if (state.slagCoagulantAdded && state.isDeslagged && state.chemSampleVerified) {
            stepJustPassed = true;
          }
          break;
        case 15:
          // Scene 5.2: Pengukuran Suhu Pirometer Sesuai Target Job Order
          const currentOrderDetails = JOB_ORDER_PRESETS[state.jobOrder];
          const minTargetTemp = currentOrderDetails
            ? currentOrderDetails.targetTempC - currentOrderDetails.targetToleranceC
            : 1370;
          if (state.immersionTempC !== null && state.immersionTempC >= minTargetTemp) {
            stepJustPassed = true;
          }
          break;
        case 16:
          // Scene 5.3: Preheating Ladel & Tapping Hidrolik >= 60%
          if ((newLadlePreheatedVerified || state.isLadlePreheaterActive) && newLadleFraction >= 0.60) {
            newLadlePreheatedVerified = true;
            stepJustPassed = true;
          }
          break;
        case 17: {
          // Scene 5.4: Penuangan Kontinu ke 1 Cetakan Pasir Tunggal >= 90% DAN Ladel Dikembalikan ke Posisi Semula (Standby [4.0, 0, 0])
          const [cx, , cz] = state.cranePosition;
          const isReturnedToStandby =
            Math.hypot(cx - 4.0, cz - 0.0) <= 1.25 && !state.isLadlePouringToMold;
          if (state.singleMoldFillLevel >= 0.90 && isReturnedToStandby) {
            stepJustPassed = true;
          }
          break;
        }
        case 18:
          // Scene 6.1-6.4: Prosedur Pemadaman Mesin (Potensio 0, AC OFF, Cooling Tower, Breaker Utama)
          if (
            state.shutdownPotensioZero &&
            state.shutdownAc2Off &&
            state.shutdownCoolingTowerOff &&
            state.shutdownPanelBreakerOff
          ) {
            stepJustPassed = true;
          }
          break;
        case 19:
          // Scene 6.5: Pendinginan ± 5 Jam Selesai & Pompa Cooling Dimatikan
          if (state.timeLapse5HoursDone && state.shutdownCoolingPumpOff) {
            stepJustPassed = true;
            set({ isReportCardOpen: true });
            inductionAudio.playFanfare();
          }
          break;
      }

      if (stepJustPassed) {
        inductionAudio.playSuccess();
        updatedCompletedMap = { ...state.sopStepCompletedMap, [stepIdx + 1]: true };
        updatedStepIndex = Math.min(SOP_STEPS.length - 1, stepIdx + 1);
      }
    }

    // 7. Throttled UI State Commit (10 Hz / every 100ms or discrete state changes)
    const now = performance.now();
    const isStateChanged =
      canPour !== state.isPouringStreamActive ||
      stepIdxChanged(state.currentSopStepIndex, updatedStepIndex) ||
      (newSim.waterTripFault !== state.sim.waterTripFault) ||
      (newFastForward !== state.isMeltingFastForward);

    if (now - lastUiSyncTimestamp >= 125 || isStateChanged) {
      lastUiSyncTimestamp = now;
      set({
        sim: newSim,
        tiltAngle: currentTilt,
        furnaceMetalMassKg: newFurnaceMassKg,
        furnaceChargedFraction: newFurnaceChargedFraction,
        ladleFilledFraction: newLadleFraction,
        ladlePreheatedVerified: newLadlePreheatedVerified,
        isPouringStreamActive: canPour,
        history: newHistory,
        lastHistorySampleTime: newLastSampleTime,
        sopStepCompletedMap: updatedCompletedMap,
        currentSopStepIndex: updatedStepIndex,
        preheatTimerRemaining: newPreheatTimer,
        isPreheatDone: newIsPreheatDone,
        isMeltingFastForward: newFastForward,
        meltingCountdown: newCountdown,
      });
    } else {
      // Keep store state in sync for direct 3D access via getState() without re-rendering React
      state.sim = newSim;
      state.tiltAngle = currentTilt;
      state.furnaceMetalMassKg = newFurnaceMassKg;
      state.furnaceChargedFraction = newFurnaceChargedFraction;
      state.ladleFilledFraction = newLadleFraction;
      state.ladlePreheatedVerified = newLadlePreheatedVerified;
      state.isPouringStreamActive = canPour;
      state.preheatTimerRemaining = newPreheatTimer;
      state.isPreheatDone = newIsPreheatDone;
      state.isMeltingFastForward = newFastForward;
      state.meltingCountdown = newCountdown;
    }
  },
}));

function stepIdxChanged(a: number, b: number) {
  return a !== b;
}

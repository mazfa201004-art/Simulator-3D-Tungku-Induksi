import {
  MetalProperties,
  ALUMINUM_PROPERTIES,
  STEFAN_BOLTZMANN,
} from './materials';
import { SimulationPhase, derivePhase } from './phase';

export interface SimInputs {
  coilOn: boolean;
  powerSetpoint: number;
  timeScale: number;
  isWaterPumpRunning?: boolean;
  isHpuRunning?: boolean;
  isLadlePreheaterActive?: boolean;
  tiltAngleDeg?: number;
  currentMetalMassKg?: number;
}

export interface SimState {
  enthalpyJ: number;
  temperatureC: number;
  meltFraction: number;
  powerActualW: number;
  powerFraction: number;
  phase: SimulationPhase;
  heatLossRateW: number;
  heatInputRateW: number;
  simTimeSeconds: number;

  // Water Cooling Subsystem
  coilWaterTempC: number;
  waterFlowRateLpm: number;
  waterPressureBar: number;
  waterTripFault: boolean;

  // Hydraulic Power Unit Subsystem
  hpuPressureBar: number;

  // Inverter Resonant Electrical Instruments
  inverterFreqHz: number;
  dcVolts: number;
  dcAmps: number;
  ifVolts: number;

  // Ladle Thermal Subsystem
  ladleRefractoryTempC: number;
  ladleMetalMassKg: number;
  ladleMetalTempC: number;
  ladleIsSkulled: boolean;
}

/**
 * Creates the initial clean ambient state.
 */
export function createInitialSimState(props: MetalProperties = ALUMINUM_PROPERTIES): SimState {
  return {
    enthalpyJ: 0.0,
    temperatureC: props.ambientTempC,
    meltFraction: 0.0,
    powerActualW: 0.0,
    powerFraction: 0.0,
    phase: 'Idle',
    heatLossRateW: 0.0,
    heatInputRateW: 0.0,
    simTimeSeconds: 0.0,

    coilWaterTempC: 28.0,
    waterFlowRateLpm: 120.0,
    waterPressureBar: 3.2,
    waterTripFault: false,

    hpuPressureBar: 160.0,

    inverterFreqHz: props.nominalInverterFreqHz || 1050,
    dcVolts: 0.0,
    dcAmps: 0.0,
    ifVolts: 0.0,

    ladleRefractoryTempC: props.ambientTempC,
    ladleMetalMassKg: 0.0,
    ladleMetalTempC: props.ambientTempC,
    ladleIsSkulled: false,
  };
}

/**
 * Maps enthalpy H to temperature T (°C) and meltFraction (0..1)
 * based on pure enthalpy thermodynamics.
 */
export function enthalpyToTempAndFraction(
  H: number,
  props: MetalProperties = ALUMINUM_PROPERTIES,
  customMassKg?: number
): { temperatureC: number; meltFraction: number } {
  const m = customMassKg && customMassKg > 0 ? customMassKg : props.massKg;
  const T_amb = props.ambientTempC;
  const T_m = props.meltingPointC;
  const c_s = props.specificHeatSolid;
  const c_l = props.specificHeatLiquid;
  const L = props.latentHeatFusion;

  const H_s = m * c_s * (T_m - T_amb);
  const H_l = H_s + m * L;

  if (H <= 0) {
    return { temperatureC: T_amb, meltFraction: 0.0 };
  }

  if (H < H_s) {
    const T = T_amb + H / (m * c_s);
    return { temperatureC: T, meltFraction: 0.0 };
  }

  if (H <= H_l) {
    const fraction = (H - H_s) / (m * L);
    return {
      temperatureC: T_m,
      meltFraction: Math.min(Math.max(fraction, 0.0), 1.0),
    };
  }

  const T = T_m + (H - H_l) / (m * c_l);
  return { temperatureC: T, meltFraction: 1.0 };
}

/**
 * Computes enthalpy equilibrium when cold ferroalloys are added to hot molten bath.
 * Eliminates artificial reset to 25 °C while respecting thermodynamic cooling.
 */
export function mixAlloyBatch(
  currentEnthalpyJ: number,
  currentMassKg: number,
  alloyMassKg: number,
  props: MetalProperties
): { newMassKg: number; newEnthalpyJ: number; newTempC: number; newMeltFraction: number } {
  const newMassKg = currentMassKg + alloyMassKg;
  // Exothermic deoxidation/dissolution heat bonus (e.g. CaSi / FeSi dissolution in steel)
  const exothermicHeatJ = alloyMassKg * 45000;
  const newEnthalpyJ = Math.max(0, currentEnthalpyJ + exothermicHeatJ);
  const { temperatureC, meltFraction } = enthalpyToTempAndFraction(newEnthalpyJ, props, newMassKg);

  return {
    newMassKg,
    newEnthalpyJ,
    newTempC: temperatureC,
    newMeltFraction: meltFraction,
  };
}

/**
 * Pure simulation step function.
 * Updates thermodynamics, water cooling loop, inverter instruments, and ladle status.
 */
export function stepSimulation(
  state: SimState,
  dtRealSeconds: number,
  inputs: SimInputs,
  props: MetalProperties = ALUMINUM_PROPERTIES
): SimState {
  const dtSim = dtRealSeconds * Math.max(inputs.timeScale, 0.1);

  // 1. Water cooling loop interlock & thermal state
  const isWaterRunning = inputs.isWaterPumpRunning ?? true;
  const targetWaterFlow = isWaterRunning ? 120.0 : 0.0;
  const targetWaterPressure = isWaterRunning ? 3.2 : 0.0;
  const newWaterFlow = state.waterFlowRateLpm + (targetWaterFlow - state.waterFlowRateLpm) * Math.min(dtSim * 2.0, 1.0);
  const newWaterPressure = state.waterPressureBar + (targetWaterPressure - state.waterPressureBar) * Math.min(dtSim * 2.0, 1.0);

  let newWaterTempC = state.coilWaterTempC;
  let waterFault = state.waterTripFault;

  if (isWaterRunning) {
    // Normal water heat rejection (stabilizes between 28°C and 42°C depending on power)
    const targetTemp = 28.0 + state.powerFraction * 14.0;
    newWaterTempC += (targetTemp - newWaterTempC) * Math.min(dtSim * 0.1, 1.0);
    if (newWaterTempC < 55.0) {
      waterFault = false;
    }
  } else {
    // Stagnant water without circulation rapidly heats up if coil is energized
    if (state.powerActualW > 1000) {
      newWaterTempC += state.powerFraction * 8.5 * dtSim;
    } else {
      newWaterTempC += (props.ambientTempC - newWaterTempC) * Math.min(dtSim * 0.02, 1.0);
    }
    // High water temperature trip or lack of flow with power applied
    if (newWaterTempC >= 55.0 || (state.powerActualW > 1000 && newWaterFlow < 20.0)) {
      waterFault = true;
    }
  }

  // 2. Hydraulic system pressure
  const isHpuRunning = inputs.isHpuRunning ?? true;
  const targetHpuPressure = isHpuRunning ? 160.0 : 0.0;
  const newHpuPressure = state.hpuPressureBar + (targetHpuPressure - state.hpuPressureBar) * Math.min(dtSim * 1.5, 1.0);

  // 3. Electrical inverter interlocks
  // Tilting > 30° uncovers upper induction coil, requiring power cutoff
  const tiltDeg = inputs.tiltAngleDeg || 0;
  const isTiltOverLimit = tiltDeg > 30.0;

  const isCoilPermitted = inputs.coilOn && !waterFault && !isTiltOverLimit;

  const targetPowerW =
    isCoilPermitted && inputs.powerSetpoint > 0.001
      ? Math.max(0, Math.min(inputs.powerSetpoint, 1.0)) * props.maxPowerWatts
      : 0.0;

  const maxPowerChangeW = props.powerRampRatePerSec * props.maxPowerWatts * dtRealSeconds;
  let newPowerActualW = state.powerActualW;

  if (targetPowerW > state.powerActualW) {
    newPowerActualW = Math.min(state.powerActualW + maxPowerChangeW, targetPowerW);
  } else if (targetPowerW < state.powerActualW) {
    newPowerActualW = Math.max(state.powerActualW - maxPowerChangeW, targetPowerW);
  }

  const powerFraction = Math.max(0, Math.min(newPowerActualW / props.maxPowerWatts, 1.0));

  // Inverter resonant frequency shifts dynamically with temperature and phase
  const baseFreq = props.nominalInverterFreqHz || 1050;
  const isBelowCurie = state.temperatureC < 768.0;
  const freqShift = isBelowCurie ? -180.0 : state.meltFraction * 70.0;
  const inverterFreqHz = powerFraction > 0.01 ? Math.round(baseFreq + freqShift) : 0;

  const dcVolts = Math.round(powerFraction * 500);
  const dcAmps = Math.round(powerFraction * 240);
  const ifVolts = Math.round(powerFraction * 750);

  // 4. Melt bath heat balance calculations
  const T = state.temperatureC;
  const T_amb = props.ambientTempC;
  const T_kelvin = T + 273.15;
  const Tamb_kelvin = T_amb + 273.15;

  const heatInputRateW = props.efficiency * newPowerActualW;

  const qConvW = props.convectionCoeff * props.surfaceArea * Math.max(0, T - T_amb);
  const qRadW =
    props.emissivity *
    STEFAN_BOLTZMANN *
    props.surfaceArea *
    Math.max(0, Math.pow(T_kelvin, 4) - Math.pow(Tamb_kelvin, 4));

  const heatLossRateW = qConvW + qRadW;
  const netPowerW = heatInputRateW - heatLossRateW;

  // 5. Update furnace enthalpy
  const massKg = inputs.currentMetalMassKg && inputs.currentMetalMassKg > 0 ? inputs.currentMetalMassKg : props.massKg;
  let newEnthalpyJ = Math.max(0, state.enthalpyJ + netPowerW * dtSim);

  const { temperatureC, meltFraction } = enthalpyToTempAndFraction(newEnthalpyJ, props, massKg);

  // 6. Derive discrete simulation phase
  const phase = derivePhase(
    isCoilPermitted,
    inputs.powerSetpoint,
    temperatureC,
    meltFraction,
    props.ambientTempC,
    props.meltingPointC
  );

  // 7. Ladle preheater & transfer thermodynamics
  const isPreheaterActive = inputs.isLadlePreheaterActive ?? false;
  let newLadleRefractoryTempC = state.ladleRefractoryTempC;
  if (isPreheaterActive) {
    newLadleRefractoryTempC += (750.0 - newLadleRefractoryTempC) * Math.min(dtSim * 0.05, 1.0);
  } else {
    newLadleRefractoryTempC += (props.ambientTempC - newLadleRefractoryTempC) * Math.min(dtSim * 0.005, 1.0);
  }

  // Ladle molten metal cooling rate (~1.0°C per second of simulation)
  let newLadleMetalTempC = state.ladleMetalTempC;
  let isSkulled = state.ladleIsSkulled;
  if (state.ladleMetalMassKg > 1.0) {
    const ladleHeatLoss = (newLadleMetalTempC - newLadleRefractoryTempC) * 0.015 * dtSim;
    newLadleMetalTempC = Math.max(props.ambientTempC, newLadleMetalTempC - ladleHeatLoss);
    if (newLadleMetalTempC < props.meltingPointC) {
      isSkulled = true;
    }
  }

  return {
    enthalpyJ: newEnthalpyJ,
    temperatureC,
    meltFraction,
    powerActualW: newPowerActualW,
    powerFraction,
    phase,
    heatLossRateW,
    heatInputRateW,
    simTimeSeconds: state.simTimeSeconds + dtSim,

    coilWaterTempC: newWaterTempC,
    waterFlowRateLpm: newWaterFlow,
    waterPressureBar: newWaterPressure,
    waterTripFault: waterFault,

    hpuPressureBar: newHpuPressure,

    inverterFreqHz,
    dcVolts,
    dcAmps,
    ifVolts,

    ladleRefractoryTempC: newLadleRefractoryTempC,
    ladleMetalMassKg: state.ladleMetalMassKg,
    ladleMetalTempC: newLadleMetalTempC,
    ladleIsSkulled: isSkulled,
  };
}

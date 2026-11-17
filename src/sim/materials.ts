/**
 * Physical properties of materials and induction parameters.
 * Default material: Aluminum (Al)
 */

export interface MetalProperties {
  name: string;
  symbol: string;
  massKg: number;              // kg
  meltingPointC: number;        // °C (solidus/plateau)
  liquidusPointC: number;       // °C (fully liquid)
  tapTempMinC: number;          // °C
  tapTempMaxC: number;          // °C
  overheatWarnTempC: number;    // °C
  ambientTempC: number;         // °C
  specificHeatSolid: number;    // J / (kg · K)
  specificHeatLiquid: number;   // J / (kg · K)
  latentHeatFusion: number;     // J / kg
  convectionCoeff: number;      // W / (m² · K)
  surfaceArea: number;          // m²
  emissivity: number;           // dimensionless 0..1
  maxPowerWatts: number;        // Watts (e.g. 1.8 MW peak coupling)
  efficiency: number;           // electrical-to-thermal coupling efficiency 0..1
  powerRampRatePerSec: number;  // fraction of max power per real-time second (e.g. 0.1 = 10%/s)
  nominalInverterFreqHz: number;// Hz (e.g. 1000 Hz)
}

export const METAL_PRESETS: Record<string, MetalProperties> = {
  aluminum: {
    name: 'Aluminium',
    symbol: 'Al',
    massKg: 500.0,
    meltingPointC: 660.0,
    liquidusPointC: 660.0,
    tapTempMinC: 720.0,
    tapTempMaxC: 760.0,
    overheatWarnTempC: 800.0,
    ambientTempC: 25.0,
    specificHeatSolid: 900.0,
    specificHeatLiquid: 1180.0,
    latentHeatFusion: 397000.0,
    convectionCoeff: 15.0,
    surfaceArea: 2.2,
    emissivity: 0.25,
    maxPowerWatts: 1500000.0,
    efficiency: 0.65,
    powerRampRatePerSec: 0.10,
    nominalInverterFreqHz: 1200,
  },
  fc150: {
    name: 'Besi Cor Kelabu FC 150 (Piringan Pulley)',
    symbol: 'FC 150',
    massKg: 250.0,
    meltingPointC: 1145.0,
    liquidusPointC: 1190.0,
    tapTempMinC: 1370.0,
    tapTempMaxC: 1750.0,
    overheatWarnTempC: 1750.0,
    ambientTempC: 25.0,
    specificHeatSolid: 540.0,
    specificHeatLiquid: 820.0,
    latentHeatFusion: 260000.0,
    convectionCoeff: 12.0,
    surfaceArea: 0.18,
    emissivity: 0.55,
    maxPowerWatts: 150000.0,
    efficiency: 0.78,
    powerRampRatePerSec: 0.10,
    nominalInverterFreqHz: 1000,
  },
  fc250: {
    name: 'Besi Cor Kelabu FC 250 (Impeller Pompa)',
    symbol: 'FC 250',
    massKg: 250.0,
    meltingPointC: 1150.0,
    liquidusPointC: 1200.0,
    tapTempMinC: 1400.0,
    tapTempMaxC: 1750.0,
    overheatWarnTempC: 1750.0,
    ambientTempC: 25.0,
    specificHeatSolid: 540.0,
    specificHeatLiquid: 820.0,
    latentHeatFusion: 260000.0,
    convectionCoeff: 12.0,
    surfaceArea: 0.18,
    emissivity: 0.55,
    maxPowerWatts: 150000.0, // 150 kW Pull Power
    efficiency: 0.78,
    powerRampRatePerSec: 0.10,
    nominalInverterFreqHz: 1000,
  },
  fc300: {
    name: 'Besi Cor Kelabu FC 300 (Tromol Rem Truk)',
    symbol: 'FC 300',
    massKg: 250.0,
    meltingPointC: 1155.0,
    liquidusPointC: 1210.0,
    tapTempMinC: 1430.0,
    tapTempMaxC: 1750.0,
    overheatWarnTempC: 1750.0,
    ambientTempC: 25.0,
    specificHeatSolid: 540.0,
    specificHeatLiquid: 820.0,
    latentHeatFusion: 260000.0,
    convectionCoeff: 12.0,
    surfaceArea: 0.18,
    emissivity: 0.55,
    maxPowerWatts: 150000.0,
    efficiency: 0.78,
    powerRampRatePerSec: 0.10,
    nominalInverterFreqHz: 1000,
  },
  fcd450: {
    name: 'Besi Cor Ulet FCD 450 (Bracket Suspensi)',
    symbol: 'FCD 450',
    massKg: 250.0,
    meltingPointC: 1150.0,
    liquidusPointC: 1200.0,
    tapTempMinC: 1490.0,
    tapTempMaxC: 1750.0,
    overheatWarnTempC: 1750.0,
    ambientTempC: 25.0,
    specificHeatSolid: 540.0,
    specificHeatLiquid: 820.0,
    latentHeatFusion: 260000.0,
    convectionCoeff: 12.0,
    surfaceArea: 0.18,
    emissivity: 0.55,
    maxPowerWatts: 150000.0,
    efficiency: 0.78,
    powerRampRatePerSec: 0.10,
    nominalInverterFreqHz: 1000,
  },
  fcd500: {
    name: 'Besi Cor Nodular FCD 500 (Roda Gigi)',
    symbol: 'FCD 500',
    massKg: 250.0,
    meltingPointC: 1150.0,
    liquidusPointC: 1200.0,
    tapTempMinC: 1500.0,
    tapTempMaxC: 1750.0,
    overheatWarnTempC: 1750.0,
    ambientTempC: 25.0,
    specificHeatSolid: 540.0,
    specificHeatLiquid: 820.0,
    latentHeatFusion: 260000.0,
    convectionCoeff: 12.0,
    surfaceArea: 0.18,
    emissivity: 0.55,
    maxPowerWatts: 150000.0, // 150 kW Pull Power
    efficiency: 0.78,
    powerRampRatePerSec: 0.10,
    nominalInverterFreqHz: 1000,
  },
  castIron: {
    name: 'Besi Cor Kelabu',
    symbol: 'Fe-C',
    massKg: 500.0,
    meltingPointC: 1150.0,
    liquidusPointC: 1200.0,
    tapTempMinC: 1380.0,
    tapTempMaxC: 1750.0,
    overheatWarnTempC: 1750.0,
    ambientTempC: 25.0,
    specificHeatSolid: 540.0,
    specificHeatLiquid: 820.0,
    latentHeatFusion: 260000.0,
    convectionCoeff: 12.0,
    surfaceArea: 0.18,
    emissivity: 0.55,
    maxPowerWatts: 150000.0,
    efficiency: 0.78,
    powerRampRatePerSec: 0.10,
    nominalInverterFreqHz: 1000,
  },
  copper: {
    name: 'Tembaga Murni',
    symbol: 'Cu',
    massKg: 500.0,
    meltingPointC: 1085.0,
    liquidusPointC: 1085.0,
    tapTempMinC: 1150.0,
    tapTempMaxC: 1220.0,
    overheatWarnTempC: 1280.0,
    ambientTempC: 25.0,
    specificHeatSolid: 385.0,
    specificHeatLiquid: 540.0,
    latentHeatFusion: 205000.0,
    convectionCoeff: 16.0,
    surfaceArea: 2.2,
    emissivity: 0.35,
    maxPowerWatts: 1600000.0,
    efficiency: 0.68,
    powerRampRatePerSec: 0.10,
    nominalInverterFreqHz: 1050,
  },
  sus310: {
    name: 'Baja Tahan Panas SUS 310',
    symbol: 'SUS 310',
    massKg: 159.0,
    meltingPointC: 1400.0,
    liquidusPointC: 1450.0,
    tapTempMinC: 1580.0,
    tapTempMaxC: 1620.0,
    overheatWarnTempC: 1680.0,
    ambientTempC: 25.0,
    specificHeatSolid: 500.0,
    specificHeatLiquid: 750.0,
    latentHeatFusion: 270000.0,
    convectionCoeff: 18.0,
    surfaceArea: 2.2,
    emissivity: 0.65,
    maxPowerWatts: 1800000.0,
    efficiency: 0.70,
    powerRampRatePerSec: 0.10,
    nominalInverterFreqHz: 1050,
  },
};

export const ALUMINUM_PROPERTIES: MetalProperties = METAL_PRESETS.aluminum;

export const STEFAN_BOLTZMANN = 5.670374419e-8;


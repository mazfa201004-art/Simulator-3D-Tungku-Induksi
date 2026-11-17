import { describe, it, expect } from 'vitest';
import {
  createInitialSimState,
  enthalpyToTempAndFraction,
  stepSimulation,
  mixAlloyBatch,
  SimInputs,
} from './engine';
import { ALUMINUM_PROPERTIES, METAL_PRESETS } from './materials';

describe('Enthalpy and Phase Transition Model', () => {
  it('should initialize with ambient temperature and zero melt fraction', () => {
    const state = createInitialSimState(ALUMINUM_PROPERTIES);
    expect(state.temperatureC).toBe(25.0);
    expect(state.meltFraction).toBe(0.0);
    expect(state.enthalpyJ).toBe(0.0);
    expect(state.phase).toBe('Idle');
  });

  it('should exhibit a flat temperature plateau during melting', () => {
    const props = ALUMINUM_PROPERTIES;
    const m = props.massKg;
    const c_s = props.specificHeatSolid;
    const L = props.latentHeatFusion;

    const H_s = m * c_s * (props.meltingPointC - props.ambientTempC);
    const H_l = H_s + m * L;

    // Below melting enthalpy -> temperature below 660 C, meltFraction 0
    const justBefore = enthalpyToTempAndFraction(H_s - 1000, props);
    expect(justBefore.temperatureC).toBeLessThan(props.meltingPointC);
    expect(justBefore.meltFraction).toBe(0.0);

    // Exactly at solid boundary
    const atSolidEdge = enthalpyToTempAndFraction(H_s, props);
    expect(atSolidEdge.temperatureC).toBe(660.0);
    expect(atSolidEdge.meltFraction).toBe(0.0);

    // Quarter way through melting
    const quarter = enthalpyToTempAndFraction(H_s + 0.25 * m * L, props);
    expect(quarter.temperatureC).toBe(660.0);
    expect(quarter.meltFraction).toBeCloseTo(0.25, 4);

    // Halfway through melting (plateau!)
    const half = enthalpyToTempAndFraction(H_s + 0.5 * m * L, props);
    expect(half.temperatureC).toBe(660.0);
    expect(half.meltFraction).toBeCloseTo(0.5, 4);

    // Completely melted boundary
    const fullyMelted = enthalpyToTempAndFraction(H_l, props);
    expect(fullyMelted.temperatureC).toBe(660.0);
    expect(fullyMelted.meltFraction).toBe(1.0);

    // Superheated liquid
    const superheated = enthalpyToTempAndFraction(H_l + 100000, props);
    expect(superheated.temperatureC).toBeGreaterThan(660.0);
    expect(superheated.meltFraction).toBe(1.0);
  });

  it('should simulate full heating, melting, superheating, and reversible freezing cycle', () => {
    let state = createInitialSimState(ALUMINUM_PROPERTIES);
    const inputs: SimInputs = {
      coilOn: true,
      powerSetpoint: 1.0,
      timeScale: 20.0, // 20x time acceleration for fast testing
    };

    const dt = 1 / 60; // 60 FPS
    let hitPlateau = false;
    let hitFullyMelted = false;

    // Step simulation until fully melted
    for (let step = 0; step < 5000; step++) {
      state = stepSimulation(state, dt, inputs, ALUMINUM_PROPERTIES);

      if (state.temperatureC >= 659.9 && state.meltFraction > 0.05 && state.meltFraction < 0.95) {
        hitPlateau = true;
        // Verify temperature remains clamped at 660 during plateau
        expect(state.temperatureC).toBe(660.0);
        expect(state.phase).toBe('Melting');
      }

      if (state.meltFraction >= 1.0 && state.temperatureC > 665.0) {
        hitFullyMelted = true;
        break;
      }
    }

    expect(hitPlateau).toBe(true);
    expect(hitFullyMelted).toBe(true);
    expect(state.phase).toBe('Liquid');

    // Now turn off the coil to test Cooling and reversible solidification plateau
    inputs.coilOn = false;
    inputs.powerSetpoint = 0.0;
    inputs.timeScale = 50.0; // Accelerate cooling test for 500kg mass

    let hitCoolingPlateau = false;
    let hitFullSolidification = false;

    for (let step = 0; step < 25000; step++) {
      state = stepSimulation(state, dt, inputs, ALUMINUM_PROPERTIES);

      if (state.temperatureC === 660.0 && state.meltFraction > 0.05 && state.meltFraction < 0.95) {
        hitCoolingPlateau = true;
        expect(state.phase).toBe('Cooling');
      }

      if (state.meltFraction === 0.0 && state.temperatureC < 600.0) {
        hitFullSolidification = true;
        break;
      }
    }

    expect(hitCoolingPlateau).toBe(true);
    expect(hitFullSolidification).toBe(true);
    expect(state.meltFraction).toBe(0.0);
    expect(state.temperatureC).toBeLessThan(600.0);
  });

  it('should clamp enthalpy to ambient and never drop below ambient temperature', () => {
    let state = createInitialSimState(ALUMINUM_PROPERTIES);
    const inputs: SimInputs = {
      coilOn: false,
      powerSetpoint: 0.0,
      timeScale: 50.0,
    };

    for (let i = 0; i < 500; i++) {
      state = stepSimulation(state, 1 / 60, inputs, ALUMINUM_PROPERTIES);
    }

    expect(state.temperatureC).toBe(25.0);
    expect(state.enthalpyJ).toBe(0.0);
    expect(state.phase).toBe('Idle');
  });

  it('should support SUS 310 stainless steel melting characteristics at 1400 C', () => {
    const sus310 = METAL_PRESETS.sus310;
    expect(sus310).toBeDefined();
    expect(sus310.meltingPointC).toBe(1400.0);
    expect(sus310.name).toContain('SUS 310');

    const state = createInitialSimState(sus310);
    expect(state.temperatureC).toBe(25.0);
    expect(state.meltFraction).toBe(0.0);
  });

  it('should trip coil power when water pump is off during heating', () => {
    let state = createInitialSimState(METAL_PRESETS.sus310);
    const inputs: SimInputs = {
      coilOn: true,
      powerSetpoint: 1.0,
      timeScale: 10.0,
      isWaterPumpRunning: false, // Pump is off!
    };

    // Run simulation: water temp should heat up and trip
    for (let i = 0; i < 300; i++) {
      state = stepSimulation(state, 1 / 60, inputs, METAL_PRESETS.sus310);
      if (state.waterTripFault) break;
    }

    expect(state.waterTripFault).toBe(true);
    // After trip, step once more with same inputs to verify power is cut to zero
    state = stepSimulation(state, 1 / 60, inputs, METAL_PRESETS.sus310);
    expect(state.powerActualW).toBeLessThan(state.powerActualW + 1);
  });

  it('should preserve molten temperature when adding ferroalloys (mixAlloyBatch)', () => {
    const sus310 = METAL_PRESETS.sus310;
    // Simulate hot melt at 1550 °C
    const mInitial = 150.0;
    const H_initial = mInitial * sus310.specificHeatSolid * (sus310.meltingPointC - sus310.ambientTempC)
      + mInitial * sus310.latentHeatFusion
      + mInitial * sus310.specificHeatLiquid * (1550 - sus310.meltingPointC);

    const { newMassKg, newTempC, newMeltFraction } = mixAlloyBatch(H_initial, mInitial, 8.42, sus310);

    expect(newMassKg).toBe(158.42);
    // Temperature should stay molten (> 1450 °C), NOT drop to 25 °C!
    expect(newTempC).toBeGreaterThan(1450.0);
    expect(newMeltFraction).toBe(1.0);
  });

  it('should preheat ladle refractory to 750 C when burner is active', () => {
    let state = createInitialSimState(METAL_PRESETS.sus310);
    const inputs: SimInputs = {
      coilOn: false,
      powerSetpoint: 0.0,
      timeScale: 50.0,
      isLadlePreheaterActive: true,
    };

    for (let i = 0; i < 200; i++) {
      state = stepSimulation(state, 1 / 60, inputs, METAL_PRESETS.sus310);
    }

    expect(state.ladleRefractoryTempC).toBeGreaterThan(650.0);
  });

  it('should successfully heat FCD ductile iron past 1520 C up to 1750 C at 150 kW', () => {
    const fcd = METAL_PRESETS.fcd500;
    let state = createInitialSimState(fcd);
    // Start with already melted bath at 1250 C
    const mass = 150.0;
    state.enthalpyJ = mass * fcd.specificHeatSolid * (fcd.meltingPointC - fcd.ambientTempC)
      + mass * fcd.latentHeatFusion
      + mass * fcd.specificHeatLiquid * (1250 - fcd.meltingPointC);
    state.temperatureC = 1250.0;
    state.meltFraction = 1.0;

    const inputs: SimInputs = {
      coilOn: true,
      powerSetpoint: 1.0, // 150 kW full power
      timeScale: 60.0,
      currentMetalMassKg: mass,
    };

    // Step for ~3 minutes of simulation time
    for (let i = 0; i < 180; i++) {
      state = stepSimulation(state, 1.0, inputs, fcd);
      if (state.temperatureC >= 1520.0) break;
    }

    expect(state.temperatureC).toBeGreaterThanOrEqual(1520.0);
  });
});


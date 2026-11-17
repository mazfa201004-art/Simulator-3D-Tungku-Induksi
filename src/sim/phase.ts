export type SimulationPhase = 'Idle' | 'Heating' | 'Melting' | 'Liquid' | 'Cooling';

/**
 * Derives the active physical phase:
 * - Idle: Machine off, at or near ambient temperature.
 * - Heating: Coil active and power > 0, solid metal warming up (T < T_m, meltFraction = 0).
 * - Melting: Coil active and metal reaching melting point or undergoing phase change (0 < meltFraction < 1).
 * - Liquid: Coil active and metal fully molten (meltFraction >= 1.0) and superheating.
 * - Cooling: Coil off or power = 0, metal still significantly above ambient temperature.
 */
export function derivePhase(
  coilOn: boolean,
  powerSetpoint: number,
  temperatureC: number,
  meltFraction: number,
  ambientTempC: number = 25.0,
  meltingPointC: number = 660.0
): SimulationPhase {
  if (coilOn && powerSetpoint > 0.001) {
    if (meltFraction >= 0.999) {
      return 'Liquid';
    }
    if (meltFraction > 0.001 || temperatureC >= meltingPointC - 0.2) {
      return 'Melting';
    }
    return 'Heating';
  } else {
    // Coil off or setpoint zero -> cooling down towards ambient
    if (temperatureC > ambientTempC + 5.0 || meltFraction > 0.001) {
      return 'Cooling';
    }
    return 'Idle';
  }
}


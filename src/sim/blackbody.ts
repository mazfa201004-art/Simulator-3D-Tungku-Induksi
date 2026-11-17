export interface GlowColor {
  r: number;
  g: number;
  b: number;
  emissiveIntensity: number;
  hex: string;
}

/**
 * Computes blackbody radiant emission color and intensity from temperature in Celsius.
 * Optimized with smooth hermite / polynomial transitions suitable for real-time rendering.
 */
export function getBlackbodyColor(tempC: number): GlowColor {
  // Below 450 °C: negligible visible incandescent glow
  if (tempC < 450) {
    const t = Math.max(0, (tempC - 350) / 100);
    const faint = t * 0.08;
    return {
      r: faint,
      g: 0,
      b: 0,
      emissiveIntensity: faint * 0.2,
      hex: '#000000',
    };
  }

  // Clamped normalized temperature factor
  // 450 °C -> 1300 °C
  const norm = Math.min(Math.max((tempC - 450) / (1300 - 450), 0), 1);

  // Blackbody radiation curve progression:
  // Faint dark red -> Cherry red -> Orange -> Golden yellow -> Incandescent white-yellow
  let r: number, g: number, b: number;

  if (norm < 0.25) {
    // 450°C to ~660°C (Dull dark red to cherry red)
    const sub = norm / 0.25;
    r = 0.35 + 0.55 * sub;
    g = 0.04 + 0.14 * sub;
    b = 0.01;
  } else if (norm < 0.6) {
    // 660°C to ~960°C (Cherry red to vibrant magma orange)
    const sub = (norm - 0.25) / 0.35;
    r = 0.90 + 0.10 * sub;
    g = 0.18 + 0.42 * sub;
    b = 0.01 + 0.05 * sub;
  } else {
    // 960°C to 1300°C+ (Vibrant molten golden amber - saturated without bleaching white)
    const sub = (norm - 0.6) / 0.4;
    r = 1.0;
    g = 0.60 + 0.24 * sub;
    b = 0.06 + 0.20 * sub;
  }

  // Calibrated emissive intensity: smooth progressive radiance without blinding HDR blowout
  const emissiveIntensity = Math.pow(norm, 2.0) * 1.35 + (tempC >= 660 ? 0.30 : 0.04);

  const clamp255 = (v: number) => Math.min(255, Math.max(0, Math.round(v * 255)));
  const hex = `#${clamp255(r).toString(16).padStart(2, '0')}${clamp255(g).toString(16).padStart(2, '0')}${clamp255(b).toString(16).padStart(2, '0')}`;

  return {
    r,
    g,
    b,
    emissiveIntensity,
    hex,
  };
}

/**
 * Computes copper coil induction glow based on actual power fraction (0..1)
 * High-frequency electromagnetic induction produces characteristic reddish/orange/cyan electrical ionization and heating
 */
export function getCoilGlow(powerFraction: number): GlowColor {
  if (powerFraction <= 0.001) {
    return { r: 0.15, g: 0.05, b: 0.02, emissiveIntensity: 0.0, hex: '#260d05' };
  }

  // Copper coil glowing from dark coppery to warm heated copper
  const r = 0.75 + 0.25 * powerFraction;
  const g = 0.15 + 0.25 * powerFraction;
  const b = 0.02 + 0.08 * powerFraction;
  const emissiveIntensity = Math.pow(powerFraction, 1.8) * 1.0;

  const clamp255 = (v: number) => Math.min(255, Math.max(0, Math.round(v * 255)));
  const hex = `#${clamp255(r).toString(16).padStart(2, '0')}${clamp255(g).toString(16).padStart(2, '0')}${clamp255(b).toString(16).padStart(2, '0')}`;

  return { r, g, b, emissiveIntensity, hex };
}

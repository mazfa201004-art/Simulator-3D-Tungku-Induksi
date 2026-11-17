import * as THREE from 'three';

/**
 * Centralized Shared Three.js Materials Library.
 * Reusing singleton material instances avoids compiling thousands of duplicate shaders
 * and drastically reduces WebGL state changes and memory overhead.
 */

// 1. Structural Steel & Metal Finishes
export const MAT_DARK_STEEL = new THREE.MeshStandardMaterial({
  color: '#1e293b',
  metalness: 0.75,
  roughness: 0.35,
});

export const MAT_MID_STEEL = new THREE.MeshStandardMaterial({
  color: '#334155',
  metalness: 0.8,
  roughness: 0.3,
});

export const MAT_CAST_STEEL = new THREE.MeshStandardMaterial({
  color: '#64748b',
  metalness: 0.5,
  roughness: 0.45,
});

export const MAT_LIGHT_CHROME = new THREE.MeshStandardMaterial({
  color: '#cbd5e1',
  metalness: 0.9,
  roughness: 0.2,
});

export const MAT_DARK_FRAME = new THREE.MeshStandardMaterial({
  color: '#0f172a',
  metalness: 0.85,
  roughness: 0.25,
});

// 2. Copper & Non-Ferrous Alloys
export const MAT_COPPER = new THREE.MeshStandardMaterial({
  color: '#c25e1a',
  metalness: 0.9,
  roughness: 0.22,
});

export const MAT_BRASS = new THREE.MeshStandardMaterial({
  color: '#eab308',
  metalness: 0.85,
  roughness: 0.25,
});

// 3. Industrial Safety Colors
export const MAT_SAFETY_YELLOW = new THREE.MeshStandardMaterial({
  color: '#ca8a04',
  metalness: 0.3,
  roughness: 0.5,
});

export const MAT_SAFETY_RED = new THREE.MeshStandardMaterial({
  color: '#dc2626',
  metalness: 0.3,
  roughness: 0.4,
});

export const MAT_CABINET_ORANGE = new THREE.MeshStandardMaterial({
  color: '#ea580c',
  metalness: 0.3,
  roughness: 0.35,
});

export const MAT_MOTOR_GREEN = new THREE.MeshStandardMaterial({
  color: '#047857',
  metalness: 0.6,
  roughness: 0.4,
});

export const MAT_WATER_BLUE = new THREE.MeshStandardMaterial({
  color: '#0284c7',
  metalness: 0.65,
  roughness: 0.35,
});

// 4. Refractory Ceramics & Insulation
export const MAT_REFRACTORY = new THREE.MeshStandardMaterial({
  color: '#b45309',
  roughness: 0.92,
  metalness: 0.05,
});

export const MAT_CONCRETE = new THREE.MeshStandardMaterial({
  color: '#475569',
  roughness: 0.88,
  metalness: 0.08,
});

export const MAT_SLAG = new THREE.MeshStandardMaterial({
  color: '#292524',
  roughness: 0.95,
  metalness: 0.1,
});

// 5. Shared Basic Utility Materials
export const MAT_BASIC_WHITE = new THREE.MeshBasicMaterial({ color: '#ffffff' });
export const MAT_BASIC_BLACK = new THREE.MeshBasicMaterial({ color: '#000000' });
export const MAT_BASIC_YELLOW = new THREE.MeshBasicMaterial({ color: '#facc15' });
export const MAT_BASIC_RED = new THREE.MeshBasicMaterial({ color: '#ef4444' });
export const MAT_BASIC_GREEN = new THREE.MeshBasicMaterial({ color: '#22c55e' });
export const MAT_BASIC_CYAN = new THREE.MeshBasicMaterial({ color: '#06b6d4' });

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '../../store/useSimStore';
import { getBlackbodyColor } from '../../sim/blackbody';

interface MetalLiquidProps {
  position?: [number, number, number];
}

export const MetalLiquid: React.FC<MetalLiquidProps> = ({ position = [0, 0, 0] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Custom uniforms for dynamic stirring ripples
  const customUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uStirringSpeed: { value: 1.0 },
      uWaveHeight: { value: 0.006 },
    }),
    []
  );

  useFrame(({ clock }) => {
    const { sim, tiltAngle, furnaceChargedFraction, furnaceMetalMassKg } = useSimStore.getState();
    const melt = sim.meltFraction; // 0..1
    const temp = sim.temperatureC;
    const power = sim.powerFraction;

    if (!meshRef.current) return;

    // Remaining liquid volume inside crucible based strictly on actual metal mass left inside furnace
    const remainingMassFrac = Math.min(1.0, Math.max(0, furnaceMetalMassKg / 250.0));
    const remainingFraction = Math.max(0, melt * remainingMassFrac);

    if (furnaceChargedFraction <= 0 || furnaceMetalMassKg <= 0.5 || remainingFraction <= 0.005) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    const tiltRad = (tiltAngle * Math.PI) / 180;
    const cosT = Math.cos(tiltRad);
    const sinT = Math.sin(tiltRad);

    // Dynamic tilt threshold required for meniscus to reach the pouring lip
    // Matches exact physics in useSimStore: full charge pours at ~30°, half at ~45°, dregs at 65°-75°
    const reqTiltDeg = 30.0 + (1.0 - Math.pow(Math.max(0, remainingMassFrac), 0.6)) * 45.0;
    const climb = Math.min(1.0, tiltAngle / Math.max(1.0, reqTiltDeg));

    // Semi-minor radius (X axis) and elliptical semi-major axis (along tilt slope)
    // Clamped strictly inside inner refractory crucible wall (rInner <= 0.25m) so liquid NEVER pokes outside the furnace shell when tilted!
    const rx = Math.min(0.24, 0.22 * (0.48 + remainingFraction * 0.52));
    const maxRy = 0.245;
    const ry = Math.min(maxRy, rx / Math.max(0.65, cosT));

    // 1. Counter-rotation: Liquid surface stays strictly HORIZONTAL under gravity in world space
    meshRef.current.rotation.x = -Math.PI / 2 - tiltRad;

    // 2. Liquid meniscus center inside the crucible cavity (never exceeds crucible inner radius or bottom floor):
    const yUpright = position[1] - 0.28 + remainingFraction * 0.50;
    const yNotch = 0.36; // Inside upper crucible mouth near pouring notch
    const zNotch = 0.14; // Shifted forward inside crucible cavity without piercing outer shell

    const zCenter = THREE.MathUtils.clamp(climb * zNotch + sinT * 0.04, -0.08, 0.16);
    const yCenter = THREE.MathUtils.clamp((1.0 - climb) * yUpright + climb * yNotch, -0.28, 0.38);

    meshRef.current.position.set(position[0], yCenter, zCenter);

    // 3. Elliptical meniscus cross-section: circle base radius is 0.22m
    const scaleX = rx / 0.22;
    const scaleY = ry / 0.22;
    meshRef.current.scale.set(scaleX, scaleY, 1.0);

    // Update shader uniforms for electromagnetic stirring
    customUniforms.uTime.value = clock.getElapsedTime();
    customUniforms.uStirringSpeed.value = 2.0 + power * 8.0; // Vigorously stirs when high induction current flows
    customUniforms.uWaveHeight.value = 0.003 + power * 0.007;

    // Update blackbody incandescent emission
    if (materialRef.current) {
      const glow = getBlackbodyColor(temp);
      materialRef.current.emissive.setRGB(glow.r, glow.g, glow.b);
      materialRef.current.emissiveIntensity = glow.emissiveIntensity;
    }
  });

  return (
    <mesh
      ref={meshRef}
      name="VFX_MetalLiquid"
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        const st = useSimStore.getState();
        if (st.heldTool === 'shovel' && st.isShovelFilled && !st.isSlagSequenceActive) {
          e.stopPropagation();
          st.throwCoagulantFromShovel();
        } else if (st.heldTool === 'skimmer' && !st.isSlagSequenceActive) {
          e.stopPropagation();
          st.skimSlagWithRake();
        }
      }}
    >
      {/* High-segment disk for liquid stirring vertex displacement */}
      <circleGeometry args={[0.22, 64]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#f97316"
        metalness={0.88}
        roughness={0.22}
        onBeforeCompile={(shader) => {
          shader.uniforms.uTime = customUniforms.uTime;
          shader.uniforms.uStirringSpeed = customUniforms.uStirringSpeed;
          shader.uniforms.uWaveHeight = customUniforms.uWaveHeight;

          // Inject vertex displacement for electromagnetic stirring and UV passing
          shader.vertexShader = `
            uniform float uTime;
            uniform float uStirringSpeed;
            uniform float uWaveHeight;
            varying vec2 vLiquidUv;
            ${shader.vertexShader}
          `;

          shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            vLiquidUv = uv;
            float dist = length(position.xy);
            float angle = atan(position.y, position.x);
            // Swirling electromagnetic Lorentz wave
            float wave = sin(dist * 25.0 - uTime * uStirringSpeed + angle * 3.0) * uWaveHeight;
            transformed.z += wave * smoothstep(0.0, 0.2, dist);
            `
          );

          // Inject fragment shader for floating oxide slag / dross crust
          shader.fragmentShader = `
            uniform float uTime;
            uniform float uStirringSpeed;
            varying vec2 vLiquidUv;
            ${shader.fragmentShader}
          `;

          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `
            #include <dithering_fragment>
            // Procedural Metallurgical Oxide Slag & Dross Crust
            vec2 p = (vLiquidUv - vec2(0.5)) * 9.0;
            float r = length(vLiquidUv - vec2(0.5));
            float angle = atan(vLiquidUv.y - 0.5, vLiquidUv.x - 0.5);
            float swirl = angle + uTime * uStirringSpeed * 0.12;
            vec2 rotatedP = vec2(cos(swirl) * p.x - sin(swirl) * p.y, sin(swirl) * p.x + cos(swirl) * p.y);
            
            float crustNoise = sin(rotatedP.x * 2.2 + sin(rotatedP.y * 2.8)) * cos(rotatedP.y * 2.2 + cos(rotatedP.x * 2.5));
            float drossMask = smoothstep(0.12, 0.65, crustNoise) * smoothstep(0.48, 0.38, r);

            // Oxide ash slag color (dark matte refractory slag with slight grey-brown tone)
            vec3 drossColor = vec3(0.16, 0.18, 0.21);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, drossColor, drossMask * 0.72);
            `
          );
        }}
      />
    </mesh>
  );
};

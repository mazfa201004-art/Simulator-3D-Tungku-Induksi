import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '../../store/useSimStore';

interface HeatHazeProps {
  position?: [number, number, number];
}

export const HeatHaze: React.FC<HeatHazeProps> = ({ position = [0, 0.45, 0] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    const temp = useSimStore.getState().sim.temperatureC;
    // Haze appears above 400 °C, increasing with temperature up to 1000 °C
    const targetIntensity = Math.min(Math.max((temp - 400) / 450, 0), 1.0);

    if (!meshRef.current) return;
    if (targetIntensity <= 0.01) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uIntensity.value = targetIntensity;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <cylinderGeometry args={[0.18, 0.16, 0.35, 24, 8, true]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vNormal;
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uIntensity;
          varying vec2 vUv;
          varying vec3 vNormal;

          // Simple procedural turbulent noise
          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
              mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
              u.y
            );
          }

          void main() {
            // Rising heat waves
            vec2 waveUv = vec2(vUv.x * 6.0, vUv.y * 4.0 - uTime * 2.5);
            float n = noise(waveUv);

            // Shimmer opacity faded at top and bottom edges
            float edgeFade = sin(vUv.y * 3.14159);
            float alpha = n * uIntensity * 0.28 * edgeFade;

            // Subtle warm thermal tint
            vec3 hazeColor = mix(vec3(1.0, 0.8, 0.5), vec3(1.0, 0.4, 0.1), uIntensity * 0.5);

            gl_FragColor = vec4(hazeColor, alpha);
          }
        `}
      />
    </mesh>
  );
};

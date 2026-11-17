import React from 'react';
import { useProgress, Text } from '@react-three/drei';

export const CanvasLoader: React.FC = () => {
  const { progress } = useProgress();

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Loading Ring */}
      <mesh rotation={[0, 0, 0]}>
        <ringGeometry args={[0.3, 0.35, 32]} />
        <meshBasicMaterial color="#0284c7" wireframe />
      </mesh>

      {/* Progress percentage text */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.08}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {Math.round(progress)}%
      </Text>

      <Text
        position={[0, -0.45, 0.01]}
        fontSize={0.04}
        color="#94a3b8"
        anchorX="center"
        anchorY="top"
      >
        MEMUAT SIMULASI 3D...
      </Text>
    </group>
  );
};

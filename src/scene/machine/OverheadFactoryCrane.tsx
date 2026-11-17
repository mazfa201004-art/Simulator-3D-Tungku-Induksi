import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

interface OverheadFactoryCraneProps {
  cranePosRef?: React.RefObject<THREE.Vector3>;
  cranePosition?: [number, number, number];
  isLiteMode?: boolean;
}

export const OverheadFactoryCrane: React.FC<OverheadFactoryCraneProps> = ({
  cranePosRef,
  cranePosition = [3.2, 3.5, 2.5],
  isLiteMode = false,
}) => {
  const bridgeRef = useRef<THREE.Group>(null);
  const trolleyRef = useRef<THREE.Group>(null);
  const cablesRef = useRef<THREE.Group>(null);

  // Initial coordinates
  const initialPos = cranePosRef?.current || new THREE.Vector3(...cranePosition);
  const cx = initialPos.x;
  const cy = initialPos.y;
  const cz = initialPos.z;

  const railY = 5.60;
  const leftRailX = isLiteMode ? -3.2 : -11.0;
  const rightRailX = isLiteMode ? 6.4 : 11.0;
  const bridgeLength = rightRailX - leftRailX;
  const bridgeCenterX = (leftRailX + rightRailX) / 2;
  const runwayLength = isLiteMode ? 6.6 : 23.0;

  const craneYellowMat = {
    color: '#eab308',
    metalness: 0.35,
    roughness: 0.40,
  };

  const structuralSteelMat = {
    color: '#475569',
    metalness: 0.65,
    roughness: 0.35,
  };

  const brightSteelMat = {
    color: '#cbd5e1',
    metalness: 0.85,
    roughness: 0.20,
  };

  // High-performance direct Three.js transform updates without triggering React re-renders
  useFrame(() => {
    const pos = cranePosRef?.current;
    if (!pos) return;

    if (bridgeRef.current) {
      bridgeRef.current.position.z = pos.z;
    }

    if (trolleyRef.current) {
      trolleyRef.current.position.x = pos.x;
      trolleyRef.current.position.z = pos.z;
    }

    if (cablesRef.current) {
      const trolleyDrumY = railY + 0.58;
      const ladlePulleyY = pos.y + 1.80;
      const cableLength = Math.max(0.05, trolleyDrumY - ladlePulleyY);
      cablesRef.current.scale.set(1, cableLength, 1);
      cablesRef.current.position.y = 0.16 - cableLength / 2;
    }
  });

  const initialCableLength = Math.max(0.05, railY + 0.58 - (cy + 1.80));

  return (
    <group name="ENV_OverheadFactoryCrane">
      {/* 1. Fixed Longitudinal Runway Rails */}
      {[leftRailX, rightRailX].map((rx, ri) => (
        <group key={ri} position={[rx, railY, 0]}>
          <mesh>
            <boxGeometry args={[0.4, 0.5, runwayLength]} />
            <meshStandardMaterial {...structuralSteelMat} />
          </mesh>
          <mesh position={[0, 0.30, 0]}>
            <boxGeometry args={[0.15, 0.1, runwayLength]} />
            <meshStandardMaterial {...brightSteelMat} />
          </mesh>

          {!isLiteMode ? (
            [-8, -4, 0, 4, 8].map((colZ, ci) => (
              <mesh key={ci} position={[ri === 0 ? -0.55 : 0.55, -0.15, colZ]}>
                <boxGeometry args={[0.8, 0.3, 0.35]} />
                <meshStandardMaterial {...structuralSteelMat} />
              </mesh>
            ))
          ) : (
            [-2.6, 2.6].map((legZ, li) => (
              <group key={`gantry-leg-${li}`} position={[0, -railY / 2, legZ]}>
                <mesh>
                  <boxGeometry args={[0.20, railY, 0.20]} />
                  <meshStandardMaterial {...structuralSteelMat} />
                </mesh>
                <mesh position={[0, -railY / 2 + 0.02, 0]}>
                  <boxGeometry args={[0.38, 0.04, 0.38]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.8} />
                </mesh>
              </group>
            ))
          )}
        </group>
      ))}

      {/* 2. Traveling Bridge Girder */}
      <group ref={bridgeRef} position={[bridgeCenterX, railY + 0.16, cz]}>
        {[-0.22, 0.22].map((gz, gi) => (
          <group key={gi} position={[0, 0, gz]}>
            <mesh>
              <boxGeometry args={[bridgeLength, 0.38, 0.16]} />
              <meshStandardMaterial {...craneYellowMat} />
            </mesh>
            <mesh position={[0, 0.20, 0]}>
              <boxGeometry args={[bridgeLength, 0.03, 0.05]} />
              <meshStandardMaterial {...brightSteelMat} />
            </mesh>
          </group>
        ))}

        <Text
          position={[0, 0, 0.31]}
          fontSize={isLiteMode ? 0.11 : 0.14}
          color="#0f172a"
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          {isLiteMode ? 'FOUNDRY HOIST 10T' : '10 TON FOUNDRY OVERHEAD TRAVELING CRANE'}
        </Text>

        {[-bridgeLength / 2, bridgeLength / 2].map((bx, bi) => (
          <group key={bi} position={[bx, -0.06, 0]}>
            <mesh>
              <boxGeometry args={[0.30, 0.22, 0.90]} />
              <meshStandardMaterial {...craneYellowMat} />
            </mesh>
            {[-0.32, 0.32].map((wz, wi) => (
              <mesh key={wi} position={[0, -0.10, wz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.07, 0.07, 0.12, 20]} />
                <meshStandardMaterial {...brightSteelMat} />
              </mesh>
            ))}
          </group>
        ))}

        <mesh position={[-bridgeLength / 2 + 0.5, 0.15, 0.35]}>
          <cylinderGeometry args={[0.09, 0.09, 0.28, 16]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
      </group>

      {/* 3. Traveling Hoist Trolley */}
      <group ref={trolleyRef} position={[cx, railY + 0.42, cz]}>
        <mesh>
          <boxGeometry args={[0.68, 0.18, 0.62]} />
          <meshStandardMaterial {...craneYellowMat} />
        </mesh>

        <mesh position={[0, 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 0.52, 24]} />
          <meshStandardMaterial {...brightSteelMat} />
        </mesh>

        <mesh position={[0.32, 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.11, 0.11, 0.16, 20]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>

        <mesh position={[0, 0.34, 0.22]}>
          <cylinderGeometry args={[0.045, 0.055, 0.10, 16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.8} />
        </mesh>

        {[-0.28, 0.28].map((tx, ti) => (
          <React.Fragment key={ti}>
            <mesh position={[tx, -0.12, -0.22]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, 0.08, 16]} />
              <meshStandardMaterial {...brightSteelMat} />
            </mesh>
            <mesh position={[tx, -0.12, 0.22]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, 0.08, 16]} />
              <meshStandardMaterial {...brightSteelMat} />
            </mesh>
          </React.Fragment>
        ))}

        {/* Dynamic Hoist Cables */}
        <group
          ref={cablesRef}
          position={[0, 0.16 - initialCableLength / 2, 0]}
          scale={[1, initialCableLength, 1]}
        >
          {[-0.06, 0.06].map((wx, wi) => (
            <mesh key={`hoist-cable-${wi}`} position={[wx, 0, 0]}>
              <cylinderGeometry args={[0.010, 0.010, 1, 12]} />
              <meshStandardMaterial {...brightSteelMat} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
};

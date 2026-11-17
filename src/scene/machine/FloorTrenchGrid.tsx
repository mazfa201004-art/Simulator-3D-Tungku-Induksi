import React from 'react';

interface FloorTrenchGridProps {
  position?: [number, number, number];
}

/**
 * Heavy Industrial Floor Cable & Utility Trench Grid (Saluran Parit Utilitas Lantai).
 * - Connects the 20kV Step-Down Transformer Substation to the IF Power Supply Cabinet.
 * - Chequer-plate diamond steel trench covers with safety yellow-black hazard caution borders.
 * - Encloses the heavy 380V copper busbars connecting the transformer to the induction power cabinet.
 */
export const FloorTrenchGrid: React.FC<FloorTrenchGridProps> = ({ position = [0, 0, 0] }) => {
  const chequerMat = { color: '#334155', metalness: 0.85, roughness: 0.35 };
  const trenchPitMat = { color: '#0f172a', roughness: 0.95 };
  const copperBusMat = { color: '#b45309', metalness: 0.9, roughness: 0.2 };
  const blackCableMat = { color: '#1e293b', roughness: 0.6 };

  return (
    <group position={position} name="FloorTrenchGrid">
      {/* ========================================================================= */}
      {/* UTILITY TRENCH: LOCAL SERVICE DUCT BEHIND POWER CABINET (z = -2.0 to 0.0) */}
      {/* ========================================================================= */}
      {/* Trench Channel Embed Frame */}
      <mesh position={[-2.4, 0.001, -1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.64, 2.2]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.9} />
      </mesh>
      {/* Heavy Modular Steel Diamond-Plate Covers (2 modular 1m segments with finger pulls) */}
      {[-1.5, -0.6].map((cz, i) => (
        <group key={`tcover-ns-${i}`} position={[-2.4, 0.003, cz]}>
          {/* Main diamond-plate panel */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.58, 0.86]} />
            <meshStandardMaterial {...chequerMat} />
          </mesh>
          {/* Recessed finger-pull lift holes */}
          {[-0.20, 0.20].map((fz, fi) => (
            <mesh key={`fp-ns-${fi}`} position={[0, 0.001, fz]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.024, 16]} />
              <meshStandardMaterial color="#090d16" roughness={0.9} />
            </mesh>
          ))}
          {/* Subtle panel border bevel frame */}
          <mesh position={[0, -0.001, 0]}>
            <boxGeometry args={[0.60, 0.004, 0.88]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ========================================================================= */}
      {/* 3. VISIBLE INCOMING COPPER BUSBARS & HEAVY CABLES INTO POWERCABINET BASE  */}
      {/* ========================================================================= */}
      <group position={[-2.4, 0.05, 0.0]}>
        {/* Recessed trench pit beneath cabinet */}
        <mesh position={[0, -0.04, 0]}>
          <boxGeometry args={[0.5, 0.08, 0.5]} />
          <meshStandardMaterial {...trenchPitMat} />
        </mesh>
        {/* 3 Massive Copper Phase Busbars emerging up into cabinet bottom */}
        {[-0.12, 0, 0.12].map((bx, bi) => (
          <mesh key={`cbus-${bi}`} position={[bx, 0.12, 0]}>
            <boxGeometry args={[0.035, 0.24, 0.07]} />
            <meshStandardMaterial {...copperBusMat} />
          </mesh>
        ))}
        {/* Heavy Black Armored Cable Bundle */}
        {[-0.08, 0.08].map((cx, ci) => (
          <mesh key={`acable-${ci}`} position={[cx, 0.1, -0.15]}>
            <cylinderGeometry args={[0.035, 0.035, 0.2, 12]} />
            <meshStandardMaterial {...blackCableMat} />
          </mesh>
        ))}
      </group>

    </group>
  );
};

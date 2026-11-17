import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useSimStore, CameraPreset } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

interface CameraRigProps {
  isDraggingKnob?: boolean;
}

const PRESET_CONFIGS: Record<CameraPreset, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  overview: {
    pos: new THREE.Vector3(0.0, 1.68, 5.2),
    target: new THREE.Vector3(0.0, 1.20, 0.0),
  },
  cabinet: {
    pos: new THREE.Vector3(-2.40, 1.68, 1.65),
    target: new THREE.Vector3(-2.40, 1.20, 0.4),
  },
  'cabinet-niche': {
    pos: new THREE.Vector3(-2.09, 1.68, 1.08),
    target: new THREE.Vector3(-2.09, 0.95, 0.42),
  },
  furnace: {
    pos: new THREE.Vector3(0.0, 1.68, 2.45),
    target: new THREE.Vector3(0.0, 1.15, 0.1),
  },
  ladle: {
    pos: new THREE.Vector3(4.25, 1.68, 1.45),
    target: new THREE.Vector3(3.30, 0.95, 0.20),
  },
  'control-box': {
    pos: new THREE.Vector3(2.50, 1.68, 1.72),
    target: new THREE.Vector3(2.40, 1.34, 0.86),
  },
  'mold-ingot': {
    pos: new THREE.Vector3(5.6, 1.68, -3.6),
    target: new THREE.Vector3(7.8, 0.5, -3.6),
  },
  'mold-valve': {
    pos: new THREE.Vector3(5.6, 1.68, 0.0),
    target: new THREE.Vector3(7.8, 0.5, 0.0),
  },
  'mold-gear': {
    pos: new THREE.Vector3(5.6, 1.68, 3.6),
    target: new THREE.Vector3(7.8, 0.5, 3.6),
  },
  'mold-propeller': {
    pos: new THREE.Vector3(5.6, 1.68, 7.2),
    target: new THREE.Vector3(7.8, 0.5, 7.2),
  },
  depot: {
    pos: new THREE.Vector3(-6.8, 1.68, 1.4),
    target: new THREE.Vector3(-10.35, 1.1, 1.4),
  },
  'ppe-rack': {
    pos: new THREE.Vector3(-10.4, 1.68, -9.6),
    target: new THREE.Vector3(-10.95, 1.20, -11.78),
  },
  'utility-panels': {
    pos: new THREE.Vector3(-7.85, 1.68, -9.6),
    target: new THREE.Vector3(-7.85, 1.38, -11.92),
  },
  platform: {
    pos: new THREE.Vector3(0.85, 3.36, -1.35),
    target: new THREE.Vector3(0.0, 1.70, 0.0),
  },
  lance: {
    pos: new THREE.Vector3(0.48, 3.36, -1.40),
    target: new THREE.Vector3(0.0, 1.80, -0.05),
  },
};

function getLookOrientation(fromPos: THREE.Vector3, toTarget: THREE.Vector3): { yaw: number; pitch: number } {
  const dirX = toTarget.x - fromPos.x;
  const dirY = toTarget.y - fromPos.y;
  const dirZ = toTarget.z - fromPos.z;
  const hDist = Math.hypot(dirX, dirZ);
  const yaw = Math.atan2(-dirX, -dirZ);
  const pitch = Math.atan2(dirY, Math.max(0.08, hDist));
  return { yaw, pitch: Math.max(-1.22, Math.min(1.22, pitch)) };
}

// Machine AABB obstacle collision boxes: [minX, maxX, minZ, maxZ, minElev, maxElev]
const MACHINE_OBSTACLES = [
  // Induction Furnace Body (Floor level)
  { minX: -1.15, maxX: 1.15, minZ: -0.75, maxZ: 0.75, minElev: 0, maxElev: 2.5 },
  // Front safety guard rail overlooking furnace on elevated platform deck (elevation > 2.8)
  { minX: -0.90, maxX: 1.45, minZ: -0.92, maxZ: 0.75, minElev: 2.8, maxElev: 4.8 },
  // Orange Power Supply Cabinet
  { minX: -3.15, maxX: -1.65, minZ: -0.55, maxZ: 0.55, minElev: 0, maxElev: 4.0 },
  // Secondary Tilt Control Box (at [2.40, 0, 0.80])
  { minX: 2.05, maxX: 2.75, minZ: 0.45, maxZ: 1.15, minElev: 0, maxElev: 4.0 },
  // Industrial Raw Material Bunker Complex - back perimeter concrete wall only
  { minX: -12.10, maxX: -11.60, minZ: -7.50, maxZ: 9.90, minElev: 0, maxElev: 3.5 },
  // Operator Document Desk beside APAR in PPE Corner (Left Wall X = -12.0 to -11.2, Z = -10.4 to -9.0)
  { minX: -12.05, maxX: -11.20, minZ: -10.40, maxZ: -9.00, minElev: 0, maxElev: 1.5 },
  // Bunker 01, 02, 03 physical dividing partitions (x: -11.95 to -9.0, z: -7.0 to -1.0)
  { minX: -11.95, maxX: -8.95, minZ: -7.20, maxZ: -1.00, minElev: 0, maxElev: 2.0 },
  // Linear Right Casting Bay Molds (along X = 7.8 from Z = -7.2 to +7.2)
  { minX: 6.6, maxX: 9.2, minZ: -8.2, maxZ: -6.2, minElev: 0, maxElev: 1.5 }, // auxiliary ingot chill station
  { minX: 6.6, maxX: 9.2, minZ: -4.6, maxZ: -2.6, minElev: 0, maxElev: 1.5 }, // mold-ingot
  { minX: 6.6, maxX: 9.2, minZ: -1.0, maxZ: 1.0, minElev: 0, maxElev: 1.5 },  // mold-valve
  { minX: 6.6, maxX: 9.2, minZ: 2.6, maxZ: 4.6, minElev: 0, maxElev: 1.5 },   // mold-gear
  { minX: 6.6, maxX: 9.2, minZ: 6.2, maxZ: 8.2, minElev: 0, maxElev: 1.5 },   // mold-propeller
  // Underneath platform legs / deck substructure (cannot walk under deck if on floor)
  { minX: -1.65, maxX: 1.45, minZ: -1.85, maxZ: -0.90, minElev: 0, maxElev: 2.8 },
  // Platform perimeter guard rails (prevent stepping off edge when on elevated deck)
  { minX: -1.75, maxX: 2.25, minZ: -2.10, maxZ: -1.85, minElev: 2.8, maxElev: 4.8 }, // Rear railing
  { minX: -2.10, maxX: -1.62, minZ: -1.90, maxZ: 0.25, minElev: 2.8, maxElev: 4.8 }, // Left outer railing
  { minX: 2.18, maxX: 2.50, minZ: -1.90, maxZ: -0.90, minElev: 2.8, maxElev: 4.8 }, // Right landing railing
  { minX: -1.65, maxX: -0.85, minZ: 0.20, maxZ: 0.50, minElev: 2.8, maxElev: 4.8 }, // Left wing front railing
];

function isCollidingWithMachine(x: number, z: number, elev: number): boolean {
  for (const obs of MACHINE_OBSTACLES) {
    if (x >= obs.minX && x <= obs.maxX && z >= obs.minZ && z <= obs.maxZ) {
      if (elev >= obs.minElev && elev <= obs.maxElev) {
        return true;
      }
    }
  }
  return false;
}

function calculateTargetElevation(x: number, z: number): number {
  // 1. Stairway zone: climbing up from floor (z ~ 0.60) to elevated top landing (z ~ -0.90)
  if (x >= 1.40 && x <= 2.20 && z >= -0.95 && z <= 0.65) {
    const t = Math.max(0, Math.min(1, (0.60 - z) / 1.50));
    return 1.68 + t * 1.68; // 1.68m (floor eye level) to 3.36m (elevated platform eye level)
  }
  // 2. Main observation deck & seamless top landing behind furnace (x: -1.65 to 2.18, z: -1.85 to -0.90)
  if (x >= -1.65 && x <= 2.18 && z >= -1.85 && z <= -0.90) {
    return 3.36;
  }
  // 3. Left charging wing deck (x: -1.70 to -0.85, z: -0.90 to 0.20)
  if (x >= -1.70 && x <= -0.85 && z >= -0.90 && z <= 0.20) {
    return 3.36;
  }
  // 4. Default floor eye level
  return 1.68;
}

export const CameraRig: React.FC<CameraRigProps> = ({ isDraggingKnob = false }) => {
  const cameraPreset = useSimStore((s) => s.cameraPreset);
  const isAppLaunched = useSimStore((s) => s.isAppLaunched);
  const { camera, gl } = useThree();
  const isDraggingKnobRef = useRef(isDraggingKnob);

  useEffect(() => {
    isDraggingKnobRef.current = isDraggingKnob;
    if (isDraggingKnob) {
      isDraggingLookRef.current = false;
      touchLookPointerIdRef.current = null;
    }
  }, [isDraggingKnob]);

  // First-Person (POV) Walk & Look State - Starts at Overview behind launcher, then transitions to PPE Corner on launch
  const initialPresetCfg = PRESET_CONFIGS[useSimStore.getState().cameraPreset] || PRESET_CONFIGS.overview;
  const initialLook = getLookOrientation(initialPresetCfg.pos, initialPresetCfg.target);
  const povPosRef = useRef(initialPresetCfg.pos.clone());
  const povYawRef = useRef(initialLook.yaw);
  const povPitchRef = useRef(initialLook.pitch);
  const povElevationRef = useRef(1.68);
  const povKeysRef = useRef<{ [key: string]: boolean }>({});
  const isDraggingLookRef = useRef(false);
  const touchLookPointerIdRef = useRef<number | null>(null);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const walkBobTimeRef = useRef(0);

  // Smooth Lerp Transition to preset locations
  const isPresetTransitioningRef = useRef(false);
  const targetPresetPosRef = useRef(initialPresetCfg.pos.clone());
  const targetPresetYawRef = useRef(initialLook.yaw);
  const targetPresetPitchRef = useRef(initialLook.pitch);

  // Jump physics refs for first-person mode
  const jumpVelocityRef = useRef(0);
  const jumpOffsetRef = useRef(0);
  const isGroundedRef = useRef(true);

  const craneDestination = useSimStore((s) => s.craneDestination);
  const prevLaunchedRef = useRef(isAppLaunched);

  // Smooth navigation transition handler when clicking preset buttons or launching app
  useEffect(() => {
    const justLaunched = !prevLaunchedRef.current && isAppLaunched;
    prevLaunchedRef.current = isAppLaunched;

    let presetPos = PRESET_CONFIGS[cameraPreset]?.pos;
    let presetTarget = PRESET_CONFIGS[cameraPreset]?.target;

    if (cameraPreset === 'ladle') {
      const [cx, , cz] = useSimStore.getState().cranePosition;
      presetPos = new THREE.Vector3(cx + 1.15, 1.68, cz + 1.45);
      presetTarget = new THREE.Vector3(cx, 1.05, cz);
    }

    if (presetPos && presetTarget) {
      const look = getLookOrientation(presetPos, presetTarget);
      targetPresetPosRef.current.copy(presetPos);
      targetPresetYawRef.current = look.yaw;
      targetPresetPitchRef.current = look.pitch;

      if (justLaunched) {
        // Place camera directly in front of the APD rack upon entering simulation so it never clips through furnace walls
        povPosRef.current.copy(presetPos);
        povYawRef.current = look.yaw;
        povPitchRef.current = look.pitch;
        povElevationRef.current = presetPos.y;
        isPresetTransitioningRef.current = false;
      } else if (isAppLaunched) {
        isPresetTransitioningRef.current = true;
      }
    }
  }, [cameraPreset, craneDestination, isAppLaunched]);

  // WASD Keyboard Listeners for POV mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const st = useSimStore.getState();
      if (!st.isAppLaunched || st.isAboutModalOpen || st.isTutorialGuideOpen) return;

      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        povKeysRef.current[e.code] = true;
        isPresetTransitioningRef.current = false;
      }

      // Spacebar to Jump
      if (e.code === 'Space' && !e.repeat && isGroundedRef.current) {
        e.preventDefault();
        jumpVelocityRef.current = 4.2;
        isGroundedRef.current = false;
        inductionAudio.resume();
        inductionAudio.playClick();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      povKeysRef.current[e.code] = false;
    };

    const handleBlur = () => {
      povKeysRef.current = {};
      isDraggingLookRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Escape key handler to exit lance held mode without jumping camera
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        const { isLanceHeld, setIsLanceHeld } = useSimStore.getState();
        if (isLanceHeld) {
          setIsLanceHeld(false);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Mouse drag to look around in POV mode (without pointer-lock, keeping cursor free)
  useEffect(() => {
    const canvas = gl.domElement;

    // Completely prevent browser context menu on right click across all modes
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('contextmenu', handleContextMenu);

    const handlePointerDown = (e: PointerEvent) => {
      const st = useSimStore.getState();
      // Abort camera panning if launcher/modal overlay is active, touching a 3D control, or camera is manually locked
      if (
        !st.isAppLaunched ||
        st.isAboutModalOpen ||
        st.isTutorialGuideOpen ||
        isDraggingKnobRef.current ||
        st.isDragging3DControl ||
        st.isLadleCameraLocked
      ) {
        isDraggingLookRef.current = false;
        touchLookPointerIdRef.current = null;
        return;
      }

      // Mobile touch screen look support
      if (e.pointerType === 'touch') {
        // Reserve bottom-left dedicated pad zone (inward thumb resting arc above nav bar)
        const isInBottomLeftPad = e.clientX < 185 && e.clientY > window.innerHeight - 240;
        if (!isInBottomLeftPad) {
          isDraggingLookRef.current = true;
          isPresetTransitioningRef.current = false;
          touchLookPointerIdRef.current = e.pointerId;
          lastPointerRef.current = { x: e.clientX, y: e.clientY };
        }
        return;
      }

      // Desktop: Look around in POV mode is strictly controlled by RIGHT CLICK (button 2)
      // Left click (button 0) is reserved purely for 3D interactions (controls, wheel, buttons)
      if (e.button !== 2) return;
      isDraggingLookRef.current = true;
      isPresetTransitioningRef.current = false;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      // Lock pointer so cursor stays anchored in its exact position
      try {
        if (canvas.requestPointerLock) {
          canvas.requestPointerLock();
        }
      } catch {
        // Fallback gracefully
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingLookRef.current) return;

      const st = useSimStore.getState();
      if (isDraggingKnobRef.current || st.isDragging3DControl || st.isLadleCameraLocked) {
        isDraggingLookRef.current = false;
        touchLookPointerIdRef.current = null;
        return;
      }

      if (e.pointerType === 'touch') {
        if (touchLookPointerIdRef.current !== e.pointerId) return;
        const rawDx = e.clientX - lastPointerRef.current.x;
        const rawDy = e.clientY - lastPointerRef.current.y;
        lastPointerRef.current = { x: e.clientX, y: e.clientY };

        const dx = Math.max(-90, Math.min(90, rawDx));
        const dy = Math.max(-90, Math.min(90, rawDy));

        // Smooth touch sensitivity for mobile phones
        povYawRef.current -= dx * 0.0032;
        povPitchRef.current -= dy * 0.0032;
        povPitchRef.current = Math.max(-1.22, Math.min(1.22, povPitchRef.current));
        return;
      }

      let dx = 0;
      let dy = 0;
      if (document.pointerLockElement === canvas) {
        dx = e.movementX;
        dy = e.movementY;
      } else {
        dx = e.clientX - lastPointerRef.current.x;
        dy = e.clientY - lastPointerRef.current.y;
        lastPointerRef.current = { x: e.clientX, y: e.clientY };
      }

      povYawRef.current -= dx * 0.0016;
      povPitchRef.current -= dy * 0.0016;
      // Clamp pitch (-70° to +70°)
      povPitchRef.current = Math.max(-1.22, Math.min(1.22, povPitchRef.current));
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        if (touchLookPointerIdRef.current === e.pointerId) {
          touchLookPointerIdRef.current = null;
          isDraggingLookRef.current = false;
        }
        return;
      }

      if (e.button === 2) {
        isDraggingLookRef.current = false;
        if (document.pointerLockElement === canvas) {
          try {
            document.exitPointerLock();
          } catch {
            // Ignore
          }
        }
      }
    };

    const handlePointerLockChange = () => {
      if (document.pointerLockElement !== canvas) {
        isDraggingLookRef.current = false;
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      if (document.pointerLockElement === canvas) {
        try {
          document.exitPointerLock();
        } catch {
          // Ignore
        }
      }
    };
  }, [gl]);

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.05);
    const st = useSimStore.getState();

    // Before app launch: hold camera at wide furnace workshop overview behind blurred overlay
    if (!st.isAppLaunched) {
      const overviewCfg = PRESET_CONFIGS.overview;
      const overviewLook = getLookOrientation(overviewCfg.pos, overviewCfg.target);
      povPosRef.current.copy(overviewCfg.pos);
      povYawRef.current = overviewLook.yaw;
      povPitchRef.current = overviewLook.pitch;
      camera.position.copy(overviewCfg.pos);
      camera.rotation.order = 'YXZ';
      camera.rotation.set(overviewLook.pitch, overviewLook.yaw, 0);
      return;
    }

    // Freeze POV controls while reviewing About Us or Tutorial Guide modals
    if (st.isAboutModalOpen || st.isTutorialGuideOpen) {
      camera.position.set(
        povPosRef.current.x,
        povElevationRef.current + jumpOffsetRef.current,
        povPosRef.current.z
      );
      camera.rotation.order = 'YXZ';
      camera.rotation.set(povPitchRef.current, povYawRef.current, 0);
      return;
    }

    // 1. Operator Walking Simulation
    const keys = povKeysRef.current;
    const isForward = keys['KeyW'] || keys['ArrowUp'];
    const isBackward = keys['KeyS'] || keys['ArrowDown'];
    const isLeft = keys['KeyA'] || keys['ArrowLeft'];
    const isRight = keys['KeyD'] || keys['ArrowRight'];

    let moveForward = 0;
    let moveRight = 0;
    if (isForward) moveForward += 1;
    if (isBackward) moveForward -= 1;
    if (isRight) moveRight += 1;
    if (isLeft) moveRight -= 1;

    // Integrate Virtual Analog Joystick for touch mobile input
    const joy = useSimStore.getState().joystickVector;
    moveForward += joy.y;
    moveRight += joy.x;

    const rawMag = Math.hypot(moveForward, moveRight);
    const isMoving = rawMag > 0.05;

    // Interrupt preset smooth transition if user actively walks or drags look
    if (isMoving || isDraggingLookRef.current) {
      isPresetTransitioningRef.current = false;
    }

    // 2. Smooth Lerp Transition to Target Preset when requested
    if (isPresetTransitioningRef.current) {
      povPosRef.current.lerp(targetPresetPosRef.current, Math.min(1, safeDelta * 4.2));

      let diffYaw = targetPresetYawRef.current - povYawRef.current;
      while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
      while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
      povYawRef.current += diffYaw * Math.min(1, safeDelta * 4.8);
      povPitchRef.current = THREE.MathUtils.lerp(
        povPitchRef.current,
        targetPresetPitchRef.current,
        Math.min(1, safeDelta * 4.8)
      );

      if (
        povPosRef.current.distanceTo(targetPresetPosRef.current) < 0.04 &&
        Math.abs(diffYaw) < 0.02 &&
        Math.abs(povPitchRef.current - targetPresetPitchRef.current) < 0.02
      ) {
        povPosRef.current.copy(targetPresetPosRef.current);
        povYawRef.current = targetPresetYawRef.current;
        povPitchRef.current = targetPresetPitchRef.current;
        isPresetTransitioningRef.current = false;
      }
    }

    if (isMoving) {
      // Forward vector along yaw on horizontal XZ plane
      const forwardX = -Math.sin(povYawRef.current);
      const forwardZ = -Math.cos(povYawRef.current);

      // Right vector along yaw
      const rightX = Math.cos(povYawRef.current);
      const rightZ = -Math.sin(povYawRef.current);

      let dx = forwardX * moveForward + rightX * moveRight;
      let dz = forwardZ * moveForward + rightZ * moveRight;
      const len = Math.sqrt(dx * dx + dz * dz);
      const analogThrottle = Math.min(1.0, rawMag);
      if (len > 0.001) {
        dx = (dx / len) * analogThrottle;
        dz = (dz / len) * analogThrottle;
      }

      const walkSpeed = 2.4; // Realistic walking pace in meters/second
      let testNextX = povPosRef.current.x + dx * walkSpeed * safeDelta;
      let testNextZ = povPosRef.current.z + dz * walkSpeed * safeDelta;

      // Foundry room boundary clamping (24m x 24m with wall margin)
      testNextX = Math.max(-11.2, Math.min(11.2, testNextX));
      testNextZ = Math.max(-11.2, Math.min(11.2, testNextZ));

      const currentElev = povElevationRef.current;

      // Realistic sliding collision response
      const canMoveX = !isCollidingWithMachine(testNextX, povPosRef.current.z, currentElev);
      const canMoveZ = !isCollidingWithMachine(povPosRef.current.x, testNextZ, currentElev);

      if (canMoveX) povPosRef.current.x = testNextX;
      if (canMoveZ) povPosRef.current.z = testNextZ;

      // Subtle realistic walking step bob scaled smoothly with walk intensity
      walkBobTimeRef.current += safeDelta * 9.0 * analogThrottle;
    }

    // Vertical jump physics & gravity simulation
    if (!isGroundedRef.current) {
      jumpOffsetRef.current += jumpVelocityRef.current * safeDelta;
      jumpVelocityRef.current -= 11.5 * safeDelta; // Gravity
      if (jumpOffsetRef.current <= 0) {
        jumpOffsetRef.current = 0;
        jumpVelocityRef.current = 0;
        isGroundedRef.current = true;
      }
    }

    // Dynamic stair climbing & platform elevation calculation
    const targetElev = calculateTargetElevation(povPosRef.current.x, povPosRef.current.z);
    povElevationRef.current = THREE.MathUtils.lerp(povElevationRef.current, targetElev, Math.min(1, safeDelta * 8.0));

    const bobY = isMoving ? Math.sin(walkBobTimeRef.current) * 0.018 * Math.min(1, rawMag) : 0;
    camera.position.set(
      povPosRef.current.x,
      povElevationRef.current + bobY + jumpOffsetRef.current,
      povPosRef.current.z
    );

    // Apply look orientation
    camera.rotation.order = 'YXZ';
    camera.rotation.set(povPitchRef.current, povYawRef.current, 0);
  });

  return null;
};

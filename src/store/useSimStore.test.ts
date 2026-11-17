import { describe, it, expect, beforeEach } from 'vitest';
import { useSimStore } from './useSimStore';

const INITIAL_LAUNCHED_STATE = useSimStore.getState().isAppLaunched;
const INITIAL_CAMERA_PRESET = useSimStore.getState().cameraPreset;

describe('Mobile Controls, Crane Isolation & Ladle Steering State', () => {
  beforeEach(() => {
    useSimStore.getState().resetSimulation();
  });

  it('starts unlaunched in overview camera before facing APD rack, then launches cleanly to ppe-rack', () => {
    expect(INITIAL_LAUNCHED_STATE).toBe(false);
    expect(INITIAL_CAMERA_PRESET).toBe('overview');

    const store = useSimStore.getState();
    store.setAboutModalOpen(true);
    expect(useSimStore.getState().isAboutModalOpen).toBe(true);

    store.setTutorialGuideOpen(true);
    expect(useSimStore.getState().isTutorialGuideOpen).toBe(true);

    store.launchSimulation('lite');
    const launched = useSimStore.getState();
    expect(launched.isAppLaunched).toBe(true);
    expect(launched.performanceProfile).toBe('lite');
    expect(launched.cameraPreset).toBe('ppe-rack');
    expect(launched.isAboutModalOpen).toBe(false);
    expect(launched.isTutorialGuideOpen).toBe(false);
  });

  it('keeps analog joystick strictly decoupled from crane movement even while holding crane remote', () => {
    const store = useSimStore.getState();
    store.setIsCraneRemoteHeld(true);
    expect(useSimStore.getState().isCraneRemoteHeld).toBe(true);

    // Move analog joystick fully forward and right
    useSimStore.getState().setJoystickVector({ x: 0.95, y: 0.85 });

    const next = useSimStore.getState();
    expect(next.joystickVector).toEqual({ x: 0.95, y: 0.85 });
    // Crane directions must remain completely unaffected by analog input
    expect(next.craneMoveDirs).toEqual({ x: 0, y: 0, z: 0 });
    expect(next.craneDestination).toBe('standby');

    // Only explicit remote buttons may move crane
    next.setCraneMoveDir('x', 1);
    expect(useSimStore.getState().craneDestination).toBe('manual');
    expect(useSimStore.getState().craneMoveDirs).toEqual({ x: 1, y: 0, z: 0 });
  });

  it('clamps ladle tilt degrees strictly within [0, 90] and resets cleanly', () => {
    const store = useSimStore.getState();

    store.setLadleTiltDeg(45);
    expect(useSimStore.getState().ladleTiltDeg).toBe(45);

    store.setLadleTiltDeg(180);
    expect(useSimStore.getState().ladleTiltDeg).toBe(90);

    store.setLadleTiltDeg(-30);
    expect(useSimStore.getState().ladleTiltDeg).toBe(0);

    store.setLadleTiltDeg(Number.NaN);
    expect(useSimStore.getState().ladleTiltDeg).toBe(0);

    store.setLadleTiltDeg(62);
    store.resetLadle();
    expect(useSimStore.getState().ladleTiltDeg).toBe(0);
  });

  it('clears camera lock, ladle panel, and crane directions when returning crane remote', () => {
    const store = useSimStore.getState();
    store.setIsCraneRemoteHeld(true);
    store.setIsLadleControlOpen(true);
    store.setIsLadleCameraLocked(true);
    store.setCraneMoveDir('y', 1);

    useSimStore.getState().setIsCraneRemoteHeld(false);

    const next = useSimStore.getState();
    expect(next.isCraneRemoteHeld).toBe(false);
    expect(next.isLadleControlOpen).toBe(false);
    expect(next.isLadleCameraLocked).toBe(false);
    expect(next.craneMoveDirs).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('allows opening ladle control popup without holding crane remote with camera lock off by default', () => {
    const store = useSimStore.getState();
    expect(store.isCraneRemoteHeld).toBe(false);
    store.setIsLadleControlOpen(true);

    const next = useSimStore.getState();
    expect(next.isLadleControlOpen).toBe(true);
    expect(next.isLadleCameraLocked).toBe(false);
  });

  it('checks off SOP 11 synchronously upon verifying formula at step 11 without tying scrap sorting', () => {
    const store = useSimStore.getState();
    store.toggleSopMode(); // Activate SOP tracking mode
    store.setSopStepIndex(10); // Step 11 (0-indexed 10)
    const activeOrder = useSimStore.getState().jobOrder;

    // Completing scrap sorting alone must NOT verify SOP 11
    store.setScrapSortedDry(true);
    expect(useSimStore.getState().sopStepCompletedMap[11]).toBeUndefined();

    // Selecting matching formula & calling verifyAlloyDose at step 11 checks off SOP 11 cleanly
    store.setSelectedFormula(activeOrder);
    store.verifyAlloyDose();

    const next = useSimStore.getState();
    expect(next.isAlloyVerified).toBe(true);
    expect(next.sopStepCompletedMap[11]).toBe(true);
    expect(next.currentSopStepIndex).toBe(11);
  });
});

import { useFrame } from '@react-three/fiber';
import { useSimStore } from '../store/useSimStore';
import { inductionAudio } from './fx/InductionAudio';

export function SimulationDriver() {
  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.1);
    useSimStore.getState().tick(clampedDelta);

    const { sim, isTiltingForward, isTiltingBackward, isPouringStreamActive } = useSimStore.getState();
    const isTilting = isTiltingForward || isTiltingBackward;
    inductionAudio.update(sim.powerFraction, isTilting, isPouringStreamActive);
  });

  return null;
}

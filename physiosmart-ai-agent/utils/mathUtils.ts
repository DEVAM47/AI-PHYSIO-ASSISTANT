
import { Landmark } from '../types';

export const calculateAngle = (a: Landmark, b: Landmark, c: Landmark): number => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
};

export const calculateIntensityScore = (
  formAccuracy: number,
  tempoConsistency: number,
  rangeOfMotion: number
): number => {
  return (formAccuracy * 0.6) + (tempoConsistency * 0.2) + (rangeOfMotion * 0.2);
};

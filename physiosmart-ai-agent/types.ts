
export enum ExerciseType {
  SQUAT = 'Squat',
  BICEP_CURL = 'Bicep Curl',
  SHOULDER_PRESS = 'Shoulder Press'
}

export interface JointAngle {
  joint: string;
  current: number;
  targetMin: number;
  targetMax: number;
}

export interface SessionData {
  id: string;
  exerciseType: ExerciseType;
  date: string;
  reps: number;
  sets: number;
  avgScore: number;
  romTrend: number[];
  duration: number; // in seconds
  flags: string[];
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface ExerciseState {
  reps: number;
  isAtBottom: boolean;
  lastRepTime: number;
  score: number;
  feedback: string;
}

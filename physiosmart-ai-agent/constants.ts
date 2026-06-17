
import { ExerciseType } from './types';

export const EXERCISE_CONFIGS = {
  [ExerciseType.SQUAT]: {
    targetAngleJoints: ['hip', 'knee', 'ankle'],
    minAngle: 70, // Deepest part of squat
    maxAngle: 160, // Standing up
    targetMin: 70,
    targetMax: 100,
    description: 'Keep your back straight and lower your hips until your thighs are parallel to the floor.'
  },
  [ExerciseType.BICEP_CURL]: {
    targetAngleJoints: ['shoulder', 'elbow', 'wrist'],
    minAngle: 30, // Fully curled
    maxAngle: 160, // Arm extended
    targetMin: 30,
    targetMax: 45,
    description: 'Keep your elbows tucked into your sides and curl the weight towards your shoulders.'
  },
  [ExerciseType.SHOULDER_PRESS]: {
    targetAngleJoints: ['elbow', 'shoulder', 'hip'],
    minAngle: 45, // Weights at shoulder level
    maxAngle: 160, // Arms fully extended overhead
    targetMin: 150,
    targetMax: 180,
    description: 'Press the weights upward until your arms are nearly straight above your head.'
  }
};

export const MEDIAPIPE_CHANNELS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28
};

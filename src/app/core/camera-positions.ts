import type { Section } from './portfolio-state.service';

export interface CameraTarget {
  position: [number, number, number];
  target: [number, number, number];
}

export const DOOR_CAMERA: CameraTarget = {
  position: [1.9, 1.65, 2.1],
  target: [0, 0.85, -0.35]
};

export const NEON_SIGN_WAYPOINT: CameraTarget = {
  position: [-1.35, 1.52, 1.35],
  target: [-1.9, 1, -0.62]
};

export const NEON_SIGN_CAMERA: CameraTarget = {
  position: [-1.15, 1.42, 0.9],
  target: [-1.9, 1, -0.62]
};

export const CAMERA_POSITIONS: Record<Section, CameraTarget> = {
  home: {
    position: [3.2, 2.15, 2.9],
    target: [0.05, 0.86, -0.4]
  },
  proyectos: {
    position: [1.5, 1.55, 1.25],
    target: [0.1, 1, -0.58]
  },
  hobbies: {
    position: [2.7, 1.5, 0.2],
    target: [1.42, 0.9, -1.08]
  },
  'sobre-mi': {
    position: [-1.15, 1.42, 0.9],
    target: [-1.9, 1, -0.62]
  },
  contacto: {
    position: [2.15, 1.5, 1.35],
    target: [0.76, 0.81, -0.25]
  },
  certificaciones: {
    position: [2.5, 1.54, 0.34],
    target: [1.38, 1.26, -1.52]
  }
};

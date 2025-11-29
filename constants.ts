import * as THREE from 'three';

export const COLORS = {
  background: '#050505',
  primary: '#00f3ff', // Cyan (Default)
  hot: '#ffffff',     // White
  danger: '#ff003c',  // Red (for errors/alerts)
};

export const COLOR_PALETTES = {
  CYAN: '#00f3ff',
  GOLD: '#ffaa00',
  MAGENTA: '#ff00aa',
  LIME: '#39ff14',
  ORANGE: '#ff4500',
  RED: '#ff003c',
  WHITE: '#ffffff',
  PURPLE: '#a855f7'
};

export const PARTICLE_COUNTS = {
  CORE: 75000,
  AURA: 4000,
};

export const CAMERA_CONFIG = {
  fov: 45,
  position: [0, 0, 30] as [number, number, number],
};

export const THREE_COLOR_HOT = new THREE.Color(COLORS.hot);
import React from 'react';

export enum ParticleShape {
  SPHERE = 'SPHERE',
  CUBE = 'CUBE',
  TORUS = 'TORUS',
  GALAXY = 'GALAXY',
  BIG_BANG = 'BIG_BANG',
  DNA = 'DNA',
  SATURN = 'SATURN',
  PYRAMID = 'PYRAMID',
  TEXT = 'TEXT',
  NUMBER = 'NUMBER'
}

export interface HandData {
  x: number; // Normalized -1 to 1
  y: number; // Normalized -1 to 1
  isDetected: boolean;
  isClenched: boolean; // True if fist is closed
  handSpread: number; // 0 to 1 (0 = Fist, 1 = Wide Open)
}

export interface ParticleConfig {
  color: string;
  count: number;
  size: number;
}

// --- Audio & Voice Types ---
export interface AudioData {
  bass: number; // 0 - 1
  mid: number;  // 0 - 1
  treble: number; // 0 - 1
  average: number; // 0 - 1
}

export interface VoiceCommandStatus {
  isListening: boolean;
  lastCommand: string;
  confidence: number;
}

export type VoiceCommandType = 'SHAPE' | 'COLOR' | 'RESET' | 'SNAPSHOT' | 'SET_CHAR' | 'SET_NUM';

// --- Global Type Augmentation ---

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
    Hands: any;
  }
  
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      pointsMaterial: any;
      ambientLight: any;
      pointLight: any;
      color: any;
      mesh: any;
      planeGeometry: any;
      meshBasicMaterial: any;
    }
  }
}

// Augment React's internal JSX namespace for newer React versions/configurations
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      pointsMaterial: any;
      ambientLight: any;
      pointLight: any;
      color: any;
      mesh: any;
      planeGeometry: any;
      meshBasicMaterial: any;
    }
  }
}
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleShape, HandData } from '../types';
import { PARTICLE_COUNTS, THREE_COLOR_HOT } from '../constants';
import { AudioService } from '../services/audio';

interface ParticleSystemProps {
  shape: ParticleShape;
  color: string;
  handData: React.MutableRefObject<HandData>;
  audioService: React.MutableRefObject<AudioService | null>;
  particleCount: number;
  charIndex: number; // 0-25
  numIndex: number;  // 0-9
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
    shape, color, handData, audioService, particleCount, charIndex, numIndex 
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const auraRef = useRef<THREE.Points>(null);
  
  // Physics parameters
  const targetPositionsRef = useRef<Float32Array | null>(null);
  const currentPositionsRef = useRef<Float32Array | null>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  
  const count = particleCount;
  const auraCount = PARTICLE_COUNTS.AURA;
  
  // Memoize the THREE.Color object
  const threeColorBase = useMemo(() => new THREE.Color(color), [color]);

  // --- Text Generation Helper ---
  const generateTextPositions = (text: string, pCount: number, radius = 10) => {
    const size = 100; // Canvas resolution
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new Float32Array(pCount * 3);

    // Draw text
    ctx.fillStyle = 'black'; // background
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'white'; // text
    ctx.font = 'bold 80px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2);

    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    const validPixels: [number, number][] = [];

    // Scan for pixels
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const alpha = data[(y * size + x) * 4]; // Use red channel or alpha
            if (alpha > 128) { // Threshold
                validPixels.push([x, y]);
            }
        }
    }

    const positions = new Float32Array(pCount * 3);
    if (validPixels.length === 0) return positions;

    // Map pixels to particles
    for (let i = 0; i < pCount; i++) {
        const pixel = validPixels[Math.floor(Math.random() * validPixels.length)];
        const x = (pixel[0] / size - 0.5) * radius * 1.5;
        const y = -(pixel[1] / size - 0.5) * radius * 1.5; // Flip Y
        const z = (Math.random() - 0.5) * radius * 0.2; // Small depth
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
    }
    return positions;
  };

  // --- Geometry Generation Helper ---
  const generateTargetPositions = (type: ParticleShape, pCount: number, radius = 10) => {
    // Check Text types first
    if (type === ParticleShape.TEXT) {
        const char = String.fromCharCode(65 + charIndex); // A = 65
        return generateTextPositions(char, pCount, radius);
    }
    if (type === ParticleShape.NUMBER) {
        return generateTextPositions(String(numIndex), pCount, radius);
    }

    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const i3 = i * 3;
      let x = 0, y = 0, z = 0;

      switch (type) {
        case ParticleShape.SPHERE: {
          const phi = Math.acos(-1 + (2 * i) / pCount);
          const theta = Math.sqrt(pCount * Math.PI) * phi;
          x = radius * Math.cos(theta) * Math.sin(phi);
          y = radius * Math.sin(theta) * Math.sin(phi);
          z = radius * Math.cos(phi);
          break;
        }
        case ParticleShape.CUBE: {
          x = (Math.random() - 0.5) * radius * 1.5;
          y = (Math.random() - 0.5) * radius * 1.5;
          z = (Math.random() - 0.5) * radius * 1.5;
          break;
        }
        case ParticleShape.TORUS: {
          const u = Math.random() * Math.PI * 2;
          const v = Math.random() * Math.PI * 2;
          const tubeRadius = radius * 0.3;
          x = (radius + tubeRadius * Math.cos(v)) * Math.cos(u);
          y = (radius + tubeRadius * Math.cos(v)) * Math.sin(u);
          z = tubeRadius * Math.sin(v);
          break;
        }
        case ParticleShape.GALAXY: {
            const armCount = 3;
            const spin = i / pCount * armCount * Math.PI * 2;
            const r = (i / pCount) * radius;
            const randomOffset = (Math.random() - 0.5) * (radius * 0.2);
            x = r * Math.cos(spin) + randomOffset;
            y = (Math.random() - 0.5) * (r * 0.2); // Flat galaxy
            z = r * Math.sin(spin) + randomOffset;
            break;
        }
        case ParticleShape.DNA: {
          const strands = 2;
          const strandIdx = i % strands;
          const t = (i / pCount) * Math.PI * 10; 
          const height = (i / pCount) * radius * 2.5 - radius * 1.25;
          const r = radius * 0.5;
          const offset = strandIdx * Math.PI;
          x = r * Math.cos(t + offset) + (Math.random() - 0.5);
          y = height;
          z = r * Math.sin(t + offset) + (Math.random() - 0.5);
          break;
        }
        case ParticleShape.SATURN: {
           if (i < pCount * 0.7) {
              const phi = Math.acos(-1 + (2 * i) / (pCount * 0.7));
              const theta = Math.sqrt((pCount * 0.7) * Math.PI) * phi;
              const r = radius * 0.6;
              x = r * Math.cos(theta) * Math.sin(phi);
              y = r * Math.sin(theta) * Math.sin(phi);
              z = r * Math.cos(phi);
           } else {
              const theta = Math.random() * Math.PI * 2;
              const rMin = radius * 0.8;
              const rMax = radius * 1.5;
              const r = Math.sqrt(Math.random()) * (rMax - rMin) + rMin;
              x = r * Math.cos(theta);
              y = (Math.random() - 0.5) * 0.2; 
              z = r * Math.sin(theta);
           }
           break;
        }
        case ParticleShape.PYRAMID: {
           let a = Math.random();
           let b = Math.random();
           let c = Math.random();
           if (a + b > 1) { a = 1 - a; b = 1 - b; }
           if (b + c > 1) { b = 1 - b; c = 1 - c; }
           if (a + b + c > 1) { a = 1 - a; b = 1 - b; c = 1 - c; }
           const d = 1 - a - b - c;
           const s = radius * 1.5;
           const v1 = [s, s, s], v2 = [-s, -s, s], v3 = [-s, s, -s], v4 = [s, -s, -s];
           x = a*v1[0] + b*v2[0] + c*v3[0] + d*v4[0];
           y = a*v1[1] + b*v2[1] + c*v3[1] + d*v4[1];
           z = a*v1[2] + b*v2[2] + c*v3[2] + d*v4[2];
           break;
        }
        case ParticleShape.BIG_BANG:
        default: {
          const r = Math.random() * radius * 2;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
          break;
        }
      }
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
    }
    return positions;
  };

  // --- Initialization ---
  useMemo(() => {
    currentPositionsRef.current = generateTargetPositions(ParticleShape.BIG_BANG, count);
    velocitiesRef.current = new Float32Array(count * 3).fill(0);
    targetPositionsRef.current = generateTargetPositions(shape, count);
  }, [count]); 

  // --- Shape Update Effect ---
  useEffect(() => {
    targetPositionsRef.current = generateTargetPositions(shape, count);
  }, [shape, count, charIndex, numIndex]); // Re-generate when text/num changes

  // --- Aura Geometry ---
  const auraGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = generateTargetPositions(ParticleShape.SPHERE, auraCount, 12);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [auraCount]);

  // --- Core Geometry Setup ---
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(currentPositionsRef.current!, 3));
    const colors = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
        colors[i*3] = threeColorBase.r;
        colors[i*3+1] = threeColorBase.g;
        colors[i*3+2] = threeColorBase.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [count]); 

  // --- Animation Loop ---
  useFrame((state) => {
    if (!pointsRef.current || !currentPositionsRef.current || !targetPositionsRef.current || !velocitiesRef.current) return;

    const { x: handX, y: handY, isDetected, handSpread } = handData.current;
    
    // --- Audio Reactivity ---
    let audioBass = 0;
    let audioTreble = 0;
    if (audioService.current) {
        const audioData = audioService.current.getFrequencyData();
        audioBass = audioData.bass;
        audioTreble = audioData.treble;
    }

    // Rotation Logic 
    const targetRotX = isDetected ? -handY * 1.5 : (state.mouse.y * 1.0);
    const targetRotY = isDetected ? handX * 1.5 : (state.mouse.x * 1.0) + (state.clock.elapsedTime * 0.05); // Auto rotate slightly
    
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, targetRotX, 0.1);
    pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, targetRotY, 0.1);

    // Scaling Logic: 
    // If tracking: Range from 0.3 (Closed Fist) to 1.5 (Wide Open)
    // If not tracking: Default to 1.0
    const baseScale = isDetected ? 0.3 + (handSpread * 1.2) : 1.0;
    const audioScale = audioBass * 0.4; // Bass expands the model
    const targetScale = baseScale + audioScale;
    const lerpSpeed = 0.08;
    
    pointsRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), lerpSpeed);

    // Aura follows
    if (auraRef.current) {
        auraRef.current.rotation.x = pointsRef.current.rotation.x * 0.8;
        auraRef.current.rotation.y = pointsRef.current.rotation.y * 0.8;
        // Aura pulses more with audio
        const auraScale = targetScale * (1 + audioBass * 0.5);
        auraRef.current.scale.lerp(new THREE.Vector3(auraScale, auraScale, auraScale), lerpSpeed);
    }

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array;
    const targets = targetPositionsRef.current;
    const vels = velocitiesRef.current;
    
    // Physics constants
    const attraction = 0.03; 
    const damping = 0.92;
    const noiseAmt = 0.02 + (audioTreble * 0.1); 

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const tx = targets[i3];
      const ty = targets[i3 + 1];
      const tz = targets[i3 + 2];

      // Standard Attraction Physics
      const ax = (tx - positions[i3]) * attraction;
      const ay = (ty - positions[i3 + 1]) * attraction;
      const az = (tz - positions[i3 + 2]) * attraction;

      const nx = (Math.random() - 0.5) * noiseAmt;
      const ny = (Math.random() - 0.5) * noiseAmt;
      const nz = (Math.random() - 0.5) * noiseAmt;

      vels[i3] += ax + nx;
      vels[i3 + 1] += ay + ny;
      vels[i3 + 2] += az + nz;

      vels[i3] *= damping;
      vels[i3 + 1] *= damping;
      vels[i3 + 2] *= damping;

      positions[i3] += vels[i3];
      positions[i3 + 1] += vels[i3 + 1];
      positions[i3 + 2] += vels[i3 + 2];

      // Dynamic Coloring
      const speed = Math.sqrt(vels[i3]**2 + vels[i3+1]**2 + vels[i3+2]**2);
      // Audio treble makes particles hotter easier
      const t = Math.min((speed * 3.0) + (audioTreble * 0.5), 1); 
      
      colors[i3] = THREE.MathUtils.lerp(threeColorBase.r, THREE_COLOR_HOT.r, t);
      colors[i3+1] = THREE.MathUtils.lerp(threeColorBase.g, THREE_COLOR_HOT.g, t);
      colors[i3+2] = THREE.MathUtils.lerp(threeColorBase.b, THREE_COLOR_HOT.b, t);
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <>
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <points ref={auraRef} geometry={auraGeometry}>
         <pointsMaterial
          size={0.3}
          color={color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>
    </>
  );
};
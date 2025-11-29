import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { ParticleSystem } from './components/ParticleSystem';
import { UI } from './components/UI';
import { HandTrackerService } from './services/handTracking';
import { AudioService } from './services/audio';
import { VoiceService } from './services/voice';
import { ParticleShape, HandData, VoiceCommandType } from './types';
import { CAMERA_CONFIG, COLORS, COLOR_PALETTES, PARTICLE_COUNTS } from './constants';
import * as THREE from 'three';

const INITIAL_HAND_DATA: HandData = {
  x: 0,
  y: 0,
  isDetected: false,
  isClenched: false,
  handSpread: 0.5
};

// Component to handle Scene capture
const SceneCapture = ({ captureTrigger, onCaptureComplete }: { captureTrigger: number, onCaptureComplete: () => void }) => {
    const { gl, scene, camera } = useThree();
    
    useEffect(() => {
        if (captureTrigger > 0) {
            gl.render(scene, camera);
            const dataUrl = gl.domElement.toDataURL('image/png');
            const link = document.createElement('a');
            link.setAttribute('download', 'jarvis-hologram-' + Date.now() + '.png');
            link.setAttribute('href', dataUrl);
            link.click();
            onCaptureComplete();
        }
    }, [captureTrigger, gl, scene, camera, onCaptureComplete]);
    return null;
};

// Component for Shockwave on click
const Shockwave = ({ color }: { color: string }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [clicks, setClicks] = useState<{id: number, x: number, y: number}[]>([]);
    const { viewport } = useThree();

    useEffect(() => {
        const handleClick = () => {
             // Just a visual trigger, logic handled in useFrame if needed for complex physics
             // For now, simpler implementation:
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);
    
    // Placeholder: A simple invisible plane to catch clicks if we want advanced raycasting later
    return (
        <mesh visible={false} onClick={() => { /* trigger ripple logic in particles? */ }}>
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial transparent opacity={0} />
        </mesh>
    );
};


export default function App() {
  // State
  const [loading, setLoading] = useState(true);
  const [shape, setShape] = useState<ParticleShape>(ParticleShape.SPHERE);
  const [color, setColor] = useState<string>(COLORS.primary);
  const [handDataState, setHandDataState] = useState<HandData>(INITIAL_HAND_DATA);
  const [audioEnabled, setAudioEnabled] = useState(true); // Default to TRUE
  const [audioError, setAudioError] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState({ isListening: false, lastCommand: '', confidence: 0 });
  const [particleCount, setParticleCount] = useState<number>(PARTICLE_COUNTS.CORE);
  
  // Text/Number State
  const [charIndex, setCharIndex] = useState(0); // 0 = A
  const [numIndex, setNumIndex] = useState(1);   // 0 = 0 (Start at 1 as per prompt suggestion <1>)

  // Snapshot State
  const [captureTrigger, setCaptureTrigger] = useState(0);
  const [flashOpacity, setFlashOpacity] = useState(0);

  // Refs for High-Performance Loops (avoiding state churn in animation loops)
  const handDataRef = useRef<HandData>(INITIAL_HAND_DATA);
  const videoRef = useRef<HTMLVideoElement>(null);
  const handTrackerRef = useRef<HandTrackerService | null>(null);
  const audioServiceRef = useRef<AudioService | null>(null);
  const voiceServiceRef = useRef<VoiceService | null>(null);

  // Initialize Services
  useEffect(() => {
    // 1. Hand Tracking
    if (videoRef.current) {
      handTrackerRef.current = new HandTrackerService(videoRef.current, (data) => {
        // Update Ref for Physics (Instant)
        handDataRef.current = data;
        // Update State for UI (React Render Cycle)
        setHandDataState(data);
        
        if (loading) setLoading(false);
      });

      handTrackerRef.current.initialize().catch(err => {
          console.error("Failed to init hand tracking", err);
          setLoading(false);
      });
    }

    // 2. Audio Service (Initialize Immediately)
    audioServiceRef.current = new AudioService();
    // Attempt auto-start (might be blocked by autoplay policy, but we try)
    audioServiceRef.current.initialize()
        .then(() => {
            console.log("Audio Auto-Started");
            setAudioEnabled(true);
            setAudioError(false);
        })
        .catch(e => {
            console.warn("Audio Auto-Start Blocked/Failed", e);
            setAudioEnabled(false);
            setAudioError(true);
        });

    // 3. Voice Service
    voiceServiceRef.current = new VoiceService(
        (type: VoiceCommandType, value: string) => {
            console.log(`Executing Voice Command: ${type} -> ${value}`);
            if (type === 'SHAPE') setShape(value as ParticleShape);
            if (type === 'COLOR') setColor(value);
            if (type === 'RESET') {
                setShape(ParticleShape.SPHERE);
                setColor(COLORS.primary);
            }
            if (type === 'SNAPSHOT') {
                triggerSnapshot();
            }
            if (type === 'SET_CHAR') {
                setShape(ParticleShape.TEXT);
                setCharIndex(parseInt(value));
            }
            if (type === 'SET_NUM') {
                setShape(ParticleShape.NUMBER);
                setNumIndex(parseInt(value));
            }
        },
        (isListening, lastCommand) => {
            setVoiceStatus(prev => ({ ...prev, isListening, lastCommand }));
        }
    );
    voiceServiceRef.current.initialize();
    voiceServiceRef.current.start();

    // Cleanup
    return () => {
        handTrackerRef.current?.stop();
        audioServiceRef.current?.stop();
        voiceServiceRef.current?.stop();
    };
  }, []); // Run once on mount

  const toggleAudio = async () => {
      if (!audioServiceRef.current) return;
      
      setAudioError(false); // Reset error state

      if (audioEnabled) {
          audioServiceRef.current.stop();
          setAudioEnabled(false);
      } else {
          try {
            await audioServiceRef.current.initialize();
            setAudioEnabled(true);
          } catch(e) {
            console.error("Audio permission denied", e);
            setAudioError(true);
            setAudioEnabled(false);
          }
      }
  };

  const toggleVideo = async () => {
      if (!handTrackerRef.current) return;

      if (videoEnabled) {
          // Disable
          handTrackerRef.current.stop();
          setVideoEnabled(false);
          // Reset hand data so cursor disappears/resets
          handDataRef.current = INITIAL_HAND_DATA;
          setHandDataState(INITIAL_HAND_DATA);
      } else {
          // Enable
          setLoading(true);
          try {
              await handTrackerRef.current.initialize();
              setVideoEnabled(true);
          } catch (e) {
              console.error("Failed to restart video", e);
              setVideoEnabled(false);
              setLoading(false);
          }
      }
  };

  const toggleVoice = () => {
      if (!voiceServiceRef.current) return;
      voiceServiceRef.current.stop();
      setTimeout(() => {
          voiceServiceRef.current?.start();
      }, 200);
  };

  const triggerSnapshot = () => {
      setFlashOpacity(1);
      setCaptureTrigger(prev => prev + 1);
      setTimeout(() => setFlashOpacity(0), 100);
  };

  const cycleChar = (dir: number) => {
      setCharIndex(prev => {
          const next = prev + dir;
          if (next > 25) return 0;
          if (next < 0) return 25;
          return next;
      });
  };

  const cycleNum = (dir: number) => {
      setNumIndex(prev => {
          const next = prev + dir;
          if (next > 9) return 0;
          if (next < 0) return 9;
          return next;
      });
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      
      {/* 3D Scene */}
      <Canvas className="absolute inset-0 z-10" gl={{ preserveDrawingBuffer: true }}>
        <PerspectiveCamera makeDefault {...CAMERA_CONFIG} />
        <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            // Disable mouse rotation if hand is controlling it to avoid conflict
            enabled={!handDataState.isDetected} 
            autoRotate={!handDataState.isDetected}
            autoRotateSpeed={0.5}
        />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color={color} />
        
        <ParticleSystem 
            shape={shape} 
            color={color} 
            handData={handDataRef} 
            audioService={audioServiceRef}
            particleCount={particleCount}
            charIndex={charIndex}
            numIndex={numIndex}
        />
        <Shockwave color={color} />
        <SceneCapture captureTrigger={captureTrigger} onCaptureComplete={() => {}} />
      </Canvas>
      
      {/* Camera Flash Overlay */}
      <div 
        className="absolute inset-0 z-[60] bg-white pointer-events-none transition-opacity duration-300 ease-out"
        style={{ opacity: flashOpacity }}
      />

      {/* UI Overlay */}
      <UI 
        currentShape={shape} 
        setShape={setShape}
        currentColor={color} 
        setColor={setColor}
        handData={handDataState}
        loading={loading}
        audioEnabled={audioEnabled}
        audioError={audioError}
        toggleAudio={toggleAudio}
        voiceStatus={voiceStatus}
        audioServiceRef={audioServiceRef}
        toggleVoice={toggleVoice}
        videoEnabled={videoEnabled}
        toggleVideo={toggleVideo}
        onSnapshot={triggerSnapshot}
        particleCount={particleCount}
        setParticleCount={setParticleCount}
        charIndex={charIndex}
        cycleChar={cycleChar}
        numIndex={numIndex}
        cycleNum={cycleNum}
      />

      {/* Hidden Video Element for MediaPipe */}
      <video 
        ref={videoRef} 
        className="hidden absolute top-0 left-0 opacity-0 pointer-events-none"
        playsInline
        muted
        width="640"
        height="480"
      />
    </div>
  );
}
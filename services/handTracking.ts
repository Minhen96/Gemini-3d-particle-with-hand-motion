import { HandData } from '../types';

// Define local interface for MediaPipe Results since we aren't importing the type
interface Results {
    multiHandLandmarks: Array<Array<{x: number, y: number, z: number}>>;
}

export class HandTrackerService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private hands: any | null = null;
  private videoElement: HTMLVideoElement;
  private onResultsCallback: (data: HandData) => void;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isActive: boolean = false;

  constructor(videoElement: HTMLVideoElement, onResults: (data: HandData) => void) {
    this.videoElement = videoElement;
    this.onResultsCallback = onResults;
  }

  public async initialize() {
    console.log("Initializing HandTrackerService...");
    this.isActive = true;
    
    // Access Hands from the global window object loaded via script tag
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Hands = (window as any).Hands;
    
    if (!Hands) {
        throw new Error("MediaPipe Hands library not loaded. Check script tags.");
    }

    // Explicitly versioned asset loading to match the package version (0.4.1675469240)
    this.hands = new Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
      },
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.hands.onResults(this.processResults);

    try {
        console.log("Requesting camera access...");
        this.stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            } 
        });
        
        console.log("Camera access granted.");
        this.videoElement.srcObject = this.stream;
        
        // Wait for video to be ready before starting loop
        await new Promise<void>((resolve) => {
            this.videoElement.onloadedmetadata = () => {
                this.videoElement.play();
                resolve();
            };
        });

        // Start manual processing loop
        this.startLoop();

    } catch (e) {
        console.error("Error accessing camera or initializing MediaPipe:", e);
        throw e;
    }
  }

  private startLoop = () => {
      const step = async () => {
          if (!this.isActive) return;

          if (this.hands && this.videoElement.readyState >= 2) {
             try {
                await this.hands.send({ image: this.videoElement });
             } catch (err) {
                console.error("MediaPipe send error:", err);
             }
          }
          this.animationFrameId = requestAnimationFrame(step);
      }
      step();
  }

  private processResults = (results: Results) => {
    if (!this.isActive) return;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // Calculate simple center of palm (approximate using wrist + index MCP)
      const wrist = landmarks[0];
      const middleFingerMCP = landmarks[9];
      
      // Normalized coordinates (0-1)
      const xRaw = (wrist.x + middleFingerMCP.x) / 2; 
      const yRaw = (wrist.y + middleFingerMCP.y) / 2;

      // MIRRORING FIX: Invert X logic.
      // If xRaw is 0 (left of image), it should be 1 (right of screen)
      // (0.5 - xRaw) * 2 maps:
      // 0.0 -> 1.0 (Right)
      // 1.0 -> -1.0 (Left)
      const x = (0.5 - xRaw) * 2;
      const y = -(yRaw - 0.5) * 2; // Invert Y for 3D

      // Detect Clench & Spread
      const tips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky tips
      let isClenched = true;
      const palmBaseY = landmarks[0].y;
      
      // Calculate Average Distance from Wrist to Tips (Spread/Size)
      let totalDist = 0;
      for (const tipIdx of tips) {
        // Clench Logic
        if (landmarks[tipIdx].y < palmBaseY - 0.1) { 
          const dist = Math.sqrt(
            Math.pow(landmarks[tipIdx].x - landmarks[0].x, 2) + 
            Math.pow(landmarks[tipIdx].y - landmarks[0].y, 2)
          );
          if (dist > 0.15) isClenched = false;
        }

        // Spread Logic
        const distToWrist = Math.sqrt(
            Math.pow(landmarks[tipIdx].x - landmarks[0].x, 2) + 
            Math.pow(landmarks[tipIdx].y - landmarks[0].y, 2)
        );
        totalDist += distToWrist;
      }

      const avgDist = totalDist / 4;
      // Normalize Spread: 0.15 (Fist) to 0.4 (Open)
      // Output: 0 to 1
      const handSpread = Math.min(Math.max((avgDist - 0.1) / 0.3, 0), 1);

      this.onResultsCallback({
        x, 
        y, 
        isDetected: true,
        isClenched,
        handSpread
      });
    } else {
      this.onResultsCallback({
        x: 0,
        y: 0,
        isDetected: false,
        isClenched: false,
        handSpread: 0.5
      });
    }
  };

  public stop() {
    this.isActive = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    
    if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
    }
    
    if (this.videoElement) {
        this.videoElement.srcObject = null;
    }

    if (this.hands) {
        this.hands.close();
        this.hands = null;
    }
  }
}
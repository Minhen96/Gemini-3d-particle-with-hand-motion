import { AudioData } from '../types';

export class AudioService {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isRunning: boolean = false;

  public async initialize(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.context.createAnalyser();
      this.source = this.context.createMediaStreamSource(this.stream);
      
      this.analyser.fftSize = 512; // Balance between precision and performance
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.source.connect(this.analyser);
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      this.isRunning = true;
      console.log("Audio System Online");
    } catch (e) {
      console.error("Audio initialization failed", e);
      throw e;
    }
  }

  public getFrequencyData(): AudioData {
    if (!this.isRunning || !this.analyser || !this.dataArray) {
      return { bass: 0, mid: 0, treble: 0, average: 0 };
    }

    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate bands (Approximations)
    // fftSize 512 = 256 bins.
    // 0-4: Bass, 5-30: Mid, 31-255: Treble
    
    const bassRange = this.dataArray.slice(0, 10);
    const midRange = this.dataArray.slice(11, 60);
    const trebleRange = this.dataArray.slice(61, 255);

    const getAvg = (arr: Uint8Array) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const bass = getAvg(bassRange) / 255;
    const mid = getAvg(midRange) / 255;
    const treble = getAvg(trebleRange) / 255;
    const average = (bass + mid + treble) / 3;

    return { bass, mid, treble, average };
  }

  public stop() {
    this.isRunning = false;
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    if (this.context) this.context.close();
  }
}

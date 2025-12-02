import React, { useEffect, useRef, useState } from 'react';
import { ParticleShape, HandData } from '../types';
import { Activity, Radio, Hand, Grip, Cpu, Palette, Mic, MicOff, Waves, AlertTriangle, Video, VideoOff, Clock, Calendar, Camera, Layers, Settings, X, ChevronRight, ChevronLeft, Atom } from 'lucide-react';
import { COLOR_PALETTES } from '../constants';
import { AudioService } from '../services/audio';

interface UIProps {
  currentShape: ParticleShape;
  setShape: (s: ParticleShape) => void;
  currentColor: string;
  setColor: (c: string) => void;
  handData: HandData;
  loading: boolean;
  audioEnabled: boolean;
  audioError?: boolean;
  toggleAudio: () => void;
  voiceStatus: { isListening: boolean; lastCommand: string };
  audioServiceRef: React.MutableRefObject<AudioService | null>;
  toggleVoice: () => void;
  videoEnabled: boolean;
  toggleVideo: () => void;
  onSnapshot: () => void;
  particleCount: number;
  setParticleCount: (n: number) => void;
  charIndex: number;
  cycleChar: (dir: number) => void;
  numIndex: number;
  cycleNum: (dir: number) => void;
}

export const UI: React.FC<UIProps> = ({ 
    currentShape, setShape, currentColor, setColor, handData, loading,
    audioEnabled, audioError, toggleAudio, voiceStatus, audioServiceRef, toggleVoice,
    videoEnabled, toggleVideo, onSnapshot,
    particleCount, setParticleCount,
    charIndex, cycleChar, numIndex, cycleNum
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [cpuUsage, setCpuUsage] = useState<number>(0);
  const [showControls, setShowControls] = useState(true);

  // Responsive: Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 768) setShowControls(false);
        else setShowControls(true);
    };
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Time & System Stats Loop
  useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date();
        setTime(now.toLocaleTimeString('en-US', { hour12: false }));
        setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase());
        // Simulate CPU fluctuation
        setCpuUsage(prev => Math.min(Math.max(prev + (Math.random() - 0.5) * 10, 20), 90));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio Visualizer Loop
  useEffect(() => {
    if (!audioEnabled || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const draw = () => {
        if (audioServiceRef.current) {
            const data = audioServiceRef.current.getFrequencyData();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw Waveform bars
            const bars = 20;
            const width = canvas.width / bars;
            ctx.fillStyle = currentColor;
            
            // Simulated visualizer based on 3 bands for now to save perf
            const levels = [
                data.bass, data.bass, data.bass, 
                data.mid, data.mid, data.mid, data.mid, 
                data.treble, data.treble, data.treble
            ];

            for(let i=0; i<bars; i++) {
                // Pseudo-random variance based on bands
                const bandIdx = Math.floor((i / bars) * levels.length);
                const height = Math.max(2, levels[bandIdx] * canvas.height * 1.5 * Math.random());
                const x = i * width;
                const y = (canvas.height - height) / 2;
                
                ctx.globalAlpha = 0.5 + (height/canvas.height)*0.5;
                ctx.fillRect(x, y, width - 2, height);
            }
        }
        animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [audioEnabled, currentColor]);

  return (
    <>
      {/* --- HUD / Reticle --- */}
      {!loading && (
        <div 
            className="pointer-events-none fixed z-40 transition-transform duration-75 ease-out"
            style={{
                left: '50%',
                top: '50%',
                transform: `translate(${handData.x * window.innerWidth/2}px, ${-handData.y * window.innerHeight/2}px)`
            }}
        >
            <div className={`relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${handData.isClenched ? 'scale-75' : 'scale-100'}`}>
                <div 
                    className={`w-16 h-16 rounded-full border border-opacity-50 animate-spin-slow ${handData.isClenched ? 'border-white' : 'border-[current]'}`} 
                    style={{ animationDuration: '3s', borderColor: handData.isClenched ? '#ffffff' : currentColor }}
                ></div>
                <div className="absolute w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: currentColor }}></div>
                <div className="absolute top-0 w-full h-full border-t border-b border-transparent opacity-60" style={{ borderTopColor: currentColor }}></div>
                
                <div className="absolute top-10 left-1/2 -translate-x-1/2 text-[10px] font-sci-fi tracking-widest whitespace-nowrap" style={{ color: currentColor }}>
                   {handData.isDetected ? (handData.isClenched ? "CLENCH DETECTED" : "TRACKING") : "NO SIGNAL"}
                </div>
            </div>
        </div>
      )}

      {/* --- Main Layout --- */}
      <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-50">
        
        {/* Header (Top Left Dashboard) */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="flex flex-col gap-4">
              
              {/* Logo & Title Section */}
              <div className="flex items-center gap-4">
                {/* Reactor Logo */}
                <div className="relative w-12 h-12 flex items-center justify-center group">
                    {/* Outer Ring */}
                    <div className="absolute inset-0 border-2 border-dashed rounded-full animate-spin-slow opacity-80" style={{ borderColor: currentColor }}></div>
                    {/* Inner Ring */}
                    <div className="absolute inset-[3px] border border-current rounded-full opacity-40 animate-spin-reverse-slower" style={{ borderColor: currentColor }}></div>
                    {/* Core */}
                    <Atom size={24} className="text-white drop-shadow-[0_0_5px_currentColor] animate-pulse relative z-10" style={{ color: currentColor }} />
                    <div className="absolute inset-0 bg-current opacity-10 blur-md rounded-full" style={{ backgroundColor: currentColor }}></div>
                </div>

                <div>
                    <h1 
                        className="text-2xl md:text-4xl font-sci-fi text-transparent bg-clip-text font-black tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                        style={{ backgroundImage: `linear-gradient(to right, ${currentColor}, #ffffff)` }}
                    >
                    JARVIS
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: currentColor }}></div>
                        <span className="text-xs font-mono tracking-[0.2em] opacity-80" style={{ color: currentColor }}>SYSTEM ONLINE</span>
                    </div>
                </div>
              </div>

              {/* System Stats HUD */}
              <div className="bg-black/40 backdrop-blur-sm border-l-2 pl-4 py-2 space-y-1" style={{ borderColor: currentColor }}>
                 <div className="flex items-center gap-3 text-xs font-mono text-white/80">
                    <Clock size={12} style={{ color: currentColor }} />
                    <span className="tracking-widest">{time}</span>
                 </div>
                 <div className="flex items-center gap-3 text-xs font-mono text-white/80">
                    <Calendar size={12} style={{ color: currentColor }} />
                    <span className="tracking-widest">{date}</span>
                 </div>
                 <div className="flex items-center gap-3 text-xs font-mono mt-2 text-white/60">
                     <Activity size={12} />
                     <span>CPU LOAD: {Math.floor(cpuUsage)}%</span>
                 </div>
                 {/* Fake CPU Graph */}
                 <div className="flex gap-[1px] h-2 opacity-50 w-32">
                    {Array.from({length: 10}).map((_, i) => (
                        <div 
                            key={i} 
                            className="w-full bg-white transition-all duration-300" 
                            style={{ 
                                height: `${Math.random() * 100}%`,
                                backgroundColor: i < (cpuUsage / 10) ? currentColor : '#333'
                            }} 
                        />
                    ))}
                 </div>
              </div>
            
            {/* Snapshot Button (Moved here) */}
             <button
                onClick={onSnapshot}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/50 transition-all rounded text-xs font-mono text-white/80 w-fit"
             >
                <Camera size={14} style={{ color: currentColor }} />
                <span>SAVE SNAPSHOT</span>
             </button>

            {/* Voice Status Log */}
            <button 
                onClick={toggleVoice}
                className="mt-2 flex flex-col gap-1 text-[10px] font-mono h-12 text-left group hover:bg-white/5 p-2 rounded -ml-2 transition-colors max-w-[200px]"
            >
                 <div className={`flex items-center gap-2 ${voiceStatus.isListening ? 'text-white/80' : 'text-red-400'}`}>
                    <Mic size={10} className={voiceStatus.isListening ? "text-red-500 animate-pulse" : "text-gray-500"} />
                    <span>{voiceStatus.isListening ? "VOICE ACTIVE" : "VOICE OFFLINE"}</span>
                 </div>
                 {voiceStatus.lastCommand && (
                     <div className="text-white animate-pulse truncate">
                         &gt; "{voiceStatus.lastCommand}"
                     </div>
                 )}
            </button>
          </div>
        </div>

        {/* Bottom Left Container (Sensors + Instructions) */}
        <div className="fixed bottom-6 left-6 flex flex-col gap-4 pointer-events-auto max-w-[240px]">
            
            {/* Sensors (Moved here) */}
            <div className="bg-black/80 backdrop-blur-md border p-1 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)]" style={{ borderColor: `${currentColor}40` }}>
                 <div className="bg-white/5 p-2 mb-1 rounded flex items-center justify-between border-b" style={{ borderColor: `${currentColor}30` }}>
                    <span className="font-sci-fi text-xs" style={{ color: currentColor }}>SENSORS</span>
                    <Waves size={14} style={{ color: currentColor }} />
                 </div>
                 
                 <div className="p-2 flex flex-col gap-2">
                     {/* Video Control */}
                     <div className="flex flex-col gap-1">
                        <button 
                            onClick={toggleVideo}
                            className={`flex items-center gap-2 w-full p-2 rounded text-xs font-mono transition-colors ${
                                videoEnabled 
                                ? 'bg-white/20 text-white' 
                                : 'hover:bg-white/5 text-gray-400'
                            }`}
                        >
                            {videoEnabled ? <Video size={14}/> : <VideoOff size={14}/>}
                            <span>{videoEnabled ? "CAMERA" : "OFFLINE"}</span>
                        </button>
                        {/* Video Signal Indicator */}
                        <div className="flex items-center justify-between px-2 text-[9px] font-mono h-3">
                            <span className="opacity-50">SIGNAL:</span>
                            {videoEnabled ? (
                                handData.isDetected ? (
                                    <span className="text-green-400 tracking-wider">LOCKED</span>
                                ) : (
                                    <span className="text-yellow-500 animate-pulse tracking-wider">SEARCHING</span>
                                )
                            ) : (
                                <span className="text-red-500 tracking-wider">N/A</span>
                            )}
                        </div>
                     </div>

                     <div className="h-px bg-white/10 mx-1"></div>

                     {/* Audio Control */}
                     <div className="flex flex-col gap-2 pt-1">
                        <button 
                            onClick={toggleAudio}
                            className={`flex items-center gap-2 w-full p-2 rounded text-xs font-mono transition-colors ${
                                audioError 
                                ? 'bg-red-900/30 text-red-400 border border-red-900' 
                                : audioEnabled 
                                    ? 'bg-white/20 text-white' 
                                    : 'hover:bg-white/5 text-gray-400'
                            }`}
                        >
                            {audioError ? <AlertTriangle size={14} /> : (audioEnabled ? <Mic size={14}/> : <MicOff size={14}/>)}
                            <span>{audioError ? "DENIED" : "AUDIO"}</span>
                        </button>
                        
                        {/* Visualizer Canvas */}
                        <div className="h-6 bg-black/50 rounded overflow-hidden relative">
                            {!audioEnabled && !audioError && <div className="absolute inset-0 flex items-center justify-center text-[8px] text-gray-600">OFFLINE</div>}
                            {audioError && <div className="absolute inset-0 flex items-center justify-center text-[8px] text-red-900">ERROR</div>}
                            <canvas ref={canvasRef} width={200} height={32} className="w-full h-full" />
                        </div>
                     </div>
                 </div>
            </div>

            {/* Instructions */}
            <div className="bg-black/80 backdrop-blur-md border p-4 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] hidden md:block" style={{ borderColor: `${currentColor}40` }}>
                 <div className="text-[10px] font-mono space-y-2" style={{ color: currentColor }}>
                    <div className="flex items-center gap-2">
                        <Hand size={14} />
                        <span>MOVE TO ROTATE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Grip size={14} />
                        <span>CLENCH TO SHRINK</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Radio size={14} />
                        <span>OPEN TO RESET</span>
                    </div>
                 </div>
            </div>
        </div>


        {/* Control Panel Toggle (Mobile/Desktop) */}
        <div className="fixed top-6 right-6 pointer-events-auto z-[60]">
             <button
                onClick={() => setShowControls(!showControls)}
                className={`p-2 rounded border transition-all duration-300 ${showControls ? 'bg-white/10 border-white/30 text-white' : 'bg-black/60 border-transparent text-gray-400 hover:text-white'}`}
                style={{ borderColor: showControls ? currentColor : 'transparent' }}
             >
                {showControls ? <X size={20} /> : <Settings size={20} />}
             </button>
        </div>

        {/* Control Panel (Right Side) */}
        <div 
            className={`
                fixed right-4 top-[80px] bottom-6 
                flex flex-col gap-4 pointer-events-auto 
                max-h-[calc(100vh-100px)] overflow-y-auto 
                p-2 pr-1 custom-scrollbar
                transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                origin-top-right
                md:w-[240px] w-[220px]
                ${showControls ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-[100%] scale-90 pointer-events-none'}
            `}
        >
          
          {/* Particle Density */}
          <div className="bg-black/80 backdrop-blur-md border p-1 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] shrink-0" style={{ borderColor: `${currentColor}40` }}>
             <div className="bg-white/5 p-3 mb-1 rounded flex items-center justify-between border-b" style={{ borderColor: `${currentColor}30` }}>
                <span className="font-sci-fi text-sm" style={{ color: currentColor }}>DENSITY</span>
                <Layers size={16} style={{ color: currentColor }} />
             </div>
             <div className="p-3">
                 <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
                     <span>LOW</span>
                     <span style={{ color: currentColor }}>{(particleCount / 1000).toFixed(0)}K</span>
                     <span>MAX</span>
                 </div>
                 <input 
                    type="range" 
                    min="20000" 
                    max="150000" 
                    step="5000"
                    value={particleCount}
                    onChange={(e) => setParticleCount(Number(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: currentColor }}
                 />
             </div>
          </div>

          {/* Colors */}
           <div className="bg-black/80 backdrop-blur-md border p-1 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] shrink-0" style={{ borderColor: `${currentColor}40` }}>
             <div className="bg-white/5 p-3 mb-1 rounded flex items-center justify-between border-b" style={{ borderColor: `${currentColor}30` }}>
                <span className="font-sci-fi text-sm" style={{ color: currentColor }}>THEME</span>
                <Palette size={16} style={{ color: currentColor }} />
             </div>
             <div className="flex gap-2 p-2 justify-center flex-wrap">
                {Object.entries(COLOR_PALETTES).map(([name, color]) => (
                    <button
                        key={name}
                        onClick={() => setColor(color)}
                        className={`w-6 h-6 rounded-full transition-all duration-300 hover:scale-125 border-2 ${currentColor === color ? 'border-white scale-110 shadow-[0_0_10px_currentColor]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        style={{ backgroundColor: color }}
                        title={name}
                    />
                ))}
             </div>
          </div>

          {/* Shapes */}
          <div className="bg-black/80 backdrop-blur-md border p-1 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] shrink-0" style={{ borderColor: `${currentColor}40` }}>
             <div className="bg-white/5 p-3 mb-1 rounded flex items-center justify-between border-b" style={{ borderColor: `${currentColor}30` }}>
                <span className="font-sci-fi text-sm" style={{ color: currentColor }}>FORMATION</span>
                <Cpu size={16} style={{ color: currentColor }} />
             </div>
             
             <div className="flex flex-col gap-1 p-2">
                {Object.values(ParticleShape).map((shape) => (
                    <div key={shape} className="relative">
                        <button
                            onClick={() => setShape(shape)}
                            className={`
                                w-full group relative overflow-hidden px-3 py-2 text-left transition-all duration-300 rounded
                                ${currentShape === shape 
                                    ? 'bg-white/10 text-white border-l-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}
                            `}
                            style={{ borderColor: currentShape === shape ? currentColor : 'transparent' }}
                        >
                            <span className="relative z-10 text-[10px] md:text-xs font-bold tracking-widest flex items-center justify-between">
                                {shape === 'TEXT' ? (currentShape === 'TEXT' ? `< ${String.fromCharCode(65 + charIndex)} >` : 'TEXT <A>') :
                                 shape === 'NUMBER' ? (currentShape === 'NUMBER' ? `< ${numIndex} >` : 'NUMBER <1>') :
                                 shape}
                                {currentShape === shape && (shape !== 'TEXT' && shape !== 'NUMBER') && <ChevronRight size={12} />}
                            </span>
                            <div 
                                className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 opacity-20"
                                style={{ background: `linear-gradient(to right, ${currentColor}, transparent)` }}
                            ></div>
                        </button>
                        
                        {/* Special Controls for Text/Number */}
                        {currentShape === shape && (shape === 'TEXT' || shape === 'NUMBER') && (
                            <div className="absolute inset-0 flex justify-between z-20 pointer-events-none">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); shape === 'TEXT' ? cycleChar(-1) : cycleNum(-1); }}
                                    className="pointer-events-auto h-full w-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/20"
                                >
                                    <ChevronLeft size={12}/>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); shape === 'TEXT' ? cycleChar(1) : cycleNum(1); }}
                                    className="pointer-events-auto h-full w-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/20"
                                >
                                    <ChevronRight size={12}/>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
             </div>
          </div>

        </div>

      </div>

      {/* Loading Screen */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
             <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-gray-900 rounded-full"></div>
                <div className="absolute inset-0 border-t-4 border-cyan-400 rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-4 border-gray-800 rounded-full"></div>
                <div className="absolute inset-4 border-b-4 border-cyan-200 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
             </div>
             <h2 className="text-2xl text-cyan-400 font-sci-fi tracking-[0.3em] animate-pulse">INITIALIZING</h2>
             <p className="text-cyan-800 font-mono text-sm mt-2">LOADING NEURAL INTERFACE...</p>
        </div>
      )}
    </>
  );
};
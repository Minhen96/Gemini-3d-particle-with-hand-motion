import { COLOR_PALETTES } from '../constants';
import { ParticleShape, VoiceCommandType } from '../types';

type CommandCallback = (type: VoiceCommandType, value: string) => void;

const NUMBER_WORD_MAP: {[key: string]: number} = {
    'ZERO': 0, 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4,
    'FIVE': 5, 'SIX': 6, 'SEVEN': 7, 'EIGHT': 8, 'NINE': 9
};

// Common prefixes to identify intent
const MODE_PREFIXES = "LETTER|CHAR|CHARACTER|TEXT|ALPHABET|TYPE|WRITE|SHOW|DISPLAY|NUMBER|NUM|DIGIT|COUNT";
// Colors to act as prefixes (e.g., "Red A")
const COLOR_PREFIXES = "RED|BLUE|GREEN|CYAN|MAGENTA|YELLOW|WHITE|ORANGE|PURPLE|GOLD|PINK|VIOLET|BLACK";

export class VoiceService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onCommandMatch: CommandCallback;
  private onStatusChange: (listening: boolean, lastCmd: string) => void;
  private restartTimer: number | null = null;
  private shouldBeRunning: boolean = false;

  constructor(
    onCommandMatch: CommandCallback, 
    onStatusChange: (listening: boolean, lastCmd: string) => void
  ) {
    this.onCommandMatch = onCommandMatch;
    this.onStatusChange = onStatusChange;
  }

  public initialize() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.lang = 'en-US';
    // Use interim results to keep connection alive longer
    this.recognition.interimResults = true; 
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      console.log("Voice Recognition Started");
      this.isListening = true;
      this.onStatusChange(true, "");
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onStatusChange(false, "");
      
      // Intelligent restart
      if (this.shouldBeRunning) {
         this.restartTimer = window.setTimeout(() => {
             try { 
                 if (this.recognition && this.shouldBeRunning) this.recognition.start(); 
             } catch(e) { 
                 console.log("Auto-restart blocked", e); 
             }
         }, 100);
      }
    };

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      
      if (result.isFinal) {
        // Strip punctuation and extra spaces for cleaner matching
        // "LETTER A." -> "LETTER A"
        let transcript = result[0].transcript.trim().toUpperCase();
        transcript = transcript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""); 
        
        console.log("Voice Input Processed:", transcript);
        this.onStatusChange(true, transcript);
        this.processCommand(transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
            console.warn("Voice Recognition Error:", event.error);
        }
        if (event.error === 'not-allowed') {
            this.shouldBeRunning = false;
            this.stop(); 
        }
    };
  }

  public start() {
    if (this.recognition && !this.isListening) {
        this.shouldBeRunning = true;
        try {
            this.recognition.start();
        } catch(e) { console.error("Failed to start voice:", e); }
    }
  }

  public stop() {
    this.shouldBeRunning = false;
    this.isListening = false;
    if (this.restartTimer) clearTimeout(this.restartTimer);
    if (this.recognition) {
        this.recognition.stop();
    }
  }

  private processCommand(text: string) {
    // 1. Check for RESET command
    if (text.includes("RESET") || text.includes("CLEAR") || text.includes("DEFAULT")) {
        this.onCommandMatch('RESET', '');
        return;
    }

    // 2. Check for Snapshot
    if (text.includes("SAVE") || text.includes("SNAPSHOT") || text.includes("CAPTURE") || text.includes("DOWNLOAD") || text.includes("PICTURE")) {
        this.onCommandMatch('SNAPSHOT', '');
    }

    // 3. Check Colors (Processing this earlier allows "Blue 6" to register color first)
    let colorFound = false;
    for (const [name, hex] of Object.entries(COLOR_PALETTES)) {
        if (text.includes(name)) {
            this.onCommandMatch('COLOR', hex);
            colorFound = true;
            break; 
        }
    }
    
    // Common Color Aliases
    if (!colorFound) {
        if (text.includes("BLUE")) this.onCommandMatch('COLOR', COLOR_PALETTES.CYAN);
        else if (text.includes("GREEN")) this.onCommandMatch('COLOR', COLOR_PALETTES.LIME);
        else if (text.includes("YELLOW")) this.onCommandMatch('COLOR', COLOR_PALETTES.GOLD);
        else if (text.includes("VIOLET")) this.onCommandMatch('COLOR', COLOR_PALETTES.PURPLE);
        else if (text.includes("PINK")) this.onCommandMatch('COLOR', COLOR_PALETTES.MAGENTA);
        else if (text.includes("WHITE")) this.onCommandMatch('COLOR', COLOR_PALETTES.WHITE);
        else if (text.includes("BLACK")) this.onCommandMatch('COLOR', '#333333');
    }

    // 4. Check specific Letter/Number commands
    // Regex Logic: Look for (PREFIX OR COLOR) followed by (VALUE)
    // e.g. "LETTER A", "RED A", "BLUE 6"
    
    const combinedPrefixes = `${MODE_PREFIXES}|${COLOR_PREFIXES}`;
    
    const letterRegex = new RegExp(`\\b(${combinedPrefixes})\\s+([A-Z])\\b`);
    const letterMatch = text.match(letterRegex);
    
    if (letterMatch) {
        const char = letterMatch[2]; 
        const index = char.charCodeAt(0) - 65; // A=0
        if (index >= 0 && index <= 25) {
            console.log(`Matched Letter: ${char} (${index})`);
            this.onCommandMatch('SET_CHAR', index.toString());
        }
    }

    // Regex for numbers: "NUMBER 5", "BLUE 6", "COUNT 3"
    const numberRegex = new RegExp(`\\b(${combinedPrefixes})\\s+(\\w+)\\b`);
    const numberMatch = text.match(numberRegex);
    
    if (numberMatch) {
        const valStr = numberMatch[2];
        let numVal = parseInt(valStr);
        
        // Map words like "ONE" to 1 if parseInt failed
        if (isNaN(numVal) && NUMBER_WORD_MAP[valStr] !== undefined) {
            numVal = NUMBER_WORD_MAP[valStr];
        }

        if (!isNaN(numVal) && numVal >= 0 && numVal <= 9) {
            console.log(`Matched Number: ${numVal}`);
            this.onCommandMatch('SET_NUM', numVal.toString());
        }
    }

    // 5. Check Shapes
    for (const shape of Object.values(ParticleShape)) {
        if (text.includes(shape) || (shape === 'BIG_BANG' && text.includes("BIG BANG"))) {
            // Avoid conflict: If I said "LETTER A", it contains "TEXT" (ParticleShape.TEXT) if using enum key TEXT.
            // But we match enum values here. 'TEXT' matches 'TEXT'.
            // Logic: If we matched a specific letter/number command, we probably don't want to generic shape switch 
            // UNLESS the user explicitly said the shape name in a separate context.
            // However, "TEXT" is both a shape and a prefix.
            // If I say "RED A", letterMatch is true. shape 'TEXT' is not in string "RED A".
            // If I say "TEXT A", letterMatch is true. shape 'TEXT' is in string.
            
            // Priority: If we found a Letter/Number match, we implicitly switch mode in App.tsx handlers.
            // But here we might double fire SHAPE=TEXT. That is benign as long as App handles it.
            
            // To be safe, if we matched a letter/number value, we skip generic shape matching for TEXT/NUMBER types
            if (shape === ParticleShape.TEXT && letterMatch) continue;
            if (shape === ParticleShape.NUMBER && numberMatch) continue;
            
            this.onCommandMatch('SHAPE', shape);
            break; 
        }
    }
  }
}
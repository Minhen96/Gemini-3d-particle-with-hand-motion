<div align="center">
   <img width="1915" height="858" alt="Jarvis Interface Demo 1" src="https://github.com/user-attachments/assets/96e980f1-b61f-428e-a2ef-52dcf8a2165d" />
   <img width="1916" height="857" alt="Jarvis Interface Demo 2" src="https://github.com/user-attachments/assets/b9cbb5af-e67a-4652-9b5c-a39546945ae2" />

# J.A.R.V.I.S. Holographic Interface
### Immersive Augmented Reality Particle System
</div>

## 🌌 Overview
This project is a high-performance **Holographic Particle Interface** inspired by Iron Man's JARVIS. It utilizes **React**, **Three.js**, and **MediaPipe** to create a living, breathing 3D system that responds to your hand gestures, voice commands, and ambient audio in real-time.

## 🚀 Key Features

### 🖐️ Gesture Control (MediaPipe)
*   **Navigation**: Your hand acts as a 3D joystick. Move your hand to rotate the hologram.
*   **Physics**: The particle system physically reacts to your hand's presence.
*   **Clench Interaction**: Clench your fist to **shrink and compress** the particle cloud. Open your hand to expand it.

### 🎙️ Voice Command Module
Integrated Web Speech API allows for hands-free control.
*   **Colors**: "Blue", "Red", "Gold", "White", "Cyan", etc.
*   **Shapes**: "Sphere", "Cube", "Galaxy", "DNA", "Saturn", "Pyramid".
*   **Text/Numbers**: "Letter A", "Number 5", "Red X", "Blue 7".
*   **System**: "Reset", "Snapshot", "Save".

### 🎵 Sonic Resonance
*   **Audio Reactivity**: The core and aura particles pulse to the beat of your music or voice via the microphone.
*   **Shockwaves**: Bass frequencies trigger expansion events in the 3D mesh.

### 💻 Sci-Fi HUD
*   Real-time Clock & Date.
*   Simulated CPU Neural Net graph.
*   Glassmorphism control panels with custom scrollbars.
*   Audio Waveform Visualizer.

---

## 🛠️ Tech Stack
*   **Core**: React 18, TypeScript, Vite
*   **3D Engine**: Three.js, React Three Fiber (@react-three/fiber)
*   **AI/Tracking**: MediaPipe Hands
*   **Styling**: Tailwind CSS, Lucide React (Icons)

---

## 🎮 Controls Guide

### Voice Commands
| Command Type | Examples |
| :--- | :--- |
| **Change Color** | *"Turn Red"*, *"Make it Gold"*, *"Cyan"*, *"White"* |
| **Change Shape** | *"Sphere"*, *"Cube"*, *"Galaxy"*, *"Pyramid"*, *"DNA"* |
| **Holographic Text** | *"Letter A"*, *"Number 7"*, *"Red B"*, *"Blue 5"* |
| **System** | *"Reset System"*, *"Take Snapshot"*, *"Save"* |

### Hand Gestures
*   **Open Palm**: Idle state / Rotation control.
*   **Closed Fist**: Compress particles / Focus mode.
*   **Hand Distance**: Move hand closer/further to adjust scale dynamically.

---

## 📦 Run Locally

**Prerequisites:** Node.js (v16+)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Environment:**
   Set the `GEMINI_API_KEY` in `.env.local` (Optional, if using GenAI features).

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Access**:
   Open `http://localhost:5173` (or the port shown in your terminal).
   *Allow Camera and Microphone permissions when prompted.*

---

<div align="center">
  <sub>Built with React Three Fiber & MediaPipe</sub>
</div>
# AI-PHYSIO-ASSISTANT

# PhysioSmart AI Agent

PhysioSmart AI is a real-time, AI-powered physiotherapy assistant that watches your exercise form through your webcam, coaches you out loud as you move, and tracks your recovery progress over time.

It combines pose-tracking computer vision with a live conversational AI coach — so instead of a static workout video, you get a session that actually reacts to how you're moving.

## Features

- **Real-time pose tracking** — Uses MediaPipe Pose to track 33 body landmarks from your webcam feed and calculate joint angles live, frame by frame.
- **Live AI voice coaching** — Connects to the Gemini Live API, which listens to your session in real time and gives short, encouraging voice cues ("Lower your hips", "Good depth!") based on your joint angles and rep count.
- **Automatic rep counting & form scoring** — Detects each repetition from joint-angle thresholds per exercise and flags when form drifts out of the target range.
- **Exercise library** — Guided sessions for Squats, Bicep Curls, and Shoulder Presses, each with its own target angle range and coaching script.
- **Recovery dashboard** — Visualizes total reps, average form score, and range-of-motion trend across sessions using interactive charts, plus a clinical-style session log table.
- **Voice safety commands** — Say "Stop" or "Help" during a session and the AI coach acknowledges and can end the session immediately.
- **Local session history** — Session data persists in the browser (`localStorage`), so your progress carries across visits without needing a backend.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — dev server and build tooling
- **Google Gemini API** (`@google/genai`) — powers the live voice coaching via Gemini's Live API (audio in/out)
- **MediaPipe Pose** — real-time pose landmark detection (loaded via CDN in `index.html`)
- **Recharts** — dashboard charts (Area chart for ROM trend, Line chart for rep volume)
- **Tailwind CSS** utility classes — UI styling

## Project Structure

```
├── App.tsx                    # Root component — routing between Home / Session / Dashboard views
├── components/
│   ├── ExerciseSession.tsx    # Live session: camera feed, pose detection, Gemini Live coaching
│   └── Dashboard.tsx          # Recovery progress charts & session history table
├── utils/
│   └── mathUtils.ts           # Joint angle calculation & form scoring
├── constants.ts                # Per-exercise target angle configs & MediaPipe landmark indices
├── types.ts                    # Shared TypeScript types
└── metadata.json                # App metadata & required permissions (camera, microphone)
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- A [Gemini API key](https://aistudio.google.com/apikey)

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/DEVAM47/AI-PHYSIO-ASSISTANT.git
   cd AI-PHYSIO-ASSISTANT/physiosmart-ai-agent
   npm install
   ```

2. Create a `.env.local` file in the project root and add your Gemini API key:
   ```
   API_KEY=your_gemini_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open the app in your browser and allow camera + microphone access when prompted.

### Build for production

```bash
npm run build
npm run preview
```

## How It Works

1. When you start an exercise, MediaPipe Pose analyzes your webcam feed frame-by-frame to detect 33 body landmarks.
2. Based on the selected exercise (squat, bicep curl, or shoulder press), the app calculates the relevant joint angle — e.g. hip–knee–ankle for squats.
3. That angle is compared against a target range defined per exercise. Crossing into and out of range counts a rep and updates your form score.
4. In parallel, a Gemini Live session receives session events (reps completed, form errors) and responds with short spoken feedback.
5. When the session ends, the results are saved to your session history and immediately reflected on the Recovery Dashboard.

## Roadmap / Ideas

- [ ] Persist session history to a real backend/database instead of `localStorage`
- [ ] Support additional exercises beyond squat/curl/press
- [ ] PDF export of the recovery report (button exists in UI, not yet wired up)
- [ ] Multi-limb tracking (currently tracks the left side only)

## Disclaimer

This project is a personal/academic prototype and is **not a certified medical device**. It is not a substitute for guidance from a licensed physiotherapist or medical professional.

## License

Add your preferred license here (e.g. MIT).

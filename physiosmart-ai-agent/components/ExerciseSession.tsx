
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ExerciseType, SessionData, ExerciseState } from '../types';
import { EXERCISE_CONFIGS, MEDIAPIPE_CHANNELS } from '../constants';
import { calculateAngle, calculateIntensityScore } from '../utils/mathUtils';

interface Props {
  exerciseType: ExerciseType;
  onComplete: (data: SessionData) => void;
  onCancel: () => void;
}

// MediaPipe global objects (loaded via script in index.html)
declare const Pose: any;
declare const Camera: any;
declare const drawConnectors: any;
declare const drawLandmarks: any;
declare const POSE_CONNECTIONS: any;

const ExerciseSession: React.FC<Props> = ({ exerciseType, onComplete, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const [status, setStatus] = useState<'initializing' | 'active' | 'completed'>('initializing');
  const [state, setState] = useState<ExerciseState>({
    reps: 0,
    isAtBottom: false,
    lastRepTime: Date.now(),
    score: 100,
    feedback: 'Get ready...'
  });
  
  const [currentAngle, setCurrentAngle] = useState(180);
  const [timeRemaining, setTimeRemaining] = useState(60); // 1 minute session
  const romHistory = useRef<number[]>([]);
  const lastFeedbackTime = useRef(0);

  // Audio helpers
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  // Initialize Gemini Live API
  useEffect(() => {
    const initGemini = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let nextStartTime = 0;
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = outputCtx;
        const outputNode = outputCtx.createGain();
        outputNode.connect(outputCtx.destination);

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            systemInstruction: `You are a real-time Physiotherapy Coach for ${exerciseType}. 
            Monitor the user's joint angles and repetitions. 
            Provide concise, encouraging voice cues (max 5 words) like "Lower your hips" or "Good depth!".
            The target range for this exercise is ${EXERCISE_CONFIGS[exerciseType].targetMin} to ${EXERCISE_CONFIGS[exerciseType].targetMax} degrees.
            If you hear the user say "Stop" or "Help", acknowledge and provide emergency support instructions immediately.`,
          },
          callbacks: {
            onopen: () => {
              console.log('Gemini Live session opened');
              setStatus('active');
            },
            onmessage: async (message: LiveServerMessage) => {
              const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioBase64) {
                nextStartTime = Math.max(nextStartTime, outputCtx.currentTime);
                const audioBuffer = await decodeAudioData(decode(audioBase64), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.start(nextStartTime);
                nextStartTime += audioBuffer.duration;
              }
              
              if (message.serverContent?.interrupted) {
                nextStartTime = 0;
              }
            },
            onerror: (e) => console.error('Gemini error:', e),
            onclose: () => console.log('Gemini Live session closed'),
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error('Failed to initialize Gemini Live:', err);
      }
    };

    initGemini();
    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [exerciseType]);

  // Exercise Logic Callback
  const onResults = useCallback((results: any) => {
    if (!results.poseLandmarks || !canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Draw landmarks for feedback
    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#6366f1', lineWidth: 4 });
    drawLandmarks(ctx, results.poseLandmarks, { color: '#4f46e5', lineWidth: 2, radius: 4 });

    // Calculate angle based on exercise type
    const landmarks = results.poseLandmarks;
    const config = EXERCISE_CONFIGS[exerciseType];
    let angle = 180;

    if (exerciseType === ExerciseType.SQUAT) {
      angle = calculateAngle(
        landmarks[MEDIAPIPE_CHANNELS.LEFT_HIP],
        landmarks[MEDIAPIPE_CHANNELS.LEFT_KNEE],
        landmarks[MEDIAPIPE_CHANNELS.LEFT_ANKLE]
      );
    } else if (exerciseType === ExerciseType.BICEP_CURL) {
      angle = calculateAngle(
        landmarks[MEDIAPIPE_CHANNELS.LEFT_SHOULDER],
        landmarks[MEDIAPIPE_CHANNELS.LEFT_ELBOW],
        landmarks[MEDIAPIPE_CHANNELS.LEFT_WRIST]
      );
    } else if (exerciseType === ExerciseType.SHOULDER_PRESS) {
      angle = calculateAngle(
        landmarks[MEDIAPIPE_CHANNELS.LEFT_ELBOW],
        landmarks[MEDIAPIPE_CHANNELS.LEFT_SHOULDER],
        landmarks[MEDIAPIPE_CHANNELS.LEFT_HIP]
      );
    }

    setCurrentAngle(angle);
    romHistory.current.push(angle);

    // Rep Counting and Form Logic
    setState(prev => {
      let newReps = prev.reps;
      let newIsAtBottom = prev.isAtBottom;
      let newFeedback = prev.feedback;
      
      const now = Date.now();
      
      // Rep counting
      if (angle <= config.targetMax && !newIsAtBottom) {
        newIsAtBottom = true;
      } else if (angle >= config.maxAngle - 20 && newIsAtBottom) {
        newReps += 1;
        newIsAtBottom = false;
        newFeedback = `Great rep! ${newReps} total.`;
        
        // Push update to Gemini
        if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput({
            media: {
              data: btoa(JSON.stringify({ event: 'REP_COMPLETE', reps: newReps, angle })),
              mimeType: 'text/plain'
            }
          });
        }
      }

      // Voice correction triggering (if out of range for too long)
      if (angle > config.targetMax + 10 && now - lastFeedbackTime.current > 3000) {
        newFeedback = "Go lower!";
        lastFeedbackTime.current = now;
        if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput({
             media: {
               data: btoa(JSON.stringify({ event: 'FORM_ERROR', type: 'INSUFFICIENT_DEPTH', angle })),
               mimeType: 'text/plain'
             }
          });
        }
      }

      return {
        ...prev,
        reps: newReps,
        isAtBottom: newIsAtBottom,
        feedback: newFeedback,
        score: calculateIntensityScore(90, 80, 85) // Simplified for demo
      };
    });

    ctx.restore();
  }, [exerciseType]);

  // MediaPipe Setup
  useEffect(() => {
    if (!videoRef.current) return;

    const pose = new Pose({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(onResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await pose.send({ image: videoRef.current! });
      },
      width: 1280,
      height: 720,
    });

    camera.start();

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      camera.stop();
      pose.close();
      clearInterval(timer);
    };
  }, [onResults]);

  const completeSession = () => {
    const finalData: SessionData = {
      id: Math.random().toString(36).substr(2, 9),
      exerciseType,
      date: new Date().toISOString(),
      reps: state.reps,
      sets: 1,
      avgScore: state.score,
      romTrend: romHistory.current.filter((_, i) => i % 60 === 0), // Sampled
      duration: 60 - timeRemaining,
      flags: state.score < 70 ? ['Low Intensity Detected'] : []
    };
    onComplete(finalData);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 p-4">
      {/* Left: Video Feed */}
      <div className="flex-1 relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-indigo-500/20">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" playsInline />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" width={1280} height={720} />
        
        {/* HUD Overlay */}
        <div className="absolute top-6 left-6 flex flex-col gap-4">
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Exercise</p>
            <p className="text-white text-xl font-bold">{exerciseType}</p>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Repetitions</p>
            <p className="text-white text-4xl font-black">{state.reps}</p>
          </div>
        </div>

        <div className="absolute top-6 right-6 flex flex-col items-end gap-4">
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider text-right">Timer</p>
            <p className="text-white text-2xl font-mono">00:{timeRemaining.toString().padStart(2, '0')}</p>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
             <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
             <p className="text-white text-sm font-semibold">AI MONITORING LIVE</p>
          </div>
        </div>

        {/* Floating Feedback */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-6">
           <div className="bg-indigo-600/90 backdrop-blur-lg text-white p-6 rounded-2xl shadow-xl text-center border border-indigo-400/30 transform transition-all scale-100">
             <p className="text-indigo-200 text-xs font-bold mb-1">LIVE COACHING</p>
             <h4 className="text-2xl font-bold italic">"{state.feedback}"</h4>
           </div>
        </div>
      </div>

      {/* Right: Metrics & Controls */}
      <div className="w-full lg:w-96 flex flex-col gap-4 shrink-0 overflow-auto">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
            Biometric Data
          </h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">Joint Angle</span>
                <span className="text-slate-900 font-bold">{Math.round(currentAngle)}°</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-200 ${
                    currentAngle >= EXERCISE_CONFIGS[exerciseType].targetMin && currentAngle <= EXERCISE_CONFIGS[exerciseType].targetMax 
                    ? 'bg-green-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${(currentAngle / 180) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0°</span>
                <span className="text-indigo-600 font-bold">Target: {EXERCISE_CONFIGS[exerciseType].targetMin}°-{EXERCISE_CONFIGS[exerciseType].targetMax}°</span>
                <span>180°</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Intensity</p>
                <p className="text-xl font-bold text-slate-800">{state.score}%</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Target Depth</p>
                <p className="text-xl font-bold text-slate-800">{EXERCISE_CONFIGS[exerciseType].targetMin}°</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex-1">
          <h3 className="text-indigo-800 font-bold mb-2">Voice Assistant Active</h3>
          <p className="text-indigo-600 text-sm mb-4">
            The AI is listening for your commands. Say <span className="font-bold">"Help"</span> or <span className="font-bold">"Stop"</span> to end the session immediately.
          </p>
          <div className="animate-pulse flex items-center gap-2 px-3 py-1 bg-white rounded-full w-fit border border-indigo-200">
            <div className="h-2 w-2 rounded-full bg-indigo-400"></div>
            <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Listening</span>
          </div>
        </div>

        <button 
          onClick={onCancel}
          className="w-full py-4 text-slate-500 font-bold hover:text-red-500 transition-colors"
        >
          Cancel Session
        </button>
      </div>
    </div>
  );
};

export default ExerciseSession;

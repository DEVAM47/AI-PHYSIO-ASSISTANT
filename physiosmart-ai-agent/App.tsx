
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ExerciseSession from './components/ExerciseSession';
import { ExerciseType, SessionData } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'home' | 'session' | 'dashboard'>('home');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>(ExerciseType.SQUAT);
  const [sessionHistory, setSessionHistory] = useState<SessionData[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('physio_history');
    if (saved) {
      setSessionHistory(JSON.parse(saved));
    }
  }, []);

  const handleSessionComplete = (data: SessionData) => {
    const newHistory = [data, ...sessionHistory];
    setSessionHistory(newHistory);
    localStorage.setItem('physio_history', JSON.stringify(newHistory));
    setActiveView('dashboard');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-lg flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h1 className="text-xl font-bold tracking-tight">PhysioSmart AI</h1>
        </div>
        <nav className="flex space-x-4">
          <button 
            onClick={() => setActiveView('home')} 
            className={`px-3 py-1 rounded-md transition-colors ${activeView === 'home' ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
          >
            Home
          </button>
          <button 
            onClick={() => setActiveView('dashboard')} 
            className={`px-3 py-1 rounded-md transition-colors ${activeView === 'dashboard' ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
          >
            Dashboard
          </button>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        {activeView === 'home' && (
          <div className="max-w-4xl mx-auto py-12 px-6">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-8">Start Your Therapy Session</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[ExerciseType.SQUAT, ExerciseType.BICEP_CURL, ExerciseType.SHOULDER_PRESS].map((type) => (
                <div key={type} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  <img 
                    src={`https://picsum.photos/seed/${type}/400/250`} 
                    alt={type} 
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{type}</h3>
                    <p className="text-slate-500 text-sm mb-4">Focus on joint stability and controlled motion.</p>
                    <button 
                      onClick={() => {
                        setSelectedExercise(type);
                        setActiveView('session');
                      }}
                      className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Begin Exercise
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'session' && (
          <ExerciseSession 
            exerciseType={selectedExercise} 
            onComplete={handleSessionComplete}
            onCancel={() => setActiveView('home')}
          />
        )}

        {activeView === 'dashboard' && (
          <Dashboard history={sessionHistory} />
        )}
      </main>

      {/* Footer / Status */}
      <footer className="bg-white border-t border-slate-200 px-4 py-2 text-xs text-slate-400 text-center shrink-0">
        &copy; 2024 PhysioSmart AI Agent • HIPPA Compliant Privacy Standards • AI Coaching Enabled
      </footer>
    </div>
  );
};

export default App;

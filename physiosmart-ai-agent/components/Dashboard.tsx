
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { SessionData } from '../types';

interface Props {
  history: SessionData[];
}

const Dashboard: React.FC<Props> = ({ history }) => {
  // Aggregate stats
  const totalReps = history.reduce((acc, s) => acc + s.reps, 0);
  const avgIntensity = history.length ? history.reduce((acc, s) => acc + s.avgScore, 0) / history.length : 0;
  const sessionsCount = history.length;

  // Formatting history for chart
  const chartData = history.slice().reverse().map((s, i) => ({
    name: `S${i+1}`,
    reps: s.reps,
    score: s.avgScore,
    date: new Date(s.date).toLocaleDateString()
  }));

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Recovery Progress</h2>
          <p className="text-slate-500">Track your range of motion and form consistency over time.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50">Download PDF Report</button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">Share with Doctor</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Reps</p>
          <p className="text-3xl font-black text-slate-900">{totalReps}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-xs font-bold uppercase mb-1">Avg Form Score</p>
          <p className="text-3xl font-black text-indigo-600">{Math.round(avgIntensity)}%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-xs font-bold uppercase mb-1">Sessions</p>
          <p className="text-3xl font-black text-slate-900">{sessionsCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-xs font-bold uppercase mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <p className="text-lg font-bold text-slate-900 uppercase tracking-tighter">Improving</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mobility Trend */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-800">Range of Motion (ROM) Trend</h3>
            <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Last 10 Sessions</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Repetition History */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-800">Volume Consistency</h3>
            <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Repetitions</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                />
                <Line type="stepAfter" dataKey="reps" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Session Logs (Doctor Review) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Clinical Session Logs</h3>
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-xs text-red-500 font-bold"><div className="w-2 h-2 rounded-full bg-red-500"></div> Issues Detected</span>
            <span className="flex items-center gap-1 text-xs text-green-500 font-bold"><div className="w-2 h-2 rounded-full bg-green-500"></div> Optimal Performance</span>
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-8 py-4">Date & Time</th>
              <th className="px-8 py-4">Exercise</th>
              <th className="px-8 py-4">Reps/Sets</th>
              <th className="px-8 py-4">Avg Score</th>
              <th className="px-8 py-4">Clinical Flags</th>
              <th className="px-8 py-4 text-right">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {history.map((session) => (
              <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-6 font-medium text-slate-700">{new Date(session.date).toLocaleString()}</td>
                <td className="px-8 py-6">
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-semibold text-xs">{session.exerciseType}</span>
                </td>
                <td className="px-8 py-6">{session.reps} Reps / {session.sets} Set</td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500" style={{ width: `${session.avgScore}%` }}></div>
                    </div>
                    <span className="font-bold">{Math.round(session.avgScore)}%</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  {session.flags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {session.flags.map((flag, idx) => (
                        <span key={idx} className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold border border-red-100">{flag}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">None</span>
                  )}
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="text-indigo-600 font-bold hover:underline">Details</button>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-12 text-center text-slate-400 italic">No session history available yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;

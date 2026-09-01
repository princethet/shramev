import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Phone, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Bell, 
  Navigation,
  ArrowRight,
  TrendingUp,
  Award,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { JobPost, WorkerProfile, LanguageCode } from '../types';
import { translations, taskCatalog } from '../data/translations';
import { speakText, calculateDistance } from '../utils/geo';

interface LabourDashboardProps {
  currentWorker: WorkerProfile;
  onChangeWorkerProfile: (updated: Partial<WorkerProfile>) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  incomingJobs: JobPost[];
  activeAcceptedJob: JobPost | null;
  onAcceptJob: (job: JobPost, forTeamCount: number) => void;
  onRejectJob: (jobId: string) => void;
  onUpdateJobStatus: (newStatus: JobPost['status']) => void;
  onOpenCallModal: (name: string, phone: string, role: string, teamSize: number) => void;
  language: LanguageCode;
  isHighContrast: boolean;
}

export const LabourDashboard: React.FC<LabourDashboardProps> = ({
  currentWorker,
  onChangeWorkerProfile,
  isOnline,
  onToggleOnline,
  incomingJobs,
  activeAcceptedJob,
  onAcceptJob,
  onRejectJob,
  onUpdateJobStatus,
  onOpenCallModal,
  language,
  isHighContrast
}) => {
  const t = translations[language];
  const [selectedTeamCount, setSelectedTeamCount] = useState<number>(currentWorker.teamSize);

  // Available job requests within radius
  const availableRequests = incomingJobs.filter(j => j.status === 'SEARCHING');

  const handleAccept = (job: JobPost) => {
    const countToAccept = currentWorker.role === 'GROUP_LEADER' ? selectedTeamCount : 1;
    onAcceptJob(job, countToAccept);
    speakText(`काम स्वीकार कर लिया गया है। किसान ${job.farmerName} को सूचना भेज दी गई है।`, 'hi-IN');
  };

  const handleCallFarmer = () => {
    if (!activeAcceptedJob) return;
    onOpenCallModal(activeAcceptedJob.farmerName, activeAcceptedJob.farmerPhone, 'FARMER', 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Profile & Availability Hero */}
      <div className={`rounded-2xl p-5 sm:p-6 border shadow-sm transition-colors ${
        isOnline 
          ? 'bg-[#111827] text-white border-emerald-800/60' 
          : 'bg-[#1F2937] text-gray-200 border-gray-700'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 border border-emerald-400/40 flex items-center justify-center text-3xl shadow-sm shrink-0">
                {currentWorker.role === 'GROUP_LEADER' ? '👥' : '👨‍🌾'}
              </div>
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#111827] ${
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{currentWorker.name}</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-emerald-500/40">
                  {currentWorker.badge || 'प्रमाणित'}
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium mt-0.5">
                📍 {currentWorker.location.villageName} • {currentWorker.location.district}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-300">
                <span className="text-amber-400 font-semibold">★ {currentWorker.rating} ({currentWorker.reviewCount} काम)</span>
                <span>•</span>
                <span>{currentWorker.role === 'GROUP_LEADER' ? `टोली: ${currentWorker.teamSize} मजदूर` : 'एकल श्रमिक'}</span>
              </div>
            </div>
          </div>

          {/* Big Online/Offline Switch */}
          <div className="flex flex-col sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800">
            <button
              onClick={onToggleOnline}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer ${
                isOnline
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-500/30'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white animate-ping' : 'bg-gray-500'}`} />
              <span>{isOnline ? t.online : t.offline}</span>
            </button>
            <span className="text-[11px] text-gray-400 text-center sm:text-right">
              {isOnline ? '🟢 2-4 किमी में किसानों की मांग लाइव आ रही है' : '⚪ नया काम पाने के लिए ऑनलाइन करें'}
            </span>
          </div>
        </div>

        {/* Role & Team Size Controls */}
        <div className="mt-5 pt-4 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">आपकी भूमिका:</span>
            <button
              onClick={() => onChangeWorkerProfile({ role: 'GROUP_LEADER', teamSize: Math.max(2, currentWorker.teamSize) })}
              className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer ${
                currentWorker.role === 'GROUP_LEADER'
                  ? 'bg-[#166534] text-white border-emerald-600 shadow-sm'
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
              }`}
            >
              👥 टोली प्रमुख (Leader)
            </button>
            <button
              onClick={() => onChangeWorkerProfile({ role: 'SOLO_WORKER', teamSize: 1 })}
              className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer ${
                currentWorker.role === 'SOLO_WORKER'
                  ? 'bg-[#166534] text-white border-emerald-600 shadow-sm'
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
              }`}
            >
              👨‍🌾 एकल श्रमिक (Solo)
            </button>
          </div>

          {currentWorker.role === 'GROUP_LEADER' && (
            <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
              <span className="text-gray-300 font-medium">आपकी टोली में मजदूर:</span>
              <div className="flex items-center gap-1">
                {[3, 5, 8, 10, 12].map(size => (
                  <button
                    key={size}
                    onClick={() => {
                      onChangeWorkerProfile({ teamSize: size });
                      setSelectedTeamCount(size);
                    }}
                    className={`px-2.5 py-0.5 rounded-md font-semibold text-xs cursor-pointer transition-colors ${
                      currentWorker.teamSize === size
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE ACCEPTED JOB SECTION (If already accepted a job) */}
      {activeAcceptedJob && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-300 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🚜</span>
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  स्वीकृत कार्य (Current Active Job)
                </span>
                <h3 className="text-lg font-bold text-gray-900">
                  {activeAcceptedJob.cropName} • {taskCatalog.find(c => c.type === activeAcceptedJob.taskType)?.labelHindi || activeAcceptedJob.taskType}
                </h3>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              activeAcceptedJob.status === 'ACCEPTED' ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse' :
              activeAcceptedJob.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-900 border-blue-300' :
              'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}>
              {activeAcceptedJob.status === 'ACCEPTED' ? 'खेत पर पहुंच रहे हैं' : activeAcceptedJob.status === 'IN_PROGRESS' ? 'खेत पर काम चालू' : 'काम पूरा'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs text-gray-700">
            <div>
              <span className="text-gray-500 block text-[11px] font-medium">किसान का नाम व पता:</span>
              <span className="font-bold text-gray-900 text-sm">{activeAcceptedJob.farmerName}</span>
              <span className="text-[11px] text-gray-600 block mt-0.5">📍 {activeAcceptedJob.location.villageName} ({activeAcceptedJob.location.landmark})</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px] font-medium">कुल तय मजदूरी:</span>
              <span className="text-base font-bold text-[#166534]">
                ₹{activeAcceptedJob.totalWageEstimate.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-gray-600 block mt-0.5">({activeAcceptedJob.workerCountNeeded} मजदूर • ₹{activeAcceptedJob.offeredWagePerWorker}/दिन)</span>
            </div>
          </div>

          {/* Action Buttons for Worker */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              onClick={handleCallFarmer}
              className="flex-1 bg-[#166534] hover:bg-[#15803D] text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>किसान को कॉल लगाएं ({activeAcceptedJob.farmerPhone})</span>
            </button>

            {activeAcceptedJob.status === 'ACCEPTED' && (
              <button
                onClick={() => {
                  onUpdateJobStatus('IN_PROGRESS');
                  speakText("आपने खेत पर काम शुरू कर दिया है।", 'hi-IN');
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <span>खेत पर काम शुरू करें (Start Work)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {activeAcceptedJob.status === 'IN_PROGRESS' && (
              <button
                onClick={() => {
                  onUpdateJobStatus('COMPLETED');
                  speakText("बधाई! काम पूरा घोषित हुआ। किसान से नकद या UPI द्वारा मजदूरी प्राप्त करें।", 'hi-IN');
                }}
                className="flex-1 bg-[#166534] hover:bg-[#15803D] text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>काम पूरा हुआ • मजदूरी प्राप्त करें</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* INCOMING JOB REQUESTS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-700 animate-bounce" />
            <h3 className="text-lg font-bold text-gray-900">
              आस-पास उपलब्ध मांगें (2–4 किमी दायरा)
            </h3>
          </div>
          <span className="bg-emerald-50 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-full border border-emerald-200">
            {availableRequests.length} नई मांगें
          </span>
        </div>

        {!isOnline ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center space-y-3 border border-dashed border-gray-300">
            <span className="text-4xl">😴</span>
            <h4 className="font-bold text-gray-800 text-base">आप अभी ऑफ़लाइन हैं</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              किसानों से 2 से 4 किलोमीटर के दायरे में सीधे काम की मांग पाने के लिए ऊपर दिए गए बटन से ऑनलाइन आएं।
            </p>
            <button
              onClick={onToggleOnline}
              className="bg-[#166534] hover:bg-[#15803D] text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm active:scale-95 cursor-pointer"
            >
              अभी ऑनलाइन करें (Go Online)
            </button>
          </div>
        ) : availableRequests.length === 0 ? (
          <div className="bg-emerald-50/40 rounded-2xl p-8 text-center space-y-3 border border-emerald-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mx-auto animate-pulse">
              📡
            </div>
            <h4 className="font-bold text-gray-900 text-base">
              2 से 4 किमी में नई मांग खोजी जा रही है...
            </h4>
            <p className="text-xs text-gray-600 max-w-sm mx-auto">
              जैसे ही आपके क्षेत्र का कोई किसान मजदूर मांगेगा, आपको तुरंत ऑडियो व पॉपअप के साथ सूचना मिलेगी।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {availableRequests.map(job => {
              const distance = calculateDistance(
                currentWorker.location.lat, 
                currentWorker.location.lng, 
                job.location.lat, 
                job.location.lng
              );

              const taskInfo = taskCatalog.find(c => c.type === job.taskType);
              const taskLabel = language === 'bho' ? taskInfo?.labelBhojpuri : taskInfo?.labelHindi;

              return (
                <div 
                  key={job.id}
                  className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4 hover:border-emerald-300 transition-colors"
                >
                  {/* Job Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl shrink-0">
                        {taskInfo?.icon || '🌾'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-gray-900">
                            {job.cropName} • {taskLabel}
                          </h4>
                          <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200 animate-pulse">
                            {job.urgency === 'IMMEDIATE' ? '⚡ तुरंत' : job.urgency === 'TODAY' ? 'आज ही' : 'कल'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium mt-0.5">
                          किसान: <strong>{job.farmerName}</strong> • 📍 {job.location.villageName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200 block">
                        {distance} किमी दूर
                      </span>
                    </div>
                  </div>

                  {/* Requirements & Payout Breakdown */}
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 text-center text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px] font-medium">मजदूर चाहिए:</span>
                      <span className="font-bold text-gray-900 text-sm">{job.workerCountNeeded} मजदूर</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] font-medium">दैनिक मजदूरी:</span>
                      <span className="font-bold text-emerald-800 text-sm">₹{job.offeredWagePerWorker}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] font-medium">कुल कमाई:</span>
                      <span className="font-bold text-[#166534] text-sm">₹{job.totalWageEstimate.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {job.specialInstructions && (
                    <p className="text-xs text-gray-600 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200 italic">
                      💬 किसान का निर्देश: "{job.specialInstructions}"
                    </p>
                  )}

                  {/* Acceptance Controls */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => handleAccept(job)}
                      className="flex-1 bg-[#166534] hover:bg-[#15803D] text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {currentWorker.role === 'GROUP_LEADER' 
                          ? `${currentWorker.teamSize} मजदूरों की टोली के लिए स्वीकार करें`
                          : 'काम स्वीकार करें (Accept Job)'}
                      </span>
                    </button>

                    <button
                      onClick={() => onRejectJob(job.id)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer border border-gray-200"
                      title="अस्वीकार करें"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Earnings & Work Stats Summary */}
      <div className="bg-[#111827] text-white rounded-2xl p-5 border border-gray-800 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>श्रमेव दैनिक कमाई व रिकॉर्ड (Summary)</span>
          </span>
          <span className="text-xs text-gray-400">आज का दिन</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
            <span className="text-[10px] text-gray-400 block font-medium">कुल कमाई (Earnings)</span>
            <span className="text-lg font-bold text-emerald-400">₹3,200</span>
          </div>
          <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
            <span className="text-[10px] text-gray-400 block font-medium">पूर्ण कार्य (Jobs)</span>
            <span className="text-lg font-bold text-white">{currentWorker.completedJobs} खेत</span>
          </div>
          <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
            <span className="text-[10px] text-gray-400 block font-medium">रेटिंग (Rating)</span>
            <span className="text-lg font-bold text-amber-400">★ {currentWorker.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  IndianRupee, 
  ShieldCheck, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  Share2,
  Star
} from 'lucide-react';
import { JobPost, LanguageCode, WorkerProfile } from '../types';
import { translations, taskCatalog } from '../data/translations';
import { speakText } from '../utils/geo';

interface BookingTrackerProps {
  job: JobPost;
  onUpdateStatus: (newStatus: JobPost['status']) => void;
  onOpenCallModal: (workerName: string, workerPhone: string, role: string, teamSize: number) => void;
  onCancelJob: () => void;
  language: LanguageCode;
  isHighContrast: boolean;
}

export const BookingTracker: React.FC<BookingTrackerProps> = ({
  job,
  onUpdateStatus,
  onOpenCallModal,
  onCancelJob,
  language,
  isHighContrast
}) => {
  const t = translations[language];
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [rating, setRating] = useState(5);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [paymentDone, setPaymentDone] = useState(false);

  // Timer when IN_PROGRESS
  useEffect(() => {
    let interval: any;
    if (job.status === 'IN_PROGRESS') {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [job.status]);

  // Steps definition
  const steps = [
    { key: 'SEARCHING', label: t.statusSearching, icon: '📡' },
    { key: 'ACCEPTED', label: t.statusAccepted, icon: '🤝' },
    { key: 'IN_PROGRESS', label: t.statusInProgress, icon: '🚜' },
    { key: 'COMPLETED', label: t.statusCompleted, icon: '✅' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === job.status);

  const formatTimer = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${mins}m ${s}s`;
  };

  const handleCall = () => {
    const workerName = job.acceptedWorker?.name || "रामू पटेल (टोली प्रमुख)";
    const workerPhone = job.acceptedWorker?.phone || "+91 98765 43210";
    const workerRole = job.acceptedWorker?.role || "GROUP_LEADER";
    const teamSize = job.acceptedWorker?.teamCountAccepted || job.workerCountNeeded;

    onOpenCallModal(workerName, workerPhone, workerRole, teamSize);
  };

  const handleSimulateAccept = () => {
    onUpdateStatus('ACCEPTED');
    speakText("बधाई हो! रामू पटेल टोली प्रमुख ने आपकी मांग स्वीकार कर ली है। वे 5 मजदूरों के साथ आ रहे हैं।", 'hi-IN');
  };

  const handleSimulateStartWork = () => {
    onUpdateStatus('IN_PROGRESS');
    speakText("मजदूर खेत पर पहुंच चुके हैं और काम शुरू हो गया है।", 'hi-IN');
  };

  const handleSimulateComplete = () => {
    onUpdateStatus('COMPLETED');
    speakText("खेत का काम सफलता पूर्वक पूरा हो गया है। कृपया मजदूरी का भुगतान करें।", 'hi-IN');
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 space-y-6 animate-fade-in">
      {/* Tracker Header & Step Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {job.status === 'SEARCHING' && '📡'}
              {job.status === 'ACCEPTED' && '🤝'}
              {job.status === 'IN_PROGRESS' && '🌾'}
              {job.status === 'COMPLETED' && '🎉'}
            </span>
            <div>
              <h3 className="font-bold text-lg text-gray-900 leading-tight">
                {job.cropName} • {taskCatalog.find(c => c.type === job.taskType)?.labelHindi || job.taskType}
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                मांग आईडी: #{job.id.slice(-6)} • {job.workerCountNeeded} मजदूर • ₹{job.offeredWagePerWorker}/दिन
              </p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            job.status === 'SEARCHING' ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse' :
            job.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
            job.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-900 border-blue-300' :
            'bg-gray-900 text-emerald-400 border-emerald-500'
          }`}>
            {job.status}
          </span>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {steps.map((step, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div key={step.key} className="space-y-1.5 text-center">
                <div className={`h-2 rounded-full transition-all ${
                  isCompleted ? 'bg-[#166534]' :
                  isCurrent ? 'bg-emerald-500 animate-pulse' :
                  'bg-gray-200'
                }`} />
                <div className={`text-[10px] sm:text-[11px] font-semibold truncate ${
                  isCurrent ? 'text-emerald-900 font-bold' :
                  isCompleted ? 'text-emerald-700' :
                  'text-gray-400'
                }`}>
                  {step.icon} {step.label.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STATE 1: SEARCHING RADAR */}
      {job.status === 'SEARCHING' && (
        <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-200 text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping"></div>
            <div className="w-16 h-16 bg-[#166534] text-white rounded-full flex items-center justify-center text-3xl shadow-sm border border-white font-bold">
              📡
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-gray-900">
              {t.searchingRadius}
            </h4>
            <p className="text-xs text-gray-600 max-w-sm mx-auto">
              आपके खेत से <strong>{job.radiusKm} किमी</strong> के दायरे में मौजूद 6+ टोलियों और कुशल श्रमिकों को तुरंत मांग भेजी जा रही है।
            </p>
          </div>

          {/* Quick Simulation controls for testing */}
          <div className="pt-3 border-t border-emerald-200/80 flex flex-wrap gap-2 justify-center">
            <button
              onClick={handleSimulateAccept}
              className="bg-[#166534] hover:bg-[#15803D] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>टोली द्वारा स्वीकृति सिम्युलेट करें (Simulate Worker Accept)</span>
            </button>

            <button
              onClick={onCancelJob}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer border border-gray-200"
            >
              {t.cancelJob}
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: ACCEPTED / ON THE WAY */}
      {(job.status === 'ACCEPTED' || job.status === 'IN_PROGRESS' || job.status === 'COMPLETED') && (
        <div className="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border border-gray-200 space-y-4">
          {/* Worker Info Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 border border-emerald-400/30 flex items-center justify-center text-2xl shadow-sm shrink-0 text-white">
                👥
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-base font-bold text-gray-900">
                    {job.acceptedWorker?.name || "रामू पटेल (टोली प्रमुख)"}
                  </h4>
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> सत्यापित
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-medium">
                  {job.acceptedWorker?.role === 'GROUP_LEADER' ? 'टोली प्रमुख (Group Leader)' : 'कुशल श्रमिक'} • 87 काम पूरे किए
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="text-amber-600 font-bold flex items-center">
                    ★ 4.9 (42 समीक्षाएं)
                  </span>
                  <span>•</span>
                  <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {job.acceptedWorker?.teamCountAccepted || job.workerCountNeeded} मजदूर आ रहे हैं
                  </span>
                </div>
              </div>
            </div>

            {/* Direct One-Tap Call Button */}
            <div className="flex sm:flex-col gap-2 shrink-0">
              <button
                onClick={handleCall}
                className="flex-1 sm:flex-none bg-[#166534] hover:bg-[#15803D] active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-transform cursor-pointer"
              >
                <Phone className="w-4 h-4 animate-bounce" />
                <span>{t.oneTapCall}</span>
              </button>

              <a
                href={`https://wa.me/919876543210?text=${encodeURIComponent(`नमस्ते ${job.acceptedWorker?.name || 'रामू जी'}, श्रमेव ऐप पर खेत का लोकेशन: ${job.location.villageName}`)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-white hover:bg-emerald-50 text-emerald-800 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-emerald-300 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp लोकेशन</span>
              </a>
            </div>
          </div>

          {/* Status-specific action box */}
          {job.status === 'ACCEPTED' && (
            <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  अनुमानित आगमन (Live ETA): ~8-12 मिनट
                </span>
                <p className="text-xs text-gray-600">
                  🛰️ टोली रास्ते में है। नक्शे पर नीली रूट रेखा व लाइव लोकेशन देखें।
                </p>
              </div>

              <button
                onClick={handleSimulateStartWork}
                className="bg-[#166534] hover:bg-[#15803D] text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <span>खेत पर काम शुरू करें (Start Work)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {job.status === 'IN_PROGRESS' && (
            <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                    कार्य जारी है (Live Work in Progress)
                  </span>
                  <span className="text-xs text-gray-600 block mt-0.5">
                    खेत: {job.location.villageName}
                  </span>
                </div>
                <div className="bg-blue-900 text-white font-mono text-sm font-bold px-3 py-1 rounded-lg shadow-sm">
                  ⏱️ {formatTimer(elapsedSeconds)}
                </div>
              </div>

              <button
                onClick={handleSimulateComplete}
                className="w-full bg-[#166534] hover:bg-[#15803D] text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>काम पूरा हुआ घोषित करें (Mark Complete & Pay)</span>
              </button>
            </div>
          )}

          {job.status === 'COMPLETED' && (
            <div className="bg-[#111827] text-white p-5 rounded-2xl border border-gray-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <h4 className="font-bold text-base text-emerald-400">
                      काम संपन्न हुआ! (Job Completed)
                    </h4>
                    <p className="text-xs text-gray-400">
                      मजदूरी हिसाब व रसीद
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-400 block font-medium">कुल भुगतान:</span>
                  <span className="text-xl font-bold text-emerald-400">
                    ₹{job.totalWageEstimate.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment selector */}
              <div className="bg-gray-900 p-3.5 rounded-xl border border-gray-800 space-y-2">
                <span className="text-xs font-semibold text-gray-300 block">
                  भुगतान का माध्यम चुनें (Payment Mode):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMode('CASH')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      paymentMode === 'CASH'
                        ? 'bg-emerald-700 text-white border-emerald-600 shadow-sm'
                        : 'bg-gray-950 text-gray-300 border-gray-800 hover:bg-gray-800'
                    }`}
                  >
                    💵 नकद भुगतान (Cash Handover)
                  </button>

                  <button
                    onClick={() => setPaymentMode('UPI')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      paymentMode === 'UPI'
                        ? 'bg-emerald-700 text-white border-emerald-600 shadow-sm'
                        : 'bg-gray-950 text-gray-300 border-gray-800 hover:bg-gray-800'
                    }`}
                  >
                    📱 UPI / QR स्कैनर
                  </button>
                </div>
              </div>

              {/* Worker Rating */}
              <div className="bg-gray-900 p-3.5 rounded-xl border border-gray-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">
                  टोली को रेटिंग दें:
                </span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-xl transition-transform active:scale-125 cursor-pointer ${
                        rating >= star ? 'text-amber-400' : 'text-gray-600'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Complete Action Button */}
              {!paymentDone ? (
                <button
                  onClick={() => {
                    setPaymentDone(true);
                    speakText("धन्यवाद! भुगतान दर्ज हो गया है। श्रमेव का उपयोग करने के लिए धन्यवाद।", 'hi-IN');
                  }}
                  className="w-full bg-[#166534] hover:bg-[#15803D] text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 cursor-pointer"
                >
                  <span>भुगतान पूरा हुआ (Confirm Payment)</span>
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              ) : (
                <div className="bg-emerald-950/80 text-emerald-300 p-3.5 rounded-xl border border-emerald-600 text-center text-xs font-semibold space-y-2">
                  <p>✅ मजदूरी भुगतान व रेटिंग दर्ज कर दी गई है।</p>
                  <button
                    onClick={onCancelJob}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                  >
                    नई मांग दर्ज करें (Post Another Job)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

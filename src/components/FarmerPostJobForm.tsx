import React, { useState } from 'react';
import { 
  Mic, 
  Users, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  Check, 
  Plus, 
  Minus,
  Radio
} from 'lucide-react';
import { TaskType, DurationUnit, GeoLocation, LanguageCode, JobPost } from '../types';
import { translations, taskCatalog } from '../data/translations';
import { speakText } from '../utils/geo';

interface FarmerPostJobFormProps {
  farmerLocation: GeoLocation;
  radiusKm: number;
  onChangeRadius: (radius: number) => void;
  onSubmitJob: (jobData: Partial<JobPost>) => void;
  onOpenVoiceModal: () => void;
  language: LanguageCode;
  isHighContrast: boolean;
  prefillData?: any;
}

export const FarmerPostJobForm: React.FC<FarmerPostJobFormProps> = ({
  farmerLocation,
  radiusKm,
  onChangeRadius,
  onSubmitJob,
  onOpenVoiceModal,
  language,
  isHighContrast,
  prefillData
}) => {
  const t = translations[language];

  const [taskType, setTaskType] = useState<TaskType>(prefillData?.taskType || 'harvesting');
  const [cropName, setCropName] = useState<string>(prefillData?.cropName || 'गेहूं (Wheat)');
  const [workerCountNeeded, setWorkerCountNeeded] = useState<number>(prefillData?.workerCountNeeded || 5);
  const [durationValue, setDurationValue] = useState<number>(prefillData?.durationValue || 1);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(prefillData?.durationUnit || 'DAYS');
  const [offeredWagePerWorker, setOfferedWagePerWorker] = useState<number>(prefillData?.offeredWagePerWorker || 500);
  const [urgency, setUrgency] = useState<'IMMEDIATE' | 'TODAY' | 'TOMORROW'>(prefillData?.urgency || 'TODAY');
  const [specialInstructions, setSpecialInstructions] = useState<string>(prefillData?.specialInstructions || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync when prefillData changes (e.g. from Voice AI)
  React.useEffect(() => {
    if (prefillData) {
      if (prefillData.taskType) setTaskType(prefillData.taskType);
      if (prefillData.cropName) setCropName(prefillData.cropName);
      if (prefillData.workerCountNeeded) setWorkerCountNeeded(prefillData.workerCountNeeded);
      if (prefillData.offeredWagePerWorker) setOfferedWagePerWorker(prefillData.offeredWagePerWorker);
      if (prefillData.durationValue) setDurationValue(prefillData.durationValue);
      if (prefillData.durationUnit) setDurationUnit(prefillData.durationUnit);
      if (prefillData.urgency) setUrgency(prefillData.urgency);
      if (prefillData.specialInstructions) setSpecialInstructions(prefillData.specialInstructions);
    }
  }, [prefillData]);

  // Total estimate calculation
  const totalWageEstimate = workerCountNeeded * offeredWagePerWorker * (durationUnit === 'DAYS' ? durationValue : (durationValue / 8));

  const popularCrops = [
    'गेहूं (Wheat)',
    'धान (Paddy)',
    'सरसों (Mustard)',
    'मक्का (Maize)',
    'गन्ना (Sugarcane)',
    'आलू (Potato)',
    'सब्जियां (Veg)'
  ];

  const handleWorkerStepper = (delta: number) => {
    setWorkerCountNeeded(prev => Math.max(1, Math.min(30, prev + delta)));
  };

  const handleWagePreset = (wage: number) => {
    setOfferedWagePerWorker(wage);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const jobData: Partial<JobPost> = {
      farmerName: "रामसहाय वर्मा (किसान)",
      farmerPhone: "+91 98111 22334",
      taskType,
      cropName,
      workerCountNeeded,
      durationUnit,
      durationValue,
      offeredWagePerWorker,
      totalWageEstimate,
      location: farmerLocation,
      radiusKm,
      urgency,
      specialInstructions: specialInstructions || undefined,
      status: 'SEARCHING',
      createdAt: Date.now()
    };

    // Voice announcement
    const selectedTask = taskCatalog.find(c => c.type === taskType);
    const taskName = language === 'bho' ? selectedTask?.labelBhojpuri : selectedTask?.labelHindi;
    speakText(`${workerCountNeeded} मजदूरों के लिए ${taskName || 'काम'} की मांग 2 से 4 किलोमीटर में प्रसारित कर दी गई है।`, 'hi-IN');

    onSubmitJob(jobData);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Voice Intake Banner */}
      <div className="bg-gradient-to-r from-[#166534] to-[#15803D] rounded-2xl p-4 text-white shadow-sm flex items-center justify-between gap-3 border border-emerald-600/30">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 text-emerald-100 flex items-center justify-center text-xl shrink-0 border border-white/20">
            🎙️
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight text-white">
              {t.voiceHelpText}
            </h3>
            <p className="text-xs text-emerald-100/90 font-medium">
              माइक दबाकर बोलें — AI तुरंत फॉर्म भर देगा
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenVoiceModal}
          className="bg-white text-[#166534] hover:bg-emerald-50 active:scale-95 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Mic className="w-4 h-4 text-red-500 animate-pulse" />
          <span>बोलें (Speak)</span>
        </button>
      </div>

      {/* Task Type Grid with Large Rural Visual Icons */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <span>🌾</span>
            <span>{t.taskType} (Select Agricultural Task):</span>
          </label>
          <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {taskCatalog.find(c => c.type === taskType)?.[language === 'bho' ? 'labelBhojpuri' : 'labelHindi']}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {taskCatalog.map(item => {
            const isSelected = taskType === item.type;
            const label = language === 'bho' 
              ? item.labelBhojpuri 
              : language === 'en' 
                ? item.labelEnglish 
                : item.labelHindi;

            return (
              <button
                type="button"
                key={item.type}
                onClick={() => {
                  setTaskType(item.type);
                  if (item.defaultWage) setOfferedWagePerWorker(item.defaultWage);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-sm ring-1 ring-emerald-600'
                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-2xl">{item.icon}</span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#166534] text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-1">
                    {label}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 font-medium">
                    मानक: ₹{item.defaultWage}/दिन
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Crop Name with Quick Tag Pills */}
      <div className="space-y-2 bg-gray-50/80 p-3.5 rounded-xl border border-gray-200">
        <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
          <span>🌱 {t.cropName}:</span>
          <span className="text-[11px] text-gray-500">फसल चुनें या लिखें</span>
        </label>
        
        <input
          type="text"
          value={cropName}
          onChange={(e) => setCropName(e.target.value)}
          placeholder="जैसे: गेहूं (Wheat), धान (Paddy), सरसों, मक्का"
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
          required
        />

        <div className="flex flex-wrap gap-1.5 pt-1">
          {popularCrops.map(crop => (
            <button
              type="button"
              key={crop}
              onClick={() => setCropName(crop)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                cropName === crop
                  ? 'bg-[#166534] text-white border-[#166534] font-bold'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {crop}
            </button>
          ))}
        </div>
      </div>

      {/* Workers Count Stepper & Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Worker Count Stepper */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
          <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-700" />
            <span>{t.workerCount}</span>
          </label>

          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => handleWorkerStepper(-1)}
              className="w-10 h-10 rounded-lg bg-white hover:bg-gray-100 text-gray-900 flex items-center justify-center font-bold text-lg shadow-sm border border-gray-300 active:scale-95 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="text-center">
              <span className="text-2xl font-bold text-emerald-900">
                {workerCountNeeded}
              </span>
              <span className="text-xs font-medium text-gray-500 block -mt-0.5">
                मजदूर / श्रमिक
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleWorkerStepper(1)}
              className="w-10 h-10 rounded-lg bg-white hover:bg-gray-100 text-gray-900 flex items-center justify-center font-bold text-lg shadow-sm border border-gray-300 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex gap-1.5 pt-1 justify-between">
            {[2, 4, 6, 8, 12, 16].map(num => (
              <button
                type="button"
                key={num}
                onClick={() => setWorkerCountNeeded(num)}
                className={`flex-1 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                  workerCountNeeded === num
                    ? 'bg-[#166534] text-white border-[#166534]'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {num} जन
              </button>
            ))}
          </div>
        </div>

        {/* Duration selector */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
          <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>{t.duration} (Duration):</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setDurationUnit('DAYS'); setDurationValue(1); }}
              className={`p-2 rounded-lg border text-center font-semibold text-xs cursor-pointer ${
                durationUnit === 'DAYS' && durationValue === 1
                  ? 'bg-[#166534] text-white border-[#166534]'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              1 पूरा दिन (Full Day)
            </button>

            <button
              type="button"
              onClick={() => { setDurationUnit('DAYS'); setDurationValue(2); }}
              className={`p-2 rounded-lg border text-center font-semibold text-xs cursor-pointer ${
                durationUnit === 'DAYS' && durationValue === 2
                  ? 'bg-[#166534] text-white border-[#166534]'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              2 दिन (2 Days)
            </button>

            <button
              type="button"
              onClick={() => { setDurationUnit('DAYS'); setDurationValue(3); }}
              className={`p-2 rounded-lg border text-center font-semibold text-xs cursor-pointer ${
                durationUnit === 'DAYS' && durationValue === 3
                  ? 'bg-[#166534] text-white border-[#166534]'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              3 दिन (3 Days)
            </button>

            <button
              type="button"
              onClick={() => { setDurationUnit('HOURS'); setDurationValue(4); }}
              className={`p-2 rounded-lg border text-center font-semibold text-xs cursor-pointer ${
                durationUnit === 'HOURS'
                  ? 'bg-[#166534] text-white border-[#166534]'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              आधा दिन (4 घंटे)
            </button>
          </div>
        </div>
      </div>

      {/* Offered Daily Wage & Total Cost Summary Card */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-emerald-700" />
            <span>{t.dailyWage}:</span>
          </label>
          <span className="text-base font-bold text-emerald-950">
            ₹{offeredWagePerWorker} / मजदूर
          </span>
        </div>

        {/* Wage slider */}
        <input
          type="range"
          min={350}
          max={900}
          step={25}
          value={offeredWagePerWorker}
          onChange={(e) => setOfferedWagePerWorker(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#166534]"
        />

        {/* Wage presets */}
        <div className="flex gap-2 justify-between">
          {[400, 450, 500, 550, 600, 700].map(wage => (
            <button
              type="button"
              key={wage}
              onClick={() => handleWagePreset(wage)}
              className={`flex-1 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                offeredWagePerWorker === wage
                  ? 'bg-[#166534] text-white border-[#166534] shadow-sm'
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-emerald-50'
              }`}
            >
              ₹{wage}
            </button>
          ))}
        </div>

        {/* Total Cost Highlight */}
        <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-600 block font-medium">{t.totalEstimate}:</span>
            <span className="text-[11px] text-gray-500 font-medium">
              ({workerCountNeeded} मजदूर × {durationValue} {durationUnit === 'DAYS' ? 'दिन' : 'घंटे'} × ₹{offeredWagePerWorker})
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#166534] bg-white px-3.5 py-1 rounded-xl border border-emerald-300 shadow-sm">
            ₹{totalWageEstimate.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Urgency & Matching Radius (2 - 4 km) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Urgency */}
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2">
          <label className="text-xs font-bold text-gray-800 block">
            कब चाहिए? (Urgency):
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'IMMEDIATE', label: t.immediate, icon: '⚡' },
              { id: 'TODAY', label: t.today, icon: '📅' },
              { id: 'TOMORROW', label: t.tomorrow, icon: '🌅' }
            ].map(item => (
              <button
                type="button"
                key={item.id}
                onClick={() => setUrgency(item.id as any)}
                className={`py-2 px-1 rounded-lg text-xs font-semibold text-center border transition-colors cursor-pointer ${
                  urgency === item.id
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div>{item.icon}</div>
                <div className="text-[11px] mt-0.5">{item.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Radius Filter (2 km to 4 km) */}
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
              <span>खोज दायरा (Radius):</span>
            </label>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
              {radiusKm.toFixed(1)} किमी
            </span>
          </div>

          <input
            type="range"
            min={2.0}
            max={4.0}
            step={0.5}
            value={radiusKm}
            onChange={(e) => onChangeRadius(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#166534]"
          />

          <div className="flex justify-between text-[11px] text-gray-500 font-medium">
            <span>2.0 किमी (निकटतम)</span>
            <span>3.0 किमी</span>
            <span>4.0 किमी (अधिकतम)</span>
          </div>
        </div>
      </div>

      {/* Field Location Summary */}
      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs text-gray-700">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
          <div>
            <span className="font-bold text-gray-900">{farmerLocation.villageName}</span>
            <span className="text-[11px] text-gray-500 block">{farmerLocation.landmark}</span>
          </div>
        </div>
        <span className="bg-white text-gray-800 px-2.5 py-1 rounded-md border border-gray-300 text-[10px] font-semibold">
          GPS Pin ✓
        </span>
      </div>

      {/* Big Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#166534] hover:bg-[#15803D] text-white font-bold py-3.5 px-6 rounded-xl text-base flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-98 cursor-pointer disabled:opacity-50"
      >
        <span className="text-xl">📢</span>
        <span>{t.findLabourers}</span>
        <ChevronRight className="w-5 h-5" />
      </button>
    </form>
  );
};

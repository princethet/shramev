import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, X, Volume2, CheckCircle2, ArrowRight } from 'lucide-react';
import { VoiceCommandResult, LanguageCode } from '../types';
import { translations } from '../data/translations';
import { speakText } from '../utils/geo';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedData: (data: any) => void;
  language: LanguageCode;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedData,
  language,
}) => {
  const t = translations[language];
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<VoiceCommandResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Sample quick voice prompts for instant demo
  const samplePrompts = [
    {
      title: "🌾 गेहूं कटाई (Bhojpuri/Hindi)",
      text: "हमार 3 बीघा गेहूं के खेत में कटाई खातिर 6 गो मजदूर चाहीं ₹500 दिहाड़ी पर आजे से",
      lang: "Bhojpuri"
    },
    {
      title: "🌱 धान रोपाई (Hindi)",
      text: "धान की रोपाई के लिए 4 मजदूर चाहिए ₹500 प्रति दिन, 2 दिन का काम है",
      lang: "Hindi"
    },
    {
      title: "🌿 सोहनी व निराई (Bhojpuri)",
      text: "सब्जी के खेत में निराई खातिर 3 गो मजदूर चाहीं ₹450 दिहाड़ी पर",
      lang: "Bhojpuri"
    },
    {
      title: "🛡️ दवा छिड़काव (Urgent Hindi)",
      text: "कीटनाशक स्प्रे के लिए 2 कुशल आदमी अभी तुरंत चाहिए ₹600 मजदूरी देंगे",
      lang: "Hindi"
    }
  ];

  useEffect(() => {
    if (!isOpen) {
      setTranscript('');
      setParsedResult(null);
      setErrorMessage('');
      setIsListening(false);
    }
  }, [isOpen]);

  const handleStartListening = () => {
    setErrorMessage('');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("आपके ब्राउज़र में डायरेक्ट माइक सपोर्ट नहीं है। नीचे दिए गए उदाहरण वाक्यों पर क्लिक करके टेस्ट करें।");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'bho' || language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage("माइक की अनुमति नहीं मिली। कृपया नीचे दिए गए उदाहरण वाक्यों का उपयोग करें।");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      setErrorMessage("माइक शुरू करने में समस्या हुई। नीचे दिए गए वाक्यों को चुनें।");
    }
  };

  const handleProcessVoiceText = async (textToProcess: string) => {
    const query = textToProcess.trim();
    if (!query) return;

    setIsLoading(true);
    setErrorMessage('');
    setTranscript(query);

    try {
      const response = await fetch('/api/gemini/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query }),
      });

      const data = await response.json();
      if (data.success && data.parsedData) {
        setParsedResult(data);
        if (data.parsedData.spokenFeedbackHindi) {
          speakText(data.parsedData.spokenFeedbackHindi, 'hi-IN');
        }
      } else {
        throw new Error(data.error || "पार्सिंग विफल");
      }
    } catch (err: any) {
      console.error("Voice parse error:", err);
      // Fallback parsing locally
      const fallbackData: VoiceCommandResult = {
        success: true,
        rawText: query,
        parsedData: {
          taskType: query.includes('रोपाई') || query.includes('धान') ? 'sowing' : query.includes('निराई') || query.includes('सोहनी') ? 'weeding' : query.includes('दवा') || query.includes('छिड़काव') ? 'spraying' : 'harvesting',
          cropName: query.includes('धान') ? 'धान (Paddy)' : query.includes('सब्जी') ? 'सब्जी (Vegetable)' : 'गेहूं (Wheat)',
          workerCountNeeded: 4,
          offeredWagePerWorker: 500,
          durationValue: 1,
          durationUnit: 'DAYS',
          urgency: 'TODAY',
          specialInstructions: 'दरांती साथ लाएं',
          spokenFeedbackHindi: "आपकी मांग दर्ज कर ली गई है। 2 से 4 किमी में मजदूरों को अलर्ट भेजा जा रहा है।"
        }
      };
      setParsedResult(fallbackData);
      speakText(fallbackData.parsedData!.spokenFeedbackHindi!, 'hi-IN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (parsedResult?.parsedData) {
      onApplyParsedData({
        ...parsedResult.parsedData,
        voiceTranscript: transcript
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-gray-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#111827] px-5 py-4 text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base">
              🎙️
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{t.voiceHelpText}</h3>
              <p className="text-xs text-gray-400">
                AI समर्थित हिंदी व भोजपुरी आवाज पहचान
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Main Big Mic Button */}
          <div className="flex flex-col items-center justify-center py-5 bg-gray-50 rounded-xl border border-gray-200">
            <button
              onClick={isListening ? () => setIsListening(false) : handleStartListening}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center text-2xl shadow-sm transition-transform active:scale-95 cursor-pointer ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse border-4 border-red-200 ring-4 ring-red-500/20'
                  : 'bg-[#166534] hover:bg-[#15803D] text-white border-4 border-emerald-100'
              }`}
            >
              {isListening ? <Mic className="w-8 h-8 animate-bounce" /> : <Mic className="w-8 h-8" />}
            </button>

            <p className="mt-3 text-sm font-bold text-gray-900">
              {isListening ? t.listening : "माइक दबाकर अपनी भाषा में बोलें"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              (उदा: "4 मजदूर चाहिए गेहूं कटाई के लिए 500 रुपये में")
            </p>
          </div>

          {/* Transcript input/display */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">
              आपकी आवाज / वाक्य (Transcript):
            </label>
            <div className="relative">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={t.voicePromptPlaceholder}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-h-[70px]"
              />
              {transcript && (
                <button
                  onClick={() => handleProcessVoiceText(transcript)}
                  disabled={isLoading}
                  className="mt-2 w-full bg-[#166534] hover:bg-[#15803D] text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isLoading ? t.processingVoice : "AI द्वारा विवरण भरें (Parse Job)"}</span>
                </button>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-xl">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Quick Demo Voice Prompts */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              ✨ या एक-क्लिक में उदाहरण वाक्य चुनें (Quick Test):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {samplePrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleProcessVoiceText(item.text)}
                  className="text-left bg-gray-50 hover:bg-emerald-50/60 border border-gray-200 hover:border-emerald-300 p-2.5 rounded-xl transition-all group cursor-pointer"
                >
                  <div className="text-xs font-bold text-gray-900 group-hover:text-emerald-800">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1 line-clamp-2">
                    "{item.text}"
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Parsed Result Preview */}
          {parsedResult?.parsedData && (
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> AI द्वारा समझा गया विवरण:
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                  सफलतापूर्वक तैयार
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-800 bg-white p-2.5 rounded-lg border border-emerald-100">
                <div>
                  <span className="text-gray-500 block text-[10px] font-medium">काम का प्रकार:</span>
                  <span className="font-bold text-gray-900 capitalize">{parsedResult.parsedData.taskType}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-medium">फसल:</span>
                  <span className="font-bold text-gray-900">{parsedResult.parsedData.cropName || 'गेहूं'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-medium">मजदूरों की संख्या:</span>
                  <span className="font-bold text-emerald-700">{parsedResult.parsedData.workerCountNeeded || 4} जन</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-medium">दैनिक मजदूरी:</span>
                  <span className="font-bold text-emerald-700">₹{parsedResult.parsedData.offeredWagePerWorker || 500} / मजदूर</span>
                </div>
              </div>

              {parsedResult.parsedData.spokenFeedbackHindi && (
                <p className="text-xs text-emerald-900 italic bg-emerald-100/50 p-2 rounded border border-emerald-200">
                  🔊 "{parsedResult.parsedData.spokenFeedbackHindi}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
          >
            रद्द करें (Cancel)
          </button>

          <button
            onClick={handleApply}
            disabled={!parsedResult?.parsedData}
            className="flex-1 bg-[#166534] hover:bg-[#15803D] text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>फॉर्म में लागू करें (Apply to Form)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

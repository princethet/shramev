import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, Volume2, User, ShieldCheck } from 'lucide-react';
import { speakText } from '../utils/geo';

interface InAppCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerName: string;
  workerPhone: string;
  workerRole: string;
  teamSize?: number;
  farmerName?: string;
}

export const InAppCallModal: React.FC<InAppCallModalProps> = ({
  isOpen,
  onClose,
  workerName,
  workerPhone,
  workerRole,
  teamSize = 1,
  farmerName = "मालिक"
}) => {
  const [callStatus, setCallStatus] = useState<'RINGING' | 'CONNECTED' | 'ENDED'>('RINGING');
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  useEffect(() => {
    let timer: any;
    if (isOpen) {
      setCallStatus('RINGING');
      setSeconds(0);

      // Speak ringtone / greeting simulation
      const ringTimeout = setTimeout(() => {
        setCallStatus('CONNECTED');
        const dialogue = workerRole === 'GROUP_LEADER'
          ? `प्रणाम मालिक! हम ${workerName} बोल रहे हैं। हम अपनी ${teamSize} मजदूरों की टोली के साथ बस 15 मिनट में आपके खेत पर पहुंच रहे हैं।`
          : `प्रणाम मालिक! हम ${workerName} बोल रहे हैं। हम समय पर आपके खेत पर काम के लिए पहुंच रहे हैं।`;
        speakText(dialogue, 'hi-IN');
      }, 2500);

      return () => {
        clearTimeout(ringTimeout);
        if (timer) clearInterval(timer);
      };
    }
  }, [isOpen, workerName, workerRole, teamSize]);

  useEffect(() => {
    let timer: any;
    if (callStatus === 'CONNECTED') {
      timer = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  if (!isOpen) return null;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallStatus('ENDED');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-gray-900 flex flex-col items-center p-6 space-y-6">
        {/* Call Header */}
        <div className="text-center space-y-1 w-full">
          <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-3 py-0.5 rounded-full text-xs font-semibold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>श्रमेव सुरक्षित डायरेक्ट कॉल</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mt-2">{workerName}</h3>
          <p className="text-xs text-gray-600 font-medium">
            {workerRole === 'GROUP_LEADER' ? `टोली प्रमुख (${teamSize} मजदूर)` : 'कुशल श्रमिक'} • {workerPhone}
          </p>
          <div className="text-xs font-mono text-gray-500 pt-1">
            {callStatus === 'RINGING' && <span className="animate-pulse text-amber-600 font-semibold">घंटी जा रही है (Ringing)...</span>}
            {callStatus === 'CONNECTED' && <span className="text-emerald-700 font-bold">जुड़ा हुआ है • {formatTime(seconds)}</span>}
            {callStatus === 'ENDED' && <span className="text-red-600 font-semibold">कॉल समाप्त (Call Ended)</span>}
          </div>
        </div>

        {/* Worker Avatar with Animated Rings */}
        <div className="relative flex items-center justify-center">
          {callStatus === 'RINGING' && (
            <div className="absolute -inset-4 bg-emerald-500/20 rounded-full animate-ping"></div>
          )}
          {callStatus === 'CONNECTED' && (
            <div className="absolute -inset-4 bg-emerald-500/20 rounded-full animate-pulse"></div>
          )}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-600 to-green-700 border-4 border-white shadow-md flex items-center justify-center text-3xl overflow-hidden">
            👥
          </div>
        </div>

        {/* In-Call Audio / Speech Bubble */}
        {callStatus === 'CONNECTED' && (
          <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl text-center space-y-1 max-w-xs">
            <span className="text-[11px] text-emerald-800 font-bold block">🔊 श्रमिक का संदेश:</span>
            <p className="text-xs text-gray-700">
              "प्रणाम मालिक! हम बस 15 मिनट में {teamSize > 1 ? `${teamSize} मजदूरों के साथ` : ''} आपके खेत पर पहुंच रहे हैं।"
            </p>
          </div>
        )}

        {/* Call Controls */}
        <div className="grid grid-cols-3 gap-3 w-full pt-1">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-xl flex flex-col items-center gap-1 transition-colors cursor-pointer border ${
              isMuted 
                ? 'bg-amber-500 text-white border-amber-600 font-semibold' 
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span className="text-[10px]">{isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          <button
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`p-3.5 rounded-xl flex flex-col items-center gap-1 transition-colors cursor-pointer border ${
              isSpeaker 
                ? 'bg-[#166534] text-white border-emerald-700 font-semibold' 
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Volume2 className="w-5 h-5" />
            <span className="text-[10px]">Speaker</span>
          </button>

          <a
            href={`tel:${workerPhone.replace(/\s+/g, '')}`}
            className="p-3.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white flex flex-col items-center gap-1 transition-colors text-center border border-gray-900"
            title="फ़ोन डायलर में खोलें"
          >
            <Phone className="w-5 h-5" />
            <span className="text-[10px]">SIM Call</span>
          </a>
        </div>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="w-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform cursor-pointer"
        >
          <PhoneOff className="w-4 h-4" />
          <span>कॉल काटें (End Call)</span>
        </button>
      </div>
    </div>
  );
};

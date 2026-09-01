import React from 'react';
import { User } from 'firebase/auth';
import { UserRole, LanguageCode } from '../types';
import { translations } from '../data/translations';
import { speakText } from '../utils/geo';
import { Volume2, Sun, Users, Tractor, Globe, LogIn, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  isLabourOnline: boolean;
  onToggleLabourOnline: () => void;
  user: User | null;
  userProfile?: {
    name?: string;
    role?: UserRole;
    villageName?: string;
  } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onChangeRole,
  language,
  onChangeLanguage,
  isHighContrast,
  onToggleHighContrast,
  isLabourOnline,
  onToggleLabourOnline,
  user,
  userProfile,
  onOpenAuth,
  onLogout,
}) => {
  const t = translations[language];

  const handleAudioGuide = () => {
    const text = currentRole === 'FARMER'
      ? `${t.appName} किसान सेवा में आपका स्वागत है। यहां आप 2 से 4 किलोमीटर के दायरे में उपलब्ध मजदूर और टोली खोज सकते हैं। माइक दबाकर अपनी भाषा में बोलें।`
      : `${t.appName} श्रमिक सेवा। अपना स्टेटस ऑनलाइन रखें ताकि आसपास के किसानों की मांग आपको तुरंत मिल सके।`;
    speakText(text, language === 'en' ? 'en-US' : 'hi-IN');
  };

  const displayName = userProfile?.name || user?.displayName || (user?.phoneNumber ? `+91 ${user.phoneNumber.slice(-10)}` : user?.email?.split('@')[0]) || 'अतिथि (Guest)';

  return (
    <header className={`sticky top-0 z-40 w-full transition-colors border-b shadow-sm ${
      isHighContrast
        ? 'bg-gray-950 text-white border-emerald-500'
        : 'bg-[#111827] text-gray-100 border-gray-800'
    }`}>
      {/* Top Notification Bar */}
      <div className="bg-[#166534] text-emerald-50 px-4 py-1.5 text-xs font-semibold flex items-center justify-between border-b border-emerald-700/50">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="bg-emerald-950/80 text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase border border-emerald-600/40">
            2–4 KM RADAR
          </span>
          <span className="truncate text-emerald-100/90">{t.tagline}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAudioGuide}
            className="flex items-center gap-1.5 bg-emerald-900/60 hover:bg-emerald-900/90 text-emerald-100 border border-emerald-600/40 px-2.5 py-0.5 rounded-md cursor-pointer transition-colors active:scale-95 text-[11px] font-medium"
            title="आवाज में निर्देश सुनें"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">{t.soundGuide}</span>
          </button>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center text-white shadow-md border border-emerald-400/30 shrink-0">
            <span className="text-2xl select-none">🌾</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {t.appName}
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-gray-400 -mt-0.5 hidden sm:block">
              कृषि श्रमिक व टोली तुरंत बुकिंग
            </p>
          </div>
        </div>

        {/* Action Controls & Auth Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Picker */}
          <div className="flex items-center bg-gray-900/90 rounded-lg p-1 border border-gray-800">
            <Globe className="w-3.5 h-3.5 text-gray-400 ml-1.5 mr-1 hidden sm:inline" />
            <button
              onClick={() => onChangeLanguage('hi')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                language === 'hi'
                  ? 'bg-emerald-700 text-white shadow-sm font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => onChangeLanguage('bho')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                language === 'bho'
                  ? 'bg-emerald-700 text-white shadow-sm font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              भोजपुरी
            </button>
            <button
              onClick={() => onChangeLanguage('en')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-emerald-700 text-white shadow-sm font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* High Contrast / Sun Mode Toggle */}
          <button
            onClick={onToggleHighContrast}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isHighContrast
                ? 'bg-emerald-500 text-gray-950 border-emerald-400'
                : 'bg-gray-900 text-gray-300 border-gray-800 hover:bg-gray-800 hover:text-white'
            }`}
            title={t.highContrastMode}
          >
            <Sun className="w-4 h-4" />
            <span className="hidden md:inline">{t.highContrastMode}</span>
          </button>

          {/* User Auth Profile / Login Button */}
          {user ? (
            <div className="flex items-center gap-2 bg-gray-900/95 border border-gray-800 p-1.5 pl-2.5 rounded-xl shadow-xs">
              {/* User Avatar */}
              <div className="relative">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-emerald-500/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-gray-950"></span>
              </div>

              {/* User Info */}
              <div className="hidden lg:flex flex-col text-left pr-1">
                <span className="text-xs font-bold text-gray-200 truncate max-w-[110px]">
                  {displayName}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">
                  {currentRole === 'FARMER' ? '🚜 किसान' : '👥 श्रमिक'}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                title="लॉगआउट करें (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 bg-[#166534] hover:bg-[#15803D] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer border border-emerald-600"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>साइन इन (Login)</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Navigation Bar */}
      <div className="bg-gray-950/80 border-t border-gray-800/80 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Role Switcher Tabs */}
          <div className="flex items-center bg-gray-900 p-1 rounded-xl border border-gray-800 shadow-inner">
            <button
              onClick={() => onChangeRole('FARMER')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                currentRole === 'FARMER'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Tractor className="w-4 h-4" />
              <span>{t.farmer}</span>
            </button>

            <button
              onClick={() => onChangeRole('LABOUR')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                currentRole === 'LABOUR'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t.labour}</span>
            </button>
          </div>

          {/* Role Status or Quick Indicator */}
          {currentRole === 'LABOUR' ? (
            <button
              onClick={onToggleLabourOnline}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isLabourOnline
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50 shadow-sm'
                  : 'bg-gray-900 text-gray-400 border-gray-800'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isLabourOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
              <span>{isLabourOnline ? t.online : t.offline}</span>
            </button>
          ) : (
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span className="hidden sm:inline">📍</span>
              <span className="text-emerald-400 font-medium">
                खेत: {userProfile?.villageName || 'रामपुर बहेरी'} (2–4 km खोज)
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

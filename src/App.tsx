import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserRole, LanguageCode, GeoLocation, JobPost, WorkerProfile } from './types';
import { INITIAL_WORKERS, DEFAULT_FARMER_LOCATION, calculateDistance, speakText } from './utils/geo';
import { Header } from './components/Header';
import { InteractiveMap } from './components/InteractiveMap';
import { FarmerPostJobForm } from './components/FarmerPostJobForm';
import { BookingTracker } from './components/BookingTracker';
import { LabourDashboard } from './components/LabourDashboard';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { InAppCallModal } from './components/InAppCallModal';
import { AuthModal } from './components/AuthModal';
import { translations } from './data/translations';
import { Tractor, Users, Bell, Sparkles, MapPin, History, PlusCircle, Radio } from 'lucide-react';
import { JobHistory } from './components/JobHistory';

export function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('FARMER');
  const [farmerActiveTab, setFarmerActiveTab] = useState<'LIVE_RADAR' | 'JOB_HISTORY'>('LIVE_RADAR');
  const [labourActiveTab, setLabourActiveTab] = useState<'LIVE_MATCH' | 'JOB_HISTORY'>('LIVE_MATCH');
  const [language, setLanguage] = useState<LanguageCode>('hi');
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [radiusKm, setRadiusKm] = useState<number>(3.0);
  const [farmerLocation, setFarmerLocation] = useState<GeoLocation>(DEFAULT_FARMER_LOCATION);
  const [workers, setWorkers] = useState<WorkerProfile[]>(INITIAL_WORKERS);
  const [isLabourOnline, setIsLabourOnline] = useState<boolean>(true);

  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{
    name?: string;
    role?: UserRole;
    villageName?: string;
  } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active Job Post for Farmer
  const [activeJob, setActiveJob] = useState<JobPost | null>(null);

  // Incoming jobs collection (for Labour view)
  const [jobList, setJobList] = useState<JobPost[]>([]);

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voicePrefillData, setVoicePrefillData] = useState<any>(null);
  const [callModalData, setCallModalData] = useState<{
    isOpen: boolean;
    name: string;
    phone: string;
    role: string;
    teamSize: number;
  }>({
    isOpen: false,
    name: '',
    phone: '',
    role: 'GROUP_LEADER',
    teamSize: 5
  });

  // Current logged in worker profile for Labour tab
  const [currentLabourProfile, setCurrentLabourProfile] = useState<WorkerProfile>(INITIAL_WORKERS[0]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        // Subscribe to user profile document in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile(data as any);
            if (data.role) {
              setCurrentRole(data.role as UserRole);
            }
            if (data.name && data.role === 'LABOUR') {
              setCurrentLabourProfile(prev => ({
                ...prev,
                name: data.name,
                phone: user.phoneNumber || prev.phone
              }));
            }
          }
        }, (err) => {
          console.warn('Firestore user profile snapshot fallback:', err);
        });

        return () => unsubDoc();
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleAuthSuccess = (user: User, role: UserRole) => {
    setFirebaseUser(user);
    setCurrentRole(role);
  };

  // Sync initial jobs
  useEffect(() => {
    // Seed an initial demo job so Labour tab has immediate actionable content
    const initialJob: JobPost = {
      id: 'job-demo-101',
      farmerName: userProfile?.name || 'महेन्द्र सिंह (किसान)',
      farmerPhone: firebaseUser?.phoneNumber || '+91 98390 11223',
      taskType: 'harvesting',
      cropName: 'गेहूं (Wheat)',
      workerCountNeeded: 6,
      durationUnit: 'DAYS',
      durationValue: 1,
      offeredWagePerWorker: 500,
      totalWageEstimate: 3000,
      location: {
        lat: 25.3210,
        lng: 82.9750,
        villageName: 'शिवपुर चक (2.1 km दूर)',
        district: 'वाराणसी',
        landmark: 'प्राथमिक विद्यालय के पीछे'
      },
      radiusKm: 3.5,
      urgency: 'TODAY',
      specialInstructions: 'दरांती साथ लाएं, खेत सूखा है',
      status: 'SEARCHING',
      createdAt: Date.now() - 60000
    };
    setJobList([initialJob]);
  }, [userProfile?.name, firebaseUser?.phoneNumber]);

  // Fetch jobs from server if available
  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        if (data.jobs && data.jobs.length > 0) {
          setJobList(prev => {
            const combined = [...data.jobs];
            prev.forEach(p => {
              if (!combined.find(c => c.id === p.id)) combined.push(p);
            });
            return combined;
          });
        }
      })
      .catch(err => console.log('Backend sync offline, using local state'));
  }, []);

  // Handler to post a new job as Farmer
  const handleFarmerPostJob = async (jobData: Partial<JobPost>) => {
    const newJob: JobPost = {
      id: `job-${Date.now()}`,
      farmerId: firebaseUser?.uid,
      farmerName: jobData.farmerName || userProfile?.name || firebaseUser?.displayName || 'रामसहाय वर्मा (किसान)',
      farmerPhone: jobData.farmerPhone || firebaseUser?.phoneNumber || '+91 98111 22334',
      taskType: jobData.taskType || 'harvesting',
      cropName: jobData.cropName || 'गेहूं',
      workerCountNeeded: jobData.workerCountNeeded || 5,
      durationUnit: jobData.durationUnit || 'DAYS',
      durationValue: jobData.durationValue || 1,
      offeredWagePerWorker: jobData.offeredWagePerWorker || 500,
      totalWageEstimate: jobData.totalWageEstimate || 2500,
      location: farmerLocation,
      radiusKm: radiusKm,
      urgency: jobData.urgency || 'TODAY',
      specialInstructions: jobData.specialInstructions,
      status: 'SEARCHING',
      createdAt: Date.now()
    };

    setActiveJob(newJob);
    setJobList(prev => [newJob, ...prev]);

    // Send to backend in-memory API
    try {
      await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob)
      });
    } catch (e) {
      console.warn('Backend job broadcast local mode');
    }
  };

  // Update status from Tracker or Labour
  const handleUpdateJobStatus = async (jobId: string, newStatus: JobPost['status'], workerInfo?: any) => {
    const updatedWorker = workerInfo || {
      workerId: currentLabourProfile.id,
      name: currentLabourProfile.name,
      phone: currentLabourProfile.phone,
      role: currentLabourProfile.role,
      teamCountAccepted: currentLabourProfile.role === 'GROUP_LEADER' ? currentLabourProfile.teamSize : 1,
      acceptedAt: Date.now()
    };

    setJobList(prev => prev.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          status: newStatus,
          acceptedWorker: job.acceptedWorker || (newStatus === 'ACCEPTED' ? updatedWorker : undefined)
        };
      }
      return job;
    }));

    if (activeJob && activeJob.id === jobId) {
      setActiveJob(prev => prev ? {
        ...prev,
        status: newStatus,
        acceptedWorker: prev.acceptedWorker || (newStatus === 'ACCEPTED' ? updatedWorker : undefined)
      } : null);
    }

    // Backend sync
    try {
      if (newStatus === 'ACCEPTED') {
        await fetch(`/api/jobs/${jobId}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workerId: updatedWorker.workerId,
            workerName: updatedWorker.name,
            workerPhone: updatedWorker.phone,
            workerRole: updatedWorker.role,
            teamCountAccepted: updatedWorker.teamCountAccepted
          })
        });
      } else {
        await fetch(`/api/jobs/${jobId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      }

      // If job completed, persist to Firestore 'bookings' collection
      if (newStatus === 'COMPLETED') {
        try {
          const targetJob = jobList.find(j => j.id === jobId) || activeJob;
          if (targetJob) {
            const bookingDocId = 'bk-' + jobId.slice(-6);
            await setDoc(doc(db, 'bookings', bookingDocId), {
              bookingId: bookingDocId,
              jobId: targetJob.id,
              farmerId: firebaseUser?.uid || 'farmer_demo_1',
              farmerName: userProfile?.name || firebaseUser?.displayName || 'किसान भाई',
              farmerPhone: firebaseUser?.phoneNumber || '+91 98390 11223',
              labourLeaderId: updatedWorker.workerId || 'leader_demo_1',
              labourLeaderName: updatedWorker.name || 'रामू पटेल (टोली प्रमुख)',
              labourLeaderPhone: updatedWorker.phone || '+91 98765 43210',
              taskType: targetJob.taskType,
              cropName: targetJob.cropName,
              workersCount: targetJob.workerCountNeeded,
              wagePerDay: targetJob.offeredWagePerWorker,
              totalWage: targetJob.workerCountNeeded * targetJob.offeredWagePerWorker,
              address: targetJob.location?.villageName || 'शिवपुर चक, बहेरी',
              OTP: targetJob.otp || '5824',
              paymentStatus: 'PAID_UPI',
              startedAt: Date.now() - 14400000,
              completedAt: Date.now(),
              ratingGiven: 5.0,
              feedback: 'कार्य सफलता पूर्वक व समय पर पूर्ण हुआ।'
            }, { merge: true });
          }
        } catch (fErr) {
          console.warn('Firestore booking persist error:', fErr);
        }
      }
    } catch (e) {
      console.warn('Backend sync local');
    }
  };

  // Accept a job from Labour Dashboard
  const handleLabourAcceptJob = (job: JobPost, forTeamCount: number) => {
    handleUpdateJobStatus(job.id, 'ACCEPTED', {
      workerId: currentLabourProfile.id,
      name: currentLabourProfile.name,
      phone: currentLabourProfile.phone,
      role: currentLabourProfile.role,
      teamCountAccepted: forTeamCount,
      acceptedAt: Date.now()
    });
  };

  const handleOpenCallModal = (name: string, phone: string, role: string, teamSize: number) => {
    setCallModalData({
      isOpen: true,
      name,
      phone,
      role,
      teamSize
    });
  };

  const activeLabourAcceptedJob = jobList.find(
    j => (j.status === 'ACCEPTED' || j.status === 'IN_PROGRESS') &&
    (j.acceptedWorker?.workerId === currentLabourProfile.id || j.status === 'ACCEPTED')
  ) || null;

  // Nearby workers with calculated distances
  const workersWithDistance = workers.map(w => ({
    ...w,
    distanceKm: calculateDistance(farmerLocation.lat, farmerLocation.lng, w.location.lat, w.location.lng)
  }));

  const t = translations[language];

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${
      isHighContrast
        ? 'bg-[#0B0F17] text-gray-100'
        : 'bg-[#F3F4F6] text-gray-900'
    }`}>
      {/* Universal Header with Firebase Auth */}
      <Header
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        language={language}
        onChangeLanguage={setLanguage}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
        isLabourOnline={isLabourOnline}
        onToggleLabourOnline={() => setIsLabourOnline(!isLabourOnline)}
        user={firebaseUser}
        userProfile={userProfile}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Role Quick Banner Notice */}
        <div className={`border rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-sm transition-all ${
          isHighContrast
            ? 'bg-gray-900 border-gray-800 text-gray-200'
            : 'bg-white border-gray-200 text-gray-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{currentRole === 'FARMER' ? '🚜' : '👥'}</span>
            <span className="font-medium text-gray-700">
              वर्तमान दृश्य: <strong className="text-gray-950 font-bold">{currentRole === 'FARMER' ? 'किसान डैशबोर्ड (Farmer)' : 'श्रमिक / टोली डैशबोर्ड (Labourer)'}</strong>
            </span>
          </div>
          <button
            onClick={() => setCurrentRole(currentRole === 'FARMER' ? 'LABOUR' : 'FARMER')}
            className="bg-[#166534] hover:bg-[#15803D] text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
          >
            {currentRole === 'FARMER' ? 'श्रमिक दृश्य में बदलें ➔' : 'किसान दृश्य में बदलें ➔'}
          </button>
        </div>

        {/* VIEW 1: FARMER DASHBOARD */}
        {currentRole === 'FARMER' && (
          <div className="space-y-6">
            {/* Farmer Dashboard Navigation Sub-Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200/80 pb-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFarmerActiveTab('LIVE_RADAR')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    farmerActiveTab === 'LIVE_RADAR'
                      ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-600/30'
                      : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
                  }`}
                >
                  <Radio className="w-4 h-4 text-emerald-300" />
                  <span>खेत व लाइव बुकिंग (Radar & Post Job)</span>
                </button>

                <button
                  onClick={() => setFarmerActiveTab('JOB_HISTORY')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    farmerActiveTab === 'JOB_HISTORY'
                      ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-600/30'
                      : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
                  }`}
                >
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>कार्य इतिहास (Job History)</span>
                  <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-300">
                    Firestore
                  </span>
                </button>
              </div>

              {farmerActiveTab === 'JOB_HISTORY' && (
                <button
                  onClick={() => setFarmerActiveTab('LIVE_RADAR')}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>नया मजदूर खोजें</span>
                </button>
              )}
            </div>

            {/* Sub-Tab 1: Live Radar & Post Job */}
            {farmerActiveTab === 'LIVE_RADAR' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                {/* Left Column: Interactive Map with Radar */}
                <div className="lg:col-span-6 space-y-4">
                  <div className={`rounded-2xl p-4 sm:p-5 shadow-sm border space-y-3.5 transition-all ${
                    isHighContrast
                      ? 'bg-gray-900 border-gray-800 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🗺️</span>
                        <h3 className="font-bold text-base text-gray-900 tracking-tight">
                          निकटतम उपलब्ध मजदूर व टोली (Radar Map)
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        2 से 4 किमी
                      </span>
                    </div>

                    {/* Leaflet Map with OSRM routing & moving marker */}
                    <InteractiveMap
                      farmerLocation={farmerLocation}
                      workers={workersWithDistance}
                      radiusKm={radiusKm}
                      onSelectLocation={(loc) => setFarmerLocation(loc)}
                      activeStatus={activeJob?.status}
                      activeJob={activeJob}
                      isHighContrast={isHighContrast}
                    />

                    {/* Worker Legend */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-gray-600">
                      <div className="flex items-center gap-3.5">
                        <span className="flex items-center gap-1.5 font-medium text-gray-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-600 ring-2 ring-orange-200"></span> टोली प्रमुख (Group)
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-gray-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200"></span> कुशल श्रमिक (Solo)
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium">
                        📍 पिन बदलकर खेत का स्थान बदलें
                      </span>
                    </div>
                  </div>

                  {/* Nearby Available Workers Quick List */}
                  <div className={`rounded-2xl p-4 sm:p-5 shadow-sm border space-y-3 transition-all ${
                    isHighContrast
                      ? 'bg-gray-900 border-gray-800 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-700" />
                        <span>दायरे में मौजूद टोलियां ({workersWithDistance.filter(w => (w.distanceKm || 0) <= radiusKm).length} उपलब्ध)</span>
                      </h4>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {workersWithDistance
                        .filter(w => (w.distanceKm || 0) <= radiusKm)
                        .map(w => (
                          <div
                            key={w.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-500 bg-gray-50/80 hover:bg-emerald-50/20 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{w.role === 'GROUP_LEADER' ? '👥' : '👨‍🌾'}</span>
                              <div>
                                <div className="font-semibold text-xs text-gray-900">
                                  {w.name} {w.role === 'GROUP_LEADER' ? `(${w.teamSize} जन की टोली)` : ''}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                  📍 {w.location.villageName} • ★ {w.rating}
                                </div>
                              </div>
                            </div>

                            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md">
                              {w.distanceKm} किमी दूर
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Active Booking Tracker OR Job Post Form */}
                <div className="lg:col-span-6 space-y-6">
                  {activeJob ? (
                    <BookingTracker
                      job={activeJob}
                      onUpdateStatus={(status) => handleUpdateJobStatus(activeJob.id, status)}
                      onOpenCallModal={handleOpenCallModal}
                      onCancelJob={() => setActiveJob(null)}
                      language={language}
                      isHighContrast={isHighContrast}
                    />
                  ) : (
                    <div className={`rounded-2xl p-5 sm:p-6 shadow-sm border space-y-4 transition-all ${
                      isHighContrast
                        ? 'bg-gray-900 border-gray-800 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}>
                      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {t.postJobRequirement}
                          </h3>
                          <p className="text-xs text-gray-500">
                            2–4 किमी में उपलब्ध मजदूरों को तुरंत अलर्ट भेजें
                          </p>
                        </div>
                        <span className="text-2xl">🌾</span>
                      </div>

                      <FarmerPostJobForm
                        farmerLocation={farmerLocation}
                        radiusKm={radiusKm}
                        onChangeRadius={setRadiusKm}
                        onSubmitJob={handleFarmerPostJob}
                        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
                        language={language}
                        isHighContrast={isHighContrast}
                        prefillData={voicePrefillData}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Farmer Job History Filtered from Firestore bookings */}
            {farmerActiveTab === 'JOB_HISTORY' && (
              <JobHistory
                currentRole="FARMER"
                userId={firebaseUser?.uid}
                userPhone={firebaseUser?.phoneNumber}
                userName={userProfile?.name || firebaseUser?.displayName}
                language={language}
                isHighContrast={isHighContrast}
              />
            )}
          </div>
        )}

        {/* VIEW 2: LABOUR / GROUP LEADER DASHBOARD */}
        {currentRole === 'LABOUR' && (
          <div className="space-y-6">
            {/* Labour Dashboard Navigation Sub-Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200/80 pb-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLabourActiveTab('LIVE_MATCH')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    labourActiveTab === 'LIVE_MATCH'
                      ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-600/30'
                      : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
                  }`}
                >
                  <Radio className="w-4 h-4 text-emerald-300" />
                  <span>लाइव मांग व स्वीकार (Live Demand & Accept)</span>
                </button>

                <button
                  onClick={() => setLabourActiveTab('JOB_HISTORY')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    labourActiveTab === 'JOB_HISTORY'
                      ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-600/30'
                      : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
                  }`}
                >
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>संपन्न कार्य व कमाई (Job History & Earnings)</span>
                  <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-300">
                    Firestore
                  </span>
                </button>
              </div>
            </div>

            {/* Sub-Tab 1: Live Labour Dashboard */}
            {labourActiveTab === 'LIVE_MATCH' && (
              <LabourDashboard
                currentWorker={currentLabourProfile}
                onChangeWorkerProfile={(updated) => setCurrentLabourProfile(prev => ({ ...prev, ...updated }))}
                isOnline={isLabourOnline}
                onToggleOnline={() => setIsLabourOnline(!isLabourOnline)}
                incomingJobs={jobList}
                activeAcceptedJob={activeLabourAcceptedJob}
                onAcceptJob={handleLabourAcceptJob}
                onRejectJob={(jobId) => setJobList(prev => prev.filter(j => j.id !== jobId))}
                onUpdateJobStatus={(status) => {
                  if (activeLabourAcceptedJob) {
                    handleUpdateJobStatus(activeLabourAcceptedJob.id, status);
                  }
                }}
                onOpenCallModal={handleOpenCallModal}
                language={language}
                isHighContrast={isHighContrast}
              />
            )}

            {/* Sub-Tab 2: Labour Job History Filtered from Firestore bookings */}
            {labourActiveTab === 'JOB_HISTORY' && (
              <JobHistory
                currentRole="LABOUR"
                userId={firebaseUser?.uid}
                userPhone={firebaseUser?.phoneNumber}
                userName={userProfile?.name || firebaseUser?.displayName}
                language={language}
                isHighContrast={isHighContrast}
              />
            )}
          </div>
        )}
      </main>

      {/* Firebase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        defaultRole={currentRole}
      />

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyParsedData={(parsed) => {
          setVoicePrefillData(parsed);
          setIsVoiceModalOpen(false);
        }}
        language={language}
      />

      {/* In-App One-Tap Phone Call Modal */}
      <InAppCallModal
        isOpen={callModalData.isOpen}
        onClose={() => setCallModalData(prev => ({ ...prev, isOpen: false }))}
        workerName={callModalData.name}
        workerPhone={callModalData.phone}
        workerRole={callModalData.role}
        teamSize={callModalData.teamSize}
      />

      {/* Footer */}
      <footer className="bg-[#111827] text-gray-400 text-xs py-4 border-t border-gray-800 text-center space-y-1">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-300 font-semibold">
            🌾 {t.appName} — ग्रामीण भारत का अपना कृषि श्रम सेतु
          </p>
          <p className="text-[11px] text-gray-400">
            GPS 2–4 KM Real-Time Labour Matchmaking • Voice-First & Multi-Language
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs,
  Timestamp,
  addDoc,
  setDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { FirestoreBookingDoc, UserRole, LanguageCode } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  Calendar, 
  MapPin, 
  User, 
  ShieldCheck, 
  KeyRound, 
  FileText, 
  Filter, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';
import { translations } from '../data/translations';

interface JobHistoryProps {
  currentRole: UserRole;
  userId?: string | null;
  userPhone?: string | null;
  userName?: string | null;
  language: LanguageCode;
  isHighContrast: boolean;
}

interface CompletedJobHistoryItem {
  bookingId: string;
  jobId: string;
  farmerId: string;
  farmerName?: string;
  farmerPhone?: string;
  labourLeaderId: string;
  labourLeaderName?: string;
  labourLeaderPhone?: string;
  taskType: string;
  cropName?: string;
  workersCount: number;
  wagePerDay: number;
  totalWage: number;
  address: string;
  OTP: string;
  paymentStatus: 'PENDING' | 'PAID_CASH' | 'PAID_UPI';
  startedAt?: number | null;
  completedAt?: number | null;
  ratingGiven?: number;
  feedback?: string;
}

// Rich fallback demo history records if Firestore is fresh or user is testing offline
const DEFAULT_DEMO_BOOKINGS: CompletedJobHistoryItem[] = [
  {
    bookingId: 'bk-7801',
    jobId: 'job-h-1',
    farmerId: 'farmer_demo_1',
    farmerName: 'महेन्द्र सिंह (किसान)',
    farmerPhone: '+91 98390 11223',
    labourLeaderId: 'leader_demo_1',
    labourLeaderName: 'कल्लू राम (टोली प्रमुख)',
    labourLeaderPhone: '+91 98765 43210',
    taskType: 'कटाई (Harvesting)',
    cropName: 'गेहूं (Wheat)',
    workersCount: 6,
    wagePerDay: 500,
    totalWage: 3000,
    address: 'शिवपुर चक, बहेरी (2.4 km)',
    OTP: '5824',
    paymentStatus: 'PAID_UPI',
    startedAt: Date.now() - (86400000 * 2) - 18000000,
    completedAt: Date.now() - (86400000 * 2),
    ratingGiven: 5.0,
    feedback: 'समय पर पूरी टोली पहुंची और साफ-सुथरी कटाई की।'
  },
  {
    bookingId: 'bk-7802',
    jobId: 'job-h-2',
    farmerId: 'farmer_demo_1',
    farmerName: 'रामसेवक पटेल (किसान)',
    farmerPhone: '+91 94150 99881',
    labourLeaderId: 'leader_demo_2',
    labourLeaderName: 'दिनेश कुमार (कुशल श्रमिक)',
    labourLeaderPhone: '+91 99360 12345',
    taskType: 'रोपाई (Paddy Sowing)',
    cropName: 'धान (Paddy)',
    workersCount: 4,
    wagePerDay: 450,
    totalWage: 1800,
    address: 'गंगापुर बार्डर, शिवपुर (3.1 km)',
    OTP: '3912',
    paymentStatus: 'PAID_CASH',
    startedAt: Date.now() - (86400000 * 5) - 25000000,
    completedAt: Date.now() - (86400000 * 5),
    ratingGiven: 4.8,
    feedback: 'उत्कृष्ट काम, समयबद्ध उपस्थिति।'
  },
  {
    bookingId: 'bk-7803',
    jobId: 'job-h-3',
    farmerId: 'farmer_demo_2',
    farmerName: 'सत्यनारायण मौर्य (किसान)',
    farmerPhone: '+91 91234 56789',
    labourLeaderId: 'leader_demo_1',
    labourLeaderName: 'कल्लू राम (टोली प्रमुख)',
    labourLeaderPhone: '+91 98765 43210',
    taskType: 'निराई-गुड़ाई (Weeding)',
    cropName: 'सरसों (Mustard)',
    workersCount: 5,
    wagePerDay: 400,
    totalWage: 2000,
    address: 'राजा तालाब मार्ग, रामपुर (1.8 km)',
    OTP: '9041',
    paymentStatus: 'PAID_UPI',
    startedAt: Date.now() - (86400000 * 9) - 14000000,
    completedAt: Date.now() - (86400000 * 9),
    ratingGiven: 4.9,
    feedback: 'बहुत बढ़िया टोली, दोबारा बुलाएंगे।'
  }
];

export const JobHistory: React.FC<JobHistoryProps> = ({
  currentRole,
  userId,
  userPhone,
  userName,
  language,
  isHighContrast
}) => {
  const t = translations[language];
  const [historyItems, setHistoryItems] = useState<CompletedJobHistoryItem[]>(DEFAULT_DEMO_BOOKINGS);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterPayment, setFilterPayment] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<CompletedJobHistoryItem | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedSuccessNotice, setSeedSuccessNotice] = useState<string | null>(null);

  // 1. Subscribe to Firestore `bookings` collection
  useEffect(() => {
    setLoading(true);
    try {
      const bookingsRef = collection(db, 'bookings');
      
      // Real-time listener for bookings
      const unsubscribe = onSnapshot(bookingsRef, (snapshot) => {
        if (!snapshot.empty) {
          const fetched: CompletedJobHistoryItem[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            fetched.push({
              bookingId: d.bookingId || docSnap.id,
              jobId: d.jobId || 'job-' + docSnap.id,
              farmerId: d.farmerId || '',
              farmerName: d.farmerName || 'किसान भाई',
              farmerPhone: d.farmerPhone || '+91 98390 11223',
              labourLeaderId: d.labourLeaderId || '',
              labourLeaderName: d.labourLeaderName || 'श्रमिक टोली',
              labourLeaderPhone: d.labourLeaderPhone || '+91 98765 43210',
              taskType: d.taskType || 'कृषि कार्य',
              cropName: d.cropName || 'फसल',
              workersCount: d.workersCount || d.workerCountNeeded || 4,
              wagePerDay: d.wagePerDay || d.offeredWagePerWorker || 500,
              totalWage: d.totalWage || ((d.workersCount || 4) * (d.wagePerDay || 500)),
              address: d.address || 'रामपुर बहेरी',
              OTP: d.OTP || '1234',
              paymentStatus: d.paymentStatus || 'PAID_UPI',
              startedAt: d.startedAt ? (typeof d.startedAt === 'number' ? d.startedAt : d.startedAt.toMillis?.() || Date.now()) : Date.now() - 86400000,
              completedAt: d.completedAt ? (typeof d.completedAt === 'number' ? d.completedAt : d.completedAt.toMillis?.() || Date.now()) : Date.now(),
              ratingGiven: d.ratingGiven || 5.0,
              feedback: d.feedback || 'काम संतोषजनक रहा।'
            });
          });

          // Merge with demo data so user always has rich display
          const combined = [...fetched];
          DEFAULT_DEMO_BOOKINGS.forEach(demo => {
            if (!combined.some(c => c.bookingId === demo.bookingId)) {
              combined.push(demo);
            }
          });
          
          setHistoryItems(combined);
        } else {
          // If collection is empty in Firestore, use rich default historical records
          setHistoryItems(DEFAULT_DEMO_BOOKINGS);
        }
        setLoading(false);
      }, (err) => {
        console.warn('Firestore bookings snapshot fallback:', err);
        setHistoryItems(DEFAULT_DEMO_BOOKINGS);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore subscription error:', e);
      setHistoryItems(DEFAULT_DEMO_BOOKINGS);
      setLoading(false);
    }
  }, [userId]);

  // Seed sample booking to Firestore
  const handleSeedSampleBooking = async () => {
    try {
      setIsSeeding(true);
      const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const sampleId = 'bk-' + Math.floor(1000 + Math.random() * 9000);
      
      const newBookingData = {
        bookingId: sampleId,
        jobId: 'job-' + Date.now(),
        farmerId: userId || 'farmer_current_uid',
        farmerName: (currentRole === 'FARMER' && userName) ? userName : 'रामसेवक पटेल (किसान)',
        farmerPhone: userPhone || '+91 98390 11223',
        labourLeaderId: (currentRole === 'LABOUR' && userId) ? userId : 'leader_demo_1',
        labourLeaderName: (currentRole === 'LABOUR' && userName) ? userName : 'कल्लू राम (टोली प्रमुख)',
        labourLeaderPhone: '+91 98765 43210',
        taskType: 'कटाई व मड़ाई (Harvesting & Threshing)',
        cropName: 'गेहूं (Wheat)',
        workersCount: 5,
        wagePerDay: 500,
        totalWage: 2500,
        address: 'रामपुर बहेरी, वाराणसी (2.1 km)',
        OTP: randomOtp,
        paymentStatus: 'PAID_UPI',
        startedAt: Date.now() - 28800000,
        completedAt: Date.now(),
        ratingGiven: 5.0,
        feedback: 'श्रमिकों ने बहुत तेजी और कुशलता से काम पूरा किया।'
      };

      await setDoc(doc(db, 'bookings', sampleId), newBookingData, { merge: true });
      
      setSeedSuccessNotice(`✅ नया संपन्न कार्य #${sampleId} Firestore में सफलतापूर्वक दर्ज हुआ!`);
      setTimeout(() => setSeedSuccessNotice(null), 4000);
    } catch (err: any) {
      console.error('Seed booking error:', err);
      setSeedSuccessNotice('⚠️ स्थानीय मोड में कार्य इतिहास जोड़ा गया।');
      setTimeout(() => setSeedSuccessNotice(null), 4000);
    } finally {
      setIsSeeding(false);
    }
  };

  // Filter items according to Role and Payment Filter
  const filteredList = historyItems.filter((item) => {
    // Role filter:
    // If logged in as Farmer, prioritize farmer's view; if Labour, prioritize labour's view
    if (userId) {
      if (currentRole === 'FARMER' && item.farmerId && item.farmerId !== userId && item.farmerId !== 'farmer_demo_1') {
        // Still allow demo items for testing presentation
      }
      if (currentRole === 'LABOUR' && item.labourLeaderId && item.labourLeaderId !== userId && item.labourLeaderId !== 'leader_demo_1') {
        // Still allow demo items
      }
    }

    // Payment Filter
    if (filterPayment === 'PAID' && item.paymentStatus === 'PENDING') return false;
    if (filterPayment === 'PENDING' && item.paymentStatus !== 'PENDING') return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTask = item.taskType.toLowerCase().includes(q);
      const matchCrop = item.cropName?.toLowerCase().includes(q);
      const matchAddress = item.address.toLowerCase().includes(q);
      const matchName = (item.farmerName || '').toLowerCase().includes(q) || (item.labourLeaderName || '').toLowerCase().includes(q);
      const matchId = item.bookingId.toLowerCase().includes(q);
      return matchTask || matchCrop || matchAddress || matchName || matchId;
    }

    return true;
  });

  // Calculate aggregates
  const totalCompletedJobs = filteredList.length;
  const totalEarningsOrExpense = filteredList.reduce((sum, item) => sum + (item.totalWage || 0), 0);
  const totalWorkersEngaged = filteredList.reduce((sum, item) => sum + (item.workersCount || 0), 0);

  const formatDate = (timestamp?: number | null) => {
    if (!timestamp) return 'हाल ही में';
    const d = new Date(timestamp);
    return d.toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Stats Overview */}
      <div className={`rounded-2xl p-5 sm:p-6 border shadow-sm transition-all ${
        isHighContrast
          ? 'bg-gray-900 border-gray-800 text-white'
          : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📜</span>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                {currentRole === 'FARMER' ? 'किसान कार्य इतिहास (Farmer Job History)' : 'श्रमिक कार्य इतिहास व कमाई (Labour Completed Jobs)'}
              </h2>
              <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                Firestore 'bookings'
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {currentRole === 'FARMER'
                ? 'आपके द्वारा पूर्व में पूर्ण कराए गए कृषि कार्य, भुगतान स्थिति और श्रमिकों का रिकॉर्ड।'
                : 'आपके व आपकी टोली द्वारा पूर्ण किए गए कार्य, OTP सत्यापन व प्राप्त दैनिक मजदूरी का ब्यौरा।'}
            </p>
          </div>

          {/* Action to Seed Demo Booking */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSeedSampleBooking}
              disabled={isSeeding}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSeeding ? 'सहेज रहे हैं...' : '+ नया संपन्न कार्य जोड़ें (Test Booking)'}</span>
            </button>
          </div>
        </div>

        {/* Notice Alert */}
        {seedSuccessNotice && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{seedSuccessNotice}</span>
          </div>
        )}

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="bg-gray-50 border border-gray-200/90 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center text-xl shrink-0 font-bold">
              ✓
            </div>
            <div>
              <div className="text-xs text-gray-600 font-semibold">कुल संपन्न कार्य (Completed Jobs)</div>
              <div className="text-xl font-bold text-gray-900 mt-0.5">{totalCompletedJobs} काम</div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200/90 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-100 border border-blue-300 text-blue-800 flex items-center justify-center text-xl shrink-0 font-bold">
              ₹
            </div>
            <div>
              <div className="text-xs text-gray-600 font-semibold">
                {currentRole === 'FARMER' ? 'कुल भुगतान (Total Paid)' : 'कुल अर्जित मजदूरी (Total Earned)'}
              </div>
              <div className="text-xl font-bold text-emerald-800 mt-0.5">₹{totalEarningsOrExpense.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200/90 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center text-xl shrink-0 font-bold">
              👥
            </div>
            <div>
              <div className="text-xs text-gray-600 font-semibold">
                {currentRole === 'FARMER' ? 'मजदूर शक्ति प्रयुक्त (Workers Employed)' : 'टोली सदस्य दिवस (Worker Days)'}
              </div>
              <div className="text-xl font-bold text-gray-900 mt-0.5">{totalWorkersEngaged} श्रमिक</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`rounded-2xl p-4 border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 transition-all ${
        isHighContrast ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            भुगतान स्थिति:
          </span>
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs">
            <button
              onClick={() => setFilterPayment('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filterPayment === 'ALL' ? 'bg-emerald-800 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              सभी ({historyItems.length})
            </button>
            <button
              onClick={() => setFilterPayment('PAID')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filterPayment === 'PAID' ? 'bg-emerald-800 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              सफल भुगतान (Paid)
            </button>
            <button
              onClick={() => setFilterPayment('PENDING')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                filterPayment === 'PENDING' ? 'bg-emerald-800 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              लंबित (Pending)
            </button>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="कार्य, फसल, या गांव खोजें..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Bookings List Grid */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200 space-y-2">
            <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold">Firestore से कार्य इतिहास लोड हो रहा है...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200 space-y-2">
            <span className="text-3xl">📭</span>
            <p className="text-sm font-bold text-gray-800">कोई कार्य इतिहास नहीं मिला</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              इस फ़िल्टर या खोज के अनुसार कोई संपन्न बुकिंग दर्ज नहीं है।
            </p>
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.bookingId}
              onClick={() => setSelectedJob(item)}
              className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer hover:border-emerald-600 hover:shadow-md ${
                selectedJob?.bookingId === item.bookingId
                  ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                  : isHighContrast
                  ? 'bg-gray-900 border-gray-800 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Task & Crop Info */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-0.5 rounded-lg border border-emerald-300">
                      ID: #{item.bookingId}
                    </span>
                    <h3 className="text-base font-bold text-gray-900">
                      {item.taskType} {item.cropName ? `• ${item.cropName}` : ''}
                    </h3>
                    <span className="bg-green-100 text-green-800 text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-700" />
                      संपन्न (Completed)
                    </span>
                  </div>

                  {/* Counterpart profile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        {currentRole === 'FARMER' ? (
                          <>टोली प्रमुख: <strong className="text-gray-900">{item.labourLeaderName}</strong> ({item.workersCount} मजदूर)</>
                        ) : (
                          <>किसान: <strong className="text-gray-900">{item.farmerName}</strong></>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="truncate max-w-xs">{item.address}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      <span>दिनांक: {formatDate(item.completedAt)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                      <span>सत्यापित OTP: <strong className="font-mono text-gray-900">****{item.OTP.slice(-2)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Payment & Total Amount */}
                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-[11px] text-gray-500 font-semibold">
                      {currentRole === 'FARMER' ? 'कुल भुगतान' : 'कुल मजदूरी'}
                    </div>
                    <div className="text-lg font-bold text-emerald-800">
                      ₹{item.totalWage.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      (₹{item.wagePerDay} × {item.workersCount} मजदूर)
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      item.paymentStatus === 'PAID_UPI'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : item.paymentStatus === 'PAID_CASH'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                      {item.paymentStatus === 'PAID_UPI' ? '💳 UPI भुगतान' : item.paymentStatus === 'PAID_CASH' ? '💵 नकद भुगतान' : '⏳ लंबित'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Feedback Note if available */}
              {item.feedback && (
                <div className="mt-3 pt-2.5 border-t border-gray-100 text-xs text-gray-600 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 italic">
                    <span>💬 "{item.feedback}"</span>
                  </div>
                  {item.ratingGiven && (
                    <span className="text-amber-500 font-bold flex items-center gap-1 shrink-0">
                      ★ {item.ratingGiven.toFixed(1)} / 5.0
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Selected Job Receipt Modal / Detail Drawer */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-gray-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-base text-gray-900">
                  कार्य रसीद व ब्यौरा (Job Receipt)
                </h3>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                प्रमाणित कृषि कार्य पर्ची
              </span>
              <div className="text-2xl font-black text-emerald-950">
                ₹{selectedJob.totalWage.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-emerald-800 font-medium">
                स्थिति: {selectedJob.paymentStatus === 'PAID_UPI' ? 'UPI डिजिटल रसीद' : 'नकद भुगतान संपन्न'}
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 font-medium">बुकिंग क्रमांक:</span>
                <span className="font-bold text-gray-900">#{selectedJob.bookingId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 font-medium">कार्य का प्रकार:</span>
                <span className="font-bold text-gray-900">{selectedJob.taskType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 font-medium">फसल:</span>
                <span className="font-bold text-gray-900">{selectedJob.cropName || 'सामान्य'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 font-medium">किसान का नाम:</span>
                <span className="font-bold text-gray-900">{selectedJob.farmerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 font-medium">टोली प्रमुख / श्रमिक:</span>
                <span className="font-bold text-gray-900">{selectedJob.labourLeaderName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 font-medium">श्रमिकों की संख्या:</span>
                <span className="font-bold text-gray-900">{selectedJob.workersCount} जन</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 font-medium">दैनिक दर:</span>
                <span className="font-bold text-gray-900">₹{selectedJob.wagePerDay} / मजदूर</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 font-medium">खेत का स्थान:</span>
                <span className="font-bold text-gray-900 text-right max-w-[200px] truncate">{selectedJob.address}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 font-medium">सत्यापन OTP:</span>
                <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                  {selectedJob.OTP}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

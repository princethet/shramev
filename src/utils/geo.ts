import { GeoLocation, WorkerProfile } from '../types';

/**
 * Calculates Haversine distance between two coordinates in Kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Sample initial agricultural hubs in rural India
export const DEFAULT_FARMER_LOCATION: GeoLocation = {
  lat: 25.3216,
  lng: 82.9876,
  villageName: "रामपुर बहेरी (Rampur Baheri)",
  district: "वाराणसी (Varanasi), उत्तर प्रदेश",
  landmark: "नहर पुलिया के पास, खेत नंबर 42"
};

export const INITIAL_WORKERS: WorkerProfile[] = [
  {
    id: "w-1",
    name: "रामू पटेल (टोली प्रमुख)",
    phone: "+91 98765 43210",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "GROUP_LEADER",
    teamSize: 6,
    skills: ["harvesting", "sowing", "threshing", "loading"],
    rating: 4.9,
    reviewCount: 42,
    completedJobs: 87,
    isOnline: true,
    location: {
      lat: 25.3330,
      lng: 82.9790,
      villageName: "हरहुआ डीह (Harhua Deeh)",
      district: "वाराणसी",
      landmark: "पंचायत भवन के पास"
    },
    expectedDailyWage: 520,
    bio: "6 अनुभवी मजदूरों की टोली। गेहूं, धान कटाई और रोपाई में 10 साल का तजुर्बा।",
    badge: "टॉप टोली (Top Rated)",
    verifiedAadhaar: true
  },
  {
    id: "w-2",
    name: "सुरेश बिंद (कुशल श्रमिक)",
    phone: "+91 98321 87654",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    role: "SOLO_WORKER",
    teamSize: 1,
    skills: ["plowing", "spraying", "irrigation"],
    rating: 4.8,
    reviewCount: 29,
    completedJobs: 54,
    isOnline: true,
    location: {
      lat: 25.3120,
      lng: 82.9980,
      villageName: "शिवपुर कछार (Shivpur)",
      district: "वाराणसी",
      landmark: "नलकूप के पास"
    },
    expectedDailyWage: 480,
    bio: "दवा छिड़काव और सिंचाई के विशेषज्ञ। अपना स्प्रेयर पंप भी उपलब्ध।",
    badge: "स्प्रेयर मास्टर",
    verifiedAadhaar: true
  },
  {
    id: "w-3",
    name: "कल्लू राम & टोली (8 मजदूर)",
    phone: "+91 97654 32109",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    role: "GROUP_LEADER",
    teamSize: 8,
    skills: ["harvesting", "weeding", "loading", "sowing"],
    rating: 4.95,
    reviewCount: 68,
    completedJobs: 112,
    isOnline: true,
    location: {
      lat: 25.3405,
      lng: 82.9940,
      villageName: "पिंडरा मौजा (Pindra)",
      district: "वाराणसी",
      landmark: "बड़का बरगद के पास"
    },
    expectedDailyWage: 500,
    bio: "तेज कटाई और बांधने वाली मजबूत टोली। 1 दिन में 4 बीघा कटाई की क्षमता।",
    badge: "सुपर फास्ट टोली",
    verifiedAadhaar: true
  },
  {
    id: "w-4",
    name: "मंगत यादव (ट्रैक्टर व मजदूर)",
    phone: "+91 96543 21098",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    role: "GROUP_LEADER",
    teamSize: 4,
    skills: ["plowing", "loading", "harvesting"],
    rating: 4.7,
    reviewCount: 19,
    completedJobs: 38,
    isOnline: true,
    location: {
      lat: 25.3050,
      lng: 82.9720,
      villageName: "चोलापुर (Cholapur)",
      district: "वाराणसी",
      landmark: "मंडी मार्ग"
    },
    expectedDailyWage: 550,
    bio: "जुताई, मेड़बंदी और मंडी तक माल ढुलाई में निपुण।",
    badge: "ट्रैक्टर उपलब्ध",
    verifiedAadhaar: true
  },
  {
    id: "w-5",
    name: "दिनेश कुमार (निराई विशेषज्ञ)",
    phone: "+91 95432 10987",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    role: "SOLO_WORKER",
    teamSize: 1,
    skills: ["weeding", "sowing", "irrigation"],
    rating: 4.6,
    reviewCount: 15,
    completedJobs: 24,
    isOnline: true,
    location: {
      lat: 25.3180,
      lng: 83.0120,
      villageName: "सारनाथ पट्टी (Sarnath Patti)",
      district: "वाराणसी",
      landmark: "प्राथमिक विद्यालय के सामने"
    },
    expectedDailyWage: 450,
    bio: "सब्जियों और फसलों की बारीक सोहनी-निराई में माहिर।",
    badge: "सब्जी स्पेशल",
    verifiedAadhaar: true
  },
  {
    id: "w-6",
    name: "भोला महतो टोली (5 मजदूर)",
    phone: "+91 94321 09876",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    role: "GROUP_LEADER",
    teamSize: 5,
    skills: ["harvesting", "sowing", "threshing"],
    rating: 4.85,
    reviewCount: 34,
    completedJobs: 62,
    isOnline: true,
    location: {
      lat: 25.3480,
      lng: 82.9810,
      villageName: "कपसेठी (Kapsethi)",
      district: "वाराणसी",
      landmark: "रेलवे क्रॉसिंग के पास"
    },
    expectedDailyWage: 500,
    bio: "समय के पक्के मजदूर। 5 लोग एक साथ हर किसिम के काम में तैयार।",
    badge: "समय के पाबंद",
    verifiedAadhaar: true
  }
];

/**
 * Filter workers within radius of center lat/lng
 */
export function getNearbyWorkers(
  workers: WorkerProfile[],
  centerLat: number,
  centerLng: number,
  maxRadiusKm: number = 4
): (WorkerProfile & { distanceKm: number })[] {
  return workers
    .map(w => {
      const distanceKm = calculateDistance(centerLat, centerLng, w.location.lat, w.location.lng);
      return { ...w, distanceKm };
    })
    .filter(w => w.distanceKm <= maxRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Text to speech helper for rural voice guidance in Hindi
 */
export function speakText(text: string, lang: string = 'hi-IN') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1.0;
    
    // Check for Hindi voices
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('Hindi') || v.name.includes('India'));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error("Speech synthesis error:", e);
  }
}

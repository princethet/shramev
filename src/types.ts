export type UserRole = 'FARMER' | 'LABOUR' | 'GROUP_LEADER';

export type LanguageCode = 'hi' | 'bho' | 'en';

export type TaskType = 
  | 'harvesting' 
  | 'sowing' 
  | 'weeding' 
  | 'plowing' 
  | 'irrigation' 
  | 'loading' 
  | 'spraying' 
  | 'threshing';

export type DurationUnit = 'HOURS' | 'DAYS';

export type JobStatus = 
  | 'SEARCHING' 
  | 'ACCEPTED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface GeoLocation {
  lat: number;
  lng: number;
  villageName: string;
  district?: string;
  landmark?: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  role: 'SOLO_WORKER' | 'GROUP_LEADER';
  teamSize: number;
  skills: TaskType[];
  rating: number;
  reviewCount: number;
  completedJobs: number;
  isOnline: boolean;
  location: GeoLocation;
  expectedDailyWage: number;
  bio?: string;
  badge?: string;
  verifiedAadhaar?: boolean;
}

export interface JobPost {
  id: string;
  farmerId?: string;
  farmerName: string;
  farmerPhone: string;
  taskType: TaskType;
  cropName: string;
  workerCountNeeded: number;
  durationUnit: DurationUnit;
  durationValue: number;
  offeredWagePerWorker: number;
  totalWageEstimate: number;
  location: GeoLocation;
  radiusKm: number;
  status: JobStatus;
  urgency: 'IMMEDIATE' | 'TODAY' | 'TOMORROW';
  createdAt: number;
  acceptedAt?: number;
  startedAt?: number;
  completedAt?: number;
  acceptedByWorkerId?: string;
  acceptedWorker?: {
    workerId?: string;
    id?: string;
    name: string;
    phone: string;
    avatar?: string;
    role?: 'SOLO_WORKER' | 'GROUP_LEADER' | string;
    teamCountAccepted?: number;
    rating?: number;
    acceptedAt?: number;
  };
  specialInstructions?: string;
  voiceTranscript?: string;
}

export interface FirestoreGeoPoint {
  latitude: number;
  longitude: number;
}

export type FirestoreUserRole = 'FARMER' | 'LABOUR_LEADER';

export interface FirestoreUserDoc {
  uid: string;
  name: string;
  phone: string;
  email?: string | null;
  role: FirestoreUserRole;
  profilePhoto?: string | null;
  rating?: number;
  currentLocation?: FirestoreGeoPoint;
  isOnline?: boolean;
  teamSize?: number;
  createdAt: number;
}

export type FirestoreJobStatus = 
  | 'SEARCHING' 
  | 'ACCEPTED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface FirestoreJobDoc {
  jobId: string;
  farmerId: string;
  taskType: string;
  workersCountNeeded: number;
  wagePerDay: number;
  location: FirestoreGeoPoint;
  address: string;
  status: FirestoreJobStatus;
  assignedLeaderId?: string | null;
  etaMinutes?: number | null;
  createdAt: number;
}

export type BookingPaymentStatus = 'PENDING' | 'PAID_CASH' | 'PAID_UPI';

export interface FirestoreBookingDoc {
  bookingId: string;
  jobId: string;
  farmerId: string;
  labourLeaderId: string;
  OTP: string;
  paymentStatus: BookingPaymentStatus;
  startedAt?: number | null;
  completedAt?: number | null;
}

export interface VoiceCommandResult {
  success: boolean;
  rawText: string;
  parsedData?: {
    taskType?: TaskType;
    cropName?: string;
    workerCountNeeded?: number;
    offeredWagePerWorker?: number;
    durationValue?: number;
    durationUnit?: DurationUnit;
    urgency?: 'IMMEDIATE' | 'TODAY' | 'TOMORROW';
    specialInstructions?: string;
    spokenFeedbackHindi?: string;
  };
  detectedLanguage?: string;
  spokenFeedbackHindi?: string;
}

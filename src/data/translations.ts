import { LanguageCode, TaskType } from '../types';

export interface TranslationStrings {
  appName: string;
  tagline: string;
  farmer: string;
  labour: string;
  groupLeader: string;
  switchRole: string;
  online: string;
  offline: string;
  postJob: string;
  workerCount: string;
  taskType: string;
  duration: string;
  dailyWage: string;
  wagePerWorker: string;
  totalEstimate: string;
  fieldLocation: string;
  locateMe: string;
  findLabourers: string;
  searchingRadius: string;
  nearbyWorkers: string;
  workersAvailable: string;
  statusSearching: string;
  statusAccepted: string;
  statusInProgress: string;
  statusCompleted: string;
  oneTapCall: string;
  cancelJob: string;
  acceptJob: string;
  acceptForTeam: string;
  reject: string;
  startWork: string;
  finishWork: string;
  voicePromptPlaceholder: string;
  voiceHelpText: string;
  listening: string;
  processingVoice: string;
  kmAway: string;
  rated: string;
  jobsDone: string;
  hours: string;
  days: string;
  cropName: string;
  today: string;
  tomorrow: string;
  immediate: string;
  highContrastMode: string;
  soundGuide: string;
  teamOf: string;
  rupees: string;
}

export const translations: Record<LanguageCode, TranslationStrings> = {
  hi: {
    appName: "श्रमेव",
    tagline: "खेत से खलिहान तक - 2 से 4 किमी में तुरंत मजदूर और टोली",
    farmer: "किसान (मालिक)",
    labour: "श्रमिक / टोली",
    groupLeader: "टोली प्रमुख",
    switchRole: "भूमिका बदलें",
    online: "काम के लिए तैयार (Online)",
    offline: "अभी व्यस्त / ऑफ़लाइन",
    postJob: "मजदूर की मांग दर्ज करें",
    workerCount: "कितने मजदूर चाहिए?",
    taskType: "काम का प्रकार",
    duration: "समय अवधि",
    dailyWage: "दैनिक मजदूरी (₹ / मजदूर)",
    wagePerWorker: "प्रति मजदूर मजदूरी",
    totalEstimate: "कुल अनुमानित खर्च",
    fieldLocation: "खेत का सही स्थान (GPS)",
    locateMe: "मेरा खेत खोजें (GPS)",
    findLabourers: "मजदूर खोजें (2-4 किमी)",
    searchingRadius: "2 से 4 किमी दायरे में तलाश जारी है...",
    nearbyWorkers: "आस-पास उपलब्ध श्रमिक और टोलियां",
    workersAvailable: "मजदूर उपलब्ध हैं",
    statusSearching: "मजदूरों को भेजा जा रहा है...",
    statusAccepted: "काम स्वीकार कर लिया गया!",
    statusInProgress: "खेत पर कार्य प्रगति पर है",
    statusCompleted: "काम पूरा हुआ • भुगतान करें",
    oneTapCall: "तुरंत सीधे बात करें (Call)",
    cancelJob: "मांग रद्द करें",
    acceptJob: "काम स्वीकार करें",
    acceptForTeam: "पूरी टोली के लिए स्वीकार करें",
    reject: "अस्वीकार करें",
    startWork: "खेत पर काम शुरू करें",
    finishWork: "काम पूरा घोषित करें",
    voicePromptPlaceholder: "माइक दबाकर बोलें: जैसे '3 मजदूर चाहिए गेहूं कटाई के लिए 500 रुपये में'",
    voiceHelpText: "बोलकर मांग दर्ज करें (हिंदी / भोजपुरी)",
    listening: "सुन रहे हैं... बोलिए",
    processingVoice: "आपकी आवाज समझ रहे हैं...",
    kmAway: "किमी दूर",
    rated: "रेटिंग",
    jobsDone: "काम पूरे किए",
    hours: "घंटे",
    days: "दिन",
    cropName: "फसल का नाम (उदा. गेहूं, धान)",
    today: "आज ही",
    tomorrow: "कल सुबह",
    immediate: "अभी तुरंत",
    highContrastMode: "तेज धूप मोड",
    soundGuide: "आवाज में सुनें",
    teamOf: "की टोली",
    rupees: "₹"
  },
  bho: {
    appName: "श्रमेव",
    tagline: "खेत से खरिहान ले - 2 से 4 किमी में तुरंते मजदूर आ टोली",
    farmer: "किसान (मालिक)",
    labour: "मजदूर / टोली",
    groupLeader: "टोली सरदार",
    switchRole: "काम बदलीं",
    online: "काम खातिर तइयार (Online)",
    offline: "अभी फुर्सत नइखे (Offline)",
    postJob: "मजदूर के जरूरत डालीं",
    workerCount: "केतना मजदूर चाहीं?",
    taskType: "काम के किसिम",
    duration: "केतना दिन/घंटा",
    dailyWage: "रोजी (₹ प्रति मजदूर)",
    wagePerWorker: "हर मजदूर के मजदूरी",
    totalEstimate: "कुल खर्चा के अंदेशा",
    fieldLocation: "खेत के सही जगह (GPS)",
    locateMe: "हमार खेत चुनीं (GPS)",
    findLabourers: "मजदूर खोजीं (2-4 किमी)",
    searchingRadius: "2 से 4 किमी के घेरा में खोजल जा रहल बा...",
    nearbyWorkers: "लगही के उपलब्ध मजदूर आ टोली",
    workersAvailable: "मजदूर तइयार बाड़न",
    statusSearching: "मजदूरन के खबर भेजल जा रहल बा...",
    statusAccepted: "मजदूर काम कबूल क लिहलन!",
    statusInProgress: "खेत में काम चालू बा",
    statusCompleted: "काम पूरा भइल • पैसा चुकाईं",
    oneTapCall: "सोझहीं फोन लगाईं (Call)",
    cancelJob: "मांग हटावीं",
    acceptJob: "काम कबूल करीं",
    acceptForTeam: "सगरी टोली खातिर कबूल करीं",
    reject: "नाहीं करीं",
    startWork: "खेत में काम शुरू करीं",
    finishWork: "काम पूरा हो गइल",
    voicePromptPlaceholder: "माइक दबा के बोलीं: जइसे '4 गो मजदूर चाहीं धान रोपाई खातिर 500 रुपिया में'",
    voiceHelpText: "बोल के काम दर्ज करीं (भोजपुरी / हिंदी)",
    listening: "सुनत बानी... बोलीं",
    processingVoice: "रउआ आवाज समझल जा रहल बा...",
    kmAway: "किमी दूर",
    rated: "रेटिंग",
    jobsDone: "काम पूरा",
    hours: "घंटा",
    days: "दिन",
    cropName: "फसल के नाम (उदा. गेहूं, धान, मकई)",
    today: "आजे",
    tomorrow: "काल्ह भोरे",
    immediate: "एक्दम अभी",
    highContrastMode: "कड़ा घाम मोड",
    soundGuide: "आवाज सुनीं",
    teamOf: "के टोली",
    rupees: "₹"
  },
  en: {
    appName: "Shramev (श्रमेव)",
    tagline: "Hyperlocal Agricultural Labour Matching within 2–4 km",
    farmer: "Farmer (Hirer)",
    labour: "Labourer / Group",
    groupLeader: "Group Leader (Mate)",
    switchRole: "Switch Role",
    online: "Online / Ready for Work",
    offline: "Offline / Busy",
    postJob: "Post Labour Requirement",
    workerCount: "How many workers needed?",
    taskType: "Task / Job Type",
    duration: "Work Duration",
    dailyWage: "Daily Wage (₹ / Worker)",
    wagePerWorker: "Wage per worker",
    totalEstimate: "Total Estimated Cost",
    fieldLocation: "Field GPS Location",
    locateMe: "Pin My Field GPS",
    findLabourers: "Find Workers (2–4 km)",
    searchingRadius: "Broadcasting to 2–4 km radius...",
    nearbyWorkers: "Nearby Available Labourers & Teams",
    workersAvailable: "workers available",
    statusSearching: "Searching nearby workers...",
    statusAccepted: "Job Accepted by Worker/Team!",
    statusInProgress: "Work In Progress on Field",
    statusCompleted: "Work Completed • Settle Payment",
    oneTapCall: "One-Tap Call Worker",
    cancelJob: "Cancel Request",
    acceptJob: "Accept Job",
    acceptForTeam: "Accept on Behalf of Team",
    reject: "Decline",
    startWork: "Start Work at Field",
    finishWork: "Mark Completed",
    voicePromptPlaceholder: "Tap mic and speak: e.g. 'Need 5 workers for wheat harvesting at ₹500/day'",
    voiceHelpText: "Voice-first command (Hindi/Bhojpuri supported)",
    listening: "Listening... speak now",
    processingVoice: "Understanding your voice...",
    kmAway: "km away",
    rated: "Rating",
    jobsDone: "Jobs Done",
    hours: "Hours",
    days: "Days",
    cropName: "Crop Name (e.g., Wheat, Paddy, Mustard)",
    today: "Today",
    tomorrow: "Tomorrow Morning",
    immediate: "Immediately",
    highContrastMode: "High Sunlight Mode",
    soundGuide: "Audio Guide",
    teamOf: "team of",
    rupees: "₹"
  }
};

export interface TaskInfo {
  type: TaskType;
  labelHindi: string;
  labelBhojpuri: string;
  labelEnglish: string;
  icon: string;
  color: string;
  defaultWage: number;
}

export const taskCatalog: TaskInfo[] = [
  {
    type: 'harvesting',
    labelHindi: 'कटाई व थ्रेशिंग',
    labelBhojpuri: 'कटनी आ दौनी',
    labelEnglish: 'Harvesting & Threshing',
    icon: '🌾',
    color: 'bg-amber-100 border-amber-400 text-amber-900',
    defaultWage: 550
  },
  {
    type: 'sowing',
    labelHindi: 'बुवाई व रोपाई',
    labelBhojpuri: 'बोआई आ रोपाई',
    labelEnglish: 'Sowing & Transplantation',
    icon: '🌱',
    color: 'bg-emerald-100 border-emerald-400 text-emerald-900',
    defaultWage: 500
  },
  {
    type: 'weeding',
    labelHindi: 'निराई-गुड़ाई',
    labelBhojpuri: 'सोहनी आ कोड़ाई',
    labelEnglish: 'Weeding & Hoeing',
    icon: '🌿',
    color: 'bg-lime-100 border-lime-400 text-lime-900',
    defaultWage: 450
  },
  {
    type: 'plowing',
    labelHindi: 'खेत जुताई व मेड़बंदी',
    labelBhojpuri: 'जोताई आ आरी बांधल',
    labelEnglish: 'Plowing & Bunding',
    icon: '🚜',
    color: 'bg-orange-100 border-orange-400 text-orange-900',
    defaultWage: 600
  },
  {
    type: 'irrigation',
    labelHindi: 'सिंचाई व पानी लगाना',
    labelBhojpuri: 'पटवन आ पानी देवल',
    labelEnglish: 'Irrigation & Canal Work',
    icon: '💧',
    color: 'bg-cyan-100 border-cyan-400 text-cyan-900',
    defaultWage: 450
  },
  {
    type: 'spraying',
    labelHindi: 'दवा व खाद छिड़काव',
    labelBhojpuri: 'दवाई आ खाद छींटल',
    labelEnglish: 'Pesticide & Fertilizer Spray',
    icon: '🛡️',
    color: 'bg-purple-100 border-purple-400 text-purple-900',
    defaultWage: 600
  },
  {
    type: 'loading',
    labelHindi: 'बोरी लदाई व मंडी ढुलाई',
    labelBhojpuri: 'बोरा लदाई आ ढुलाई',
    labelEnglish: 'Loading & Transport',
    icon: '📦',
    color: 'bg-yellow-100 border-yellow-400 text-yellow-900',
    defaultWage: 550
  },
  {
    type: 'threshing',
    labelHindi: 'ओसाई व सफाई',
    labelBhojpuri: 'ओसावल आ सफाई',
    labelEnglish: 'Winnowing & Cleaning',
    icon: '🌽',
    color: 'bg-stone-100 border-stone-400 text-stone-900',
    defaultWage: 480
  }
];

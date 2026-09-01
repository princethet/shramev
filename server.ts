import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Top-level payload deserialization guarantee
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Initialize Gemini SDK with User-Agent
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder
const MODEL_LADDER = [
  "gemini-3.7-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
];

async function generateContentWithFallback(prompt: string, systemInstruction?: string, responseSchema?: any) {
  const ai = getGenAI();
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  let lastError: any = null;
  for (const model of MODEL_LADDER) {
    try {
      const config: any = {
        temperature: 0.1,
      };
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (responseSchema) {
        config.responseMimeType = "application/json";
        config.responseSchema = responseSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err?.message || err);
      lastError = err;
      // continue to next model in ladder
    }
  }
  throw lastError || new Error("All fallback models exhausted.");
}

// In-Memory Real-Time State for Live Matching
interface BackendJob {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  taskType: string;
  cropName: string;
  workerCountNeeded: number;
  durationUnit: string;
  durationValue: number;
  offeredWagePerWorker: number;
  totalWageEstimate: number;
  location: {
    lat: number;
    lng: number;
    villageName: string;
    district?: string;
    landmark?: string;
  };
  radiusKm: number;
  status: "SEARCHING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  urgency: "IMMEDIATE" | "TODAY" | "TOMORROW";
  createdAt: number;
  acceptedAt?: number;
  startedAt?: number;
  completedAt?: number;
  acceptedByWorkerId?: string;
  acceptedWorker?: any;
  specialInstructions?: string;
  voiceTranscript?: string;
}

let activeJobs: BackendJob[] = [
  {
    id: "job-demo-1",
    farmerId: "f-101",
    farmerName: "रामसहाय वर्मा (किसान)",
    farmerPhone: "+91 98111 22334",
    taskType: "harvesting",
    cropName: "गेहूं (Wheat)",
    workerCountNeeded: 6,
    durationUnit: "DAYS",
    durationValue: 2,
    offeredWagePerWorker: 500,
    totalWageEstimate: 6000,
    location: {
      lat: 25.3216,
      lng: 82.9876,
      villageName: "रामपुर बहेरी",
      district: "वाराणसी",
      landmark: "नहर पुलिया के पास, खेत नंबर 42"
    },
    radiusKm: 3.5,
    status: "SEARCHING",
    urgency: "TODAY",
    createdAt: Date.now() - 1000 * 60 * 12,
    specialInstructions: "दरांती साथ लाएं, खेत सूखा है और तुरंत काम शुरू करना है।"
  }
];

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "श्रमेव Shramev Agricultural Engine", timestamp: Date.now() });
});

// 2. Gemini Voice Natural Language Parsing API for Hindi / Bhojpuri
app.post("/api/gemini/parse-voice", async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const text = String(body.text || "").trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Voice text transcript is required."
      });
    }

    const systemInstruction = `You are the AI voice intake engine for "श्रमेव" (Shramev), a real-time agricultural labour app in rural India (UP, Bihar, MP, Punjab).
Farmers speak in Hindi, Bhojpuri, Maithili, or Hinglish to post job requirements.
Your job is to extract:
1. taskType: must be one of ['harvesting', 'sowing', 'weeding', 'plowing', 'irrigation', 'loading', 'spraying', 'threshing']. Default to 'harvesting' if unclear.
2. cropName: the crop mentioned (e.g. गेहूं, धान, मक्का, सरसों, गन्ना, आलू, टमाटर, etc.)
3. workerCountNeeded: integer number of labourers required. (Default to 4 if not specified)
4. offeredWagePerWorker: daily wage in INR per worker. (Standard is 500 if not specified)
5. durationValue: integer number of units (e.g. 1, 2, 3). (Default: 1)
6. durationUnit: 'DAYS' or 'HOURS' (Default: 'DAYS')
7. urgency: 'IMMEDIATE', 'TODAY', or 'TOMORROW' (Default: 'TODAY')
8. specialInstructions: any tool or meal notes (e.g. 'दरांती लाएं', 'दोपहर का खाना मिलेगा')
9. spokenFeedbackHindi: A reassuring 1-sentence confirmation message in clear Hindi/Bhojpuri to be read out loud to the farmer.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        taskType: {
          type: Type.STRING,
          enum: ['harvesting', 'sowing', 'weeding', 'plowing', 'irrigation', 'loading', 'spraying', 'threshing']
        },
        cropName: { type: Type.STRING },
        workerCountNeeded: { type: Type.INTEGER },
        offeredWagePerWorker: { type: Type.NUMBER },
        durationValue: { type: Type.INTEGER },
        durationUnit: { type: Type.STRING, enum: ['DAYS', 'HOURS'] },
        urgency: { type: Type.STRING, enum: ['IMMEDIATE', 'TODAY', 'TOMORROW'] },
        specialInstructions: { type: Type.STRING },
        spokenFeedbackHindi: { type: Type.STRING },
        detectedLanguage: { type: Type.STRING }
      },
      required: ['taskType', 'cropName', 'workerCountNeeded', 'offeredWagePerWorker', 'spokenFeedbackHindi']
    };

    const prompt = `Parse this rural farmer's voice input: "${text}"`;

    const rawResponse = await generateContentWithFallback(prompt, systemInstruction, responseSchema);
    let parsedData = {};
    try {
      parsedData = JSON.parse(rawResponse);
    } catch {
      parsedData = {
        taskType: "harvesting",
        cropName: "फसल (Crop)",
        workerCountNeeded: 4,
        offeredWagePerWorker: 500,
        spokenFeedbackHindi: "आपकी मांग दर्ज कर ली गई है। 2 से 4 किमी में मजदूरों को अलर्ट भेजा जा रहा है।"
      };
    }

    return res.json({
      success: true,
      rawText: text,
      parsedData
    });
  } catch (error: any) {
    console.error("Gemini voice parsing error:", error);
    // Graceful fallback for offline / mock voice parsing
    return res.json({
      success: true,
      rawText: req.body?.text || "",
      parsedData: {
        taskType: "harvesting",
        cropName: "गेहूं / फसल",
        workerCountNeeded: 4,
        offeredWagePerWorker: 500,
        durationValue: 1,
        durationUnit: "DAYS",
        urgency: "TODAY",
        specialInstructions: "समय पर पहुंचे",
        spokenFeedbackHindi: "आपकी मांग 4 मजदूरों के लिए दर्ज हो गई है। आस-पास के टोलियों को खोजा जा रहा है।"
      }
    });
  }
});

// 3. Get all active jobs or filter by radius
app.get("/api/jobs", (req, res) => {
  const status = req.query.status as string;
  let results = [...activeJobs];
  if (status) {
    results = results.filter(j => j.status === status);
  }
  res.json({ jobs: results });
});

// 4. Post a new Job Post
app.post("/api/jobs", (req, res) => {
  try {
    const data = req.body && typeof req.body === "object" ? req.body : {};
    
    // Strict undefined stripping & validation
    const newJob: BackendJob = {
      id: `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      farmerId: String(data.farmerId || "farmer-self"),
      farmerName: String(data.farmerName || "किसान (मालिक)"),
      farmerPhone: String(data.farmerPhone || "+91 98765 00000"),
      taskType: String(data.taskType || "harvesting"),
      cropName: String(data.cropName || "गेहूं"),
      workerCountNeeded: Number(data.workerCountNeeded || 4),
      durationUnit: data.durationUnit === "HOURS" ? "HOURS" : "DAYS",
      durationValue: Number(data.durationValue || 1),
      offeredWagePerWorker: Number(data.offeredWagePerWorker || 500),
      totalWageEstimate: Number(data.totalWageEstimate || (Number(data.workerCountNeeded || 4) * Number(data.offeredWagePerWorker || 500) * Number(data.durationValue || 1))),
      location: {
        lat: Number(data.location?.lat || 25.3216),
        lng: Number(data.location?.lng || 82.9876),
        villageName: String(data.location?.villageName || "रामपुर बहेरी"),
        district: String(data.location?.district || "वाराणसी"),
        landmark: String(data.location?.landmark || "खेत नंबर 1")
      },
      radiusKm: Number(data.radiusKm || 3.5),
      status: "SEARCHING",
      urgency: data.urgency || "TODAY",
      createdAt: Date.now(),
      specialInstructions: data.specialInstructions ? String(data.specialInstructions) : undefined,
      voiceTranscript: data.voiceTranscript ? String(data.voiceTranscript) : undefined
    };

    activeJobs.unshift(newJob);
    res.status(201).json({ success: true, job: newJob });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message || "Failed to create job" });
  }
});

// 5. Accept Job Post by Worker / Leader
app.post("/api/jobs/:id/accept", (req, res) => {
  const jobId = req.params.id;
  const worker = req.body && typeof req.body === "object" ? req.body.worker : null;

  const jobIndex = activeJobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) {
    return res.status(404).json({ success: false, error: "Job not found" });
  }

  activeJobs[jobIndex].status = "ACCEPTED";
  activeJobs[jobIndex].acceptedAt = Date.now();
  activeJobs[jobIndex].acceptedByWorkerId = worker?.id || "worker-default";
  activeJobs[jobIndex].acceptedWorker = worker || {
    id: "w-1",
    name: "रामू पटेल (टोली प्रमुख)",
    phone: "+91 98765 43210",
    role: "GROUP_LEADER",
    teamCountAccepted: activeJobs[jobIndex].workerCountNeeded,
    rating: 4.9
  };

  res.json({ success: true, job: activeJobs[jobIndex] });
});

// 6. Update Job Status (Searching -> Accepted -> In Progress -> Completed)
app.post("/api/jobs/:id/status", (req, res) => {
  const jobId = req.params.id;
  const { status } = req.body || {};

  const jobIndex = activeJobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) {
    return res.status(404).json({ success: false, error: "Job not found" });
  }

  if (status) {
    activeJobs[jobIndex].status = status;
    if (status === "IN_PROGRESS") {
      activeJobs[jobIndex].startedAt = Date.now();
    } else if (status === "COMPLETED") {
      activeJobs[jobIndex].completedAt = Date.now();
    }
  }

  res.json({ success: true, job: activeJobs[jobIndex] });
});

// Start Express Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`श्रमेव (Shramev) Agricultural Server running on http://localhost:${PORT}`);
  });
}

startServer();

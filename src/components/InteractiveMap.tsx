import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GeoLocation, WorkerProfile, JobPost } from '../types';
import { calculateDistance } from '../utils/geo';
import { fetchOSRMRoute, getPositionAlongRoute, RouteResult } from '../utils/routing';
import { 
  Navigation, 
  Clock, 
  MapPin, 
  Compass, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Eye, 
  Sun, 
  Sunset, 
  Moon, 
  Volume2, 
  Maximize2, 
  Phone, 
  Radio, 
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Map,
  TrendingUp,
  RefreshCw,
  Compass as CompassIcon,
  Video
} from 'lucide-react';

interface InteractiveMapProps {
  farmerLocation: GeoLocation;
  workers: (WorkerProfile & { distanceKm?: number })[];
  radiusKm: number;
  onSelectLocation?: (loc: GeoLocation) => void;
  selectedWorkerId?: string | null;
  onSelectWorker?: (worker: WorkerProfile) => void;
  activeStatus?: string;
  activeJob?: JobPost | null;
  isHighContrast?: boolean;
}

type CameraMode = 'PERSPECTIVE_45' | 'CHASE_CAM' | 'TOP_DOWN_2D' | 'CINEMATIC_60';
type TimeOfDay = 'SUNSET_INDIA' | 'AFTERNOON' | 'MORNING' | 'NIGHT_DUSK';

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  farmerLocation,
  workers,
  radiusKm,
  onSelectLocation,
  selectedWorkerId,
  onSelectWorker,
  activeStatus,
  activeJob,
  isHighContrast = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 3D Camera Controls State
  const [cameraMode, setCameraMode] = useState<CameraMode>('PERSPECTIVE_45');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('SUNSET_INDIA');
  const [zoomLevel, setZoomLevel] = useState<number>(1.2);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [show3DCue, setShow3DCue] = useState<boolean>(true);
  const [headingAngle, setHeadingAngle] = useState<number>(15); // Degrees
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Live Route & Motion State
  const [activeRoute, setActiveRoute] = useState<{
    coordinates: [number, number][];
    totalDistanceKm: number;
    initialEtaMinutes: number;
    remainingDistanceKm: number;
    remainingEtaMinutes: number;
    progressRatio: number;
    isMoving: boolean;
    worker: (WorkerProfile & { distanceKm?: number }) | null;
    source: string;
    currentSpeedKmH: number;
    currentTiltDeg: number;
    currentHeadingDeg: number;
    nextTurnText: string;
  } | null>(null);

  const [inspectedWorkerId, setInspectedWorkerId] = useState<string | null>(null);

  // Animation frame & timer ref
  const animFrameRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const smoothedTiltRef = useRef<number>(0);
  const smoothedHeadingRef = useRef<number>(0);
  const particlesRef = useRef<{ x: number; y: number; size: number; alpha: number; speed: number }[]>([]);

  // Auto-dismiss 3D cue badge after 5 seconds on initial mount or change
  useEffect(() => {
    setShow3DCue(true);
    const timer = setTimeout(() => setShow3DCue(false), 4500);
    return () => clearTimeout(timer);
  }, [cameraMode, timeOfDay]);

  // Determine active tracked worker (from activeJob or inspection)
  const trackedWorker = useMemo(() => {
    if (activeJob?.acceptedWorker) {
      const match = workers.find(w => w.id === activeJob.acceptedWorker?.workerId);
      return match || {
        id: activeJob.acceptedWorker.workerId,
        name: activeJob.acceptedWorker.name,
        phone: activeJob.acceptedWorker.phone,
        role: (activeJob.workerCountNeeded > 1 ? 'GROUP_LEADER' : 'SOLO_WORKER') as any,
        teamSize: activeJob.workerCountNeeded,
        skills: [activeJob.taskType],
        dailyWageRate: activeJob.offeredWagePerWorker,
        rating: 4.9,
        isAvailable: true,
        verifiedAadhaar: true,
        location: {
          lat: farmerLocation.lat + 0.015,
          lng: farmerLocation.lng - 0.012,
          villageName: 'शिवपुर सीमा',
          district: 'वाराणसी'
        },
        distanceKm: 2.1
      };
    }
    if (inspectedWorkerId) {
      return workers.find(w => w.id === inspectedWorkerId) || null;
    }
    // Default to the first available worker within radius
    const inRange = workers.filter(w => (w.distanceKm || 0) <= radiusKm);
    return inRange.length > 0 ? inRange[0] : (workers[0] || null);
  }, [activeJob, inspectedWorkerId, workers, radiusKm, farmerLocation]);

  // Fetch OSRM Route whenever farmer location or tracked worker changes
  useEffect(() => {
    if (!trackedWorker) {
      setActiveRoute(null);
      return;
    }

    let isSubscribed = true;

    async function loadRoute() {
      const workerLat = trackedWorker.location.lat;
      const workerLng = trackedWorker.location.lng;
      const farmLat = farmerLocation.lat;
      const farmLng = farmerLocation.lng;

      try {
        const routeData: RouteResult = await fetchOSRMRoute(workerLat, workerLng, farmLat, farmLng);
        if (!isSubscribed) return;

        const isCurrentlyMoving = !!activeJob && (activeJob.status === 'ACCEPTED' || activeJob.status === 'ON_THE_WAY');

        setActiveRoute({
          coordinates: routeData.coordinates,
          totalDistanceKm: routeData.distanceKm,
          initialEtaMinutes: routeData.durationMinutes,
          remainingDistanceKm: routeData.distanceKm,
          remainingEtaMinutes: routeData.durationMinutes,
          progressRatio: 0,
          isMoving: isCurrentlyMoving || true, // Allow preview motion simulation
          worker: trackedWorker,
          source: routeData.source,
          currentSpeedKmH: isCurrentlyMoving ? 32 : 28,
          currentTiltDeg: 0,
          currentHeadingDeg: 0,
          nextTurnText: '150m आगे बहेरी मुख्य संपर्क मार्ग पर मुड़ें'
        });

        progressRef.current = 0;
      } catch (err) {
        console.warn('Error loading OSRM route for 3D map:', err);
      }
    }

    loadRoute();

    return () => {
      isSubscribed = false;
    };
  }, [trackedWorker?.id, farmerLocation.lat, farmerLocation.lng, activeJob?.status]);

  // Sun Lighting Parameters based on Time of Day (e.g. Sunset in India ~18:30 IST)
  const sunParams = useMemo(() => {
    switch (timeOfDay) {
      case 'SUNSET_INDIA':
        return {
          label: '🌅 सूर्यास्त / गोधूलि वेला (Sunset in India - 18:30 IST)',
          azimuth: 280, // West
          altitude: 14,  // Low angle -> long shadows
          shadowLength: 1.8,
          shadowAlpha: 0.45,
          shadowColor: 'rgba(30, 15, 5, 0.45)',
          ambientColor: 'rgba(255, 200, 140, 0.16)',
          skyGradient: ['#1e1b4b', '#7c2d12', '#ea580c', '#fbbf24'],
          groundTint: '#3f2d1c',
          roadColor: '#2b2a33',
          roadMarkingColor: '#f59e0b',
          glowIntensity: 1.3,
          headlightsOn: true
        };
      case 'AFTERNOON':
        return {
          label: '☀️ दोपहर का प्रखर सूर्य (Afternoon Sun - 14:00 IST)',
          azimuth: 190, // South
          altitude: 65,  // High angle -> short crisp shadows
          shadowLength: 0.4,
          shadowAlpha: 0.35,
          shadowColor: 'rgba(0, 0, 0, 0.35)',
          ambientColor: 'rgba(255, 255, 255, 0.05)',
          skyGradient: ['#0284c7', '#38bdf8', '#bae6fd', '#e0f2fe'],
          groundTint: '#1b4d24',
          roadColor: '#334155',
          roadMarkingColor: '#ffffff',
          glowIntensity: 1.0,
          headlightsOn: false
        };
      case 'MORNING':
        return {
          label: '🌄 सुबह का सुहावना समय (Morning Golden Hour - 07:30 IST)',
          azimuth: 95,  // East
          altitude: 20,
          shadowLength: 1.6,
          shadowAlpha: 0.4,
          shadowColor: 'rgba(15, 23, 42, 0.4)',
          ambientColor: 'rgba(254, 240, 138, 0.18)',
          skyGradient: ['#0f172a', '#1e3a8a', '#d97706', '#fef08a'],
          groundTint: '#1e3d23',
          roadColor: '#334155',
          roadMarkingColor: '#ffffff',
          glowIntensity: 1.1,
          headlightsOn: false
        };
      case 'NIGHT_DUSK':
        return {
          label: '🌙 रात्रि / हेडलाइट्स दृश्य (Night & Headlights - 20:30 IST)',
          azimuth: 310,
          altitude: 5,
          shadowLength: 2.2,
          shadowAlpha: 0.6,
          shadowColor: 'rgba(0, 0, 0, 0.7)',
          ambientColor: 'rgba(15, 23, 42, 0.4)',
          skyGradient: ['#030712', '#0f172a', '#1e1b4b', '#312e81'],
          groundTint: '#0c1a11',
          roadColor: '#1e293b',
          roadMarkingColor: '#facc15',
          glowIntensity: 1.6,
          headlightsOn: true
        };
    }
  }, [timeOfDay]);

  // Coordinate projection helper: converts GPS [lat, lng] to 3D Canvas space [x, y, z]
  const project3D = useCallback((
    lat: number,
    lng: number,
    altitudeMeters: number = 0,
    width: number,
    height: number,
    originLat: number,
    originLng: number,
    tiltDeg: number,
    headingDeg: number,
    zoom: number,
    pan: { x: number; y: number }
  ) => {
    // 1 degree lat is approx 111km, 1 degree lng approx 102km in Varanasi (lat ~25.3)
    const latMeters = (lat - originLat) * 111320;
    const lngMeters = (lng - originLng) * 102000;

    // Center in meters
    const scale = (zoom * 0.28); // pixels per meter baseline

    let worldX = lngMeters * scale;
    let worldY = -latMeters * scale; // negative because screen Y is down, North is positive lat
    let worldZ = altitudeMeters * scale;

    // Apply Heading rotation around Z-axis
    const headingRad = (headingDeg * Math.PI) / 180;
    const cosH = Math.cos(headingRad);
    const sinH = Math.sin(headingRad);
    const rotX = worldX * cosH - worldY * sinH;
    const rotY = worldX * sinH + worldY * cosH;

    // Apply Tilt rotation (Camera angle from vertical)
    // 0 deg = top down 2D, 45 deg = perspective ride sharing, 60 deg = cinematic
    const tiltRad = (tiltDeg * Math.PI) / 180;
    const cosT = Math.cos(tiltRad);
    const sinT = Math.sin(tiltRad);

    // Perspective foreshortening
    const depth = rotY * sinT + 600; // Eye distance
    const perspectiveFactor = 600 / Math.max(120, depth);

    const screenX = (width / 2) + (rotX * perspectiveFactor) + pan.x;
    const screenY = (height * 0.65) + ((rotY * cosT - worldZ) * perspectiveFactor) + pan.y;

    return {
      x: screenX,
      y: screenY,
      scale: perspectiveFactor,
      depth: depth,
      isVisible: depth > 100
    };
  }, []);

  // Main 3D Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    // Initialize dust/pollen atmosphere particles
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 35; i++) {
        particlesRef.current.push({
          x: Math.random() * 800,
          y: Math.random() * 500,
          size: Math.random() * 2 + 0.8,
          alpha: Math.random() * 0.4 + 0.2,
          speed: Math.random() * 0.4 + 0.2
        });
      }
    }

    const render = (currentTime: number) => {
      if (!isRunning) return;

      const deltaMs = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const width = canvas.width;
      const height = canvas.height;

      // Clear & Draw Sky Backdrop
      ctx.clearRect(0, 0, width, height);

      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.55);
      skyGrad.addColorStop(0, sunParams.skyGradient[0]);
      skyGrad.addColorStop(0.35, sunParams.skyGradient[1]);
      skyGrad.addColorStop(0.75, sunParams.skyGradient[2]);
      skyGrad.addColorStop(1, sunParams.skyGradient[3]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Camera Angles based on Mode
      let currentTilt = 45;
      let currentHeading = headingAngle;

      if (cameraMode === 'TOP_DOWN_2D') {
        currentTilt = 0;
        currentHeading = 0;
      } else if (cameraMode === 'CINEMATIC_60') {
        currentTilt = 62;
      } else if (cameraMode === 'CHASE_CAM') {
        currentTilt = 50;
        // Follow worker vehicle heading
        currentHeading = smoothedHeadingRef.current;
      }

      // Update Motion along OSRM Route
      if (activeRoute && activeRoute.coordinates.length > 1 && activeRoute.isMoving) {
        // Increment progress (complete circuit in ~35 seconds for smooth realistic demo)
        const speedFactor = 0.000032 * (activeRoute.currentSpeedKmH / 30);
        progressRef.current = (progressRef.current + deltaMs * speedFactor) % 1.0;

        const currentPos = getPositionAlongRoute(activeRoute.coordinates, progressRef.current);
        const lookAheadProgress = Math.min(1.0, progressRef.current + 0.015);
        const nextPos = getPositionAlongRoute(activeRoute.coordinates, lookAheadProgress);

        // Calculate heading in degrees from GPS vector
        const dLat = nextPos.lat - currentPos.lat;
        const dLng = nextPos.lng - currentPos.lng;
        const targetHeading = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

        // Smooth heading
        smoothedHeadingRef.current += (targetHeading - smoothedHeadingRef.current) * 0.08;

        // Calculate turning curvature to derive bike lean/tilt angle (Banking)
        const turnAngleDelta = (targetHeading - smoothedHeadingRef.current);
        const clampedLean = Math.max(-20, Math.min(20, turnAngleDelta * 1.6));
        smoothedTiltRef.current += (clampedLean - smoothedTiltRef.current) * 0.12;

        // Update Remaining Distance & ETA
        const remDist = Math.max(0.1, activeRoute.totalDistanceKm * (1 - progressRef.current));
        const remEta = Math.max(1, Math.round(activeRoute.initialEtaMinutes * (1 - progressRef.current)));
        activeRoute.remainingDistanceKm = Number(remDist.toFixed(1));
        activeRoute.remainingEtaMinutes = remEta;
        activeRoute.progressRatio = progressRef.current;
        activeRoute.currentTiltDeg = smoothedTiltRef.current;
        activeRoute.currentHeadingDeg = smoothedHeadingRef.current;
      }

      // Camera Origin (Center on Farmer or Chase Worker)
      let originLat = farmerLocation.lat;
      let originLng = farmerLocation.lng;

      if (cameraMode === 'CHASE_CAM' && activeRoute && activeRoute.coordinates.length > 0) {
        const workerPos = getPositionAlongRoute(activeRoute.coordinates, progressRef.current);
        originLat = workerPos.lat;
        originLng = workerPos.lng;
      }

      // 1. Draw 3D Ground Terrain & Crop Parcels
      const groundGrad = ctx.createLinearGradient(0, height * 0.4, 0, height);
      groundGrad.addColorStop(0, '#2d4a22');
      groundGrad.addColorStop(0.5, sunParams.groundTint);
      groundGrad.addColorStop(1, '#1b3815');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, height * 0.42, width, height * 0.58);

      // Draw agricultural grid crop plots in 3D perspective
      const plotOffsets = [
        { dLat: 0.008, dLng: -0.010, type: 'WHEAT', color: '#854d0e', pattern: '#a16207' },
        { dLat: 0.006, dLng: 0.008, type: 'PADDY', color: '#15803d', pattern: '#166534' },
        { dLat: -0.007, dLng: -0.009, type: 'MUSTARD', color: '#ca8a04', pattern: '#eab308' },
        { dLat: -0.009, dLng: 0.011, type: 'VEGGIES', color: '#166534', pattern: '#14532d' },
        { dLat: 0.015, dLng: 0.002, type: 'FALLOW', color: '#78350f', pattern: '#92400e' }
      ];

      plotOffsets.forEach((plot) => {
        const p1 = project3D(farmerLocation.lat + plot.dLat, farmerLocation.lng + plot.dLng, 0, width, height, originLat, originLng, currentTilt, currentHeading, zoomLevel, panOffset);
        const p2 = project3D(farmerLocation.lat + plot.dLat + 0.004, farmerLocation.lng + plot.dLng + 0.006, 0, width, height, originLat, originLng, currentTilt, currentHeading, zoomLevel, panOffset);
        const p3 = project3D(farmerLocation.lat + plot.dLat + 0.004, farmerLocation.lng + plot.dLng + 0.012, 0, width, height, originLat, originLng, currentTilt, currentHeading, zoomLevel, panOffset);
        const p4 = project3D(farmerLocation.lat + plot.dLat, farmerLocation.lng + plot.dLng + 0.006, 0, width, height, originLat, originLng, currentTilt, currentHeading, zoomLevel, panOffset);

        if (p1.isVisible && p2.isVisible) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();

          ctx.fillStyle = plot.color;
          ctx.fill();
          ctx.strokeStyle = plot.pattern;
          ctx.lineWidth = 1.2 * p1.scale;
          ctx.stroke();
        }
      });

      // 2. Draw 2km & 4km Radar Range Boundary Rings in 3D perspective
      const drawRadar3D = (radiusMeters: number, color: string, isDashed: boolean) => {
        const segments = 48;
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const latOffset = (Math.cos(theta) * radiusMeters) / 111320;
          const lngOffset = (Math.sin(theta) * radiusMeters) / 102000;
          const p = project3D(farmerLocation.lat + latOffset, farmerLocation.lng + lngOffset, 0, width, height, originLat, originLng, currentTilt, currentHeading, zoomLevel, panOffset);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.0;
        if (isDashed) ctx.setLineDash([8, 6]);
        else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);
      };

      drawRadar3D(2000, '#10b981', false); // 2km inner
      drawRadar3D(radiusKm * 1000, '#f59e0b', true); // Outer active radius

      // 3. Draw OSRM Road Network & Route Ribbon in 3D
      if (activeRoute && activeRoute.coordinates.length > 1) {
        const coords = activeRoute.coordinates;

        // A. Bottom Shadow of the Road Ribbon
        ctx.beginPath();
        for (let i = 0; i < coords.length; i++) {
          const p = project3D(coords[i][0], coords[i][1], 0, width, height, originLat, originLng, currentTilt, currentHeading, zoomLevel, panOffset);
          if (i === 0) ctx.moveTo(p.x + sunParams.shadowLength * 12, p.y + sunParams.shadowLength * 8);
          else ctx.lineTo(p.x + sunParams.shadowLength * 12, p.y + sunParams.shadowLength * 8);
        }
        ctx.strokeStyle = sunParams.shadowColor;
        ctx.lineWidth = 14 * zoomLevel;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // B. Base Road Surface (Asphalt)
        ctx.beginPath();
        for (let i = 0; i < coords.length; i++) {
          const p = project3D(coords[i][0], coords[i][1], 0, width, height, originLat, originLng, currentTilt, currentHeading, zoomLevel, panOffset);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = sunParams.roadColor;
        ctx.lineWidth = 12 * zoomLevel;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // C. Elevated Glowing Uber-style Route Polyline Ribbon
        ctx.beginPath();
        for (let i = 0; i < coords.length; i++) {
          const p = project3D(coords[i][0], coords[i][1], 4, width, height, originLat, originLng, currentTilt, currentHeading, zoomLevel, panOffset);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 6 * zoomLevel;
        ctx.stroke();

        // Glowing center trace line
        ctx.strokeStyle = '#6ee7b7';
        ctx.lineWidth = 2.5 * zoomLevel;
        ctx.stroke();
      }

      // 4. Draw 3D Village Trees & Rural Structures with Sun-Cast Shadows
      const ruralProps = [
        { lat: farmerLocation.lat + 0.004, lng: farmerLocation.lng - 0.005, type: 'BANYAN_TREE', heightMeters: 14 },
        { lat: farmerLocation.lat - 0.006, lng: farmerLocation.lng + 0.007, type: 'MANGO_GROVE', heightMeters: 10 },
        { lat: farmerLocation.lat + 0.009, lng: farmerLocation.lng + 0.004, type: 'FARM_HOUSE', heightMeters: 8 },
        { lat: farmerLocation.lat - 0.005, lng: farmerLocation.lng - 0.008, type: 'PALM_TREE', heightMeters: 18 }
      ];

      ruralProps.forEach((prop) => {
        const base = project3D(prop.lat, prop.lng, 0, width, height, originLat, originLng, currentTilt, currentHeading, zoomLevel, panOffset);
        const top = project3D(prop.lat, prop.lng, prop.heightMeters, width, height, originLat, originLng, currentTilt, currentHeading, zoomLevel, panOffset);

        if (base.isVisible) {
          // Dynamic Cast Shadow based on Sun Azimuth/Altitude
          const shadowX = base.x + Math.cos((sunParams.azimuth * Math.PI) / 180) * (prop.heightMeters * sunParams.shadowLength * base.scale * 1.5);
          const shadowY = base.y - Math.sin((sunParams.azimuth * Math.PI) / 180) * (prop.heightMeters * sunParams.shadowLength * base.scale * 0.8);

          ctx.beginPath();
          ctx.ellipse(shadowX, shadowY, 14 * base.scale, 7 * base.scale, (sunParams.azimuth * Math.PI) / 180, 0, Math.PI * 2);
          ctx.fillStyle = sunParams.shadowColor;
          ctx.fill();

          if (prop.type === 'FARM_HOUSE') {
            // 3D Rural Hut with Sloped Roof
            const hutW = 20 * base.scale;
            const hutH = 16 * base.scale;
            ctx.fillStyle = '#b45309'; // Mud wall
            ctx.fillRect(base.x - hutW / 2, base.y - hutH, hutW, hutH);

            // Thatched / Tile Roof
            ctx.beginPath();
            ctx.moveTo(base.x - hutW / 2 - 4, base.y - hutH);
            ctx.lineTo(base.x, top.y);
            ctx.lineTo(base.x + hutW / 2 + 4, base.y - hutH);
            ctx.closePath();
            ctx.fillStyle = '#ea580c';
            ctx.fill();
          } else {
            // 3D Tree Trunk & Canopy
            ctx.beginPath();
            ctx.moveTo(base.x, base.y);
            ctx.lineTo(top.x, top.y + 6);
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 4 * base.scale;
            ctx.stroke();

            // Canopy with depth highlight
            ctx.beginPath();
            ctx.arc(top.x, top.y, 16 * base.scale, 0, Math.PI * 2);
            ctx.fillStyle = prop.type === 'PALM_TREE' ? '#15803d' : '#166534';
            ctx.fill();

            // Sunlight highlight
            ctx.beginPath();
            ctx.arc(top.x - 4 * base.scale, top.y - 4 * base.scale, 6 * base.scale, 0, Math.PI * 2);
            ctx.fillStyle = sunParams.ambientColor;
            ctx.fill();
          }
        }
      });

      // 5. Draw Static Workers within Radius
      workers.forEach((w) => {
        if (trackedWorker && w.id === trackedWorker.id && activeRoute?.isMoving) return; // Drawn as animated 3D model below

        const p = project3D(w.location.lat, w.location.lng, 0, width, height, originLat, originLng, currentTilt, currentHeading, zoomLevel, panOffset);
        if (p.isVisible) {
          // Cast Shadow
          ctx.beginPath();
          ctx.ellipse(p.x + 4, p.y + 6, 8 * p.scale, 4 * p.scale, 0, 0, Math.PI * 2);
          ctx.fillStyle = sunParams.shadowColor;
          ctx.fill();

          // 3D Floating Marker Pin
          const isSelected = selectedWorkerId === w.id || inspectedWorkerId === w.id;
          ctx.fillStyle = isSelected ? '#f59e0b' : (w.role === 'GROUP_LEADER' ? '#ea580c' : '#2563eb');
          ctx.beginPath();
          ctx.arc(p.x, p.y - 18 * p.scale, 12 * p.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 * p.scale;
          ctx.stroke();

          // Icon / Emoji
          ctx.font = `${Math.round(12 * p.scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(w.role === 'GROUP_LEADER' ? '👥' : '🛵', p.x, p.y - 18 * p.scale);

          // Name Tag
          ctx.font = `bold ${Math.round(10 * p.scale)}px sans-serif`;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`${w.name.split(' ')[0]}`, p.x, p.y - 34 * p.scale);
        }
      });

      // 6. Draw Highly Detailed, Animated 3D Moving Worker Model (Scooter or Tractor)
      if (activeRoute && activeRoute.coordinates.length > 0) {
        const workerPos = getPositionAlongRoute(activeRoute.coordinates, progressRef.current);
        const p = project3D(workerPos.lat, workerPos.lng, 0, width, height, originLat, originLng, currentTilt, currentHeading, zoomLevel, panOffset);

        if (p.isVisible) {
          const isGroupLeader = trackedWorker?.role === 'GROUP_LEADER';
          const headingRad = ((activeRoute.currentHeadingDeg - currentHeading) * Math.PI) / 180;
          const tiltLeanRad = (activeRoute.currentTiltDeg * Math.PI) / 180; // Tilting into turns!

          ctx.save();
          ctx.translate(p.x, p.y);

          // A. Realistic Sun-Cast 3D Shadow on the Asphalt
          ctx.save();
          const shadowAngle = (sunParams.azimuth * Math.PI) / 180;
          ctx.rotate(shadowAngle);
          ctx.beginPath();
          ctx.ellipse(
            (14 * sunParams.shadowLength), 
            0, 
            (isGroupLeader ? 28 : 16) * p.scale * sunParams.shadowLength, 
            (isGroupLeader ? 14 : 8) * p.scale, 
            0, 0, Math.PI * 2
          );
          ctx.fillStyle = sunParams.shadowColor;
          ctx.fill();
          ctx.restore();

          // B. Headlight Cone in Dusk / Sunset Mode
          if (sunParams.headlightsOn) {
            ctx.save();
            ctx.rotate(headingRad);
            const lightGrad = ctx.createRadialGradient(0, -10, 2, 0, -70 * p.scale, 45 * p.scale);
            lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
            lightGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.25)');
            lightGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');

            ctx.beginPath();
            ctx.moveTo(-6, -10);
            ctx.lineTo(-30 * p.scale, -75 * p.scale);
            ctx.lineTo(30 * p.scale, -75 * p.scale);
            ctx.lineTo(6, -10);
            ctx.closePath();
            ctx.fillStyle = lightGrad;
            ctx.fill();
            ctx.restore();
          }

          // C. Rotate and Lean Model along road trajectory
          ctx.rotate(headingRad);

          if (isGroupLeader) {
            // --- 3D TRACTOR & TROLLEY WITH CREW MODEL ---
            const tractorScale = 1.4 * p.scale * zoomLevel;

            // 1. Trailer attached behind
            ctx.fillStyle = '#1e3a8a'; // Blue steel trolley
            ctx.fillRect(-14 * tractorScale, 10 * tractorScale, 28 * tractorScale, 30 * tractorScale);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-14 * tractorScale, 10 * tractorScale, 28 * tractorScale, 30 * tractorScale);

            // Crew heads in trolley
            ctx.fillStyle = '#fbbf24';
            for (let r = 0; r < 2; r++) {
              for (let c = 0; c < 3; c++) {
                ctx.beginPath();
                ctx.arc((-8 + c * 8) * tractorScale, (16 + r * 10) * tractorScale, 3.2 * tractorScale, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // 2. Tractor Main Chassis & Engine Hood
            ctx.fillStyle = '#dc2626'; // Mahindra Red
            ctx.fillRect(-10 * tractorScale, -18 * tractorScale, 20 * tractorScale, 26 * tractorScale);

            // 3. Huge Rear Lug Wheels & Front Wheels
            ctx.fillStyle = '#111827';
            ctx.fillRect(-15 * tractorScale, -4 * tractorScale, 5 * tractorScale, 16 * tractorScale);
            ctx.fillRect(10 * tractorScale, -4 * tractorScale, 5 * tractorScale, 16 * tractorScale);
            ctx.fillRect(-12 * tractorScale, -16 * tractorScale, 4 * tractorScale, 8 * tractorScale);
            ctx.fillRect(8 * tractorScale, -16 * tractorScale, 4 * tractorScale, 8 * tractorScale);

            // 4. Exhaust stack smoke puffs
            ctx.fillStyle = 'rgba(209, 213, 219, 0.5)';
            ctx.beginPath();
            ctx.arc(6 * tractorScale, -22 * tractorScale, (3 + Math.sin(currentTime * 0.01) * 2) * tractorScale, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // --- 3D SCOOTER 🛵 WITH RIDER (TILTING ON TURNS) ---
            const bikeScale = 1.3 * p.scale * zoomLevel;

            // Apply turn lean (Banking)
            ctx.rotate(tiltLeanRad);

            // 1. Scooter Chassis (Uber Green / Rapido Yellow)
            ctx.fillStyle = '#eab308'; // Bright Rapido Yellow
            ctx.beginPath();
            ctx.roundRect(-5 * bikeScale, -18 * bikeScale, 10 * bikeScale, 32 * bikeScale, 4);
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // 2. Spinning Wheels (Front & Rear)
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(-2.5 * bikeScale, -22 * bikeScale, 5 * bikeScale, 8 * bikeScale);
            ctx.fillRect(-2.5 * bikeScale, 8 * bikeScale, 5 * bikeScale, 8 * bikeScale);

            // 3. Handlebars
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2.5 * bikeScale;
            ctx.beginPath();
            ctx.moveTo(-10 * bikeScale, -14 * bikeScale);
            ctx.lineTo(10 * bikeScale, -14 * bikeScale);
            ctx.stroke();

            // 4. Worker Driver (Helmet & Uniform)
            ctx.fillStyle = '#166534'; // Green uniform
            ctx.beginPath();
            ctx.arc(0, -2 * bikeScale, 6 * bikeScale, 0, Math.PI * 2);
            ctx.fill();

            // Helmet (White with visor)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -4 * bikeScale, 4.5 * bikeScale, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#111827';
            ctx.fillRect(-3 * bikeScale, -7 * bikeScale, 6 * bikeScale, 2 * bikeScale);
          }

          ctx.restore();

          // Floating Live Status Badge above 3D Model
          ctx.font = `bold ${Math.round(11 * p.scale)}px sans-serif`;
          ctx.fillStyle = '#111827';
          const etaText = `⚡ ${activeRoute.currentSpeedKmH} km/h • ${activeRoute.remainingEtaMinutes} min`;
          const textW = ctx.measureText(etaText).width;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.beginPath();
          ctx.roundRect(p.x - textW / 2 - 8, p.y - 38 * p.scale, textW + 16, 20, 8);
          ctx.fill();
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#065f46';
          ctx.fillText(etaText, p.x, p.y - 25 * p.scale);
        }
      }

      // 7. Draw Farmer Destination (3D Pin with Glowing Radar Waves)
      const farmP = project3D(farmerLocation.lat, farmerLocation.lng, 0, width, height, originLat, originLng, currentTilt, currentHeading, zoomLevel, panOffset);
      if (farmP.isVisible) {
        // Ground Ripple Ping
        const pingRadius = (22 + (Math.sin(currentTime * 0.005) * 8)) * farmP.scale;
        ctx.beginPath();
        ctx.arc(farmP.x, farmP.y, pingRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 3D Flagpole / Pin
        ctx.beginPath();
        ctx.moveTo(farmP.x, farmP.y);
        ctx.lineTo(farmP.x, farmP.y - 32 * farmP.scale);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3 * farmP.scale;
        ctx.stroke();

        // 3D Destination Head
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(farmP.x, farmP.y - 32 * farmP.scale, 14 * farmP.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * farmP.scale;
        ctx.stroke();

        ctx.font = `${Math.round(14 * farmP.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚜', farmP.x, farmP.y - 32 * farmP.scale);

        // Destination Tag
        ctx.font = `bold ${Math.round(11 * farmP.scale)}px sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('आपका खेत (Farm Destination)', farmP.x, farmP.y - 50 * farmP.scale);
      }

      // 8. Atmosphere Particles (Dust/Pollen in Golden Hour Sun)
      ctx.fillStyle = sunParams.ambientColor;
      particlesRef.current.forEach((pt) => {
        pt.x = (pt.x + pt.speed) % width;
        pt.y = (pt.y + Math.sin(currentTime * 0.002) * 0.5) % height;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    farmerLocation.lat,
    farmerLocation.lng,
    workers,
    activeRoute,
    cameraMode,
    timeOfDay,
    zoomLevel,
    panOffset,
    headingAngle,
    sunParams,
    selectedWorkerId,
    inspectedWorkerId,
    project3D,
    radiusKm
  ]);

  // Handle Canvas Resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = Math.max(120, rect.height);
    };

    handleResize();
    const timeoutId = setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isCollapsed]);

  // Handle Drag / Pan Interaction on 3D Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelectLocation || (activeStatus && activeStatus !== 'SEARCHING')) return;
    // Allow dropping farm pin nearby
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left - (rect.width / 2) - panOffset.x;
    const clickY = e.clientY - rect.top - (rect.height * 0.65) - panOffset.y;

    // Inverse approx
    const deltaLng = clickX / (zoomLevel * 0.28 * 102000);
    const deltaLat = -clickY / (zoomLevel * 0.28 * 111320);

    onSelectLocation({
      lat: Number((farmerLocation.lat + deltaLat).toFixed(4)),
      lng: Number((farmerLocation.lng + deltaLng).toFixed(4)),
      villageName: 'खेत स्थान (3D चयनित पिन)',
      district: 'वाराणसी',
      landmark: '3D दृश्य में चिन्हित खेत'
    });
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full rounded-2xl overflow-hidden border border-gray-300 shadow-md select-none bg-gray-950 transition-all duration-300 ${
        isCollapsed ? 'h-[125px] sm:h-[135px]' : 'h-[460px] sm:h-[500px]'
      }`}
    >
      {/* 3D Perspective WebGL/Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Prominent High-Contrast Map Visibility Toggle Button (Top-Left) */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'मैप बड़ा करें (3D View)' : 'मैप छोटा करें / Form देखें'}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xl cursor-pointer border ${
            isCollapsed
              ? 'bg-amber-400 hover:bg-amber-300 text-gray-950 border-amber-500 ring-2 ring-amber-400/50'
              : 'bg-black/85 hover:bg-black text-amber-300 hover:text-amber-200 border-amber-400/50 backdrop-blur-md'
          }`}
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-4 h-4 text-gray-950 stroke-[3]" />
              <span>🗺️ मैप बड़ा करें (3D दृश्य)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 text-amber-400 stroke-[3]" />
              <span>मैप छिपाएं / Form देखें</span>
            </>
          )}
        </button>

        {/* Dynamic "3D View Toggled" Visual Cue Badge (Only when not collapsed) */}
        {!isCollapsed && show3DCue && (
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg animate-scale-up">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>
              {cameraMode === 'PERSPECTIVE_45'
                ? '3D चालू (45° View)'
                : cameraMode === 'CHASE_CAM'
                ? 'ड्राइवर फॉलो कैमरा'
                : cameraMode === 'CINEMATIC_60'
                ? '60° सिनेमैटिक'
                : '2D दृश्य'}
            </span>
          </div>
        )}
      </div>

      {/* Collapsed State Summary Pill Banner (Interactive card mode) */}
      {isCollapsed && (
        <div className="absolute inset-x-3 bottom-2 z-20 flex items-center justify-between bg-black/85 border border-amber-400/30 backdrop-blur-md px-3 py-1.5 rounded-xl text-white shadow-lg">
          <div className="flex items-center gap-2 text-xs truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
            <span className="text-emerald-300 font-semibold truncate">
              {activeRoute 
                ? `🛵 मजदूर रास्ते में • ${activeRoute.remainingEtaMinutes} min ETA`
                : `📍 3D रडार सक्रिय • ${workers.length} मजदूर उपलब्ध`}
            </span>
          </div>
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-lg cursor-pointer shrink-0 ml-2"
          >
            <span>बड़ा करें</span>
            <ChevronUp className="w-3 h-3 text-amber-300" />
          </button>
        </div>
      )}

      {/* Top Right: Camera Mode & Lighting Toggles (Hidden in collapsed mode to keep clean) */}
      {!isCollapsed && (
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          {/* Camera Perspective Selector */}
          <div className="flex items-center gap-1 bg-black/75 border border-white/20 backdrop-blur-md p-1 rounded-xl shadow-lg">
            <button
              onClick={() => setCameraMode('PERSPECTIVE_45')}
              title="45° Ride-Sharing 3D Perspective"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cameraMode === 'PERSPECTIVE_45'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              45° 3D
            </button>

            <button
              onClick={() => setCameraMode('CHASE_CAM')}
              title="Driver POV Chase Camera"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                cameraMode === 'CHASE_CAM'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Video className="w-3 h-3" />
              फॉलो
            </button>

            <button
              onClick={() => setCameraMode('CINEMATIC_60')}
              title="Cinematic 60° View"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cameraMode === 'CINEMATIC_60'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              60°
            </button>

            <button
              onClick={() => setCameraMode('TOP_DOWN_2D')}
              title="Top Down 2D Map"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cameraMode === 'TOP_DOWN_2D'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              2D
            </button>
          </div>

          {/* Dynamic Sun Lighting / Time of Day Mode */}
          <div className="flex items-center justify-end gap-1 bg-black/75 border border-white/20 backdrop-blur-md p-1 rounded-xl shadow-lg">
            <button
              onClick={() => setTimeOfDay('SUNSET_INDIA')}
              title="सूर्यास्त / गोधूलि वेला (India Sunset 18:30 IST)"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeOfDay === 'SUNSET_INDIA' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sunset className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setTimeOfDay('AFTERNOON')}
              title="दोपहर (Afternoon Sun)"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeOfDay === 'AFTERNOON' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setTimeOfDay('NIGHT_DUSK')}
              title="रात्रि व हेडलाइट्स (Night & Headlamps)"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeOfDay === 'NIGHT_DUSK' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom In / Out Controls */}
          <div className="flex items-center justify-end gap-1 bg-black/75 border border-white/20 backdrop-blur-md p-1 rounded-xl shadow-lg">
            <button
              onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
              className="w-7 h-7 flex items-center justify-center text-white font-bold hover:bg-white/20 rounded-lg cursor-pointer text-sm"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.25))}
              className="w-7 h-7 flex items-center justify-center text-white font-bold hover:bg-white/20 rounded-lg cursor-pointer text-sm"
            >
              -
            </button>
            <button
              onClick={() => { setPanOffset({ x: 0, y: 0 }); setZoomLevel(1.2); }}
              title="Reset Camera"
              className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 rounded-lg cursor-pointer text-xs"
            >
              ↺
            </button>
          </div>
        </div>
      )}

      {/* Floating Uber/Rapido Style Live ETA & Tracking HUD (Shown when expanded) */}
      {!isCollapsed && activeRoute && (
        <div className="absolute bottom-4 left-4 right-4 z-20 max-w-lg mx-auto">
          <div className="bg-gray-900/90 border border-white/20 backdrop-blur-xl text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl space-y-3">
            {/* Top Row: Worker Details + Live ETA badge */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-emerald-700/80 border border-emerald-400 flex items-center justify-center text-2xl shadow-inner">
                    {trackedWorker?.role === 'GROUP_LEADER' ? '👥' : '🛵'}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-gray-900 animate-pulse"></span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white tracking-tight">
                      {trackedWorker?.name || 'कुशल कृषि श्रमिक'}
                    </h4>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-amber-500/30 flex items-center gap-0.5">
                      ★ {trackedWorker?.rating || 4.9}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">
                    {trackedWorker?.role === 'GROUP_LEADER'
                      ? `🚜 ट्रैक्टर ट्रॉली • ${trackedWorker?.teamSize || 6} जन की टोली`
                      : '🛵 टीवीएस हैवी ड्यूटी • कुशल कामगार'}
                  </p>
                </div>
              </div>

              {/* Big Ride-Sharing Live ETA */}
              <div className="text-right shrink-0">
                <div className="text-emerald-400 font-extrabold text-lg sm:text-xl flex items-center justify-end gap-1">
                  <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>{activeRoute.remainingEtaMinutes} मिनट</span>
                </div>
                <div className="text-[11px] text-gray-300 font-medium">
                  {activeRoute.remainingDistanceKm} किमी शेष
                </div>
              </div>
            </div>

            {/* Middle: Turn-by-Turn Instruction Banner */}
            <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold truncate">
                <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0 rotate-45" />
                <span className="truncate">{activeRoute.nextTurnText}</span>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono shrink-0">
                ⚡ {activeRoute.currentSpeedKmH} km/h
              </span>
            </div>

            {/* Bottom: Animated Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(8, activeRoute.progressRatio * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold pt-0.5">
                <span>प्रस्थान: {trackedWorker?.location.villageName || 'गाँव'}</span>
                <span className="text-emerald-400">खेत आगमन: 2–4 किमी दायरा</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sun Lighting Subtitle Badge */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-amber-200 text-[11px] px-3 py-1 rounded-full border border-white/10">
          <Sun className="w-3 h-3 text-amber-400" />
          <span>{sunParams.label.split('(')[0]}</span>
        </div>
      )}
    </div>
  );
};

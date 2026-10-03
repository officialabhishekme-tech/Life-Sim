import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { InteractiveZone, WeatherType, Vitals, CharacterGender } from '../types/game';
import { sounds } from '../utils/audio';

interface GameCanvasProps {
  gender: CharacterGender;
  weather: WeatherType;
  vitals: Vitals;
  gameHour: number;
  isVomiting?: boolean;
  onNearZoneChange: (zone: InteractiveZone | null, distance: number | null) => void;
  onInteract: (zone: InteractiveZone) => void;
}

export const INTERACTIVE_ZONES: InteractiveZone[] = [
  {
    id: 'bank_main',
    name: 'Bank of Metropolis',
    type: 'bank',
    position: [0, 0, -16.2],
    radius: 3.5,
    label: 'Bank Entrance Door',
    description: 'Open checking account, get debit card & initial $1,500 grant',
  },
  {
    id: 'sim_hub',
    name: 'Nova Telecom',
    type: 'sim',
    position: [17.5, 0, -10],
    radius: 3.5,
    label: 'Nova Telecom Door',
    description: 'Activate SIM card & unlock peer-to-peer transfers',
  },
  {
    id: 'market_cafe',
    name: 'Metro Supermarket & Cafe',
    type: 'market',
    position: [-17.5, 0, -10],
    radius: 3.5,
    label: 'Market & Cafe Door',
    description: 'Buy food (breakfast, lunch, dinner) and water bottles',
  },
  {
    id: 'restaurant_door',
    name: 'Bella Vista Bistro & Restaurant',
    type: 'restaurant',
    position: [15.5, 0, 12],
    radius: 3.8,
    label: 'Restaurant Entrance Door',
    description: 'Dine in for gourmet chef meals, breakfast, lunch & dinner',
  },
  {
    id: 'casino_studio',
    name: 'Metropolis Royale Casino & Studio',
    type: 'casino',
    position: [-16.0, 0, 14],
    radius: 3.8,
    label: 'Casino & Gambling Studio Door',
    description: 'Play Slots, Blackjack & Roulette! Bet and earn massive cash payouts',
  },
  {
    id: 'home_bed',
    name: 'Cozy Loft Apartment',
    type: 'home',
    position: [0, 0, 16.2],
    radius: 3.5,
    label: 'Apartment Residence Door',
    description: 'Sleep to recover 100% fatigue and restore physical health',
  },
  {
    id: 'water_fountain',
    name: 'Central Water Fountain',
    type: 'fountain',
    position: [-10, 0, 10],
    radius: 3.2,
    label: 'Fresh Water Fountain',
    description: 'Drink clean drinking water to hydrate for free',
  },
];

interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface CircleCollider {
  x: number;
  z: number;
  radius: number;
}

const PLAYER_RADIUS = 0.55;

const BUILDING_COLLIDERS: BoxCollider[] = [
  // Bank of Metropolis: center [0, -22], size [16, 9, 10], front wall at Z = -17
  { minX: -8.0 - PLAYER_RADIUS, maxX: 8.0 + PLAYER_RADIUS, minZ: -27.0 - PLAYER_RADIUS, maxZ: -17.0 },

  // Nova Telecom: center [24, -10], size [12, 10, 10], west wall at X = 18
  { minX: 18.0, maxX: 30.0 + PLAYER_RADIUS, minZ: -15.0 - PLAYER_RADIUS, maxZ: -5.0 + PLAYER_RADIUS },

  // Metro Market & Cafe: center [-24, -10], size [12, 7, 10], east wall at X = -18
  { minX: -30.0 - PLAYER_RADIUS, maxX: -18.0, minZ: -15.0 - PLAYER_RADIUS, maxZ: -5.0 + PLAYER_RADIUS },

  // Bella Vista Restaurant & Bistro: center [22, 12], size [12, 8, 10], door on west wall at X = 16
  { minX: 16.0, maxX: 28.0 + PLAYER_RADIUS, minZ: 7.0 - PLAYER_RADIUS, maxZ: 17.0 + PLAYER_RADIUS },

  // Player Apartment (Home): center [0, 22], size [14, 11, 10], north wall at Z = 17
  { minX: -7.0 - PLAYER_RADIUS, maxX: 7.0 + PLAYER_RADIUS, minZ: 17.0, maxZ: 27.0 + PLAYER_RADIUS },

  // Metropolis Royale Casino & Gaming Studio: center [-22, 14], size [12, 8.5, 10], door on east wall at X = -16
  { minX: -28.0 - PLAYER_RADIUS, maxX: -16.0, minZ: 9.0 - PLAYER_RADIUS, maxZ: 19.0 + PLAYER_RADIUS },
];

const CIRCLE_COLLIDERS: CircleCollider[] = [
  // Central Water Fountain basin
  { x: -10, z: 10, radius: 2.8 + PLAYER_RADIUS },

  // Decorative City Trees trunks
  { x: -14, z: 6, radius: 0.45 + PLAYER_RADIUS },
  { x: -10, z: 22, radius: 0.45 + PLAYER_RADIUS },
  { x: -6, z: 14, radius: 0.45 + PLAYER_RADIUS },
  { x: 14, z: 6, radius: 0.45 + PLAYER_RADIUS },
  { x: 14, z: -4, radius: 0.45 + PLAYER_RADIUS },
  { x: -14, z: -4, radius: 0.45 + PLAYER_RADIUS },
  { x: 8, z: 16, radius: 0.45 + PLAYER_RADIUS },
  { x: -8, z: -16, radius: 0.45 + PLAYER_RADIUS },

  // Streetlight poles
  { x: 8, z: -8, radius: 0.25 + PLAYER_RADIUS },
  { x: -8, z: -8, radius: 0.25 + PLAYER_RADIUS },
  { x: 8, z: 8, radius: 0.25 + PLAYER_RADIUS },
  { x: -8, z: 8, radius: 0.25 + PLAYER_RADIUS },
];

function isWorldColliding(x: number, z: number): boolean {
  // World boundary check
  if (x < -68 || x > 68 || z < -68 || z > 68) return true;

  // Check building boxes
  for (let i = 0; i < BUILDING_COLLIDERS.length; i++) {
    const b = BUILDING_COLLIDERS[i];
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
      return true;
    }
  }

  // Check circular obstacles (trees, fountain, poles)
  for (let i = 0; i < CIRCLE_COLLIDERS.length; i++) {
    const c = CIRCLE_COLLIDERS[i];
    const dx = x - c.x;
    const dz = z - c.z;
    if (dx * dx + dz * dz < c.radius * c.radius) {
      return true;
    }
  }

  return false;
}

// Helper: Generates crisp, high-visibility 2D Canvas business sign textures
function createSignboardTexture(
  mainText: string,
  subText: string,
  icon: string,
  opts?: {
    bgColor?: string;
    textColor?: string;
    accentColor?: string;
    subColor?: string;
    glowColor?: string;
    badgeBg?: string;
  }
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const bgColor = opts?.bgColor || '#090d16';
    const textColor = opts?.textColor || '#ffffff';
    const accentColor = opts?.accentColor || '#f59e0b';
    const subColor = opts?.subColor || '#94a3b8';
    const glowColor = opts?.glowColor || accentColor;
    const badgeBg = opts?.badgeBg || accentColor;

    // Background Fill
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glowing Neon Border
    ctx.lineWidth = 14;
    ctx.strokeStyle = accentColor;
    ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);

    // Subtle inner border trim
    ctx.lineWidth = 3;
    ctx.strokeStyle = glowColor;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Icon Circle Badge
    ctx.fillStyle = badgeBg;
    ctx.beginPath();
    ctx.arc(115, 128, 62, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Emoji icon
    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 115, 130);

    // Main Business Name Text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = textColor;
    ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.fillText(mainText, 205, 115);

    // Subtitle / Business Category
    ctx.shadowBlur = 0;
    ctx.fillStyle = subColor;
    ctx.font = 'bold 23px system-ui, -apple-system, sans-serif';
    ctx.fillText(subText, 208, 175);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Helper: Generates a 3D Marquee Signboard Mesh
function createSignboardMesh(
  width: number,
  height: number,
  texture: THREE.CanvasTexture,
  frameColor: number = 0x1e293b,
  emissiveIntensity: number = 0.65
): THREE.Group {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: frameColor,
    roughness: 0.4,
    metalness: 0.7,
  });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.25, height + 0.25, 0.25), frameMat);
  frame.castShadow = true;
  group.add(frame);

  const frontMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.2,
    metalness: 0.1,
    emissiveMap: texture,
    emissive: 0xffffff,
    emissiveIntensity: emissiveIntensity,
  });
  const frontFace = new THREE.Mesh(new THREE.PlaneGeometry(width, height), frontMat);
  frontFace.position.z = 0.13;
  group.add(frontFace);

  return group;
}

// Helper: Generates a 3D Double-Sided Projecting Blade Sign on building corners
function createBladeSign(
  icon: string,
  shortName: string,
  accentColor: string,
  bgColor: string = '#090d16'
): THREE.Group {
  const group = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 512, 256);
    ctx.lineWidth = 10;
    ctx.strokeStyle = accentColor;
    ctx.strokeRect(5, 5, 502, 246);

    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 100, 128);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(shortName, 175, 142);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    emissiveMap: texture,
    emissive: 0xffffff,
    emissiveIntensity: 0.6,
    roughness: 0.3,
  });

  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 0.12), mat);
  group.add(signMesh);

  const bracketMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 });
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8), bracketMat);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(-0.1, 0.7, 0);
  group.add(arm);

  return group;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gender,
  weather,
  vitals,
  gameHour,
  isVomiting = false,
  onNearZoneChange,
  onInteract,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeZoneRef = useRef<InteractiveZone | null>(null);
  const [activeZone, setActiveZone] = useState<InteractiveZone | null>(null);

  // Dynamic prop refs so useEffect doesn't tear down WebGL canvas
  const genderRef = useRef(gender);
  const weatherRef = useRef(weather);
  const vitalsRef = useRef(vitals);
  const gameHourRef = useRef(gameHour);
  const isVomitingRef = useRef(isVomiting);
  const onNearZoneChangeRef = useRef(onNearZoneChange);
  const onInteractRef = useRef(onInteract);

  useEffect(() => {
    genderRef.current = gender;
  }, [gender]);

  useEffect(() => {
    weatherRef.current = weather;
  }, [weather]);

  useEffect(() => {
    vitalsRef.current = vitals;
  }, [vitals]);

  useEffect(() => {
    gameHourRef.current = gameHour;
  }, [gameHour]);

  useEffect(() => {
    isVomitingRef.current = isVomiting;
  }, [isVomiting]);

  useEffect(() => {
    onNearZoneChangeRef.current = onNearZoneChange;
  }, [onNearZoneChange]);

  useEffect(() => {
    onInteractRef.current = onInteract;
  }, [onInteract]);

  // Character position & movement ref
  const playerState = useRef({
    pos: new THREE.Vector3(0, 0, 0),
    rotationY: 0,
    velocity: new THREE.Vector3(0, 0, 0),
    isMoving: false,
    isSprinting: false,
    animTime: 0,
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const cameraAngle = useRef({ theta: 0, phi: 0.35, distance: 9 });
  const isDraggingMouse = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      250
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    sunLight.position.set(30, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    const shadowD = 40;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    scene.add(sunLight);

    // 3. Ground & Road Network
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // dark slate asphalt
      roughness: 0.8,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Sidewalks & Plaza
    const plazaGeo = new THREE.PlaneGeometry(36, 36);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.02, 0);
    plaza.receiveShadow = true;
    scene.add(plaza);

    // Road markings (Crosswalks)
    for (let i = -12; i <= 12; i += 3) {
      const stripeGeo = new THREE.PlaneGeometry(0.8, 4);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(i, 0.03, -16);
      scene.add(stripe);

      const stripe2 = stripe.clone();
      stripe2.position.set(i, 0.03, 16);
      scene.add(stripe2);
    }

    // 4. Buildings & City Landmarks
    const buildingsGroup = new THREE.Group();

    // BANK OF METROPOLIS (North: [0, 0, -22])
    const bankGroup = new THREE.Group();
    bankGroup.position.set(0, 0, -22);

    // Main Bank Hall
    const bankMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
    const bankMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 9, 10), bankMat);
    bankMesh.position.y = 4.5;
    bankMesh.castShadow = true;
    bankMesh.receiveShadow = true;
    bankGroup.add(bankMesh);

    // Bank Roof Pediment / Triangle
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 }); // gold accent
    const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(9.5, 3, 4), roofMat);
    roofMesh.position.y = 10.5;
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.castShadow = true;
    bankGroup.add(roofMesh);

    // Bank Pillars
    for (let p = -6; p <= 6; p += 4) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
      );
      pillar.position.set(p, 4, 5.2);
      pillar.castShadow = true;
      bankGroup.add(pillar);
    }

    // Bank Marquee Board & Projecting Blade Sign
    const bankTexture = createSignboardTexture(
      'BANK OF METROPOLIS',
      'NATIONAL FINANCIAL DISTRICT • CHECKING & DEBIT',
      '🏛️',
      { accentColor: '#f59e0b', bgColor: '#090d16', glowColor: '#fbbf24', badgeBg: '#d97706' }
    );
    const bankBoard = createSignboardMesh(10.5, 1.6, bankTexture, 0x1e293b, 0.75);
    bankBoard.position.set(0, 7.8, 5.25);
    bankGroup.add(bankBoard);

    const bankBlade = createBladeSign('🏛️', 'METRO BANK', '#f59e0b', '#090d16');
    bankBlade.position.set(-6.5, 4.2, 5.2);
    bankBlade.rotation.y = Math.PI / 2;
    bankGroup.add(bankBlade);

    buildingsGroup.add(bankGroup);

    // NOVA TELECOM (East: [24, 0, -10])
    const simGroup = new THREE.Group();
    simGroup.position.set(24, 0, -10);

    const simMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3 });
    const simMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 10, 10), simMat);
    simMesh.position.y = 5;
    simMesh.castShadow = true;
    simMesh.receiveShadow = true;
    simGroup.add(simMesh);

    // 5G Telecom Antenna Tower
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.4, 7, 8),
      new THREE.MeshStandardMaterial({ color: 0x818cf8, emissive: 0x4f46e5, emissiveIntensity: 0.8 })
    );
    tower.position.set(0, 13.5, 0);
    simGroup.add(tower);

    // Nova Telecom Marquee Board & Projecting Blade Sign
    const simTexture = createSignboardTexture(
      'NOVA TELECOM 5G',
      'HIGH SPEED DATA • SIM ACTIVATION & MOBILE PAY',
      '📱',
      { accentColor: '#a855f7', bgColor: '#1e1b4b', glowColor: '#c084fc', badgeBg: '#7c3aed' }
    );
    const simBoard = createSignboardMesh(9.4, 1.6, simTexture, 0x1e1b4b, 0.8);
    simBoard.position.set(-6.15, 6.2, 0);
    simBoard.rotation.y = -Math.PI / 2;
    simGroup.add(simBoard);

    const simBlade = createBladeSign('📱', 'NOVA 5G', '#a855f7', '#1e1b4b');
    simBlade.position.set(-6.15, 4.2, 4.2);
    simGroup.add(simBlade);

    buildingsGroup.add(simGroup);

    // METRO MARKET & CAFE (West: [-24, 0, -10])
    const marketGroup = new THREE.Group();
    marketGroup.position.set(-24, 0, -10);

    const marketMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.5 });
    const marketMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 10), marketMat);
    marketMesh.position.y = 3.5;
    marketMesh.castShadow = true;
    marketMesh.receiveShadow = true;
    marketGroup.add(marketMesh);

    // Market Awning (Striped)
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(11, 0.4, 2.5),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 })
    );
    awning.position.set(5.2, 3.8, 0);
    awning.rotation.y = Math.PI / 2;
    awning.rotation.z = -0.2;
    marketGroup.add(awning);

    // Metro Market Marquee Board & Projecting Blade Sign
    const marketTexture = createSignboardTexture(
      'METRO MARKET & CAFE',
      'FRESH GROCERIES • HOT MEALS • COLD DRINKS',
      '🛒',
      { accentColor: '#10b981', bgColor: '#064e3b', glowColor: '#34d399', badgeBg: '#059669' }
    );
    const marketBoard = createSignboardMesh(9.5, 1.6, marketTexture, 0x064e3b, 0.8);
    marketBoard.position.set(6.15, 5.8, 0);
    marketBoard.rotation.y = Math.PI / 2;
    marketGroup.add(marketBoard);

    const marketBlade = createBladeSign('🛒', 'MARKET', '#10b981', '#064e3b');
    marketBlade.position.set(6.15, 4.2, 4.2);
    marketGroup.add(marketBlade);

    buildingsGroup.add(marketGroup);

    // PLAYER APARTMENT (South: [0, 0, 22])
    const homeGroup = new THREE.Group();
    homeGroup.position.set(0, 0, 22);

    const homeMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const homeMesh = new THREE.Mesh(new THREE.BoxGeometry(14, 11, 10), homeMat);
    homeMesh.position.y = 5.5;
    homeMesh.castShadow = true;
    homeMesh.receiveShadow = true;
    homeGroup.add(homeMesh);

    // Balcony & Entrance Door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3.5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.5 })
    );
    door.position.set(0, 1.75, -5.1);
    homeGroup.add(door);

    // Metro Lofts Residence Marquee Board & Blade Sign
    const homeTexture = createSignboardTexture(
      'METRO LOFTS RESIDENCE',
      'CITIZEN APARTMENTS • BEDROOM & SLEEP RETREAT',
      '🏠',
      { accentColor: '#6366f1', bgColor: '#0f172a', glowColor: '#818cf8', badgeBg: '#4f46e5' }
    );
    const homeBoard = createSignboardMesh(9.5, 1.6, homeTexture, 0x1e293b, 0.7);
    homeBoard.position.set(0, 5.6, -5.15);
    homeBoard.rotation.y = Math.PI;
    homeGroup.add(homeBoard);

    const homeBlade = createBladeSign('🏠', 'LOFTS', '#6366f1', '#0f172a');
    homeBlade.position.set(-5.5, 4.2, -5.15);
    homeBlade.rotation.y = Math.PI / 2;
    homeGroup.add(homeBlade);

    buildingsGroup.add(homeGroup);

    // BELLA VISTA RESTAURANT & BISTRO (East Plaza: [22, 0, 12])
    const restaurantGroup = new THREE.Group();
    restaurantGroup.position.set(22, 0, 12);

    const restMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.5 }); // warm terracotta brick
    const restMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 10), restMat);
    restMesh.position.y = 4;
    restMesh.castShadow = true;
    restMesh.receiveShadow = true;
    restaurantGroup.add(restMesh);

    // Awning (Crimson/Bordeaux Restaurant Canopy)
    const restAwning = new THREE.Mesh(
      new THREE.BoxGeometry(11, 0.4, 3),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 })
    );
    restAwning.position.set(-6.1, 4.2, 0);
    restAwning.rotation.y = Math.PI / 2;
    restAwning.rotation.z = 0.2;
    restaurantGroup.add(restAwning);

    // Bella Vista Bistro Marquee Board & Blade Sign
    const restTexture = createSignboardTexture(
      'BELLA VISTA BISTRO',
      'AUTHENTIC ITALIAN FINE DINING & PATIO',
      '🍝',
      { accentColor: '#f59e0b', bgColor: '#450a0a', glowColor: '#fbbf24', badgeBg: '#b91c1c' }
    );
    const restBoard = createSignboardMesh(9.5, 1.6, restTexture, 0x450a0a, 0.8);
    restBoard.position.set(-6.15, 6.0, 0);
    restBoard.rotation.y = -Math.PI / 2;
    restaurantGroup.add(restBoard);

    const restBlade = createBladeSign('🍝', 'BISTRO', '#f59e0b', '#450a0a');
    restBlade.position.set(-6.15, 4.2, -4.2);
    restaurantGroup.add(restBlade);

    // Outdoor Terrace Dining Table & Chairs
    const tableMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 })
    );
    tableMesh.position.set(-8.5, 0.85, -2.5);
    tableMesh.castShadow = true;
    restaurantGroup.add(tableMesh);

    const tablePole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.85, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    tablePole.position.set(-8.5, 0.42, -2.5);
    restaurantGroup.add(tablePole);

    const umbrella = new THREE.Mesh(
      new THREE.ConeGeometry(2.2, 0.9, 12),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 })
    );
    umbrella.position.set(-8.5, 2.4, -2.5);
    restaurantGroup.add(umbrella);

    buildingsGroup.add(restaurantGroup);

    // METROPOLIS ROYALE CASINO & GAMING STUDIO (South-West: [-22, 0, 14])
    const casinoGroup = new THREE.Group();
    casinoGroup.position.set(-22, 0, 14);

    // Main casino structure (Luxury Obsidian Black & Gold)
    const casinoMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.35,
      metalness: 0.45,
    });
    const casinoMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 8.5, 10), casinoMat);
    casinoMesh.position.y = 4.25;
    casinoMesh.castShadow = true;
    casinoMesh.receiveShadow = true;
    casinoGroup.add(casinoMesh);

    // Gold Trim & Cornice Columns
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0xd97706,
      emissiveIntensity: 0.15,
    });
    const goldRoofTrim = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.5, 10.4), goldMat);
    goldRoofTrim.position.y = 8.5;
    casinoGroup.add(goldRoofTrim);

    // Decorative Gold Pilasters
    [-4.5, 4.5].forEach((offsetZ) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 8.5, 12), goldMat);
      pillar.position.set(6.05, 4.25, offsetZ);
      casinoGroup.add(pillar);
    });

    // Casino Canopy / Marquee
    const casinoCanopy = new THREE.Mesh(
      new THREE.BoxGeometry(11, 0.5, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3 })
    );
    casinoCanopy.position.set(6.1, 4.3, 0);
    casinoCanopy.rotation.y = Math.PI / 2;
    casinoGroup.add(casinoCanopy);

    // Glowing Neon Marquee Board: ROYALE CASINO & GAMING STUDIO
    const casinoTexture = createSignboardTexture(
      'ROYALE CASINO & STUDIO',
      'VIP HIGH ROLLER • SLOTS, BLACKJACK & ROULETTE',
      '🎰',
      { accentColor: '#facc15', bgColor: '#090d16', glowColor: '#eab308', badgeBg: '#d97706' }
    );
    const casinoBoard = createSignboardMesh(10.2, 1.8, casinoTexture, 0x090d16, 0.85);
    casinoBoard.position.set(6.15, 6.0, 0);
    casinoBoard.rotation.y = Math.PI / 2;
    casinoGroup.add(casinoBoard);

    const casinoBlade = createBladeSign('🎰', 'CASINO VIP', '#facc15', '#090d16');
    casinoBlade.position.set(6.15, 4.2, -4.2);
    casinoGroup.add(casinoBlade);

    // Giant 3D Golden Dice on the Roof
    const diceMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.4,
    });
    const casinoDice = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), diceMat);
    casinoDice.position.set(0, 10.2, 0);
    casinoDice.rotation.set(0.4, 0.6, 0.2);
    casinoGroup.add(casinoDice);

    // Red Carpet Entrance
    const redCarpet = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.04, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.9 })
    );
    redCarpet.position.set(6.2, 0.02, 0);
    casinoGroup.add(redCarpet);

    buildingsGroup.add(casinoGroup);

    // PUBLIC WATER FOUNTAIN (Park: [-10, 0, 10])
    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(-10, 0, 10);

    const basin = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.8, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 })
    );
    basin.position.y = 0.4;
    basin.receiveShadow = true;
    fountainGroup.add(basin);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    const waterDisc = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.1, 16), waterMat);
    waterDisc.position.y = 0.7;
    fountainGroup.add(waterDisc);

    const fountainCenter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 1.8, 12),
      new THREE.MeshStandardMaterial({ color: 0x64748b })
    );
    fountainCenter.position.y = 1.1;
    fountainGroup.add(fountainCenter);

    // Fountain Identification Plaque
    const fountainTexture = createSignboardTexture(
      'CENTRAL WATER FOUNTAIN',
      'FREE CLEAN DRINKING WATER • HYDRATE & REFRESH',
      '💧',
      { accentColor: '#38bdf8', bgColor: '#082f49', glowColor: '#7dd3fc', badgeBg: '#0284c7' }
    );
    const fountainBoard = createSignboardMesh(3.4, 0.9, fountainTexture, 0x0f172a, 0.8);
    fountainBoard.position.set(0, 1.2, 2.9);
    fountainBoard.rotation.x = -0.3;
    fountainGroup.add(fountainBoard);

    buildingsGroup.add(fountainGroup);

    // Decorative City Trees
    const treePositions = [
      [-14, 0, 6],
      [-10, 0, 22],
      [-6, 0, 14],
      [14, 0, 6],
      [14, 0, -4],
      [-14, 0, -4],
      [8, 0, 16],
      [-8, 0, -16],
    ];

    treePositions.forEach(([tx, ty, tz]) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, ty, tz);

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.35, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      trunk.position.y = 1;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      const leaves = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.5, 1),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })
      );
      leaves.position.y = 2.8;
      leaves.castShadow = true;
      treeGroup.add(leaves);
      buildingsGroup.add(treeGroup);
    });

    // Streetlights with Point Lights
    const streetLightGroup = new THREE.Group();
    const lightPositions = [
      [8, 0, -8],
      [-8, 0, -8],
      [8, 0, 8],
      [-8, 0, 8],
    ];

    lightPositions.forEach(([lx, ly, lz]) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 5, 8),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
      );
      pole.position.set(lx, 2.5, lz);
      streetLightGroup.add(pole);

      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xfef08a,
          emissiveIntensity: 0.8,
        })
      );
      lamp.position.set(lx, 5, lz);
      streetLightGroup.add(lamp);

      const pointLight = new THREE.PointLight(0xfef08a, 0.8, 12);
      pointLight.position.set(lx, 4.8, lz);
      streetLightGroup.add(pointLight);
    });
    buildingsGroup.add(streetLightGroup);

    scene.add(buildingsGroup);

    // 5. Interactive Zone Marker Rings (Floating 3D Holograms)
    const markerRings: { mesh: THREE.Mesh; zone: InteractiveZone }[] = [];
    INTERACTIVE_ZONES.forEach((zone) => {
      const ringGeo = new THREE.RingGeometry(zone.radius * 0.7, zone.radius * 0.85, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color:
          zone.type === 'bank'
            ? 0xf59e0b
            : zone.type === 'sim'
            ? 0xa855f7
            : zone.type === 'market'
            ? 0x10b981
            : zone.type === 'restaurant'
            ? 0xe11d48
            : zone.type === 'casino'
            ? 0xfacc15
            : zone.type === 'home'
            ? 0x6366f1
            : 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(zone.position[0], 0.05, zone.position[2]);
      scene.add(ring);
      markerRings.push({ mesh: ring, zone });
    });

    // 6. Rain Particle System for Dynamic Weather
    const rainCount = 1500;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 80;
      rainPositions[i + 1] = Math.random() * 30;
      rainPositions[i + 2] = (Math.random() - 0.5) * 80;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.18,
      transparent: true,
      opacity: 0.6,
    });
    const rainSystem = new THREE.Points(rainGeo, rainMat);
    rainSystem.visible = false;
    scene.add(rainSystem);

    // 6b. Vomit Particle System (spews bile droplets when overeating / vomiting)
    const vomitCount = 50;
    const vomitGeo = new THREE.BufferGeometry();
    const vomitPositions = new Float32Array(vomitCount * 3);
    const vomitVelocities: THREE.Vector3[] = [];
    for (let i = 0; i < vomitCount; i++) {
      vomitPositions[i * 3] = 0;
      vomitPositions[i * 3 + 1] = -100; // start hidden underground
      vomitPositions[i * 3 + 2] = 0;
      vomitVelocities.push(new THREE.Vector3(0, 0, 0));
    }
    vomitGeo.setAttribute('position', new THREE.BufferAttribute(vomitPositions, 3));
    const vomitMat = new THREE.PointsMaterial({
      color: 0xa3e635, // acidic lime-yellow bile
      size: 0.22,
      transparent: true,
      opacity: 0.95,
    });
    const vomitParticles = new THREE.Points(vomitGeo, vomitMat);
    scene.add(vomitParticles);

    // 7. Rigged 3D Character Model (Avatar with animated legs & arms)
    const characterGroup = new THREE.Group();

    const isFemale = genderRef.current === 'female';

    // Torso (Stylish jacket)
    const jacketColor = isFemale ? 0xe11d48 : 0x2563eb;
    const torsoMat = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.6 });
    const torso = new THREE.Mesh(
      isFemale ? new THREE.BoxGeometry(0.82, 1.05, 0.46) : new THREE.BoxGeometry(0.9, 1.1, 0.5),
      torsoMat
    );
    torso.position.y = 1.5;
    torso.castShadow = true;
    characterGroup.add(torso);

    // Backpack
    const backpack = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.8, 0.3),
      new THREE.MeshStandardMaterial({ color: isFemale ? 0x4c1d95 : 0x0f172a, roughness: 0.8 })
    );
    backpack.position.set(0, 1.5, -0.38);
    backpack.castShadow = true;
    characterGroup.add(backpack);

    // Head
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbd38d, roughness: 0.8 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), skinMat);
    head.position.y = 2.35;
    head.castShadow = true;
    characterGroup.add(head);

    // Hair / Cap Styling based on Gender
    if (isFemale) {
      // Female Hair & Ponytail
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.7 });
      const femaleHair = new THREE.Mesh(
        new THREE.SphereGeometry(0.37, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.7),
        hairMat
      );
      femaleHair.position.y = 2.42;
      characterGroup.add(femaleHair);

      // Ponytail extending backward
      const ponytailGroup = new THREE.Group();
      ponytailGroup.position.set(0, 2.35, -0.36);

      const hairTie = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12),
        new THREE.MeshStandardMaterial({ color: 0xf43f5e })
      );
      hairTie.rotation.x = Math.PI / 2;
      ponytailGroup.add(hairTie);

      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.65, 12), hairMat);
      tail.position.set(0, -0.3, -0.08);
      tail.rotation.x = -0.3;
      ponytailGroup.add(tail);
      characterGroup.add(ponytailGroup);
    } else {
      // Male Hair / Cap
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.37, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
      );
      cap.position.y = 2.45;
      characterGroup.add(cap);
    }

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMat);
    eyeL.position.set(0.12, 2.35, 0.32);
    characterGroup.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.set(-0.12, 2.35, 0.32);
    characterGroup.add(eyeR);

    // Limbs (Arms & Legs pivotable)
    const limbMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

    // Left Arm Pivot
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(0.55, 1.9, 0);
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.8, 0.24), torsoMat);
    leftArm.position.y = -0.4;
    leftArm.castShadow = true;
    leftArmPivot.add(leftArm);
    characterGroup.add(leftArmPivot);

    // Right Arm Pivot
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(-0.55, 1.9, 0);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.8, 0.24), torsoMat);
    rightArm.position.y = -0.4;
    rightArm.castShadow = true;
    rightArmPivot.add(rightArm);
    characterGroup.add(rightArmPivot);

    // Left Leg Pivot
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(0.25, 1.0, 0);
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.28), limbMat);
    leftLeg.position.y = -0.45;
    leftLeg.castShadow = true;
    leftLegPivot.add(leftLeg);
    characterGroup.add(leftLegPivot);

    // Right Leg Pivot
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(-0.25, 1.0, 0);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.28), limbMat);
    rightLeg.position.y = -0.45;
    rightLeg.castShadow = true;
    rightLegPivot.add(rightLeg);
    characterGroup.add(rightLegPivot);

    scene.add(characterGroup);

    // 8. Event Listeners for Keyboard & Mouse controls
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'e') {
        if (activeZoneRef.current) {
          onInteractRef.current(activeZoneRef.current);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      isDraggingMouse.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingMouse.current) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      cameraAngle.current.theta -= dx * 0.006;
      cameraAngle.current.phi = Math.max(
        0.1,
        Math.min(1.2, cameraAngle.current.phi + dy * 0.006)
      );
    };

    const onMouseUp = () => {
      isDraggingMouse.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      cameraAngle.current.distance = Math.max(
        5,
        Math.min(18, cameraAngle.current.distance + e.deltaY * 0.01)
      );
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel);

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // 9. Main Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let stepSoundTimer = 0;
    let lastZoneNotifyTime = 0;
    let lastSentDistance = -1;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(0.1, clock.getDelta());
      const currentWeather = weatherRef.current;
      const currentGameHour = gameHourRef.current;

      // Rotate decorative casino golden dice
      casinoDice.rotation.y += delta * 0.8;
      casinoDice.rotation.x += delta * 0.4;

      // Read movement input
      let moveX = 0;
      let moveZ = 0;
      const keys = keysPressed.current;

      if (keys['w'] || keys['arrowup']) moveZ -= 1;
      if (keys['s'] || keys['arrowdown']) moveZ += 1;
      if (keys['a'] || keys['arrowleft']) moveX -= 1;
      if (keys['d'] || keys['arrowright']) moveX += 1;

      // Stop movement during vomiting episode
      const isCurrentlyVomiting = isVomitingRef.current;
      if (isCurrentlyVomiting) {
        moveX = 0;
        moveZ = 0;
      }

      const currentVitals = vitalsRef.current;
      // Dynamic Physique: When not eating properly, character becomes visibly lean/gaunt!
      const weight = currentVitals.weightKg !== undefined ? currentVitals.weightKg : (currentVitals.hunger < 35 ? 49 : 70);
      // Normalized thickness factor: 70kg = 1.0 (fit athletic build), 48kg = 0.58 (gaunt, skinny lean physique)
      const targetThickness = THREE.MathUtils.clamp(weight / 70, 0.58, 1.18);
      const limbThickness = targetThickness * 0.88;

      torso.scale.x = THREE.MathUtils.lerp(torso.scale.x, targetThickness, 4 * delta);
      torso.scale.z = THREE.MathUtils.lerp(torso.scale.z, targetThickness, 4 * delta);
      leftArm.scale.x = THREE.MathUtils.lerp(leftArm.scale.x, limbThickness, 4 * delta);
      leftArm.scale.z = THREE.MathUtils.lerp(leftArm.scale.z, limbThickness, 4 * delta);
      rightArm.scale.x = THREE.MathUtils.lerp(rightArm.scale.x, limbThickness, 4 * delta);
      rightArm.scale.z = THREE.MathUtils.lerp(rightArm.scale.z, limbThickness, 4 * delta);
      leftLeg.scale.x = THREE.MathUtils.lerp(leftLeg.scale.x, targetThickness * 0.92, 4 * delta);
      leftLeg.scale.z = THREE.MathUtils.lerp(leftLeg.scale.z, targetThickness * 0.92, 4 * delta);
      rightLeg.scale.x = THREE.MathUtils.lerp(rightLeg.scale.x, targetThickness * 0.92, 4 * delta);
      rightLeg.scale.z = THREE.MathUtils.lerp(rightLeg.scale.z, targetThickness * 0.92, 4 * delta);
      backpack.scale.x = THREE.MathUtils.lerp(backpack.scale.x, targetThickness, 4 * delta);
      leftArmPivot.position.x = 0.55 * targetThickness;
      rightArmPivot.position.x = -0.55 * targetThickness;

      // Sprinting blocked if severely dehydrated or exhausted or starved
      const canSprint = currentVitals.stamina > 5 && currentVitals.hydration > 15 && currentVitals.hunger > 15 && currentVitals.fatigue > 15;
      const isSprinting = !!keys['shift'] && canSprint;
      const isMoving = moveX !== 0 || moveZ !== 0;

      // Base speed influenced by weather (Rain reduces walk speed)
      let baseSpeed = isSprinting ? 9.5 : 5.0;
      if (currentWeather === 'rainy' || currentWeather === 'stormy') {
        baseSpeed *= 0.85; // Wet streets slow down character
      }

      // Physical problems penalties: Severe hunger, dehydration, exhaustion reduce movement speed drastically
      if (currentVitals.hunger < 15 || currentVitals.hydration < 15 || currentVitals.fatigue < 15) {
        baseSpeed *= 0.52; // Severe weakness / limping from lack of food, water, or sleep!
      } else if (currentVitals.hunger < 30 || currentVitals.hydration < 30 || currentVitals.fatigue < 30) {
        baseSpeed *= 0.78; // Sluggish sluggishness
      }

      if (isMoving) {
        // Calculate movement relative to camera orientation
        const inputAngle = Math.atan2(moveX, moveZ);
        const targetRotation = cameraAngle.current.theta + inputAngle;

        playerState.current.rotationY = targetRotation;
        characterGroup.rotation.y = THREE.MathUtils.lerp(
          characterGroup.rotation.y,
          targetRotation,
          10 * delta
        );

        const vx = Math.sin(targetRotation) * baseSpeed;
        const vz = Math.cos(targetRotation) * baseSpeed;

        const moveXStep = vx * delta;
        const moveZStep = vz * delta;

        // Try movement along X with obstacle collision check
        const candidateX = playerState.current.pos.x + moveXStep;
        if (!isWorldColliding(candidateX, playerState.current.pos.z)) {
          playerState.current.pos.x = candidateX;
        }

        // Try movement along Z with obstacle collision check
        const candidateZ = playerState.current.pos.z + moveZStep;
        if (!isWorldColliding(playerState.current.pos.x, candidateZ)) {
          playerState.current.pos.z = candidateZ;
        }

        // Open world boundaries [-68, 68]
        playerState.current.pos.x = Math.max(-68, Math.min(68, playerState.current.pos.x));
        playerState.current.pos.z = Math.max(-68, Math.min(68, playerState.current.pos.z));

        // Animate limbs
        playerState.current.animTime += delta * (isSprinting ? 14 : 9);
        const limbAngle = Math.sin(playerState.current.animTime) * 0.7;
        leftArmPivot.rotation.x = -limbAngle;
        rightArmPivot.rotation.x = limbAngle;
        leftLegPivot.rotation.x = limbAngle;
        rightLegPivot.rotation.x = -limbAngle;
        torso.position.y = 1.5 + Math.abs(Math.sin(playerState.current.animTime * 2)) * 0.08;

        // Procedural footstep sound
        stepSoundTimer += delta;
        if (stepSoundTimer > (isSprinting ? 0.28 : 0.42)) {
          sounds.playStep();
          stepSoundTimer = 0;
        }
      } else {
        // Idle breathing animation
        playerState.current.animTime += delta * 2;
        leftArmPivot.rotation.x = THREE.MathUtils.lerp(leftArmPivot.rotation.x, 0, 8 * delta);
        rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, 0, 8 * delta);
        leftLegPivot.rotation.x = THREE.MathUtils.lerp(leftLegPivot.rotation.x, 0, 8 * delta);
        rightLegPivot.rotation.x = THREE.MathUtils.lerp(rightLegPivot.rotation.x, 0, 8 * delta);
        torso.position.y = 1.5 + Math.sin(playerState.current.animTime) * 0.03;
      }

      characterGroup.position.copy(playerState.current.pos);

      // 8b. Vomiting Animation Pose & Particle Physics
      if (isCurrentlyVomiting) {
        // Bend character over retching
        torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, 0.72, 12 * delta);
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.5, 12 * delta);
        leftArmPivot.rotation.x = THREE.MathUtils.lerp(leftArmPivot.rotation.x, 0.35, 10 * delta);
        rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, 0.35, 10 * delta);
        // Convulsive retching shudder
        characterGroup.position.y = playerState.current.pos.y + Math.sin(clock.getElapsedTime() * 32) * 0.04;

        // Spew vomit bile particles from mouth area forward and down
        const vomitPosArr = vomitGeo.attributes.position.array as Float32Array;
        const forwardX = Math.sin(characterGroup.rotation.y);
        const forwardZ = Math.cos(characterGroup.rotation.y);
        const mouthX = playerState.current.pos.x + forwardX * 0.45;
        const mouthY = playerState.current.pos.y + 1.85;
        const mouthZ = playerState.current.pos.z + forwardZ * 0.45;

        for (let i = 0; i < vomitCount; i++) {
          const idx = i * 3;
          if (vomitPosArr[idx + 1] <= 0.05) {
            vomitPosArr[idx] = mouthX + (Math.random() - 0.5) * 0.12;
            vomitPosArr[idx + 1] = mouthY + (Math.random() - 0.5) * 0.1;
            vomitPosArr[idx + 2] = mouthZ + (Math.random() - 0.5) * 0.12;
            vomitVelocities[i].set(
              forwardX * (2.8 + Math.random() * 2.2) + (Math.random() - 0.5) * 0.9,
              0.8 + Math.random() * 1.0,
              forwardZ * (2.8 + Math.random() * 2.2) + (Math.random() - 0.5) * 0.9
            );
          } else {
            vomitVelocities[i].y -= 10.5 * delta;
            vomitPosArr[idx] += vomitVelocities[i].x * delta;
            vomitPosArr[idx + 1] += vomitVelocities[i].y * delta;
            vomitPosArr[idx + 2] += vomitVelocities[i].z * delta;
          }
        }
        vomitGeo.attributes.position.needsUpdate = true;
      } else {
        // Return from vomit retch pose
        torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, 0, 8 * delta);
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0, 8 * delta);
        // Hide vomit particles underground
        const vomitPosArr = vomitGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < vomitCount; i++) {
          vomitPosArr[i * 3 + 1] = -100;
        }
        vomitGeo.attributes.position.needsUpdate = true;
      }

      // Third-person smooth follow camera
      const camDist = cameraAngle.current.distance;
      const camTheta = cameraAngle.current.theta;
      const camPhi = cameraAngle.current.phi;

      const targetCamX =
        playerState.current.pos.x + camDist * Math.sin(camTheta) * Math.cos(camPhi);
      const targetCamY = playerState.current.pos.y + camDist * Math.sin(camPhi) + 1.6;
      const targetCamZ =
        playerState.current.pos.z + camDist * Math.cos(camTheta) * Math.cos(camPhi);

      camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 8 * delta);
      camera.lookAt(
        playerState.current.pos.x,
        playerState.current.pos.y + 1.8,
        playerState.current.pos.z
      );

      // Rotate zone markers and animate scale
      markerRings.forEach(({ mesh }) => {
        mesh.rotation.z += delta * 0.8;
      });

      // Check proximity to Interactive Zones
      let nearest: InteractiveZone | null = null;
      let minDistance = Infinity;

      INTERACTIVE_ZONES.forEach((zone) => {
        const d = Math.hypot(
          playerState.current.pos.x - zone.position[0],
          playerState.current.pos.z - zone.position[2]
        );
        if (d < minDistance) {
          minDistance = d;
          nearest = zone;
        }
      });

      const inZone = minDistance <= (nearest ? (nearest as InteractiveZone).radius : 0) ? nearest : null;
      const roundedDist = Math.round(minDistance);
      const nowMs = performance.now();

      if (inZone !== activeZoneRef.current) {
        activeZoneRef.current = inZone;
        setActiveZone(inZone);
        onNearZoneChangeRef.current(inZone, roundedDist);
        lastSentDistance = roundedDist;
        lastZoneNotifyTime = nowMs;
      } else if (nowMs - lastZoneNotifyTime > 400 && roundedDist !== lastSentDistance) {
        lastSentDistance = roundedDist;
        lastZoneNotifyTime = nowMs;
        onNearZoneChangeRef.current(inZone, roundedDist);
      }

      // Dynamic Weather Rendering
      if (currentWeather === 'rainy' || currentWeather === 'stormy') {
        rainSystem.visible = true;
        const posAttr = rainGeo.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 1; i < arr.length; i += 3) {
          arr[i] -= delta * 35;
          if (arr[i] < 0) {
            arr[i] = 25 + Math.random() * 5;
          }
        }
        posAttr.needsUpdate = true;

        scene.fog = new THREE.FogExp2(0x475569, 0.025);
        renderer.setClearColor(0x334155);
      } else if (currentWeather === 'foggy') {
        rainSystem.visible = false;
        scene.fog = new THREE.FogExp2(0x94a3b8, 0.045);
        renderer.setClearColor(0x94a3b8);
      } else {
        rainSystem.visible = false;
        scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);
        renderer.setClearColor(0x87ceeb);
      }

      // Day / Night Sun orbit
      const sunAngle = ((currentGameHour - 6) / 24) * Math.PI * 2;
      sunLight.position.set(
        Math.cos(sunAngle) * 40,
        Math.max(2, Math.sin(sunAngle) * 45),
        Math.sin(sunAngle) * 30
      );
      const isNight = currentGameHour < 5.5 || currentGameHour > 20;
      sunLight.intensity = isNight ? 0.15 : 1.2;
      ambientLight.intensity = isNight ? 0.2 : 0.55;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const isCriticalDistress = vitals.hunger < 20 || vitals.hydration < 20 || vitals.health < 25;
  const isExhausted = vitals.fatigue < 15;

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Physical Problems Vignette & Visual Consequences Overlay */}
      {isCriticalDistress && (
        <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_120px_rgba(239,68,68,0.45)] animate-pulse border-4 border-rose-500/20" />
      )}
      {isExhausted && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-slate-950/20 shadow-[inset_0_0_90px_rgba(30,27,75,0.6)] backdrop-blur-[0.5px]" />
      )}

      {/* Floating 3D Interaction Prompt Banner when inside a zone */}
      {activeZone && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-bounce">
          <button
            onClick={() => onInteract(activeZone)}
            className="px-5 py-3 rounded-2xl bg-slate-900/95 border-2 border-indigo-400 shadow-2xl text-white font-bold text-sm flex items-center gap-3 backdrop-blur-md hover:bg-indigo-600 transition-all cursor-pointer active:scale-95"
          >
            <span className="px-2 py-0.5 rounded-lg bg-indigo-500 text-white font-mono text-xs">
              Press [E]
            </span>
            <span>Enter {activeZone.label}</span>
          </button>
        </div>
      )}
    </div>
  );
};

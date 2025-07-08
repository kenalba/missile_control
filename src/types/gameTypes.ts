// Core game type definitions

export interface Position {
  x: number;
  y: number;
}

export interface Velocity extends Position {
  // Inherits x, y from Position but represents velocity
}

export interface GameEntity extends Position {
  id?: string;
  active?: boolean;
}

export interface Missile extends GameEntity {
  vx: number;
  vy: number;
  speed?: number;
  targetX: number;
  targetY: number;
  launcherIndex?: number;
  trail: Position[];
  isSeeker?: boolean;
  life?: number;
  maxLife?: number;
}

export interface PlayerMissile extends Missile {
  autopilot: boolean;
  autopilotStrength: number;
  timeAlive: number;
  maxLifetime: number;
  originalTargetX: number;
  originalTargetY: number;
  originalFlightTime: number;
  maxDeviation: number;
}

export interface EnemyMissile extends Missile {
  isSplitter: boolean;
  splitAt: number | null;
  seekerBlinkTimer: number;
  seekerTargetX: number;
  seekerTargetY: number;
  lastRetarget: number;
  isTargetingValid: boolean;
  sparkleTimer: number;
  lastThreatCheck: number;
  fromPlane?: boolean;
}

export interface Explosion extends GameEntity {
  radius: number;
  maxRadius: number;
  growing: boolean;
  isPlayer: boolean;
  alpha: number;
  type: 'normal' | 'plane' | 'city' | 'splitter';
  shockwave: boolean;
  shockwaveRadius: number;
  shockwaveAlpha: number;
}

export interface Launcher extends Position {
  missiles: number;
  maxMissiles: number;
  lastFire: number;
  fireRate: number;
}

export interface Plane extends GameEntity {
  vx: number;
  vy: number;
  lastFire: number;
  fireRate: number;
  trail: Position[];
  hp: number; // Hit points for plane destruction
  fromLeft: boolean;
  engineSoundId: any;
}

export interface Particle extends GameEntity {
  vx: number;
  vy: number;
  life: number;
  maxLife?: number;
  color: string;
  size: number;
  decay?: number;
  text?: string;
  isText?: boolean;
  sparkle?: boolean;
  firework?: boolean;
  isFlash?: boolean;
}

export interface UpgradeEffect extends GameEntity {
  text: string;
  alpha: number;
  vy: number;
  life: number;
  color?: string;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  x: number;
  y: number;
}

export interface Achievements {
  missilesDestroyed: number;
  planesDestroyed: number;
  wavesCompleted: number;
  citiesLost: number;
  seekersDestroyed: number;
  totalScrapEarned: number;
  lastMilestoneWave: number;
}

export interface CommandModeState {
  gameTime: number;
  difficulty: number;
  lastResourceTick: number;
  resourceTickInterval: number;
  lastEnemySpawn: number;
  enemySpawnInterval: number;
  selectedEntity: number | null;
  selectedEntityType: 'city' | 'turret' | null;
}

export interface GameState {
  score: number;
  scrap: number;
  science: number;
  wave: number;
  cities: number;
  gameRunning: boolean;
  paused: boolean;
  lastTime: number;
  gameTime: number; // Pause-aware game time (milliseconds)
  pauseStartTime: number;
  waveTimer: number;
  nextWaveDelay: number;
  waveBreak: boolean;
  waveBreakTimer: number;
  enemiesSpawned: number;
  enemiesToSpawn: number;
  planesSpawned: number;
  planesToSpawn: number;
  cityBonusPhase: boolean;
  cityBonusTimer: number;
  cityBonusIndex: number;
  cityBonusTotal: number;
  missileBonusPhase: boolean;
  missileBonusTimer: number;
  missileBonusIndex: number;
  missileBonusTotal: number;
  currentMode: 'arcade' | 'command';
  commandMode: CommandModeState;
  screenShake: ScreenShake;
  achievements: Achievements;
}

export interface UpgradeLevel {
  level: number;
  cost: number;
}

export interface LauncherUpgrades {
  speed: UpgradeLevel;
  explosion: UpgradeLevel;
  rate: UpgradeLevel;
  capacity: UpgradeLevel;
  autopilot: UpgradeLevel;
  [key: string]: UpgradeLevel;
}

export interface GlobalUpgrades {
  cityShield: UpgradeLevel;
  missileHighlight: UpgradeLevel;
  cityScrapBonus: UpgradeLevel;
  scrapMultiplier: UpgradeLevel;
  salvage: UpgradeLevel;
  efficiency: UpgradeLevel;
  research: UpgradeLevel;
  civilianIndustry: UpgradeLevel;
  populationTech: UpgradeLevel;
  arsenalTech: UpgradeLevel;
  miningTech: UpgradeLevel;
  researchTech: UpgradeLevel;
  ammoRecycling: UpgradeLevel;
  truckFleet: UpgradeLevel;
  [key: string]: UpgradeLevel;
}

export interface UnlockedUpgradePaths {
  rate: boolean;
  speed: boolean;
  explosion: boolean;
  capacity: boolean;
  autopilot: boolean;
  [key: string]: boolean;
}

export interface CityData {
  population: number;
  maxPopulation: number;
  productionMode: 'scrap' | 'science' | 'ammo';
  baseProduction: number;
  stockpile?: {
    scrap: number;
    science: number;
    ammo: number;
  };
  maxStockpile?: {
    scrap: number;
    science: number;
    ammo: number;
  };
  // Simplified ammo-only stockpile system (backward compatible)
  ammoStockpile?: number;
  maxAmmoStockpile?: number;
  maxTrucks?: number;
}

export interface AmmoTruck {
  id: string;
  cityIndex: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  ammoAmount: number;
  targetTurretIndex: number;
  progress: number; // 0 to 1
  deliveryTime: number; // total time in ms
  startTime: number;
  status: 'delivering' | 'returning' | 'idle';
  returnStartTime?: number;
  returnTime?: number;
}

export interface CityProductivityUpgrades {
  scrap: number[];
  science: number[];
  ammo: number[];
}

// Mode configuration types
export interface ModeConfig {
  name: string;
  description: string;
  initialCities: number;
  initialLaunchers: number;
  cityPositions: number[];
  launcherPositions: Launcher[];
  initialUpgrades: LauncherUpgrades[];
  initialEnemies: number;
  availableTurretPositions?: Position[];
  availableCityPositions?: number[];
}

export interface ModeConfigs {
  arcade: ModeConfig;
  command: ModeConfig;
}

// Event system types
export type GameEventType = 
  | 'missile-fired'
  | 'missile-destroyed'
  | 'explosion-created'
  | 'city-destroyed'
  | 'city-repaired'
  | 'launcher-destroyed'
  | 'wave-completed'
  | 'upgrade-purchased'
  | 'entity-selected'
  | 'mode-changed';

export interface GameEvent<T = any> {
  type: GameEventType;
  data?: T;
  timestamp: number;
}

// Save system types
export interface HighScore {
  score: number;
  wave: number;
  date: number;
}

export interface SaveData {
  highScores: HighScore[];
  lastSelectedMode: 'arcade' | 'command';
  achievements: Achievements;
  totalPlayTime: number;
  gamesPlayed: number;
}

// Audio system types
export interface AudioConfig {
  enabled: boolean;
  volume: number;
  context?: AudioContext;
}

export interface ToneConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
}

// UI Component types
export interface ComponentProps {
  [key: string]: any;
}

export interface CompactUpgradeButtonConfig {
  name: string;
  description: string;
  cost: number;
  canAfford: boolean;
  color: string;
  action: string;
  actionData?: string;
  isOwned?: boolean;
  additionalInfo?: string;
  onClick?: string;
}

export interface TooltipPosition {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  transform?: string;
}

// Configuration constants
export interface GameConstants {
  CANVAS_WIDTH: number;
  CANVAS_HEIGHT: number;
  GROUND_LEVEL: number;
  MISSILE_SPEED_BASE: number;
  EXPLOSION_DURATION: number;
  UPGRADE_COSTS: {
    [key: string]: number;
  };
  COLORS: {
    [key: string]: string;
  };
}

// Collision detection types
export interface CollisionResult {
  hit: boolean;
  distance?: number;
  point?: Position;
}

// Rendering types
export interface RenderLayer {
  name: string;
  zIndex: number;
  visible: boolean;
  dirty: boolean;
}

export interface DrawableEntity extends GameEntity {
  render: (ctx: CanvasRenderingContext2D) => void;
  layer?: string;
}
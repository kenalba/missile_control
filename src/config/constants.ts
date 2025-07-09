// Game constants and configuration

export const GAME_CONFIG = {
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 900,
  GROUND_LEVEL: 800,
  MISSILE_SPEED_BASE: 5,
  EXPLOSION_DURATION: 1000,
  MAX_TRAIL_LENGTH: 8,
  AUTOPILOT_RANGE: 400,
  TARGET_FPS: 60,
  FRAME_TIME: 16.67, // 1000ms / 60fps
} as const;

export const COLORS = {
  green: '0, 255, 0',
  blue: '0, 0, 255', 
  yellow: '255, 255, 0',
  red: '255, 0, 0',
  orange: '255, 136, 0',
  cyan: '0, 255, 255',
  white: '255, 255, 255',
  black: '0, 0, 0',
} as const;

export const UPGRADE_COSTS = {
  // Turret upgrades
  speed: 10,
  explosion: 15,
  rate: 20,
  capacity: 25,
  autopilot: 40,
  
  // Global upgrades
  scrapMultiplier: 80,
  salvage: 60,
  efficiency: 90,
  research: 50,
  missileHighlight: 75,
  
  // Building costs
  emergencyAmmo: 3,
  cityRepair: 50,
  baseCityBuild: 100,
  baseTurretBuild: 150,
  
  // Science unlock costs
  speedPath: 10,
  explosionPath: 25,
  capacityPath: 50,
  autopilotPath: 100,
} as const;

export const MULTIPLIERS = {
  speed: 1.3,
  explosion: 1.4,
  rate: 1.5,
  capacity: 1.2,
  scrapBonus: 1.25,
  efficiency: 0.85, // 15% discount
  cityProductivity: 1.25, // 25% increase per level
} as const;

export const WAVE_CONFIG = {
  baseEnemies: 4,
  enemyIncrement: 1.5,
  enemyExponent: 0.2,
  firstPlaneWave: 5,
  planeIncrement: 0.5,
} as const;

export const COMMAND_MODE_CONFIG = {
  resourceTickInterval: 3000, // 3 seconds
  enemySpawnInterval: 4000, // 4 seconds base (was 2s - much slower start)
  difficultyIncreaseInterval: 45000, // 45 seconds (was 30s - slower ramp)
  difficultyIncrement: 0.15, // smaller increment (was 0.2)
  populationGrowthRate: 0.33, // per second
} as const;

export const AUDIO_CONFIG = {
  baseFrequency: 220,
  explosionFrequency: 80,
  missileFrequency: 440,
  planeFrequency: 180,
  defaultVolume: 0.1,
  defaultDuration: 0.1,
} as const;

export const UI_CONFIG = {
  panelWidth: 400,
  panelMinWidth: 350,
  panelMinHeight: 200,
  tooltipDelay: 500,
  animationDuration: 300,
} as const;

// Type-safe color access
export type ColorName = keyof typeof COLORS;
export type UpgradeCostName = keyof typeof UPGRADE_COSTS;

// Helper function to get CSS color string
export const getColor = (colorName: ColorName): string => {
  return `rgb(${COLORS[colorName]})`;
};

// Helper function to get CSS color with alpha
export const getColorWithAlpha = (colorName: ColorName, alpha: number): string => {
  return `rgba(${COLORS[colorName]}, ${alpha})`;
};

// Helper function to get upgrade cost
export const getUpgradeCost = (upgradeName: UpgradeCostName): number => {
  return UPGRADE_COSTS[upgradeName];
};
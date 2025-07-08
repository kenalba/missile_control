// Type definitions for legacy JavaScript modules during migration

declare global {
  // Legacy game state variables
  var gameState: any;
  var launchers: any[];
  var playerMissiles: any[];
  var enemyMissiles: any[];
  var explosions: any[];
  var particles: any[];
  var upgradeEffects: any[];
  var planes: any[];
  var destroyedCities: number[];
  var destroyedLaunchers: number[];
  var cityPositions: number[];
  var cityData: any[];
  var cityUpgrades: number[];
  var cityPopulationUpgrades: number[];
  var cityProductivityUpgrades: any;
  var launcherUpgrades: any[];
  var globalUpgrades: any;
  var unlockedUpgradePaths: any;
  var ammoAccumulator: number;
  var selectedLauncher: number;
  var canvas: HTMLCanvasElement;
  var ctx: CanvasRenderingContext2D;

  // Legacy functions
  var initGame: () => void;
  var startGame: (mode?: string) => void;
  var restartGame: () => void;
  var continueGame: () => void;
  var fireMissile: (launcher: any, targetX: number, targetY: number) => void;
  var spawnEnemyMissile: () => void;
  var spawnPlane: () => void;
  var createExplosion: (x: number, y: number, isPlayer: boolean, launcherIndex?: number, type?: string) => void;
  var updateUI: () => void;
  var render: () => void;
  var checkCollisions: () => void;
  var applyScrapBonus: (baseScrap: number) => number;
  var getActualUpgradeCost: (baseCost: number) => number;
  var createUpgradeEffect: (x: number, y: number, text: string, color?: string) => void;
  var addScreenShake: (intensity: number, duration: number) => void;
  var checkAchievements: () => void;
  var showSplashScreen: () => void;
  var updateLauncherSelection: () => void;
  var selectLauncher: (index: number) => void;
  var toggleFullscreen: () => void;
  var toggleMobileUpgrades: () => void;
  var upgrade: (type: string, launcherIndex: number) => void;
  var upgradeCity: (cityIndex: number) => void;
  var upgradeGlobal: (upgradeType: string) => void;
  var ModeManager: any;

  // Window extensions
  interface Window {
    audioSystem?: any;
    saveSystem?: any;
    webkitAudioContext?: typeof AudioContext;
  }
}

export {};
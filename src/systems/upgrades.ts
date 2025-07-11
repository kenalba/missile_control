// Unified Upgrade System - TypeScript Implementation
import { gameState } from '@/systems/observableState';
import { launchers } from '@/entities/launchers';
import { cityPositions, destroyedCities, cityUpgrades, cityPopulationUpgrades, cityBunkerUpgrades, cityProductivityUpgrades } from '@/entities/cities';
import { cityData } from '@/core/cities';
import { launcherUpgrades, globalUpgrades, unlockedUpgradePaths } from '@/core/upgrades';
import { upgradeEffects } from '@/entities/particles';
import { updateUI } from '@/systems/ui';

// Type definitions for upgrade system

// Get actual upgrade cost after applying efficiency discount
function getActualUpgradeCost(baseCost: number): number {
  const efficiencyDiscount = globalUpgrades.efficiency?.level > 0 ? 0.85 : 1.0;
  return Math.floor(baseCost * efficiencyDiscount);
}

// Create visual upgrade effect
export function createUpgradeEffect(x: number, y: number, text: string, color: string = '#0f0'): void {
  upgradeEffects.push({
    x,
    y,
    text,
    alpha: 1,
    vy: -2,
    life: 90,
    color
  });
}

// Emergency ammo purchase
export function emergencyAmmoPurchase(): void {
  const cost = 3; // 3 scrap per ammo
  if (gameState.scrap < cost) return;
  
  gameState.scrap -= cost;
  
  // Add ammo to the first launcher that needs it
  for (let i = 0; i < launchers.length; i++) {
    if (launchers[i].missiles < launchers[i].maxMissiles) {
      launchers[i].missiles = Math.min(launchers[i].missiles + 1, launchers[i].maxMissiles);
      
      // Visual feedback
      createUpgradeEffect(launchers[i].x, launchers[i].y - 30, '+1 AMMO', '#ff0');
      break;
    }
  }
  
  // Update UI
  updateUI();
  if (gameState.currentMode === 'command') {
    (window as any).updateCommandPanel?.();
  }
}

// Purchase global upgrades
export function purchaseGlobalUpgrade(upgradeType: string): void {
  const upgrade = globalUpgrades[upgradeType];
  if (!upgrade || upgrade.level > 0) return;
  
  // Science-based upgrades
  const scienceUpgrades = ['civilianIndustry', 'populationTech', 'arsenalTech', 'miningTech', 'researchTech', 'ammoRecycling', 'truckFleet'];
  const isScience = scienceUpgrades.includes(upgradeType);
  
  if (isScience) {
    if (gameState.science < upgrade.cost) return;
    gameState.science -= upgrade.cost;
  } else {
    if (gameState.scrap < upgrade.cost) return;
    gameState.scrap -= upgrade.cost;
  }
  
  upgrade.level = 1;
  
  // Visual feedback
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (canvas) {
    const color = isScience ? '#00f' : '#0f0';
    createUpgradeEffect(canvas.width / 2, 300, `${upgradeType.toUpperCase()} UNLOCKED!`, color);
  }
  
  // Special effects for specific upgrades
  if (upgradeType === 'research') {
    // Unlock science production
    if (canvas) {
      createUpgradeEffect(canvas.width / 2, 350, 'SCIENCE UNLOCKED', '#00f');
    }
  }
  
  updateUI();
  if (gameState.currentMode === 'command') {
    (window as any).updateCommandPanel?.();
  }
}

// Set city production mode
export function setCityProductionMode(cityIndex: number, mode: 'scrap' | 'science' | 'ammo'): void {
  if (cityIndex < 0 || cityIndex >= cityData.length) return;
  if (destroyedCities.includes(cityIndex)) return;
  
  // Check if science is unlocked for science mode
  if (mode === 'science' && (!globalUpgrades.research || globalUpgrades.research.level === 0)) {
    createUpgradeEffect(cityPositions[cityIndex], 750, 'SCIENCE LOCKED', '#f00');
    return;
  }
  
  cityData[cityIndex].productionMode = mode;
  
  // Visual feedback
  const modeColors = { scrap: '#0f0', science: '#00f', ammo: '#ff0' };
  createUpgradeEffect(cityPositions[cityIndex], 750, `${mode.toUpperCase()} MODE`, modeColors[mode]);
  
  if (gameState.currentMode === 'command') {
    (window as any).updateCommandPanel?.();
  }
}

// Upgrade city features
export function upgradeCityFeature(cityIndex: number): void {
  if (cityIndex < 0 || cityIndex >= cityData.length) return;
  if (destroyedCities.includes(cityIndex)) return;
  
  const currentLevel = cityUpgrades[cityIndex];
  const cost = 30 + (currentLevel * 20);
  
  if (gameState.scrap < cost) return;
  
  gameState.scrap -= cost;
  cityUpgrades[cityIndex]++;
  
  // Visual feedback
  createUpgradeEffect(cityPositions[cityIndex], 750, `LEVEL ${cityUpgrades[cityIndex]}`, '#ff0');
  
  updateUI();
  if (gameState.currentMode === 'command') {
    (window as any).updateCommandPanel?.();
  }
}

// Apply upgrade effects to launcher
function applyUpgradeToLauncher(type: string, launcherIndex: number): void {
  const launcher = launchers[launcherIndex];
  const upgrade = launcherUpgrades[launcherIndex][type];
  
  if (!launcher || !upgrade) return;
  
  switch (type) {
    case 'speed':
      // Speed handled in missile creation
      break;
    case 'explosion':
      // Explosion size handled in explosion creation
      break;
    case 'rate':
      launcher.fireRate = Math.floor(1000 / Math.pow(1.5, upgrade.level - 1));
      break;
    case 'capacity':
      const oldMax = launcher.maxMissiles;
      launcher.maxMissiles = Math.floor(10 * Math.pow(1.2, upgrade.level - 1));
      launcher.missiles += (launcher.maxMissiles - oldMax); // Add the extra missiles
      break;
    case 'autopilot':
      // Autopilot handled in game loop
      break;
  }
}

// Main turret upgrade function
export function upgrade(type: string, launcherIndex: number): void {
  if (launcherIndex < 0 || launcherIndex >= launcherUpgrades.length) return;
  
  const upgrades = launcherUpgrades[launcherIndex];
  const upgrade = upgrades[type];
  
  if (!upgrade) return;
  
  // Check if upgrade path is unlocked in Command Mode
  if (gameState.currentMode === 'command') {
    if (!unlockedUpgradePaths[type]) {
      // Visual feedback for locked upgrade path
      const launcher = launchers[launcherIndex];
      if (launcher) {
        createUpgradeEffect(launcher.x, launcher.y - 30, 'Upgrade path locked!', '#f00');
      }
      return;
    }
  }
  
  // All modes: upgrades cost scrap
  const cost = getActualUpgradeCost(upgrade.cost);
  if (gameState.scrap < cost) return;
  
  // Deduct scrap
  gameState.scrap -= cost;
  
  // Apply upgrade
  upgrade.level++;
  upgrade.cost = Math.floor(upgrade.cost * 1.5); // Increase cost for next level
  
  // Apply upgrade effects to launcher
  applyUpgradeToLauncher(type, launcherIndex);
  
  // Visual feedback
  const launcher = launchers[launcherIndex];
  if (launcher) {
    createUpgradeEffect(launcher.x, launcher.y - 30, `${type.toUpperCase()} UP!`, '#0ff');
  }
  
  updateUI();
  if (gameState.currentMode === 'command') {
    (window as any).updateCommandPanel?.();
  }
}

// City upgrade function (legacy compatibility)
export function upgradeCity(cityIndex: number): void {
  if (gameState.currentMode === 'command') {
    // In Command Mode, clicking on city selects it
    (window as any).selectEntity?.('city', cityIndex);
    return;
  }
  
  // Arcade Mode: direct upgrade
  if (cityUpgrades[cityIndex] >= 5) return; // Max level
  
  const cost = 50;
  if (gameState.scrap < cost) return;
  
  gameState.scrap -= cost;
  cityUpgrades[cityIndex]++;
  
  createUpgradeEffect(cityPositions[cityIndex], 750, 'CITY UP!', '#ff0');
  updateUI();
}

// Global upgrade function (legacy compatibility)
export function upgradeGlobal(upgradeType: string): void {
  purchaseGlobalUpgrade(upgradeType);
}

// Repair city function
export function repairCity(cityIndex: number): void {
  if (!destroyedCities.includes(cityIndex)) return;
  
  const cost = 50;
  if (gameState.scrap < cost) return;
  
  gameState.scrap -= cost;
  
  // Remove from destroyed cities list
  const index = destroyedCities.indexOf(cityIndex);
  if (index > -1) {
    destroyedCities.splice(index, 1);
    gameState.cities++;
    
    // Restore city to base population when repaired
    if (cityData[cityIndex]) {
      cityData[cityIndex].population = Math.floor(cityData[cityIndex].maxPopulation * 0.3); // Start with 30% population
    }
  }
  
  // Visual feedback
  createUpgradeEffect(cityPositions[cityIndex], 750, 'CITY REPAIRED!', '#0f0');
  
  updateUI();
  if (gameState.currentMode === 'command') {
    (window as any).updateCommandPanel?.();
  }
}

// Get next available predefined city position
function getNextCityPosition(): number | null {
  if (gameState.currentMode !== 'command') {
    // Fallback for non-command modes - use simple spacing
    return 250 + (cityData.length * 120);
  }
  
  const config = (window as any).ModeManager?.getCurrentConfig();
  if (!config || !config.availableCityPositions) {
    // Fallback if no predefined positions
    return 250 + (cityData.length * 120);
  }
  
  const availablePositions = config.availableCityPositions;
  const occupiedPositions = cityPositions;
  
  // Find the first available position that's not already occupied
  for (const position of availablePositions) {
    if (!occupiedPositions.includes(position)) {
      return position;
    }
  }
  
  // If all predefined positions are taken, return null
  return null;
}

// Build new city function
export function buildCity(): void {
  if (gameState.currentMode === 'command') {
    // Command Mode: Use predefined positions and config
    const config = (window as any).ModeManager?.getCurrentConfig();
    if (!config || !config.availableCityPositions) return;
    
    const maxCities = config.availableCityPositions.length;
    const currentCities = cityData.length;
    
    if (currentCities >= maxCities) return;
    
    const cost = 100 + (currentCities * 50); // Increasing cost per city
    if (gameState.scrap < cost) return;
    
    // Get next available predefined position
    const newCityX = getNextCityPosition();
    if (newCityX === null) return; // No available positions
    
    gameState.scrap -= cost;
    cityPositions.push(newCityX);
  } else {
    // Arcade Mode: Legacy behavior
    const maxCities = 6;
    const currentCities = cityData.length;
    
    if (currentCities >= maxCities) return;
    
    const cost = 100 + (currentCities * 50); // Increasing cost per city
    if (gameState.scrap < cost) return;
    
    gameState.scrap -= cost;
    
    // Use simple spacing for arcade mode
    const newCityX = 250 + (cityData.length * 120);
    cityPositions.push(newCityX);
  }
  
  // Add new city to cityData (same for both modes)
  const newCity = {
    population: 50, // Start with partial population
    maxPopulation: 100,
    productionMode: 'scrap' as const, // Default production mode
    baseProduction: 1.5 // Slightly higher production for built cities
  };
  
  cityData.push(newCity);
  gameState.cities++;
  
  // Initialize upgrade levels for new city
  cityUpgrades.push(0);
  cityPopulationUpgrades.push(0);
  cityBunkerUpgrades.push(0);
  
  // Initialize productivity upgrades for new city
  if (cityProductivityUpgrades.scrap) cityProductivityUpgrades.scrap.push(0);
  if (cityProductivityUpgrades.science) cityProductivityUpgrades.science.push(0);
  if (cityProductivityUpgrades.ammo) cityProductivityUpgrades.ammo.push(0);
  
  // Visual feedback
  const newCityX = cityPositions[cityPositions.length - 1];
  createUpgradeEffect(newCityX, 750, 'NEW CITY BUILT!', '#ff0');
  
  updateUI();
  if (gameState.currentMode === 'command') {
    (window as any).updateCommandPanel?.();
  }
}

// Build new turret function
export function buildTurret(): void {
  if (gameState.currentMode !== 'command') return;
  
  const config = (window as any).ModeManager?.getCurrentConfig();
  if (!config || !config.availableTurretPositions) return;
  
  const maxTurrets = config.availableTurretPositions.length;
  const currentTurrets = launchers.length;
  
  if (currentTurrets >= maxTurrets) return;
  
  const cost = 150 + (currentTurrets * 100); // Increasing cost: 150, 250, 350
  if (gameState.scrap < cost) return;
  
  gameState.scrap -= cost;
  
  // Find next available turret position
  const availablePositions = config.availableTurretPositions;
  const occupiedPositions = launchers.map(launcher => launcher.x);
  
  let newTurretPosition: { x: number; y: number } | null = null;
  for (const pos of availablePositions) {
    if (!occupiedPositions.includes(pos.x)) {
      newTurretPosition = pos;
      break;
    }
  }
  
  if (!newTurretPosition) return; // No available positions
  
  // Create new turret
  const newTurret = {
    x: newTurretPosition.x,
    y: newTurretPosition.y,
    missiles: 10,
    maxMissiles: 10,
    lastFire: 0,
    fireRate: 1000
  };
  
  launchers.push(newTurret);
  
  // Initialize upgrade levels for new turret
  const newTurretUpgrades = {
    speed: { level: 1, cost: 10 },
    explosion: { level: 1, cost: 15 },
    rate: { level: 1, cost: 20 },
    capacity: { level: 1, cost: 25 },
    autopilot: { level: 0, cost: 40 }
  };
  
  launcherUpgrades.push(newTurretUpgrades);
  
  // Visual feedback
  createUpgradeEffect(newTurretPosition.x, newTurretPosition.y - 30, 'NEW TURRET BUILT!', '#0ff');
  
  updateUI();
  if (gameState.currentMode === 'command') {
    (window as any).updateCommandPanel?.();
  }
}

// Upgrade city population capacity
export function upgradeCityPopulation(cityIndex: number): void {
  if (cityIndex < 0 || cityIndex >= cityData.length) return;
  if (destroyedCities.includes(cityIndex)) return;
  
  const currentLevel = cityPopulationUpgrades[cityIndex];
  const cost = 40 + (currentLevel * 30);
  
  if (gameState.scrap < cost) return;
  
  gameState.scrap -= cost;
  cityPopulationUpgrades[cityIndex]++;
  
  // Increase max population only - let population grow naturally over time
  const city = cityData[cityIndex];
  const populationIncrease = 50;
  city.maxPopulation += populationIncrease;
  
  // Visual feedback
  createUpgradeEffect(cityPositions[cityIndex], 750, `+${populationIncrease} POPULATION!`, '#0f0');
  
  updateUI();
  if (gameState.currentMode === 'command') {
    (window as any).updateCommandPanel?.();
  }
}

// Upgrade city productivity for specific resource type
export function upgradeCityProductivity(cityIndex: number, productionType: 'scrap' | 'science' | 'ammo'): void {
  if (cityIndex < 0 || cityIndex >= cityData.length) return;
  if (destroyedCities.includes(cityIndex)) return;
  if (!cityProductivityUpgrades[productionType]) return;
  
  const currentLevel = cityProductivityUpgrades[productionType][cityIndex];
  const cost = 25 + (currentLevel * 20);
  
  if (gameState.scrap < cost) return;
  
  gameState.scrap -= cost;
  cityProductivityUpgrades[productionType][cityIndex]++;
  
  // Visual feedback
  const modeColors = { scrap: '#0f0', science: '#00f', ammo: '#ff0' };
  const modeIcons = { scrap: '💰', science: '🔬', ammo: '📦' };
  createUpgradeEffect(cityPositions[cityIndex], 750, `${modeIcons[productionType]} +25% EFFICIENCY!`, modeColors[productionType]);
  
  updateUI();
  if (gameState.currentMode === 'command') {
    (window as any).updateCommandPanel?.();
  }
}

// Upgrade city bunker system
export function upgradeCityBunker(cityIndex: number): void {
  if (cityIndex < 0 || cityIndex >= cityData.length) return;
  if (destroyedCities.includes(cityIndex)) return;
  
  const currentLevel = cityBunkerUpgrades[cityIndex];
  const cost = 60 + (currentLevel * 40);
  
  if (gameState.scrap < cost) return;
  
  gameState.scrap -= cost;
  cityBunkerUpgrades[cityIndex]++;
  
  // Visual feedback
  createUpgradeEffect(cityPositions[cityIndex], 750, `🏢 BUNKER LV${cityBunkerUpgrades[cityIndex]}!`, '#f80');
  
  updateUI();
  if (gameState.currentMode === 'command') {
    (window as any).updateCommandPanel?.();
  }
}

// Unlock upgrade path function
export function unlockUpgradePath(upgradeType: string, cost: number): void {
  if (gameState.science < cost) return;
  if (unlockedUpgradePaths[upgradeType]) return; // Already unlocked
  
  gameState.science -= cost;
  unlockedUpgradePaths[upgradeType] = true;
  
  // Visual feedback
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (canvas) {
    createUpgradeEffect(canvas.width / 2, 300, `${upgradeType.toUpperCase()} PATH UNLOCKED!`, '#00f');
  }
  
  updateUI();
  if (gameState.currentMode === 'command') {
    (window as any).updateCommandPanel?.();
  }
}

// Legacy upgrade system initialization for compatibility
export function initializeUpgradeSystem(): void {
  if (gameState.currentMode === 'command') {
    // Command Mode uses floating panel system
    console.log('Command Mode upgrade system initialized');
    
    // Initialize global event delegation for upgrade panel clicks
    if (typeof (window as any).initializeGlobalEventDelegation === 'function') {
      (window as any).initializeGlobalEventDelegation();
    }
  } else {
    // Arcade Mode uses traditional sidebar system
    console.log('Arcade Mode upgrade system initialized');
  }
}

// Make functions globally available for compatibility
(window as any).emergencyAmmoPurchase = emergencyAmmoPurchase;
(window as any).purchaseGlobalUpgrade = purchaseGlobalUpgrade;
(window as any).setCityProductionMode = setCityProductionMode;
(window as any).upgradeCityFeature = upgradeCityFeature;
(window as any).upgrade = upgrade;
(window as any).upgradeCity = upgradeCity;
(window as any).upgradeGlobal = upgradeGlobal;
(window as any).repairCity = repairCity;
(window as any).buildCity = buildCity;
(window as any).buildTurret = buildTurret;
(window as any).upgradeCityPopulation = upgradeCityPopulation;
(window as any).upgradeCityProductivity = upgradeCityProductivity;
(window as any).upgradeCityBunker = upgradeCityBunker;
(window as any).unlockUpgradePath = unlockUpgradePath;
(window as any).createUpgradeEffect = createUpgradeEffect;

// Functions are already exported individually above
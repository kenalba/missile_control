// Collision detection utilities with proper TypeScript typing

import type { 
  Position, 
  Missile, 
  Explosion, 
  Launcher, 
  Plane,
  CollisionResult,
  GameState,
  GlobalUpgrades,
  CityData,
  UpgradeEffect
} from '@/types/gameTypes';

// Calculate distance between two points
export function calculateDistance(point1: Position, point2: Position): number {
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) + 
    Math.pow(point1.y - point2.y, 2)
  );
}

// Check if a point is within a radius of another point
export function isWithinRadius(center: Position, point: Position, radius: number): boolean {
  return calculateDistance(center, point) < radius;
}

// Check collision between a missile and its target
export function checkMissileTarget(missile: Missile): CollisionResult {
  const distance = calculateDistance(
    { x: missile.x, y: missile.y },
    { x: missile.targetX, y: missile.targetY }
  );
  
  return {
    hit: distance < 10,
    distance,
    point: { x: missile.x, y: missile.y }
  };
}

// Check if enemy missile hit ground
export function checkGroundHit(missile: Missile, groundLevel: number = 800): boolean {
  return missile.y >= groundLevel;
}

// Check if missile hit a city
export function checkCityHit(
  missileX: number, 
  cityX: number, 
  missileY: number = 790,
  hitRadius: number = 50
): boolean {
  return Math.abs(missileX - cityX) < hitRadius && missileY >= 790;
}

// Check if missile hit a launcher
export function checkLauncherHit(
  missilePosition: Position,
  launcher: Launcher,
  hitRadius: number = 40
): boolean {
  return launcher.missiles > 0 && 
         Math.abs(missilePosition.x - launcher.x) < hitRadius && 
         missilePosition.y >= launcher.y - 20;
}

// Check if explosion can destroy missile
export function checkExplosionMissileCollision(
  explosion: Explosion,
  missile: Missile
): boolean {
  if (!explosion.isPlayer) return false;
  
  const distance = calculateDistance(
    { x: explosion.x, y: explosion.y },
    { x: missile.x, y: missile.y }
  );
  
  return distance < explosion.radius;
}

// Check if explosion can destroy plane
export function checkExplosionPlaneCollision(
  explosion: Explosion,
  plane: Plane
): boolean {
  if (!explosion.isPlayer) return false;
  
  const distance = calculateDistance(
    { x: explosion.x, y: explosion.y },
    { x: plane.x, y: plane.y }
  );
  
  return distance < explosion.radius;
}

// Main collision detection function
// Note: This is a legacy function that should be refactored to use dependency injection
// for better testability and separation of concerns
export function checkCollisions(
  playerMissiles: Missile[],
  enemyMissiles: Missile[],
  explosions: Explosion[],
  planes: Plane[],
  launchers: Launcher[],
  cityPositions: number[],
  destroyedCities: number[],
  cityData: CityData[],
  cityUpgrades: number[],
  gameState: GameState,
  globalUpgrades: GlobalUpgrades,
  upgradeEffects: UpgradeEffect[],
  createExplosion: (x: number, y: number, isPlayer: boolean, launcherIndex?: number, type?: string) => void,
  addScreenShake: (intensity: number, duration: number) => void,
  applyScrapBonus: (baseScrap: number) => number,
  createUpgradeEffect: (x: number, y: number, text: string, color?: string) => void,
  checkAchievements: () => void
): void {
  // Check player missiles reaching targets
  for (let i = playerMissiles.length - 1; i >= 0; i--) {
    const missile = playerMissiles[i];
    const collision = checkMissileTarget(missile);
    
    if (collision.hit) {
      createExplosion(missile.x, missile.y, true, missile.launcherIndex);
      playerMissiles.splice(i, 1);
    }
  }
  
  // Check enemy missiles hitting ground
  for (let i = enemyMissiles.length - 1; i >= 0; i--) {
    const missile = enemyMissiles[i];
    
    if (checkGroundHit(missile)) {
      createExplosion(missile.x, missile.y, false);
      enemyMissiles.splice(i, 1);
      
      // Screen shake for ground impact
      addScreenShake(4, 300);
      
      // Check if city was hit
      cityPositions.forEach((cityX, cityIndex) => {
        if (!destroyedCities.includes(cityIndex) && checkCityHit(missile.x, cityX)) {
          handleCityHit(
            cityIndex,
            cityX,
            cityData,
            destroyedCities,
            cityUpgrades,
            gameState,
            upgradeEffects,
            createExplosion,
            addScreenShake
          );
        }
      });
      
      // Check if launcher was hit
      launchers.forEach((launcher) => {
        if (checkLauncherHit({ x: missile.x, y: missile.y }, launcher)) {
          handleLauncherHit(launcher, createUpgradeEffect, addScreenShake);
        }
      });
    }
  }
  
  // Check explosions destroying enemy missiles
  explosions.forEach(explosion => {
    if (!explosion.isPlayer) return;
    
    for (let i = enemyMissiles.length - 1; i >= 0; i--) {
      const missile = enemyMissiles[i];
      
      if (checkExplosionMissileCollision(explosion, missile)) {
        handleMissileDestroyed(
          missile,
          enemyMissiles,
          i,
          gameState,
          applyScrapBonus,
          createExplosion,
          checkAchievements,
          addScreenShake
        );
      }
    }
    
    // Check explosions destroying planes
    for (let i = planes.length - 1; i >= 0; i--) {
      const plane = planes[i];
      
      if (checkExplosionPlaneCollision(explosion, plane)) {
        plane.hp--;
        if (plane.hp <= 0) {
          handlePlaneDestroyed(
            plane,
            planes,
            i,
            gameState,
            globalUpgrades,
            upgradeEffects,
            applyScrapBonus,
            createExplosion,
            checkAchievements,
            addScreenShake
          );
        }
      }
    }
  });
}

// Handle city hit logic
function handleCityHit(
  cityIndex: number,
  cityX: number,
  cityData: CityData[],
  destroyedCities: number[],
  cityUpgrades: number[],
  gameState: GameState,
  upgradeEffects: UpgradeEffect[],
  createExplosion: (x: number, y: number, isPlayer: boolean, launcherIndex?: number, type?: string) => void,
  addScreenShake: (intensity: number, duration: number) => void
): void {
  if (gameState.currentMode === 'command') {
    // Command Mode: Damage population instead of destroying city
    if (cityData[cityIndex]) {
      const populationDamage = Math.floor(cityData[cityIndex].maxPopulation * 0.3);
      cityData[cityIndex].population = Math.max(0, cityData[cityIndex].population - populationDamage);
      
      // Visual feedback for population damage
      upgradeEffects.push({
        x: cityX,
        y: 750,
        text: `-${populationDamage} population`,
        alpha: 1,
        vy: -1,
        life: 100,
        color: '#ff0000'
      });
      
      createExplosion(cityX, 780, false, 0, 'damage');
      addScreenShake(6, 500);
      
      // Check if city is now uninhabitable
      if (cityData[cityIndex].population <= 0) {
        destroyedCities.push(cityIndex);
        gameState.cities--;
        gameState.achievements.citiesLost++;
        cityUpgrades[cityIndex] = 0;
        
        createExplosion(cityX, 780, false, 0, 'city');
        addScreenShake(8, 800);
        
        upgradeEffects.push({
          x: cityX,
          y: 720,
          text: 'CITY ABANDONED',
          alpha: 1,
          vy: -1,
          life: 150,
          color: '#ff4444'
        });
      }
    }
  } else {
    // Arcade Mode: Destroy city immediately
    destroyedCities.push(cityIndex);
    gameState.cities--;
    gameState.achievements.citiesLost++;
    cityUpgrades[cityIndex] = 0;
    
    createExplosion(cityX, 780, false, 0, 'city');
    addScreenShake(8, 800);
  }
  
  // Vibration feedback for any city hit
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
}

// Handle launcher hit logic
function handleLauncherHit(
  launcher: Launcher,
  createUpgradeEffect: (x: number, y: number, text: string, color?: string) => void,
  addScreenShake: (intensity: number, duration: number) => void
): void {
  launcher.missiles = 0;
  createUpgradeEffect(launcher.x, launcher.y - 30, 'AMMO DEPLETED!', '#f00');
  addScreenShake(4, 400);
}

// Handle missile destroyed logic
function handleMissileDestroyed(
  missile: Missile,
  enemyMissiles: Missile[],
  index: number,
  gameState: GameState,
  applyScrapBonus: (baseScrap: number) => number,
  createExplosion: (x: number, y: number, isPlayer: boolean) => void,
  checkAchievements: () => void,
  addScreenShake: (intensity: number, duration: number) => void
): void {
  // Higher rewards for destroying seekers
  if (missile.isSeeker) {
    gameState.score += 25;
    gameState.scrap += applyScrapBonus(5);
    gameState.achievements.seekersDestroyed++;
  } else {
    gameState.score += 10;
    gameState.scrap += applyScrapBonus(2);
  }
  
  gameState.achievements.missilesDestroyed++;
  gameState.achievements.totalScrapEarned += applyScrapBonus(missile.isSeeker ? 5 : 2);
  
  createExplosion(missile.x, missile.y, false);
  enemyMissiles.splice(index, 1);
  
  checkAchievements();
  addScreenShake(2, 150);
  
  // Mobile vibration feedback
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

// Handle plane destroyed logic
function handlePlaneDestroyed(
  plane: Plane,
  planes: Plane[],
  index: number,
  gameState: GameState,
  globalUpgrades: GlobalUpgrades,
  upgradeEffects: UpgradeEffect[],
  applyScrapBonus: (baseScrap: number) => number,
  createExplosion: (x: number, y: number, isPlayer: boolean, launcherIndex?: number, type?: string) => void,
  checkAchievements: () => void,
  addScreenShake: (intensity: number, duration: number) => void
): void {
  gameState.score += 50;
  let planeScrap = 5;
  
  if (globalUpgrades.salvage.level > 0) {
    planeScrap += 3;
  }
  
  gameState.scrap += applyScrapBonus(planeScrap);
  gameState.achievements.planesDestroyed++;
  gameState.achievements.totalScrapEarned += applyScrapBonus(planeScrap);
  
  // Stop engine sound if it exists
  const planeWithSound = plane as Plane & { engineSoundId?: string };
  if (planeWithSound.engineSoundId && (window as any).audioSystem?.stopSound) {
    (window as any).audioSystem.stopSound(planeWithSound.engineSoundId);
  }
  
  createExplosion(plane.x, plane.y, false, 0, 'plane');
  planes.splice(index, 1);
  
  checkAchievements();
  addScreenShake(5, 400);
  
  upgradeEffects.push({
    x: plane.x,
    y: plane.y - 30,
    text: `+50pts +${applyScrapBonus(planeScrap)}scrap`,
    alpha: 1,
    vy: -2,
    life: 80
  });
  
  // Mobile vibration feedback
  if (navigator.vibrate) {
    navigator.vibrate([50, 20, 50]);
  }
}
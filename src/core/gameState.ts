// Core Game State Management
import type { GameState } from '@/types/gameTypes';

// Core game state - timing, waves, mode management
export let gameState: GameState = {
    score: 0,
    scrap: 0,
    science: 0,
    wave: 1,
    cities: 6,
    gameRunning: true,
    paused: false,
    lastTime: 0,
    gameTime: 0, // Pause-aware game time (milliseconds)
    pauseStartTime: 0,
    waveTimer: 0,
    nextWaveDelay: 3000,
    waveBreak: false,
    waveBreakTimer: 0,
    enemiesSpawned: 0,
    enemiesToSpawn: 6, // Wave 1 default
    planesSpawned: 0,
    planesToSpawn: 0,
    cityBonusPhase: false,
    cityBonusTimer: 0,
    cityBonusIndex: 0,
    cityBonusTotal: 0,
    missileBonusPhase: false,
    missileBonusTimer: 0,
    missileBonusIndex: 0,
    missileBonusTotal: 0,
    currentMode: 'arcade',
    
    // Command Mode specific state
    commandMode: {
        gameTime: 0,
        difficulty: 1,
        lastResourceTick: 0,
        resourceTickInterval: 1000,
        lastEnemySpawn: 0,
        enemySpawnInterval: 2000,
        selectedEntity: null,
        selectedEntityType: null
    },
    
    // Screen shake system
    screenShake: {
        intensity: 0,
        duration: 0,
        x: 0,
        y: 0
    },
    
    // Achievement tracking
    achievements: {
        missilesDestroyed: 0,
        planesDestroyed: 0,
        wavesCompleted: 0,
        citiesLost: 0,
        seekersDestroyed: 0,
        totalScrapEarned: 0,
        lastMilestoneWave: 0
    }
};

// Screen shake functions
export function addScreenShake(intensity: number, duration: number): void {
    gameState.screenShake.intensity = Math.max(gameState.screenShake.intensity, intensity);
    gameState.screenShake.duration = Math.max(gameState.screenShake.duration, duration);
}

export function updateScreenShake(deltaTime: number): void {
    if (gameState.screenShake.duration > 0) {
        gameState.screenShake.duration -= deltaTime;
        
        // Generate random shake offset
        const shakeAmount = gameState.screenShake.intensity * (gameState.screenShake.duration / 1000);
        gameState.screenShake.x = (Math.random() - 0.5) * shakeAmount;
        gameState.screenShake.y = (Math.random() - 0.5) * shakeAmount;
        
        if (gameState.screenShake.duration <= 0) {
            gameState.screenShake.intensity = 0;
            gameState.screenShake.x = 0;
            gameState.screenShake.y = 0;
        }
    }
}

// Wave management
export function continueGame(): void {
    gameState.wave++;
    gameState.achievements.wavesCompleted++;
    gameState.waveBreak = false;
    gameState.waveBreakTimer = 0;
    gameState.enemiesSpawned = 0;
    gameState.planesSpawned = 0;
    
    // Better difficulty curve: starts easier, ramps up more gradually
    gameState.enemiesToSpawn = Math.floor(4 + (gameState.wave * 1.5) + (gameState.wave * gameState.wave * 0.2));
    
    // Set number of planes per wave (starting at wave 5)
    gameState.planesToSpawn = gameState.wave >= 5 ? Math.floor(1 + (gameState.wave - 5) * 0.5) : 0;
    
    const waveBreakElement = document.getElementById('waveBreak');
    if (waveBreakElement) {
        waveBreakElement.style.display = 'none';
    }
    
    // Check for wave milestone celebrations (imported from achievements)
    if (typeof (window as any).checkWaveMilestones === 'function') {
        (window as any).checkWaveMilestones();
    }
}

// Game reset functionality
export function resetGameState(): void {
    gameState.score = 0;
    gameState.scrap = 0;
    gameState.science = 0;
    gameState.wave = 1;
    gameState.cities = 6;
    gameState.gameRunning = true;
    gameState.paused = false;
    gameState.lastTime = 0;
    gameState.waveTimer = 0;
    gameState.nextWaveDelay = 3000;
    gameState.waveBreak = false;
    gameState.waveBreakTimer = 0;
    gameState.enemiesSpawned = 0;
    gameState.enemiesToSpawn = 6;
    gameState.planesSpawned = 0;
    gameState.planesToSpawn = 0;
    gameState.cityBonusPhase = false;
    gameState.cityBonusTimer = 0;
    gameState.cityBonusIndex = 0;
    gameState.cityBonusTotal = 0;
    gameState.missileBonusPhase = false;
    gameState.missileBonusTimer = 0;
    gameState.missileBonusIndex = 0;
    gameState.missileBonusTotal = 0;
    gameState.currentMode = 'arcade';
    
    // Reset command mode state
    gameState.commandMode = {
        gameTime: 0,
        difficulty: 1,
        lastResourceTick: 0,
        resourceTickInterval: 1000,
        lastEnemySpawn: 0,
        enemySpawnInterval: 2000,
        selectedEntity: null,
        selectedEntityType: null
    };
    
    // Reset screen shake
    gameState.screenShake = {
        intensity: 0,
        duration: 0,
        x: 0,
        y: 0
    };
    
    // Reset achievements
    gameState.achievements = {
        missilesDestroyed: 0,
        planesDestroyed: 0,
        wavesCompleted: 0,
        citiesLost: 0,
        seekersDestroyed: 0,
        totalScrapEarned: 0,
        lastMilestoneWave: 0
    };
}

// Complete game restart function
export function restartGame(): void {
    // Reset core game state
    resetGameState();
    
    // Reset all subsystems
    if (typeof (window as any).resetUpgrades === 'function') {
        (window as any).resetUpgrades();
    }
    
    if (typeof (window as any).resetCityData === 'function') {
        (window as any).resetCityData();
    }
    
    if (typeof (window as any).resetAchievements === 'function') {
        (window as any).resetAchievements();
    }
    
    // Reset entity arrays (legacy compatibility)
    (window as any).playerMissiles = [];
    (window as any).enemyMissiles = [];
    (window as any).explosions = [];
    (window as any).particles = [];
    (window as any).upgradeEffects = [];
    (window as any).planes = [];
    (window as any).destroyedCities = [];
    (window as any).destroyedLaunchers = [];
    
    // Reset launchers to initial state
    (window as any).launchers = [
        { x: 150, y: 770, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 4000 }, // Level 1: 4000ms
        { x: 600, y: 770, missiles: 12, maxMissiles: 12, lastFire: 0, fireRate: 2667 }, // Level 2: ~2667ms (middle turret starts upgraded)
        { x: 1050, y: 770, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 4000 } // Level 1: 4000ms
    ];
    
    // Hide game over and wave break screens
    const gameOverElement = document.getElementById('gameOver');
    const waveBreakElement = document.getElementById('waveBreak');
    
    if (gameOverElement) gameOverElement.style.display = 'none';
    if (waveBreakElement) waveBreakElement.style.display = 'none';
    
    // Show splash screen instead of immediately restarting
    if (typeof (window as any).showSplashScreen === 'function') {
        (window as any).showSplashScreen();
    }
    
    console.log('🔄 Game restarted - all systems reset');
}

// Make globally available for legacy compatibility
(window as any).gameState = gameState;
(window as any).addScreenShake = addScreenShake;
(window as any).updateScreenShake = updateScreenShake;
(window as any).continueGame = continueGame;
(window as any).resetGameState = resetGameState;
(window as any).restartGame = restartGame;
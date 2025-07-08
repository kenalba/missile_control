// Main game loop and update logic
import { updateScreenShake } from '@/core/gameState';
import { gameState } from '@/systems/observableState';
import { updateEntities } from '@/entities';
import { spawnEnemyMissile } from '@/entities/missiles';
import { spawnPlane } from '@/entities/planes';
import { saveSystem } from '@/systems/saveSystem';
import { timeManager } from '@/systems/timeManager';
import { generateCityResources, updateCityPopulation } from '@/core/cities';

export function updateGame(deltaTime: number): void {
    // Always update time manager (handles pause state internally)
    timeManager.update();
    
    // Skip updates if paused
    if (gameState.paused) {
        return;
    }
    
    // Update screen shake
    updateScreenShake(deltaTime);
    
    // Update entities
    updateEntities(deltaTime, document.getElementById('gameCanvas') as HTMLCanvasElement);
    
    // Mode-specific gameplay updates
    if (gameState.currentMode === 'command') {
        updateCommandMode(deltaTime);
    } else {
        updateArcadeMode(deltaTime);
    }
    
    // Check game over
    if (gameState.cities <= 0) {
        gameState.gameRunning = false;
        
        // Save game over data
        saveSystem.saveGameOver(gameState.score, gameState.wave);
        
        const gameOverElement = document.getElementById('gameOver');
        const finalScoreElement = document.getElementById('finalScore');
        const finalWaveElement = document.getElementById('finalWave');
        
        if (gameOverElement) gameOverElement.style.display = 'block';
        if (finalScoreElement) finalScoreElement.textContent = gameState.score.toString();
        if (finalWaveElement) finalWaveElement.textContent = gameState.wave.toString();
        
        // Update high scores display on game over
        (window as any).updateHighScoresDisplay?.();
    }
    
    (window as any).checkCollisions?.();
}

// Command Mode continuous gameplay updates
function updateCommandMode(deltaTime: number): void {
    // Update game time and difficulty
    gameState.commandMode.gameTime += deltaTime;
    
    // Gradually increase difficulty over time (every 30 seconds)
    const difficultyIncreaseInterval = 30000; // 30 seconds
    gameState.commandMode.difficulty = 1 + Math.floor(gameState.commandMode.gameTime / difficultyIncreaseInterval) * 0.2;
    
    // Track last enemy spawn time
    gameState.commandMode.lastEnemySpawn += deltaTime;
    
    // Spawn enemies based on difficulty and time
    const adjustedSpawnInterval = gameState.commandMode.enemySpawnInterval / gameState.commandMode.difficulty;
    
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (gameState.commandMode.lastEnemySpawn >= adjustedSpawnInterval) {
        spawnEnemyMissile(canvas);
        gameState.commandMode.lastEnemySpawn = 0;
        
        // Occasionally spawn planes (10% chance)
        if (Math.random() < 0.1) {
            spawnPlane(canvas);
        }
    }
    
    // Update resource tick system for city production
    gameState.commandMode.lastResourceTick += deltaTime;
    if (gameState.commandMode.lastResourceTick >= gameState.commandMode.resourceTickInterval) {
        generateCityResources();
        gameState.commandMode.lastResourceTick = 0;
    }
    
    // Update city population growth
    updateCityPopulation(deltaTime);
    
    // Update UI for Command Mode
    (window as any).updateUI?.();
}

// Arcade Mode wave-based gameplay updates  
function updateArcadeMode(deltaTime: number): void {
    if (!gameState.gameRunning || gameState.waveBreak) return;
    
    gameState.waveTimer += deltaTime;
    
    // Spawn enemies during wave
    const waveLength = 10000 + (gameState.wave * 2000); // Longer waves as game progresses
    const enemiesPerWave = Math.min(8 + gameState.wave, 25); // Cap at 25 enemies per wave
    const spawnInterval = waveLength / enemiesPerWave;
    
    if (gameState.enemiesSpawned < enemiesPerWave && 
        gameState.waveTimer >= (gameState.enemiesSpawned + 1) * spawnInterval) {
        
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        spawnEnemyMissile(canvas);
        gameState.enemiesSpawned++;
    }
    
    // Handle plane spawning (guaranteed timing: 25%, 50%, 75% through wave)
    const planeSpawnTimes = [0.25, 0.5, 0.75];
    const waveProgress = gameState.waveTimer / waveLength;
    
    planeSpawnTimes.forEach((spawnTime, index) => {
        if (waveProgress >= spawnTime && gameState.planesSpawned <= index && gameState.wave >= 5) {
            const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
            spawnPlane(canvas);
            gameState.planesSpawned++;
        }
    });
    
    // Check if wave is complete
    if (gameState.waveTimer >= waveLength && (window as any).enemyMissiles?.length === 0) {
        (window as any).completeWave?.();
    }
    
    // Update UI
    (window as any).updateUI?.();
}

// Game loop function
export function gameLoop(currentTime: number): void {
    const deltaTime = currentTime - gameState.lastTime;
    gameState.lastTime = currentTime;
    
    // Update game logic
    updateGame(deltaTime);
    
    // Render the game
    (window as any).render?.();
    
    // Continue the loop
    requestAnimationFrame(gameLoop);
}

// Initialize the game systems
export function initGame(): void {
    console.log('🎮 Initializing game systems...');
    
    // Initialize renderer
    if (typeof (window as any).initializeRenderer === 'function') {
        (window as any).initializeRenderer();
    }
    
    // Initialize upgrades
    if (typeof (window as any).initializeUpgrades === 'function') {
        (window as any).initializeUpgrades();
    }
    
    // Show splash screen (don't start game loop yet)
    showSplashScreen();
}

// Show splash screen
function showSplashScreen(): void {
    const splashElement = document.getElementById('splashScreen');
    if (splashElement) {
        splashElement.style.display = 'flex';
    }
    gameState.gameRunning = false;
    
    // Highlight the last selected mode
    highlightLastSelectedMode();
}

// Highlight the last selected mode on the splash screen
function highlightLastSelectedMode(): void {
    const saveSystem = (window as any).saveSystem;
    if (saveSystem) {
        const lastMode = saveSystem.getLastSelectedMode();
        
        // Remove previous highlights
        const arcadeBtn = document.getElementById('arcadeModeBtn');
        const commandBtn = document.getElementById('commandModeBtn');
        
        if (arcadeBtn) arcadeBtn.classList.remove('recommended');
        if (commandBtn) commandBtn.classList.remove('recommended');
        
        // Add highlight to last selected mode
        if (lastMode === 'command' && commandBtn) {
            commandBtn.classList.add('recommended');
        } else if (arcadeBtn) {
            arcadeBtn.classList.add('recommended');
        }
    }
}

// Start the actual game
export function startGame(mode: 'arcade' | 'command' = 'arcade'): void {
    const splashElement = document.getElementById('splashScreen');
    if (splashElement) {
        splashElement.style.display = 'none';
    }
    
    // Save the selected mode preference
    const saveSystem = (window as any).saveSystem;
    if (saveSystem) {
        saveSystem.saveMode(mode);
    }
    
    // Initialize time manager
    timeManager.initialize();
    
    // Initialize game using ModeManager
    const modeManager = (window as any).ModeManager;
    if (modeManager && modeManager.initializeMode(mode)) {
        gameState.gameRunning = true;
        gameState.lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    } else {
        console.error('Failed to initialize game mode:', mode);
        // Fall back to splash screen
        showSplashScreen();
    }
}

// Functions are already exported above
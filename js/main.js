// Main game loop and initialization
function updateGame(deltaTime) {
    // Skip updates if paused
    if (gameState.paused) {
        return;
    }
    
    
    // Update screen shake
    updateScreenShake(deltaTime);
    
    // Update entities
    updateEntities(deltaTime);
    
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
        if (window.saveSystem) {
            saveSystem.saveGameOver(gameState.score, gameState.wave);
        }
        
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('finalScore').textContent = gameState.score;
        document.getElementById('finalWave').textContent = gameState.wave;
        
        // Update high scores display on game over
        updateHighScoresDisplay();
    }
    
    checkCollisions();
}

// Command Mode continuous gameplay updates
function updateCommandMode(deltaTime) {
    // Update game time and difficulty
    gameState.commandMode.gameTime += deltaTime;
    
    // Gradually increase difficulty over time (every 30 seconds)
    const difficultyIncreaseInterval = 30000; // 30 seconds
    gameState.commandMode.difficulty = 1 + Math.floor(gameState.commandMode.gameTime / difficultyIncreaseInterval) * 0.2;
    
    // Generate resources periodically
    gameState.commandMode.lastResourceTick += deltaTime;
    if (gameState.commandMode.lastResourceTick >= gameState.commandMode.resourceTickInterval) {
        generateCityResources();
        gameState.commandMode.lastResourceTick = 0;
    }
    
    // Continuous enemy spawning
    gameState.commandMode.lastEnemySpawn += deltaTime;
    const adjustedSpawnInterval = gameState.commandMode.enemySpawnInterval / gameState.commandMode.difficulty;
    
    if (gameState.commandMode.lastEnemySpawn >= adjustedSpawnInterval) {
        spawnEnemyMissile();
        gameState.commandMode.lastEnemySpawn = 0;
        
        // Occasionally spawn planes (10% chance)
        if (Math.random() < 0.1) {
            spawnPlane();
        }
    }
    
    // Update city population (gradual growth)
    updateCityPopulation(deltaTime);
}

// Generate resources from cities based on population and production mode
function generateCityResources() {
    for (let i = 0; i < cityData.length; i++) {
        // Skip destroyed cities
        if (destroyedCities.includes(i)) continue;
        
        const city = cityData[i];
        if (city.population <= 0) continue;
        
        // Calculate production based on population percentage and base production
        const populationMultiplier = city.population / city.maxPopulation;
        let baseProduction = Math.floor(city.baseProduction * populationMultiplier);
        
        // Apply productivity upgrades for this specific production type
        const productivityLevel = cityProductivityUpgrades[city.productionMode][i];
        const productivityMultiplier = 1 + (productivityLevel * 0.25); // +25% per level
        const finalProduction = Math.floor(baseProduction * productivityMultiplier);
        
        if (city.productionMode === 'scrap') {
            gameState.scrap += finalProduction;
        } else if (city.productionMode === 'science' && globalUpgrades.research && globalUpgrades.research.level > 0) {
            gameState.science += finalProduction;
        } else if (city.productionMode === 'ammo') {
            // Distribute ammo to launchers that need it
            distributeAmmo(finalProduction);
        }
        
        // Visual feedback for resource generation
        if (finalProduction > 0) {
            const cityX = cityPositions[i];
            let color = '#0f0'; // Default green for scrap
            if (city.productionMode === 'science') color = '#00f'; // Blue for science
            else if (city.productionMode === 'ammo') color = '#ff0'; // Yellow for ammo
            
            upgradeEffects.push({
                x: cityX,
                y: 750,
                text: `+${finalProduction} ${city.productionMode}`,
                alpha: 0.8,
                vy: -0.5,
                life: 60,
                color: color
            });
        }
    }
}

// Distribute ammo to launchers that need it most
function distributeAmmo(ammoToDistribute) {
    let remainingAmmo = ammoToDistribute;
    
    // Find launchers that need ammo (not destroyed and below max)
    const launchersNeedingAmmo = [];
    for (let i = 0; i < launchers.length; i++) {
        if (!destroyedLaunchers.includes(i) && launchers[i].missiles < launchers[i].maxMissiles) {
            launchersNeedingAmmo.push({
                index: i,
                launcher: launchers[i],
                needed: launchers[i].maxMissiles - launchers[i].missiles
            });
        }
    }
    
    // Distribute ammo evenly among launchers that need it
    while (remainingAmmo > 0 && launchersNeedingAmmo.length > 0) {
        // Remove launchers that are now full
        for (let i = launchersNeedingAmmo.length - 1; i >= 0; i--) {
            if (launchersNeedingAmmo[i].launcher.missiles >= launchersNeedingAmmo[i].launcher.maxMissiles) {
                launchersNeedingAmmo.splice(i, 1);
            }
        }
        
        if (launchersNeedingAmmo.length === 0) break;
        
        // Give 1 ammo to each launcher that needs it
        launchersNeedingAmmo.forEach(entry => {
            if (remainingAmmo > 0) {
                entry.launcher.missiles++;
                remainingAmmo--;
            }
        });
    }
}

// Update city population (gradual growth and recovery)
function updateCityPopulation(deltaTime) {
    const growthRate = 0.1; // Population grows by 0.1 per second
    
    for (let i = 0; i < cityData.length; i++) {
        if (destroyedCities.includes(i)) continue;
        
        const city = cityData[i];
        if (city.population < city.maxPopulation) {
            city.population += (growthRate * deltaTime) / 1000;
            city.population = Math.min(city.population, city.maxPopulation);
        }
    }
}

// Arcade Mode wave-based gameplay updates
function updateArcadeMode(deltaTime) {
    // Spawn enemy missiles (only during active gameplay, not wave breaks)
    if (!gameState.waveBreak && gameState.enemiesToSpawn > 0) {
        // Time-based spawn rate (normalized to 60 FPS)
        const frameMultiplier = deltaTime / 16.67;
        const baseSpawnRate = 0.012; // Base 1.2% chance per frame at 60 FPS
        const waveMultiplier = Math.min(gameState.wave * 0.003, 0.025); // +0.3% per wave, capped at +2.5%
        const spawnChance = (baseSpawnRate + waveMultiplier) * frameMultiplier;
        
        if (Math.random() < spawnChance) {
            spawnEnemyMissile();
            gameState.enemiesSpawned++;
            gameState.enemiesToSpawn--;
        }
    }
    
    // Track time since all enemies spawned for wave completion timeout
    if (gameState.enemiesToSpawn === 0) {
        gameState.waveTimer += deltaTime;
    } else {
        gameState.waveTimer = 0; // Reset timer while still spawning
    }
    
    // Spawn planes (guaranteed timing per wave)
    if (!gameState.waveBreak && gameState.planesToSpawn > 0) {
        // Calculate when planes should spawn based on wave progress
        const totalEnemiesThisWave = Math.floor(4 + (gameState.wave * 1.5) + (gameState.wave * gameState.wave * 0.2));
        const enemiesSpawned = gameState.enemiesSpawned;
        const waveProgress = enemiesSpawned / totalEnemiesThisWave;
        
        // Spawn planes at specific intervals: 25%, 50%, 75% through the wave
        const planeSpawnPoints = [0.25, 0.50, 0.75];
        const nextPlaneIndex = gameState.planesSpawned;
        
        if (nextPlaneIndex < planeSpawnPoints.length && 
            nextPlaneIndex < gameState.planesToSpawn && 
            waveProgress >= planeSpawnPoints[nextPlaneIndex]) {
            spawnPlane();
            gameState.planesSpawned++;
            gameState.planesToSpawn--;
        }
    }
    
    // Check if any enemy missiles can damage live targets - use dynamic threat detection
    function anyMissilesCanDamage() {
        if (enemyMissiles.length === 0) return false;
        
        return enemyMissiles.some(missile => {
            // For seekers, they're always potentially threatening if there are targets
            if (missile.isSeeker) {
                // Check if there are any live cities or launchers
                const hasLiveCities = cityPositions.some((_, index) => !destroyedCities.includes(index));
                const hasLiveLaunchers = launchers.some((_, index) => !destroyedLaunchers.includes(index));
                return hasLiveCities || hasLiveLaunchers;
            }
            
            // Use the dynamic threat detection from entities.js for normal missiles
            return isMissileThreatening(missile);
        });
    }
    
    // Check wave completion (all enemies spawned and no threatening missiles remaining)
    // Also require player missiles and explosions to clear for clean wave transition
    const allEnemiesSpawned = gameState.enemiesToSpawn === 0;
    const noThreateningMissiles = !anyMissilesCanDamage();
    const noPlayerActivity = playerMissiles.length === 0 && explosions.length === 0 && planes.length === 0;
    
    // Emergency timeout: if enemies spawned and no player activity for 5 seconds, force wave end
    const emergencyTimeout = allEnemiesSpawned && noPlayerActivity && 
        gameState.waveTimer > 5000; // 5 second timeout
    
    const shouldEndWave = allEnemiesSpawned && (noThreateningMissiles || emergencyTimeout) && noPlayerActivity;
        
    if (shouldEndWave) {
        if (!gameState.waveBreak && !gameState.cityBonusPhase && !gameState.missileBonusPhase) {
            // Clear any remaining enemy missiles that can't damage live targets
            enemyMissiles.length = 0;
            
            // Start missile bonus counting phase first (don't refill/respawn yet)
            gameState.missileBonusPhase = true;
            gameState.missileBonusTimer = 0;
            gameState.missileBonusIndex = 0;
            gameState.cityBonusTotal = 0;
            gameState.missileBonusTotal = 0;
        }
    }
    
    // Handle missile bonus counting (fast)
    if (gameState.missileBonusPhase) {
        gameState.missileBonusTimer += deltaTime;
        
        // Count missiles every 300ms (faster than cities)
        if (gameState.missileBonusTimer >= 300 && gameState.missileBonusIndex < launchers.length) {
            const launcherIndex = gameState.missileBonusIndex;
            const launcher = launchers[launcherIndex];
            
            // Only count if launcher wasn't destroyed
            if (!destroyedLaunchers.includes(launcherIndex) && launcher.missiles > 0) {
                const scrapPerMissile = 1; // 1 scrap per remaining missile
                const totalMissileScrap = applyScrapBonus(launcher.missiles * scrapPerMissile);
                
                gameState.scrap += totalMissileScrap;
                gameState.missileBonusTotal += totalMissileScrap;
                
                // Create visual effect at launcher location
                upgradeEffects.push({
                    x: launcher.x,
                    y: launcher.y - 40,
                    text: `+${totalMissileScrap} scrap (${launcher.missiles} missiles)`,
                    alpha: 1,
                    vy: -1,
                    life: 100
                });
                
                // Play a quick bonus sound
                audioSystem.playTone(300 + (launcherIndex * 150), 0.15, 'square', 0.02);
            }
            
            gameState.missileBonusIndex++;
            gameState.missileBonusTimer = 0;
        }
        
        // After counting all launchers, move to city bonus phase
        if (gameState.missileBonusIndex >= launchers.length) {
            gameState.missileBonusPhase = false;
            gameState.cityBonusPhase = true;
            gameState.cityBonusTimer = 0;
            gameState.cityBonusIndex = 0;
            // Don't reload launchers yet - wait until after all bonuses are counted
        }
    }
    
    // Handle city bonus counting (medium speed)
    if (gameState.cityBonusPhase) {
        gameState.cityBonusTimer += deltaTime;
        
        // Count cities every 500ms (faster than before)
        if (gameState.cityBonusTimer >= 500 && gameState.cityBonusIndex < cityPositions.length) {
            const cityIndex = gameState.cityBonusIndex;
            
            // Check if this city is still alive
            if (!destroyedCities.includes(cityIndex)) {
                const pointsPerCity = 100 * gameState.wave; // Points still scale with wave
                const baseScrapPerCity = 5; // Fixed base scrap, no wave scaling
                const cityMultiplier = 1 + (cityUpgrades[cityIndex] * 0.5); // 50% per city level
                const scrapPerCity = applyScrapBonus(Math.floor(baseScrapPerCity * cityMultiplier));
                
                gameState.score += pointsPerCity;
                gameState.scrap += scrapPerCity;
                gameState.cityBonusTotal += pointsPerCity + scrapPerCity;
                
                // Create visual effect at city location
                const cityX = cityPositions[cityIndex];
                upgradeEffects.push({
                    x: cityX,
                    y: 740,
                    text: `+${pointsPerCity}pts +${scrapPerCity}scrap`,
                    alpha: 1,
                    vy: -1,
                    life: 120
                });
                
                // Play a bonus sound
                audioSystem.playTone(400 + (cityIndex * 100), 0.2, 'sine', 0.03);
            }
            
            gameState.cityBonusIndex++;
            gameState.cityBonusTimer = 0;
        }
        
        // After counting all cities, show wave break
        if (gameState.cityBonusIndex >= cityPositions.length) {
            gameState.cityBonusPhase = false;
            gameState.waveBreak = true;
            gameState.waveBreakTimer = 0;
            
            const baseScrap = applyScrapBonus(gameState.wave * 5);
            
            // Save wave completion
            if (window.saveSystem) {
                saveSystem.saveWaveCompletion(gameState.wave, gameState.score);
            }
            
            // NOW refill launchers and respawn destroyed ones (after all counting is done)
            launchers.forEach(launcher => {
                launcher.missiles = launcher.maxMissiles;
            });
            destroyedLaunchers = [];
            
            // Show wave break UI
            document.getElementById('waveBreak').style.display = 'block';
            document.getElementById('waveNumber').textContent = gameState.wave;
            document.getElementById('scrapEarned').textContent = baseScrap;
            
            // Calculate city bonus accurately (matching the actual calculation logic)
            let actualCityScrap = 0;
            for (let i = 0; i < cityPositions.length; i++) {
                if (!destroyedCities.includes(i)) {
                    const baseScrapPerCity = 5; // Fixed base scrap, no wave scaling
                    const cityMultiplier = 1 + (cityUpgrades[i] * 0.5); // 50% per city level
                    const scrapPerCity = applyScrapBonus(Math.floor(baseScrapPerCity * cityMultiplier));
                    actualCityScrap += scrapPerCity;
                }
            }
            
            document.getElementById('cityBonus').textContent = actualCityScrap;
            document.getElementById('missileBonus').textContent = gameState.missileBonusTotal;
            document.getElementById('totalScrap').textContent = baseScrap + actualCityScrap + gameState.missileBonusTotal;
            
            gameState.scrap += baseScrap; // Add base scrap (other bonuses already added during counting)
        }
    }
    
    // Handle wave break
    if (gameState.waveBreak) {
        gameState.waveBreakTimer += deltaTime;
        // Auto-continue disabled - players must manually click continue
    }
    
    // Check game over
    if (gameState.cities <= 0) {
        gameState.gameRunning = false;
        
        // Save game over data
        if (window.saveSystem) {
            saveSystem.saveGameOver(gameState.score, gameState.wave);
        }
        
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('finalScore').textContent = gameState.score;
        document.getElementById('finalWave').textContent = gameState.wave;
        
        // Update high scores display on game over
        updateHighScoresDisplay();
    }
    
    console.log("About to call checkCollisions()");
    checkCollisions();
    console.log("checkCollisions() completed");
}

function gameLoop(currentTime) {
    const deltaTime = currentTime - gameState.lastTime;
    gameState.lastTime = currentTime;
    
    if (gameState.gameRunning) {
        updateGame(deltaTime);
    }
    
    render();
    updateUI();
    
    requestAnimationFrame(gameLoop);
}

// City upgrades are now handled via canvas click detection in input.js

// Initialize the game systems (but don't start gameplay)
function initGame() {
    initializeRenderer();
    initializeInput();
    // Show splash screen first, don't start gameplay yet
    showSplashScreen();
}

// Show splash screen
function showSplashScreen() {
    document.getElementById('splashScreen').style.display = 'flex';
    gameState.gameRunning = false;
    
    // Highlight the last selected mode
    highlightLastSelectedMode();
}

// Highlight the last selected mode on the splash screen
function highlightLastSelectedMode() {
    if (window.saveSystem) {
        const lastMode = saveSystem.getLastSelectedMode();
        
        // Remove previous highlights
        document.getElementById('arcadeModeBtn').classList.remove('recommended');
        document.getElementById('commandModeBtn').classList.remove('recommended');
        
        // Add highlight to last selected mode
        if (lastMode === 'command') {
            document.getElementById('commandModeBtn').classList.add('recommended');
        } else {
            document.getElementById('arcadeModeBtn').classList.add('recommended');
        }
    }
}

// Start the actual game
function startGame(mode = 'arcade') {
    document.getElementById('splashScreen').style.display = 'none';
    
    // Save the selected mode preference
    if (window.saveSystem) {
        saveSystem.saveMode(mode);
    }
    
    // Initialize game using ModeManager
    if (ModeManager.initializeMode(mode)) {
        gameState.gameRunning = true;
        requestAnimationFrame(gameLoop);
    } else {
        console.error('Failed to initialize game mode:', mode);
        // Fall back to splash screen
        document.getElementById('splashScreen').style.display = 'flex';
    }
}


// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', initGame);
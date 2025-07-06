// Main game loop and initialization
function updateGame(deltaTime) {
    // Update entities
    updateEntities(deltaTime);
    
    // Spawn enemy missiles (only during active gameplay, not wave breaks)
    if (!gameState.waveBreak && gameState.enemiesToSpawn > 0) {
        // Rebalanced spawn rate for smoother difficulty progression
        const baseSpawnRate = 0.012; // Base 1.2% chance per frame
        const waveMultiplier = Math.min(gameState.wave * 0.003, 0.025); // +0.3% per wave, capped at +2.5%
        const spawnChance = baseSpawnRate + waveMultiplier;
        
        if (Math.random() < spawnChance) {
            spawnEnemyMissile();
            gameState.enemiesSpawned++;
            gameState.enemiesToSpawn--;
        }
    }
    
    // Spawn planes starting at wave 5
    if (!gameState.waveBreak && gameState.wave >= 5) {
        // Lower spawn rate for planes - they're more powerful
        const planeSpawnChance = 0.0008 + (gameState.wave - 5) * 0.0002; // 0.08% base, +0.02% per wave
        if (Math.random() < planeSpawnChance) {
            spawnPlane();
        }
    }
    
    // Check if any enemy missiles can damage live targets - use dynamic threat detection
    function anyMissilesCanDamage() {
        if (enemyMissiles.length === 0) return false;
        
        return enemyMissiles.some(missile => {
            // Use the dynamic threat detection from entities.js
            return isMissileThreatening(missile);
        });
    }
    
    // Check wave completion (all enemies spawned and no enemies/missiles/explosions/planes remaining)
    // OR no remaining missiles can damage live targets
    const shouldEndWave = gameState.enemiesToSpawn === 0 && 
        (enemyMissiles.length === 0 || !anyMissilesCanDamage()) && 
        playerMissiles.length === 0 && explosions.length === 0 && planes.length === 0;
        
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
                const totalMissileScrap = launcher.missiles * scrapPerMissile;
                
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
                const scrapPerCity = Math.floor(baseScrapPerCity * cityMultiplier);
                
                gameState.score += pointsPerCity;
                gameState.scrap += scrapPerCity;
                gameState.cityBonusTotal += pointsPerCity + scrapPerCity;
                
                // Create visual effect at city location
                const cityX = cityPositions[cityIndex];
                upgradeEffects.push({
                    x: cityX,
                    y: 700,
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
            
            const baseScrap = gameState.wave * 5;
            
            // NOW refill launchers and respawn destroyed ones (after all counting is done)
            launchers.forEach(launcher => {
                launcher.missiles = launcher.maxMissiles;
            });
            destroyedLaunchers = [];
            
            // Show wave break UI
            document.getElementById('waveBreak').style.display = 'block';
            document.getElementById('waveNumber').textContent = gameState.wave;
            document.getElementById('scrapEarned').textContent = baseScrap;
            const baseCityScrap = gameState.cities * 5 * gameState.wave;
            const totalCityScrap = baseCityScrap;
            document.getElementById('cityBonus').textContent = totalCityScrap;
            document.getElementById('missileBonus').textContent = gameState.missileBonusTotal;
            document.getElementById('totalScrap').textContent = baseScrap + totalCityScrap;
            
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
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('finalScore').textContent = gameState.score;
        document.getElementById('finalWave').textContent = gameState.wave;
    }
    
    checkCollisions();
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

// Initialize city upgrade event listeners
function initializeCityUpgrades() {
    for (let i = 0; i < 6; i++) {
        const cityBtn = document.getElementById(`city-btn-${i}`);
        if (cityBtn) {
            cityBtn.addEventListener('click', () => upgradeCity(i));
        }
    }
}

// Initialize the game systems (but don't start gameplay)
function initGame() {
    initializeRenderer();
    initializeInput();
    initializeCityUpgrades();
    // Show splash screen first, don't start gameplay yet
    showSplashScreen();
}

// Show splash screen
function showSplashScreen() {
    document.getElementById('splashScreen').style.display = 'flex';
    gameState.gameRunning = false;
    
    // Add start button event listener
    document.getElementById('startBtn').addEventListener('click', startGame);
}

// Start the actual game
function startGame() {
    document.getElementById('splashScreen').style.display = 'none';
    // Initialize first wave
    gameState.enemiesToSpawn = 6; // Wave 1: 4 + 1.5 + 0.2 = ~6 enemies
    gameState.gameRunning = true;
    requestAnimationFrame(gameLoop);
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
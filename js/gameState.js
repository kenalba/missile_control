// Game state management
let gameState = {
    score: 0,
    scrap: 0,
    science: 0, // New resource for Command Mode
    wave: 1,
    cities: 6,
    gameRunning: true,
    paused: false,
    lastTime: 0,
    waveTimer: 0,
    nextWaveDelay: 3000,
    waveBreak: false,
    waveBreakTimer: 0,
    enemiesSpawned: 0,
    enemiesToSpawn: 0,
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
    currentMode: 'arcade', // Current game mode: 'arcade' or 'command'
    
    // Command Mode specific state
    commandMode: {
        gameTime: 0, // Total game time in milliseconds
        difficulty: 1, // Difficulty multiplier that increases over time
        lastResourceTick: 0, // Timer for resource generation
        resourceTickInterval: 3000, // Generate resources every 3 seconds
        lastEnemySpawn: 0, // Timer for continuous enemy spawning
        enemySpawnInterval: 2000, // Base interval between enemy spawns (2 seconds)
        selectedEntity: null, // Currently selected city or turret for upgrades
        selectedEntityType: null // 'city' or 'turret'
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

// Upgrade levels and costs (per-launcher)
let launcherUpgrades = [
    { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } },
    { speed: { level: 2, cost: 15 }, explosion: { level: 2, cost: 23 }, rate: { level: 2, cost: 30 }, capacity: { level: 2, cost: 38 }, autopilot: { level: 0, cost: 40 } }, // Middle turret starts upgraded
    { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } }
];

// Command Mode city system
let cityData = [
    // Each city has: population, maxPopulation, productionMode ('scrap', 'science', or 'ammo'), baseProduction
    { population: 100, maxPopulation: 100, productionMode: 'scrap', baseProduction: 1 },
    { population: 100, maxPopulation: 100, productionMode: 'science', baseProduction: 1 },
    { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1 },
    { population: 100, maxPopulation: 100, productionMode: 'scrap', baseProduction: 1 },
    { population: 100, maxPopulation: 100, productionMode: 'science', baseProduction: 1 },
    { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1 }
];

// Global upgrades
let globalUpgrades = {
    cityShield: { level: 0, cost: 100 },
    missileHighlight: { level: 0, cost: 75 },
    cityScrapBonus: { level: 0, cost: 30 },
    scrapMultiplier: { level: 0, cost: 80 },
    salvage: { level: 0, cost: 60 },
    efficiency: { level: 0, cost: 90 },
    research: { level: 0, cost: 50 } // Unlocks science production
};

// Helper function to apply scrap multiplier
function applyScrapBonus(baseScrap) {
    let multiplier = 1.0;
    if (globalUpgrades.scrapMultiplier.level > 0) {
        multiplier += 0.25; // 25% bonus
    }
    return Math.floor(baseScrap * multiplier);
}

// Helper function to apply efficiency discount to launcher upgrade costs
function getActualUpgradeCost(baseCost) {
    if (globalUpgrades.efficiency.level > 0) {
        return Math.floor(baseCost * 0.85); // 15% discount
    }
    return baseCost;
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('scrap').textContent = gameState.scrap;
    
    // Command Mode specific UI updates
    if (gameState.currentMode === 'command') {
        // Show Science resource
        document.getElementById('science').textContent = gameState.science;
        document.getElementById('science-row').style.display = 'block';
        
        // Show continuous time and difficulty instead of wave
        const timeMinutes = Math.floor(gameState.commandMode.gameTime / 60000);
        const timeSeconds = Math.floor((gameState.commandMode.gameTime % 60000) / 1000);
        const timeText = `${timeMinutes}:${timeSeconds.toString().padStart(2, '0')}`;
        document.getElementById('wave').textContent = `Time: ${timeText} | Difficulty: ${gameState.commandMode.difficulty.toFixed(1)}x`;
    } else {
        // Arcade Mode - hide Science resource and show wave info
        document.getElementById('science-row').style.display = 'none';
        const planeText = gameState.planesToSpawn > 0 ? `, ${gameState.planesToSpawn} planes` : '';
        document.getElementById('wave').textContent = `${gameState.wave} (${gameState.enemiesToSpawn} missiles${planeText})`;
    }
    
    // Update economic upgrade buttons
    const scrapMultiplierBtn = document.getElementById('scrapMultiplier');
    if (scrapMultiplierBtn) {
        scrapMultiplierBtn.textContent = globalUpgrades.scrapMultiplier.cost;
        scrapMultiplierBtn.disabled = gameState.scrap < globalUpgrades.scrapMultiplier.cost || globalUpgrades.scrapMultiplier.level > 0;
        scrapMultiplierBtn.style.opacity = (gameState.scrap < globalUpgrades.scrapMultiplier.cost || globalUpgrades.scrapMultiplier.level > 0) ? '0.6' : '1';
    }
    
    const salvageBtn = document.getElementById('salvage');
    if (salvageBtn) {
        salvageBtn.textContent = globalUpgrades.salvage.cost;
        salvageBtn.disabled = gameState.scrap < globalUpgrades.salvage.cost || globalUpgrades.salvage.level > 0;
        salvageBtn.style.opacity = (gameState.scrap < globalUpgrades.salvage.cost || globalUpgrades.salvage.level > 0) ? '0.6' : '1';
    }
    
    const efficiencyBtn = document.getElementById('efficiency');
    if (efficiencyBtn) {
        efficiencyBtn.textContent = globalUpgrades.efficiency.cost;
        efficiencyBtn.disabled = gameState.scrap < globalUpgrades.efficiency.cost || globalUpgrades.efficiency.level > 0;
        efficiencyBtn.style.opacity = (gameState.scrap < globalUpgrades.efficiency.cost || globalUpgrades.efficiency.level > 0) ? '0.6' : '1';
    }
    
    // Update missile highlight button
    const missileHighlightBtn = document.getElementById('missileHighlight');
    if (missileHighlightBtn) {
        missileHighlightBtn.textContent = globalUpgrades.missileHighlight.cost;
        missileHighlightBtn.disabled = gameState.scrap < globalUpgrades.missileHighlight.cost || globalUpgrades.missileHighlight.level > 0;
        missileHighlightBtn.style.opacity = (gameState.scrap < globalUpgrades.missileHighlight.cost || globalUpgrades.missileHighlight.level > 0) ? '0.6' : '1';
    }
    
    // Update upgrade UI
    updateUpgradeUI();
    
    // Update mobile upgrade toggle
    updateMobileUpgradeToggle();
    
    // Auto-continue timer removed - manual continue only
}

function updateUpgradeUI() {
    // Command Mode uses floating panel UI
    if (gameState.currentMode === 'command') {
        // Hide traditional upgrade table and sections
        const upgradeTable = document.querySelector('.upgrade-table');
        if (upgradeTable) {
            upgradeTable.style.display = 'none';
        }
        
        // Hide economic and tactical upgrade sections
        const globalUpgradeSections = document.querySelectorAll('.global-upgrades');
        globalUpgradeSections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Hide old nested tabbed panel if it exists
        const tabbedPanel = document.getElementById('tabbedUpgradePanel');
        if (tabbedPanel) {
            tabbedPanel.style.display = 'none';
        }
        
        // Show the toggle button for Command Mode
        const toggleButton = document.getElementById('command-upgrade-toggle');
        if (toggleButton) {
            toggleButton.style.display = 'block';
        }
        
        // Command mode uses floating panel - no auto-initialization here
        // Panel is opened manually when needed
        return;
    }
    
    // Arcade Mode: Traditional upgrade table and global upgrades
    const upgradeTable = document.querySelector('.upgrade-table');
    if (upgradeTable) {
        upgradeTable.style.display = '';
    }
    
    // Show economic and tactical upgrade sections in Arcade Mode
    const globalUpgradeSections = document.querySelectorAll('.global-upgrades');
    globalUpgradeSections.forEach(section => {
        section.style.display = '';
    });
    
    // Hide Command Mode components in Arcade Mode
    const tabbedPanel = document.getElementById('tabbedUpgradePanel');
    if (tabbedPanel) {
        tabbedPanel.style.display = 'none';
    }
    
    const toggleButton = document.getElementById('command-upgrade-toggle');
    if (toggleButton) {
        toggleButton.style.display = 'none';
    }
    
    const commandPanel = document.getElementById('commandUpgradePanel');
    if (commandPanel) {
        commandPanel.style.display = 'none';
    }
    
    // Update UI for all available launchers (dynamic based on current mode)
    for (let i = 0; i < launcherUpgrades.length; i++) {
        const upgrades = launcherUpgrades[i];
        
        // Update levels
        const speedLevel = document.getElementById(`speed-level-${i}`);
        const explosionLevel = document.getElementById(`explosion-level-${i}`);
        const rateLevel = document.getElementById(`rate-level-${i}`);
        const capacityLevel = document.getElementById(`capacity-level-${i}`);
        const autopilotLevel = document.getElementById(`autopilot-level-${i}`);
        
        if (speedLevel) speedLevel.textContent = upgrades.speed.level;
        if (explosionLevel) explosionLevel.textContent = upgrades.explosion.level;
        if (rateLevel) rateLevel.textContent = upgrades.rate.level;
        if (capacityLevel) capacityLevel.textContent = upgrades.capacity.level;
        if (autopilotLevel) autopilotLevel.textContent = upgrades.autopilot.level;
        
        // Update costs and button states
        const speedBtn = document.getElementById(`speed-btn-${i}`);
        if (speedBtn) {
            const speedCost = getActualUpgradeCost(upgrades.speed.cost);
            speedBtn.textContent = speedCost;
            speedBtn.disabled = gameState.scrap < speedCost;
            speedBtn.parentElement.style.opacity = gameState.scrap < speedCost ? '0.7' : '1';
        }
        
        const explosionBtn = document.getElementById(`explosion-btn-${i}`);
        if (explosionBtn) {
            const explosionCost = getActualUpgradeCost(upgrades.explosion.cost);
            explosionBtn.textContent = explosionCost;
            explosionBtn.disabled = gameState.scrap < explosionCost;
            explosionBtn.parentElement.style.opacity = gameState.scrap < explosionCost ? '0.7' : '1';
        }
        
        const rateBtn = document.getElementById(`rate-btn-${i}`);
        if (rateBtn) {
            const rateCost = getActualUpgradeCost(upgrades.rate.cost);
            rateBtn.textContent = rateCost;
            rateBtn.disabled = gameState.scrap < rateCost;
            rateBtn.parentElement.style.opacity = gameState.scrap < rateCost ? '0.7' : '1';
        }
        
        const capacityBtn = document.getElementById(`capacity-btn-${i}`);
        if (capacityBtn) {
            const capacityCost = getActualUpgradeCost(upgrades.capacity.cost);
            capacityBtn.textContent = capacityCost;
            capacityBtn.disabled = gameState.scrap < capacityCost;
            capacityBtn.parentElement.style.opacity = gameState.scrap < capacityCost ? '0.7' : '1';
        }
        
        const autopilotBtn = document.getElementById(`autopilot-btn-${i}`);
        if (autopilotBtn) {
            const autopilotCost = getActualUpgradeCost(upgrades.autopilot.cost);
            autopilotBtn.textContent = autopilotCost;
            autopilotBtn.disabled = gameState.scrap < autopilotCost;
            autopilotBtn.parentElement.style.opacity = gameState.scrap < autopilotCost ? '0.7' : '1';
        }
    }
    
    // Hide unused launcher columns in Command Mode
    if (gameState.currentMode === 'command') {
        // Hide columns for launchers 1 and 2 (T2 and T3)
        const table = document.querySelector('.upgrade-table');
        if (table) {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('th, td');
                if (cells.length >= 4) {
                    // Hide T2 and T3 columns (indices 2 and 3)
                    if (cells[2]) cells[2].style.display = 'none';
                    if (cells[3]) cells[3].style.display = 'none';
                }
            });
        }
    } else {
        // Show all columns in Arcade Mode
        const table = document.querySelector('.upgrade-table');
        if (table) {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('th, td');
                if (cells.length >= 4) {
                    if (cells[2]) cells[2].style.display = '';
                    if (cells[3]) cells[3].style.display = '';
                }
            });
        }
    }
    
    // Global upgrades removed - only individual city upgrades remain
    
    // City upgrades are now rendered directly on canvas
}

function continueGame() {
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
    document.getElementById('waveBreak').style.display = 'none';
    
    // Check for wave milestone celebrations
    checkWaveMilestones();
    
    // Respawn destroyed launchers
    destroyedLaunchers = [];
}

function restartGame() {
    gameState = {
        score: 0,
        scrap: 0,
        wave: 1,
        cities: 6,
        gameRunning: true,
        paused: false,
        lastTime: 0,
        waveTimer: 0,
        nextWaveDelay: 3000,
        waveBreak: false,
        waveBreakTimer: 0,
        enemiesSpawned: 0,
        enemiesToSpawn: 6,  // Wave 1: 4 + 1.5 + 0.2 = ~6 enemies
        planesSpawned: 0,
        planesToSpawn: 0,  // No planes on wave 1
        cityBonusPhase: false,
        cityBonusTimer: 0,
        cityBonusIndex: 0,
        cityBonusTotal: 0,
        missileBonusPhase: false,
        missileBonusTimer: 0,
        missileBonusIndex: 0,
        missileBonusTotal: 0,
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
    
    launcherUpgrades = [
        { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } },
        { speed: { level: 2, cost: 15 }, explosion: { level: 2, cost: 23 }, rate: { level: 2, cost: 30 }, capacity: { level: 2, cost: 38 }, autopilot: { level: 0, cost: 40 } }, // Middle turret starts upgraded
        { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } }
    ];
    
    globalUpgrades = {
        cityShield: { level: 0, cost: 100 },
        missileHighlight: { level: 0, cost: 75 },
        cityScrapBonus: { level: 0, cost: 30 },
        scrapMultiplier: { level: 0, cost: 80 },
        salvage: { level: 0, cost: 60 },
        efficiency: { level: 0, cost: 90 }
    };
    
    
    launchers = [
        { x: 150, y: 770, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 },
        { x: 600, y: 770, missiles: 12, maxMissiles: 12, lastFire: 0, fireRate: 667 }, // Middle turret starts upgraded
        { x: 1050, y: 770, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 }
    ];
    
    playerMissiles = [];
    enemyMissiles = [];
    explosions = [];
    particles = [];
    upgradeEffects = [];
    planes = [];
    destroyedCities = [];
    destroyedLaunchers = [];
    cityUpgrades = [0, 0, 0, 0, 0, 0];
    
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('waveBreak').style.display = 'none';
    
    // Show splash screen instead of immediately restarting
    showSplashScreen();
}

// Update high scores display
function updateHighScoresDisplay() {
    const highScoresList = document.getElementById('highScoresList');
    if (!highScoresList || !window.saveSystem) return;
    
    const highScores = window.saveSystem.saveData.highScores || [];
    
    if (highScores.length === 0) {
        highScoresList.innerHTML = '<div class="high-score-item empty">No scores yet</div>';
        return;
    }
    
    // Show top 5 scores
    const topScores = highScores.slice(0, 5);
    highScoresList.innerHTML = topScores.map((score, index) => {
        const date = new Date(score.date);
        const dateStr = date.toLocaleDateString();
        
        return `
            <div class="high-score-item">
                <span class="high-score-rank">#${index + 1}</span>
                <span class="high-score-details">
                    <span class="high-score-score">${score.score.toLocaleString()}</span>
                    <span class="high-score-wave">Wave ${score.wave} • ${dateStr}</span>
                </span>
            </div>
        `;
    }).join('');
}

// Screen shake functions
function addScreenShake(intensity, duration) {
    gameState.screenShake.intensity = Math.max(gameState.screenShake.intensity, intensity);
    gameState.screenShake.duration = Math.max(gameState.screenShake.duration, duration);
}

function updateScreenShake(deltaTime) {
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

// Celebration and milestone functions
function createCelebrationEffect(x, y, text, color = '#ffd700', size = 24) {
    // Create floating text
    particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: -3,
        life: 3,
        maxLife: 3,
        color: color,
        size: size,
        text: text,
        isText: true,
        decay: 0.005
    });
    
    // Create sparkle particles around the text
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const speed = Math.random() * 4 + 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.5,
            maxLife: 1.5,
            color: color,
            size: Math.random() * 2 + 1,
            decay: 0.01,
            sparkle: true
        });
    }
}

function createFireworks(x, y, color = '#ffd700') {
    // Create multiple bursts
    for (let burst = 0; burst < 3; burst++) {
        setTimeout(() => {
            for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 * i) / 20;
                const speed = Math.random() * 8 + 4;
                particles.push({
                    x: x + (Math.random() - 0.5) * 100,
                    y: y + (Math.random() - 0.5) * 50,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 2,
                    maxLife: 2,
                    color: Math.random() > 0.5 ? color : '#fff',
                    size: Math.random() * 3 + 1,
                    decay: 0.008,
                    firework: true
                });
            }
        }, burst * 200);
    }
}

function checkWaveMilestones() {
    const wave = gameState.wave;
    
    // Major milestones every 5 waves
    if (wave % 5 === 0 && wave > gameState.achievements.lastMilestoneWave) {
        gameState.achievements.lastMilestoneWave = wave;
        
        // Create celebration at center of screen
        createCelebrationEffect(canvas.width / 2, 200, `WAVE ${wave}!`, '#ffd700', 32);
        createFireworks(canvas.width / 2, 250);
        
        // Add screen shake for celebration
        addScreenShake(6, 500);
        
        // Play celebration sound
        if (audioSystem && audioSystem.playTone) {
            audioSystem.playTone(440, 0.3, 'sine', 0.08); // A note
            setTimeout(() => audioSystem.playTone(554, 0.3, 'sine', 0.08), 150); // C# note
            setTimeout(() => audioSystem.playTone(659, 0.5, 'sine', 0.08), 300); // E note
        }
    }
    
    // Special celebrations for major milestones
    if (wave === 10) {
        createCelebrationEffect(canvas.width / 2, 150, "FIRST DECAD!", '#ff6b6b', 28);
        createFireworks(canvas.width / 4, 200, '#ff6b6b');
        createFireworks(canvas.width * 3/4, 200, '#ff6b6b');
    } else if (wave === 25) {
        createCelebrationEffect(canvas.width / 2, 150, "QUARTER CENTURY!", '#4ecdc4', 28);
        createFireworks(canvas.width / 3, 200, '#4ecdc4');
        createFireworks(canvas.width * 2/3, 200, '#4ecdc4');
    } else if (wave === 50) {
        createCelebrationEffect(canvas.width / 2, 150, "HALF CENTURY!", '#ffe66d', 28);
        for (let i = 0; i < 5; i++) {
            createFireworks(canvas.width * (i + 1) / 6, 200, '#ffe66d');
        }
    }
}

function checkAchievements() {
    const achievements = gameState.achievements;
    
    // Missile destroyer milestones
    if (achievements.missilesDestroyed === 100) {
        createCelebrationEffect(canvas.width / 2, 300, "100 MISSILES!", '#0ff', 20);
        createFireworks(canvas.width / 2, 350, '#0ff');
    } else if (achievements.missilesDestroyed === 500) {
        createCelebrationEffect(canvas.width / 2, 300, "500 MISSILES!", '#0ff', 24);
        createFireworks(canvas.width / 2, 350, '#0ff');
    } else if (achievements.missilesDestroyed === 1000) {
        createCelebrationEffect(canvas.width / 2, 300, "1000 MISSILES!", '#0ff', 28);
        createFireworks(canvas.width / 3, 350, '#0ff');
        createFireworks(canvas.width * 2/3, 350, '#0ff');
    }
    
    // Plane destroyer milestones
    if (achievements.planesDestroyed === 10) {
        createCelebrationEffect(canvas.width / 2, 400, "ACE PILOT!", '#ff9f43', 20);
    } else if (achievements.planesDestroyed === 50) {
        createCelebrationEffect(canvas.width / 2, 400, "SKY CLEANER!", '#ff9f43', 24);
        createFireworks(canvas.width / 2, 450, '#ff9f43');
    }
    
    // Seeker destroyer milestones
    if (achievements.seekersDestroyed === 25) {
        createCelebrationEffect(canvas.width / 2, 350, "SEEKER HUNTER!", '#ff6b6b', 20);
        createFireworks(canvas.width / 2, 400, '#ff6b6b');
    }
    
    // Scrap milestones
    if (achievements.totalScrapEarned === 1000) {
        createCelebrationEffect(canvas.width / 2, 250, "SCRAP MASTER!", '#ffd700', 20);
    } else if (achievements.totalScrapEarned === 5000) {
        createCelebrationEffect(canvas.width / 2, 250, "RESOURCE KING!", '#ffd700', 24);
        createFireworks(canvas.width / 2, 300, '#ffd700');
    }
}
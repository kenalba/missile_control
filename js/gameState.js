// Game state management
let gameState = {
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
    missileBonusTotal: 0
};

// Upgrade levels and costs (per-launcher)
let launcherUpgrades = [
    { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } },
    { speed: { level: 2, cost: 15 }, explosion: { level: 2, cost: 23 }, rate: { level: 2, cost: 30 }, capacity: { level: 2, cost: 38 }, autopilot: { level: 0, cost: 40 } }, // Middle turret starts upgraded
    { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } }
];

// Global upgrades
let globalUpgrades = {
    cityShield: { level: 0, cost: 100 },
    missileHighlight: { level: 0, cost: 75 },
    cityScrapBonus: { level: 0, cost: 30 },
    scrapMultiplier: { level: 0, cost: 80 },
    salvage: { level: 0, cost: 60 },
    efficiency: { level: 0, cost: 90 }
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
    const planeText = gameState.planesToSpawn > 0 ? `, ${gameState.planesToSpawn} planes` : '';
    document.getElementById('wave').textContent = `${gameState.wave} (${gameState.enemiesToSpawn} missiles${planeText})`;
    
    // Update repair button
    const repairBtn = document.getElementById('repairCity');
    repairBtn.disabled = gameState.scrap < 50 || destroyedCities.length === 0;
    
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
    for (let i = 0; i < 3; i++) {
        const upgrades = launcherUpgrades[i];
        
        // Update levels
        document.getElementById(`speed-level-${i}`).textContent = upgrades.speed.level;
        document.getElementById(`explosion-level-${i}`).textContent = upgrades.explosion.level;
        document.getElementById(`rate-level-${i}`).textContent = upgrades.rate.level;
        document.getElementById(`capacity-level-${i}`).textContent = upgrades.capacity.level;
        document.getElementById(`autopilot-level-${i}`).textContent = upgrades.autopilot.level;
        
        // Update costs and button states
        const speedBtn = document.getElementById(`speed-btn-${i}`);
        const speedCost = getActualUpgradeCost(upgrades.speed.cost);
        speedBtn.textContent = speedCost;
        speedBtn.disabled = gameState.scrap < speedCost;
        speedBtn.parentElement.style.opacity = gameState.scrap < speedCost ? '0.7' : '1';
        
        const explosionBtn = document.getElementById(`explosion-btn-${i}`);
        const explosionCost = getActualUpgradeCost(upgrades.explosion.cost);
        explosionBtn.textContent = explosionCost;
        explosionBtn.disabled = gameState.scrap < explosionCost;
        explosionBtn.parentElement.style.opacity = gameState.scrap < explosionCost ? '0.7' : '1';
        
        const rateBtn = document.getElementById(`rate-btn-${i}`);
        const rateCost = getActualUpgradeCost(upgrades.rate.cost);
        rateBtn.textContent = rateCost;
        rateBtn.disabled = gameState.scrap < rateCost;
        rateBtn.parentElement.style.opacity = gameState.scrap < rateCost ? '0.7' : '1';
        
        const capacityBtn = document.getElementById(`capacity-btn-${i}`);
        const capacityCost = getActualUpgradeCost(upgrades.capacity.cost);
        capacityBtn.textContent = capacityCost;
        capacityBtn.disabled = gameState.scrap < capacityCost;
        capacityBtn.parentElement.style.opacity = gameState.scrap < capacityCost ? '0.7' : '1';
        
        const autopilotBtn = document.getElementById(`autopilot-btn-${i}`);
        const autopilotCost = getActualUpgradeCost(upgrades.autopilot.cost);
        autopilotBtn.textContent = autopilotCost;
        autopilotBtn.disabled = gameState.scrap < autopilotCost;
        autopilotBtn.parentElement.style.opacity = gameState.scrap < autopilotCost ? '0.7' : '1';
    }
    
    // Global upgrades removed - only individual city upgrades remain
    
    // City upgrades are now rendered directly on canvas
}

function continueGame() {
    gameState.wave++;
    gameState.waveBreak = false;
    gameState.waveBreakTimer = 0;
    gameState.enemiesSpawned = 0;
    gameState.planesSpawned = 0;
    // Better difficulty curve: starts easier, ramps up more gradually
    gameState.enemiesToSpawn = Math.floor(4 + (gameState.wave * 1.5) + (gameState.wave * gameState.wave * 0.2));
    // Set number of planes per wave (starting at wave 5)
    gameState.planesToSpawn = gameState.wave >= 5 ? Math.floor(1 + (gameState.wave - 5) * 0.5) : 0;
    document.getElementById('waveBreak').style.display = 'none';
    
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
        missileBonusTotal: 0
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
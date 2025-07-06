// Game state management
let gameState = {
    score: 0,
    scrap: 0,
    wave: 1,
    cities: 6,
    gameRunning: true,
    lastTime: 0,
    waveTimer: 0,
    nextWaveDelay: 3000,
    waveBreak: false,
    waveBreakTimer: 0,
    enemiesSpawned: 0,
    enemiesToSpawn: 0,
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
    { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } },
    { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } }
];

// Global upgrades
let globalUpgrades = {
    cityShield: { level: 0, cost: 100 },
    missileHighlight: { level: 0, cost: 75 },
    cityScrapBonus: { level: 0, cost: 30 }
};


function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('scrap').textContent = gameState.scrap;
    document.getElementById('wave').textContent = `${gameState.wave} (${gameState.enemiesToSpawn} left)`;
    document.getElementById('cities').textContent = gameState.cities;
    
    // Update repair button
    const repairBtn = document.getElementById('repairCity');
    repairBtn.disabled = gameState.scrap < 50 || destroyedCities.length === 0;
    
    // Update upgrade UI
    updateUpgradeUI();
    
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
        speedBtn.textContent = upgrades.speed.cost;
        speedBtn.disabled = gameState.scrap < upgrades.speed.cost;
        speedBtn.parentElement.style.opacity = gameState.scrap < upgrades.speed.cost ? '0.7' : '1';
        
        const explosionBtn = document.getElementById(`explosion-btn-${i}`);
        explosionBtn.textContent = upgrades.explosion.cost;
        explosionBtn.disabled = gameState.scrap < upgrades.explosion.cost;
        explosionBtn.parentElement.style.opacity = gameState.scrap < upgrades.explosion.cost ? '0.7' : '1';
        
        const rateBtn = document.getElementById(`rate-btn-${i}`);
        rateBtn.textContent = upgrades.rate.cost;
        rateBtn.disabled = gameState.scrap < upgrades.rate.cost;
        rateBtn.parentElement.style.opacity = gameState.scrap < upgrades.rate.cost ? '0.7' : '1';
        
        const capacityBtn = document.getElementById(`capacity-btn-${i}`);
        capacityBtn.textContent = upgrades.capacity.cost;
        capacityBtn.disabled = gameState.scrap < upgrades.capacity.cost;
        capacityBtn.parentElement.style.opacity = gameState.scrap < upgrades.capacity.cost ? '0.7' : '1';
        
        const autopilotBtn = document.getElementById(`autopilot-btn-${i}`);
        autopilotBtn.textContent = upgrades.autopilot.cost;
        autopilotBtn.disabled = gameState.scrap < upgrades.autopilot.cost;
        autopilotBtn.parentElement.style.opacity = gameState.scrap < upgrades.autopilot.cost ? '0.7' : '1';
    }
    
    // Global upgrades removed - only individual city upgrades remain
    
    // Update city upgrades
    for (let i = 0; i < 6; i++) {
        const cityBtn = document.getElementById(`city-btn-${i}`);
        
        if (cityBtn) {
            const currentLevel = cityUpgrades[i];
            const cost = 20 + (currentLevel * 15);
            const isDestroyed = destroyedCities.includes(i);
            const isMaxLevel = currentLevel >= 3;
            
            let newContent, newDisabled, newOpacity;
            
            if (isDestroyed) {
                newContent = `C${i+1} <span style="color: #f00;">DEAD</span>`;
                newDisabled = true;
                newOpacity = '0.4';
            } else if (isMaxLevel) {
                newContent = `C${i+1} L${currentLevel} <span style="color: #ff0;">MAX</span>`;
                newDisabled = true;
                newOpacity = '0.7';
            } else {
                newContent = `C${i+1} L${currentLevel} <span style="color: #fff;">${cost}</span>`;
                newDisabled = gameState.scrap < cost;
                newOpacity = gameState.scrap < cost ? '0.6' : '1';
            }
            
            // Only update if content changed
            if (cityBtn.innerHTML !== newContent) {
                cityBtn.innerHTML = newContent;
            }
            
            // Always update disabled state and opacity
            cityBtn.disabled = newDisabled;
            cityBtn.style.opacity = newOpacity;
        }
    }
}

function continueGame() {
    gameState.wave++;
    gameState.waveBreak = false;
    gameState.waveBreakTimer = 0;
    gameState.enemiesSpawned = 0;
    // Better difficulty curve: starts easier, ramps up more gradually
    gameState.enemiesToSpawn = Math.floor(4 + (gameState.wave * 1.5) + (gameState.wave * gameState.wave * 0.2));
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
        lastTime: 0,
        waveTimer: 0,
        nextWaveDelay: 3000,
        waveBreak: false,
        waveBreakTimer: 0,
        enemiesSpawned: 0,
        enemiesToSpawn: 6,  // Wave 1: 4 + 1.5 + 0.2 = ~6 enemies
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
        { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } },
        { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } }
    ];
    
    globalUpgrades = {
        cityShield: { level: 0, cost: 100 },
        missileHighlight: { level: 0, cost: 75 },
        cityScrapBonus: { level: 0, cost: 30 }
    };
    
    
    launchers = [
        { x: 150, y: 730, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 },
        { x: 600, y: 730, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 },
        { x: 1050, y: 730, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 }
    ];
    
    playerMissiles = [];
    enemyMissiles = [];
    explosions = [];
    particles = [];
    upgradeEffects = [];
    destroyedCities = [];
    destroyedLaunchers = [];
    cityUpgrades = [0, 0, 0, 0, 0, 0];
    
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('waveBreak').style.display = 'none';
}
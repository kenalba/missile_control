// Unified Upgrade Logic System

// Emergency ammo purchase
window.emergencyAmmoPurchase = function() {
    const cost = 3; // 3 scrap per ammo
    if (gameState.scrap >= cost) {
        gameState.scrap -= cost;
        
        // Add ammo to the first available launcher
        for (let i = 0; i < launchers.length; i++) {
            if (!destroyedLaunchers.includes(i)) {
                launchers[i].missiles = Math.min(launchers[i].missiles + 1, launchers[i].maxMissiles);
                
                // Visual feedback
                createUpgradeEffect(launchers[i].x, launchers[i].y - 30, '+1 AMMO', '#ff0');
                break;
            }
        }
        
        // Update UI
        updateUI();
        if (gameState.currentMode === 'command') {
            window.updateCommandPanel();
        }
    }
};

// Purchase global upgrades
window.purchaseGlobalUpgrade = function(upgradeType) {
    const upgrade = globalUpgrades[upgradeType];
    if (!upgrade || upgrade.level > 0 || gameState.scrap < upgrade.cost) return;
    
    gameState.scrap -= upgrade.cost;
    upgrade.level = 1;
    
    // Visual feedback
    createUpgradeEffect(canvas.width / 2, 300, `${upgradeType.toUpperCase()} UNLOCKED!`, '#0f0');
    
    // Special effects for specific upgrades
    if (upgradeType === 'research') {
        // Unlock science production
        createUpgradeEffect(canvas.width / 2, 350, 'SCIENCE UNLOCKED', '#00f');
    }
    
    updateUI();
    if (gameState.currentMode === 'command') {
        window.updateCommandPanel();
    }
};

// Set city production mode
window.setCityProductionMode = function(cityIndex, mode) {
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
        window.updateCommandPanel();
    }
};

// Upgrade city features
window.upgradeCityFeature = function(cityIndex) {
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
        window.updateCommandPanel();
    }
};

// Main turret upgrade function
window.upgrade = function(type, launcherIndex) {
    if (launcherIndex < 0 || launcherIndex >= launcherUpgrades.length) return;
    
    const upgrades = launcherUpgrades[launcherIndex];
    const upgrade = upgrades[type];
    
    if (!upgrade) return;
    
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
        window.updateCommandPanel();
    }
};

// Apply upgrade effects to launcher
function applyUpgradeToLauncher(type, launcherIndex) {
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

// City upgrade function (legacy compatibility)
window.upgradeCity = function(cityIndex) {
    if (gameState.currentMode === 'command') {
        // In Command Mode, clicking on city selects it
        window.selectEntity('city', cityIndex);
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
};

// Global upgrade function (legacy compatibility) 
window.upgradeGlobal = function(upgradeType) {
    purchaseGlobalUpgrade(upgradeType);
};

// Repair city function
window.repairCity = function(cityIndex) {
    if (!destroyedCities.includes(cityIndex)) return;
    
    const cost = 50;
    if (gameState.scrap < cost) return;
    
    gameState.scrap -= cost;
    
    // Remove from destroyed cities list
    const index = destroyedCities.indexOf(cityIndex);
    if (index > -1) {
        destroyedCities.splice(index, 1);
        gameState.cities++;
    }
    
    // Visual feedback
    createUpgradeEffect(cityPositions[cityIndex], 750, 'CITY REPAIRED!', '#0f0');
    
    updateUI();
    if (gameState.currentMode === 'command') {
        window.updateCommandPanel();
    }
};

// Create visual upgrade effect
function createUpgradeEffect(x, y, text, color = '#0f0') {
    upgradeEffects.push({
        x: x,
        y: y,
        text: text,
        alpha: 1,
        vy: -2,
        life: 90,
        color: color
    });
}
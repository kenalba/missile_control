// Upgrade system
function createUpgradeEffect(x, y, type) {
    const typeNames = {
        speed: 'SPEED UP!',
        explosion: 'BIGGER BOOM!',
        rate: 'FASTER FIRE!',
        capacity: 'MORE AMMO!',
        autopilot: 'AUTOPILOT!'
    };
    
    upgradeEffects.push({
        x: x,
        y: y,
        text: typeNames[type],
        alpha: 1,
        vy: -2,
        life: 60
    });
    
    // Create sparkle particles
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            color: '#ff0'
        });
    }
}

function upgrade(type, launcherIndex) {
    const upgrade = launcherUpgrades[launcherIndex][type];
    if (gameState.scrap >= upgrade.cost) {
        gameState.scrap -= upgrade.cost;
        upgrade.level++;
        upgrade.cost = Math.floor(upgrade.cost * 1.5);
        
        // Create visual effect
        const launcher = launchers[launcherIndex];
        createUpgradeEffect(launcher.x, launcher.y - 30, type);
        
        // Apply upgrade effects
        if (type === 'rate') {
            const newRate = Math.max(200, 1000 / Math.pow(1.5, upgrade.level - 1));
            launchers[launcherIndex].fireRate = newRate;
        } else if (type === 'capacity') {
            const oldCapacity = launchers[launcherIndex].maxMissiles;
            const newCapacity = Math.floor(10 * Math.pow(1.2, upgrade.level - 1));
            launchers[launcherIndex].maxMissiles = newCapacity;
            // Only add the difference, don't refill completely
            launchers[launcherIndex].missiles += (newCapacity - oldCapacity);
        }
    }
}


function upgradeCity(cityIndex) {
    const currentLevel = cityUpgrades[cityIndex];
    const cost = 20 + (currentLevel * 15); // 20, 35, 50 scrap for levels 1, 2, 3
    
    if (gameState.scrap >= cost && currentLevel < 3 && !destroyedCities.includes(cityIndex)) {
        gameState.scrap -= cost;
        cityUpgrades[cityIndex]++;
        
        // Create visual effect at city location
        const cityX = cityPositions[cityIndex];
        upgradeEffects.push({
            x: cityX,
            y: 700,
            text: `CITY ${cityIndex + 1} UPGRADED!`,
            alpha: 1,
            vy: -2,
            life: 100
        });
        
        // Create sparkle particles
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: cityX + (Math.random() - 0.5) * 60,
                y: 720 + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                color: '#0ff'
            });
        }
    }
}

function upgradeGlobal(type) {
    const upgrade = globalUpgrades[type];
    if (gameState.scrap >= upgrade.cost) {
        gameState.scrap -= upgrade.cost;
        upgrade.level++;
        upgrade.cost = Math.floor(upgrade.cost * 1.4);
        
        // Create visual effect in center of screen
        upgradeEffects.push({
            x: 600,
            y: 400,
            text: type === 'cityScrapBonus' ? 'CITY BONUS UP!' : 'GLOBAL UPGRADE!',
            alpha: 1,
            vy: -2,
            life: 80
        });
        
        // Create sparkle particles
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: 600 + (Math.random() - 0.5) * 100,
                y: 400 + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1,
                color: '#ff0'
            });
        }
    }
}

function repairCity() {
    if (gameState.scrap >= 50 && destroyedCities.length > 0) {
        gameState.scrap -= 50;
        destroyedCities.splice(0, 1);
        gameState.cities++;
    }
}
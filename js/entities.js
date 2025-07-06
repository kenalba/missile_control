// Game entities
let launchers = [
    { x: 150, y: 730, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 },
    { x: 600, y: 730, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 },
    { x: 1050, y: 730, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 }
];

let playerMissiles = [];
let enemyMissiles = [];
let explosions = [];
let particles = [];
let upgradeEffects = [];
let cityPositions = [270, 390, 510, 690, 810, 930];
let destroyedCities = [];
let destroyedLaunchers = [];
let cityUpgrades = [0, 0, 0, 0, 0, 0]; // Upgrade level for each city (0-3)

function fireMissile(launcher, targetX, targetY) {
    const launcherIndex = launchers.indexOf(launcher);
    const speedLevel = launcherUpgrades[launcherIndex].speed.level;
    const autopilotLevel = launcherUpgrades[launcherIndex].autopilot.level;
    const speed = 3 * Math.pow(1.3, speedLevel - 1);
    const dx = targetX - launcher.x;
    const dy = targetY - launcher.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    playerMissiles.push({
        x: launcher.x,
        y: launcher.y,
        targetX: targetX,
        targetY: targetY,
        vx: (dx / distance) * speed,
        vy: (dy / distance) * speed,
        trail: [],
        launcherIndex: launcherIndex,
        autopilot: autopilotLevel > 0,
        autopilotStrength: autopilotLevel * 0.3,
        timeAlive: 0,
        maxLifetime: 8000  // 8 seconds max lifetime
    });
    
    launcher.missiles--;
    launcher.lastFire = Date.now();
    
    // Play launch sound
    audioSystem.playMissileLaunch();
}

function spawnEnemyMissile() {
    const startX = Math.random() * canvas.width;
    let targetX = Math.random() * canvas.width;
    
    // 60% chance to target a city or launcher instead of random position
    if (Math.random() < 0.6) {
        const targets = [...cityPositions, ...launchers.map(l => l.x)];
        const validTargets = targets.filter((_, index) => {
            // Filter out destroyed cities
            if (index < cityPositions.length) {
                return !destroyedCities.includes(index);
            }
            return true; // Always include launchers
        });
        
        if (validTargets.length > 0) {
            targetX = validTargets[Math.floor(Math.random() * validTargets.length)];
            // Add some variance so missiles don't hit exactly the same spot
            targetX += (Math.random() - 0.5) * 60;
        }
    }
    
    // Slower speed scaling to keep game manageable
    const speed = 0.8 + (gameState.wave * 0.08) + (gameState.wave * gameState.wave * 0.005);
    
    // Smart bombs: start at wave 3, increase frequency gradually
    const smartBombChance = gameState.wave >= 3 ? Math.min(0.25, 0.05 + (gameState.wave - 3) * 0.03) : 0;
    const isSmartBomb = Math.random() < smartBombChance;
    
    enemyMissiles.push({
        x: startX,
        y: 0,
        targetX: targetX,
        targetY: 780,
        vx: (targetX - startX) * speed / 400,
        vy: speed,
        trail: [],
        isSmartBomb: isSmartBomb,
        splitAt: isSmartBomb ? 200 + Math.random() * 200 : null // Split between y=200-400
    });
}

function createExplosion(x, y, isPlayer = false, launcherIndex = 0) {
    let size = 40;
    if (isPlayer && launcherIndex !== undefined) {
        const explosionLevel = launcherUpgrades[launcherIndex].explosion.level;
        size = 60 * Math.pow(1.4, explosionLevel - 1);
    }
    
    explosions.push({
        x: x,
        y: y,
        radius: 0,
        maxRadius: size,
        growing: true,
        alpha: 1,
        isPlayer: isPlayer
    });
    
    // Play explosion sound
    audioSystem.playExplosion(isPlayer);
    
    // Create particles
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: isPlayer ? '#0f0' : '#f80'
        });
    }
}

function updateEntities(deltaTime) {
    // Update player missiles
    playerMissiles.forEach((missile, i) => {
        missile.trail.push({x: missile.x, y: missile.y});
        missile.timeAlive += deltaTime;
        
        // Remove missiles that have lived too long (prevents infinite autopilot wandering)
        if (missile.timeAlive > missile.maxLifetime) {
            createExplosion(missile.x, missile.y, true, missile.launcherIndex);
            playerMissiles.splice(i, 1);
            return;
        }
        
        // Remove missiles that go off screen
        if (missile.x < -50 || missile.x > canvas.width + 50 || 
            missile.y < -50 || missile.y > canvas.height + 50) {
            playerMissiles.splice(i, 1);
            return;
        }
        
        // Autopilot: curve towards nearest enemy missile
        if (missile.autopilot && enemyMissiles.length > 0) {
            let nearestEnemy = null;
            let nearestDist = Infinity;
            
            enemyMissiles.forEach(enemy => {
                const dist = Math.sqrt(
                    Math.pow(missile.x - enemy.x, 2) + 
                    Math.pow(missile.y - enemy.y, 2)
                );
                if (dist < nearestDist && dist < 300) { // Only target enemies within range
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            });
            
            if (nearestEnemy) {
                const dx = nearestEnemy.x - missile.x;
                const dy = nearestEnemy.y - missile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Gradually adjust velocity towards enemy
                const adjustmentFactor = missile.autopilotStrength * (deltaTime / 1000);
                const targetVx = (dx / distance) * Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy);
                const targetVy = (dy / distance) * Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy);
                
                missile.vx += (targetVx - missile.vx) * adjustmentFactor;
                missile.vy += (targetVy - missile.vy) * adjustmentFactor;
            }
        }
        
        missile.x += missile.vx;
        missile.y += missile.vy;
    });
    
    // Update enemy missiles
    enemyMissiles.forEach((missile, i) => {
        missile.trail.push({x: missile.x, y: missile.y});
        
        // Remove enemy missiles that go way off screen
        if (missile.x < -100 || missile.x > canvas.width + 100 || 
            missile.y > canvas.height + 100) {
            enemyMissiles.splice(i, 1);
            return;
        }
        
        // Check if smart bomb should split
        if (missile.isSmartBomb && missile.splitAt && missile.y >= missile.splitAt) {
            // Create 3 warheads
            for (let j = 0; j < 3; j++) {
                const spreadAngle = (j - 1) * 0.3; // -0.3, 0, 0.3 radians
                const newTargetX = missile.targetX + (j - 1) * 150; // Spread targets
                const speed = Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy);
                
                enemyMissiles.push({
                    x: missile.x,
                    y: missile.y,
                    targetX: newTargetX,
                    targetY: 780,
                    vx: Math.sin(spreadAngle) * speed + missile.vx * 0.8,
                    vy: Math.cos(spreadAngle) * speed + missile.vy * 0.8,
                    trail: [],
                    isSmartBomb: false,
                    splitAt: null
                });
            }
            
            // Remove original smart bomb
            enemyMissiles.splice(i, 1);
            return;
        }
        
        missile.x += missile.vx;
        missile.y += missile.vy;
    });
    
    // Update explosions
    explosions.forEach((explosion, i) => {
        if (explosion.growing) {
            explosion.radius += 3;
            if (explosion.radius >= explosion.maxRadius) {
                explosion.growing = false;
            }
        } else {
            explosion.alpha -= 0.02;
            if (explosion.alpha <= 0) {
                explosions.splice(i, 1);
            }
        }
    });
    
    // Update particles
    particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.2; // gravity
        particle.life -= 0.02;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    });
    
    // Update upgrade effects
    upgradeEffects.forEach((effect, i) => {
        effect.y += effect.vy;
        effect.alpha -= 0.02;
        effect.life--;
        
        if (effect.life <= 0 || effect.alpha <= 0) {
            upgradeEffects.splice(i, 1);
        }
    });
}
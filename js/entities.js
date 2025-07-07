// Game entities
let launchers = [
    { x: 150, y: 770, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 },
    { x: 600, y: 770, missiles: 12, maxMissiles: 12, lastFire: 0, fireRate: 667 }, // Middle turret starts upgraded
    { x: 1050, y: 770, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 }
];

let playerMissiles = [];
let enemyMissiles = [];
let explosions = [];
let particles = [];
let upgradeEffects = [];
let planes = [];
let cityPositions = [270, 390, 510, 690, 810, 930];
let destroyedCities = [];
let destroyedLaunchers = [];
let cityUpgrades = [0, 0, 0, 0, 0, 0]; // Upgrade level for each city (0-3)

// Calculate where a missile will hit based on current position and velocity
function calculateMissileImpact(missile) {
    if (missile.vy <= 0) return null; // Missile going up or horizontal
    
    // Calculate time to reach ground (y = 800)
    const timeToGround = (800 - missile.y) / missile.vy;
    if (timeToGround <= 0) return null; // Already past ground
    
    // Calculate x position when it hits ground
    const impactX = missile.x + (missile.vx * timeToGround);
    return impactX;
}

// Check if a missile's trajectory threatens any live targets
function isMissileThreatening(missile) {
    const impactX = calculateMissileImpact(missile);
    if (impactX === null) return false;
    
    // Check if impact threatens any live cities (50px range)
    for (let cityIndex = 0; cityIndex < cityPositions.length; cityIndex++) {
        if (!destroyedCities.includes(cityIndex)) {
            const cityX = cityPositions[cityIndex];
            if (Math.abs(impactX - cityX) < 50) {
                return true;
            }
        }
    }
    
    // Check if impact threatens any live launchers (40px range)
    for (let launcherIndex = 0; launcherIndex < launchers.length; launcherIndex++) {
        if (!destroyedLaunchers.includes(launcherIndex)) {
            const launcherX = launchers[launcherIndex].x;
            if (Math.abs(impactX - launcherX) < 40) {
                return true;
            }
        }
    }
    
    return false;
}

function fireMissile(launcher, targetX, targetY) {
    const launcherIndex = launchers.indexOf(launcher);
    const speedLevel = launcherUpgrades[launcherIndex] ? launcherUpgrades[launcherIndex].speed.level : 1;
    const autopilotLevel = launcherUpgrades[launcherIndex] ? launcherUpgrades[launcherIndex].autopilot.level : 0;
    const speed = 4.5 * Math.pow(1.3, speedLevel - 1);
    const dx = targetX - launcher.x;
    const dy = targetY - launcher.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate original flight plan for autopilot missiles
    const originalFlightTime = distance / speed; // Time to reach original target
    
    const missile = {
        x: launcher.x,
        y: launcher.y,
        targetX: targetX,
        targetY: targetY,
        vx: (dx / distance) * speed,
        vy: (dy / distance) * speed,
        trail: [],
        launcherIndex: launcherIndex,
        autopilot: autopilotLevel > 0,
        autopilotStrength: autopilotLevel * 0.15, // Reduced from 0.3 to 0.15
        timeAlive: 0,
        maxLifetime: 8000,  // 8 seconds max lifetime
        // Original flight plan for autopilot
        originalTargetX: targetX,
        originalTargetY: targetY,
        originalFlightTime: originalFlightTime,
        maxDeviation: 100 + (autopilotLevel * 50) // Max distance from original path
    };
    
    playerMissiles.push(missile);
    
    launcher.missiles--;
    launcher.lastFire = Date.now();
    
    // Play launch sound
    audioSystem.playMissileLaunch();
}

// Missile Command style speed curve: fast ramp to wave 6, then plateau
// Based on original game's speed progression curve
function calculateMissileSpeed(wave) {
    const baseSpeed = 0.5;
    const maxSpeed = 3.5; // Maximum speed reached around wave 15 - much more challenging!
    
    if (wave <= 1) return baseSpeed;
    if (wave >= 15) return maxSpeed; // Reaches max by wave 15
    
    // Exponential curve that reaches ~80% of max by wave 6, then continues climbing
    const progress = Math.min(wave - 1, 14) / 14;
    const curve = 1 - Math.pow(1 - progress, 2.2); // Steep early curve with continued growth
    return baseSpeed + (maxSpeed - baseSpeed) * curve;
}

function spawnEnemyMissile() {
    const startX = Math.random() * canvas.width;
    let targetX = Math.random() * canvas.width;
    
    // 85% chance to target a city or launcher instead of random position
    if (Math.random() < 0.85) {
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
    
    // For now, set targeting as false - will be calculated dynamically during update
    let isTargetingValid = false;
    
    const speed = calculateMissileSpeed(gameState.wave);
    
    // Splitters: start at wave 3, increase frequency gradually
    const splitterChance = gameState.wave >= 3 ? Math.min(0.25, 0.05 + (gameState.wave - 3) * 0.03) : 0;
    const isSplitter = Math.random() < splitterChance;
    
    // Seekers: start at wave 5, low frequency, smart AI missiles
    const seekerChance = gameState.wave >= 5 ? Math.min(0.15, 0.02 + (gameState.wave - 5) * 0.02) : 0;
    const isSeeker = !isSplitter && Math.random() < seekerChance; // Seekers and splitters are mutually exclusive
    
    // For seekers, always target a city or launcher
    if (isSeeker) {
        const targets = [...cityPositions, ...launchers.map(l => l.x)];
        const validTargets = targets.filter((_, index) => {
            // Filter out destroyed cities but keep all launchers
            if (index < cityPositions.length) {
                return !destroyedCities.includes(index);
            }
            return true; // Always include launchers
        });
        
        if (validTargets.length > 0) {
            targetX = validTargets[Math.floor(Math.random() * validTargets.length)];
        }
    }

    const newMissile = {
        x: startX,
        y: 0,
        targetX: targetX,
        targetY: 780,
        vx: (targetX - startX) * speed / 400,
        vy: speed * (isSeeker ? 0.9 : 1), // Seekers are 10% slower but smarter
        trail: [],
        isSplitter: isSplitter,
        splitAt: isSplitter ? 200 + Math.random() * 200 : null, // Split between y=200-400
        isSeeker: isSeeker,
        seekerBlinkTimer: 0,
        seekerTargetX: targetX,
        seekerTargetY: 780,
        lastRetarget: 0,
        isTargetingValid: isTargetingValid,
        sparkleTimer: 0,
        lastThreatCheck: 0 // Will force immediate check on first update
    };
    
    enemyMissiles.push(newMissile);
}

function spawnPlane() {
    // Planes spawn from sides of screen starting at wave 5
    if (gameState.wave < 5) return;
    
    // 50% chance to spawn from left, 50% from right
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -50 : canvas.width + 50;
    
    // Random height between 100-300 pixels from top
    const y = 100 + Math.random() * 200;
    
    // Speed scales with wave like missiles
    const speed = 1.2 + (gameState.wave * 0.08) + (Math.min(gameState.wave, 15) * 0.02);
    
    const newPlane = {
        x: startX,
        y: y,
        vx: fromLeft ? speed : -speed,
        vy: 0,
        lastFire: 0,
        fireRate: 2000 + Math.random() * 1000, // Fire every 2-3 seconds
        trail: [],
        hp: 1, // Takes 1 hit to destroy
        fromLeft: fromLeft,
        engineSoundId: null // Will store audio ID for engine sound
    };
    
    planes.push(newPlane);
    
    // Play engine sound
    if (audioSystem && audioSystem.playPlaneEngine) {
        newPlane.engineSoundId = audioSystem.playPlaneEngine();
    }
    
    console.log("Debug: Spawned plane");
}

function createExplosion(x, y, isPlayer = false, launcherIndex = 0, explosionType = 'normal') {
    let size = 40;
    if (isPlayer && launcherIndex !== undefined && launcherUpgrades[launcherIndex]) {
        const explosionLevel = launcherUpgrades[launcherIndex].explosion.level;
        size = 60 * Math.pow(1.2, explosionLevel - 1);
    }
    
    // Different explosion types
    let particleCount = 15;
    let shockwave = false;
    
    if (explosionType === 'plane') {
        size *= 1.5; // Bigger explosion for planes
        particleCount = 25;
        shockwave = true;
    } else if (explosionType === 'city') {
        size *= 2; // Massive explosion for city destruction
        particleCount = 40;
        shockwave = true;
    } else if (explosionType === 'splitter') {
        size *= 0.8; // Smaller splitter explosions
        particleCount = 10;
    }
    
    explosions.push({
        x: x,
        y: y,
        radius: 0,
        maxRadius: size,
        growing: true,
        alpha: 1,
        isPlayer: isPlayer,
        type: explosionType,
        shockwave: shockwave,
        shockwaveRadius: 0,
        shockwaveAlpha: 0.8
    });
    
    // Play explosion sound
    audioSystem.playExplosion(isPlayer);
    
    // Create enhanced particles with variety
    for (let i = 0; i < particleCount; i++) {
        const speed = Math.random() * 12 + 3; // Variable speeds
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5; // Spread pattern
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 1,
            color: isPlayer ? '#0f0' : (explosionType === 'plane' ? '#0af' : '#f80'),
            size: Math.random() * 3 + 1, // Variable particle sizes
            decay: 0.02 + Math.random() * 0.01 // Variable decay rates
        });
    }
    
    // Add impact flash effect
    if (explosionType === 'city' || explosionType === 'plane') {
        createImpactFlash(x, y, explosionType === 'city' ? '#ff0' : '#0af');
    }
}

// Debug function to spawn a test plane (bypasses wave requirement)
function spawnTestPlane() {
    // 50% chance to spawn from left, 50% from right
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -50 : canvas.width + 50;
    
    // Random height between 100-300 pixels from top
    const y = 100 + Math.random() * 200;
    
    // Speed scales with wave like missiles
    const speed = 1.2 + (gameState.wave * 0.08) + (Math.min(gameState.wave, 15) * 0.02);
    
    const newPlane = {
        x: startX,
        y: y,
        vx: fromLeft ? speed : -speed,
        vy: 0,
        lastFire: 0,
        fireRate: 2000 + Math.random() * 1000, // Fire every 2-3 seconds
        trail: [],
        hp: 1, // Takes 1 hit to destroy
        fromLeft: fromLeft,
        engineSoundId: null // Will store audio ID for engine sound
    };
    
    planes.push(newPlane);
    
    // Play engine sound
    if (audioSystem && audioSystem.playPlaneEngine) {
        newPlane.engineSoundId = audioSystem.playPlaneEngine();
    }
    
    console.log("Debug: Spawned test plane");
}

// Debug function to spawn a test seeker
function spawnTestSeeker() {
    const startX = Math.random() * canvas.width;
    const targets = [...cityPositions, ...launchers.map(l => l.x)];
    const validTargets = targets.filter((_, index) => {
        if (index < cityPositions.length) {
            return !destroyedCities.includes(index);
        }
        return true;
    });
    
    let targetX = canvas.width / 2; // Default center target
    if (validTargets.length > 0) {
        targetX = validTargets[Math.floor(Math.random() * validTargets.length)];
    }
    
    const speed = calculateMissileSpeed(gameState.wave) * 0.8; // Seekers are 20% slower
    
    const testSeeker = {
        x: startX,
        y: 0,
        targetX: targetX,
        targetY: 780,
        vx: (targetX - startX) * speed / 400,
        vy: speed,
        trail: [],
        isSplitter: false,
        splitAt: null,
        isSeeker: true,
        seekerBlinkTimer: 0,
        seekerTargetX: targetX,
        seekerTargetY: 780,
        lastRetarget: 0,
        isTargetingValid: false,
        sparkleTimer: 0,
        lastThreatCheck: 0
    };
    
    enemyMissiles.push(testSeeker);
    console.log("Debug: Spawned test seeker");
}

// Create impact flash effect for dramatic explosions
function createImpactFlash(x, y, color) {
    particles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        life: 0.3,
        maxLife: 0.3,
        color: color,
        size: 100,
        decay: 0.1,
        isFlash: true
    });
}

function updateEntities(deltaTime) {
    // Update player missiles
    playerMissiles.forEach((missile, i) => {
        missile.trail.push({x: missile.x, y: missile.y});
        
        // Very long trails - cover entire screen diagonal plus extra for visual appeal
        // Screen diagonal ~1500px, so 500 points should cover any visible trail
        if (missile.trail.length > 1000) {
            missile.trail.shift();
        }
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
        
        // Autopilot: gentle guidance towards enemies while preserving original mission
        if (missile.autopilot) {
            // Check if we should explode at original target (fallback)
            const timeToOriginalTarget = missile.originalFlightTime * 1000; // Convert to ms
            if (missile.timeAlive >= timeToOriginalTarget * 0.9) { // Explode when 90% of flight time reached
                createExplosion(missile.x, missile.y, true, missile.launcherIndex);
                playerMissiles.splice(i, 1);
                return;
            }
            
            // Look for enemies to intercept along the way
            if (enemyMissiles.length > 0) {
                let nearestEnemy = null;
                let nearestDist = Infinity;
                
                enemyMissiles.forEach(enemy => {
                    const dist = Math.sqrt(
                        Math.pow(missile.x - enemy.x, 2) + 
                        Math.pow(missile.y - enemy.y, 2)
                    );
                    if (dist < nearestDist && dist < 200) { // Reduced detection range
                        nearestDist = dist;
                        nearestEnemy = enemy;
                    }
                });
                
                if (nearestEnemy) {
                    // Check if we're deviating too far from original path
                    const distToOriginalPath = Math.sqrt(
                        Math.pow(missile.x - missile.originalTargetX, 2) + 
                        Math.pow(missile.y - missile.originalTargetY, 2)
                    );
                    
                    // Only steer if we haven't deviated too far
                    if (distToOriginalPath < missile.maxDeviation) {
                        // Smaller auto-explosion trigger radius (less reliable)
                        const explosionLevel = launcherUpgrades[missile.launcherIndex] ? 
                            launcherUpgrades[missile.launcherIndex].explosion.level : 1;
                        const explosionRadius = 60 * Math.pow(1.2, explosionLevel - 1);
                        
                        if (nearestDist < explosionRadius * 0.5) { // Reduced from 0.8 to 0.5
                            createExplosion(missile.x, missile.y, true, missile.launcherIndex);
                            playerMissiles.splice(i, 1);
                            return;
                        }
                        
                        // Gentle steering toward enemy
                        const dx = nearestEnemy.x - missile.x;
                        const dy = nearestEnemy.y - missile.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        // Frame-rate independent autopilot adjustment (normalized to 60 FPS)
                        const frameMultiplier = deltaTime / 16.67;
                        const adjustmentFactor = missile.autopilotStrength * frameMultiplier;
                        const currentSpeed = Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy);
                        const targetVx = (dx / distance) * currentSpeed;
                        const targetVy = (dy / distance) * currentSpeed;
                        
                        missile.vx += (targetVx - missile.vx) * adjustmentFactor;
                        missile.vy += (targetVy - missile.vy) * adjustmentFactor;
                    }
                }
            }
        }
        
        // Frame-rate independent movement (normalized to 60 FPS)
        const frameMultiplier = deltaTime / 16.67;
        missile.x += missile.vx * frameMultiplier;
        missile.y += missile.vy * frameMultiplier;
    });
    
    // Update enemy missiles
    enemyMissiles.forEach((missile, i) => {
        missile.trail.push({x: missile.x, y: missile.y});
        
        // Very long trails - cover entire screen diagonal plus extra for visual appeal
        // Screen diagonal ~1500px, so 500 points should cover any visible trail
        if (missile.trail.length > 1000) {
            missile.trail.shift();
        }
        
        // Only recalculate threat status every 200ms for performance
        if (!missile.lastThreatCheck || Date.now() - missile.lastThreatCheck > 200) {
            missile.isTargetingValid = isMissileThreatening(missile);
            missile.lastThreatCheck = Date.now();
        }
        
        // Add sparkle effects for highlighted missiles if upgrade is purchased
        if (missile.isTargetingValid && globalUpgrades.missileHighlight.level > 0) {
            missile.sparkleTimer += deltaTime;
            if (missile.sparkleTimer > 100) { // Create sparkle every 100ms
                missile.sparkleTimer = 0;
                particles.push({
                    x: missile.x + (Math.random() - 0.5) * 20,
                    y: missile.y + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 1,
                    color: '#f44'
                });
            }
        }
        
        // Seeker AI behavior
        if (missile.isSeeker) {
            missile.seekerBlinkTimer += deltaTime;
            
            // Play seeker warning sound every blink cycle (every 1000ms)
            if (missile.seekerBlinkTimer % 1000 < deltaTime) {
                audioSystem.playSeekerWarning();
            }
            
            // Retarget periodically (every 1 second)
            if (!missile.lastRetarget || Date.now() - missile.lastRetarget > 1000) {
                const targets = [...cityPositions, ...launchers.map(l => l.x)];
                const validTargets = targets.filter((_, index) => {
                    if (index < cityPositions.length) {
                        return !destroyedCities.includes(index);
                    }
                    return true;
                });
                
                if (validTargets.length > 0) {
                    // Find nearest target
                    let nearestTarget = validTargets[0];
                    let nearestDist = Math.abs(missile.x - nearestTarget);
                    
                    validTargets.forEach(target => {
                        const dist = Math.abs(missile.x - target);
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearestTarget = target;
                        }
                    });
                    
                    missile.seekerTargetX = nearestTarget;
                }
                missile.lastRetarget = Date.now();
            }
            
            // Steering toward target (limited turn rate)
            const frameMultiplier = deltaTime / 16.67;
            const dx = missile.seekerTargetX - missile.x;
            const dy = missile.seekerTargetY - missile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const currentSpeed = Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy);
                const targetVx = (dx / distance) * currentSpeed;
                const targetVy = (dy / distance) * currentSpeed;
                
                // Good steering - more agile
                const steerStrength = 0.025 * frameMultiplier; // More responsive steering
                missile.vx += (targetVx - missile.vx) * steerStrength;
                missile.vy += (targetVy - missile.vy) * steerStrength;
                
                // Maintain constant speed for seekers (avoid division by zero)
                const newSpeed = Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy);
                const targetSpeed = calculateMissileSpeed(gameState.wave) * 0.9; // Seekers are 10% slower
                if (newSpeed > 0.1) { // Avoid near-zero speeds
                    missile.vx = (missile.vx / newSpeed) * targetSpeed;
                    missile.vy = (missile.vy / newSpeed) * targetSpeed;
                }
            }
            
            // Evasion behavior - avoid nearby player missiles and explosions
            let evasionX = 0, evasionY = 0;
            const evasionRadius = 80; // Detection range for threats
            
            // Check for nearby player missiles
            playerMissiles.forEach(playerMissile => {
                const dist = Math.sqrt(
                    Math.pow(missile.x - playerMissile.x, 2) + 
                    Math.pow(missile.y - playerMissile.y, 2)
                );
                if (dist < evasionRadius) {
                    const avoidX = missile.x - playerMissile.x;
                    const avoidY = missile.y - playerMissile.y;
                    const avoidDist = Math.max(dist, 1); // Prevent division by zero
                    evasionX += (avoidX / avoidDist) * (evasionRadius - dist);
                    evasionY += (avoidY / avoidDist) * (evasionRadius - dist);
                }
            });
            
            // Check for nearby explosions
            explosions.forEach(explosion => {
                const dist = Math.sqrt(
                    Math.pow(missile.x - explosion.x, 2) + 
                    Math.pow(missile.y - explosion.y, 2)
                );
                const dangerRadius = explosion.radius + 40; // Give some buffer
                if (dist < dangerRadius) {
                    const avoidX = missile.x - explosion.x;
                    const avoidY = missile.y - explosion.y;
                    const avoidDist = Math.max(dist, 1);
                    evasionX += (avoidX / avoidDist) * (dangerRadius - dist) * 2; // Stronger avoidance
                    evasionY += (avoidY / avoidDist) * (dangerRadius - dist) * 2;
                }
            });
            
            // Apply stronger evasion
            if (evasionX !== 0 || evasionY !== 0) {
                const evasionStrength = 0.015 * frameMultiplier; // Stronger evasion
                missile.vx += evasionX * evasionStrength;
                missile.vy += evasionY * evasionStrength;
            }
            
            // Keep seekers on screen - add gentle steering back to bounds
            const margin = 50;
            if (missile.x < margin) {
                missile.vx += 0.2 * frameMultiplier; // Very gentle push right
            } else if (missile.x > canvas.width - margin) {
                missile.vx -= 0.2 * frameMultiplier; // Very gentle push left
            }
            
            // After all adjustments, normalize speed again for seekers
            const finalSpeed = Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy);
            const seekerTargetSpeed = calculateMissileSpeed(gameState.wave) * 0.9;
            if (finalSpeed > 0) {
                missile.vx = (missile.vx / finalSpeed) * seekerTargetSpeed;
                missile.vy = (missile.vy / finalSpeed) * seekerTargetSpeed;
            }
        }
        
        // Remove enemy missiles that go way off screen
        if (missile.x < -100 || missile.x > canvas.width + 100 || 
            missile.y > canvas.height + 100) {
            enemyMissiles.splice(i, 1);
            return;
        }
        
        // Check if splitter should split
        if (missile.isSplitter && missile.splitAt && missile.y >= missile.splitAt) {
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
                    isSplitter: false,
                    splitAt: null,
                    isTargetingValid: missile.isTargetingValid,
                    sparkleTimer: 0
                });
            }
            
            // Create small explosion when splitter divides
            createExplosion(missile.x, missile.y, false, 0, 'splitter');
            
            // Remove original splitter
            enemyMissiles.splice(i, 1);
            return;
        }
        
        // Frame-rate independent movement (normalized to 60 FPS)
        const frameMultiplier = deltaTime / 16.67;
        missile.x += missile.vx * frameMultiplier;
        missile.y += missile.vy * frameMultiplier;
    });
    
    // Update planes
    planes.forEach((plane, i) => {
        plane.trail.push({x: plane.x, y: plane.y});
        
        // Keep trail length reasonable for planes (shorter trails)
        if (plane.trail.length > 30) {
            plane.trail.shift();
        }
        
        // Remove planes that go off screen
        if (plane.x < -100 || plane.x > canvas.width + 100) {
            // Stop engine sound if it exists
            if (plane.engineSoundId && audioSystem && audioSystem.stopSound) {
                audioSystem.stopSound(plane.engineSoundId);
            }
            planes.splice(i, 1);
            return;
        }
        
        // Plane firing logic
        if (Date.now() - plane.lastFire > plane.fireRate) {
            // Fire missile downward from plane
            const missileSpeed = 1.2;
            enemyMissiles.push({
                x: plane.x,
                y: plane.y + 10,
                targetX: plane.x,
                targetY: 780,
                vx: 0,
                vy: missileSpeed,
                trail: [],
                isSmartBomb: false,
                splitAt: null,
                isTargetingValid: false,
                sparkleTimer: 0,
                lastThreatCheck: 0,
                fromPlane: true // Mark as plane-fired missile
            });
            
            plane.lastFire = Date.now();
            
            // Play plane firing sound
            if (audioSystem && audioSystem.playPlaneFire) {
                audioSystem.playPlaneFire();
            }
        }
        
        // Frame-rate independent movement (normalized to 60 FPS)
        const frameMultiplier = deltaTime / 16.67;
        plane.x += plane.vx * frameMultiplier;
        plane.y += plane.vy * frameMultiplier;
    });
    
    // Update explosions
    explosions.forEach((explosion, i) => {
        // Frame-rate independent movement (normalized to 60 FPS)
        const frameMultiplier = deltaTime / 16.67;
        if (explosion.growing) {
            explosion.radius += 3 * frameMultiplier;
            if (explosion.radius >= explosion.maxRadius) {
                explosion.growing = false;
            }
        } else {
            explosion.alpha -= 0.02 * frameMultiplier;
            if (explosion.alpha <= 0) {
                explosions.splice(i, 1);
                return;
            }
        }
        
        // Update shockwave if present
        if (explosion.shockwave && explosion.shockwaveAlpha > 0) {
            explosion.shockwaveRadius += 8 * frameMultiplier;
            explosion.shockwaveAlpha -= 0.03 * frameMultiplier;
        }
    });
    
    // Update particles
    particles.forEach((particle, i) => {
        // Frame-rate independent movement (normalized to 60 FPS)
        const frameMultiplier = deltaTime / 16.67;
        
        if (!particle.isFlash) {
            particle.x += particle.vx * frameMultiplier;
            particle.y += particle.vy * frameMultiplier;
            particle.vy += 0.2 * frameMultiplier; // gravity for normal particles
        }
        
        // Use custom decay rate if available
        const decayRate = particle.decay || 0.02;
        particle.life -= decayRate * frameMultiplier;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    });
    
    // Update upgrade effects
    upgradeEffects.forEach((effect, i) => {
        // Frame-rate independent movement (normalized to 60 FPS)
        const frameMultiplier = deltaTime / 16.67;
        effect.y += effect.vy * frameMultiplier;
        effect.alpha -= 0.02 * frameMultiplier;
        effect.life -= frameMultiplier;
        
        if (effect.life <= 0 || effect.alpha <= 0) {
            upgradeEffects.splice(i, 1);
        }
    });
}
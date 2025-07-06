const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
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
    enemiesSpawned: 0
};

// Upgrade levels and costs (per-launcher)
let launcherUpgrades = [
    { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 } },
    { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 } },
    { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 } }
];

// Global upgrades
let globalUpgrades = {
    cityShield: { level: 0, cost: 100 },
    missileHighlight: { level: 0, cost: 75 }
};

// Game objects
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

// Input handling
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
    if (!gameState.gameRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const targetY = e.clientY - rect.top;
    
    // Check if clicking on upgrade icons
    for (let i = 0; i < launchers.length; i++) {
        const launcher = launchers[i];
        const upgradeY = launcher.y + 90;
        const iconSize = 24;
        
        // Speed upgrade
        if (targetX >= launcher.x - 45 && targetX <= launcher.x - 45 + iconSize &&
            targetY >= upgradeY && targetY <= upgradeY + iconSize) {
            upgrade('speed', i);
            return;
        }
        // Explosion upgrade
        if (targetX >= launcher.x - 15 && targetX <= launcher.x - 15 + iconSize &&
            targetY >= upgradeY && targetY <= upgradeY + iconSize) {
            upgrade('explosion', i);
            return;
        }
        // Rate upgrade
        if (targetX >= launcher.x + 15 && targetX <= launcher.x + 15 + iconSize &&
            targetY >= upgradeY && targetY <= upgradeY + iconSize) {
            upgrade('rate', i);
            return;
        }
        // Capacity upgrade
        if (targetX >= launcher.x + 45 && targetX <= launcher.x + 45 + iconSize &&
            targetY >= upgradeY && targetY <= upgradeY + iconSize) {
            upgrade('capacity', i);
            return;
        }
    }
    
    // Check if clicking on a launcher info panel to select it
    for (let i = 0; i < launchers.length; i++) {
        const launcher = launchers[i];
        if (targetX >= launcher.x - 35 && targetX <= launcher.x + 35 &&
            targetY >= launcher.y + 35 && targetY <= launcher.y + 80) {
            selectedLauncher = i;
            return;
        }
    }
    
    // Find closest launcher with missiles for firing
    let closestLauncher = null;
    let closestDist = Infinity;
    
    launchers.forEach(launcher => {
        if (launcher.missiles > 0 && Date.now() - launcher.lastFire > launcher.fireRate) {
            const dist = Math.abs(launcher.x - targetX);
            if (dist < closestDist) {
                closestDist = dist;
                closestLauncher = launcher;
            }
        }
    });
    
    if (closestLauncher) {
        fireMissile(closestLauncher, targetX, targetY);
    }
});

// Keyboard controls for firing missiles
document.addEventListener('keydown', (e) => {
    if (!gameState.gameRunning) return;
    
    // Cheat code: P key gives 100 scrap
    if (e.key.toLowerCase() === 'p') {
        gameState.scrap += 100;
        return;
    }
    
    let launcherIndex = -1;
    if (e.key.toLowerCase() === 'q') launcherIndex = 0;
    else if (e.key.toLowerCase() === 'w') launcherIndex = 1;
    else if (e.key.toLowerCase() === 'e') launcherIndex = 2;
    
    if (launcherIndex >= 0) {
        const launcher = launchers[launcherIndex];
        if (launcher.missiles > 0 && Date.now() - launcher.lastFire > launcher.fireRate) {
            fireMissile(launcher, mouseX, mouseY);
        }
    }
});

function fireMissile(launcher, targetX, targetY) {
    const launcherIndex = launchers.indexOf(launcher);
    const speedLevel = launcherUpgrades[launcherIndex].speed.level;
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
        launcherIndex: launcherIndex
    });
    
    launcher.missiles--;
    launcher.lastFire = Date.now();
}

function spawnEnemyMissile() {
    const startX = Math.random() * canvas.width;
    const targetX = Math.random() * canvas.width;
    const speed = 1 + (gameState.wave * 0.1);
    
    enemyMissiles.push({
        x: startX,
        y: 0,
        targetX: targetX,
        targetY: 780,
        vx: (targetX - startX) * speed / 400,
        vy: speed,
        trail: []
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

function checkCollisions() {
    // Check player missiles reaching targets
    playerMissiles.forEach((missile, i) => {
        const distToTarget = Math.sqrt(
            Math.pow(missile.x - missile.targetX, 2) + 
            Math.pow(missile.y - missile.targetY, 2)
        );
        
        if (distToTarget < 10) {
            createExplosion(missile.x, missile.y, true, missile.launcherIndex);
            playerMissiles.splice(i, 1);
        }
    });
    
    // Check enemy missiles hitting ground
    enemyMissiles.forEach((missile, i) => {
        if (missile.y >= 780) {
            createExplosion(missile.x, missile.y, false);
            enemyMissiles.splice(i, 1);
            
            // Check if city was hit
            cityPositions.forEach((cityX, cityIndex) => {
                if (!destroyedCities.includes(cityIndex) && 
                    Math.abs(missile.x - cityX) < 50) {
                    destroyedCities.push(cityIndex);
                    gameState.cities--;
                }
            });
        }
    });
    
    // Check explosions destroying enemy missiles
    explosions.forEach(explosion => {
        if (explosion.isPlayer) {
            enemyMissiles.forEach((missile, i) => {
                const dist = Math.sqrt(
                    Math.pow(missile.x - explosion.x, 2) + 
                    Math.pow(missile.y - explosion.y, 2)
                );
                
                if (dist < explosion.radius) {
                    gameState.score += 10;
                    gameState.scrap += 2;
                    createExplosion(missile.x, missile.y, false);
                    enemyMissiles.splice(i, 1);
                }
            });
        }
    });
}

function updateGame(deltaTime) {
    // Update player missiles
    playerMissiles.forEach(missile => {
        missile.trail.push({x: missile.x, y: missile.y});
        if (missile.trail.length > 8) missile.trail.shift();
        
        missile.x += missile.vx;
        missile.y += missile.vy;
    });
    
    // Update enemy missiles
    enemyMissiles.forEach(missile => {
        missile.trail.push({x: missile.x, y: missile.y});
        if (missile.trail.length > 6) missile.trail.shift();
        
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
    
    // Spawn enemy missiles (only during active gameplay, not wave breaks)
    if (!gameState.waveBreak && Math.random() < 0.001 + (gameState.wave * 0.0005)) {
        spawnEnemyMissile();
        gameState.enemiesSpawned++;
    }
    
    // Check wave completion (only after some enemies have been spawned)
    if (enemyMissiles.length === 0 && playerMissiles.length === 0 && explosions.length === 0 && gameState.enemiesSpawned > 0) {
        if (!gameState.waveBreak) {
            gameState.waveBreak = true;
            gameState.waveBreakTimer = 0;
            const scrapEarned = gameState.wave * 5;
            gameState.scrap += scrapEarned;
            
            // Show wave break UI
            document.getElementById('waveBreak').style.display = 'block';
            document.getElementById('waveNumber').textContent = gameState.wave;
            document.getElementById('scrapEarned').textContent = scrapEarned;
            
            // Reload all launchers
            launchers.forEach(launcher => {
                launcher.missiles = launcher.maxMissiles;
            });
        }
    }
    
    // Handle wave break
    if (gameState.waveBreak) {
        gameState.waveBreakTimer += deltaTime;
        // Auto-advance after 15 seconds
        if (gameState.waveBreakTimer >= 15000) {
            continueGame();
        }
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

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height * 0.7, 1, 1);
    }
    
    // Draw cities
    cityPositions.forEach((x, i) => {
        if (!destroyedCities.includes(i)) {
            // Draw classic city skyline with two-tone colors
            // Base buildings in bright yellow
            ctx.fillStyle = '#ff0';
            ctx.fillRect(x - 25, 750, 50, 10);
            ctx.fillRect(x - 20, 740, 15, 10);
            ctx.fillRect(x - 5, 740, 10, 10);
            ctx.fillRect(x + 5, 740, 15, 10);
            
            // Taller buildings in orange
            ctx.fillStyle = '#f80';
            ctx.fillRect(x - 15, 730, 8, 10);
            ctx.fillRect(x + 7, 730, 8, 10);
            ctx.fillRect(x - 3, 725, 6, 5);
        }
    });
    
    // Draw ground
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 760, canvas.width, 40);
    
    // Draw launchers
    launchers.forEach((launcher, index) => {
        const isSelected = index === selectedLauncher;
        
        // Draw elevated launcher base
        ctx.fillStyle = isSelected ? '#44f' : '#00f';
        ctx.fillRect(launcher.x - 20, launcher.y + 10, 40, 20);
        ctx.fillRect(launcher.x - 15, launcher.y, 30, 15);
        ctx.fillRect(launcher.x - 10, launcher.y - 10, 20, 10);
        
        // Draw launcher turret
        ctx.fillRect(launcher.x - 3, launcher.y - 15, 6, 8);
        
        // Draw selection highlight
        if (isSelected) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(launcher.x - 25, launcher.y - 20, 50, 90);
        }
        
        // Draw info panel background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(launcher.x - 35, launcher.y + 35, 70, 45);
        
        // Draw info panel border
        ctx.strokeStyle = isSelected ? '#fff' : '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(launcher.x - 35, launcher.y + 35, 70, 45);
        
        // Draw missile count with large, visible numbers
        ctx.fillStyle = launcher.missiles > 0 ? '#0f0' : '#f00';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${launcher.missiles}/${launcher.maxMissiles}`, launcher.x, launcher.y + 52);
        
        // Draw missile icons
        ctx.fillStyle = '#0f0';
        const iconsPerRow = 5;
        for (let i = 0; i < launcher.missiles; i++) {
            const row = Math.floor(i / iconsPerRow);
            const col = i % iconsPerRow;
            const iconX = launcher.x - 20 + (col * 8);
            const iconY = launcher.y + 58 + (row * 6);
            ctx.fillRect(iconX, iconY, 6, 4);
        }
        
        // Draw cooldown bar - much more visible
        const timeSinceLastFire = Date.now() - launcher.lastFire;
        const cooldownProgress = Math.min(timeSinceLastFire / launcher.fireRate, 1);
        
        // Background bar - larger and more visible
        ctx.fillStyle = '#333';
        ctx.fillRect(launcher.x - 30, launcher.y + 75, 60, 6);
        
        // Progress bar
        if (cooldownProgress < 1) {
            ctx.fillStyle = '#f80';
            ctx.fillRect(launcher.x - 30, launcher.y + 75, 60 * cooldownProgress, 6);
        } else {
            ctx.fillStyle = '#0f0';
            ctx.fillRect(launcher.x - 30, launcher.y + 75, 60, 6);
        }
        
        // Launcher number
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`L${index + 1}`, launcher.x, launcher.y - 25);
        
        // Draw upgrade icons below launcher - much larger
        const upgrades = launcherUpgrades[index];
        const upgradeY = launcher.y + 90;
        const iconSize = 24;
        
        // Speed upgrade (arrow icon)
        ctx.fillStyle = gameState.scrap >= upgrades.speed.cost ? '#0f0' : '#666';
        ctx.fillRect(launcher.x - 45, upgradeY, iconSize, iconSize);
        ctx.fillStyle = '#000';
        ctx.fillRect(launcher.x - 40, upgradeY + 10, 12, 4);
        ctx.fillRect(launcher.x - 32, upgradeY + 6, 4, 12);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(upgrades.speed.level, launcher.x - 33, upgradeY + 38);
        
        // Explosion upgrade (burst icon)
        ctx.fillStyle = gameState.scrap >= upgrades.explosion.cost ? '#0f0' : '#666';
        ctx.fillRect(launcher.x - 15, upgradeY, iconSize, iconSize);
        ctx.fillStyle = '#000';
        const centerX = launcher.x - 3;
        const centerY = upgradeY + 12;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * 6;
            const y = centerY + Math.sin(angle) * 6;
            ctx.fillRect(x - 1, y - 1, 3, 3);
        }
        ctx.fillRect(centerX - 2, centerY - 2, 4, 4);
        ctx.fillStyle = '#fff';
        ctx.fillText(upgrades.explosion.level, launcher.x - 3, upgradeY + 38);
        
        // Rate upgrade (clock icon)
        ctx.fillStyle = gameState.scrap >= upgrades.rate.cost ? '#0f0' : '#666';
        ctx.fillRect(launcher.x + 15, upgradeY, iconSize, iconSize);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(launcher.x + 27, upgradeY + 12, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#666';
        ctx.fillRect(launcher.x + 26, upgradeY + 6, 2, 6);
        ctx.fillRect(launcher.x + 26, upgradeY + 12, 4, 2);
        ctx.fillStyle = '#fff';
        ctx.fillText(upgrades.rate.level, launcher.x + 27, upgradeY + 38);
        
        // Capacity upgrade (box icon)
        ctx.fillStyle = gameState.scrap >= upgrades.capacity.cost ? '#0f0' : '#666';
        ctx.fillRect(launcher.x + 45, upgradeY, iconSize, iconSize);
        ctx.fillStyle = '#000';
        ctx.fillRect(launcher.x + 49, upgradeY + 4, 16, 16);
        ctx.fillStyle = '#666';
        ctx.fillRect(launcher.x + 51, upgradeY + 6, 4, 4);
        ctx.fillRect(launcher.x + 59, upgradeY + 6, 4, 4);
        ctx.fillRect(launcher.x + 51, upgradeY + 12, 4, 4);
        ctx.fillRect(launcher.x + 59, upgradeY + 12, 4, 4);
        ctx.fillStyle = '#fff';
        ctx.fillText(upgrades.capacity.level, launcher.x + 57, upgradeY + 38);
        
        ctx.textAlign = 'left'; // Reset text alignment
    });
    
    // Draw hover tooltips for upgrade icons
    for (let i = 0; i < launchers.length; i++) {
        const launcher = launchers[i];
        const upgradeY = launcher.y + 90;
        const iconSize = 24;
        const upgrades = launcherUpgrades[i];
        
        let tooltipText = '';
        let tooltipX = 0;
        let tooltipY = upgradeY - 10;
        
        // Check which upgrade icon mouse is hovering over
        if (mouseX >= launcher.x - 45 && mouseX <= launcher.x - 45 + iconSize &&
            mouseY >= upgradeY && mouseY <= upgradeY + iconSize) {
            tooltipText = `Speed Lv.${upgrades.speed.level} → ${upgrades.speed.cost} scrap`;
            tooltipX = launcher.x - 45;
        } else if (mouseX >= launcher.x - 15 && mouseX <= launcher.x - 15 + iconSize &&
                   mouseY >= upgradeY && mouseY <= upgradeY + iconSize) {
            tooltipText = `Explosion Lv.${upgrades.explosion.level} → ${upgrades.explosion.cost} scrap`;
            tooltipX = launcher.x - 15;
        } else if (mouseX >= launcher.x + 15 && mouseX <= launcher.x + 15 + iconSize &&
                   mouseY >= upgradeY && mouseY <= upgradeY + iconSize) {
            tooltipText = `Fire Rate Lv.${upgrades.rate.level} → ${upgrades.rate.cost} scrap`;
            tooltipX = launcher.x + 15;
        } else if (mouseX >= launcher.x + 45 && mouseX <= launcher.x + 45 + iconSize &&
                   mouseY >= upgradeY && mouseY <= upgradeY + iconSize) {
            tooltipText = `Capacity Lv.${upgrades.capacity.level} → ${upgrades.capacity.cost} scrap`;
            tooltipX = launcher.x + 45;
        }
        
        // Draw tooltip if hovering
        if (tooltipText) {
            ctx.font = '12px monospace';
            const textWidth = ctx.measureText(tooltipText).width;
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(tooltipX - 5, tooltipY - 15, textWidth + 10, 18);
            
            // Border
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 1;
            ctx.strokeRect(tooltipX - 5, tooltipY - 15, textWidth + 10, 18);
            
            // Text
            ctx.fillStyle = '#0f0';
            ctx.fillText(tooltipText, tooltipX, tooltipY);
        }
    }
    
    // Draw crosshair
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mouseX - 10, mouseY);
    ctx.lineTo(mouseX + 10, mouseY);
    ctx.moveTo(mouseX, mouseY - 10);
    ctx.lineTo(mouseX, mouseY + 10);
    ctx.stroke();
    
    // Draw player missiles
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    playerMissiles.forEach(missile => {
        // Draw trail
        ctx.beginPath();
        missile.trail.forEach((point, i) => {
            ctx.globalAlpha = i / missile.trail.length;
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Draw missile head
        ctx.fillStyle = '#0f0';
        ctx.fillRect(missile.x - 2, missile.y - 2, 4, 4);
    });
    
    // Draw enemy missiles
    ctx.strokeStyle = '#f80';
    ctx.lineWidth = 2;
    enemyMissiles.forEach(missile => {
        // Draw trail
        ctx.beginPath();
        missile.trail.forEach((point, i) => {
            ctx.globalAlpha = i / missile.trail.length;
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Draw missile head
        ctx.fillStyle = '#f80';
        ctx.fillRect(missile.x - 2, missile.y - 2, 4, 4);
    });
    
    // Draw explosions
    explosions.forEach(explosion => {
        ctx.globalAlpha = explosion.alpha;
        ctx.fillStyle = explosion.isPlayer ? '#0f0' : '#f80';
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    
    // Draw particles
    particles.forEach(particle => {
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
        ctx.globalAlpha = 1;
    });
    
    // Draw upgrade effects
    upgradeEffects.forEach(effect => {
        ctx.globalAlpha = effect.alpha;
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(effect.text, effect.x, effect.y);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    });
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

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('scrap').textContent = gameState.scrap;
    document.getElementById('wave').textContent = gameState.wave;
    document.getElementById('cities').textContent = gameState.cities;
    
    
    // Update repair button
    const repairBtn = document.getElementById('repairCity');
    repairBtn.disabled = gameState.scrap < 50 || destroyedCities.length === 0;
    
    // Update wave break timer
    if (gameState.waveBreak) {
        const timeLeft = Math.ceil((15000 - gameState.waveBreakTimer) / 1000);
        const timerElement = document.getElementById('autoTimer');
        if (timerElement) {
            timerElement.textContent = Math.max(0, timeLeft);
        }
    }
}

// Global variable to track selected launcher for upgrades
let selectedLauncher = 0;

function createUpgradeEffect(x, y, type) {
    const typeNames = {
        speed: 'SPEED UP!',
        explosion: 'BIGGER BOOM!',
        rate: 'FASTER FIRE!',
        capacity: 'MORE AMMO!'
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

function upgrade(type, launcherIndex = selectedLauncher) {
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
            const newCapacity = Math.floor(10 * Math.pow(1.2, upgrade.level - 1));
            launchers[launcherIndex].maxMissiles = newCapacity;
            launchers[launcherIndex].missiles = newCapacity;
        }
    }
}

function selectLauncher(index) {
    selectedLauncher = index;
}

function repairCity() {
    if (gameState.scrap >= 50 && destroyedCities.length > 0) {
        gameState.scrap -= 50;
        destroyedCities.splice(0, 1);
        gameState.cities++;
    }
}

function continueGame() {
    gameState.wave++;
    gameState.waveBreak = false;
    gameState.waveBreakTimer = 0;
    gameState.enemiesSpawned = 0;
    document.getElementById('waveBreak').style.display = 'none';
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
        enemiesSpawned: 0
    };
    
    launcherUpgrades = [
        { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 } },
        { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 } },
        { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 } }
    ];
    
    globalUpgrades = {
        cityShield: { level: 0, cost: 100 },
        missileHighlight: { level: 0, cost: 75 }
    };
    
    selectedLauncher = 0;
    
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
    
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('waveBreak').style.display = 'none';
}

// Start the game
requestAnimationFrame(gameLoop);
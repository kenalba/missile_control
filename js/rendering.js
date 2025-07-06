// Rendering system
let canvas;
let ctx;

function initializeRenderer() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set up responsive canvas sizing
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const gameWidth = 1200;
    const gameHeight = 900;
    const aspectRatio = gameWidth / gameHeight;
    
    // Detect mobile devices
    const isMobile = window.innerWidth <= 768;
    
    let maxWidth, maxHeight;
    
    if (isMobile) {
        // Mobile: use full viewport width, account for mobile controls and UI
        maxWidth = window.innerWidth - 20; // Small margin
        maxHeight = window.innerHeight - 200; // Account for mobile controls, UI, and upgrade panel
    } else {
        // Desktop: account for upgrade panel width and margins
        const upgradePanelWidth = 320;
        const totalMargin = 60;
        maxWidth = window.innerWidth - upgradePanelWidth - totalMargin;
        maxHeight = window.innerHeight - 20;
    }
    
    let canvasWidth = Math.min(maxWidth, gameWidth);
    let canvasHeight = canvasWidth / aspectRatio;
    
    // If height is too tall, scale by height instead
    if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = canvasHeight * aspectRatio;
    }
    
    // Ensure minimum playable size on mobile
    if (isMobile) {
        const minWidth = 300;
        const minHeight = minWidth / aspectRatio;
        if (canvasWidth < minWidth) {
            canvasWidth = minWidth;
            canvasHeight = minHeight;
        }
    }
    
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    
    // Keep internal resolution constant for consistent game logic
    canvas.width = gameWidth;
    canvas.height = gameHeight;
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
            // Highlight city during bonus counting
            if (gameState.cityBonusPhase && i === gameState.cityBonusIndex) {
                ctx.fillStyle = '#0f0';
                ctx.fillRect(x - 30, 720, 60, 45);
                ctx.globalAlpha = 0.3;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            
            const upgradeLevel = cityUpgrades[i];
            
            // Draw city based on upgrade level - cleaner design
            if (upgradeLevel === 0) {
                // Basic city - simple blocks
                ctx.fillStyle = '#ff0';
                ctx.fillRect(x - 25, 750, 50, 10);
                ctx.fillRect(x - 20, 740, 15, 10);
                ctx.fillRect(x - 5, 740, 10, 10);
                ctx.fillRect(x + 5, 740, 15, 10);
                
                // Small buildings
                ctx.fillStyle = '#f80';
                ctx.fillRect(x - 15, 730, 8, 10);
                ctx.fillRect(x + 7, 730, 8, 10);
                ctx.fillRect(x - 3, 735, 6, 5);
            } else if (upgradeLevel === 1) {
                // Level 1 - Taller and wider
                ctx.fillStyle = '#ff0';
                ctx.fillRect(x - 28, 750, 56, 10);
                ctx.fillRect(x - 22, 740, 18, 10);
                ctx.fillRect(x - 8, 740, 16, 10);
                ctx.fillRect(x + 8, 740, 18, 10);
                
                // Taller buildings with blue lights
                ctx.fillStyle = '#f80';
                ctx.fillRect(x - 18, 725, 12, 15);
                ctx.fillRect(x + 6, 725, 12, 15);
                ctx.fillRect(x - 4, 720, 8, 10);
                
                // Blue upgrade lights
                ctx.fillStyle = '#0af';
                ctx.fillRect(x - 12, 722, 2, 2);
                ctx.fillRect(x + 10, 722, 2, 2);
                ctx.fillRect(x, 717, 2, 2);
            } else if (upgradeLevel === 2) {
                // Level 2 - Even taller with green energy
                ctx.fillStyle = '#ff0';
                ctx.fillRect(x - 30, 750, 60, 10);
                ctx.fillRect(x - 25, 740, 20, 10);
                ctx.fillRect(x - 10, 740, 20, 10);
                ctx.fillRect(x + 10, 740, 20, 10);
                
                // Skyscrapers
                ctx.fillStyle = '#f80';
                ctx.fillRect(x - 20, 715, 15, 25);
                ctx.fillRect(x + 5, 715, 15, 25);
                ctx.fillRect(x - 6, 710, 12, 20);
                
                // Green energy cores
                ctx.fillStyle = '#0f0';
                ctx.fillRect(x - 13, 720, 2, 10);
                ctx.fillRect(x + 11, 720, 2, 10);
                ctx.fillRect(x - 1, 715, 2, 8);
            } else if (upgradeLevel === 3) {
                // Level 3 - Massive metropolis with energy dome
                ctx.fillStyle = '#ff0';
                ctx.fillRect(x - 32, 750, 64, 10);
                ctx.fillRect(x - 28, 740, 24, 10);
                ctx.fillRect(x - 12, 740, 24, 10);
                ctx.fillRect(x + 12, 740, 24, 10);
                
                // Mega towers
                ctx.fillStyle = '#f80';
                ctx.fillRect(x - 22, 710, 18, 30);
                ctx.fillRect(x + 4, 710, 18, 30);
                ctx.fillRect(x - 8, 705, 16, 25);
                
                // Energy dome effect
                ctx.strokeStyle = '#0ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, 730, 35, Math.PI, 0, false);
                ctx.stroke();
                
                // Pulsing energy core
                ctx.fillStyle = '#0ff';
                ctx.fillRect(x - 2, 708, 4, 12);
                
                // Spires
                ctx.fillStyle = '#fff';
                ctx.fillRect(x - 13, 705, 1, 5);
                ctx.fillRect(x + 12, 705, 1, 5);
                ctx.fillRect(x, 700, 1, 5);
            }
            
            // Draw upgrade level indicator - floating above city
            if (upgradeLevel > 0) {
                ctx.fillStyle = '#0ff';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`L${upgradeLevel}`, x, 700);
                
                // Draw small glow effect around the level indicator
                ctx.shadowColor = '#0ff';
                ctx.shadowBlur = 5;
                ctx.fillText(`L${upgradeLevel}`, x, 700);
                ctx.shadowBlur = 0;
            }
        }
    });
    
    // Draw ground
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 760, canvas.width, 40);
    
    // Draw city labels on the ground
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    cityPositions.forEach((x, i) => {
        const label = `C${i + 1}`;
        // Red for destroyed cities, green for alive cities
        ctx.fillStyle = destroyedCities.includes(i) ? '#f00' : '#0f0';
        ctx.fillText(label, x, 780);
    });
    
    // Draw launchers
    launchers.forEach((launcher, index) => {
        // Skip drawing if launcher is destroyed
        if (destroyedLaunchers.includes(index)) {
            return;
        }
        
        // Get upgrade levels for visual indicators
        const upgrades = launcherUpgrades[index];
        const totalUpgrades = (upgrades.speed.level - 1) + (upgrades.explosion.level - 1) + 
                            (upgrades.rate.level - 1) + (upgrades.capacity.level - 1) + upgrades.autopilot.level;
        
        // Draw elevated launcher base with upgrade coloring
        let baseColor = '#00f';
        if (totalUpgrades >= 15) baseColor = '#f0f'; // Purple for heavily upgraded
        else if (totalUpgrades >= 10) baseColor = '#0ff'; // Cyan for well upgraded
        else if (totalUpgrades >= 5) baseColor = '#0f0'; // Green for moderately upgraded
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(launcher.x - 20, launcher.y + 10, 40, 20);
        ctx.fillRect(launcher.x - 15, launcher.y, 30, 15);
        ctx.fillRect(launcher.x - 10, launcher.y - 10, 20, 10);
        
        // Draw launcher turret with upgrade indicators
        ctx.fillRect(launcher.x - 3, launcher.y - 15, 6, 8);
        
        // Draw upgrade indicators on the turret
        if (upgrades.speed.level > 1) {
            ctx.fillStyle = '#ff0'; // Yellow for speed
            ctx.fillRect(launcher.x - 8, launcher.y - 18, 2, 2);
        }
        if (upgrades.explosion.level > 1) {
            ctx.fillStyle = '#f80'; // Orange for explosion
            ctx.fillRect(launcher.x - 5, launcher.y - 18, 2, 2);
        }
        if (upgrades.rate.level > 1) {
            ctx.fillStyle = '#0f0'; // Green for rate
            ctx.fillRect(launcher.x - 2, launcher.y - 18, 2, 2);
        }
        if (upgrades.capacity.level > 1) {
            ctx.fillStyle = '#0ff'; // Cyan for capacity
            ctx.fillRect(launcher.x + 1, launcher.y - 18, 2, 2);
        }
        if (upgrades.autopilot.level > 0) {
            ctx.fillStyle = '#f0f'; // Magenta for autopilot
            ctx.fillRect(launcher.x + 4, launcher.y - 18, 2, 2);
        }
        
        // Draw info panel background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(launcher.x - 35, launcher.y + 35, 70, 45);
        
        // Draw info panel border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(launcher.x - 35, launcher.y + 35, 70, 45);
        
        // Draw missile count with large, visible numbers
        ctx.fillStyle = launcher.missiles > 0 ? '#0f0' : '#f00';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${launcher.missiles}/${launcher.maxMissiles}`, launcher.x, launcher.y + 52);
        
        // Draw missile icons (scaled for higher counts)
        ctx.fillStyle = '#0f0';
        const maxIndividualMissiles = 50; // Show individual icons up to 50 missiles
        
        if (launcher.maxMissiles <= maxIndividualMissiles) {
            // Show individual missile icons with dynamic sizing
            const availableWidth = 60;
            const availableHeight = 20; // Allow more vertical space
            const maxIconsPerRow = Math.min(15, launcher.maxMissiles);
            const totalRows = Math.ceil(launcher.maxMissiles / maxIconsPerRow);
            
            const iconWidth = Math.max(2, Math.min(4, availableWidth / maxIconsPerRow - 1));
            const iconHeight = Math.max(2, Math.min(3, availableHeight / totalRows - 1));
            const iconSpacingX = availableWidth / maxIconsPerRow;
            const iconSpacingY = Math.max(3, availableHeight / totalRows);
            
            for (let i = 0; i < launcher.missiles; i++) {
                const row = Math.floor(i / maxIconsPerRow);
                const col = i % maxIconsPerRow;
                const iconX = launcher.x - 30 + (col * iconSpacingX);
                const iconY = launcher.y + 58 + (row * iconSpacingY);
                ctx.fillRect(iconX, iconY, iconWidth, iconHeight);
            }
            
            // Show empty slots in darker color
            ctx.fillStyle = '#333';
            for (let i = launcher.missiles; i < launcher.maxMissiles; i++) {
                const row = Math.floor(i / maxIconsPerRow);
                const col = i % maxIconsPerRow;
                const iconX = launcher.x - 30 + (col * iconSpacingX);
                const iconY = launcher.y + 58 + (row * iconSpacingY);
                ctx.fillRect(iconX, iconY, iconWidth, iconHeight);
            }
        } else {
            // Show segmented progress bar for very high missile counts
            const barWidth = 60;
            const barHeight = 10;
            const segments = Math.min(20, launcher.maxMissiles); // Up to 20 segments
            const segmentWidth = (barWidth - segments + 1) / segments; // Account for 1px gaps
            const missilesPerSegment = launcher.maxMissiles / segments;
            
            for (let i = 0; i < segments; i++) {
                const segmentX = launcher.x - 30 + (i * (segmentWidth + 1));
                const segmentY = launcher.y + 58;
                
                // Calculate how full this segment should be
                const segmentStartMissile = i * missilesPerSegment;
                const segmentEndMissile = (i + 1) * missilesPerSegment;
                const segmentFillRatio = Math.max(0, Math.min(1, 
                    (launcher.missiles - segmentStartMissile) / missilesPerSegment));
                
                // Background
                ctx.fillStyle = '#333';
                ctx.fillRect(segmentX, segmentY, segmentWidth, barHeight);
                
                // Fill
                if (segmentFillRatio > 0) {
                    ctx.fillStyle = '#0f0';
                    ctx.fillRect(segmentX, segmentY + (barHeight * (1 - segmentFillRatio)), 
                               segmentWidth, barHeight * segmentFillRatio);
                }
                
                // Border
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 1;
                ctx.strokeRect(segmentX, segmentY, segmentWidth, barHeight);
            }
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
        
        // Launcher number - removed to reduce visual clutter
        
        ctx.textAlign = 'left'; // Reset text alignment
    });
    
    
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
    ctx.lineWidth = 2;
    enemyMissiles.forEach(missile => {
        // Use different color for smart bombs
        ctx.strokeStyle = missile.isSmartBomb ? '#f0f' : '#f80';
        
        // Draw trail
        ctx.beginPath();
        missile.trail.forEach((point, i) => {
            ctx.globalAlpha = i / missile.trail.length;
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Draw missile head (larger for smart bombs)
        ctx.fillStyle = missile.isSmartBomb ? '#f0f' : '#f80';
        const size = missile.isSmartBomb ? 6 : 4;
        ctx.fillRect(missile.x - size/2, missile.y - size/2, size, size);
    });
    
    // Draw planes
    ctx.lineWidth = 2;
    planes.forEach(plane => {
        // Draw plane trail
        ctx.strokeStyle = '#0af';
        ctx.beginPath();
        plane.trail.forEach((point, i) => {
            ctx.globalAlpha = i / plane.trail.length * 0.5;
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Draw plane body
        ctx.fillStyle = '#0af';
        ctx.fillRect(plane.x - 15, plane.y - 3, 30, 6);
        
        // Draw plane wings
        ctx.fillStyle = '#08d';
        ctx.fillRect(plane.x - 10, plane.y - 8, 20, 3);
        ctx.fillRect(plane.x - 10, plane.y + 5, 20, 3);
        
        // Draw plane nose (different for left/right direction)
        if (plane.fromLeft) {
            ctx.fillRect(plane.x + 15, plane.y - 1, 5, 2);
        } else {
            ctx.fillRect(plane.x - 20, plane.y - 1, 5, 2);
        }
        
        // Draw health indicator (simple green bar for 1 HP)
        ctx.fillStyle = '#0f0';
        ctx.fillRect(plane.x - 8, plane.y - 12, 16, 2);
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
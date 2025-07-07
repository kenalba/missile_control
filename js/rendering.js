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
    
    // Apply screen shake
    ctx.save();
    ctx.translate(gameState.screenShake.x, gameState.screenShake.y);
    
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
                ctx.fillRect(x - 30, 760, 60, 45);
                ctx.globalAlpha = 0.3;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            
            const upgradeLevel = cityUpgrades[i];
            
            // Draw city based on upgrade level - cleaner design
            if (upgradeLevel === 0) {
                // Basic city - simple blocks
                ctx.fillStyle = '#ff0';
                ctx.fillRect(x - 25, 790, 50, 10);
                ctx.fillRect(x - 20, 780, 15, 10);
                ctx.fillRect(x - 5, 780, 10, 10);
                ctx.fillRect(x + 5, 780, 15, 10);
                
                // Small buildings
                ctx.fillStyle = '#f80';
                ctx.fillRect(x - 15, 770, 8, 10);
                ctx.fillRect(x + 7, 770, 8, 10);
                ctx.fillRect(x - 3, 775, 6, 5);
            } else if (upgradeLevel === 1) {
                // Level 1 - Taller and wider
                ctx.fillStyle = '#ff0';
                ctx.fillRect(x - 28, 790, 56, 10);
                ctx.fillRect(x - 22, 780, 18, 10);
                ctx.fillRect(x - 8, 780, 16, 10);
                ctx.fillRect(x + 8, 780, 18, 10);
                
                // Taller buildings with blue lights
                ctx.fillStyle = '#f80';
                ctx.fillRect(x - 18, 765, 12, 15);
                ctx.fillRect(x + 6, 765, 12, 15);
                ctx.fillRect(x - 4, 760, 8, 10);
                
                // Blue upgrade lights
                ctx.fillStyle = '#0af';
                ctx.fillRect(x - 12, 762, 2, 2);
                ctx.fillRect(x + 10, 762, 2, 2);
                ctx.fillRect(x, 757, 2, 2);
            } else if (upgradeLevel === 2) {
                // Level 2 - Even taller with green energy
                ctx.fillStyle = '#ff0';
                ctx.fillRect(x - 30, 790, 60, 10);
                ctx.fillRect(x - 25, 780, 20, 10);
                ctx.fillRect(x - 10, 780, 20, 10);
                ctx.fillRect(x + 10, 780, 20, 10);
                
                // Skyscrapers
                ctx.fillStyle = '#f80';
                ctx.fillRect(x - 20, 755, 15, 25);
                ctx.fillRect(x + 5, 755, 15, 25);
                ctx.fillRect(x - 6, 750, 12, 20);
                
                // Green energy cores
                ctx.fillStyle = '#0f0';
                ctx.fillRect(x - 13, 760, 2, 10);
                ctx.fillRect(x + 11, 760, 2, 10);
                ctx.fillRect(x - 1, 755, 2, 8);
            } else if (upgradeLevel === 3) {
                // Level 3 - Massive metropolis with energy dome
                ctx.fillStyle = '#ff0';
                ctx.fillRect(x - 32, 790, 64, 10);
                ctx.fillRect(x - 28, 780, 24, 10);
                ctx.fillRect(x - 12, 780, 24, 10);
                ctx.fillRect(x + 12, 780, 24, 10);
                
                // Mega towers
                ctx.fillStyle = '#f80';
                ctx.fillRect(x - 22, 750, 18, 30);
                ctx.fillRect(x + 4, 750, 18, 30);
                ctx.fillRect(x - 8, 745, 16, 25);
                
                // Energy dome effect
                ctx.strokeStyle = '#0ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, 770, 35, Math.PI, 0, false);
                ctx.stroke();
                
                // Pulsing energy core
                ctx.fillStyle = '#0ff';
                ctx.fillRect(x - 2, 748, 4, 12);
                
                // Spires
                ctx.fillStyle = '#fff';
                ctx.fillRect(x - 13, 745, 1, 5);
                ctx.fillRect(x + 12, 745, 1, 5);
                ctx.fillRect(x, 740, 1, 5);
            }
            
            // Draw upgrade level indicator - floating above city
            if (upgradeLevel > 0) {
                ctx.fillStyle = '#0ff';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`L${upgradeLevel}`, x, 740);
                
                // Draw small glow effect around the level indicator
                ctx.shadowColor = '#0ff';
                ctx.shadowBlur = 5;
                ctx.fillText(`L${upgradeLevel}`, x, 740);
                ctx.shadowBlur = 0;
            }
        }
    });
    
    // Draw ground with fun retro colors
    ctx.fillStyle = '#8B4513'; // Solid brown ground
    ctx.fillRect(0, 800, canvas.width, 100);
    
    // Add surface detail line
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 800);
    ctx.lineTo(canvas.width, 800);
    ctx.stroke();
    
    // Add simple geometric pattern for texture
    ctx.fillStyle = '#A0522D';
    for (let i = 0; i < canvas.width; i += 40) {
        for (let j = 0; j < 4; j++) {
            const y = 810 + (j * 20);
            ctx.fillRect(i + (j % 2 * 20), y, 10, 5);
        }
    }
    
    // Draw city labels and upgrade buttons on the ground
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    cityPositions.forEach((x, i) => {
        const label = `C${i + 1}`;
        // Red for destroyed cities, green for alive cities
        ctx.fillStyle = destroyedCities.includes(i) ? '#f00' : '#0f0';
        ctx.fillText(label, x, 820);
        
        // Draw city upgrade button below label - improved appearance
        const currentLevel = cityUpgrades[i];
        const cost = 20 + (currentLevel * 15);
        const isDestroyed = destroyedCities.includes(i);
        const isMaxLevel = currentLevel >= 3;
        const canAfford = gameState.scrap >= cost;
        
        // Button with rounded corners effect and better colors
        let bgColor, borderColor, textColor;
        if (isDestroyed) {
            const canRepair = gameState.scrap >= 50;
            bgColor = canRepair ? '#440' : '#400';
            borderColor = canRepair ? '#ff0' : '#f00';
            textColor = canRepair ? '#ff8' : '#f88';
        } else if (isMaxLevel) {
            bgColor = '#440';
            borderColor = '#ff0';
            textColor = '#ff8';
        } else if (canAfford) {
            bgColor = '#040';
            borderColor = '#0f0';
            textColor = '#8f8';
        } else {
            bgColor = '#222';
            borderColor = '#666';
            textColor = '#999';
        }
        
        // Draw button with pixel-perfect positioning
        const buttonX = Math.round(x - 24);
        const buttonY = Math.round(836);
        const buttonWidth = 48;
        const buttonHeight = 18;
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Top highlight for 3D effect
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(buttonX, buttonY, buttonWidth, 2);
        
        // Border with pixel-perfect positioning
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(buttonX + 0.5, buttonY + 0.5, buttonWidth - 1, buttonHeight - 1);
        
        // Corner dots for rounded effect
        ctx.fillStyle = borderColor;
        ctx.fillRect(buttonX, buttonY, 1, 1);
        ctx.fillRect(buttonX + buttonWidth - 1, buttonY, 1, 1);
        ctx.fillRect(buttonX, buttonY + buttonHeight - 1, 1, 1);
        ctx.fillRect(buttonX + buttonWidth - 1, buttonY + buttonHeight - 1, 1, 1);
        
        // Button text with better contrast and crisp rendering
        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px monospace';
        ctx.textBaseline = 'middle';
        
        // Ensure pixel-perfect text rendering
        const textX = Math.round(x);
        const textY = Math.round(845);
        
        if (isDestroyed) {
            ctx.fillText('REPAIR 50', textX, textY);
        } else if (isMaxLevel) {
            ctx.fillText('MAX', textX, textY);
        } else {
            ctx.fillText(`${cost}`, textX, textY);
        }
        
        // Reset text baseline
        ctx.textBaseline = 'alphabetic';
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
        
        // Draw launcher turret with creative upgrade indicators
        
        // Speed upgrades - Exhaust flames behind turret
        if (upgrades.speed.level > 1) {
            const flameIntensity = Math.min(upgrades.speed.level - 1, 5) / 5;
            ctx.fillStyle = `rgba(255, 165, 0, ${0.3 + flameIntensity * 0.4})`;
            for (let i = 0; i < upgrades.speed.level - 1; i++) {
                const flameY = launcher.y - 10 + i * 2;
                ctx.fillRect(launcher.x - 6 - i, flameY, 3, 4);
                ctx.fillRect(launcher.x + 3 + i, flameY, 3, 4);
            }
        }
        
        // Explosion upgrades - Larger barrel with reinforcement rings
        let barrelWidth = 6;
        if (upgrades.explosion.level > 1) {
            barrelWidth = 6 + (upgrades.explosion.level - 1) * 2;
            ctx.fillStyle = '#f80';
            // Draw reinforcement rings on barrel
            for (let i = 1; i < upgrades.explosion.level; i++) {
                ctx.strokeStyle = '#ff0';
                ctx.lineWidth = 1;
                ctx.strokeRect(launcher.x - barrelWidth/2, launcher.y - 17 + i * 2, barrelWidth, 1);
            }
        }
        
        // Main turret barrel
        ctx.fillStyle = baseColor;
        ctx.fillRect(launcher.x - barrelWidth/2, launcher.y - 15, barrelWidth, 8);
        
        // Rate upgrades - Cooling vents on sides
        if (upgrades.rate.level > 1) {
            ctx.fillStyle = '#0f0';
            for (let i = 1; i < upgrades.rate.level; i++) {
                const ventY = launcher.y - 12 - i * 2;
                // Left vents
                ctx.fillRect(launcher.x - barrelWidth/2 - 2, ventY, 1, 3);
                ctx.fillRect(launcher.x - barrelWidth/2 - 4, ventY + 1, 1, 1);
                // Right vents
                ctx.fillRect(launcher.x + barrelWidth/2 + 1, ventY, 1, 3);
                ctx.fillRect(launcher.x + barrelWidth/2 + 3, ventY + 1, 1, 1);
            }
        }
        
        // Capacity upgrades - Ammo drums on sides
        if (upgrades.capacity.level > 1) {
            ctx.fillStyle = '#0ff';
            const drumSize = 2 + upgrades.capacity.level;
            ctx.fillRect(launcher.x - 12, launcher.y - 8, drumSize, drumSize);
            ctx.fillRect(launcher.x + 12 - drumSize, launcher.y - 8, drumSize, drumSize);
            
            // Ammo belts
            ctx.strokeStyle = '#088';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(launcher.x - 12 + drumSize, launcher.y - 6);
            ctx.lineTo(launcher.x - barrelWidth/2, launcher.y - 10);
            ctx.moveTo(launcher.x + 12 - drumSize, launcher.y - 6);
            ctx.lineTo(launcher.x + barrelWidth/2, launcher.y - 10);
            ctx.stroke();
        }
        
        // Autopilot upgrades - Radar dish and scanning beam
        if (upgrades.autopilot.level > 0) {
            ctx.fillStyle = '#f0f';
            // Radar dish
            ctx.fillRect(launcher.x - 3, launcher.y - 25, 6, 3);
            ctx.fillRect(launcher.x - 1, launcher.y - 28, 2, 3);
            
            // Animated scanning beam
            const time = Date.now() * 0.003;
            const beamAngle = time % (Math.PI * 2);
            const beamLength = 30;
            
            ctx.strokeStyle = `rgba(255, 0, 255, 0.5)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(launcher.x, launcher.y - 23);
            ctx.lineTo(
                launcher.x + Math.cos(beamAngle) * beamLength,
                launcher.y - 23 + Math.sin(beamAngle) * beamLength
            );
            ctx.stroke();
        }
        
        // Draw info panel background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(launcher.x - 35, launcher.y + 25, 70, 45);
        
        // Draw info panel border
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.strokeRect(launcher.x - 35, launcher.y + 25, 70, 45);
        
        // Draw missile count with large, visible numbers
        ctx.fillStyle = launcher.missiles > 0 ? '#0f0' : '#f00';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${launcher.missiles}/${launcher.maxMissiles}`, launcher.x, launcher.y + 42);
        
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
                const iconY = launcher.y + 48 + (row * iconSpacingY);
                ctx.fillRect(iconX, iconY, iconWidth, iconHeight);
            }
            
            // Show empty slots in darker color
            ctx.fillStyle = '#333';
            for (let i = launcher.missiles; i < launcher.maxMissiles; i++) {
                const row = Math.floor(i / maxIconsPerRow);
                const col = i % maxIconsPerRow;
                const iconX = launcher.x - 30 + (col * iconSpacingX);
                const iconY = launcher.y + 48 + (row * iconSpacingY);
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
                const segmentY = launcher.y + 48;
                
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
        ctx.fillRect(launcher.x - 30, launcher.y + 65, 60, 6);
        
        // Progress bar
        if (cooldownProgress < 1) {
            ctx.fillStyle = '#f80';
            ctx.fillRect(launcher.x - 30, launcher.y + 65, 60 * cooldownProgress, 6);
        } else {
            ctx.fillStyle = '#0f0';
            ctx.fillRect(launcher.x - 30, launcher.y + 65, 60, 6);
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
        // Different colors for different missile types
        let missileColor = '#f80'; // Default orange
        if (missile.isSplitter) missileColor = '#f0f'; // Magenta for splitters
        if (missile.isSeeker) missileColor = '#0af'; // Cyan for seekers
        
        ctx.strokeStyle = missileColor;
        
        // Draw trail with special effects for seekers
        ctx.beginPath();
        if (missile.isSeeker) {
            // Dotted trail for seekers
            ctx.setLineDash([4, 4]);
        }
        missile.trail.forEach((point, i) => {
            ctx.globalAlpha = i / missile.trail.length;
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
        ctx.globalAlpha = 1;
        
        // Draw missile head with different shapes
        if (missile.isSeeker) {
            // Diamond shape for seekers with blinking effect
            const blinkOn = (missile.seekerBlinkTimer % 1000) < 500; // Blink every 500ms
            ctx.fillStyle = blinkOn ? '#0ff' : '#0af'; // Bright cyan when blinking
            
            const size = 5;
            ctx.beginPath();
            ctx.moveTo(missile.x, missile.y - size);      // Top
            ctx.lineTo(missile.x + size, missile.y);      // Right
            ctx.lineTo(missile.x, missile.y + size);      // Bottom
            ctx.lineTo(missile.x - size, missile.y);      // Left
            ctx.closePath();
            ctx.fill();
            
            // Add glow effect when blinking
            if (blinkOn) {
                ctx.shadowColor = '#0ff';
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        } else {
            // Square shape for normal missiles and splitters
            ctx.fillStyle = missileColor;
            const size = missile.isSplitter ? 6 : 4;
            ctx.fillRect(missile.x - size/2, missile.y - size/2, size, size);
        }
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
        
    });
    
    // Draw explosions with enhanced visuals
    explosions.forEach(explosion => {
        // Draw main explosion
        ctx.globalAlpha = explosion.alpha;
        
        // Different colors for different explosion types
        let explosionColor = explosion.isPlayer ? '#0f0' : '#f80';
        if (explosion.type === 'plane') explosionColor = '#0af';
        if (explosion.type === 'city') explosionColor = '#ff0';
        
        ctx.fillStyle = explosionColor;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw core bright center for larger explosions
        if (explosion.radius > 40) {
            ctx.globalAlpha = explosion.alpha * 0.8;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw shockwave if present
        if (explosion.shockwave && explosion.shockwaveAlpha > 0) {
            ctx.globalAlpha = explosion.shockwaveAlpha;
            ctx.strokeStyle = explosionColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.shockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner shockwave ring
            ctx.globalAlpha = explosion.shockwaveAlpha * 0.5;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.shockwaveRadius * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    });
    
    // Draw particles with enhanced visuals
    particles.forEach(particle => {
        ctx.globalAlpha = particle.life / (particle.maxLife || 1);
        ctx.fillStyle = particle.color;
        
        if (particle.isText) {
            // Draw celebration text
            ctx.font = `bold ${particle.size}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(particle.text, particle.x, particle.y);
            ctx.textAlign = 'left';
        } else if (particle.isFlash) {
            // Draw impact flash as large fading circle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * (particle.life / particle.maxLife), 0, Math.PI * 2);
            ctx.fill();
        } else if (particle.sparkle) {
            // Draw sparkle particles with star shape
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(Date.now() * 0.01); // Rotate sparkles
            
            const size = particle.size || 2;
            // Star shape
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 2;
                const x = Math.cos(angle) * size;
                const y = Math.sin(angle) * size;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        } else if (particle.firework) {
            // Draw firework particles with glow effect
            const size = particle.size || 2;
            
            // Glow effect
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Draw normal particles with variable sizes
            const size = particle.size || 2;
            ctx.fillRect(particle.x - size/2, particle.y - size/2, size, size);
        }
        
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
    
    // Draw pause indicator
    if (gameState.paused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = 'bold 24px monospace';
        ctx.fillText('Press SPACEBAR to continue', canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'left';
    }
    
    // Restore transform after screen shake
    ctx.restore();
}
// Rendering system with TypeScript typing
import type { Explosion, Missile, Launcher, Particle } from '@/types/gameTypes';
import { gameState } from '@/systems/observableState';
import { playerMissiles, enemyMissiles } from '@/entities/missiles';
import { explosions } from '@/entities/explosions';
import { planes } from '@/entities/planes';
import { launchers } from '@/entities/launchers';
import { cityPositions, destroyedCities, cityUpgrades } from '@/entities/cities';
import { cityData } from '@/core/cities';
import { particles, upgradeEffects } from '@/entities/particles';
import { launcherUpgrades, globalUpgrades } from '@/core/upgrades';
import { ammoTrucks } from '@/entities/trucks';
import { timeManager } from '@/systems/timeManager';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let mouseX = 600;
let mouseY = 450;

export function initializeRenderer(): void {
    canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
        throw new Error('Game canvas element not found');
    }
    
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Could not get 2D rendering context');
    }
    ctx = context;
    
    // Set up responsive canvas sizing
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

export function setMousePosition(x: number, y: number): void {
    mouseX = x;
    mouseY = y;
}

function resizeCanvas(): void {
    const gameWidth = 1200;
    const gameHeight = 900;
    const aspectRatio = gameWidth / gameHeight;
    
    // Detect mobile devices
    const isMobile = window.innerWidth <= 768;
    
    let maxWidth: number, maxHeight: number;
    
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

export function render(): void {
    if (!ctx || !canvas) {
        // Try to initialize if not already done
        try {
            initializeRenderer();
        } catch (error) {
            console.warn('Canvas context not available for rendering', error);
            return;
        }
        
        // Check again after initialization attempt
        if (!ctx || !canvas) {
            console.warn('Canvas context still not available after initialization attempt');
            return;
        }
    }

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
    drawCities();
    
    // Draw ground
    drawGround();
    
    // Draw city basements after ground (so they're visible)
    drawCityBasements();
    
    // City production info is now integrated into basement architecture
    
    // Draw launchers
    drawLaunchers();
    
    // Draw crosshair
    drawCrosshair();
    
    // Draw missiles
    drawPlayerMissiles();
    drawEnemyMissiles();
    
    // Draw planes
    drawPlanes();
    
    // Draw explosions
    drawExplosions();
    
    // Draw particles
    drawParticles();
    
    // Draw upgrade effects
    drawUpgradeEffects();
    
    // Draw ammo trucks
    drawAmmoTrucks();
    
    // Draw pause indicator
    if (gameState.paused) {
        drawPauseOverlay();
    }
    
    // Restore transform after screen shake
    ctx.restore();
}

function drawCities(): void {
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
            
            // Draw city based on upgrade level
            if (upgradeLevel === 0) {
                drawBasicCity(x);
            } else if (upgradeLevel === 1) {
                drawLevel1City(x);
            } else if (upgradeLevel === 2) {
                drawLevel2City(x);
            } else if (upgradeLevel === 3) {
                drawLevel3City(x);
            }
            
            // Draw upgrade level indicator
            if (upgradeLevel > 0) {
                ctx.fillStyle = '#0ff';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`L${upgradeLevel}`, x, 740);
                
                // Draw glow effect
                ctx.shadowColor = '#0ff';
                ctx.shadowBlur = 5;
                ctx.fillText(`L${upgradeLevel}`, x, 740);
                ctx.shadowBlur = 0;
            }
        }
    });
    
    // Draw mode-specific city information
    if (gameState.currentMode === 'command') {
        drawCommandModeCityInfo();
    } else {
        drawArcadeModeCityInfo();
    }
}

function drawBasicCity(x: number): void {
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
    
    // Underground basement will be drawn separately after ground
}

function drawLevel1City(x: number): void {
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
    
    // Underground basement will be drawn separately after ground
}

function drawLevel2City(x: number): void {
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
    
    // Underground basement will be drawn separately after ground
}

function drawLevel3City(x: number): void {
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
    
    // Underground basement will be drawn separately after ground
}

function drawCityBasement(x: number): void {
    // Only draw basements in Command Mode
    if (gameState.currentMode !== 'command') return;
    
    // Find which city this is to get production mode
    let cityIndex = -1;
    for (let i = 0; i < cityPositions.length; i++) {
        if (Math.abs(cityPositions[i] - x) < 5) {
            cityIndex = i;
            break;
        }
    }
    
    if (cityIndex === -1 || destroyedCities.includes(cityIndex) || !cityData[cityIndex]) return;
    
    const city = cityData[cityIndex];
    
    // Basement width matches city upgrade level
    const upgradeLevel = cityUpgrades[cityIndex];
    let basementWidth;
    if (upgradeLevel === 0) basementWidth = 50; // Basic city
    else if (upgradeLevel === 1) basementWidth = 56; // Level 1
    else if (upgradeLevel === 2) basementWidth = 60; // Level 2
    else basementWidth = 64; // Level 3+
    
    const basementDepth = 30;
    const basementX = x - basementWidth/2;
    const basementY = 800; // Start at ground level
    
    // Basement structure - darker background to stand out
    ctx.fillStyle = '#222'; // Darker gray basement walls
    ctx.fillRect(basementX, basementY, basementWidth, basementDepth);
    
    // Basement outline - use city color (yellow)
    ctx.strokeStyle = '#ff0'; // City yellow color for outline
    ctx.lineWidth = 2;
    ctx.strokeRect(basementX, basementY, basementWidth, basementDepth);
    
    // ASCII visualization for production
    if (city.productionMode === 'ammo') {
        drawAmmoBasementASCII(x, basementX, basementY, basementWidth, basementDepth, cityIndex, city);
    } else {
        // Simple production indicator for non-ammo modes
        drawSimpleProductionIndicator(x, basementY, city.productionMode);
    }
}

// Draw all city basements (called after ground is drawn)
function drawCityBasements(): void {
    if (gameState.currentMode !== 'command') return;
    
    cityPositions.forEach((x, i) => {
        if (!destroyedCities.includes(i)) {
            drawCityBasement(x);
        }
    });
}

// Draw ASCII ammo visualization in basement
function drawAmmoBasementASCII(centerX: number, basementX: number, basementY: number, basementWidth: number, basementDepth: number, cityIndex: number, city: any): void {
    const ammoAccumulators = (window as any).ammoAccumulators || [];
    const stockpiledAmmo = city.ammoStockpile || 0;
    const productionProgress = ammoAccumulators[cityIndex] || 0;
    
    // Left side: Stockpiled missiles (smaller) - ensure they stay inside basement
    if (stockpiledAmmo > 0) {
        ctx.font = 'bold 14px monospace'; // Smaller for stockpiled
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f80'; // Orange color for ammo
        
        // Draw stockpiled missiles in triangular stacking pattern (2-1 style)
        let missiles = Math.min(stockpiledAmmo, 3); // Cap display at 3 missiles
        let row = 0;
        let missilesDrawn = 0;
        
        while (missilesDrawn < missiles && row < 2) {
            const missilesInRow = Math.min(2 - row, missiles - missilesDrawn); // 2-1 pattern
            // Ensure we stay within basement bounds
            const leftEdge = basementX + 5; // 5px margin from left wall
            const startX = leftEdge + (missilesInRow - 1) * 5; // Tighter spacing
            
            for (let i = 0; i < missilesInRow; i++) {
                const missileX = startX + i * 10;
                const missileY = basementY + basementDepth - 2 - row * 10; // Touch the ground (bottom of basement)
                ctx.fillText('^', missileX, missileY);
                missilesDrawn++;
            }
            row++;
        }
        
        // Removed count display - just show visual stacking
    }
    
    // Right side: Current missile being produced (much more visible)
    if (city.productionMode === 'ammo') {
        ctx.font = 'bold 28px monospace'; // Even larger for visibility
        ctx.textAlign = 'center';
        
        // Production progress determines visibility/opacity
        const alpha = Math.max(0.5, productionProgress); // Higher minimum visibility
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#f80'; // Orange
        
        // Position on right side, well within basement bounds
        const rightX = basementX + basementWidth - 15; // 15px from right wall
        const rightY = basementY + basementDepth - 2; // Touch the ground (bottom of basement)
        ctx.fillText('^', rightX, rightY);
        
        ctx.globalAlpha = 1.0; // Reset alpha
    }
}

// Simple production indicator for non-ammo modes
function drawSimpleProductionIndicator(centerX: number, basementY: number, productionMode: string): void {
    const shapeSize = 12;
    const shapeX = centerX - shapeSize/2;
    const shapeY = basementY + 8;
    
    // Production mode colors and shapes
    const modeData = {
        scrap: { color: '#00ff00', shape: 'square' }, // Green square
        science: { color: '#00ffff', shape: 'diamond' } // Cyan diamond
    };
    const mode = modeData[productionMode] || { color: '#ffffff', shape: 'square' };
    
    ctx.fillStyle = mode.color;
    
    if (mode.shape === 'square') {
        ctx.fillRect(shapeX, shapeY, shapeSize, shapeSize);
    } else if (mode.shape === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(centerX, shapeY); // Top
        ctx.lineTo(shapeX + shapeSize, shapeY + shapeSize/2); // Right
        ctx.lineTo(centerX, shapeY + shapeSize); // Bottom
        ctx.lineTo(shapeX, shapeY + shapeSize/2); // Left
        ctx.closePath();
        ctx.fill();
    }
}

function drawCommandModeCityInfo(): void {
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    
    cityPositions.forEach((x, i) => {
        if (!destroyedCities.includes(i) && cityData[i]) {
            const city = cityData[i];
            const populationPercent = Math.floor((city.population / city.maxPopulation) * 100);
            
            // Resource production indicator
            const resourceColors = { scrap: '#0f0', science: '#00f', ammo: '#ff0' };
            const resourceNames = { scrap: 'SCRAP', science: 'RESEARCH', ammo: 'AMMO' };
            
            ctx.fillStyle = resourceColors[city.productionMode] || '#fff';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(resourceNames[city.productionMode], x, 815);
            
            // Add glow effect
            ctx.shadowColor = resourceColors[city.productionMode];
            ctx.shadowBlur = 5;
            ctx.fillText(resourceNames[city.productionMode], x, 815);
            ctx.shadowBlur = 0;
            
            // Population display
            ctx.fillStyle = populationPercent > 75 ? '#0f0' : populationPercent > 50 ? '#ff0' : '#f80';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`${Math.floor(city.population)}/${city.maxPopulation}`, x, 830);
            
            // Population bar
            const barWidth = 40;
            const barHeight = 4;
            const barX = x - barWidth/2;
            const barY = 832;
            
            // Background
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Foreground
            const fillWidth = (city.population / city.maxPopulation) * barWidth;
            ctx.fillStyle = populationPercent > 75 ? '#0f0' : populationPercent > 50 ? '#ff0' : '#f80';
            ctx.fillRect(barX, barY, fillWidth, barHeight);
            
        } else if (destroyedCities.includes(i)) {
            ctx.fillStyle = '#f00';
            ctx.fillText('ABANDONED', x, 820);
        }
    });
}



function drawArcadeModeCityInfo(): void {
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    cityPositions.forEach((x, i) => {
        const label = `C${i + 1}`;
        ctx.fillStyle = destroyedCities.includes(i) ? '#f00' : '#0f0';
        ctx.fillText(label, x, 820);
        
        // Draw city upgrade button
        drawCityUpgradeButton(x, i);
    });
}

function drawCityUpgradeButton(x: number, cityIndex: number): void {
    const currentLevel = cityUpgrades[cityIndex];
    const cost = 20 + (currentLevel * 15);
    const isDestroyed = destroyedCities.includes(cityIndex);
    const isMaxLevel = currentLevel >= 3;
    const canAfford = gameState.scrap >= cost;
    
    // Button colors
    let bgColor: string, borderColor: string, textColor: string;
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
    
    // Draw button
    const buttonX = Math.round(x - 24);
    const buttonY = Math.round(836);
    const buttonWidth = 48;
    const buttonHeight = 18;
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Top highlight for 3D effect
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(buttonX, buttonY, buttonWidth, 2);
    
    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(buttonX + 0.5, buttonY + 0.5, buttonWidth - 1, buttonHeight - 1);
    
    // Corner dots for rounded effect
    ctx.fillStyle = borderColor;
    ctx.fillRect(buttonX, buttonY, 1, 1);
    ctx.fillRect(buttonX + buttonWidth - 1, buttonY, 1, 1);
    ctx.fillRect(buttonX, buttonY + buttonHeight - 1, 1, 1);
    ctx.fillRect(buttonX + buttonWidth - 1, buttonY + buttonHeight - 1, 1, 1);
    
    // Button text
    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px monospace';
    ctx.textBaseline = 'middle';
    
    const textX = Math.round(x);
    const textY = Math.round(845);
    
    if (isDestroyed) {
        ctx.fillText('REPAIR 50', textX, textY);
    } else if (isMaxLevel) {
        ctx.fillText('MAX', textX, textY);
    } else {
        ctx.fillText(`${cost}`, textX, textY);
    }
    
    ctx.textBaseline = 'alphabetic';
}

function drawGround(): void {
    // Draw ground with darker colors for better contrast
    ctx.fillStyle = '#4A2C1A'; // Darker brown ground
    ctx.fillRect(0, 800, canvas.width, 100);
    
    // Add surface detail line
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 800);
    ctx.lineTo(canvas.width, 800);
    ctx.stroke();
    
    // Add geometric pattern for texture with darker colors
    ctx.fillStyle = '#5D3317';
    for (let i = 0; i < canvas.width; i += 40) {
        for (let j = 0; j < 4; j++) {
            const y = 810 + (j * 20);
            ctx.fillRect(i + (j % 2 * 20), y, 10, 5);
        }
    }
}

function drawLaunchers(): void {
    launchers.forEach((launcher, index) => {
        const upgrades = launcherUpgrades[index];
        const totalUpgrades = (upgrades.speed.level - 1) + (upgrades.explosion.level - 1) + 
                            (upgrades.rate.level - 1) + (upgrades.capacity.level - 1) + upgrades.autopilot.level;
        
        // Draw launcher base with upgrade coloring
        let baseColor = '#00f';
        if (totalUpgrades >= 15) baseColor = '#f0f'; // Purple for heavily upgraded
        else if (totalUpgrades >= 10) baseColor = '#0ff'; // Cyan for well upgraded
        else if (totalUpgrades >= 5) baseColor = '#0f0'; // Green for moderately upgraded
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(launcher.x - 20, launcher.y + 10, 40, 20);
        ctx.fillRect(launcher.x - 15, launcher.y, 30, 15);
        ctx.fillRect(launcher.x - 10, launcher.y - 10, 20, 10);
        
        // Draw upgrade visual indicators
        drawLauncherUpgrades(launcher, upgrades, baseColor);
        
        // Draw launcher info panel
        drawLauncherInfo(launcher);
    });
}

function drawLauncherUpgrades(launcher: Launcher, upgrades: any, baseColor: string): void {
    // Speed upgrades - Exhaust flames
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
        for (let i = 1; i < upgrades.explosion.level; i++) {
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 1;
            ctx.strokeRect(launcher.x - barrelWidth/2, launcher.y - 17 + i * 2, barrelWidth, 1);
        }
    }
    
    // Main turret barrel
    ctx.fillStyle = baseColor;
    ctx.fillRect(launcher.x - barrelWidth/2, launcher.y - 15, barrelWidth, 8);
    
    // Rate upgrades - Cooling vents
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
    
    // Capacity upgrades - Ammo drums
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
}

function drawLauncherInfo(launcher: Launcher): void {
    // Draw info panel background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(launcher.x - 35, launcher.y + 25, 70, 45);
    
    // Draw info panel border
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.strokeRect(launcher.x - 35, launcher.y + 25, 70, 45);
    
    // Draw missile count
    ctx.fillStyle = launcher.missiles > 0 ? '#0f0' : '#f00';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${launcher.missiles}/${launcher.maxMissiles}`, launcher.x, launcher.y + 42);
    
    // Draw missile icons or progress bar
    drawMissileIndicator(launcher);
    
    // Draw cooldown bar
    drawCooldownBar(launcher);
    
    ctx.textAlign = 'left'; // Reset text alignment
}

function drawMissileIndicator(launcher: Launcher): void {
    ctx.fillStyle = '#0f0';
    const maxIndividualMissiles = 50;
    
    if (launcher.maxMissiles <= maxIndividualMissiles) {
        // Show individual missile icons
        const availableWidth = 60;
        const availableHeight = 20;
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
        
        // Show empty slots
        ctx.fillStyle = '#333';
        for (let i = launcher.missiles; i < launcher.maxMissiles; i++) {
            const row = Math.floor(i / maxIconsPerRow);
            const col = i % maxIconsPerRow;
            const iconX = launcher.x - 30 + (col * iconSpacingX);
            const iconY = launcher.y + 48 + (row * iconSpacingY);
            ctx.fillRect(iconX, iconY, iconWidth, iconHeight);
        }
    } else {
        // Show segmented progress bar for high missile counts
        drawSegmentedProgressBar(launcher);
    }
}

function drawSegmentedProgressBar(launcher: Launcher): void {
    const barWidth = 60;
    const barHeight = 10;
    const segments = Math.min(20, launcher.maxMissiles);
    const segmentWidth = (barWidth - segments + 1) / segments;
    const missilesPerSegment = launcher.maxMissiles / segments;
    
    for (let i = 0; i < segments; i++) {
        const segmentX = launcher.x - 30 + (i * (segmentWidth + 1));
        const segmentY = launcher.y + 48;
        
        const segmentStartMissile = i * missilesPerSegment;
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

function drawCooldownBar(launcher: Launcher): void {
    const currentGameTime = timeManager.getGameTime();
    const timeSinceLastFire = currentGameTime - launcher.lastFire;
    const cooldownProgress = Math.min(timeSinceLastFire / launcher.fireRate, 1);
    
    // Background bar
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
}

function drawCrosshair(): void {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mouseX - 10, mouseY);
    ctx.lineTo(mouseX + 10, mouseY);
    ctx.moveTo(mouseX, mouseY - 10);
    ctx.lineTo(mouseX, mouseY + 10);
    ctx.stroke();
}

function drawPlayerMissiles(): void {
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
}

function drawEnemyMissiles(): void {
    ctx.lineWidth = 2;
    enemyMissiles.forEach(missile => {
        // Different colors for different missile types
        let missileColor = '#f80'; // Default orange
        if ((missile as any).isSplitter) missileColor = '#f0f'; // Magenta for splitters
        if ((missile as any).isSeeker) missileColor = '#0af'; // Cyan for seekers
        
        ctx.strokeStyle = missileColor;
        
        // Draw trail with special effects for seekers
        ctx.beginPath();
        if ((missile as any).isSeeker) {
            ctx.setLineDash([4, 4]);
        }
        missile.trail.forEach((point, i) => {
            ctx.globalAlpha = i / missile.trail.length;
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        
        // Draw missile head with different shapes
        if ((missile as any).isSeeker) {
            drawSeekerMissile(missile);
        } else {
            ctx.fillStyle = missileColor;
            const size = (missile as any).isSplitter ? 6 : 4;
            ctx.fillRect(missile.x - size/2, missile.y - size/2, size, size);
        }
    });
}

function drawSeekerMissile(missile: Missile): void {
    const blinkOn = ((missile as any).seekerBlinkTimer % 1000) < 500;
    ctx.fillStyle = blinkOn ? '#0ff' : '#0af';
    
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
}

function drawPlanes(): void {
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
        
        // Draw plane nose
        if (plane.fromLeft) {
            ctx.fillRect(plane.x + 15, plane.y - 1, 5, 2);
        } else {
            ctx.fillRect(plane.x - 20, plane.y - 1, 5, 2);
        }
    });
}

function drawExplosions(): void {
    explosions.forEach(explosion => {
        ctx.globalAlpha = explosion.alpha;
        
        // Different colors for different explosion types
        let explosionColor = explosion.isPlayer ? '#0f0' : '#f80';
        if (explosion.type === 'plane') explosionColor = '#0af';
        if (explosion.type === 'city') explosionColor = '#ff0';
        
        ctx.fillStyle = explosionColor;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bright center for larger explosions
        if (explosion.radius > 40) {
            ctx.globalAlpha = explosion.alpha * 0.8;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw shockwave if present
        if (explosion.shockwave && explosion.shockwaveAlpha > 0) {
            drawShockwave(explosion, explosionColor);
        }
        
        ctx.globalAlpha = 1;
    });
}

function drawShockwave(explosion: Explosion, color: string): void {
    ctx.globalAlpha = explosion.shockwaveAlpha;
    ctx.strokeStyle = color;
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

function drawParticles(): void {
    particles.forEach(particle => {
        ctx.globalAlpha = particle.life / (particle.maxLife ?? 1);
        ctx.fillStyle = particle.color;
        
        if (particle.isText) {
            drawTextParticle(particle);
        } else if (particle.isFlash) {
            drawFlashParticle(particle);
        } else if (particle.sparkle) {
            drawSparkleParticle(particle);
        } else if (particle.firework) {
            drawFireworkParticle(particle);
        } else {
            drawNormalParticle(particle);
        }
        
        ctx.globalAlpha = 1;
    });
}

function drawTextParticle(particle: Particle): void {
    ctx.font = `bold ${particle.size}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(particle.text || '', particle.x, particle.y);
    ctx.textAlign = 'left';
}

function drawFlashParticle(particle: Particle): void {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * (particle.life / (particle.maxLife ?? 1)), 0, Math.PI * 2);
    ctx.fill();
}

function drawSparkleParticle(particle: Particle): void {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(Date.now() * 0.01);
    
    const size = particle.size || 2;
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
}

function drawFireworkParticle(particle: Particle): void {
    const size = particle.size || 2;
    
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawNormalParticle(particle: Particle): void {
    const size = particle.size || 2;
    ctx.fillRect(particle.x - size/2, particle.y - size/2, size, size);
}

function drawUpgradeEffects(): void {
    upgradeEffects.forEach(effect => {
        ctx.globalAlpha = effect.alpha;
        ctx.fillStyle = effect.color || '#ff0';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(effect.text, effect.x, effect.y);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    });
}

function drawPauseOverlay(): void {
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

function drawAmmoTrucks(): void {
    ammoTrucks.forEach(truck => {
        // Draw truck body
        const truckColor = truck.status === 'delivering' ? '#ff0' : 
                          truck.status === 'returning' ? '#f80' : '#fff';
        ctx.fillStyle = truckColor;
        ctx.fillRect(truck.currentX - 6, truck.currentY - 3, 12, 6);
        
        // Draw cargo (when delivering with ammo OR returning with undelivered ammo)
        const hasAmmo = (truck.status === 'delivering' && truck.ammoAmount > 0) ||
                        (truck.status === 'returning' && truck.returnAmmo && truck.returnAmmo > 0);
        
        if (hasAmmo) {
            ctx.fillStyle = '#f80';
            ctx.fillRect(truck.currentX - 4, truck.currentY - 5, 8, 3);
        }
        
        // Draw wheels
        ctx.fillStyle = '#333';
        ctx.fillRect(truck.currentX - 4, truck.currentY + 2, 2, 2);
        ctx.fillRect(truck.currentX + 2, truck.currentY + 2, 2, 2);
        
        // Draw status indicator
        const ammoCount = truck.status === 'delivering' ? truck.ammoAmount : 
                         truck.status === 'returning' ? (truck.returnAmmo || 0) : 0;
        
        if (ammoCount > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(ammoCount.toString(), truck.currentX, truck.currentY - 8);
        } else if (truck.status === 'returning') {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('←', truck.currentX, truck.currentY - 8);
        }
        
        // Draw progress line to destination
        if (truck.status === 'delivering') {
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(truck.currentX, truck.currentY);
            ctx.lineTo(truck.targetX, truck.targetY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.textAlign = 'left';
    });
}
// Input system for handling keyboard, mouse, and touch events
import { gameState } from '@/core/gameState';
import { cityData } from '@/core/cities';
import { launchers } from '@/entities/launchers';
import { cityPositions, destroyedCities } from '@/entities/cities';
import { fireMissile } from '@/entities/missiles';
import { createUpgradeEffect } from '@/entities/particles';
import { audioSystem } from '@/systems/audio';

// Mouse state
export let mouseX = 0;
export let mouseY = 0;
export let selectedLauncher = 0; // Default to left launcher for mobile

// Entity selection system for Command Mode
export function selectEntity(type: 'city' | 'turret', index: number): void {
    console.log(`selectEntity called: type=${type}, index=${index}`);
    console.log(`Current game mode: ${gameState.currentMode}`);
    console.log(`cityData length: ${cityData ? cityData.length : 'undefined'}`);
    console.log(`launchers length: ${launchers ? launchers.length : 'undefined'}`);
    
    if (gameState.currentMode !== 'command') {
        console.log('Not in command mode, ignoring selection');
        return;
    }
    
    // Validate index bounds
    if (type === 'city' && (index < 0 || index >= cityData.length)) {
        console.error(`Invalid city index: ${index}, cityData.length: ${cityData.length}`);
        return;
    }
    
    if (type === 'turret' && (index < 0 || index >= launchers.length)) {
        console.error(`Invalid turret index: ${index}, launchers.length: ${launchers.length}`);
        return;
    }
    
    gameState.commandMode.selectedEntityType = type;
    gameState.commandMode.selectedEntity = index;
    console.log(`Selected entity: ${type} ${index}`);
    console.log(`gameState.commandMode:`, gameState.commandMode);
    
    // Update upgrade panel based on selection
    if (gameState.currentMode === 'command') {
        // Switch to appropriate tab based on entity type
        if (type === 'city') {
            (window as any).currentUpgradeTab = 'cities';
        } else if (type === 'turret') {
            (window as any).currentUpgradeTab = 'turrets';
        }
        
        (window as any).openCommandPanel();
        
        // Force update the panel content to reflect selection
        if (typeof (window as any).updateCommandPanel === 'function') {
            (window as any).updateCommandPanel();
        }
    }
    
    // Visual feedback
    if (type && index !== null) {
        let x: number, y: number;
        if (type === 'city') {
            x = cityPositions[index];
            y = 750;
            createUpgradeEffect(x, y, 'CITY SELECTED', '#00ff00');
        } else if (type === 'turret') {
            x = launchers[index].x;
            y = launchers[index].y - 20;
            createUpgradeEffect(x, y, 'TURRET SELECTED', '#00ffff');
        }
    }
}

// Helper function to find launcher index by position
function findTurretByPosition(targetX: number): number {
    for (let i = 0; i < launchers.length; i++) {
        if (launchers[i].x === targetX) {
            return i;
        }
    }
    return -1; // Not found
}

// Main input system initialization
export function initializeInput(): void {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    // Mouse events for desktop
    canvas.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * (canvas.width / canvas.offsetWidth);
        mouseY = (e.clientY - rect.top) * (canvas.height / canvas.offsetHeight);
    });

    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Click/tap to fire or interact with UI
    canvas.addEventListener('click', (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const targetX = (e.clientX - rect.left) * (canvas.width / canvas.offsetWidth);
        const targetY = (e.clientY - rect.top) * (canvas.height / canvas.offsetHeight);
        
        // Command Mode: No click-to-fire, all interaction through upgrade panel
        if (gameState.currentMode === 'command') {
            return; // Don't fire missiles on click
        } else {
            // Arcade Mode: Legacy city upgrade button clicks
            for (let i = 0; i < cityPositions.length; i++) {
                const cityX = cityPositions[i];
                const buttonLeft = cityX - 24;
                const buttonRight = cityX + 24;
                const buttonTop = 836;
                const buttonBottom = 854;
                
                if (targetX >= buttonLeft && targetX <= buttonRight && 
                    targetY >= buttonTop && targetY <= buttonBottom) {
                    // If city is destroyed, try to repair it
                    if (destroyedCities.includes(i)) {
                        (window as any).repairCity(i);
                    } else {
                        (window as any).upgradeCity(i);
                    }
                    return; // Don't fire missile
                }
            }
        }
        
        if (!gameState.gameRunning || gameState.waveBreak || gameState.paused) return;
        
        // Don't fire below ground level
        if (targetY >= 800) return;
        
        // Fire from selected launcher (Arcade Mode only)
        const launcher = launchers[selectedLauncher];
        if (launcher) {
            if (launcher.missiles <= 0) {
                // No ammo
                audioSystem.playEmptyAmmo();
            } else if (Date.now() - launcher.lastFire <= launcher.fireRate) {
                // Still on cooldown
                audioSystem.playCooldown();
            } else {
                // Fire successfully
                fireMissile(launcher, targetX, targetY);
            }
        }
    });

    // Keyboard controls for firing missiles
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        // Cheat code: P key gives 100 scrap (works anytime)
        if (e.key.toLowerCase() === 'p') {
            gameState.scrap += 100;
            return;
        }
        
        // Cheat code: [ key gives 100 science (works anytime)
        if (e.key === '[') {
            gameState.science += 100;
            return;
        }
        
        // Debug controls (work anytime during game)
        if (gameState.gameRunning && !gameState.waveBreak) {
            if (e.key === '0') {
                // Spawn a test plane
                (window as any).spawnTestPlane();
                return;
            }
            if (e.key === '9') {
                // Spawn a test seeker
                (window as any).spawnTestSeeker();
                return;
            }
        }
        
        // Pause functionality: Spacebar to pause/unpause
        if (e.code === 'Space') {
            e.preventDefault(); // Prevent page scroll
            if (gameState.gameRunning && !gameState.waveBreak) {
                gameState.paused = !gameState.paused;
            }
            return;
        }
        
        // Close Command Mode panel with Escape key
        if (e.code === 'Escape') {
            if (gameState.currentMode === 'command') {
                const panel = document.getElementById('commandUpgradePanel');
                if (panel && panel.style.display !== 'none') {
                    (window as any).closeCommandPanel();
                    return;
                }
            }
        }
        
        if (!gameState.gameRunning || gameState.waveBreak || gameState.paused) return;
        
        let launcherIndex = -1;
        
        // Dynamic key mapping based on available launchers
        if (gameState.currentMode === 'command') {
            // Command Mode: Map keys to turrets by position, W always targets center turret
            const centerTurretIndex = findTurretByPosition(600); // Center position is always 600
            
            if (e.key.toLowerCase() === 'w' && centerTurretIndex !== -1) {
                launcherIndex = centerTurretIndex;
            } else if (e.key.toLowerCase() === 'q') {
                // Q targets leftmost available turret (excluding center)
                launcherIndex = findTurretByPosition(150); // Left position
            } else if (e.key.toLowerCase() === 'e') {
                // E targets rightmost available turret (excluding center)
                launcherIndex = findTurretByPosition(1050); // Right position
            }
        } else {
            // Arcade Mode: Traditional static mapping
            if (e.key.toLowerCase() === 'q') launcherIndex = 0;
            else if (e.key.toLowerCase() === 'w') launcherIndex = 1;
            else if (e.key.toLowerCase() === 'e') launcherIndex = 2;
        }
        
        if (launcherIndex >= 0 && launcherIndex < launchers.length) {
            // Update selected launcher for mobile UI
            selectedLauncher = launcherIndex;
            updateLauncherSelection();
            
            const launcher = launchers[launcherIndex];
            if (launcher) {
                if (launcher.missiles <= 0) {
                    // No ammo
                    audioSystem.playEmptyAmmo();
                } else if (Date.now() - launcher.lastFire <= launcher.fireRate) {
                    // Still on cooldown
                    audioSystem.playCooldown();
                } else {
                    // Fire successfully
                    fireMissile(launcher, mouseX, mouseY);
                }
            }
        }
    });
}

function handleTouch(e: TouchEvent): void {
    e.preventDefault(); // Prevent scrolling
    
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouseX = (touch.clientX - rect.left) * (canvas.width / canvas.offsetWidth);
        mouseY = (touch.clientY - rect.top) * (canvas.height / canvas.offsetHeight);
    }
}

function handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    
    // Check for city upgrade button touches
    for (let i = 0; i < cityPositions.length; i++) {
        const cityX = cityPositions[i];
        const buttonLeft = cityX - 24;
        const buttonRight = cityX + 24;
        const buttonTop = 836;
        const buttonBottom = 854;
        
        if (mouseX >= buttonLeft && mouseX <= buttonRight && 
            mouseY >= buttonTop && mouseY <= buttonBottom) {
            // If city is destroyed, try to repair it
            if (destroyedCities.includes(i)) {
                (window as any).repairCity(i);
            } else {
                (window as any).upgradeCity(i);
            }
            return; // Don't fire missile
        }
    }
    
    if (!gameState.gameRunning || gameState.waveBreak || gameState.paused) return;
    
    // Don't fire below ground level
    if (mouseY >= 800) return;
    
    // Fire from selected launcher
    const launcher = launchers[selectedLauncher];
    if (launcher) {
        if (launcher.missiles <= 0) {
            // No ammo
            audioSystem.playEmptyAmmo();
        } else if (Date.now() - launcher.lastFire <= launcher.fireRate) {
            // Still on cooldown
            audioSystem.playCooldown();
        } else {
            // Fire successfully
            fireMissile(launcher, mouseX, mouseY);
        }
    }
}

// Mobile launcher selection
export function selectLauncher(index: number): void {
    selectedLauncher = index;
    updateLauncherSelection();
}

export function updateLauncherSelection(): void {
    // Update launcher button states (dynamic based on available launchers)
    for (let i = 0; i < launchers.length; i++) {
        const btn = document.getElementById(`launcher-btn-${i}`);
        if (btn) {
            btn.classList.toggle('active', i === selectedLauncher);
        }
    }
    
    // Hide unused launcher buttons in Command Mode
    if (gameState.currentMode === 'command') {
        for (let i = launchers.length; i < 3; i++) {
            const btn = document.getElementById(`launcher-btn-${i}`);
            if (btn) {
                (btn as HTMLElement).style.display = 'none';
            }
        }
    } else {
        // Show all launcher buttons in Arcade Mode
        for (let i = 0; i < 3; i++) {
            const btn = document.getElementById(`launcher-btn-${i}`);
            if (btn) {
                (btn as HTMLElement).style.display = '';
            }
        }
    }
}

// Mobile fullscreen toggle
export function toggleFullscreen(): void {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Mobile upgrade panel toggle
export function toggleMobileUpgrades(): void {
    const upgradePanel = document.getElementById('upgradePanel');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile && upgradePanel) {
        upgradePanel.classList.toggle('open');
    }
}

// Update mobile upgrade toggle visibility and scrap display
export function updateMobileUpgradeToggle(): void {
    const upgradeToggle = document.getElementById('mobileUpgradeToggle');
    const mobileScrap = document.getElementById('mobile-scrap');
    const isMobile = window.innerWidth <= 768;
    
    if (upgradeToggle && mobileScrap) {
        // Update scrap display
        mobileScrap.textContent = gameState.scrap.toString();
        
        // Only show during wave breaks on mobile
        if (isMobile && gameState.waveBreak) {
            upgradeToggle.classList.add('show');
        } else {
            upgradeToggle.classList.remove('show');
            // Close panel if it's open when hiding toggle
            if (isMobile) {
                const upgradePanel = document.getElementById('upgradePanel');
                if (upgradePanel) {
                    upgradePanel.classList.remove('open');
                }
            }
        }
    }
}

// Variables are already exported above
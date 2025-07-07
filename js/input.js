// Input handling
let mouseX = 0;
let mouseY = 0;
let selectedLauncher = 0; // Default to left launcher for mobile

// Selection system for Command Mode
function selectEntity(type, index) {
    if (gameState.currentMode !== 'command') return;
    
    gameState.commandMode.selectedEntityType = type;
    gameState.commandMode.selectedEntity = index;
    
    // Update upgrade panel based on selection
    updateSelectionUpgradePanel();
    
    // Visual feedback
    if (type && index !== null) {
        let x, y;
        if (type === 'city') {
            x = cityPositions[index];
            y = 750;
            upgradeEffects.push({
                x: x,
                y: y,
                text: 'CITY SELECTED',
                alpha: 1,
                vy: -1,
                life: 60,
                color: '#00ff00'
            });
        } else if (type === 'turret') {
            x = launchers[index].x;
            y = launchers[index].y - 20;
            upgradeEffects.push({
                x: x,
                y: y,
                text: 'TURRET SELECTED',
                alpha: 1,
                vy: -1,
                life: 60,
                color: '#00ffff'
            });
        }
    }
}

function initializeInput() {
    const canvas = document.getElementById('gameCanvas');
    
    // Mouse events for desktop
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * (canvas.width / canvas.offsetWidth);
        mouseY = (e.clientY - rect.top) * (canvas.height / canvas.offsetHeight);
    });

    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Click/tap to fire or interact with UI
    canvas.addEventListener('click', (e) => {
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
                        repairCity(i);
                    } else {
                        upgradeCity(i);
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
        if (launcher && !destroyedLaunchers.includes(selectedLauncher)) {
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
    document.addEventListener('keydown', (e) => {
        // Cheat code: P key gives 100 scrap (works anytime)
        if (e.key.toLowerCase() === 'p') {
            gameState.scrap += 100;
            return;
        }
        
        // Debug controls (work anytime during game)
        if (gameState.gameRunning && !gameState.waveBreak) {
            if (e.key === '0') {
                // Spawn a test plane
                spawnTestPlane();
                return;
            }
            if (e.key === '9') {
                // Spawn a test seeker
                spawnTestSeeker();
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
        
        if (!gameState.gameRunning || gameState.waveBreak || gameState.paused) return;
        
        let launcherIndex = -1;
        if (e.key.toLowerCase() === 'q') launcherIndex = 0;
        else if (e.key.toLowerCase() === 'w') launcherIndex = 1;
        else if (e.key.toLowerCase() === 'e') launcherIndex = 2;
        
        if (launcherIndex >= 0 && launcherIndex < launchers.length) {
            // Update selected launcher for mobile UI
            selectedLauncher = launcherIndex;
            updateLauncherSelection();
            
            const launcher = launchers[launcherIndex];
            if (launcher && !destroyedLaunchers.includes(launcherIndex)) {
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

function handleTouch(e) {
    e.preventDefault(); // Prevent scrolling
    
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouseX = (touch.clientX - rect.left) * (canvas.width / canvas.offsetWidth);
        mouseY = (touch.clientY - rect.top) * (canvas.height / canvas.offsetHeight);
    }
}

function handleTouchEnd(e) {
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
                repairCity(i);
            } else {
                upgradeCity(i);
            }
            return; // Don't fire missile
        }
    }
    
    if (!gameState.gameRunning || gameState.waveBreak || gameState.paused) return;
    
    // Don't fire below ground level
    if (mouseY >= 800) return;
    
    // Fire from selected launcher
    const launcher = launchers[selectedLauncher];
    if (!destroyedLaunchers.includes(selectedLauncher)) {
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
function selectLauncher(index) {
    selectedLauncher = index;
    updateLauncherSelection();
}

function updateLauncherSelection() {
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
                btn.style.display = 'none';
            }
        }
    } else {
        // Show all launcher buttons in Arcade Mode
        for (let i = 0; i < 3; i++) {
            const btn = document.getElementById(`launcher-btn-${i}`);
            if (btn) {
                btn.style.display = '';
            }
        }
    }
}

// Mobile fullscreen toggle
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Mobile upgrade panel toggle
function toggleMobileUpgrades() {
    const upgradePanel = document.getElementById('upgradePanel');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        upgradePanel.classList.toggle('open');
    }
}

// Update mobile upgrade toggle visibility and scrap display
function updateMobileUpgradeToggle() {
    const upgradeToggle = document.getElementById('mobileUpgradeToggle');
    const mobileScrap = document.getElementById('mobile-scrap');
    const isMobile = window.innerWidth <= 768;
    
    if (upgradeToggle && mobileScrap) {
        // Update scrap display
        mobileScrap.textContent = gameState.scrap;
        
        // Only show during wave breaks on mobile
        if (isMobile && gameState.waveBreak) {
            upgradeToggle.classList.add('show');
        } else {
            upgradeToggle.classList.remove('show');
            // Close panel if it's open when hiding toggle
            if (isMobile) {
                document.getElementById('upgradePanel').classList.remove('open');
            }
        }
    }
}
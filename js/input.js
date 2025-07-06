// Input handling
let mouseX = 0;
let mouseY = 0;
let selectedLauncher = 0; // Default to left launcher for mobile

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

    // Click/tap to fire
    canvas.addEventListener('click', (e) => {
        if (!gameState.gameRunning) return;
        
        const rect = canvas.getBoundingClientRect();
        const targetX = (e.clientX - rect.left) * (canvas.width / canvas.offsetWidth);
        const targetY = (e.clientY - rect.top) * (canvas.height / canvas.offsetHeight);
        
        // Don't fire below ground level
        if (targetY >= 760) return;
        
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
                fireMissile(launcher, targetX, targetY);
            }
        }
    });

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
    
    if (!gameState.gameRunning) return;
    
    // Don't fire below ground level
    if (mouseY >= 760) return;
    
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
            // Update selected launcher for mobile UI
            selectedLauncher = launcherIndex;
            updateLauncherSelection();
            
            const launcher = launchers[launcherIndex];
            if (!destroyedLaunchers.includes(launcherIndex)) {
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

// Mobile launcher selection
function selectLauncher(index) {
    selectedLauncher = index;
    updateLauncherSelection();
}

function updateLauncherSelection() {
    // Update launcher button states
    for (let i = 0; i < 3; i++) {
        const btn = document.getElementById(`launcher-btn-${i}`);
        if (btn) {
            btn.classList.toggle('active', i === selectedLauncher);
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
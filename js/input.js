// Input handling
let mouseX = 0;
let mouseY = 0;

function initializeInput() {
    const canvas = document.getElementById('gameCanvas');
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('click', (e) => {
        // Click-to-fire disabled - use Q/W/E keys to fire missiles
        // This allows clicking to be used for targeting or other interactions
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
            if (launcher.missiles > 0 && Date.now() - launcher.lastFire > launcher.fireRate && 
                !destroyedLaunchers.includes(launcherIndex)) {
                fireMissile(launcher, mouseX, mouseY);
            }
        }
    });
}
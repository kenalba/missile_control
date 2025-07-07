// Mode Manager - Handles switching between Arcade and Command modes
const ModeManager = {
    currentMode: 'arcade',
    
    // Mode configurations
    modes: {
        arcade: {
            name: 'Arcade Mode',
            description: 'Classic Missile Command gameplay',
            initialCities: 6,
            initialLaunchers: 3,
            cityPositions: [270, 390, 510, 690, 810, 930],
            launcherPositions: [
                { x: 150, y: 770, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 },
                { x: 600, y: 770, missiles: 12, maxMissiles: 12, lastFire: 0, fireRate: 667 }, // Middle turret starts upgraded
                { x: 1050, y: 770, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 }
            ],
            initialUpgrades: [
                { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } },
                { speed: { level: 2, cost: 15 }, explosion: { level: 2, cost: 23 }, rate: { level: 2, cost: 30 }, capacity: { level: 2, cost: 38 }, autopilot: { level: 0, cost: 40 } }, // Middle turret starts upgraded
                { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } }
            ],
            initialEnemies: 6
        },
        command: {
            name: 'Command Mode',
            description: 'Strategic base building and expansion',
            initialCities: 2,
            initialLaunchers: 1,
            cityPositions: [400, 800],
            launcherPositions: [
                { x: 600, y: 770, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 }
            ],
            initialUpgrades: [
                { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } }
            ],
            initialEnemies: 3
        }
    },
    
    // Initialize a specific mode
    initializeMode(mode) {
        this.currentMode = mode;
        const config = this.modes[mode];
        
        if (!config) {
            console.error(`Unknown mode: ${mode}`);
            return false;
        }
        
        // Set game state mode
        gameState.currentMode = mode;
        
        // Initialize cities
        gameState.cities = config.initialCities;
        destroyedCities = [];
        cityUpgrades = new Array(config.initialCities).fill(0);
        cityPositions = [...config.cityPositions];
        
        // Initialize launchers
        destroyedLaunchers = [];
        launchers = config.launcherPositions.map(launcher => ({...launcher})); // Deep copy
        launcherUpgrades = config.initialUpgrades.map(upgrade => {
            // Deep copy upgrade structure
            const newUpgrade = {};
            for (const [key, value] of Object.entries(upgrade)) {
                newUpgrade[key] = {...value};
            }
            return newUpgrade;
        });
        
        // Initialize wave
        gameState.enemiesToSpawn = config.initialEnemies;
        gameState.planesToSpawn = 0;
        
        // Reset selected launcher for mobile
        selectedLauncher = 0;
        
        // Update UI
        this.updateUI();
        
        console.log(`${config.name} initialized: ${config.initialLaunchers} turret(s), ${config.initialCities} cities`);
        return true;
    },
    
    // Update UI based on current mode
    updateUI() {
        if (typeof updateLauncherSelection === 'function') {
            updateLauncherSelection();
        }
        if (typeof updateUpgradeUI === 'function') {
            updateUpgradeUI();
        }
    },
    
    // Get current mode configuration
    getCurrentConfig() {
        return this.modes[this.currentMode];
    },
    
    // Check if current mode supports a feature
    supportsFeature(feature) {
        const config = this.getCurrentConfig();
        switch (feature) {
            case 'multipleturrets':
                return config.initialLaunchers > 1;
            case 'expansion':
                return this.currentMode === 'command';
            case 'automation':
                return this.currentMode === 'command';
            default:
                return false;
        }
    },
    
    // Get mode-specific styling
    getModeStyles() {
        if (this.currentMode === 'command') {
            return {
                primaryColor: '#ff0',
                accentColor: '#f80',
                backgroundColor: '#220200'
            };
        } else {
            return {
                primaryColor: '#0f0',
                accentColor: '#0ff',
                backgroundColor: '#002200'
            };
        }
    }
};

// Export for use in other files
window.ModeManager = ModeManager;
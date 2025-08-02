// Mode Manager - Handles switching between Arcade and Command modes
import { gameState } from '@/systems/observableState';
import { destroyedCities, cityUpgrades, cityPositions } from '@/entities/cities';
import { cityData } from '@/core/cities';
import { launchers, destroyedLaunchers, resetLauncherTimestamps } from '@/entities/launchers';
import { launcherUpgrades } from '@/core/upgrades';
import { updateUpgradeUI } from '@/systems/ui';
import { handleModeChange } from '@/ui/sidebarManager';

interface ModeConfig {
    name: string;
    description: string;
    initialCities: number;
    initialLaunchers: number;
    cityPositions: number[];
    launcherPositions: Array<{
        x: number;
        y: number;
        missiles: number;
        maxMissiles: number;
        lastFire: number;
        fireRate: number;
    }>;
    initialUpgrades: Array<{
        speed: { level: number; cost: number };
        explosion: { level: number; cost: number };
        rate: { level: number; cost: number };
        capacity: { level: number; cost: number };
        autopilot: { level: number; cost: number };
    }>;
    initialEnemies: number;
    availableTurretPositions?: Array<{ x: number; y: number }>;
    availableCityPositions?: number[];
}

interface ModeStyles {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
}

export class ModeManager {
    currentMode: 'arcade' | 'command' = 'arcade';
    selectedLauncher = 0;

    modes: Record<'arcade' | 'command', ModeConfig> = {
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
            // Predefined positions where turrets can be built (max 3 total)
            availableTurretPositions: [
                { x: 150, y: 770 },  // Left position (same as Arcade mode)
                { x: 600, y: 770 },  // Center position (already occupied initially)
                { x: 1050, y: 770 }  // Right position (same as Arcade mode)
            ],
            // Predefined positions where cities can be built (evenly spaced between turret positions)
            availableCityPositions: [
                300,   // Between left turret (150) and center turret (600)
                400,   // Between center positions (starting city)
                500,   // Between center positions  
                700,   // Between center turret (600) and right turret (1050)
                800,   // Between center and right (starting city)
                900    // Between center turret (600) and right turret (1050)
            ],
            initialUpgrades: [
                { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } }
            ],
            initialEnemies: 3
        }
    };

    // Initialize a specific mode
    initializeMode(mode: 'arcade' | 'command'): boolean {
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
        destroyedCities.length = 0;
        cityUpgrades.length = 0;
        cityUpgrades.push(...new Array(config.initialCities).fill(0));
        
        // Update city positions array
        cityPositions.length = 0;
        cityPositions.push(...config.cityPositions);
        
        // Initialize city population upgrades (assuming this exists globally)
        const cityPopulationUpgrades = (window as any).cityPopulationUpgrades;
        if (cityPopulationUpgrades) {
            cityPopulationUpgrades.length = 0;
            cityPopulationUpgrades.push(...new Array(config.initialCities).fill(0));
        }
        
        // Initialize city productivity upgrades (assuming this exists globally)
        const cityProductivityUpgrades = (window as any).cityProductivityUpgrades;
        if (cityProductivityUpgrades) {
            cityProductivityUpgrades.scrap = new Array(config.initialCities).fill(0);
            cityProductivityUpgrades.science = new Array(config.initialCities).fill(0);
            cityProductivityUpgrades.ammo = new Array(config.initialCities).fill(0);
        }
        
        // Initialize launchers
        destroyedLaunchers.length = 0;
        launchers.length = 0;
        launchers.push(...config.launcherPositions.map(launcher => ({...launcher}))); // Deep copy
        
        // Reset launcher timestamps to work with game time system
        resetLauncherTimestamps();
        
        launcherUpgrades.length = 0;
        launcherUpgrades.push(...config.initialUpgrades.map(upgrade => {
            // Deep copy upgrade structure
            const newUpgrade: any = {};
            for (const [key, value] of Object.entries(upgrade)) {
                newUpgrade[key] = {...value};
            }
            return newUpgrade;
        }));
        
        // Initialize mode-specific gameplay
        if (mode === 'command') {
            this.initializeCommandMode(config);
        } else {
            this.initializeArcadeMode(config);
        }
        
        // Reset selected launcher for mobile
        this.selectedLauncher = 0;
        
        // Handle sidebar mode change BEFORE updating UI to prevent flicker
        handleModeChange(mode);
        
        // Update UI after sidebar state is set
        this.updateUI();
        
        console.log(`${config.name} initialized: ${config.initialLaunchers} turret(s), ${config.initialCities} cities`);
        return true;
    }

    private initializeCommandMode(config: ModeConfig): void {
        // Command Mode: Continuous gameplay
        gameState.enemiesToSpawn = 0; // No wave-based enemies
        gameState.planesToSpawn = 0;
        gameState.waveBreak = false; // No wave breaks
        
        // Initialize Command Mode state
        gameState.commandMode.gameTime = 0;
        gameState.commandMode.difficulty = 1;
        gameState.commandMode.lastResourceTick = 0;
        gameState.commandMode.lastEnemySpawn = 0;
        gameState.commandMode.selectedEntity = 0; // Start with first city selected
        gameState.commandMode.selectedEntityType = 'city';
        
        // Initialize city data for Command Mode - start with ammo only
        cityData.length = 0;
        cityData.push(...config.cityPositions.map(() => ({
            population: 100,
            maxPopulation: 100,
            productionMode: 'ammo' as 'scrap' | 'ammo' | 'science', // All cities start producing ammo
            baseProduction: 0.5, // Lower initial production - research upgrades increase this
            ammoStockpile: 0,
            maxAmmoStockpile: 5,
            maxTrucks: 1
        })));
        
        // Initialize science resource - starts at 0, must be unlocked
        gameState.science = 0;
        
        // Open Command Center by default in Command Mode
        setTimeout(() => {
            const expandSidebar = (window as any).expandSidebar;
            if (typeof expandSidebar === 'function') {
                expandSidebar();
            }
        }, 100); // Small delay to ensure DOM is ready
    }

    private initializeArcadeMode(config: ModeConfig): void {
        // Arcade Mode: Wave-based gameplay
        gameState.enemiesToSpawn = config.initialEnemies;
        gameState.planesToSpawn = 0;
        gameState.waveBreak = false;
        
        // Reset science for arcade mode
        gameState.science = 0;
    }
    
    // Update UI based on current mode
    updateUI(): void {
        const updateLauncherSelection = (window as any).updateLauncherSelection;
        if (typeof updateLauncherSelection === 'function') {
            updateLauncherSelection();
        }
        updateUpgradeUI();
    }
    
    // Get current mode configuration
    getCurrentConfig(): ModeConfig {
        return this.modes[this.currentMode];
    }
    
    // Check if current mode supports a feature
    supportsFeature(feature: string): boolean {
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
    }
    
    // Get mode-specific styling
    getModeStyles(): ModeStyles {
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
}

// Create and export singleton instance
export const modeManager = new ModeManager();

// Make available globally for legacy compatibility
(window as any).ModeManager = modeManager;
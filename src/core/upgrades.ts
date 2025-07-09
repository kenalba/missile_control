// Upgrade State Management
import type { LauncherUpgrades, GlobalUpgrades, UnlockedUpgradePaths } from '@/types/gameTypes';

// Upgrade levels and costs (per-launcher)
export let launcherUpgrades: LauncherUpgrades[] = [
    { 
        speed: { level: 1, cost: 10 }, 
        explosion: { level: 1, cost: 15 }, 
        rate: { level: 1, cost: 20 }, 
        capacity: { level: 1, cost: 25 }, 
        autopilot: { level: 0, cost: 40 } 
    },
    { 
        speed: { level: 2, cost: 15 }, 
        explosion: { level: 2, cost: 23 }, 
        rate: { level: 2, cost: 30 }, 
        capacity: { level: 2, cost: 38 }, 
        autopilot: { level: 0, cost: 40 } 
    }, // Middle turret starts upgraded
    { 
        speed: { level: 1, cost: 10 }, 
        explosion: { level: 1, cost: 15 }, 
        rate: { level: 1, cost: 20 }, 
        capacity: { level: 1, cost: 25 }, 
        autopilot: { level: 0, cost: 40 } 
    }
];

// Global upgrades
export let globalUpgrades: GlobalUpgrades = {
    cityShield: { level: 0, cost: 100 },
    missileHighlight: { level: 0, cost: 75 },
    cityScrapBonus: { level: 0, cost: 30 },
    scrapMultiplier: { level: 0, cost: 80 },
    salvage: { level: 0, cost: 60 },
    efficiency: { level: 0, cost: 90 },
    research: { level: 0, cost: 50 }, // Unlocks science production
    // Science-based unlock upgrades (unlocks advanced city improvements)
    civilianIndustry: { level: 0, cost: 10 }, // Unlocks specialized city production tech (science cost)
    populationTech: { level: 0, cost: 50 }, // Unlocks population improvements (science cost)
    arsenalTech: { level: 0, cost: 15 }, // Unlocks arsenal improvements (science cost)
    miningTech: { level: 0, cost: 15 }, // Unlocks scrap mining improvements (science cost)
    researchTech: { level: 0, cost: 15 }, // Unlocks research lab improvements (science cost)
    // City-based science upgrades (moved from global economic)
    ammoRecycling: { level: 0, cost: 30 }, // Converts excess ammo to scrap (science cost)
    truckFleet: { level: 0, cost: 20 } // +1 truck per city (science cost)
};

// Unlocked turret upgrade paths (spent science to unlock)
export let unlockedUpgradePaths: UnlockedUpgradePaths = {
    rate: true,      // Available from start
    speed: false,    // Requires science purchase
    explosion: false,
    capacity: false,
    autopilot: false
};

// Get upgrade multiplier for a specific launcher and upgrade type
export function getUpgradeMultiplier(launcherIndex: number, upgradeType: keyof LauncherUpgrades): number {
    if (launcherIndex < 0 || launcherIndex >= launcherUpgrades.length) {
        return 1.0;
    }
    
    const upgrade = launcherUpgrades[launcherIndex][upgradeType];
    const level = upgrade.level;
    
    switch (upgradeType) {
        case 'speed':
            return Math.pow(1.3, level - 1); // 1.3x per level
        case 'explosion':
            return Math.pow(1.4, level - 1); // 1.4x per level
        case 'rate':
            return Math.pow(1.5, level - 1); // 1.5x per level
        case 'capacity':
            return Math.pow(1.2, level - 1); // 1.2x per level
        case 'autopilot':
            return level > 0 ? 1.0 : 0.0; // Binary upgrade
        default:
            return 1.0;
    }
}

// Reset all upgrades to initial state
export function resetUpgrades(): void {
    launcherUpgrades = [
        { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } },
        { speed: { level: 2, cost: 15 }, explosion: { level: 2, cost: 23 }, rate: { level: 2, cost: 30 }, capacity: { level: 2, cost: 38 }, autopilot: { level: 0, cost: 40 } }, // Middle turret starts upgraded
        { speed: { level: 1, cost: 10 }, explosion: { level: 1, cost: 15 }, rate: { level: 1, cost: 20 }, capacity: { level: 1, cost: 25 }, autopilot: { level: 0, cost: 40 } }
    ];
    
    globalUpgrades = {
        cityShield: { level: 0, cost: 100 },
        missileHighlight: { level: 0, cost: 75 },
        cityScrapBonus: { level: 0, cost: 30 },
        scrapMultiplier: { level: 0, cost: 80 },
        salvage: { level: 0, cost: 60 },
        efficiency: { level: 0, cost: 90 },
        research: { level: 0, cost: 50 },
        civilianIndustry: { level: 0, cost: 35 },
        populationTech: { level: 0, cost: 25 },
        arsenalTech: { level: 0, cost: 15 },
        miningTech: { level: 0, cost: 10 },
        researchTech: { level: 0, cost: 30 },
        ammoRecycling: { level: 0, cost: 30 },
        truckFleet: { level: 0, cost: 20 }
    };
    
    unlockedUpgradePaths = {
        rate: true,      // Available from start
        speed: false,    // Requires science purchase
        explosion: false,
        capacity: false,
        autopilot: false
    };
}

// Purchase a launcher upgrade
export function purchaseLauncherUpgrade(launcherIndex: number, upgradeType: keyof LauncherUpgrades): boolean {
    if (launcherIndex < 0 || launcherIndex >= launcherUpgrades.length) {
        return false;
    }
    
    const upgrade = launcherUpgrades[launcherIndex][upgradeType];
    const actualCost = (window as any).getActualUpgradeCost ? 
        (window as any).getActualUpgradeCost(upgrade.cost) : upgrade.cost;
    
    // Check if path is unlocked (for Command Mode)
    if (!(window as any).unlockedUpgradePaths?.[upgradeType]) {
        console.warn(`Upgrade path ${upgradeType} is not unlocked`);
        return false;
    }
    
    // Check if can afford
    if (!(window as any).canAfford?.(actualCost)) {
        return false;
    }
    
    // Spend currency
    if (!(window as any).spendCurrency?.(actualCost)) {
        return false;
    }
    
    // Apply upgrade
    upgrade.level++;
    upgrade.cost = Math.floor(upgrade.cost * 1.5); // Increase cost for next level
    
    console.log(`Purchased ${upgradeType} upgrade for launcher ${launcherIndex} (level ${upgrade.level})`);
    return true;
}

// Purchase a global upgrade
export function purchaseGlobalUpgrade(upgradeType: keyof GlobalUpgrades): boolean {
    const upgrade = globalUpgrades[upgradeType];
    
    // Check if already owned
    if (upgrade.level > 0) {
        return false;
    }
    
    // Check if can afford
    if (!(window as any).canAfford?.(upgrade.cost)) {
        return false;
    }
    
    // Spend currency
    if (!(window as any).spendCurrency?.(upgrade.cost)) {
        return false;
    }
    
    // Apply upgrade
    upgrade.level = 1; // Global upgrades are typically one-time purchases
    
    console.log(`Purchased global upgrade: ${upgradeType}`);
    return true;
}

// Unlock an upgrade path with science
export function unlockUpgradePath(pathType: keyof UnlockedUpgradePaths, cost: number): boolean {
    // Check if already unlocked
    if (unlockedUpgradePaths[pathType]) {
        return false;
    }
    
    // Check if can afford with science
    if (!(window as any).canAfford?.(cost, 'science')) {
        return false;
    }
    
    // Spend science
    if (!(window as any).spendCurrency?.(cost, 'science')) {
        return false;
    }
    
    // Unlock path
    unlockedUpgradePaths[pathType] = true;
    
    console.log(`Unlocked upgrade path: ${pathType} for ${cost} science`);
    return true;
}

// Make globally available for legacy compatibility
(window as any).launcherUpgrades = launcherUpgrades;
(window as any).globalUpgrades = globalUpgrades;
(window as any).unlockedUpgradePaths = unlockedUpgradePaths;
(window as any).getUpgradeMultiplier = getUpgradeMultiplier;
(window as any).resetUpgrades = resetUpgrades;
(window as any).purchaseLauncherUpgrade = purchaseLauncherUpgrade;
(window as any).purchaseGlobalUpgrade = purchaseGlobalUpgrade;
(window as any).unlockUpgradePath = unlockUpgradePath;
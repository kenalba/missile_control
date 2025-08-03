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
    research: { level: 0, cost: 25 }, // Unlocks science production

    // Science-based unlock upgrades (unlocks advanced city improvements)
    populationTech: { level: 0, cost: 50 }, // Unlocks population improvements (science cost)

    // City-based science upgrades (moved from global economic)
    ammoRecycling: { level: 0, cost: 30 }, // Converts excess ammo to scrap (science cost)
    truckFleet: { level: 0, cost: 20 }, // +1 truck per city (science cost)
    ammoHotkey: { level: 0, cost: 20 }, // Enables 'A' key for emergency ammo purchase (science cost)

    // Progressive disclosure tech tree - Research Branches (Single-level unlocks)
    ammoResearch: { level: 0, cost: 20 }, // +50% ammo production + unlocks Turrets tab (science cost)
    scrapResearch: { level: 0, cost: 25 }, // Enables scrap production + 50% scrap production (science cost)
    scienceResearch: { level: 0, cost: 20 }, // +50% science production (science cost)
    populationResearch: { level: 0, cost: 25 }, // Max city size +25 (to 125) + unlocks residential zones (science cost)
    
    // Ammo Research Branch - Tiered Sub-Upgrades
    enhancedAmmoProduction: { level: 0, cost: 20 }, // Level 1-3: improves ammo factory efficiency (science cost)
    rapidProcurement: { level: 0, cost: 15 }, // 'A' key emergency ammo hotkey (unlocks after Enhanced Ammo) (science cost)
    advancedLogistics: { level: 0, cost: 30 }, // Truck improvements (unlocks after Rapid Procurement) (science cost)
    ammunitionStockpiles: { level: 0, cost: 35 }, // Storage upgrades (unlocks after Advanced Logistics) (science cost)
    
    // Scrap Research Branch - Tiered Sub-Upgrades
    enhancedScrapMining: { level: 0, cost: 20 }, // Level 1-3: improves mining efficiency (science cost)
    resourceEfficiency: { level: 0, cost: 25 }, // 15% city upgrade discount (unlocks after Enhanced Scrap) (science cost)
    salvageOperations: { level: 0, cost: 15 }, // Auto-convert excess ammo (unlocks after Resource Efficiency) (science cost)
    
    // Science Research Branch - Tiered Sub-Upgrades
    enhancedResearch: { level: 0, cost: 20 }, // Level 1-3: improves lab efficiency (science cost)
    viewTechTree: { level: 0, cost: 10 }, // Shows roadmap (unlocks after Enhanced Research) (science cost)
    researchAnalytics: { level: 0, cost: 25 }, // Upgrade statistics (unlocks after View Tech Tree) (science cost)
    
    // Population Research Branch - Tiered Sub-Upgrades
    residentialEfficiency: { level: 0, cost: 15 }, // Level 1-3: +1 pop bonus per residential zone level (science cost)
    urbanPlanning1: { level: 0, cost: 30 }, // Unlock 3rd city slot (unlocks after Residential Efficiency Level 2) (science cost)
    urbanPlanning2: { level: 0, cost: 40 }, // Unlock 4th city slot (unlocks after Urban Planning 1) (science cost)
    urbanPlanning3: { level: 0, cost: 50 }, // Unlock 5th city slot (unlocks after Urban Planning 2) (science cost)
    urbanPlanning4: { level: 0, cost: 60 }, // Unlock 6th city slot (unlocks after Urban Planning 3) (science cost)
    populationGrowth: { level: 0, cost: 20 }, // Growth rate upgrades (unlocks after Urban Planning 2) (science cost)
    civilDefense: { level: 0, cost: 25 } // Bunker construction (unlocks after Urban Planning 2) (science cost)
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
            return Math.pow(1.2, level - 1); // 1.2x per level
        case 'rate':
            return Math.pow(1.5, level - 1); // 1.5x per level
        case 'capacity':
            return Math.pow(1.5, level - 1); // 1.5x per level
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
        populationTech: { level: 0, cost: 25 },
        ammoRecycling: { level: 0, cost: 30 },
        truckFleet: { level: 0, cost: 20 },
        ammoHotkey: { level: 0, cost: 20 },
        // Progressive disclosure tech tree - Research Branches
        ammoResearch: { level: 0, cost: 20 },
        scrapResearch: { level: 0, cost: 25 },
        scienceResearch: { level: 0, cost: 20 },
        populationResearch: { level: 0, cost: 25 },
        // Ammo Research Branch
        enhancedAmmoProduction: { level: 0, cost: 20 },
        rapidProcurement: { level: 0, cost: 15 },
        advancedLogistics: { level: 0, cost: 30 },
        ammunitionStockpiles: { level: 0, cost: 35 },
        // Scrap Research Branch
        enhancedScrapMining: { level: 0, cost: 20 },
        resourceEfficiency: { level: 0, cost: 25 },
        salvageOperations: { level: 0, cost: 15 },
        // Science Research Branch
        enhancedResearch: { level: 0, cost: 20 },
        viewTechTree: { level: 0, cost: 10 },
        researchAnalytics: { level: 0, cost: 25 },
        // Population Research Branch
        residentialEfficiency: { level: 0, cost: 15 },
        urbanPlanning1: { level: 0, cost: 30 },
        urbanPlanning2: { level: 0, cost: 40 },
        urbanPlanning3: { level: 0, cost: 50 },
        urbanPlanning4: { level: 0, cost: 60 },
        populationGrowth: { level: 0, cost: 20 },
        civilDefense: { level: 0, cost: 25 }
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
    
    // Multi-level upgrades are now the tiered sub-upgrades
    const multiLevelUpgrades = ['enhancedAmmoProduction', 'enhancedScrapMining', 'enhancedResearch', 'residentialEfficiency'];
    const isMultiLevel = multiLevelUpgrades.includes(upgradeType as string);
    
    // Check if already at max level
    if (!isMultiLevel && upgrade.level > 0) {
        return false; // One-time upgrades can't be purchased again
    }
    
    if (isMultiLevel && upgrade.level >= 3) {
        return false; // Research branches max at level 3
    }
    
    // Determine currency type - science-based upgrades use science, others use scrap
    const scienceBasedUpgrades = [
        'populationTech',
        'ammoRecycling', 'truckFleet', 'ammoHotkey',
        // New tech tree upgrades - Research branches and sub-upgrades
        'ammoResearch', 'scrapResearch', 'scienceResearch', 'populationResearch',
        'enhancedAmmoProduction', 'rapidProcurement', 'advancedLogistics', 'ammunitionStockpiles',
        'enhancedScrapMining', 'resourceEfficiency', 'salvageOperations',
        'enhancedResearch', 'viewTechTree', 'researchAnalytics',
        'residentialEfficiency', 'urbanPlanning1', 'urbanPlanning2', 'urbanPlanning3', 'urbanPlanning4', 'populationGrowth', 'civilDefense'
    ];
    
    const currency: 'scrap' | 'science' = scienceBasedUpgrades.includes(upgradeType as string) ? 'science' : 'scrap';
    
    // Calculate actual cost for multi-level upgrades
    let actualCost = upgrade.cost;
    if (isMultiLevel && upgrade.level > 0) {
        // Each level costs 1.5x more than base cost
        actualCost = Math.floor(upgrade.cost * Math.pow(1.5, upgrade.level));
    }
    
    // Check if can afford
    if (!(window as any).canAfford?.(actualCost, currency)) {
        return false;
    }
    
    // Spend currency
    if (!(window as any).spendCurrency?.(actualCost, currency)) {
        return false;
    }
    
    // Apply upgrade
    if (isMultiLevel) {
        upgrade.level += 1; // Multi-level upgrades increment
    } else {
        upgrade.level = 1; // One-time upgrades set to 1
    }
    
    // Apply research effects to cities if this is a research branch upgrade
    if (['populationResearch', 'ammoResearch', 'scrapResearch', 'scienceResearch', 'residentialEfficiency'].includes(upgradeType as string)) {
        const applyResearchUpgrades = (window as any).applyResearchUpgradesToCities;
        if (typeof applyResearchUpgrades === 'function') {
            applyResearchUpgrades();
        }
    }
    
    console.log(`Purchased global upgrade: ${upgradeType} level ${upgrade.level} for ${actualCost} ${currency}`);
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

// Calculate maximum allowed cities based on Urban Planning research
export function getMaxAllowedCities(): number {
    let maxCities = 2; // Base: start with 2 cities
    
    if (globalUpgrades.urbanPlanning1?.level > 0) maxCities = 3;
    if (globalUpgrades.urbanPlanning2?.level > 0) maxCities = 4;
    if (globalUpgrades.urbanPlanning3?.level > 0) maxCities = 5;
    if (globalUpgrades.urbanPlanning4?.level > 0) maxCities = 6;
    
    return maxCities;
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
(window as any).getMaxAllowedCities = getMaxAllowedCities;
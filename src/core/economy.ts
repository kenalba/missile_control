// Economy System - Currency and Purchasing Logic
import type { GlobalUpgrades } from '@/types/gameTypes';

// Helper function to apply scrap multiplier
export function applyScrapBonus(baseScrap: number): number {
    let multiplier = 1.0;
    
    // Get global upgrades from window (legacy compatibility)
    const globalUpgrades = (window as any).globalUpgrades as GlobalUpgrades;
    
    if (globalUpgrades?.scrapMultiplier?.level > 0) {
        multiplier += 0.25; // 25% bonus
    }
    
    return Math.floor(baseScrap * multiplier);
}

// Helper function to apply efficiency discount to launcher upgrade costs
export function getActualUpgradeCost(baseCost: number): number {
    // Get global upgrades from window (legacy compatibility)
    const globalUpgrades = (window as any).globalUpgrades as GlobalUpgrades;
    
    if (globalUpgrades?.efficiency?.level > 0) {
        return Math.floor(baseCost * 0.85); // 15% discount
    }
    
    return baseCost;
}

// Award scrap for destroying enemies
export function awardScrap(amount: number, source: string = 'enemy'): void {
    const gameState = (window as any).gameState;
    if (!gameState) return;
    
    const bonusScrap = applyScrapBonus(amount);
    gameState.scrap += bonusScrap;
    gameState.achievements.totalScrapEarned += bonusScrap;
    
    console.log(`Awarded ${bonusScrap} scrap from ${source}`);
}

// Award science (Command Mode)
export function awardScience(amount: number): void {
    const gameState = (window as any).gameState;
    if (!gameState) return;
    
    gameState.science += amount;
    console.log(`Awarded ${amount} science`);
}

// Check if player can afford a purchase
export function canAfford(cost: number, currency: 'scrap' | 'science' = 'scrap'): boolean {
    const gameState = (window as any).gameState;
    if (!gameState) return false;
    
    if (currency === 'scrap') {
        return gameState.scrap >= cost;
    } else if (currency === 'science') {
        return gameState.science >= cost;
    }
    
    return false;
}

// Spend currency
export function spendCurrency(cost: number, currency: 'scrap' | 'science' = 'scrap'): boolean {
    const gameState = (window as any).gameState;
    if (!gameState) return false;
    
    if (!canAfford(cost, currency)) {
        return false;
    }
    
    if (currency === 'scrap') {
        gameState.scrap -= cost;
    } else if (currency === 'science') {
        gameState.science -= cost;
    }
    
    return true;
}

// Emergency ammo purchase
export function emergencyAmmoPurchase(): boolean {
    const cost = 3;
    if (!canAfford(cost)) {
        return false;
    }
    
    // Find first available launcher with less than max ammo
    const launchers = (window as any).launchers;
    if (!launchers) return false;
    
    for (let i = 0; i < launchers.length; i++) {
        if (launchers[i].missiles < launchers[i].maxMissiles) {
            if (spendCurrency(cost)) {
                launchers[i].missiles = Math.min(launchers[i].missiles + 1, launchers[i].maxMissiles);
                console.log(`Emergency ammo purchased for launcher ${i}`);
                return true;
            }
            break;
        }
    }
    
    return false;
}

// Calculate total wealth (for achievements/statistics)
export function getTotalWealth(): { scrap: number; science: number; total: number } {
    const gameState = (window as any).gameState;
    if (!gameState) return { scrap: 0, science: 0, total: 0 };
    
    return {
        scrap: gameState.scrap,
        science: gameState.science,
        total: gameState.scrap + gameState.science
    };
}

// Make globally available for legacy compatibility
(window as any).applyScrapBonus = applyScrapBonus;
(window as any).getActualUpgradeCost = getActualUpgradeCost;
(window as any).awardScrap = awardScrap;
(window as any).awardScience = awardScience;
(window as any).canAfford = canAfford;
(window as any).spendCurrency = spendCurrency;
(window as any).emergencyAmmoPurchase = emergencyAmmoPurchase;
(window as any).getTotalWealth = getTotalWealth;
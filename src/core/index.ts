// Core System Exports
// This file serves as the main entry point for all core game systems

// Import and initialize all core systems
import './gameState';
import './economy';
import './upgrades';
import './achievements';
import './cities';
import './ui';

// Re-export key functions for external use
export { gameState, addScreenShake, updateScreenShake, continueGame, resetGameState, restartGame } from './gameState';
export { applyScrapBonus, getActualUpgradeCost, awardScrap, awardScience, canAfford, spendCurrency, emergencyAmmoPurchase, getTotalWealth } from './economy';
export { launcherUpgrades, globalUpgrades, unlockedUpgradePaths, getUpgradeMultiplier, resetUpgrades, purchaseLauncherUpgrade, purchaseGlobalUpgrade, unlockUpgradePath } from './upgrades';
export { createCelebrationEffect, createFireworks, checkWaveMilestones, checkAchievements, awardAchievement, resetAchievements, getAchievementStats } from './achievements';
export { cityData, calculateCityProductionRate, generateCityResources, updateCityPopulation, setCityProductionMode, upgradeCityPopulation, upgradeCityProductivity, repairCity, resetCityData } from './cities';
export { updateUI, updateHighScoresDisplay } from './ui';

console.log('🎯 Core game systems loaded successfully');
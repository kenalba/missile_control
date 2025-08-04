// Reusable UI Widgets for Upgrade System
import { gameState } from '@/systems/observableState';
import { globalUpgrades } from '@/core/upgrades';
import { COLORS } from '@/ui/uiUtils';
import type { ResearchUpgradeConfig } from './types';

// Utility function to get actual upgrade cost after efficiency discount
// Import centralized cost calculation
import { getActualUpgradeCost } from '@/core/economy';

// Create FTL-style research upgrade widget
export function createResearchUpgradeWidget(config: ResearchUpgradeConfig): string {
  const { id, name, icon, description, maxLevel, baseCost, costMultiplier = 1.5, color } = config;
  const upgradeData = globalUpgrades[id as keyof typeof globalUpgrades];
  const currentLevel = upgradeData?.level || 0;
  
  // Don't show if already at max level
  if (currentLevel >= maxLevel) return '';
  
  const nextLevel = currentLevel + 1;
  const cost = Math.floor(baseCost * Math.pow(costMultiplier, currentLevel));
  const canAfford = gameState.science >= cost;
  
  // Calculate tier and visual properties
  let tierColor: string, tierName: string;
  
  if (nextLevel <= 1) {
    tierColor = `rgb(${color})`; tierName = 'BASIC';
  } else if (nextLevel <= 3) {
    tierColor = '#0f0'; tierName = 'ADVANCED';
  } else if (nextLevel <= 5) {
    tierColor = '#ff0'; tierName = 'EXPERT';
  } else {
    tierColor = '#f80'; tierName = 'MASTER';
  }
  
  // Progress bar showing current level
  const progressBars = [];
  for (let i = 1; i <= Math.min(maxLevel, 5); i++) {
    const isFilled = i <= currentLevel;
    const barColor = isFilled ? tierColor : '#333';
    progressBars.push(`<div style="flex: 1; background: ${barColor}; border-radius: 1px; min-width: 3px; height: 8px;"></div>`);
  }
  
  return `
    <div style="border: 1px solid ${tierColor}; border-radius: 3px; padding: 8px; background: rgba(${color}, 0.05); margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span style="color: ${tierColor}; font-weight: bold; font-size: 12px;">
                ${icon} ${name.toUpperCase()}
            </span>
            <span style="color: #aaa; font-size: 10px;">LV ${currentLevel}/${maxLevel} ${tierName}</span>
        </div>
        
        <!-- Progress bar showing current level -->
        <div style="display: flex; gap: 1px; margin-bottom: 5px;">
            ${progressBars.join('')}
        </div>
        
        <div style="font-size: 10px; color: #aaa; margin-bottom: 5px;">
            ${description}
        </div>
        
        <!-- Upgrade button -->
        <button data-action="purchase-global" 
                data-action-data="${id}"
                style="width: 100%; padding: 4px 8px; background: ${canAfford ? `rgba(${color}, 0.2)` : 'rgba(102, 102, 102, 0.2)'}; 
                       border: 1px solid ${canAfford ? tierColor : '#666'}; color: ${canAfford ? tierColor : '#666'}; 
                       border-radius: 2px; font-size: 11px; cursor: ${canAfford ? 'pointer' : 'default'};"
                ${canAfford ? '' : 'disabled'}>
            ${cost} 🧪
        </button>
    </div>
  `;
}

// Create FTL-style turret upgrade widget
export function createTurretUpgradeWidget(upgradeType: any, turretUpgrades: any, selectedTurret: number): string {
  const upgrade = turretUpgrades[upgradeType.key];
  const scrapCost = getActualUpgradeCost(upgrade.cost);
  const canAfford = gameState.scrap >= scrapCost;
  const currentLevel = upgrade.level;
  
  // Calculate tier and visual properties based on level
  let tier: number, tierColor: string, tierName: string, barsInTier: number, levelInTier: number;
  
  if (currentLevel <= 5) {
    tier = 1; tierColor = '#0ff'; tierName = 'BASIC'; barsInTier = 5; levelInTier = currentLevel;
  } else if (currentLevel <= 10) {
    tier = 2; tierColor = '#0f0'; tierName = 'ADVANCED'; barsInTier = 5; levelInTier = currentLevel - 5;
  } else if (currentLevel <= 25) {
    tier = 3; tierColor = '#ff0'; tierName = 'EXPERT'; barsInTier = 15; levelInTier = currentLevel - 10;
  } else if (currentLevel <= 50) {
    tier = 4; tierColor = '#f80'; tierName = 'MASTER'; barsInTier = 25; levelInTier = currentLevel - 25;
  } else {
    tier = 5; tierColor = '#f0f'; tierName = 'LEGENDARY'; barsInTier = 50; levelInTier = currentLevel - 50;
  }
  
  // Progress bars
  const progressBars = [];
  const actualBars = Math.min(barsInTier, tier <= 2 ? 5 : tier === 3 ? 10 : tier === 4 ? 15 : 20); // Visual limit
  for (let i = 1; i <= actualBars; i++) {
    const isFilled = i <= levelInTier;
    const color = isFilled ? tierColor : '#333';
    progressBars.push(`<div style="flex: 1; background: ${color}; border-radius: 1px; min-width: 2px;"></div>`);
  }
  
  // FTL-style color mapping
  const tierRgbColors = {
    1: '0, 255, 255',
    2: '0, 255, 0', 
    3: '255, 255, 0',
    4: '255, 136, 0',
    5: '255, 0, 255'
  };
  
  return `
    <div style="border: 1px solid ${tierColor}; border-radius: 3px; padding: 8px; background: rgba(${tierRgbColors[tier as keyof typeof tierRgbColors]}, 0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span style="color: ${tierColor}; font-weight: bold; font-size: 12px;">
                ${upgradeType.icon} ${upgradeType.name.toUpperCase()}
            </span>
            <span style="color: #aaa; font-size: 10px;">LV ${currentLevel} ${tierName}</span>
        </div>
        
        <!-- Progress bar showing current tier progress -->
        <div style="display: flex; gap: 1px; margin-bottom: 5px; height: 8px;">
            ${progressBars.join('')}
        </div>
        
        <!-- Upgrade button -->
        <button data-action="upgrade-turret" 
                data-action-data="${upgradeType.key},${selectedTurret}"
                style="width: 100%; padding: 4px 8px; background: ${canAfford ? 'rgba(0, 255, 255, 0.2)' : 'rgba(102, 102, 102, 0.2)'}; 
                       border: 1px solid ${canAfford ? '#0ff' : '#666'}; color: ${canAfford ? '#0ff' : '#666'}; 
                       border-radius: 2px; font-size: 11px; cursor: ${canAfford ? 'pointer' : 'default'};"
                ${canAfford ? '' : 'disabled'}>
            ${scrapCost} 💰
        </button>
    </div>
  `;
}

// Create FTL-style city productivity upgrade widget
export function createCityProductivityWidget(cityIndex: number, productionType: 'scrap' | 'science' | 'ammo'): string {
  const cityProductivityUpgrades = (window as any).cityProductivityUpgrades;
  const getCityProductivityUpgradeCost = (window as any).getCityProductivityUpgradeCost;
  if (!cityProductivityUpgrades || !getCityProductivityUpgradeCost) return '';
  
  const currentLevel = cityProductivityUpgrades[productionType][cityIndex];
  const scrapCost = getCityProductivityUpgradeCost(cityIndex, productionType);
  const canAfford = gameState.scrap >= scrapCost;
  
  // Calculate tier and visual properties based on level
  let tierColor: string, tierName: string, barsInTier: number, levelInTier: number;
  
  if (currentLevel <= 3) {
    tierColor = '#0ff'; tierName = 'BASIC'; barsInTier = 3; levelInTier = currentLevel;
  } else if (currentLevel <= 6) {
    tierColor = '#0f0'; tierName = 'ADVANCED'; barsInTier = 3; levelInTier = currentLevel - 3;
  } else if (currentLevel <= 10) {
    tierColor = '#ff0'; tierName = 'EXPERT'; barsInTier = 4; levelInTier = currentLevel - 6;
  } else {
    tierColor = '#f80'; tierName = 'MASTER'; barsInTier = 10; levelInTier = currentLevel - 10;
  }
  
  // Progress bars
  const progressBars = [];
  const actualBars = Math.min(barsInTier, 5); // Visual limit for clean display
  for (let i = 1; i <= actualBars; i++) {
    const isFilled = i <= levelInTier;
    const color = isFilled ? tierColor : '#333';
    progressBars.push(`<div style="flex: 1; background: ${color}; border-radius: 1px; min-width: 2px; height: 8px;"></div>`);
  }
  
  // Mode-specific styling with flavor
  const modeIcons = { scrap: '⛏️', science: '🧪', ammo: '🏭' };
  const modeNames = { 
    scrap: 'Scrap Mine', 
    science: 'Science Lab', 
    ammo: 'Ammo Factory' 
  };
  const modeDescriptions = {
    scrap: 'Deep excavation operations extracting critical materials from the battlefield',
    science: 'Advanced research laboratories developing military technology',
    ammo: 'Automated ammunition production facilities for rapid resupply'
  };
  const modeColors = { 
    scrap: COLORS.scrap,     // Gold
    science: COLORS.science, // Blue  
    ammo: COLORS.ammo        // Green
  };
  const modeBorderColors = {
    scrap: `rgb(${COLORS.scrap})`,        // Gold border
    science: `rgb(${COLORS.science})`,    // Blue border
    ammo: `rgb(${COLORS.ammo})`           // Green border (consistent with ammo color scheme)
  };
  
  const currentEfficiency = 100 + (currentLevel * 50); // Show total efficiency %
  const nextEfficiency = 100 + ((currentLevel + 1) * 50);
  
  return `
    <div style="border: 1px solid ${modeBorderColors[productionType]}; border-radius: 3px; padding: 8px; background: rgba(${modeColors[productionType]}, 0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span style="color: ${modeBorderColors[productionType]}; font-weight: bold; font-size: 12px;">
                ${modeIcons[productionType]} ${modeNames[productionType].toUpperCase()}
            </span>
            <span style="color: #aaa; font-size: 10px;">LV ${currentLevel} ${tierName}</span>
        </div>
        
        <!-- Progress bar showing current tier progress -->
        <div style="display: flex; gap: 1px; margin-bottom: 5px;">
            ${progressBars.join('')}
        </div>
        
        <!-- Facility description -->
        <div style="font-size: 9px; color: #999; margin-bottom: 4px; line-height: 1.2;">
            ${modeDescriptions[productionType]}
        </div>
        
        <!-- Efficiency info -->
        <div style="font-size: 10px; color: #aaa; margin-bottom: 5px;">
            ${currentEfficiency}% → ${nextEfficiency}% efficiency
        </div>
        
        <!-- Upgrade button -->
        <button data-action="upgrade-city-productivity" 
                data-action-data="${cityIndex},${productionType}"
                style="width: 100%; padding: 4px 8px; background: ${canAfford ? `rgba(${modeColors[productionType]}, 0.2)` : 'rgba(102, 102, 102, 0.2)'}; 
                       border: 1px solid ${canAfford ? modeBorderColors[productionType] : '#666'}; color: ${canAfford ? modeBorderColors[productionType] : '#666'}; 
                       border-radius: 2px; font-size: 11px; cursor: ${canAfford ? 'pointer' : 'default'};"
                ${canAfford ? '' : 'disabled'}>
            ${scrapCost} 💰
        </button>
    </div>
  `;
}
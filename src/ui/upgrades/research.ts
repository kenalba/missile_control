// Research Branch Logic and Data
import { gameState } from '@/systems/observableState';
import { COLORS } from '@/ui/uiUtils';
import { createCompactUpgradeButton } from '@/ui/uiUtils';
import { createResearchUpgradeWidget } from './widgets';
import type { ResearchBranch, BranchUpgrade } from './types';

// Selected research branch state
let selectedResearchBranch: string | null = null;

// Set selected research branch
export function selectResearchBranch(branchId: string): void {
  selectedResearchBranch = branchId;
  // Update the science tab content
  (window as any).updateSidebarContent?.(true); // Force immediate update
}

// Research branches configuration
export const researchBranches: ResearchBranch[] = [
  { 
    id: 'ammoResearch', 
    name: 'Ammo',
    icon: '🎯',
    description: '+50% ammo production + unlocks Turrets tab. Single unlock enables ammo research tree.',
    maxLevel: 1,
    baseCost: 20,
    color: COLORS.ammoTree
  },
  { 
    id: 'scrapResearch', 
    name: 'Scrap',
    icon: '💰', 
    description: 'Enables scrap production + 50% scrap production. Single unlock enables scrap research tree.',
    maxLevel: 1,
    baseCost: 25,
    color: COLORS.scrapTree
  },
  { 
    id: 'scienceResearch', 
    name: 'Science',
    icon: '🧪',
    description: '+50% science production. Single unlock enables science research tree.',
    maxLevel: 1,
    baseCost: 20,
    color: COLORS.scienceTree
  }
  // Population research temporarily disabled - will be implemented in future update
  /*
  { 
    id: 'populationResearch', 
    name: 'Population',
    icon: '🏘️',
    description: 'Max city size +25 (to 125) + unlocks residential zones. Single unlock enables population research tree.',
    maxLevel: 1,
    baseCost: 25,
    color: COLORS.populationTree
  }
  */
];

// Branch upgrades configuration
export const branchUpgrades: Record<string, BranchUpgrade[]> = {
  ammoResearch: [
    { 
      id: 'enhancedAmmoProduction', 
      name: 'Enhanced Ammo Production', 
      description: 'Level 1-3: Improves ammo factory efficiency. Available immediately.',
      isMultiLevel: true,
      maxLevel: 3,
      prerequisite: undefined
    },
    { 
      id: 'rapidProcurement', 
      name: 'Rapid Procurement', 
      description: 'Enable \'A\' key hotkey for emergency ammo purchases. Unlocks after Enhanced Ammo Production.',
      isMultiLevel: false,
      prerequisite: 'enhancedAmmoProduction'
    },
    { 
      id: 'truckCapacity', 
      name: 'Truck Capacity', 
      description: 'Level 1-3: Each level increases truck capacity by +1 ammo. Unlocks after Rapid Procurement.',
      isMultiLevel: true,
      maxLevel: 3,
      prerequisite: 'rapidProcurement'
    },
    { 
      id: 'ammunitionStockpiles', 
      name: 'Ammunition Stockpiles', 
      description: 'Unlock per-city ammo storage capacity upgrades. Unlocks after Truck Capacity.',
      isMultiLevel: false,
      prerequisite: 'truckCapacity'
    }
  ],
  scrapResearch: [
    { 
      id: 'enhancedScrapMining', 
      name: 'Enhanced Scrap Mining', 
      description: 'Level 1-3: Improves scrap mining efficiency. Available immediately.',
      isMultiLevel: true,
      maxLevel: 3,
      prerequisite: undefined
    },
    { 
      id: 'resourceEfficiency', 
      name: 'Resource Efficiency', 
      description: '15% discount on all city upgrade costs. Unlocks after Enhanced Scrap Mining.',
      isMultiLevel: false,
      prerequisite: 'enhancedScrapMining'
    },
    { 
      id: 'salvageOperations', 
      name: 'Salvage Operations', 
      description: 'Automatically convert excess ammo to scrap materials. Unlocks after Resource Efficiency.',
      isMultiLevel: false,
      prerequisite: 'resourceEfficiency'
    }
  ],
  scienceResearch: [
    { 
      id: 'enhancedResearch', 
      name: 'Enhanced Research', 
      description: 'Level 1-3: Improves research lab efficiency. Available immediately.',
      isMultiLevel: true,
      maxLevel: 3,
      prerequisite: undefined
    },
    { 
      id: 'viewTechTree', 
      name: 'Research Roadmap', 
      description: 'View detailed technology roadmap and upgrade paths. Unlocks after Enhanced Research.',
      isMultiLevel: false,
      prerequisite: 'enhancedResearch'
    },
    { 
      id: 'researchAnalytics', 
      name: 'Research Analytics', 
      description: 'View detailed upgrade statistics and efficiency metrics. Unlocks after Research Roadmap.',
      isMultiLevel: false,
      prerequisite: 'viewTechTree'
    }
  ],
  populationResearch: [
    { 
      id: 'residentialEfficiency', 
      name: 'Residential Efficiency', 
      description: 'Level 1-3: +1 population bonus per residential zone level. Available immediately.',
      isMultiLevel: true,
      maxLevel: 3,
      prerequisite: undefined
    },
    { 
      id: 'urbanPlanning1', 
      name: 'Urban Planning I', 
      description: 'Unlock 3rd city construction slot. Unlocks after Residential Efficiency Level 2.',
      isMultiLevel: false,
      prerequisite: 'residentialEfficiency'
    },
    { 
      id: 'urbanPlanning2', 
      name: 'Urban Planning II', 
      description: 'Unlock 4th city construction slot. Unlocks after Urban Planning I.',
      isMultiLevel: false,
      prerequisite: 'urbanPlanning1'
    },
    { 
      id: 'urbanPlanning3', 
      name: 'Urban Planning III', 
      description: 'Unlock 5th city construction slot. Unlocks after Urban Planning II.',
      isMultiLevel: false,
      prerequisite: 'urbanPlanning2'
    },
    { 
      id: 'urbanPlanning4', 
      name: 'Urban Planning IV', 
      description: 'Unlock 6th city construction slot. Unlocks after Urban Planning III.',
      isMultiLevel: false,
      prerequisite: 'urbanPlanning3'
    },
    { 
      id: 'populationGrowth', 
      name: 'Population Growth', 
      description: 'Increase population growth rate across all cities. Unlocks after Urban Planning II.',
      isMultiLevel: false,
      prerequisite: 'urbanPlanning2'
    },
    { 
      id: 'civilDefense', 
      name: 'Civil Defense', 
      description: 'Unlock bunker construction for missile protection. Unlocks after Urban Planning II.',
      isMultiLevel: false,
      prerequisite: 'urbanPlanning2'
    }
  ]
};

// Render upgrades for a specific research branch
export function renderBranchUpgrades(branchId: string, windowGlobalUpgrades: any): string {
  let html = '';
  
  const upgrades = branchUpgrades[branchId] || [];
  
  upgrades.forEach(upgrade => {
    const upgradeData = windowGlobalUpgrades[upgrade.id];
    const currentLevel = upgradeData?.level || 0;
    
    // Check prerequisite
    let prerequisiteMet = true;
    if (upgrade.prerequisite) {
      const prereqData = windowGlobalUpgrades[upgrade.prerequisite];
      prerequisiteMet = prereqData && prereqData.level > 0;
      
      // Special case: residentialEfficiency level 2 requirement
      if (upgrade.prerequisite === 'residentialEfficiency' && upgrade.id === 'urbanPlanning1') {
        prerequisiteMet = prereqData && prereqData.level >= 2;
      }
    }
    
    if (!prerequisiteMet) return; // Don't show if prerequisite not met
    
    // Calculate cost
    let cost = upgradeData ? upgradeData.cost : 20;
    const canAfford = gameState.science >= cost;
    let displayName = upgrade.name;
    
    // Add level indicator for multi-level upgrades
    if (upgrade.isMultiLevel) {
      displayName += ` (${currentLevel + 1}/${upgrade.maxLevel})`;
    }
    
    if (upgrade.isMultiLevel) {
      html += createResearchUpgradeWidget({
        id: upgrade.id,
        name: upgrade.name,
        description: upgrade.description,
        maxLevel: upgrade.maxLevel || 3,
        baseCost: upgradeData?.cost || 20,
        icon: branchId === 'ammoResearch' ? '📦' : branchId === 'scrapResearch' ? '⚒️' : branchId === 'scienceResearch' ? '🧪' : '🏠',
        color: branchId === 'ammoResearch' ? COLORS.ammoTree : branchId === 'scrapResearch' ? COLORS.scrapTree : branchId === 'scienceResearch' ? COLORS.scienceTree : COLORS.populationTree
      });
    } else {
      html += createCompactUpgradeButton({
        name: displayName,
        description: upgrade.description,
        cost: cost,
        canAfford: canAfford && currentLevel === 0,
        isOwned: currentLevel > 0,
        color: branchId === 'ammoResearch' ? COLORS.ammoTree : branchId === 'scrapResearch' ? COLORS.scrapTree : branchId === 'scienceResearch' ? COLORS.scienceTree : COLORS.populationTree,
        currencyIcon: '🧪',
        action: 'purchase-global',
        actionData: upgrade.id
      });
    }
  });
  
  return html;
}

// Get selected branch getter
export function getSelectedResearchBranch(): string | null {
  return selectedResearchBranch;
}

// Set selected branch setter (for external use)
export function setSelectedResearchBranch(branchId: string | null): void {
  selectedResearchBranch = branchId;
}

// Make globally available for compatibility
(window as any).selectResearchBranch = selectResearchBranch;
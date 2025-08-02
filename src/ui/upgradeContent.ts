// Upgrade Content Generation for floating panels
import { gameState } from '@/systems/observableState';
import { launchers } from '@/entities/launchers';
import { cityData } from '@/core/cities';
import { destroyedCities, cityUpgrades, cityPopulationUpgrades, cityBunkerUpgrades, cityProductivityUpgrades } from '@/entities/cities';
import { launcherUpgrades, globalUpgrades, unlockedUpgradePaths } from '@/core/upgrades';
import { createSectionHeader, createCompactUpgradeButton, COLORS } from '@/ui/uiUtils';

// Utility function to get actual upgrade cost after efficiency discount
function getActualUpgradeCost(baseCost: number): number {
  const efficiencyDiscount = globalUpgrades.efficiency?.level > 0 ? 0.85 : 1.0;
  return Math.floor(baseCost * efficiencyDiscount);
}

// Calculate city production rate
function calculateCityProductionRate(cityIndex: number): string {
  if (cityIndex < 0 || cityIndex >= cityData.length) return '0';
  
  const city = cityData[cityIndex];
  const baseRate = city.baseProduction || 1;
  const populationMultiplier = city.population / 100; // Population affects production
  const efficiency = cityProductivityUpgrades[city.productionMode]?.[cityIndex] || 0;
  const efficiencyMultiplier = 1 + (efficiency * 0.25); // 25% per level
  
  const rate = baseRate * populationMultiplier * efficiencyMultiplier;
  return rate.toFixed(1);
}

// Global upgrades tab content
export function getGlobalUpgradesHTML(): string {
  let html = `
    <div>
  `;
  
  // Scientific Research - Only show Unlock Science
  const researchUnlocked = globalUpgrades.research && globalUpgrades.research.level > 0;
  const researchCost = globalUpgrades.research.cost;
  const canAffordResearch = gameState.scrap >= researchCost;
  
  if (!researchUnlocked) {
    html += `
      <div style="margin-bottom: 15px;">
          ${createSectionHeader('Scientific', `rgb(${COLORS.scienceBlue})`)}
          <div class="compact-grid-1">
    `;
    
    html += createCompactUpgradeButton({
      name: 'Unlock Science',
      description: 'Enable science production in cities. Required for advanced research.',
      cost: researchCost,
      canAfford: canAffordResearch,
      color: COLORS.scienceBlue,
      action: 'purchase-global',
      actionData: 'research'
    });
    
    html += '</div></div>';
  }
  
  // Show Civilian Industry if science is unlocked
  if (researchUnlocked) {
    const civilianIndustryUnlocked = globalUpgrades.civilianIndustry?.level > 0;
    
    if (!civilianIndustryUnlocked) {
      html += `
        <div style="margin-bottom: 15px;">
            ${createSectionHeader('Scientific', `rgb(${COLORS.scienceBlue})`)}
            <div class="compact-grid-1">
      `;
      
      const civilianIndustryCost = globalUpgrades.civilianIndustry?.cost || 10;
      const canAffordCivilianIndustry = gameState.science >= civilianIndustryCost;
      
      html += createCompactUpgradeButton({
        name: 'Civilian Industry',
        description: 'Unlock specialized production facilities for cities. Required for advanced city improvements.',
        cost: civilianIndustryCost,
        canAfford: canAffordCivilianIndustry,
        color: COLORS.scienceBlue,
        action: 'purchase-global',
        actionData: 'civilianIndustry',
        currencyIcon: '🔬'
      });
      
      html += '</div></div>';
    }
  }
  
  // Economic Upgrades - Compact 3-column grid
  html += `
    <div style="margin-bottom: 15px;">
        ${createSectionHeader('Economic', '#0f0')}
        <div class="compact-grid-3">
  `;
  
  const economicUpgrades = [
    { id: 'scrapMultiplier', name: 'Resource Boost', description: '25% bonus materials from all sources. Wartime efficiency protocols.' },
    { id: 'salvage', name: 'Wreckage Ops', description: 'Extra 3 scrap when destroying enemy aircraft. Battlefield salvage teams.' },
    { id: 'efficiency', name: 'Arms Discount', description: '15% discount on all turret upgrades. Military procurement contracts.' }
  ];
  
  economicUpgrades.forEach(upgrade => {
    const upgradeData = globalUpgrades[upgrade.id];
    const isOwned = upgradeData && upgradeData.level > 0;
    
    // Hide one-time upgrades that are already owned
    if (isOwned) return;
    
    const cost = upgradeData ? upgradeData.cost : 50;
    const canAfford = gameState.scrap >= cost;
    
    html += createCompactUpgradeButton({
      name: upgrade.name,
      description: upgrade.description,
      cost: cost,
      isOwned: isOwned,
      canAfford: canAfford,
      color: COLORS.green,
      action: 'purchase-global',
      actionData: upgrade.id
    });
  });
  
  html += '</div></div>';
  
  
  // Combat Upgrades - Single row
  html += `
    <div>
        ${createSectionHeader('Tactical', '#f80')}
        <div class="compact-grid-2">
  `;
  
  const combatUpgrades = [
    { id: 'missileHighlight', name: 'RADAR Warning', description: 'Highlight dangerous enemy missiles with red glow. Early warning system.' }
  ];
  
  combatUpgrades.forEach(upgrade => {
    const upgradeData = globalUpgrades[upgrade.id];
    const isOwned = upgradeData && upgradeData.level > 0;
    
    // Hide one-time upgrades that are already owned
    if (isOwned) return;
    
    const cost = upgradeData ? upgradeData.cost : 75;
    const canAfford = gameState.scrap >= cost;
    
    html += createCompactUpgradeButton({
      name: upgrade.name,
      description: upgrade.description,
      cost: cost,
      isOwned: isOwned,
      canAfford: canAfford,
      color: COLORS.orange,
      onClick: `purchaseGlobalUpgrade('${upgrade.id}')`
    });
  });
  
  // Add placeholder for future tactical upgrades
  html += `
    <div class="upgrade-btn-compact" 
         style="color: #555; border-color: #555; background: rgba(85, 85, 85, 0.1); cursor: default;"
         data-tooltip="More tactical upgrades coming soon">
        <strong>Coming Soon</strong>
    </div>
  `;
  
  html += '</div></div>';
  
  // Emergency Actions - Move to bottom
  html += `
    <div style="margin-top: 15px;">
        ${createSectionHeader('Emergency', '#ff0')}
        <div class="compact-grid-1">
  `;
  
  // Emergency Ammo Purchase Button
  const ammoExchangeRate = 2;
  const canAffordAmmo = gameState.scrap >= ammoExchangeRate;
  html += createCompactUpgradeButton({
    name: 'Emergency Ammo',
    description: 'Buy 1 ammo for 2 scrap. Adds ammunition to first available turret.',
    cost: ammoExchangeRate,
    canAfford: canAffordAmmo,
    color: COLORS.yellow,
    action: 'emergency-ammo'
  });
  
  html += '</div></div></div>';
  
  return html;
}

// Turrets upgrades tab content
export function getTurretsUpgradesHTML(): string {
  let html = `
    <div>
  `;
  
  // Get selected turret or default to 0
  const selectedTurret = gameState.commandMode.selectedEntityType === 'turret' 
    ? gameState.commandMode.selectedEntity : 0;
  

  if (selectedTurret !== null && launchers[selectedTurret]) {
    const turretUpgrades = launcherUpgrades[selectedTurret];
    const launcher = launchers[selectedTurret];
    
    // Show science upgrade path unlocks first
    html += `
      <div style="margin-bottom: 15px;">
          ${createSectionHeader('Upgrade Path Unlocks', 'rgb(100, 200, 255)')}
          <div class="compact-grid-2" style="gap: 8px;">
    `;
    
    // Show upgrade path unlock buttons for locked paths
    const upgradePathsToUnlock = [
      { key: 'speed', name: 'Speed Path', cost: 10, description: 'Unlock missile velocity research upgrades' },
      { key: 'explosion', name: 'Blast Path', cost: 25, description: 'Unlock explosive technology upgrades' },
      { key: 'capacity', name: 'Ammo Path', cost: 50, description: 'Unlock storage engineering upgrades' },
      { key: 'autopilot', name: 'Auto Path', cost: 100, description: 'Unlock AI targeting system upgrades' }
    ];
    
    // Show only the 2 cheapest locked paths
    const lockedPaths = upgradePathsToUnlock.filter(path => !unlockedUpgradePaths[path.key]);
    const cheapestLockedPaths = lockedPaths.sort((a, b) => a.cost - b.cost).slice(0, 2);
    
    cheapestLockedPaths.forEach(path => {
      const canAfford = gameState.science >= path.cost;
      
      html += createCompactUpgradeButton({
        name: `🔬 ${path.name}`,
        description: `${path.description}. Spend ${path.cost} science to unlock this upgrade path permanently.`,
        cost: path.cost,
        canAfford: canAfford,
        color: COLORS.scienceBlue,
        action: 'unlock-upgrade-path',
        actionData: `${path.key},${path.cost}`,
        currencyIcon: '🔬'
      });
    });
    
    html += '</div></div>';
    
    // Always show turret selector when a turret is selected
    html += `
      <div style="margin-bottom: 15px;">
          ${createSectionHeader('Turret Selection', '#0ff')}
          <div class="compact-grid-3">
    `;
    
    // Add all turrets as selection buttons
    for (let i = 0; i < launchers.length; i++) {
      const turretInfo = launchers[i];
      const hasAmmo = turretInfo.missiles > 0;
      const isSelected = i === selectedTurret;
      const statusColor = hasAmmo ? '#0f0' : '#ff0';
      const status = hasAmmo ? 'OPERATIONAL' : 'NO AMMO';
      
      const tooltipText = `Ammo: ${turretInfo.missiles}/${turretInfo.maxMissiles} • Status: ${status}`;
      
      const buttonStyle = isSelected 
        ? 'color: #0ff; border-color: #0ff; background: rgba(0, 255, 255, 0.3); border-width: 2px;'
        : 'color: #0ff; border-color: #0ff; background: rgba(0, 255, 255, 0.1);';
      
      html += `
        <button data-action="select-turret" 
                data-action-data="${i}"
                class="upgrade-btn-compact tooltip"
                style="${buttonStyle}"
                data-tooltip="${tooltipText}">
            <strong>T${i + 1}</strong><br>
            <small style="color: ${statusColor};">${status}</small>
            ${isSelected ? '<br><small style="color: #0ff;">SELECTED</small>' : ''}
        </button>
      `;
    }
    
    // Add build turret button if not at max capacity
    const config = (window as any).ModeManager?.getCurrentConfig();
    if (config && config.availableTurretPositions) {
      const maxTurrets = config.availableTurretPositions.length;
      const currentTurrets = launchers.length;
      
      if (currentTurrets < maxTurrets) {
        const buildCost = 150 + (currentTurrets * 100); // Increasing cost per turret
        const canAffordBuild = gameState.scrap >= buildCost;
        
        html += `
          <button data-action="build-turret" 
                  class="upgrade-btn-compact tooltip"
                  style="color: ${canAffordBuild ? '#0f0' : '#666'}; border-color: ${canAffordBuild ? '#0f0' : '#666'}; background: rgba(${canAffordBuild ? '0, 255, 0' : '102, 102, 102'}, 0.1); ${canAffordBuild ? '' : 'opacity: 0.5;'}"
                  data-tooltip="Construct a new turret at the next available position. Turret ${currentTurrets + 1} of ${maxTurrets} maximum. Costs ${buildCost} scrap."
                  ${canAffordBuild ? '' : 'disabled'}>
              <strong>+ New Turret</strong><br>
              <small>${buildCost} 💰</small>
          </button>
        `;
      }
    }
    
    html += `
            </div>
        </div>
        
        <div style="margin-bottom: 15px; padding: 8px; background: rgba(0, 255, 255, 0.1); border: 1px solid #0ff; border-radius: 3px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: #0ff;">Managing Turret ${selectedTurret + 1}</strong>
                <div style="font-size: 11px; color: #aaa;">Ammo: ${launcher.missiles}/${launcher.maxMissiles}</div>
            </div>
        </div>
        
    `;
    
    // FTL-style upgrade grid - replace the compact-grid with our own layout
    html += `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
    `;
    
    // Define upgrade types in static order (2-column grid, only show unlocked)
    const ftlUpgradeLayout = [
      { key: 'rate', name: 'Rate', icon: '🔥', description: 'Fire rate' },
      { key: 'speed', name: 'Speed', icon: '⚡', description: 'Missile velocity' },
      { key: 'explosion', name: 'Blast', icon: '💥', description: 'Explosion radius' },
      { key: 'capacity', name: 'Ammo', icon: '📦', description: 'Missile capacity' },
      { key: 'autopilot', name: 'Auto', icon: '🎯', description: 'Auto-targeting' }
    ];
    
    // Only show unlocked upgrade paths
    const unlockedUpgradeTypes = ftlUpgradeLayout.filter(upgradeType => {
      return unlockedUpgradePaths[upgradeType.key];
    });
    
    unlockedUpgradeTypes.forEach((upgradeType) => {
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
      
      // FTL-style upgrade row with dynamic coloring
      html += `
        <div style="border: 1px solid ${tierColor}; border-radius: 3px; padding: 8px; background: rgba(${tier === 1 ? '0, 255, 255' : tier === 2 ? '0, 255, 0' : tier === 3 ? '255, 255, 0' : tier === 4 ? '255, 136, 0' : '255, 0, 255'}, 0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span style="color: ${tierColor}; font-weight: bold; font-size: 12px;">
                    ${upgradeType.icon} ${upgradeType.name.toUpperCase()}
                </span>
                <span style="color: #aaa; font-size: 10px;">LV ${currentLevel} ${tierName}</span>
            </div>
            
            <!-- Progress bar showing current tier progress -->
            <div style="display: flex; gap: 1px; margin-bottom: 5px; height: 8px;">
      `;
      
      // Draw progress bars with tier-appropriate subdivision
      const actualBars = Math.min(barsInTier, tier <= 2 ? 5 : tier === 3 ? 10 : tier === 4 ? 15 : 20); // Visual limit
      for (let i = 1; i <= actualBars; i++) {
        const isFilled = i <= levelInTier;
        const color = isFilled ? tierColor : '#333';
        html += `<div style="flex: 1; background: ${color}; border-radius: 1px; min-width: 2px;"></div>`;
      }
      
      html += `
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
    });
    
    html += '</div>'; // Close FTL grid
    
  } else {
    // Show all available turrets for selection
    html += `
      <div style="margin-bottom: 15px;">
          ${createSectionHeader('Select Turret', '#0ff')}
          <div class="compact-grid-3">
    `;
    
    for (let i = 0; i < launchers.length; i++) {
      const launcher = launchers[i];
      const hasAmmo = launcher.missiles > 0;
      const status = hasAmmo ? 'OPERATIONAL' : 'NO AMMO';
      const statusColor = hasAmmo ? '#0f0' : '#ff0';
      
      html += `
        <button data-action="select-turret" 
                data-action-data="${i}"
                class="upgrade-btn-compact tooltip"
                style="color: #0ff; border-color: #0ff; background: rgba(0, 255, 255, 0.1);"
                data-tooltip="Ammo: ${launcher.missiles}/${launcher.maxMissiles} • Status: ${status}">
            <strong>T${i + 1}</strong><br>
            <small style="color: ${statusColor};">${status}</small>
        </button>
      `;
    }
    
    // Add build turret button if not at max capacity
    const config = (window as any).ModeManager?.getCurrentConfig();
    if (config && config.availableTurretPositions) {
      const maxTurrets = config.availableTurretPositions.length;
      const currentTurrets = launchers.length;
      
      if (currentTurrets < maxTurrets) {
        const buildCost = 150 + (currentTurrets * 100); // Increasing cost per turret
        const canAffordBuild = gameState.scrap >= buildCost;
        
        html += `
          <button data-action="build-turret" 
                  class="upgrade-btn-compact tooltip"
                  style="color: ${canAffordBuild ? '#0f0' : '#666'}; border-color: ${canAffordBuild ? '#0f0' : '#666'}; background: rgba(${canAffordBuild ? '0, 255, 0' : '102, 102, 102'}, 0.1); ${canAffordBuild ? '' : 'opacity: 0.5;'}"
                  data-tooltip="Construct a new turret at the next available position. Turret ${currentTurrets + 1} of ${maxTurrets} maximum. Costs ${buildCost} scrap."
                  ${canAffordBuild ? '' : 'disabled'}>
              <strong>+ New Turret</strong><br>
              <small>${buildCost} 💰</small>
          </button>
        `;
      }
    }
    
    html += `
            </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            Select a turret above or click one in the game to upgrade it
        </div>
    `;
  }
  
  html += '</div>';
  return html;
}

// Cities upgrades tab content  
export function getCitiesUpgradesHTML(): string {
  let html = `
    <div>
  `;
  
  // Show "Unlock Science" if not yet unlocked (progressive disclosure gateway)
  const researchUnlocked = globalUpgrades.research && globalUpgrades.research.level > 0;
  if (!researchUnlocked) {
    html += `
      <div style="margin-bottom: 20px;">
        ${createSectionHeader('Research Division', `rgb(${COLORS.scienceBlue})`)}
        <div class="compact-grid-1">
    `;
    
    const researchCost = globalUpgrades.research.cost;
    const canAffordResearch = gameState.scrap >= researchCost;
    
    html += createCompactUpgradeButton({
      name: 'Unlock Science',
      description: 'Establish research capabilities and unlock the Science tab. Opens access to advanced technologies and specialized upgrades.',
      cost: researchCost,
      canAfford: canAffordResearch,
      color: COLORS.scienceBlue,
      action: 'purchase-global',
      actionData: 'research'
    });
    
    html += '</div></div>';
  }
  
  // Emergency Actions - always visible
  html += `
    <div style="margin-bottom: 15px;">
        ${createSectionHeader('Emergency', '#ff0')}
        <div class="compact-grid-1">
  `;
  
  // Emergency Ammo Purchase Button
  const ammoExchangeRate = 2;
  const canAffordAmmo = gameState.scrap >= ammoExchangeRate;
  html += createCompactUpgradeButton({
    name: 'Emergency Ammo',
    description: 'Buy 1 ammo for 2 scrap. Adds ammunition to first available turret.',
    cost: ammoExchangeRate,
    canAfford: canAffordAmmo,
    color: COLORS.yellow,
    action: 'emergency-ammo'
  });
  
  html += '</div></div>';
  
  // Science upgrades section - only show if research is unlocked and civilian industry is unlocked
  const civilianIndustryUnlocked = globalUpgrades.civilianIndustry?.level > 0;
  
  if (researchUnlocked && civilianIndustryUnlocked) {
    html += `
      <div style="margin-bottom: 15px;">
          ${createSectionHeader('Technology Research', `rgb(${COLORS.scienceBlue})`)}
          <div class="compact-grid-2">
    `;
    
    // Show specialized tech
    const scienceUpgrades = [
      { id: 'populationTech', name: 'Civil Defense', description: 'Unlock bunkers and fallout shelters to protect civilian populations' },
      { id: 'arsenalTech', name: 'Arms Manufacturing', description: 'Unlock military-grade ammunition production facilities' },
      { id: 'miningTech', name: 'Strategic Mining', description: 'Unlock deep mining operations for critical military materials' },
      { id: 'researchTech', name: 'Defense Research', description: 'Unlock classified research laboratories for advanced weapons technology' }
    ];
    
    scienceUpgrades.forEach(upgrade => {
      const upgradeData = globalUpgrades[upgrade.id];
      const isOwned = upgradeData && upgradeData.level > 0;
      
      // Hide one-time upgrades that are already owned
      if (isOwned) return;
      
      const cost = upgradeData ? upgradeData.cost : 25;
      const canAfford = gameState.science >= cost;
      
      html += createCompactUpgradeButton({
        name: upgrade.name,
        description: upgrade.description,
        cost: cost,
        isOwned: isOwned,
        canAfford: canAfford,
        color: COLORS.scienceBlue,
        action: 'purchase-global',
        actionData: upgrade.id,
        currencyIcon: '🔬'
      });
    });
    
    html += '</div></div>';
    
    // City Science upgrades - only show if civilian industry is unlocked
    if (civilianIndustryUnlocked) {
      html += `
        <div style="margin-bottom: 15px;">
            ${createSectionHeader('City Science', `rgb(${COLORS.scienceBlue})`)}
            <div class="compact-grid-2">
      `;
      
      const cityScienceUpgrades = [
        { id: 'ammoRecycling', name: 'Salvage Ops', description: 'Convert excess ammunition to scrap materials. Efficiency through wartime rationing.' },
        { id: 'truckFleet', name: 'Motor Pool', description: 'Expand military transport capacity with additional convoy trucks' },
        { id: 'ammoHotkey', name: 'Rapid Procurement', description: 'Enable \'A\' key hotkey for emergency ammo purchases (2 scrap, 3-second cooldown)' }
      ];
      
      cityScienceUpgrades.forEach(upgrade => {
        const upgradeData = globalUpgrades[upgrade.id];
        const isOwned = upgradeData && upgradeData.level > 0;
        
        // Hide one-time upgrades that are already owned
        if (isOwned) return;
        
        const cost = upgradeData ? upgradeData.cost : 30;
        const canAfford = gameState.science >= cost;
        
        html += createCompactUpgradeButton({
          name: upgrade.name,
          description: upgrade.description,
          cost: cost,
          isOwned: isOwned,
          canAfford: canAfford,
          color: COLORS.scienceBlue,
          action: 'purchase-global',
          actionData: upgrade.id,
          currencyIcon: '🔬'
        });
      });
      
      html += '</div></div>';
    }
  }
  
  // Get selected city or show all cities
  const selectedCity = gameState.commandMode.selectedEntityType === 'city' 
    ? gameState.commandMode.selectedEntity : null;
  
  
  if (selectedCity !== null && cityData[selectedCity]) {
    const city = cityData[selectedCity];
    const isDestroyed = destroyedCities.includes(selectedCity);
    
    // Always show city selector when a city is selected
    html += `
      <div style="margin-bottom: 15px;">
          ${createSectionHeader('City Management', '#ff0')}
          <div class="compact-grid-3">
    `;
    
    // Add all cities as selection buttons
    for (let i = 0; i < cityData.length; i++) {
      const cityInfo = cityData[i];
      const isCityDestroyed = destroyedCities.includes(i);
      const isSelected = i === selectedCity;
      const statusColor = isCityDestroyed ? '#f00' : '#0f0';
      const productionIcon = cityInfo.productionMode === 'scrap' ? '💰' : cityInfo.productionMode === 'science' ? '🔬' : '📦';
      
      const tooltipText = isCityDestroyed 
        ? 'City destroyed - requires 50 scrap to repair'
        : `Population: ${cityInfo.population}/${cityInfo.maxPopulation} • Producing: ${cityInfo.productionMode} • Level: ${cityUpgrades[i]}`;
      
      const buttonStyle = isSelected 
        ? 'color: #ff0; border-color: #ff0; background: rgba(255, 255, 0, 0.3); border-width: 2px;'
        : 'color: #ff0; border-color: #ff0; background: rgba(255, 255, 0, 0.1);';
      
      html += `
        <button data-action="select-city" 
                data-action-data="${i}"
                class="upgrade-btn-compact tooltip"
                style="${buttonStyle}"
                data-tooltip="${tooltipText}">
            <strong>C${i + 1} ${isCityDestroyed ? '💥' : productionIcon}</strong><br>
            <small style="color: ${statusColor};">${isCityDestroyed ? 'DESTROYED' : 'OK'}</small>
            ${isSelected ? '<br><small style="color: #ff0;">SELECTED</small>' : ''}
        </button>
      `;
    }
    
    // Add build city button if not at max capacity
    const config = (window as any).ModeManager?.getCurrentConfig();
    const maxCities = (config && config.availableCityPositions) ? config.availableCityPositions.length : 6;
    const currentCities = cityData.length;
    if (currentCities < maxCities) {
      const buildCost = currentCities === 2 ? 100 : currentCities === 3 ? 150 : 200; // 100/150/200 progression
      const canAffordBuild = gameState.scrap >= buildCost;
      
      html += `
        <button data-action="build-city" 
                data-action-data="${currentCities}"
                class="upgrade-btn-compact tooltip"
                style="color: ${canAffordBuild ? '#0f0' : '#666'}; border-color: ${canAffordBuild ? '#0f0' : '#666'}; background: rgba(${canAffordBuild ? '0, 255, 0' : '102, 102, 102'}, 0.1); ${canAffordBuild ? '' : 'opacity: 0.5;'}"
                data-tooltip="Construct a new city to increase resource production. City ${currentCities + 1} of ${maxCities} maximum. Costs ${buildCost} scrap."
                ${canAffordBuild ? '' : 'disabled'}>
            <strong>+ New City</strong><br>
            <small>${buildCost} 💰</small>
        </button>
      `;
    }
    
    html += `
            </div>
        </div>
        
        <div style="margin-bottom: 15px; padding: 8px; background: rgba(255, 255, 0, 0.1); border: 1px solid #ff0; border-radius: 3px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: #ff0;">Managing City ${selectedCity + 1}</strong>
                <div style="font-size: 11px; color: #aaa;">
                    ${isDestroyed ? 'DESTROYED' : `${city.productionMode} • Pop: ${Math.floor(city.population)}/${city.maxPopulation}`}
                </div>
                ${!isDestroyed ? `<div style="font-size: 11px; color: #0f0;">Production: ${calculateCityProductionRate(selectedCity)}/sec</div>` : ''}
            </div>
        </div>
    `;
    
    if (isDestroyed) {
      // Show repair option
      const repairCost = 50;
      const canAffordRepair = gameState.scrap >= repairCost;
      
      html += `
        <div style="text-align: center; margin-bottom: 15px;">
            ${createCompactUpgradeButton({
              name: '🔧 Repair City',
              description: 'Restore city to operational status. Rebuilds infrastructure and restores population.',
              cost: repairCost,
              canAfford: canAffordRepair,
              color: COLORS.red,
              action: 'repair-city',
              actionData: `${selectedCity}`
            })}
        </div>
      `;
    } else {
      // Show production mode options in compact 3-column grid
      html += `
        <div style="margin-bottom: 15px;">
            ${createSectionHeader('Production Mode', '#ff0')}
            <div class="compact-grid-3">
      `;
      
      const productionModes = [
        { id: 'scrap', name: 'Scrap', icon: '💰', description: 'Produces scrap for purchasing upgrades and repairs' },
        { id: 'ammo', name: 'Ammo', icon: '📦', description: 'Produces ammunition for turret resupply' }
      ];
      
      // Only show science production if research is unlocked
      const researchUnlocked = globalUpgrades.research && globalUpgrades.research.level > 0;
      if (researchUnlocked) {
        productionModes.push({ id: 'science', name: 'Science', icon: '🔬', description: 'Produces science for purchasing turret upgrades' });
      }
      
      // Get current city's production upgrade levels for preview
      const currentScrapLevel = cityProductivityUpgrades.scrap?.[selectedCity] || 0;
      const currentScienceLevel = cityProductivityUpgrades.science?.[selectedCity] || 0;
      const currentAmmoLevel = cityProductivityUpgrades.ammo?.[selectedCity] || 0;
      const productionLevels = { scrap: currentScrapLevel, science: currentScienceLevel, ammo: currentAmmoLevel };
      
      productionModes.forEach(mode => {
        const isActive = city.productionMode === mode.id;
        const isLocked = mode.id === 'science' && (!globalUpgrades.research || globalUpgrades.research.level === 0);
        
        let buttonClass = 'upgrade-btn-compact tooltip';
        let buttonStyle = '';
        let clickHandler = '';
        
        if (isLocked) {
          buttonStyle = 'color: #555; border-color: #555; background: rgba(85, 85, 85, 0.1);';
        } else if (isActive) {
          buttonStyle = `color: rgb(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}); border-color: rgb(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}); background: rgba(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}, 0.3); border-width: 2px;`;
        } else {
          buttonStyle = `color: rgb(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}); border-color: rgb(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}); background: rgba(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}, 0.1);`;
          clickHandler = `data-action="set-production" data-action-data="${selectedCity},${mode.id}"`;
        }
        
        const modeLevel = productionLevels[mode.id as keyof typeof productionLevels];
        const tooltipText = isLocked ? 'Requires Science unlock from Global tab' : 
          `${mode.description} (Level ${modeLevel})` + (isActive ? ' (Currently Active)' : '');
        
        html += `
          <button ${clickHandler}
                  class="${buttonClass}"
                  style="${buttonStyle}"
                  data-tooltip="${tooltipText}">
              <strong>${mode.icon} ${mode.name}</strong>
              ${modeLevel > 0 ? `<br><small>LV ${modeLevel}</small>` : ''}
              ${isActive ? '<br><small>ACTIVE</small>' : ''}
          </button>
        `;
      });
      
      html += '</div></div>';
      
      // City upgrades in compact format - now with specialized upgrades
      html += `
        <div>
            ${createSectionHeader('City Upgrades', '#ff0')}
            <div class="compact-grid-3">
      `;
      
      // Population upgrade (increases max population and survival) - only if civilian industry and population tech are unlocked
      const civilianIndustryUnlocked = globalUpgrades.civilianIndustry?.level > 0;
      const popTechUnlocked = globalUpgrades.populationTech?.level > 0;
      if (civilianIndustryUnlocked && popTechUnlocked) {
        const popLevel = cityPopulationUpgrades[selectedCity];
        const popCost = 40 + (popLevel * 30);
        const canAffordPop = gameState.scrap >= popCost;
        
        html += createCompactUpgradeButton({
          name: `🏘️ Urban Expansion`,
          description: `Expand city housing capacity. Level ${popLevel} → ${popLevel + 1}. Higher population = more resources per tick.`,
          cost: popCost,
          canAfford: canAffordPop,
          color: COLORS.green,
          action: 'upgrade-city-population',
          actionData: `${selectedCity}`,
          additionalInfo: `Max Pop: ${city.maxPopulation} → ${city.maxPopulation + 50}`
        });
      }
      
      // Bunker upgrade (reduces damage from missile hits) - only if civilian industry and population tech are unlocked
      if (civilianIndustryUnlocked && popTechUnlocked) {
        const bunkerLevel = cityBunkerUpgrades[selectedCity];
        const bunkerCost = 60 + (bunkerLevel * 40);
        const canAffordBunker = gameState.scrap >= bunkerCost;
        
        html += createCompactUpgradeButton({
          name: `🏢 Bunker System`,
          description: `Build underground bunkers and fallout shelters. Level ${bunkerLevel} → ${bunkerLevel + 1}. Reduces damage from missile hits.`,
          cost: bunkerCost,
          canAfford: canAffordBunker,
          color: COLORS.orange,
          action: 'upgrade-city-bunker',
          actionData: `${selectedCity}`,
          additionalInfo: `Damage reduction: ${bunkerLevel * 15}% → ${(bunkerLevel + 1) * 15}%`
        });
      }
      
      // Specialized productivity upgrade (depends on current production mode) - only if civilian industry and corresponding tech are unlocked
      const currentMode = city.productionMode as 'scrap' | 'science' | 'ammo';
      const techRequirements = { scrap: 'miningTech', science: 'researchTech', ammo: 'arsenalTech' };
      const requiredTech = techRequirements[currentMode];
      const techUnlocked = globalUpgrades[requiredTech]?.level > 0;
      
      if (civilianIndustryUnlocked && techUnlocked) {
        const prodLevel = cityProductivityUpgrades[currentMode][selectedCity];
        const prodCost = 25 + (prodLevel * 20);
        const canAffordProd = gameState.scrap >= prodCost;
        
        const modeIcons = { scrap: '💰', science: '🔬', ammo: '📦' };
        const modeNames = { scrap: 'Strategic Mining', science: 'Research Facility', ammo: 'Arms Factory' };
        const modeDescriptions = {
          scrap: 'Deep mining operations for critical military materials. Increases scrap output per tick.',
          science: 'Classified research laboratories for weapons technology. Increases science output per tick.',
          ammo: 'Military-grade ammunition production facilities. Increases ammo output per tick.'
        };
        
        html += createCompactUpgradeButton({
          name: `${modeIcons[currentMode]} ${modeNames[currentMode]}`,
          description: `${modeDescriptions[currentMode]} Level ${prodLevel} → ${prodLevel + 1}. Only affects ${currentMode} production.`,
          cost: prodCost,
          canAfford: canAffordProd,
          color: currentMode === 'scrap' ? COLORS.green : currentMode === 'science' ? COLORS.scienceBlue : COLORS.yellow,
          action: 'upgrade-city-productivity',
          actionData: `${selectedCity},${currentMode}`,
          additionalInfo: `${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} efficiency +25%`
        });
      }
      
      // Show message if no upgrades are available
      if (!civilianIndustryUnlocked) {
        html += `
          <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #888; font-size: 12px;">
              Research Civilian Industry in Global tab to unlock city improvements
          </div>
        `;
      } else if (!popTechUnlocked && !techUnlocked) {
        html += `
          <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #888; font-size: 12px;">
              Research specialized technology to unlock city upgrades
          </div>
        `;
      }
      
      html += '</div></div>';
    }
  } else {
    // Show all cities overview in compact grid
    html += `
      <div style="margin-bottom: 15px;">
          ${createSectionHeader('City Management', '#ff0')}
          <div class="compact-grid-3">
    `;
    
    for (let i = 0; i < cityData.length; i++) {
      const city = cityData[i];
      const isDestroyed = destroyedCities.includes(i);
      const statusColor = isDestroyed ? '#f00' : '#0f0';
      const productionIcon = city.productionMode === 'scrap' ? '💰' : city.productionMode === 'science' ? '🔬' : '📦';
      
      const tooltipText = isDestroyed 
        ? 'City destroyed - requires 50 scrap to repair'
        : `Population: ${city.population}/${city.maxPopulation} • Producing: ${city.productionMode} • Level: ${cityUpgrades[i]}`;
      
      html += `
        <button data-action="select-city" 
                data-action-data="${i}"
                class="upgrade-btn-compact tooltip"
                style="color: #ff0; border-color: #ff0; background: rgba(255, 255, 0, 0.1);"
                data-tooltip="${tooltipText}">
            <strong>C${i + 1} ${isDestroyed ? '💥' : productionIcon}</strong><br>
            <small style="color: ${statusColor};">${isDestroyed ? 'DESTROYED' : 'OK'}</small>
        </button>
      `;
    }
    
    // Add build city button if not at max capacity
    const config = (window as any).ModeManager?.getCurrentConfig();
    const maxCities = (config && config.availableCityPositions) ? config.availableCityPositions.length : 6;
    const currentCities = cityData.length;
    if (currentCities < maxCities) {
      const buildCost = currentCities === 2 ? 100 : currentCities === 3 ? 150 : 200; // 100/150/200 progression
      const canAffordBuild = gameState.scrap >= buildCost;
      
      html += `
        <button data-action="build-city" 
                data-action-data="${currentCities}"
                class="upgrade-btn-compact tooltip"
                style="color: ${canAffordBuild ? '#0f0' : '#666'}; border-color: ${canAffordBuild ? '#0f0' : '#666'}; background: rgba(${canAffordBuild ? '0, 255, 0' : '102, 102, 102'}, 0.1); ${canAffordBuild ? '' : 'opacity: 0.5;'}"
                data-tooltip="Construct a new city to increase resource production. City ${currentCities + 1} of ${maxCities} maximum. Costs ${buildCost} scrap."
                ${canAffordBuild ? '' : 'disabled'}>
            <strong>+ New City</strong><br>
            <small>${buildCost} 💰</small>
        </button>
      `;
    }
    
    html += `
            </div>
        </div>
        <div style="text-align: center; padding: 15px; color: #888; font-size: 12px;">
            Select a city above or click one in the game to manage it
        </div>
    `;
  }
  
  html += '</div>';
  return html;
}

// Science upgrades tab content (unlocked after "Unlock Science")
export function getScienceUpgradesHTML(): string {
  let html = `
    <div>
  `;
  
  // Four Research Branches
  html += `
    <div style="margin-bottom: 20px;">
      ${createSectionHeader('Research Branches', `rgb(${COLORS.scienceBlue})`)}
      <div class="compact-grid-2" style="gap: 12px;">
  `;
  
  const researchBranches = [
    { 
      id: 'ammoResearch', 
      name: '🎯 Ammo Research', 
      description: 'Military logistics and combat systems. Unlocks turret upgrades, emergency hotkeys, and ammunition improvements.',
      cost: 20
    },
    { 
      id: 'scrapResearch', 
      name: '💰 Scrap Research', 
      description: 'Economic systems and resource efficiency. Unlocks mining improvements, discounts, and resource conversion.',
      cost: 25
    },
    { 
      id: 'scienceResearch', 
      name: '🔬 Science Research', 
      description: 'Advanced research capabilities. Unlocks tech tree visualization, research improvements, and analytics.',
      cost: 20
    },
    { 
      id: 'populationResearch', 
      name: '🏘️ Population Research', 
      description: 'City expansion and civilian protection. Unlocks additional city slots, population growth, and defense systems.',
      cost: 25
    }
  ];
  
  researchBranches.forEach(branch => {
    const branchData = globalUpgrades[branch.id];
    const isOwned = branchData && branchData.level > 0;
    
    if (!isOwned) {
      const cost = branchData?.cost || branch.cost;
      const canAfford = gameState.science >= cost;
      
      html += createCompactUpgradeButton({
        name: branch.name,
        description: branch.description,
        cost: cost,
        canAfford: canAfford,
        color: COLORS.scienceBlue,
        action: 'purchase-global',
        actionData: branch.id,
        currencyIcon: '🔬'
      });
    }
  });
  
  html += '</div></div>';
  
  // Branch-specific upgrades (shown after respective branches are unlocked)
  const ammoUnlocked = globalUpgrades.ammoResearch?.level > 0;
  const scrapUnlocked = globalUpgrades.scrapResearch?.level > 0;
  const scienceUnlocked = globalUpgrades.scienceResearch?.level > 0;
  const populationUnlocked = globalUpgrades.populationResearch?.level > 0;
  
  // Ammo Research Branch
  if (ammoUnlocked) {
    html += `
      <div style="margin-bottom: 15px;">
        ${createSectionHeader('Ammo Research', `rgb(${COLORS.scienceBlue})`)}
        <div class="compact-grid-2">
    `;
    
    const ammoUpgrades = [
      { id: 'unlockTurretUpgrades', name: 'Unlock Turret Upgrades', description: 'Enable the Turrets tab and all turret improvement systems.' },
      { id: 'enhancedAmmoProduction', name: 'Enhanced Ammo Production', description: 'Unlock per-city ammo production efficiency upgrades (scrap-based).' },
      { id: 'rapidProcurement', name: 'Rapid Procurement', description: 'Enable \'A\' key hotkey for emergency ammo purchases (2 scrap, 3-second cooldown).' },
      { id: 'advancedLogistics', name: 'Advanced Logistics', description: 'Trucks carry +1 ammo and move 25% faster. Improved delivery efficiency.' },
      { id: 'ammunitionStockpiles', name: 'Ammunition Stockpiles', description: 'Unlock per-city ammo storage capacity upgrades (scrap-based).' }
    ];
    
    ammoUpgrades.forEach(upgrade => {
      const upgradeData = globalUpgrades[upgrade.id];
      const isOwned = upgradeData && upgradeData.level > 0;
      
      if (!isOwned) {
        const cost = upgradeData?.cost || 20;
        const canAfford = gameState.science >= cost;
        
        html += createCompactUpgradeButton({
          name: upgrade.name,
          description: upgrade.description,
          cost: cost,
          canAfford: canAfford,
          color: COLORS.scienceBlue,
          action: 'purchase-global',
          actionData: upgrade.id,
          currencyIcon: '🔬'
        });
      }
    });
    
    html += '</div></div>';
  }
  
  // Scrap Research Branch
  if (scrapUnlocked) {
    html += `
      <div style="margin-bottom: 15px;">
        ${createSectionHeader('Scrap Research', `rgb(${COLORS.scienceBlue})`)}
        <div class="compact-grid-2">
    `;
    
    const scrapUpgrades = [
      { id: 'enhancedScrapMining', name: 'Enhanced Scrap Mining', description: 'Unlock per-city scrap production efficiency upgrades (scrap-based).' },
      { id: 'resourceEfficiency', name: 'Resource Efficiency', description: '15% discount on all city upgrades. Improved procurement contracts.' },
      { id: 'salvageOperations', name: 'Salvage Operations', description: 'Automatically convert excess ammunition to scrap materials.' }
    ];
    
    scrapUpgrades.forEach(upgrade => {
      const upgradeData = globalUpgrades[upgrade.id];
      const isOwned = upgradeData && upgradeData.level > 0;
      
      if (!isOwned) {
        const cost = upgradeData?.cost || 20;
        const canAfford = gameState.science >= cost;
        
        html += createCompactUpgradeButton({
          name: upgrade.name,
          description: upgrade.description,
          cost: cost,
          canAfford: canAfford,
          color: COLORS.scienceBlue,
          action: 'purchase-global',
          actionData: upgrade.id,
          currencyIcon: '🔬'
        });
      }
    });
    
    html += '</div></div>';
  }
  
  // Science Research Branch
  if (scienceUnlocked) {
    html += `
      <div style="margin-bottom: 15px;">
        ${createSectionHeader('Science Research', `rgb(${COLORS.scienceBlue})`)}
        <div class="compact-grid-2">
    `;
    
    const scienceUpgrades = [
      { id: 'viewTechTree', name: 'View Tech Tree', description: 'Display complete technology roadmap with dependencies and prerequisites.' },
      { id: 'enhancedResearch', name: 'Enhanced Research', description: 'Unlock per-city science production efficiency upgrades (scrap-based).' },
      { id: 'researchAnalytics', name: 'Research Analytics', description: 'Show detailed upgrade statistics, effectiveness ratings, and optimization suggestions.' }
    ];
    
    scienceUpgrades.forEach(upgrade => {
      const upgradeData = globalUpgrades[upgrade.id];
      const isOwned = upgradeData && upgradeData.level > 0;
      
      if (!isOwned) {
        const cost = upgradeData?.cost || 20;
        const canAfford = gameState.science >= cost;
        
        html += createCompactUpgradeButton({
          name: upgrade.name,
          description: upgrade.description,
          cost: cost,
          canAfford: canAfford,
          color: COLORS.scienceBlue,
          action: 'purchase-global',
          actionData: upgrade.id,
          currencyIcon: '🔬'
        });
      }
    });
    
    html += '</div></div>';
  }
  
  // Population Research Branch
  if (populationUnlocked) {
    html += `
      <div style="margin-bottom: 15px;">
        ${createSectionHeader('Population Research', `rgb(${COLORS.scienceBlue})`)}
        <div class="compact-grid-2">
    `;
    
    const populationUpgrades = [
      { id: 'urbanPlanning1', name: 'Urban Planning I', description: 'Unlock 3rd city construction slot. Expand territorial control.' },
      { id: 'urbanPlanning2', name: 'Urban Planning II', description: 'Unlock 4th city construction slot. Requires Urban Planning I.' },
      { id: 'urbanPlanning3', name: 'Urban Planning III', description: 'Unlock 5th city construction slot. Requires Urban Planning II.' },
      { id: 'urbanPlanning4', name: 'Urban Planning IV', description: 'Unlock 6th city construction slot. Maximum territorial expansion.' },
      { id: 'populationGrowth', name: 'Population Growth', description: 'Unlock per-city population growth rate upgrades (scrap-based).' },
      { id: 'civilDefense', name: 'Civil Defense', description: 'Unlock per-city bunker construction for damage reduction (scrap-based).' }
    ];
    
    populationUpgrades.forEach(upgrade => {
      const upgradeData = globalUpgrades[upgrade.id];
      const isOwned = upgradeData && upgradeData.level > 0;
      
      // Check prerequisites for Urban Planning upgrades
      let canShow = true;
      if (upgrade.id === 'urbanPlanning2' && !globalUpgrades.urbanPlanning1?.level) canShow = false;
      if (upgrade.id === 'urbanPlanning3' && !globalUpgrades.urbanPlanning2?.level) canShow = false;
      if (upgrade.id === 'urbanPlanning4' && !globalUpgrades.urbanPlanning3?.level) canShow = false;
      
      if (!isOwned && canShow) {
        const cost = upgradeData?.cost || 30;
        const canAfford = gameState.science >= cost;
        
        html += createCompactUpgradeButton({
          name: upgrade.name,
          description: upgrade.description,
          cost: cost,
          canAfford: canAfford,
          color: COLORS.scienceBlue,
          action: 'purchase-global',
          actionData: upgrade.id,
          currencyIcon: '🔬'
        });
      }
    });
    
    html += '</div></div>';
  }
  
  html += '</div>';
  return html;
}

// Make functions globally available for compatibility
(window as any).getGlobalUpgradesHTML = getGlobalUpgradesHTML;
(window as any).getTurretsUpgradesHTML = getTurretsUpgradesHTML;
(window as any).getCitiesUpgradesHTML = getCitiesUpgradesHTML;
(window as any).getScienceUpgradesHTML = getScienceUpgradesHTML;
(window as any).calculateCityProductionRate = calculateCityProductionRate;

// Functions are already exported individually above
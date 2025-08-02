// Cities Upgrades Tab Content Generation  
import { gameState } from '@/systems/observableState';
import { cityData } from '@/core/cities';
import { destroyedCities, cityUpgrades, cityPopulationUpgrades, cityBunkerUpgrades, cityProductivityUpgrades } from '@/entities/cities';
import { globalUpgrades } from '@/core/upgrades';
import { createSectionHeader, createCompactUpgradeButton, COLORS } from '@/ui/uiUtils';

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

// Cities upgrades tab content  
export function getCitiesUpgradesHTML(): string {
  let html = `
    <div>
  `;
  
  // Show "Unlock Science" if not yet unlocked (progressive disclosure gateway)
  const windowGlobalUpgrades = (window as any).globalUpgrades;
  const researchUnlocked = windowGlobalUpgrades.research && windowGlobalUpgrades.research.level > 0;
  if (!researchUnlocked) {
    html += `
      <div style="margin-bottom: 20px;">
        ${createSectionHeader('Research Division', `rgb(${COLORS.scienceBlue})`)}
        <div class="compact-grid-1">
    `;
    
    const researchCost = windowGlobalUpgrades.research.cost;
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
  const civilianIndustryUnlocked = windowGlobalUpgrades.civilianIndustry?.level > 0;
  
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
      const upgradeData = windowGlobalUpgrades[upgrade.id];
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
        const upgradeData = windowGlobalUpgrades[upgrade.id];
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
  
  // Check if city management should be shown (progressive disclosure)
  const basicResearchUnlocked = windowGlobalUpgrades?.research?.level > 0;
  const scrapResearchUnlocked = windowGlobalUpgrades?.scrapResearch?.level > 0;
  const scienceResearchUnlocked = windowGlobalUpgrades?.scienceResearch?.level > 0;
  const showCityManagement = basicResearchUnlocked || scrapResearchUnlocked || scienceResearchUnlocked;
  
  // Get selected city or show all cities - only if city management is unlocked
  let selectedCity = null;
  if (showCityManagement) {
    selectedCity = gameState.commandMode.selectedEntityType === 'city' 
      ? gameState.commandMode.selectedEntity : null;
  }
  
  if (showCityManagement && selectedCity !== null && cityData[selectedCity]) {
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
    
    // Add build city button if not at research-limited capacity
    const maxCities = (window as any).getMaxAllowedCities ? (window as any).getMaxAllowedCities() : 2;
    const currentCities = cityData.length;
    if (currentCities < maxCities) {
      const buildCost = currentCities === 2 ? 100 : currentCities === 3 ? 150 : 200; // 100/150/200 progression
      const canAffordBuild = gameState.scrap >= buildCost;
      
      html += `
        <button data-action="build-city" 
                data-action-data="${currentCities}"
                class="upgrade-btn-compact tooltip"
                style="color: ${canAffordBuild ? '#0f0' : '#666'}; border-color: ${canAffordBuild ? '#0f0' : '#666'}; background: rgba(${canAffordBuild ? '0, 255, 0' : '102, 102, 102'}, 0.1); ${canAffordBuild ? '' : 'opacity: 0.5;'}"
                data-tooltip="Construct a new city to increase resource production. City ${currentCities + 1} of ${maxCities} maximum (limited by Urban Planning research). Costs ${buildCost} scrap."
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
      // Show production mode options and city upgrades
      html += getCityManagementHTML(selectedCity, city, windowGlobalUpgrades);
    }
  } else if (showCityManagement) {
    // Show all cities overview in compact grid - only if city management is unlocked
    html += getCityOverviewHTML();
  }
  
  html += '</div>';
  return html;
}

// City management HTML for selected city
function getCityManagementHTML(selectedCity: number, city: any, windowGlobalUpgrades: any): string {
  let html = '';
  
  // Show production mode options in compact 3-column grid
  html += `
    <div style="margin-bottom: 15px;">
        ${createSectionHeader('Production Mode', '#ff0')}
        <div class="compact-grid-3">
  `;
  
  const productionModes = [
    { id: 'ammo', name: 'Ammo', icon: '📦', description: 'Produces ammunition for turret resupply' }
  ];
  
  // Only show scrap production if Scrap Research is unlocked
  const scrapResearchUnlocked = windowGlobalUpgrades.scrapResearch && windowGlobalUpgrades.scrapResearch.level > 0;
  if (scrapResearchUnlocked) {
    productionModes.push({ id: 'scrap', name: 'Scrap', icon: '💰', description: 'Produces scrap for purchasing upgrades and repairs' });
  }
  
  // Show science production if basic research is unlocked (allows users to start producing science)
  const basicResearchUnlocked = windowGlobalUpgrades.research && windowGlobalUpgrades.research.level > 0;
  if (basicResearchUnlocked) {
    productionModes.push({ id: 'science', name: 'Science', icon: '🔬', description: 'Produces science for purchasing turret upgrades' });
  }
  
  // Get current city's production upgrade levels for preview
  const currentScrapLevel = cityProductivityUpgrades.scrap?.[selectedCity] || 0;
  const currentScienceLevel = cityProductivityUpgrades.science?.[selectedCity] || 0;
  const currentAmmoLevel = cityProductivityUpgrades.ammo?.[selectedCity] || 0;
  const productionLevels = { scrap: currentScrapLevel, science: currentScienceLevel, ammo: currentAmmoLevel };
  
  productionModes.forEach(mode => {
    const isActive = city.productionMode === mode.id;
    
    let buttonClass = 'upgrade-btn-compact tooltip';
    let buttonStyle = '';
    let clickHandler = '';
    
    if (isActive) {
      buttonStyle = `color: rgb(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}); border-color: rgb(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}); background: rgba(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}, 0.3); border-width: 2px;`;
    } else {
      buttonStyle = `color: rgb(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}); border-color: rgb(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}); background: rgba(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}, 0.1);`;
      clickHandler = `data-action="set-production" data-action-data="${selectedCity},${mode.id}"`;
    }
    
    const modeLevel = productionLevels[mode.id as keyof typeof productionLevels];
    const tooltipText = `${mode.description} (Level ${modeLevel})` + (isActive ? ' (Currently Active)' : '');
    
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
  html += getCityUpgradesHTML(selectedCity, windowGlobalUpgrades);
  
  return html;
}

// City upgrades HTML
function getCityUpgradesHTML(selectedCity: number, windowGlobalUpgrades: any): string {
  let html = `
    <div>
        ${createSectionHeader('City Upgrades', '#ff0')}
        <div class="compact-grid-3">
  `;
  
  const city = cityData[selectedCity];
  
  // Population upgrade (increases max population and survival) - only if civilian industry and population tech are unlocked
  const civilianIndustryUnlocked = windowGlobalUpgrades.civilianIndustry?.level > 0;
  const popTechUnlocked = windowGlobalUpgrades.populationTech?.level > 0;
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
  const techRequirements = { 
    scrap: 'scrapResearch',    // scrap mining unlocked by initial scrap research
    science: 'scienceResearch', // research labs unlocked by initial science research  
    ammo: 'ammoResearch'       // ammo factories unlocked by initial ammo research
  }; 
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
  return html;
}

// City overview HTML (when no city is selected)
function getCityOverviewHTML(): string {
  let html = `
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
  
  // Add build city button if not at research-limited capacity
  const maxCities = (window as any).getMaxAllowedCities ? (window as any).getMaxAllowedCities() : 2;
  const currentCities = cityData.length;
  if (currentCities < maxCities) {
    const buildCost = currentCities === 2 ? 100 : currentCities === 3 ? 150 : 200; // 100/150/200 progression
    const canAffordBuild = gameState.scrap >= buildCost;
    
    html += `
      <button data-action="build-city" 
              data-action-data="${currentCities}"
              class="upgrade-btn-compact tooltip"
              style="color: ${canAffordBuild ? '#0f0' : '#666'}; border-color: ${canAffordBuild ? '#0f0' : '#666'}; background: rgba(${canAffordBuild ? '0, 255, 0' : '102, 102, 102'}, 0.1); ${canAffordBuild ? '' : 'opacity: 0.5;'}"
              data-tooltip="Construct a new city to increase resource production. City ${currentCities + 1} of ${maxCities} maximum (limited by Urban Planning research). Costs ${buildCost} scrap."
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
  
  return html;
}

// Make globally available for compatibility
(window as any).getCitiesUpgradesHTML = getCitiesUpgradesHTML;
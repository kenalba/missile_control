// Global Upgrades Tab Content Generation
import { gameState } from '@/systems/observableState';
import { globalUpgrades } from '@/core/upgrades';
import { createSectionHeader, createCompactUpgradeButton, COLORS } from '@/ui/uiUtils';

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
  
  // Civilian Industry has been removed - functionality now directly accessible through research branches
  
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

// Make globally available for compatibility
(window as any).getGlobalUpgradesHTML = getGlobalUpgradesHTML;
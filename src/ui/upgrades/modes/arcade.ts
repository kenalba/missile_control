// Arcade Mode Upgrade System
import { gameState } from '@/systems/observableState';
import { createSectionHeader, createCompactUpgradeButton, COLORS } from '@/ui/uiUtils';
import { globalUpgrades } from '@/core/upgrades';

// Arcade mode upgrade tab switching
export function switchArcadeUpgradeTab(tab: string): void {
  (window as any).currentUpgradeTab = tab;
  updateArcadeTabbedUpgradePanel();
}

// Update arcade mode tabbed upgrade panel
export function updateArcadeTabbedUpgradePanel(): void {
  if (gameState.currentMode !== 'arcade') return;
  
  const tabbedPanel = document.getElementById('tabbedUpgradePanel');
  if (!tabbedPanel) return;
  
  const currentTab = (window as any).currentUpgradeTab || 'turrets';
  
  let html = `
    <div class="tab-buttons" style="display: flex; margin-bottom: 15px;">
      <button onclick="window.switchArcadeUpgradeTab('turrets')" 
              style="flex: 1; padding: 8px; background: ${currentTab === 'turrets' ? '#0f0' : 'transparent'}; color: ${currentTab === 'turrets' ? '#000' : '#0f0'}; border: 1px solid #0f0; cursor: pointer;">
        TURRETS
      </button>
      <button onclick="window.switchArcadeUpgradeTab('global')" 
              style="flex: 1; padding: 8px; background: ${currentTab === 'global' ? '#0f0' : 'transparent'}; color: ${currentTab === 'global' ? '#000' : '#0f0'}; border: 1px solid #0f0; cursor: pointer;">
        GLOBAL
      </button>
    </div>
    <div class="tab-content">
  `;
  
  if (currentTab === 'turrets') {
    html += getArcadeTurretsHTML();
  } else if (currentTab === 'global') {
    html += getArcadeGlobalHTML();
  }
  
  html += '</div>';
  tabbedPanel.innerHTML = html;
}

// Simplified arcade mode turret upgrades
function getArcadeTurretsHTML(): string {
  let html = '<h4 style="color: #0ff; margin-top: 0;">All Turrets</h4>';
  
  // Show simplified upgrade interface for all turrets
  html += `
    <div style="font-size: 11px; color: #888; margin-bottom: 15px;">
      Use the main upgrade table above for individual turret upgrades
    </div>
    <div style="padding: 20px; text-align: center; color: #555;">
      Arcade Mode uses the traditional upgrade table
    </div>
  `;
  
  return html;
}

// Simplified arcade mode global upgrades  
function getArcadeGlobalHTML(): string {
  let html = '<h4 style="color: #0f0; margin-top: 0;">Global Upgrades</h4>';
  
  // Economic Upgrades for Arcade Mode
  html += `
    <div style="margin-bottom: 15px;">
        ${createSectionHeader('Economic', '#0f0')}
        <div class="compact-grid-2">
  `;
  
  const arcadeEconomicUpgrades = [
    { id: 'scrapMultiplier', name: 'Resource Boost', description: '25% bonus materials from all sources.' },
    { id: 'salvage', name: 'Wreckage Ops', description: 'Extra 3 scrap when destroying enemy aircraft.' },
    { id: 'efficiency', name: 'Arms Discount', description: '15% discount on all turret upgrades.' }
  ];
  
  arcadeEconomicUpgrades.forEach(upgrade => {
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
  
  // Tactical Upgrades for Arcade Mode
  html += `
    <div style="margin-bottom: 15px;">
        ${createSectionHeader('Tactical', '#f80')}
        <div class="compact-grid-2">
  `;
  
  const arcadeTacticalUpgrades = [
    { id: 'missileHighlight', name: 'RADAR Warning', description: 'Highlight dangerous enemy missiles with red glow.' }
  ];
  
  arcadeTacticalUpgrades.forEach(upgrade => {
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
      action: 'purchase-global',
      actionData: upgrade.id
    });
  });
  
  html += '</div></div>';
  
  // Emergency Actions
  html += `
    <div>
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
  
  return html;
}

// Make functions globally available for arcade mode
(window as any).switchArcadeUpgradeTab = switchArcadeUpgradeTab;
(window as any).updateArcadeTabbedUpgradePanel = updateArcadeTabbedUpgradePanel;
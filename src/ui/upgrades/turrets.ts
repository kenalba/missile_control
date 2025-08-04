// Turrets Upgrades Tab Content Generation
import { gameState } from '@/systems/observableState';
import { launchers } from '@/entities/launchers';
import { launcherUpgrades, unlockedUpgradePaths } from '@/core/upgrades';
import { createSectionHeader, createCompactUpgradeButton, COLORS } from '@/ui/uiUtils';
import { createTurretUpgradeWidget } from './widgets';

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
        name: `🧪 ${path.name}`,
        description: `${path.description}. Spend ${path.cost} science to unlock this upgrade path permanently.`,
        cost: path.cost,
        canAfford: canAfford,
        color: COLORS.scienceBlue,
        action: 'unlock-upgrade-path',
        actionData: `${path.key},${path.cost}`,
        currencyIcon: '🧪'
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
      html += createTurretUpgradeWidget(upgradeType, turretUpgrades, selectedTurret);
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

// Make globally available for compatibility
(window as any).getTurretsUpgradesHTML = getTurretsUpgradesHTML;
// Legacy arcade mode upgrade system support
import type { GameState } from '@/types/gameTypes';
import { gameState } from '@/core/gameState';
import { launcherUpgrades, globalUpgrades } from '@/core/upgrades';
import { createUpgradeEffect } from '@/systems/upgrades';
import { updateUI } from '@/systems/ui';

// Legacy support functions for old tabbed upgrade panel (Arcade Mode)
export function updateTabbedUpgradePanel(): void {
  if (gameState.currentMode !== 'arcade') return;
  
  const tabbedPanel = document.getElementById('tabbedUpgradePanel');
  if (!tabbedPanel) return;
  
  // Simple arcade mode upgrade panel - just show turret upgrades
  const currentTab = (window as any).currentUpgradeTab || 'turrets';
  
  let html = `
    <div class="tab-buttons" style="display: flex; margin-bottom: 15px;">
      <button onclick="window.switchUpgradeTab('turrets')" 
              style="flex: 1; padding: 8px; background: ${currentTab === 'turrets' ? '#0f0' : 'transparent'}; color: ${currentTab === 'turrets' ? '#000' : '#0f0'}; border: 1px solid #0f0; cursor: pointer;">
        TURRETS
      </button>
      <button onclick="window.switchUpgradeTab('global')" 
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
  
  html += `
    <div style="font-size: 11px; color: #888; margin-bottom: 15px;">
      Economic and tactical upgrades for all turrets
    </div>
    <div style="padding: 20px; text-align: center; color: #555;">
      Global upgrades are shown in the sidebar sections
    </div>
  `;
  
  return html;
}

// Legacy function for old sidebar (kept for Arcade Mode compatibility)
export function switchUpgradeTab(tab: string): void {
  (window as any).currentUpgradeTab = tab;
  if (gameState.currentMode === 'command') {
    (window as any).updatePanelTabbedContent?.();
  } else {
    updateTabbedUpgradePanel();
  }
}

// Update city upgrade panel (legacy for arcade mode)
export function updateCityUpgradePanel(): void {
  // In Command Mode, this is handled by the floating panel
  if (gameState.currentMode === 'command') return;
  
  // Arcade Mode: Update city upgrade buttons in the existing UI
  // This function is largely replaced by canvas-based city upgrade buttons
}

// Update turret upgrade panel (legacy for arcade mode)
export function updateTurretUpgradePanel(): void {
  // In Command Mode, this is handled by the floating panel
  if (gameState.currentMode === 'command') return;
  
  // Arcade Mode: Update is handled by the main upgrade table
}

// Make functions globally available for legacy compatibility
(window as any).updateTabbedUpgradePanel = updateTabbedUpgradePanel;
(window as any).switchUpgradeTab = switchUpgradeTab;
(window as any).updateCityUpgradePanel = updateCityUpgradePanel;
(window as any).updateTurretUpgradePanel = updateTurretUpgradePanel;
// Science Upgrades Tab Content Generation
import { gameState } from '@/systems/observableState';
import { createSectionHeader, COLORS } from '@/ui/uiUtils';
import { researchBranches, renderBranchUpgrades, getSelectedResearchBranch, setSelectedResearchBranch } from './research';

// Science upgrades tab content (unlocked after "Unlock Science")
export function getScienceUpgradesHTML(): string {
  const windowGlobalUpgrades = (window as any).globalUpgrades;
  let html = `
    <div>
  `;
  
  // Four Research Branches with FTL-style widgets
  html += `
    <div style="margin-bottom: 20px;">
      ${createSectionHeader('Research Branches', `rgb(${COLORS.scienceBlue})`)}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
  `;
  
  const selectedResearchBranch = getSelectedResearchBranch();
  
  researchBranches.forEach(branch => {
    const upgradeData = windowGlobalUpgrades[branch.id];
    const currentLevel = upgradeData?.level || 0;
    const cost = upgradeData?.cost || branch.baseCost;
    const canAfford = gameState.science >= cost;
    const isUnlocked = currentLevel > 0;
    const isSelected = selectedResearchBranch === branch.id;
    
    // Auto-select first unlocked branch if none selected
    if (!selectedResearchBranch && isUnlocked) {
      setSelectedResearchBranch(branch.id);
    }
    
    // Create selectable branch button
    let buttonStyle = '';
    let clickAction = '';
    
    if (!isUnlocked) {
      // Not unlocked - purchasable button
      buttonStyle = `color: rgb(${branch.color}); border-color: rgb(${branch.color}); background: rgba(${branch.color}, ${canAfford ? '0.2' : '0.1'}); opacity: ${canAfford ? '1' : '0.6'};`;
      clickAction = `data-action="purchase-global" data-action-data="${branch.id}" data-auto-select="${branch.id}"`;
    } else if (isSelected) {
      // Selected branch - highlighted
      buttonStyle = `color: rgb(${branch.color}); border-color: rgb(${branch.color}); background: rgba(${branch.color}, 0.4); border-width: 2px;`;
      clickAction = `onclick="selectResearchBranch('${branch.id}')"`;
    } else {
      // Unlocked but not selected - selectable  
      buttonStyle = `color: rgb(${branch.color}); border-color: rgb(${branch.color}); background: rgba(${branch.color}, 0.15);`;
      clickAction = `onclick="selectResearchBranch('${branch.id}')"`;
    }
    
    const statusText = !isUnlocked ? `<br><small>${cost}🧪</small>` : isSelected ? '<br><small>SELECTED</small>' : '<br><small>CLICK TO SELECT</small>';
    
    html += `
      <button ${clickAction}
              class="upgrade-btn-compact tooltip"
              style="${buttonStyle}"
              data-tooltip="${branch.description}">
          <strong>${branch.icon} ${branch.name}</strong>
          ${statusText}
      </button>
    `;
  });
  
  html += '</div></div>';
  
  // Show selected branch's upgrades (if any branch is selected and unlocked)
  if (selectedResearchBranch) {
    const selectedBranchData = windowGlobalUpgrades[selectedResearchBranch];
    const branchUnlocked = selectedBranchData?.level > 0;
    
    if (branchUnlocked) {
      const branchInfo = researchBranches.find(b => b.id === selectedResearchBranch);
      if (branchInfo) {
        html += `
          <div style="margin-bottom: 20px;">
            ${createSectionHeader(`${branchInfo.icon} ${branchInfo.name} Upgrades`, `rgb(${branchInfo.color})`)}
            <div class="compact-grid-2">
        `;
        
        // Show upgrades for selected branch
        html += renderBranchUpgrades(selectedResearchBranch, windowGlobalUpgrades);
        
        html += '</div></div>';
      }
    }
  }
  
  html += '</div>';
  return html;
}

// Make globally available for compatibility
(window as any).getScienceUpgradesHTML = getScienceUpgradesHTML;
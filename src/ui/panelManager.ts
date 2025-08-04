// Panel Management for Command Mode floating upgrade panel
import { gameState } from '@/systems/observableState';
import { globalUpgrades } from '@/core/upgrades';

let isDragging = false;

// Global event delegation for all upgrade panel actions
export function initializeGlobalEventDelegation(): void {
  // Remove existing listener to avoid duplicates
  document.removeEventListener('click', handleUpgradePanelActions);
  
  // Add global event delegation
  document.addEventListener('click', handleUpgradePanelActions);
}

// Handle all upgrade panel actions through event delegation
function handleUpgradePanelActions(event: Event): void {
  const target = event.target as HTMLElement;
  const sidebar = document.getElementById('upgradePanel');
  
  const button = target.closest('[data-action]') as HTMLElement;
  if (!button) return;
  
  // Only handle clicks within the sidebar (either regular content or expanded content)
  if (!sidebar || !sidebar.contains(button)) return;
  
  // Check if button is disabled (using our custom data-disabled attribute)
  if (button.getAttribute('data-disabled') === 'true') {
    event.preventDefault();
    event.stopPropagation();
    return; // Don't execute action on disabled buttons
  }
  
  event.preventDefault();
  event.stopPropagation();
  
  const action = button.getAttribute('data-action');
  const actionData = button.getAttribute('data-action-data');
  
  try {
    switch (action) {
      case 'select-city':
        const cityIndex = parseInt(actionData || '0');
        if (!isNaN(cityIndex)) {
          (window as any).selectEntity('city', cityIndex);
          markPanelDirty(); // Force immediate update
        }
        break;
        
      case 'select-turret':
        const turretIndex = parseInt(actionData || '0');
        if (!isNaN(turretIndex)) {
          (window as any).selectEntity('turret', turretIndex);
          markPanelDirty(); // Force immediate update
        }
        break;
        
      case 'upgrade-turret':
        if (actionData) {
          const [upgradeType, launcherIndex] = actionData.split(',');
          (window as any).upgrade(upgradeType, parseInt(launcherIndex));
          markPanelDirty(); // Force immediate update
        }
        break;
        
      case 'unlock-upgrade-path':
        if (actionData) {
          const [pathType, pathCost] = actionData.split(',');
          (window as any).unlockUpgradePath(pathType, parseInt(pathCost));
          markPanelDirty(); // Force immediate update
        }
        break;
        
      case 'purchase-global':
        if (actionData) {
          (window as any).purchaseGlobalUpgrade(actionData);
          
          // Check if this purchase should auto-select a research branch
          const autoSelectId = target.getAttribute('data-auto-select');
          if (autoSelectId) {
            // Auto-select the newly purchased research branch
            (window as any).selectResearchBranch(autoSelectId);
          }
          
          markPanelDirty(); // Force immediate update
        }
        break;
        
      case 'emergency-ammo':
        (window as any).emergencyAmmoPurchase();
        markPanelDirty(); // Force immediate update
        break;
        
      case 'set-production':
        if (actionData) {
          const [cityIdx, mode] = actionData.split(',');
          (window as any).setCityProductionMode(parseInt(cityIdx), mode);
          markPanelDirty(); // Force immediate update
        }
        break;
        
      case 'upgrade-city-population':
        if (actionData) {
          (window as any).upgradeCityPopulation(parseInt(actionData));
          markPanelDirty(); // Force immediate update
        }
        break;
        
      case 'upgrade-city-productivity':
        if (actionData) {
          const [cityIdxProd, prodType] = actionData.split(',');
          (window as any).upgradeCityProductivity(parseInt(cityIdxProd), prodType);
          markPanelDirty(); // Force immediate update
        }
        break;
        
      case 'repair-city':
        if (actionData) {
          (window as any).repairCity(parseInt(actionData));
          markPanelDirty(); // Force immediate update
        }
        break;
        
      case 'build-city':
        (window as any).buildCity();
        markPanelDirty(); // Force immediate update
        break;
        
      case 'build-turret':
        (window as any).buildTurret();
        markPanelDirty(); // Force immediate update
        break;
        
      default:
        console.warn(`Unknown panel action: ${action}`);
    }
  } catch (error) {
    console.error(`Error executing panel action ${action}:`, error);
  }
}

// Make panel draggable
function makePanelDraggable(): void {
  const panel = document.getElementById('commandUpgradePanel');
  const header = document.getElementById('panelHeader');
  
  if (!panel || !header) return;
  
  let startX: number, startY: number, startLeft: number, startTop: number;
  
  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = panel.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    
    panel.style.cursor = 'grabbing';
    header.style.cursor = 'grabbing';
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    let newLeft = startLeft + deltaX;
    let newTop = startTop + deltaY;
    
    // Keep panel within viewport bounds
    const panelRect = panel.getBoundingClientRect();
    const maxLeft = window.innerWidth - panelRect.width;
    const maxTop = window.innerHeight - panelRect.height;
    
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    
    panel.style.left = newLeft + 'px';
    panel.style.top = newTop + 'px';
    panel.style.right = 'auto';
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      panel.style.cursor = '';
      header.style.cursor = 'move';
    }
  });
}

// Open Command panel
export function openCommandPanel(): void {
  if (gameState.currentMode !== 'command') return;
  
  const panel = document.getElementById('commandUpgradePanel');
  const toggleButton = document.getElementById('command-upgrade-toggle');
  
  if (panel && toggleButton) {
    panel.style.display = 'flex';
    panel.classList.remove('minimized');
    toggleButton.style.display = 'none';
    
    // Initialize with Global tab if not already set
    if (!(window as any).currentUpgradeTab) {
      (window as any).currentUpgradeTab = 'global';
    }
    
    // Update panel content
    updateCommandPanel();
    
    // Make panel draggable
    makePanelDraggable();
  }
}

// Close Command panel
export function closeCommandPanel(): void {
  const panel = document.getElementById('commandUpgradePanel');
  const toggleButton = document.getElementById('command-upgrade-toggle');
  
  if (panel && toggleButton) {
    panel.style.display = 'none';
    toggleButton.style.display = 'block';
  }
}

// Toggle Command panel minimized state
export function toggleCommandPanel(): void {
  const panel = document.getElementById('commandUpgradePanel');
  if (panel) {
    panel.classList.toggle('minimized');
  }
}

// Mark panel as needing update (called by actions that change the UI)
export function markPanelDirty(): void {
  // Update sidebar content instead of panel content
  const updateSidebarContent = (window as any).updateSidebarContent;
  if (typeof updateSidebarContent === 'function') {
    updateSidebarContent(true); // Force immediate update for user actions
  }
  
  // Also update main UI to refresh resource displays
  const updateUI = (window as any).updateUI;
  if (typeof updateUI === 'function') {
    updateUI();
  }
  
  // Refresh tooltips after content changes
  setTimeout(() => {
    if ((window as any).refreshTooltips) {
      (window as any).refreshTooltips();
    }
  }, 50); // Small delay to let DOM settle
}

// Update Command panel content (simplified with observable state)
export function updateCommandPanel(): void {
  if (gameState.currentMode !== 'command') return;
  
  const panelBody = document.getElementById('commandPanelBody');
  if (!panelBody) return;
  
  // Header values are automatically updated by observable state
  const panelScienceRow = document.getElementById('panel-science-row');
  if (panelScienceRow) {
    panelScienceRow.style.display = (globalUpgrades.research && globalUpgrades.research.level > 0) ? 'block' : 'none';
  }
  
  // Always rebuild content when explicitly requested
  updatePanelTabbedContent();
  
  // Refresh tooltips after updating command panel
  if ((window as any).refreshTooltips) {
    (window as any).refreshTooltips();
  }
}


// Update panel tabbed content (full recreation)
export function updatePanelTabbedContent(): void {
  const panelBody = document.getElementById('commandPanelBody');
  if (!panelBody) return;
  
  const currentTab = (window as any).currentUpgradeTab || 'global';
  
  // Clear the panel body first
  panelBody.innerHTML = '';
  
  // Create tab buttons container
  const tabButtonsContainer = document.createElement('div');
  tabButtonsContainer.className = 'panel-tab-buttons';
  tabButtonsContainer.style.cssText = 'display: flex; border-bottom: 1px solid #0f0; background: rgba(0, 255, 0, 0.05);';
  
  // Create individual tab buttons
  const tabs = [
    { id: 'global', label: 'GLOBAL' },
    { id: 'turrets', label: 'TURRETS' }, 
    { id: 'cities', label: 'CITIES' }
  ];
  
  tabs.forEach(tabInfo => {
    const isActive = currentTab === tabInfo.id;
    const button = document.createElement('button');
    button.textContent = tabInfo.label;
    button.style.cssText = `
      flex: 1; 
      padding: 12px; 
      background: ${isActive ? '#0f0' : 'transparent'}; 
      color: ${isActive ? '#000' : '#0f0'}; 
      border: none; 
      cursor: pointer;
      border-radius: 0;
      font-weight: bold; 
      font-size: 14px; 
      transition: all 0.2s ease;
      text-transform: uppercase;
    `;
    
    // Add click handler directly
    button.onclick = () => {
      (window as any).currentUpgradeTab = tabInfo.id;
      markPanelDirty(); // Rebuild tabs and content
      updateCommandPanel(); // Force immediate update
    };
    
    // Add hover effect for inactive tabs
    if (!isActive) {
      button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(0, 255, 0, 0.1)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.background = 'transparent';
      });
    }
    
    tabButtonsContainer.appendChild(button);
  });
  
  // Create content container with scrolling
  const contentContainer = document.createElement('div');
  contentContainer.style.cssText = 'flex: 1; padding: 15px; overflow-y: auto; overflow-x: hidden;';
  
  // Add containers to panel body
  panelBody.appendChild(tabButtonsContainer);
  panelBody.appendChild(contentContainer);
  
  // Generate content HTML based on current tab
  let contentHtml = '';
  if (currentTab === 'global') {
    contentHtml = (window as any).getGlobalUpgradesHTML();
  } else if (currentTab === 'turrets') {
    contentHtml = (window as any).getTurretsUpgradesHTML();
  } else if (currentTab === 'cities') {
    contentHtml = (window as any).getCitiesUpgradesHTML();
  }
  
  // Set content
  contentContainer.innerHTML = contentHtml;
}

// Switch between panel tabs
export function switchPanelTab(tab: string): void {
  (window as any).currentUpgradeTab = tab;
  updatePanelTabbedContent();
}

// Initialize global event delegation immediately
initializeGlobalEventDelegation();

// Make functions globally accessible immediately
(window as any).openCommandPanel = openCommandPanel;
(window as any).closeCommandPanel = closeCommandPanel;
(window as any).toggleCommandPanel = toggleCommandPanel;
(window as any).updateCommandPanel = updateCommandPanel;
(window as any).switchPanelTab = switchPanelTab;
(window as any).markPanelDirty = markPanelDirty;
(window as any).initializeGlobalEventDelegation = initializeGlobalEventDelegation;
(window as any).updatePanelTabbedContent = updatePanelTabbedContent;

// Functions are already exported individually above
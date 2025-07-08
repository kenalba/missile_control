// Panel Management for Command Mode floating upgrade panel

let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Global event delegation for all upgrade panel actions
function initializeGlobalEventDelegation() {
    // Remove existing listener to avoid duplicates
    document.removeEventListener('click', handleUpgradePanelActions);
    
    // Add global event delegation
    document.addEventListener('click', handleUpgradePanelActions);
}

// Handle all upgrade panel actions through event delegation
function handleUpgradePanelActions(event) {
    const target = event.target;
    const panel = document.getElementById('commandUpgradePanel');
    
    const button = target.closest('[data-action]');
    if (!button) return;
    
    // Only handle clicks within the command upgrade panel
    if (!panel || !panel.contains(button)) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const action = button.getAttribute('data-action');
    const actionData = button.getAttribute('data-action-data');
    
    try {
        switch (action) {
            case 'select-city':
                const cityIndex = parseInt(actionData);
                if (!isNaN(cityIndex)) {
                    window.selectEntity('city', cityIndex);
                    markPanelDirty(); // Force immediate update
                }
                break;
                
            case 'select-turret':
                const turretIndex = parseInt(actionData);
                if (!isNaN(turretIndex)) {
                    window.selectEntity('turret', turretIndex);
                    markPanelDirty(); // Force immediate update
                }
                break;
                
            case 'upgrade-turret':
                const [upgradeType, launcherIndex] = actionData.split(',');
                window.upgrade(upgradeType, parseInt(launcherIndex));
                markPanelDirty(); // Force immediate update
                break;
                
            case 'purchase-global':
                window.purchaseGlobalUpgrade(actionData);
                markPanelDirty(); // Force immediate update
                break;
                
            case 'emergency-ammo':
                window.emergencyAmmoPurchase();
                markPanelDirty(); // Force immediate update
                break;
                
            case 'set-production':
                const [cityIdx, mode] = actionData.split(',');
                window.setCityProductionMode(parseInt(cityIdx), mode);
                markPanelDirty(); // Force immediate update
                break;
                
            case 'upgrade-city-population':
                window.upgradeCityPopulation(parseInt(actionData));
                markPanelDirty(); // Force immediate update
                break;
                
            case 'upgrade-city-productivity':
                const [cityIdxProd, prodType] = actionData.split(',');
                window.upgradeCityProductivity(parseInt(cityIdxProd), prodType);
                markPanelDirty(); // Force immediate update
                break;
                
            case 'repair-city':
                window.repairCity(parseInt(actionData));
                markPanelDirty(); // Force immediate update
                break;
                
            case 'build-city':
                window.buildCity();
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
function makePanelDraggable() {
    const panel = document.getElementById('commandUpgradePanel');
    const header = document.getElementById('panelHeader');
    
    if (!panel || !header) return;
    
    let startX, startY, startLeft, startTop;
    
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
function openCommandPanel() {
    if (gameState.currentMode !== 'command') return;
    
    const panel = document.getElementById('commandUpgradePanel');
    const toggleButton = document.getElementById('command-upgrade-toggle');
    
    if (panel && toggleButton) {
        panel.style.display = 'flex';
        panel.classList.remove('minimized');
        toggleButton.style.display = 'none';
        
        // Initialize with Global tab if not already set
        if (!window.currentUpgradeTab) {
            window.currentUpgradeTab = 'global';
        }
        
        // Update panel content
        updateCommandPanel();
        
        // Make panel draggable
        makePanelDraggable();
    }
}

// Close Command panel
function closeCommandPanel() {
    const panel = document.getElementById('commandUpgradePanel');
    const toggleButton = document.getElementById('command-upgrade-toggle');
    
    if (panel && toggleButton) {
        panel.style.display = 'none';
        toggleButton.style.display = 'block';
    }
}

// Toggle Command panel minimized state
function toggleCommandPanel() {
    const panel = document.getElementById('commandUpgradePanel');
    if (panel) {
        panel.classList.toggle('minimized');
    }
}

// Simple dirty flag system - much more efficient
let panelNeedsUpdate = true;

// Mark panel as needing update (called by actions that change the UI)
function markPanelDirty() {
    panelNeedsUpdate = true;
}

// Track population to detect changes that affect production display
let lastPopulationCheck = 0;
let lastScrapCheck = 0;
let lastScienceCheck = 0;

// Update Command panel content
function updateCommandPanel() {
    if (gameState.currentMode !== 'command') return;
    
    const panelBody = document.getElementById('commandPanelBody');
    if (!panelBody) return;
    
    // Check if population changed (affects production rate display)
    let currentPopulation = 0;
    for (let i = 0; i < cityData.length; i++) {
        currentPopulation += cityData[i].population;
    }
    
    // Mark dirty if population changed significantly (more than 0.5 total)
    if (Math.abs(currentPopulation - lastPopulationCheck) > 0.5) {
        panelNeedsUpdate = true;
        lastPopulationCheck = currentPopulation;
    }
    
    // Check if scrap/science changed significantly (affects button affordability)
    if (Math.abs(gameState.scrap - lastScrapCheck) >= 5) { // Less frequent updates
        panelNeedsUpdate = true;
        lastScrapCheck = gameState.scrap;
    }
    
    if (Math.abs(gameState.science - lastScienceCheck) >= 2) { // Less frequent updates
        panelNeedsUpdate = true;
        lastScienceCheck = gameState.science;
    }
    
    // Always update lightweight header values
    const panelScrap = document.getElementById('panel-scrap');
    const panelScience = document.getElementById('panel-science');
    const panelScienceRow = document.getElementById('panel-science-row');
    
    if (panelScrap) panelScrap.textContent = gameState.scrap;
    if (panelScience) panelScience.textContent = gameState.science;
    if (panelScienceRow) {
        panelScienceRow.style.display = (globalUpgrades.research && globalUpgrades.research.level > 0) ? 'block' : 'none';
    }
    
    // Always rebuild both tabs and content when panel needs update
    if (panelNeedsUpdate) {
        updatePanelTabbedContent();
        panelNeedsUpdate = false;
    }
}

// Update panel tabbed content (full recreation)
function updatePanelTabbedContent() {
    const panelBody = document.getElementById('commandPanelBody');
    if (!panelBody) return;
    
    const currentTab = window.currentUpgradeTab || 'global';
    
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
            font-size: 13px; 
            transition: all 0.2s ease;
            text-transform: uppercase;
        `;
        
        // Add click handler directly
        button.onclick = () => {
            window.currentUpgradeTab = tabInfo.id;
            markPanelDirty(); // Rebuild tabs and content
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
        contentHtml = getGlobalUpgradesHTML();
    } else if (currentTab === 'turrets') {
        contentHtml = getTurretsUpgradesHTML();
    } else if (currentTab === 'cities') {
        contentHtml = getCitiesUpgradesHTML();
    }
    
    // Set content
    contentContainer.innerHTML = contentHtml;
}

// Switch between panel tabs
function switchPanelTab(tab) {
    window.currentUpgradeTab = tab;
    updatePanelTabbedContent();
}

// Initialize global event delegation immediately
initializeGlobalEventDelegation();

// Make functions globally accessible immediately
window.openCommandPanel = openCommandPanel;
window.closeCommandPanel = closeCommandPanel;
window.toggleCommandPanel = toggleCommandPanel;
window.updateCommandPanel = updateCommandPanel;
window.switchPanelTab = switchPanelTab;
window.markPanelDirty = markPanelDirty;
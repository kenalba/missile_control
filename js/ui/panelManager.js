// Panel Management for Command Mode floating upgrade panel

let isDragging = false;
let dragOffset = { x: 0, y: 0 };

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

// Update Command panel content
function updateCommandPanel() {
    if (gameState.currentMode !== 'command') return;
    
    const panelBody = document.getElementById('commandPanelBody');
    if (!panelBody) return;
    
    // Update status in panel header
    const panelScrap = document.getElementById('panel-scrap');
    const panelScience = document.getElementById('panel-science');
    const panelScienceRow = document.getElementById('panel-science-row');
    
    if (panelScrap) panelScrap.textContent = gameState.scrap;
    if (panelScience) panelScience.textContent = gameState.science;
    if (panelScienceRow) {
        panelScienceRow.style.display = (globalUpgrades.research && globalUpgrades.research.level > 0) ? 'block' : 'none';
    }
    
    // Generate tabbed interface content
    updatePanelTabbedContent();
}

// Update panel tabbed content
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
        const button = createTabButton(tabInfo, currentTab, switchPanelTab);
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

// Make functions globally accessible
window.openCommandPanel = openCommandPanel;
window.closeCommandPanel = closeCommandPanel;
window.toggleCommandPanel = toggleCommandPanel;
window.updateCommandPanel = updateCommandPanel;
window.switchPanelTab = switchPanelTab;
// Upgrade system

// Floating panel control functions - make globally accessible
window.openCommandPanel = function() {
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
        window.updateCommandPanel();
        
        // Make panel draggable
        makePanelDraggable();
    }
}

window.closeCommandPanel = function() {
    const panel = document.getElementById('commandUpgradePanel');
    const toggleButton = document.getElementById('command-upgrade-toggle');
    
    if (panel && toggleButton) {
        panel.style.display = 'none';
        toggleButton.style.display = 'block';
    }
}

window.toggleCommandPanel = function() {
    const panel = document.getElementById('commandUpgradePanel');
    if (panel) {
        panel.classList.toggle('minimized');
    }
}

// Update the Command Mode panel content - make globally accessible
window.updateCommandPanel = function() {
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
    window.updatePanelTabbedContent();
}

// Create panel tabbed interface content - make globally accessible
window.updatePanelTabbedContent = function() {
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
        const button = document.createElement('button');
        button.textContent = tabInfo.label;
        button.style.cssText = `
            flex: 1; 
            padding: 12px; 
            background: ${currentTab === tabInfo.id ? '#0f0' : 'transparent'}; 
            color: ${currentTab === tabInfo.id ? '#000' : '#0f0'}; 
            border: none; 
            cursor: pointer;
            border-radius: 0;
            font-weight: bold; 
            font-size: 13px; 
            transition: all 0.2s ease;
            text-transform: uppercase;
        `;
        
        // Add hover effect
        button.addEventListener('mouseenter', () => {
            if (currentTab !== tabInfo.id) {
                button.style.background = 'rgba(0, 255, 0, 0.1)';
            }
        });
        
        button.addEventListener('mouseleave', () => {
            if (currentTab !== tabInfo.id) {
                button.style.background = 'transparent';
            }
        });
        
        // Add click event listener
        button.addEventListener('click', () => {
            window.switchPanelTab(tabInfo.id);
        });
        
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

// Switch between panel tabs - make globally accessible
window.switchPanelTab = function(tab) {
    window.currentUpgradeTab = tab;
    window.updatePanelTabbedContent();
}

// Legacy function for old sidebar (kept for Arcade Mode compatibility)
window.switchUpgradeTab = function(tab) {
    window.currentUpgradeTab = tab;
    if (gameState.currentMode === 'command') {
        window.updatePanelTabbedContent();
    } else {
        // For arcade mode, keep old behavior if needed
        window.updateTabbedUpgradePanel();
    }
}


// Standardized button styles for consistency across all tabs
const BUTTON_STYLES = {
    base: 'padding: 10px; border-radius: 3px; font-weight: bold; font-size: 14px; cursor: pointer; transition: all 0.2s ease;',
    available: (color) => `background: rgba(${color}, 0.2); color: ${color}; border: 1px solid ${color};`,
    disabled: 'background: rgba(128, 128, 128, 0.2); color: #888; border: 1px solid #888; cursor: not-allowed;',
    owned: (color) => `background: rgba(${color}, 0.1); color: ${color}; border: 1px solid ${color};`
};

const COLORS = {
    green: '0, 255, 0',
    blue: '0, 0, 255', 
    yellow: '255, 255, 0',
    cyan: '0, 255, 255',
    orange: '255, 128, 0',
    red: '255, 0, 0'
};

// Global upgrades tab content
function getGlobalUpgradesHTML() {
    let html = `
        <div>
        <h4 style="color: #0f0; margin-top: 0;">Global Command</h4>
        
        <!-- Emergency Actions Section -->
        <div style="margin-bottom: 20px;">
            <h5 style="color: #ff0; margin: 0 0 10px 0;">Emergency Actions</h5>
            <div style="display: flex; gap: 10px;">
    `;
    
    // Emergency Ammo Purchase Button
    const ammoExchangeRate = 3; // 3 scrap per ammo
    const canAffordAmmo = gameState.scrap >= ammoExchangeRate;
    html += `
                <button onclick="emergencyAmmoPurchase()" 
                        style="flex: 1; ${BUTTON_STYLES.base} ${canAffordAmmo ? BUTTON_STYLES.available(COLORS.yellow) : BUTTON_STYLES.disabled}"
                        ${!canAffordAmmo ? 'disabled' : ''}>
                    <strong>Emergency Ammo</strong><br>
                    <small>Buy 1 ammo for ${ammoExchangeRate} scrap</small>
                </button>
            </div>
        </div>
        
        <!-- Research & Technology Section -->
        <div style="margin-bottom: 20px;">
            <h5 style="color: #00f; margin: 0 0 10px 0;">Research & Technology</h5>
            <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
    `;
    
    // Research unlock upgrade
    const researchUnlocked = globalUpgrades.research && globalUpgrades.research.level > 0;
    const researchCost = globalUpgrades.research.cost;
    const canAffordResearch = gameState.scrap >= researchCost;
    
    if (!researchUnlocked) {
        html += `
                <button onclick="purchaseGlobalUpgrade('research')" 
                        style="${BUTTON_STYLES.base} ${canAffordResearch ? BUTTON_STYLES.available(COLORS.blue) : BUTTON_STYLES.disabled}"
                        ${!canAffordResearch ? 'disabled' : ''}>
                    <strong>Unlock Science</strong><br>
                    <small>Enable science production in cities</small><br>
                    <small>${researchCost} scrap</small>
                </button>
        `;
    } else {
        html += `
                <div style="${BUTTON_STYLES.base} ${BUTTON_STYLES.owned(COLORS.blue)} text-align: center;">
                    <strong style="color: #00f;">Science Unlocked</strong><br>
                    <small>Cities can now produce science</small>
                </div>
        `;
    }
    
    html += `
            </div>
        </div>
        
        <!-- Economic Upgrades Section -->
        <div style="margin-bottom: 20px;">
            <h5 style="color: #0f0; margin: 0 0 10px 0;">Economic Upgrades</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-width: 290px;">
    `;
    
    // Economic upgrades
    const economicUpgrades = [
        { id: 'scrapMultiplier', name: 'Scrap Multiplier', description: '+25% scrap from all sources' },
        { id: 'salvage', name: 'Salvage Operations', description: '+3 scrap from planes' },
        { id: 'efficiency', name: 'Efficiency', description: '15% discount on turret upgrades' }
    ];
    
    economicUpgrades.forEach(upgrade => {
        const upgradeData = globalUpgrades[upgrade.id];
        const isOwned = upgradeData && upgradeData.level > 0;
        const cost = upgradeData ? upgradeData.cost : 50;
        const canAfford = gameState.scrap >= cost;
        
        if (!isOwned) {
            html += `
                <button onclick="purchaseGlobalUpgrade('${upgrade.id}')" 
                        style="${BUTTON_STYLES.base} ${canAfford ? BUTTON_STYLES.available(COLORS.green) : BUTTON_STYLES.disabled}"
                        ${!canAfford ? 'disabled' : ''}>
                    <strong>${upgrade.name}</strong><br>
                    <small>${upgrade.description}</small><br>
                    <small>${cost} scrap</small>
                </button>
            `;
        } else {
            html += `
                <div style="${BUTTON_STYLES.base} ${BUTTON_STYLES.owned(COLORS.green)} text-align: center;">
                    <strong style="color: #0f0;">${upgrade.name}</strong><br>
                    <small>Owned</small>
                </div>
            `;
        }
    });
    
    html += `
            </div>
        </div>
        
        <!-- Combat Upgrades Section -->
        <div>
            <h5 style="color: #f80; margin: 0 0 10px 0;">Combat Upgrades</h5>
            <div style="display: grid; grid-template-columns: 1fr; gap: 8px; max-width: 290px;">
    `;
    
    // Combat upgrades
    const combatUpgrades = [
        { id: 'missileHighlight', name: 'Threat Detection', description: 'Highlight dangerous missiles' }
    ];
    
    combatUpgrades.forEach(upgrade => {
        const upgradeData = globalUpgrades[upgrade.id];
        const isOwned = upgradeData && upgradeData.level > 0;
        const cost = upgradeData ? upgradeData.cost : 50;
        const canAfford = gameState.scrap >= cost;
        
        if (!isOwned) {
            html += `
                <button onclick="purchaseGlobalUpgrade('${upgrade.id}')" 
                        style="${BUTTON_STYLES.base} ${canAfford ? BUTTON_STYLES.available(COLORS.orange) : BUTTON_STYLES.disabled}"
                        ${!canAfford ? 'disabled' : ''}>
                    <strong>${upgrade.name}</strong><br>
                    <small>${upgrade.description}</small><br>
                    <small>${cost} scrap</small>
                </button>
            `;
        } else {
            html += `
                <div style="${BUTTON_STYLES.base} ${BUTTON_STYLES.owned(COLORS.orange)} text-align: center;">
                    <strong style="color: #f80;">${upgrade.name}</strong><br>
                    <small>Owned</small>
                </div>
            `;
        }
    });
    
    html += `
            </div>
        </div>
        </div>
    `;
    
    return html;
}

// Emergency ammo purchase function - make globally accessible
window.emergencyAmmoPurchase = function() {
    const cost = 3; // 3 scrap per ammo
    if (gameState.scrap >= cost) {
        gameState.scrap -= cost;
        
        // Distribute 1 ammo to the turret with the least ammo
        let targetLauncher = null;
        let lowestAmmo = Infinity;
        
        for (let i = 0; i < launchers.length; i++) {
            if (!destroyedLaunchers.includes(i) && launchers[i].missiles < launchers[i].maxMissiles) {
                if (launchers[i].missiles < lowestAmmo) {
                    lowestAmmo = launchers[i].missiles;
                    targetLauncher = i;
                }
            }
        }
        
        if (targetLauncher !== null) {
            launchers[targetLauncher].missiles++;
            
            // Visual feedback
            upgradeEffects.push({
                x: launchers[targetLauncher].x,
                y: launchers[targetLauncher].y - 50,
                text: '+1 AMMO',
                alpha: 1,
                vy: -2,
                life: 80,
                color: '#ff0'
            });
        }
        
        // Update the panel to refresh costs
        if (gameState.currentMode === 'command') {
            window.updateCommandModal();
        } else {
            window.updateTabbedUpgradePanel();
        }
    }
}

// Turrets upgrades tab content
function getTurretsUpgradesHTML() {
    let html = `
        <div>
        <h4 style="color: #0ff; margin-top: 0;">Turret Upgrades</h4>
        <p style="color: #aaa; margin-bottom: 15px;">Select turrets on the battlefield to see individual upgrade options.</p>
        
        <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
    `;
    
    // Show all available turrets
    launchers.forEach((launcher, index) => {
        if (destroyedLaunchers.includes(index)) return;
        
        const upgrades = launcherUpgrades[index];
        const totalLevel = (upgrades.speed.level - 1) + (upgrades.explosion.level - 1) + 
                          (upgrades.rate.level - 1) + (upgrades.capacity.level - 1) + upgrades.autopilot.level;
        
        html += `
            <div style="padding: 10px; background: rgba(0, 255, 255, 0.1); border: 1px solid #0ff; border-radius: 3px;">
                <h5 style="color: #0ff; margin: 0 0 10px 0;">Turret ${index + 1}</h5>
                <p style="margin: 5px 0; color: #aaa;">Ammo: ${launcher.missiles}/${launcher.maxMissiles}</p>
                <p style="margin: 5px 0; color: #aaa;">Total Upgrades: ${totalLevel}</p>
                <button onclick="selectEntity('turret', ${index})" 
                        style="width: 100%; ${BUTTON_STYLES.base} ${BUTTON_STYLES.available(COLORS.cyan)}">
                    Select Turret
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    
    // If a turret is selected, show its upgrade options
    if (gameState.commandMode.selectedEntityType === 'turret' && gameState.commandMode.selectedEntity !== null) {
        const turretIndex = gameState.commandMode.selectedEntity;
        const upgrades = launcherUpgrades[turretIndex];
        
        html += `
            <hr style="border-color: #0ff; margin: 20px 0;">
            <h5 style="color: #0ff;">Turret ${turretIndex + 1} Upgrades</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
        `;
        
        const turretUpgrades = [
            { id: 'speed', name: 'Speed', description: 'Faster missile velocity' },
            { id: 'explosion', name: 'Explosion', description: 'Larger blast radius' },
            { id: 'rate', name: 'Fire Rate', description: 'Faster reload time' },
            { id: 'capacity', name: 'Capacity', description: 'More missiles per reload' },
            { id: 'autopilot', name: 'Autopilot', description: 'Smart missile guidance' }
        ];
        
        turretUpgrades.forEach(upgrade => {
            const upgradeData = upgrades[upgrade.id];
            const cost = getActualUpgradeCost(upgradeData.cost);
            const canAfford = gameState.scrap >= cost;
            
            html += `
                <button onclick="upgrade('${upgrade.id}', ${turretIndex})" 
                        style="${BUTTON_STYLES.base} ${canAfford ? BUTTON_STYLES.available(COLORS.cyan) : BUTTON_STYLES.disabled}"
                        ${!canAfford ? 'disabled' : ''}>
                    <strong>${upgrade.name}</strong><br>
                    <small>Lv.${upgradeData.level}</small><br>
                    <small>${upgrade.description}</small><br>
                    <small>${cost} scrap</small>
                </button>
            `;
        });
        
        html += '</div>';
    }
    
    return html + '</div>';
}

// Cities upgrades tab content
function getCitiesUpgradesHTML() {
    let html = `
        <div>
        <h4 style="color: #0f0; margin-top: 0;">City Management</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
    `;
    
    // Show all available cities
    cityPositions.forEach((x, index) => {
        if (destroyedCities.includes(index)) {
            html += `
                <div style="padding: 10px; background: rgba(255, 0, 0, 0.1); border: 1px solid #f00; border-radius: 3px;">
                    <h5 style="color: #f00; margin: 0 0 10px 0;">City ${index + 1}</h5>
                    <p style="margin: 5px 0; color: #f00;">ABANDONED</p>
                    <button onclick="selectEntity('city', ${index})" 
                            style="width: 100%; ${BUTTON_STYLES.base} ${BUTTON_STYLES.disabled}">
                        Rebuild (Coming Soon)
                    </button>
                </div>
            `;
        } else {
            const city = cityData[index];
            const populationPercent = Math.floor((city.population / city.maxPopulation) * 100);
            
            html += `
                <div style="padding: 10px; background: rgba(0, 255, 0, 0.1); border: 1px solid #0f0; border-radius: 3px;">
                    <h5 style="color: #0f0; margin: 0 0 10px 0;">City ${index + 1}</h5>
                    <p style="margin: 5px 0; color: #aaa;">Population: ${Math.floor(city.population)}/${city.maxPopulation} (${populationPercent}%)</p>
                    <p style="margin: 5px 0; color: #aaa;">Producing: ${city.productionMode.toUpperCase()}</p>
                    <button onclick="selectEntity('city', ${index})" 
                            style="width: 100%; ${BUTTON_STYLES.base} ${BUTTON_STYLES.available(COLORS.green)}">
                        Manage City
                    </button>
                </div>
            `;
        }
    });
    
    html += '</div>';
    
    // If a city is selected, show its management options
    if (gameState.commandMode.selectedEntityType === 'city' && gameState.commandMode.selectedEntity !== null) {
        const cityIndex = gameState.commandMode.selectedEntity;
        if (!destroyedCities.includes(cityIndex)) {
            const city = cityData[cityIndex];
            
            html += `
                <hr style="border-color: #0f0; margin: 20px 0;">
                <h5 style="color: #0f0;">City ${cityIndex + 1} Management</h5>
                
                <h6 style="color: #0f0; margin: 15px 0 10px 0;">Production Mode:</h6>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            `;
            
            const modes = [
                { id: 'scrap', name: 'Scrap', color: '#0f0', description: 'Raw materials for upgrades' },
                { id: 'ammo', name: 'Ammo', color: '#ff0', description: 'Ammunition for turrets' }
            ];
            
            // Add science if unlocked
            if (globalUpgrades.research && globalUpgrades.research.level > 0) {
                modes.push({ id: 'science', name: 'Science', color: '#00f', description: 'Research for advanced upgrades' });
            }
            
            modes.forEach(mode => {
                const isSelected = city.productionMode === mode.id;
                html += `
                    <button onclick="setCityProductionMode(${cityIndex}, '${mode.id}')" 
                            style="flex: 1; ${BUTTON_STYLES.base} ${isSelected ? `background: ${mode.color}; color: #000;` : `background: transparent; color: ${mode.color};`} border: 1px solid ${mode.color}; opacity: ${isSelected ? '1' : '0.7'};"
                            title="${mode.description}">
                        ${mode.name}
                    </button>
                `;
            });
            
            html += `
                </div>
                
                <h6 style="color: #0f0; margin: 15px 0 10px 0;">City Upgrades:</h6>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            `;
            
            // City-specific upgrades (placeholder for now)
            const cityUpgradesList = [
                { id: 'population', name: 'Max Population', cost: 50, description: 'Increase maximum population by 50' },
                { id: 'efficiency', name: 'Production Rate', cost: 75, description: 'Increase production rate by 50%' },
                { id: 'defense', name: 'Population Shield', cost: 100, description: 'Reduce missile damage by 25%' }
            ];
            
            cityUpgradesList.forEach(upgrade => {
                const canAfford = gameState.scrap >= upgrade.cost;
                html += `
                    <button onclick="upgradeCityFeature(${cityIndex}, '${upgrade.id}')" 
                            style="${BUTTON_STYLES.base} ${canAfford ? BUTTON_STYLES.available(COLORS.green) : BUTTON_STYLES.disabled}"
                            ${!canAfford ? 'disabled' : ''}
                            title="${upgrade.description}">
                        <strong>${upgrade.name}</strong><br>
                        <small>${upgrade.cost} scrap</small>
                    </button>
                `;
            });
            
            html += '</div>';
        }
    }
    
    return html + '</div>';
}

// Purchase global upgrade - make globally accessible
window.purchaseGlobalUpgrade = function(upgradeId) {
    const upgrade = globalUpgrades[upgradeId];
    if (!upgrade || upgrade.level > 0) return;
    
    if (gameState.scrap >= upgrade.cost) {
        gameState.scrap -= upgrade.cost;
        upgrade.level = 1;
        
        // Visual feedback
        upgradeEffects.push({
            x: canvas.width / 2,
            y: 400,
            text: `${upgradeId.toUpperCase()} UNLOCKED!`,
            alpha: 1,
            vy: -2,
            life: 120,
            color: '#00ff00'
        });
        
        // Update the panel
        if (gameState.currentMode === 'command') {
            window.updateCommandPanel();
        } else {
            window.updateTabbedUpgradePanel();
        }
    }
}

// Update city upgrade panel
function updateCityUpgradePanel(panel, cityIndex) {
    if (destroyedCities.includes(cityIndex)) {
        panel.innerHTML = `
            <h4 style="color: #f00;">ABANDONED CITY</h4>
            <p>This city has been abandoned due to population loss.</p>
            <p>Consider building new cities to expand your empire.</p>
        `;
        return;
    }
    
    const city = cityData[cityIndex];
    const populationPercent = Math.floor((city.population / city.maxPopulation) * 100);
    
    let html = `
        <h4 style="color: #0f0;">CITY ${cityIndex + 1}</h4>
        <p>Population: ${Math.floor(city.population)}/${city.maxPopulation} (${populationPercent}%)</p>
        <p>Production: ${city.productionMode} (+${city.baseProduction}/tick)</p>
        <hr style="border-color: #0f0; margin: 10px 0;">
        
        <h5>Production Mode:</h5>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
    `;
    
    // Production mode buttons
    const modes = [
        { id: 'scrap', name: 'Scrap', color: '#0f0', description: 'Raw materials for upgrades' },
        { id: 'ammo', name: 'Ammo', color: '#ff0', description: 'Ammunition for turrets' }
    ];
    
    // Add science only if research upgrade is unlocked
    if (globalUpgrades.research && globalUpgrades.research.level > 0) {
        modes.push({ id: 'science', name: 'Science', color: '#00f', description: 'Research for advanced upgrades' });
    }
    
    modes.forEach(mode => {
        const isSelected = city.productionMode === mode.id;
        const buttonStyle = `
            background: ${isSelected ? mode.color : 'transparent'};
            color: ${isSelected ? '#000' : mode.color};
            border: 1px solid ${mode.color};
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 3px;
            opacity: ${isSelected ? '1' : '0.7'};
        `;
        
        html += `
            <button onclick="setCityProductionMode(${cityIndex}, '${mode.id}')" 
                    style="${buttonStyle}" 
                    title="${mode.description}">
                ${mode.name}
            </button>
        `;
    });
    
    html += `
        </div>
        <hr style="border-color: #0f0; margin: 10px 0;">
        
        <h5>City Upgrades:</h5>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
    `;
    
    // City upgrade buttons
    const cityUpgrades = [
        { id: 'population', name: 'Max Population', cost: 50, description: 'Increase maximum population by 50' },
        { id: 'efficiency', name: 'Production Rate', cost: 75, description: 'Increase production rate by 50%' },
        { id: 'defense', name: 'Population Shield', cost: 100, description: 'Reduce missile damage by 25%' }
    ];
    
    cityUpgrades.forEach(upgrade => {
        const canAfford = gameState.scrap >= upgrade.cost;
        const buttonStyle = `
            background: ${canAfford ? 'rgba(0, 255, 0, 0.2)' : 'rgba(128, 128, 128, 0.2)'};
            color: ${canAfford ? '#0f0' : '#888'};
            border: 1px solid ${canAfford ? '#0f0' : '#888'};
            padding: 8px 12px;
            cursor: ${canAfford ? 'pointer' : 'not-allowed'};
            border-radius: 3px;
            opacity: ${canAfford ? '1' : '0.5'};
        `;
        
        html += `
            <button onclick="${canAfford ? `upgradeCityFeature(${cityIndex}, '${upgrade.id}')` : ''}" 
                    style="${buttonStyle}" 
                    title="${upgrade.description}"
                    ${!canAfford ? 'disabled' : ''}>
                ${upgrade.name}<br><small>${upgrade.cost} scrap</small>
            </button>
        `;
    });
    
    html += '</div>';
    panel.innerHTML = html;
}

// Update turret upgrade panel
function updateTurretUpgradePanel(panel, turretIndex) {
    if (destroyedLaunchers.includes(turretIndex)) {
        panel.innerHTML = `
            <h4 style="color: #f00;">DESTROYED TURRET</h4>
            <p>This turret has been destroyed and needs repair.</p>
        `;
        return;
    }
    
    const launcher = launchers[turretIndex];
    const upgrades = launcherUpgrades[turretIndex];
    
    let html = `
        <h4 style="color: #0ff;">TURRET ${turretIndex + 1}</h4>
        <p>Ammo: ${launcher.missiles}/${launcher.maxMissiles}</p>
        <p>Fire Rate: ${(1000/launcher.fireRate).toFixed(1)}/sec</p>
        <hr style="border-color: #0ff; margin: 10px 0;">
        
        <h5>Turret Upgrades:</h5>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
    `;
    
    // Turret upgrade buttons
    const turretUpgrades = [
        { id: 'speed', name: 'Speed', description: 'Faster missile velocity' },
        { id: 'explosion', name: 'Explosion', description: 'Larger blast radius' },
        { id: 'rate', name: 'Fire Rate', description: 'Faster reload time' },
        { id: 'capacity', name: 'Capacity', description: 'More missiles per reload' },
        { id: 'autopilot', name: 'Autopilot', description: 'Smart missile guidance' }
    ];
    
    turretUpgrades.forEach(upgrade => {
        const upgradeData = upgrades[upgrade.id];
        const cost = getActualUpgradeCost(upgradeData.cost);
        const canAfford = gameState.scrap >= cost;
        
        const buttonStyle = `
            background: ${canAfford ? 'rgba(0, 255, 255, 0.2)' : 'rgba(128, 128, 128, 0.2)'};
            color: ${canAfford ? '#0ff' : '#888'};
            border: 1px solid ${canAfford ? '#0ff' : '#888'};
            padding: 10px;
            cursor: ${canAfford ? 'pointer' : 'not-allowed'};
            border-radius: 3px;
            opacity: ${canAfford ? '1' : '0.5'};
            text-align: center;
        `;
        
        html += `
            <button onclick="${canAfford ? `upgrade('${upgrade.id}', ${turretIndex})` : ''}" 
                    style="${buttonStyle}" 
                    title="${upgrade.description}"
                    ${!canAfford ? 'disabled' : ''}>
                <strong>${upgrade.name}</strong><br>
                <small>Lv.${upgradeData.level}</small><br>
                <small>${cost} scrap</small>
            </button>
        `;
    });
    
    html += '</div>';
    panel.innerHTML = html;
}

// Set city production mode - make globally accessible
window.setCityProductionMode = function(cityIndex, mode) {
    if (gameState.currentMode !== 'command') return;
    if (destroyedCities.includes(cityIndex)) return;
    
    // Don't allow science mode if not unlocked
    if (mode === 'science' && (!globalUpgrades.research || globalUpgrades.research.level === 0)) {
        return;
    }
    
    cityData[cityIndex].productionMode = mode;
    
    // Visual feedback
    const cityX = cityPositions[cityIndex];
    const modeColors = { scrap: '#0f0', science: '#00f', ammo: '#ff0' };
    
    upgradeEffects.push({
        x: cityX,
        y: 730,
        text: `${mode.toUpperCase()} PRODUCTION`,
        alpha: 1,
        vy: -1,
        life: 80,
        color: modeColors[mode] || '#fff'
    });
    
    // Update the panel
    if (gameState.currentMode === 'command') {
        window.updateCommandModal();
    } else {
        window.updateTabbedUpgradePanel();
    }
}

// Upgrade city features - make globally accessible
window.upgradeCityFeature = function(cityIndex, feature) {
    if (gameState.currentMode !== 'command') return;
    
    const cityX = cityPositions[cityIndex];
    
    // For now, all city upgrades show coming soon
    upgradeEffects.push({
        x: cityX,
        y: 710,
        text: 'COMING SOON',
        alpha: 1,
        vy: -1,
        life: 80,
        color: '#ff0'
    });
    
    // Update the panel to refresh UI
    window.updateCommandPanel();
}

// Make panel draggable
function makePanelDraggable() {
    const panel = document.getElementById('commandUpgradePanel');
    const header = document.getElementById('panelHeader');
    
    if (!panel || !header) return;
    
    let isDragging = false;
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
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newLeft = startLeft + deltaX;
        let newTop = startTop + deltaY;
        
        // Keep panel within viewport bounds
        const maxLeft = window.innerWidth - panel.offsetWidth;
        const maxTop = window.innerHeight - panel.offsetHeight;
        
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
        
        panel.style.left = newLeft + 'px';
        panel.style.top = newTop + 'px';
        panel.style.right = 'auto'; // Remove right positioning when dragging
        
        e.preventDefault();
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            panel.style.cursor = '';
            header.style.cursor = 'move';
        }
    });
}

function createUpgradeEffect(x, y, type) {
    const typeNames = {
        speed: 'SPEED UP!',
        explosion: 'BIGGER BOOM!',
        rate: 'FASTER FIRE!',
        capacity: 'MORE AMMO!',
        autopilot: 'AUTOPILOT!'
    };
    
    upgradeEffects.push({
        x: x,
        y: y,
        text: typeNames[type],
        alpha: 1,
        vy: -2,
        life: 60
    });
    
    // Create sparkle particles
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            color: '#ff0'
        });
    }
}

// Upgrade turret - make globally accessible
window.upgrade = function(type, launcherIndex) {
    const upgrade = launcherUpgrades[launcherIndex][type];
    const actualCost = getActualUpgradeCost(upgrade.cost);
    if (gameState.scrap >= actualCost) {
        gameState.scrap -= actualCost;
        upgrade.level++;
        upgrade.cost = Math.floor(upgrade.cost * 1.5);
        
        // Create visual effect
        const launcher = launchers[launcherIndex];
        createUpgradeEffect(launcher.x, launcher.y - 30, type);
        
        // Apply upgrade effects
        if (type === 'rate') {
            const newRate = Math.max(200, 1000 / Math.pow(1.5, upgrade.level - 1));
            launchers[launcherIndex].fireRate = newRate;
        } else if (type === 'capacity') {
            const oldCapacity = launchers[launcherIndex].maxMissiles;
            const newCapacity = Math.floor(10 * Math.pow(1.2, upgrade.level - 1));
            launchers[launcherIndex].maxMissiles = newCapacity;
            // Only add the difference, don't refill completely
            launchers[launcherIndex].missiles += (newCapacity - oldCapacity);
        }
        
        // Update the panel to refresh costs and levels
        if (gameState.currentMode === 'command') {
            window.updateCommandPanel();
        } else {
            window.updateTabbedUpgradePanel();
        }
    }
}


function upgradeCity(cityIndex) {
    const currentLevel = cityUpgrades[cityIndex];
    const cost = 20 + (currentLevel * 15); // 20, 35, 50 scrap for levels 1, 2, 3
    
    if (gameState.scrap >= cost && currentLevel < 3 && !destroyedCities.includes(cityIndex)) {
        gameState.scrap -= cost;
        cityUpgrades[cityIndex]++;
        
        // Create visual effect at city location
        const cityX = cityPositions[cityIndex];
        upgradeEffects.push({
            x: cityX,
            y: 740,
            text: `CITY ${cityIndex + 1} UPGRADED!`,
            alpha: 1,
            vy: -2,
            life: 100
        });
        
        // Create sparkle particles
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: cityX + (Math.random() - 0.5) * 60,
                y: 760 + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                color: '#0ff'
            });
        }
    }
}

function upgradeGlobal(type) {
    const upgrade = globalUpgrades[type];
    if (gameState.scrap >= upgrade.cost) {
        gameState.scrap -= upgrade.cost;
        upgrade.level++;
        upgrade.cost = Math.floor(upgrade.cost * 1.4);
        
        // Create visual effect in center of screen
        const effectText = {
            'cityScrapBonus': 'CITY BONUS UP!',
            'missileHighlight': 'MISSILE HIGHLIGHT ON!',
            'cityShield': 'CITY SHIELDS UP!',
            'scrapMultiplier': 'SCRAP BONUS +25%!',
            'salvage': 'SALVAGE UPGRADE!',
            'efficiency': 'EFFICIENCY BOOST!'
        };
        
        upgradeEffects.push({
            x: 600,
            y: 400,
            text: effectText[type] || 'GLOBAL UPGRADE!',
            alpha: 1,
            vy: -2,
            life: 80
        });
        
        // Create sparkle particles
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: 600 + (Math.random() - 0.5) * 100,
                y: 400 + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1,
                color: '#ff0'
            });
        }
    }
}

function repairCity(cityIndex = null) {
    if (gameState.scrap >= 50) {
        if (cityIndex !== null && destroyedCities.includes(cityIndex)) {
            // Repair specific city
            gameState.scrap -= 50;
            const indexInDestroyed = destroyedCities.indexOf(cityIndex);
            destroyedCities.splice(indexInDestroyed, 1);
            gameState.cities++;
        } else if (cityIndex === null && destroyedCities.length > 0) {
            // Repair first destroyed city (for backward compatibility)
            gameState.scrap -= 50;
            destroyedCities.splice(0, 1);
            gameState.cities++;
        }
    }
}
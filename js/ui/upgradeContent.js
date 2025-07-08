// Upgrade Content Generation for floating panels
// Note: Depends on uiUtils.js being loaded first

// Global upgrades tab content
function getGlobalUpgradesHTML() {
    let html = `
        <div>
        <h4 style="color: #0f0; margin-top: 0; margin-bottom: 15px;">Global Command</h4>
    `;
    
    // Emergency Actions - Compact single row
    html += `
        <div style="margin-bottom: 15px;">
            ${createSectionHeader('Emergency', '#ff0')}
            <div class="compact-grid-2">
    `;
    
    // Emergency Ammo Purchase Button
    const ammoExchangeRate = 3;
    const canAffordAmmo = gameState.scrap >= ammoExchangeRate;
    html += createCompactUpgradeButton({
        name: 'Emergency Ammo',
        description: 'Buy 1 ammo for 3 scrap. Adds ammunition to first available turret.',
        cost: ammoExchangeRate,
        canAfford: canAffordAmmo,
        color: COLORS.yellow,
        onClick: 'emergencyAmmoPurchase()'
    });
    
    // Research unlock in same row if not unlocked
    const researchUnlocked = globalUpgrades.research && globalUpgrades.research.level > 0;
    const researchCost = globalUpgrades.research.cost;
    const canAffordResearch = gameState.scrap >= researchCost;
    
    if (!researchUnlocked) {
        html += createCompactUpgradeButton({
            name: 'Unlock Science',
            description: 'Enable science production in cities. Required for advanced research.',
            cost: researchCost,
            canAfford: canAffordResearch,
            color: COLORS.blue,
            onClick: 'purchaseGlobalUpgrade(\'research\')'
        });
    } else {
        html += `
            <div class="upgrade-btn-compact tooltip" 
                 style="color: rgb(0, 0, 255); border-color: rgb(0, 0, 255); background: rgba(0, 0, 255, 0.1);"
                 data-tooltip="Science production unlocked in all cities">
                <strong>Science ✓</strong>
            </div>
        `;
    }
    
    html += '</div></div>';
    
    // Economic Upgrades - Compact 3-column grid
    html += `
        <div style="margin-bottom: 15px;">
            ${createSectionHeader('Economic', '#0f0')}
            <div class="compact-grid-3">
    `;
    
    const economicUpgrades = [
        { id: 'scrapMultiplier', name: 'Scrap+', description: '25% bonus scrap from all sources including missiles and bonuses' },
        { id: 'salvage', name: 'Salvage', description: 'Extra 3 scrap when destroying planes and bombers' },
        { id: 'efficiency', name: 'Efficiency', description: '15% discount on all turret upgrade costs' }
    ];
    
    economicUpgrades.forEach(upgrade => {
        const upgradeData = globalUpgrades[upgrade.id];
        const isOwned = upgradeData && upgradeData.level > 0;
        const cost = upgradeData ? upgradeData.cost : 50;
        const canAfford = gameState.scrap >= cost;
        
        html += createCompactUpgradeButton({
            name: upgrade.name,
            description: upgrade.description,
            cost: cost,
            isOwned: isOwned,
            canAfford: canAfford,
            color: COLORS.green,
            onClick: `purchaseGlobalUpgrade('${upgrade.id}')`
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
        { id: 'missileHighlight', name: 'Threat Detection', description: 'Highlight dangerous enemy missiles and seekers with red glow' }
    ];
    
    combatUpgrades.forEach(upgrade => {
        const upgradeData = globalUpgrades[upgrade.id];
        const isOwned = upgradeData && upgradeData.level > 0;
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
    
    html += '</div></div></div>';
    
    return html;
}

// Turrets upgrades tab content
function getTurretsUpgradesHTML() {
    let html = `
        <div>
        <h4 style="color: #0ff; margin-top: 0; margin-bottom: 15px;">Turret Upgrades</h4>
    `;
    
    // Get selected turret or default to 0
    const selectedTurret = gameState.commandMode.selectedEntityType === 'turret' 
        ? gameState.commandMode.selectedEntity : 0;
    
    if (selectedTurret !== null && launchers[selectedTurret]) {
        const turretUpgrades = launcherUpgrades[selectedTurret];
        const launcher = launchers[selectedTurret];
        
        html += `
            <div style="margin-bottom: 15px; padding: 8px; background: rgba(0, 255, 255, 0.1); border: 1px solid #0ff; border-radius: 3px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="color: #0ff;">Turret ${selectedTurret + 1}</strong>
                    <div style="font-size: 11px; color: #aaa;">Ammo: ${launcher.missiles}/${launcher.maxMissiles}</div>
                </div>
                <div style="font-size: 10px; color: #888;">Click turret in game to switch</div>
            </div>
            
            <div class="compact-grid-2" style="gap: 10px;">
        `;
        
        // Generate compact upgrade buttons
        const upgradeTypes = [
            { key: 'speed', name: 'Speed', icon: '⚡', description: 'Faster missile travel speed. Higher levels dramatically increase projectile velocity.' },
            { key: 'explosion', name: 'Blast', icon: '💥', description: 'Larger explosion radius. Increases area of effect for destroying enemy missiles.' },
            { key: 'rate', name: 'Rate', icon: '🔥', description: 'Faster reload time between shots. Reduces cooldown for rapid firing.' },
            { key: 'capacity', name: 'Ammo', icon: '📦', description: 'More ammunition per turret. Increases maximum missile storage capacity.' },
            { key: 'autopilot', name: 'Auto', icon: '🎯', description: 'Automatic targeting system. Turret will fire at nearest threats automatically.' }
        ];
        
        upgradeTypes.forEach(upgradeType => {
            const upgrade = turretUpgrades[upgradeType.key];
            const cost = getActualUpgradeCost(upgrade.cost);
            const canAfford = gameState.scrap >= cost;
            
            html += createCompactUpgradeButton({
                name: `${upgradeType.icon} ${upgradeType.name}`,
                description: `${upgradeType.description} Current: Level ${upgrade.level}`,
                cost: cost,
                canAfford: canAfford,
                color: COLORS.cyan,
                onClick: `upgrade('${upgradeType.key}', ${selectedTurret})`,
                additionalInfo: `Level ${upgrade.level} → ${upgrade.level + 1}`
            });
        });
        
        html += '</div>';
    } else {
        // Show all available turrets for selection
        html += `
            <div style="margin-bottom: 15px;">
                ${createSectionHeader('Select Turret', '#0ff')}
                <div class="compact-grid-3">
        `;
        
        for (let i = 0; i < launchers.length; i++) {
            const launcher = launchers[i];
            const isDestroyed = destroyedLaunchers.includes(i);
            const status = isDestroyed ? 'DESTROYED' : 'OPERATIONAL';
            const statusColor = isDestroyed ? '#f00' : '#0f0';
            
            html += `
                <button onclick="window.selectEntity('turret', ${i})" 
                        class="upgrade-btn-compact tooltip"
                        style="color: #0ff; border-color: #0ff; background: rgba(0, 255, 255, 0.1);"
                        data-tooltip="Ammo: ${launcher.missiles}/${launcher.maxMissiles} • Status: ${status}">
                    <strong>T${i + 1}</strong><br>
                    <small style="color: ${statusColor};">${status}</small>
                </button>
            `;
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

// Cities upgrades tab content  
function getCitiesUpgradesHTML() {
    let html = `
        <div>
        <h4 style="color: #ff0; margin-top: 0; margin-bottom: 15px;">City Management</h4>
    `;
    
    // Get selected city or show all cities
    const selectedCity = gameState.commandMode.selectedEntityType === 'city' 
        ? gameState.commandMode.selectedEntity : null;
    
    if (selectedCity !== null && cityData[selectedCity]) {
        const city = cityData[selectedCity];
        const isDestroyed = destroyedCities.includes(selectedCity);
        
        html += `
            <div style="margin-bottom: 15px; padding: 8px; background: rgba(255, 255, 0, 0.1); border: 1px solid #ff0; border-radius: 3px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="color: #ff0;">City ${selectedCity + 1}</strong>
                    <div style="font-size: 11px; color: #aaa;">
                        ${isDestroyed ? 'DESTROYED' : `${city.productionMode} • Pop: ${city.population}/${city.maxPopulation}`}
                    </div>
                </div>
                <div style="font-size: 10px; color: #888;">Click city in game to switch</div>
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
                        onClick: `repairCity(${selectedCity})`
                    })}
                </div>
            `;
        } else {
            // Show production mode options in compact 3-column grid
            html += `
                <div style="margin-bottom: 15px;">
                    ${createSectionHeader('Production Mode', '#ff0')}
                    <div class="compact-grid-3">
            `;
            
            const productionModes = [
                { id: 'scrap', name: 'Scrap', icon: '💰', description: 'Produces scrap for purchasing upgrades and repairs' },
                { id: 'science', name: 'Science', icon: '🔬', description: 'Produces science for advanced research (requires Science unlock)' },
                { id: 'ammo', name: 'Ammo', icon: '📦', description: 'Produces ammunition for turret resupply' }
            ];
            
            productionModes.forEach(mode => {
                const isActive = city.productionMode === mode.id;
                const isLocked = mode.id === 'science' && (!globalUpgrades.research || globalUpgrades.research.level === 0);
                
                let buttonClass = 'upgrade-btn-compact tooltip';
                let buttonStyle = '';
                let clickHandler = '';
                
                if (isLocked) {
                    buttonStyle = 'color: #555; border-color: #555; background: rgba(85, 85, 85, 0.1);';
                } else if (isActive) {
                    buttonStyle = `color: rgb(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}); border-color: rgb(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}); background: rgba(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}, 0.3); border-width: 2px;`;
                } else {
                    buttonStyle = `color: rgb(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}); border-color: rgb(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}); background: rgba(${COLORS[mode.id === 'scrap' ? 'green' : mode.id === 'science' ? 'blue' : 'yellow']}, 0.1);`;
                    clickHandler = `onclick="setCityProductionMode(${selectedCity}, '${mode.id}')"`;
                }
                
                const tooltipText = isLocked ? 'Requires Science unlock from Global tab' : mode.description + (isActive ? ' (Currently Active)' : '');
                
                html += `
                    <button ${clickHandler}
                            class="${buttonClass}"
                            style="${buttonStyle}"
                            data-tooltip="${tooltipText}">
                        <strong>${mode.icon} ${mode.name}</strong>
                        ${isActive ? '<br><small>ACTIVE</small>' : ''}
                    </button>
                `;
            });
            
            html += '</div></div>';
            
            // City upgrades in compact format
            html += `
                <div>
                    ${createSectionHeader('City Upgrades', '#ff0')}
                    <div class="compact-grid-2">
            `;
            
            const cityUpgradeLevel = cityUpgrades[selectedCity];
            const nextUpgradeCost = 30 + (cityUpgradeLevel * 20);
            const canAffordCityUpgrade = gameState.scrap >= nextUpgradeCost;
            
            html += createCompactUpgradeButton({
                name: `🏭 Efficiency`,
                description: `Increase city production output. Level ${cityUpgradeLevel} → ${cityUpgradeLevel + 1}. Boosts all resource generation.`,
                cost: nextUpgradeCost,
                canAfford: canAffordCityUpgrade,
                color: COLORS.yellow,
                onClick: `upgradeCityFeature(${selectedCity})`,
                additionalInfo: `Current: Level ${cityUpgradeLevel}`
            });
            
            // Add placeholder for future city upgrades
            html += `
                <div class="upgrade-btn-compact tooltip" 
                     style="color: #555; border-color: #555; background: rgba(85, 85, 85, 0.1); cursor: default;"
                     data-tooltip="Additional city upgrades coming in future updates">
                    <strong>More Soon</strong>
                </div>
            `;
            
            html += '</div></div>';
        }
    } else {
        // Show all cities overview in compact grid
        html += `
            <div style="margin-bottom: 15px;">
                ${createSectionHeader('Select City', '#ff0')}
                <div class="compact-grid-3">
        `;
        
        for (let i = 0; i < cityData.length; i++) {
            const city = cityData[i];
            const isDestroyed = destroyedCities.includes(i);
            const status = isDestroyed ? 'DESTROYED' : 'OPERATIONAL';
            const statusColor = isDestroyed ? '#f00' : '#0f0';
            const productionIcon = city.productionMode === 'scrap' ? '💰' : city.productionMode === 'science' ? '🔬' : '📦';
            
            const tooltipText = isDestroyed 
                ? 'City destroyed - requires 50 scrap to repair'
                : `Population: ${city.population}/${city.maxPopulation} • Producing: ${city.productionMode} • Level: ${cityUpgrades[i]}`;
            
            html += `
                <button onclick="window.selectEntity('city', ${i})" 
                        class="upgrade-btn-compact tooltip"
                        style="color: #ff0; border-color: #ff0; background: rgba(255, 255, 0, 0.1);"
                        data-tooltip="${tooltipText}">
                    <strong>C${i + 1} ${isDestroyed ? '💥' : productionIcon}</strong><br>
                    <small style="color: ${statusColor};">${isDestroyed ? 'DESTROYED' : 'OK'}</small>
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
    }
    
    html += '</div>';
    return html;
}
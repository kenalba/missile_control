// UI State Management
import { gameState } from '@/systems/observableState';

// Update main game UI
export function updateUI(): void {
    // Score and basic resources
    const scoreElement = document.getElementById('score');
    const scrapElement = document.getElementById('scrap');
    const scienceElement = document.getElementById('science');
    const scienceRowElement = document.getElementById('science-row');
    const waveElement = document.getElementById('wave');
    
    if (scoreElement) scoreElement.textContent = gameState.score.toString();
    if (scrapElement) scrapElement.textContent = gameState.scrap.toString();
    
    // Command Mode specific UI updates
    if (gameState.currentMode === 'command') {
        // Show Science resource
        if (scienceElement) scienceElement.textContent = gameState.science.toString();
        if (scienceRowElement) scienceRowElement.style.display = 'block';
        
        // Show continuous time and difficulty instead of wave
        const timeMinutes = Math.floor(gameState.commandMode.gameTime / 60000);
        const timeSeconds = Math.floor((gameState.commandMode.gameTime % 60000) / 1000);
        const timeText = `${timeMinutes}:${timeSeconds.toString().padStart(2, '0')}`;
        if (waveElement) {
            waveElement.textContent = `Time: ${timeText} | Difficulty: ${gameState.commandMode.difficulty.toFixed(1)}x`;
        }
    } else {
        // Arcade Mode - hide Science resource and show wave info
        if (scienceRowElement) scienceRowElement.style.display = 'none';
        const planeText = gameState.planesToSpawn > 0 ? `, ${gameState.planesToSpawn} planes` : '';
        if (waveElement) {
            waveElement.textContent = `${gameState.wave} (${gameState.enemiesToSpawn} missiles${planeText})`;
        }
    }
    
    // Update economic upgrade buttons
    updateGlobalUpgradeButtons();
    
    // Update upgrade UI
    updateUpgradeUI();
    
    // Update Command Panel if in Command Mode and panel is open
    if (gameState.currentMode === 'command' && typeof (window as any).updateCommandPanel === 'function') {
        (window as any).updateCommandPanel();
    }
    
    // Update mobile upgrade toggle
    updateMobileUpgradeToggle();
}

// Update global upgrade buttons in sidebar
function updateGlobalUpgradeButtons(): void {
    const globalUpgrades = (window as any).globalUpgrades;
    if (!globalUpgrades) return;
    
    // Scrap Multiplier
    const scrapMultiplierBtn = document.getElementById('scrapMultiplier') as HTMLButtonElement;
    if (scrapMultiplierBtn) {
        scrapMultiplierBtn.textContent = globalUpgrades.scrapMultiplier.cost.toString();
        scrapMultiplierBtn.disabled = gameState.scrap < globalUpgrades.scrapMultiplier.cost || globalUpgrades.scrapMultiplier.level > 0;
        scrapMultiplierBtn.style.opacity = (gameState.scrap < globalUpgrades.scrapMultiplier.cost || globalUpgrades.scrapMultiplier.level > 0) ? '0.6' : '1';
    }
    
    // Salvage
    const salvageBtn = document.getElementById('salvage') as HTMLButtonElement;
    if (salvageBtn) {
        salvageBtn.textContent = globalUpgrades.salvage.cost.toString();
        salvageBtn.disabled = gameState.scrap < globalUpgrades.salvage.cost || globalUpgrades.salvage.level > 0;
        salvageBtn.style.opacity = (gameState.scrap < globalUpgrades.salvage.cost || globalUpgrades.salvage.level > 0) ? '0.6' : '1';
    }
    
    // Efficiency
    const efficiencyBtn = document.getElementById('efficiency') as HTMLButtonElement;
    if (efficiencyBtn) {
        efficiencyBtn.textContent = globalUpgrades.efficiency.cost.toString();
        efficiencyBtn.disabled = gameState.scrap < globalUpgrades.efficiency.cost || globalUpgrades.efficiency.level > 0;
        efficiencyBtn.style.opacity = (gameState.scrap < globalUpgrades.efficiency.cost || globalUpgrades.efficiency.level > 0) ? '0.6' : '1';
    }
    
    // Missile Highlight
    const missileHighlightBtn = document.getElementById('missileHighlight') as HTMLButtonElement;
    if (missileHighlightBtn) {
        missileHighlightBtn.textContent = globalUpgrades.missileHighlight.cost.toString();
        missileHighlightBtn.disabled = gameState.scrap < globalUpgrades.missileHighlight.cost || globalUpgrades.missileHighlight.level > 0;
        missileHighlightBtn.style.opacity = (gameState.scrap < globalUpgrades.missileHighlight.cost || globalUpgrades.missileHighlight.level > 0) ? '0.6' : '1';
    }
}

// Update main upgrade UI
function updateUpgradeUI(): void {
    const launcherUpgrades = (window as any).launcherUpgrades;
    
    if (!launcherUpgrades) return;
    
    // Command Mode uses floating panel UI
    if (gameState.currentMode === 'command') {
        // Hide traditional upgrade table and sections
        const upgradeTable = document.querySelector('.upgrade-table') as HTMLElement;
        if (upgradeTable) {
            upgradeTable.style.display = 'none';
        }
        
        // Hide economic and tactical upgrade sections
        const globalUpgradeSections = document.querySelectorAll('.global-upgrades');
        globalUpgradeSections.forEach((section) => {
            (section as HTMLElement).style.display = 'none';
        });
        
        // Hide old nested tabbed panel if it exists
        const tabbedPanel = document.getElementById('tabbedUpgradePanel');
        if (tabbedPanel) {
            tabbedPanel.style.display = 'none';
        }
        
        // Show the toggle button for Command Mode
        const toggleButton = document.getElementById('command-upgrade-toggle');
        if (toggleButton) {
            toggleButton.style.display = 'block';
        }
        
        // Command mode uses floating panel - no auto-initialization here
        return;
    }
    
    // Arcade Mode: Traditional upgrade table and global upgrades
    const upgradeTable = document.querySelector('.upgrade-table') as HTMLElement;
    if (upgradeTable) {
        upgradeTable.style.display = '';
    }
    
    // Show economic and tactical upgrade sections in Arcade Mode
    const globalUpgradeSections = document.querySelectorAll('.global-upgrades');
    globalUpgradeSections.forEach((section) => {
        (section as HTMLElement).style.display = '';
    });
    
    // Hide Command Mode components in Arcade Mode
    const tabbedPanel = document.getElementById('tabbedUpgradePanel');
    if (tabbedPanel) {
        tabbedPanel.style.display = 'none';
    }
    
    const toggleButton = document.getElementById('command-upgrade-toggle');
    if (toggleButton) {
        toggleButton.style.display = 'none';
    }
    
    const commandPanel = document.getElementById('commandUpgradePanel');
    if (commandPanel) {
        commandPanel.style.display = 'none';
    }
    
    // Update UI for all available launchers (dynamic based on current mode)
    updateLauncherUpgradeButtons();
    
    // Hide unused launcher columns in Command Mode
    updateLauncherTableVisibility();
}

// Update launcher upgrade button states
function updateLauncherUpgradeButtons(): void {
    const launcherUpgrades = (window as any).launcherUpgrades;
    const getActualUpgradeCost = (window as any).getActualUpgradeCost;
    
    if (!launcherUpgrades || !getActualUpgradeCost) return;
    
    for (let i = 0; i < launcherUpgrades.length; i++) {
        const upgrades = launcherUpgrades[i];
        
        // Update levels
        const speedLevel = document.getElementById(`speed-level-${i}`);
        const explosionLevel = document.getElementById(`explosion-level-${i}`);
        const rateLevel = document.getElementById(`rate-level-${i}`);
        const capacityLevel = document.getElementById(`capacity-level-${i}`);
        const autopilotLevel = document.getElementById(`autopilot-level-${i}`);
        
        if (speedLevel) speedLevel.textContent = upgrades.speed.level.toString();
        if (explosionLevel) explosionLevel.textContent = upgrades.explosion.level.toString();
        if (rateLevel) rateLevel.textContent = upgrades.rate.level.toString();
        if (capacityLevel) capacityLevel.textContent = upgrades.capacity.level.toString();
        if (autopilotLevel) autopilotLevel.textContent = upgrades.autopilot.level.toString();
        
        // Update costs and button states
        updateUpgradeButton(i, 'speed', upgrades.speed.cost, getActualUpgradeCost);
        updateUpgradeButton(i, 'explosion', upgrades.explosion.cost, getActualUpgradeCost);
        updateUpgradeButton(i, 'rate', upgrades.rate.cost, getActualUpgradeCost);
        updateUpgradeButton(i, 'capacity', upgrades.capacity.cost, getActualUpgradeCost);
        updateUpgradeButton(i, 'autopilot', upgrades.autopilot.cost, getActualUpgradeCost);
    }
}

// Update individual upgrade button
function updateUpgradeButton(launcherIndex: number, upgradeType: string, baseCost: number, getActualUpgradeCost: (cost: number) => number): void {
    const btn = document.getElementById(`${upgradeType}-btn-${launcherIndex}`) as HTMLButtonElement;
    if (!btn) return;
    
    const actualCost = getActualUpgradeCost(baseCost);
    btn.textContent = actualCost.toString();
    btn.disabled = gameState.scrap < actualCost;
    
    const parent = btn.parentElement;
    if (parent) {
        parent.style.opacity = gameState.scrap < actualCost ? '0.7' : '1';
    }
}

// Update launcher table visibility based on mode
function updateLauncherTableVisibility(): void {
    const table = document.querySelector('.upgrade-table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        if (cells.length >= 4) {
            if (gameState.currentMode === 'command') {
                // Hide T2 and T3 columns (indices 2 and 3) in Command Mode
                if (cells[2]) (cells[2] as HTMLElement).style.display = 'none';
                if (cells[3]) (cells[3] as HTMLElement).style.display = 'none';
            } else {
                // Show all columns in Arcade Mode
                if (cells[2]) (cells[2] as HTMLElement).style.display = '';
                if (cells[3]) (cells[3] as HTMLElement).style.display = '';
            }
        }
    });
}

// Update mobile upgrade toggle
function updateMobileUpgradeToggle(): void {
    // Mobile-specific UI updates would go here
    // This is a placeholder for future mobile UI improvements
}

// Update high scores display
export function updateHighScoresDisplay(): void {
    const highScoresList = document.getElementById('highScoresList');
    if (!highScoresList || !(window as any).saveSystem) return;
    
    const highScores = (window as any).saveSystem.saveData.highScores || [];
    
    if (highScores.length === 0) {
        highScoresList.innerHTML = '<div class="high-score-item empty">No scores yet</div>';
        return;
    }
    
    // Show top 5 scores
    const topScores = highScores.slice(0, 5);
    highScoresList.innerHTML = topScores.map((score: any, index: number) => {
        const date = new Date(score.date);
        const dateStr = date.toLocaleDateString();
        
        return `
            <div class="high-score-item">
                <span class="high-score-rank">#${index + 1}</span>
                <span class="high-score-details">
                    <span class="high-score-score">${score.score.toLocaleString()}</span>
                    <span class="high-score-wave">Wave ${score.wave} • ${dateStr}</span>
                </span>
            </div>
        `;
    }).join('');
}

// Make globally available for legacy compatibility
(window as any).updateUI = updateUI;
(window as any).updateUpgradeUI = updateUpgradeUI;
(window as any).updateHighScoresDisplay = updateHighScoresDisplay;
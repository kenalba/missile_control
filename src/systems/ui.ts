// UI System with TypeScript typing
import { gameState } from '@/core/gameState';
import { globalUpgrades, launcherUpgrades } from '@/core/upgrades';
import { getActualUpgradeCost } from '@/core/economy';

export function updateUI(): void {
    updateBasicStats();
    updateModeSpecificUI();
    updateUpgradeButtons();
    updateUpgradeUI();
    updateMobileUpgradeToggle();
}

function updateBasicStats(): void {
    const scoreElement = document.getElementById('score');
    const scrapElement = document.getElementById('scrap');
    
    if (scoreElement) scoreElement.textContent = gameState.score.toString();
    if (scrapElement) scrapElement.textContent = gameState.scrap.toString();
}

function updateModeSpecificUI(): void {
    const scienceElement = document.getElementById('science');
    const scienceRow = document.getElementById('science-row');
    const waveElement = document.getElementById('wave');
    
    if (gameState.currentMode === 'command') {
        // Show Science resource
        if (scienceElement) scienceElement.textContent = gameState.science.toString();
        if (scienceRow) scienceRow.style.display = 'block';
        
        // Show continuous time and difficulty instead of wave
        const timeMinutes = Math.floor(gameState.commandMode.gameTime / 60000);
        const timeSeconds = Math.floor((gameState.commandMode.gameTime % 60000) / 1000);
        const timeText = `${timeMinutes}:${timeSeconds.toString().padStart(2, '0')}`;
        if (waveElement) {
            waveElement.textContent = `Time: ${timeText} | Difficulty: ${gameState.commandMode.difficulty.toFixed(1)}x`;
        }
    } else {
        // Arcade Mode - hide Science resource and show wave info
        if (scienceRow) scienceRow.style.display = 'none';
        const planeText = gameState.planesToSpawn > 0 ? `, ${gameState.planesToSpawn} planes` : '';
        if (waveElement) {
            waveElement.textContent = `${gameState.wave} (${gameState.enemiesToSpawn} missiles${planeText})`;
        }
    }
}

function updateUpgradeButtons(): void {
    updateEconomicUpgradeButton('scrapMultiplier', globalUpgrades.scrapMultiplier);
    updateEconomicUpgradeButton('salvage', globalUpgrades.salvage);
    updateEconomicUpgradeButton('efficiency', globalUpgrades.efficiency);
    updateEconomicUpgradeButton('missileHighlight', globalUpgrades.missileHighlight);
}

function updateEconomicUpgradeButton(buttonId: string, upgrade: { cost: number; level: number }): void {
    const button = document.getElementById(buttonId) as HTMLButtonElement;
    if (!button) return;
    
    button.textContent = upgrade.cost.toString();
    const canAfford = gameState.scrap >= upgrade.cost;
    const alreadyPurchased = upgrade.level > 0;
    
    button.disabled = !canAfford || alreadyPurchased;
    button.style.opacity = (!canAfford || alreadyPurchased) ? '0.6' : '1';
}

export function updateUpgradeUI(): void {
    if (gameState.currentMode === 'command') {
        showCommandModeUI();
    } else {
        showArcadeModeUI();
    }
}

function showCommandModeUI(): void {
    // Hide traditional upgrade table and sections
    const upgradeTable = document.querySelector('.upgrade-table') as HTMLElement;
    if (upgradeTable) upgradeTable.style.display = 'none';
    
    const globalUpgradeSections = document.querySelectorAll('.global-upgrades');
    globalUpgradeSections.forEach(section => {
        (section as HTMLElement).style.display = 'none';
    });
    
    const tabbedPanel = document.getElementById('tabbedUpgradePanel');
    if (tabbedPanel) tabbedPanel.style.display = 'none';
    
    // Show Command Mode toggle button
    const toggleButton = document.getElementById('command-upgrade-toggle');
    if (toggleButton) toggleButton.style.display = 'block';
}

function showArcadeModeUI(): void {
    // Show traditional upgrade table and global upgrades
    const upgradeTable = document.querySelector('.upgrade-table') as HTMLElement;
    if (upgradeTable) upgradeTable.style.display = '';
    
    const globalUpgradeSections = document.querySelectorAll('.global-upgrades');
    globalUpgradeSections.forEach(section => {
        (section as HTMLElement).style.display = '';
    });
    
    // Hide Command Mode components
    const tabbedPanel = document.getElementById('tabbedUpgradePanel');
    if (tabbedPanel) tabbedPanel.style.display = 'none';
    
    const toggleButton = document.getElementById('command-upgrade-toggle');
    if (toggleButton) toggleButton.style.display = 'none';
    
    const commandPanel = document.getElementById('commandUpgradePanel');
    if (commandPanel) commandPanel.style.display = 'none';
    
    // Update launcher upgrade UI
    updateLauncherUpgradeUI();
}

function updateLauncherUpgradeUI(): void {
    for (let i = 0; i < launcherUpgrades.length; i++) {
        const upgrades = launcherUpgrades[i];
        
        // Update levels
        updateUpgradeLevel(`speed-level-${i}`, upgrades.speed.level);
        updateUpgradeLevel(`explosion-level-${i}`, upgrades.explosion.level);
        updateUpgradeLevel(`rate-level-${i}`, upgrades.rate.level);
        updateUpgradeLevel(`capacity-level-${i}`, upgrades.capacity.level);
        updateUpgradeLevel(`autopilot-level-${i}`, upgrades.autopilot.level);
        
        // Update costs and button states
        updateUpgradeButton(`speed-btn-${i}`, upgrades.speed.cost);
        updateUpgradeButton(`explosion-btn-${i}`, upgrades.explosion.cost);
        updateUpgradeButton(`rate-btn-${i}`, upgrades.rate.cost);
        updateUpgradeButton(`capacity-btn-${i}`, upgrades.capacity.cost);
        updateUpgradeButton(`autopilot-btn-${i}`, upgrades.autopilot.cost);
    }
}

function updateUpgradeLevel(elementId: string, level: number): void {
    const element = document.getElementById(elementId);
    if (element) element.textContent = level.toString();
}

function updateUpgradeButton(buttonId: string, baseCost: number): void {
    const button = document.getElementById(buttonId) as HTMLButtonElement;
    if (!button) return;
    
    const actualCost = getActualUpgradeCost(baseCost);
    const canAfford = gameState.scrap >= actualCost;
    
    button.textContent = actualCost.toString();
    button.disabled = !canAfford;
    
    const parentElement = button.parentElement as HTMLElement;
    if (parentElement) {
        parentElement.style.opacity = canAfford ? '1' : '0.7';
    }
}

function updateMobileUpgradeToggle(): void {
    // Mobile upgrade toggle functionality
    // Implementation depends on mobile UI requirements
    // This is a placeholder for now
}

export function updateHighScoresDisplay(): void {
    const highScoresList = document.getElementById('highScoresList');
    if (!highScoresList) return;
    
    // Get high scores from save system
    const saveSystem = (window as any).saveSystem;
    if (!saveSystem) return;
    
    const highScores = saveSystem.saveData?.highScores || [];
    
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

export function initializeUpgrades(): void {
    if (gameState.currentMode === 'command') {
        // Command Mode uses floating panel system
        console.log('Command Mode upgrade system initialized');
        
        // Initialize global event delegation for upgrade panel clicks
        const initGlobalEventDelegation = (window as any).initializeGlobalEventDelegation;
        if (typeof initGlobalEventDelegation === 'function') {
            initGlobalEventDelegation();
        }
    } else {
        // Arcade Mode uses traditional sidebar system
        console.log('Arcade Mode upgrade system initialized');
    }
    
    // Update UI to reflect current mode
    updateUpgradeUI();
}

export function completeWave(): void {
    // Wave completion logic
    gameState.achievements.wavesCompleted++;
    gameState.wave++;
    
    // Reset wave-specific counters
    gameState.enemiesSpawned = 0;
    gameState.enemiesToSpawn = 0;
    gameState.planesSpawned = 0;
    gameState.planesToSpawn = 0;
    
    // Set wave break
    gameState.waveBreak = true;
    gameState.waveBreakTimer = gameState.nextWaveDelay;
    
    // Show wave completion UI
    const waveBreakElement = document.getElementById('waveBreak');
    if (waveBreakElement) {
        waveBreakElement.style.display = 'block';
    }
    
    // Calculate and award city bonus
    const aliveCities = gameState.cities;
    if (aliveCities > 0) {
        const cityBonus = aliveCities * 100 * gameState.wave;
        gameState.score += cityBonus;
        gameState.cityBonusPhase = true;
        gameState.cityBonusTimer = 2000; // 2 second bonus phase
        gameState.cityBonusIndex = 0;
        gameState.cityBonusTotal = cityBonus;
    }
    
    // Update UI
    updateUI();
    
    console.log(`Wave ${gameState.wave - 1} completed! Starting wave ${gameState.wave}`);
}
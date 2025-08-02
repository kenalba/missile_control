// UI System with TypeScript typing
import { gameState } from '@/systems/observableState';
import { globalUpgrades, launcherUpgrades } from '@/core/upgrades';
import { getActualUpgradeCost } from '@/core/economy';

export function updateUI(): void {
    updateBasicStats();
    updateModeSpecificUI();
    updateUpgradeButtons();
    // Note: updateUpgradeUI() removed - only call when mode actually changes
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

// Throttle upgrade UI updates to prevent excessive calls
let lastUpgradeUIUpdate = 0;
const UPGRADE_UI_THROTTLE_MS = 1000; // 1 second throttle

export function updateUpgradeUI(forceUpdate: boolean = false): void {
    const now = Date.now();
    if (!forceUpdate && now - lastUpgradeUIUpdate < UPGRADE_UI_THROTTLE_MS) {
        return; // Skip update if called too frequently
    }
    
    lastUpgradeUIUpdate = now;
    console.log('🎮 Updating upgrade UI for mode:', gameState.currentMode);
    
    if (gameState.currentMode === 'command') {
        showCommandModeUI();
    } else {
        showArcadeModeUI();
    }
}

function showCommandModeUI(): void {
    // Set body class for command mode
    document.body.classList.add('command-mode');
    document.body.classList.remove('arcade-mode');
    
    // Hide traditional upgrade table and sections (done via CSS now)
    const tabbedPanel = document.getElementById('tabbedUpgradePanel');
    if (tabbedPanel) tabbedPanel.style.display = 'none';
    
    // Old command upgrade toggle button removed
    
    // Sidebar expand/collapse buttons are managed by sidebarManager
}

function showArcadeModeUI(): void {
    // Set body class for arcade mode
    document.body.classList.add('arcade-mode');
    document.body.classList.remove('command-mode');
    
    // Show traditional upgrade table and global upgrades (done via CSS now)
    
    // Hide Command Mode components
    const tabbedPanel = document.getElementById('tabbedUpgradePanel');
    if (tabbedPanel) tabbedPanel.style.display = 'none';
    
    // Old command upgrade toggle button removed
    
    const commandPanel = document.getElementById('commandUpgradePanel');
    if (commandPanel) commandPanel.style.display = 'none';
    
    // Sidebar expand/collapse buttons are managed by sidebarManager
    
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
    updateUpgradeUI(true); // Force update during initialization
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
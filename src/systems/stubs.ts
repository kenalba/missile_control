// Temporary stub functions for remaining legacy functionality
// These will be replaced with proper TypeScript implementations

import { checkCollisions as checkCollisionsImpl } from '@/utils/collision';
import { playerMissiles, enemyMissiles } from '@/entities/missiles';
import { explosions, createExplosion } from '@/entities/explosions';
import { planes } from '@/entities/planes';
import { launchers } from '@/entities/launchers';
import { cityPositions, destroyedCities, cityUpgrades } from '@/entities/cities';
import { cityData } from '@/core/cities';
import { gameState } from '@/systems/observableState';
import { addScreenShake } from '@/core/gameState';
import { globalUpgrades } from '@/core/upgrades';
import { upgradeEffects, createUpgradeEffect } from '@/entities/particles';
import { applyScrapBonus } from '@/core/economy';
import { checkAchievements } from '@/core/achievements';
import { render as renderImpl } from '@/systems/rendering';
import { updateUI as updateUIImpl, updateHighScoresDisplay as updateHighScoresDisplayImpl, initializeUpgrades as initializeUpgradesImpl, completeWave as completeWaveImpl } from '@/systems/ui';

export function checkCollisions(): void {
    // Wrapper function to match expected signature
    const createExplosionWrapper = (
        x: number, 
        y: number, 
        isPlayer: boolean, 
        launcherIndex?: number, 
        type?: string
    ) => {
        const explosionType = (type as 'normal' | 'plane' | 'city' | 'splitter') || 'normal';
        createExplosion(x, y, isPlayer, launcherIndex || 0, explosionType);
    };

    checkCollisionsImpl(
        playerMissiles,
        enemyMissiles,
        explosions,
        planes,
        launchers,
        cityPositions,
        destroyedCities,
        cityData,
        cityUpgrades,
        gameState,
        globalUpgrades,
        upgradeEffects,
        createExplosionWrapper,
        addScreenShake,
        applyScrapBonus,
        createUpgradeEffect,
        checkAchievements
    );
}

export function render(): void {
    renderImpl();
}

export function updateHighScoresDisplay(): void {
    updateHighScoresDisplayImpl();
}

export function completeWave(): void {
    completeWaveImpl();
}

export function updateUI(): void {
    updateUIImpl();
}

export function initializeUpgrades(): void {
    initializeUpgradesImpl();
}

// Make functions available globally for temporary compatibility
(window as any).checkCollisions = checkCollisions;
(window as any).render = render;
(window as any).updateHighScoresDisplay = updateHighScoresDisplay;
(window as any).completeWave = completeWave;
(window as any).updateUI = updateUI;
(window as any).initializeUpgrades = initializeUpgrades;
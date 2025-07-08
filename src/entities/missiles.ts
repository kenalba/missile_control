import type { PlayerMissile, EnemyMissile, Launcher } from '@/types/gameTypes';
import { gameState } from '@/systems/observableState';
import { launcherUpgrades } from '@/core/upgrades';
import { audioSystem } from '@/systems/audio';
import { cityPositions, destroyedCities } from './cities';
import { launchers } from './launchers';

export let playerMissiles: PlayerMissile[] = [];
export let enemyMissiles: EnemyMissile[] = [];

// Calculate where a missile will hit based on current position and velocity
export function calculateMissileImpact(missile: EnemyMissile): number | null {
    if (missile.vy <= 0) return null; // Missile going up or horizontal
    
    // Calculate time to reach ground (y = 800)
    const timeToGround = (800 - missile.y) / missile.vy;
    if (timeToGround <= 0) return null; // Already past ground
    
    // Calculate x position when it hits ground
    const impactX = missile.x + (missile.vx * timeToGround);
    return impactX;
}

// Check if a missile's trajectory threatens any live targets
export function isMissileThreatening(missile: EnemyMissile): boolean {
    const impactX = calculateMissileImpact(missile);
    if (impactX === null) return false;
    
    // Check if impact threatens any live cities (50px range)
    for (let cityIndex = 0; cityIndex < cityPositions.length; cityIndex++) {
        if (!destroyedCities.includes(cityIndex)) {
            const cityX = cityPositions[cityIndex];
            if (Math.abs(impactX - cityX) < 50) {
                return true;
            }
        }
    }
    
    // Check if impact threatens any live launchers (40px range)
    for (let launcherIndex = 0; launcherIndex < launchers.length; launcherIndex++) {
        const launcher = launchers[launcherIndex];
        if (launcher.missiles > 0) {
            const launcherX = launcher.x;
            if (Math.abs(impactX - launcherX) < 40) {
                return true;
            }
        }
    }
    
    return false;
}

export function fireMissile(launcher: Launcher, targetX: number, targetY: number): void {
    const launcherIndex = launchers.indexOf(launcher);
    const speedLevel = launcherUpgrades[launcherIndex]?.speed.level || 1;
    const autopilotLevel = launcherUpgrades[launcherIndex]?.autopilot.level || 0;
    const speed = 4.5 * Math.pow(1.3, speedLevel - 1);
    const dx = targetX - launcher.x;
    const dy = targetY - launcher.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate original flight plan for autopilot missiles
    const originalFlightTime = distance / speed; // Time to reach original target
    
    const missile: PlayerMissile = {
        x: launcher.x,
        y: launcher.y,
        targetX: targetX,
        targetY: targetY,
        vx: (dx / distance) * speed,
        vy: (dy / distance) * speed,
        trail: [],
        launcherIndex: launcherIndex,
        autopilot: autopilotLevel > 0,
        autopilotStrength: autopilotLevel * 0.15, // Reduced from 0.3 to 0.15
        timeAlive: 0,
        maxLifetime: 8000,  // 8 seconds max lifetime
        // Original flight plan for autopilot
        originalTargetX: targetX,
        originalTargetY: targetY,
        originalFlightTime: originalFlightTime,
        maxDeviation: 100 + (autopilotLevel * 50) // Max distance from original path
    };
    
    playerMissiles.push(missile);
    
    launcher.missiles--;
    launcher.lastFire = Date.now();
    
    // Play launch sound
    audioSystem.playMissileLaunch();
}

// Missile Command style speed curve: fast ramp to wave 6, then plateau
// Based on original game's speed progression curve
export function calculateMissileSpeed(wave: number): number {
    const baseSpeed = 0.5;
    const maxSpeed = 3.5; // Maximum speed reached around wave 15 - much more challenging!
    
    if (wave <= 1) return baseSpeed;
    if (wave >= 15) return maxSpeed; // Reaches max by wave 15
    
    // Exponential curve that reaches ~80% of max by wave 6, then continues climbing
    const progress = Math.min(wave - 1, 14) / 14;
    const curve = 1 - Math.pow(1 - progress, 2.2); // Steep early curve with continued growth
    return baseSpeed + (maxSpeed - baseSpeed) * curve;
}

export function spawnEnemyMissile(canvas: HTMLCanvasElement): void {
    const startX = Math.random() * canvas.width;
    let targetX = Math.random() * canvas.width;
    
    // 85% chance to target a city or launcher instead of random position
    if (Math.random() < 0.85) {
        const targets = [...cityPositions, ...launchers.map(l => l.x)];
        const validTargets = targets.filter((_, index) => {
            // Filter out destroyed cities
            if (index < cityPositions.length) {
                return !destroyedCities.includes(index);
            }
            return true; // Always include launchers
        });
        
        if (validTargets.length > 0) {
            targetX = validTargets[Math.floor(Math.random() * validTargets.length)];
            // Add some variance so missiles don't hit exactly the same spot
            targetX += (Math.random() - 0.5) * 60;
        }
    }
    
    // For now, set targeting as false - will be calculated dynamically during update
    let isTargetingValid = false;
    
    const speed = calculateMissileSpeed(gameState.wave);
    
    // Splitters: start at wave 3, increase frequency gradually
    const splitterChance = gameState.wave >= 3 ? Math.min(0.25, 0.05 + (gameState.wave - 3) * 0.03) : 0;
    const isSplitter = Math.random() < splitterChance;
    
    // Seekers: start at wave 5, low frequency, smart AI missiles
    const seekerChance = gameState.wave >= 5 ? Math.min(0.15, 0.02 + (gameState.wave - 5) * 0.02) : 0;
    const isSeeker = !isSplitter && Math.random() < seekerChance; // Seekers and splitters are mutually exclusive
    
    // For seekers, always target a city or launcher
    if (isSeeker) {
        const targets = [...cityPositions, ...launchers.map(l => l.x)];
        const validTargets = targets.filter((_, index) => {
            // Filter out destroyed cities but keep all launchers
            if (index < cityPositions.length) {
                return !destroyedCities.includes(index);
            }
            return true; // Always include launchers
        });
        
        if (validTargets.length > 0) {
            targetX = validTargets[Math.floor(Math.random() * validTargets.length)];
        }
    }

    const newMissile: EnemyMissile = {
        x: startX,
        y: 0,
        targetX: targetX,
        targetY: 780,
        vx: (targetX - startX) * speed / 400,
        vy: speed * (isSeeker ? 0.9 : 1), // Seekers are 10% slower but smarter
        trail: [],
        isSplitter: isSplitter,
        splitAt: isSplitter ? 200 + Math.random() * 200 : null, // Split between y=200-400
        isSeeker: isSeeker,
        seekerBlinkTimer: 0,
        seekerTargetX: targetX,
        seekerTargetY: 780,
        lastRetarget: 0,
        isTargetingValid: isTargetingValid,
        sparkleTimer: 0,
        lastThreatCheck: 0 // Will force immediate check on first update
    };
    
    enemyMissiles.push(newMissile);
}

export function clearMissiles(): void {
    playerMissiles.length = 0;
    enemyMissiles.length = 0;
}

export function removeMissile(missiles: PlayerMissile[] | EnemyMissile[], index: number): void {
    missiles.splice(index, 1);
}

// Arrays are already exported above
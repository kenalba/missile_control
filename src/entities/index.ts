// Central entity system exports
export * from './launchers';
export * from './missiles';
export * from './explosions';
export * from './particles';
export * from './planes';
export * from './cities';
export * from './debug';

import { playerMissiles, enemyMissiles } from './missiles';
import type { EnemyMissile } from '@/types/gameTypes';
import { explosions } from './explosions';
import { updateParticles, updateUpgradeEffects } from './particles';
import { updatePlanes } from './planes';
import { updateExplosions } from './explosions';
import { launchers } from './launchers';
import { launcherUpgrades, globalUpgrades } from '@/core/upgrades';
import { gameState } from '@/core/gameState';
import { createExplosion } from './explosions';
import { createParticle } from './particles';
import { cityPositions, destroyedCities } from './cities';
import { isMissileThreatening, calculateMissileSpeed } from './missiles';
import { audioSystem } from '@/systems/audio';

// Main entity update function that handles all entity types
export function updateEntities(deltaTime: number, canvas: HTMLCanvasElement): void {
    // Update player missiles
    playerMissiles.forEach((missile, i) => {
        missile.trail.push({x: missile.x, y: missile.y});
        
        // Very long trails - cover entire screen diagonal plus extra for visual appeal
        // Screen diagonal ~1500px, so 500 points should cover any visible trail
        if (missile.trail.length > 1000) {
            missile.trail.shift();
        }
        missile.timeAlive += deltaTime;
        
        // Remove missiles that have lived too long (prevents infinite autopilot wandering)
        if (missile.timeAlive > missile.maxLifetime) {
            createExplosion(missile.x, missile.y, true, missile.launcherIndex);
            playerMissiles.splice(i, 1);
            return;
        }
        
        // Remove missiles that go off screen
        if (missile.x < -50 || missile.x > canvas.width + 50 || 
            missile.y < -50 || missile.y > canvas.height + 50) {
            playerMissiles.splice(i, 1);
            return;
        }
        
        // Autopilot: gentle guidance towards enemies while preserving original mission
        if (missile.autopilot) {
            // Check if we should explode at original target (fallback)
            const timeToOriginalTarget = missile.originalFlightTime * 1000; // Convert to ms
            if (missile.timeAlive >= timeToOriginalTarget * 0.9) { // Explode when 90% of flight time reached
                createExplosion(missile.x, missile.y, true, missile.launcherIndex);
                playerMissiles.splice(i, 1);
                return;
            }
            
            // Look for enemies to intercept along the way
            if (enemyMissiles.length > 0) {
                let nearestEnemy: EnemyMissile | null = null;
                let nearestDist = Infinity;
                
                enemyMissiles.forEach(enemy => {
                    const dist = Math.sqrt(
                        Math.pow(missile.x - enemy.x, 2) + 
                        Math.pow(missile.y - enemy.y, 2)
                    );
                    if (dist < nearestDist && dist < 200) { // Reduced detection range
                        nearestDist = dist;
                        nearestEnemy = enemy;
                    }
                });
                
                if (nearestEnemy) {
                    // Check if we're deviating too far from original path
                    const distToOriginalPath = Math.sqrt(
                        Math.pow(missile.x - missile.originalTargetX, 2) + 
                        Math.pow(missile.y - missile.originalTargetY, 2)
                    );
                    
                    // Only steer if we haven't deviated too far
                    if (distToOriginalPath < missile.maxDeviation) {
                        // Smaller auto-explosion trigger radius (less reliable)
                        const explosionLevel = (missile.launcherIndex !== undefined && launcherUpgrades[missile.launcherIndex]) ? 
                            launcherUpgrades[missile.launcherIndex].explosion.level : 1;
                        const explosionRadius = 60 * Math.pow(1.2, explosionLevel - 1);
                        
                        if (nearestDist < explosionRadius * 0.5) { // Reduced from 0.8 to 0.5
                            (window as any).createExplosion(missile.x, missile.y, true, missile.launcherIndex);
                            playerMissiles.splice(i, 1);
                            return;
                        }
                        
                        // Gentle steering toward enemy  
                        const dx = (nearestEnemy as any).x - missile.x;
                        const dy = (nearestEnemy as any).y - missile.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        // Frame-rate independent autopilot adjustment (normalized to 60 FPS)
                        const frameMultiplier = deltaTime / 16.67;
                        const adjustmentFactor = missile.autopilotStrength * frameMultiplier;
                        const currentSpeed = Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy);
                        const targetVx = (dx / distance) * currentSpeed;
                        const targetVy = (dy / distance) * currentSpeed;
                        
                        missile.vx += (targetVx - missile.vx) * adjustmentFactor;
                        missile.vy += (targetVy - missile.vy) * adjustmentFactor;
                    }
                }
            }
        }
        
        // Frame-rate independent movement (normalized to 60 FPS)
        const frameMultiplier = deltaTime / 16.67;
        missile.x += missile.vx * frameMultiplier;
        missile.y += missile.vy * frameMultiplier;
    });
    
    // Update enemy missiles
    enemyMissiles.forEach((missile, i) => {
        missile.trail.push({x: missile.x, y: missile.y});
        
        // Very long trails - cover entire screen diagonal plus extra for visual appeal
        // Screen diagonal ~1500px, so 500 points should cover any visible trail
        if (missile.trail.length > 1000) {
            missile.trail.shift();
        }
        
        // Only recalculate threat status every 200ms for performance
        if (!missile.lastThreatCheck || Date.now() - missile.lastThreatCheck > 200) {
            missile.isTargetingValid = isMissileThreatening(missile);
            missile.lastThreatCheck = Date.now();
        }
        
        // Add sparkle effects for highlighted missiles if upgrade is purchased
        if (missile.isTargetingValid && globalUpgrades.missileHighlight.level > 0) {
            missile.sparkleTimer += deltaTime;
            if (missile.sparkleTimer > 100) { // Create sparkle every 100ms
                missile.sparkleTimer = 0;
                createParticle({
                    x: missile.x + (Math.random() - 0.5) * 20,
                    y: missile.y + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 1,
                    color: '#f44'
                });
            }
        }
        
        // Seeker AI behavior
        if (missile.isSeeker) {
            missile.seekerBlinkTimer += deltaTime;
            
            // Play seeker warning sound every blink cycle (every 1000ms)
            if (missile.seekerBlinkTimer % 1000 < deltaTime) {
                audioSystem.playSeekerWarning();
            }
            
            // Retarget periodically (every 1 second)
            if (!missile.lastRetarget || Date.now() - missile.lastRetarget > 1000) {
                const targets = [...cityPositions, ...launchers.map(l => l.x)];
                const validTargets = targets.filter((_, index) => {
                    if (index < cityPositions.length) {
                        return !destroyedCities.includes(index);
                    }
                    return true;
                });
                
                if (validTargets.length > 0) {
                    // Find nearest target
                    let nearestTarget = validTargets[0];
                    let nearestDist = Math.abs(missile.x - nearestTarget);
                    
                    validTargets.forEach(target => {
                        const dist = Math.abs(missile.x - target);
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearestTarget = target;
                        }
                    });
                    
                    missile.seekerTargetX = nearestTarget;
                }
                missile.lastRetarget = Date.now();
            }
            
            // Steering toward target (limited turn rate)
            const frameMultiplier = deltaTime / 16.67;
            const dx = missile.seekerTargetX - missile.x;
            const dy = missile.seekerTargetY - missile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const currentSpeed = Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy);
                const targetVx = (dx / distance) * currentSpeed;
                const targetVy = (dy / distance) * currentSpeed;
                
                // Good steering - more agile
                const steerStrength = 0.025 * frameMultiplier; // More responsive steering
                missile.vx += (targetVx - missile.vx) * steerStrength;
                missile.vy += (targetVy - missile.vy) * steerStrength;
                
                // Maintain constant speed for seekers (avoid division by zero)
                const newSpeed = Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy);
                const targetSpeed = calculateMissileSpeed(gameState.wave) * 0.9; // Seekers are 10% slower
                if (newSpeed > 0.1) { // Avoid near-zero speeds
                    missile.vx = (missile.vx / newSpeed) * targetSpeed;
                    missile.vy = (missile.vy / newSpeed) * targetSpeed;
                }
            }
            
            // Evasion behavior - avoid nearby player missiles and explosions
            let evasionX = 0, evasionY = 0;
            const evasionRadius = 80; // Detection range for threats
            
            // Check for nearby player missiles
            playerMissiles.forEach(playerMissile => {
                const dist = Math.sqrt(
                    Math.pow(missile.x - playerMissile.x, 2) + 
                    Math.pow(missile.y - playerMissile.y, 2)
                );
                if (dist < evasionRadius) {
                    const avoidX = missile.x - playerMissile.x;
                    const avoidY = missile.y - playerMissile.y;
                    const avoidDist = Math.max(dist, 1); // Prevent division by zero
                    evasionX += (avoidX / avoidDist) * (evasionRadius - dist);
                    evasionY += (avoidY / avoidDist) * (evasionRadius - dist);
                }
            });
            
            // Check for nearby explosions
            explosions.forEach(explosion => {
                const dist = Math.sqrt(
                    Math.pow(missile.x - explosion.x, 2) + 
                    Math.pow(missile.y - explosion.y, 2)
                );
                const dangerRadius = explosion.radius + 40; // Give some buffer
                if (dist < dangerRadius) {
                    const avoidX = missile.x - explosion.x;
                    const avoidY = missile.y - explosion.y;
                    const avoidDist = Math.max(dist, 1);
                    evasionX += (avoidX / avoidDist) * (dangerRadius - dist) * 2; // Stronger avoidance
                    evasionY += (avoidY / avoidDist) * (dangerRadius - dist) * 2;
                }
            });
            
            // Apply stronger evasion
            if (evasionX !== 0 || evasionY !== 0) {
                const evasionStrength = 0.015 * frameMultiplier; // Stronger evasion
                missile.vx += evasionX * evasionStrength;
                missile.vy += evasionY * evasionStrength;
            }
            
            // Keep seekers on screen - add gentle steering back to bounds
            const margin = 50;
            if (missile.x < margin) {
                missile.vx += 0.2 * frameMultiplier; // Very gentle push right
            } else if (missile.x > canvas.width - margin) {
                missile.vx -= 0.2 * frameMultiplier; // Very gentle push left
            }
            
            // After all adjustments, normalize speed again for seekers
            const finalSpeed = Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy);
            const seekerTargetSpeed = calculateMissileSpeed(gameState.wave) * 0.9;
            if (finalSpeed > 0) {
                missile.vx = (missile.vx / finalSpeed) * seekerTargetSpeed;
                missile.vy = (missile.vy / finalSpeed) * seekerTargetSpeed;
            }
        }
        
        // Remove enemy missiles that go way off screen
        if (missile.x < -100 || missile.x > canvas.width + 100 || 
            missile.y > canvas.height + 100) {
            enemyMissiles.splice(i, 1);
            return;
        }
        
        // Check if splitter should split
        if (missile.isSplitter && missile.splitAt && missile.y >= missile.splitAt) {
            // Create 3 warheads
            for (let j = 0; j < 3; j++) {
                const spreadAngle = (j - 1) * 0.3; // -0.3, 0, 0.3 radians
                const newTargetX = missile.targetX + (j - 1) * 150; // Spread targets
                const speed = Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy);
                
                enemyMissiles.push({
                    x: missile.x,
                    y: missile.y,
                    targetX: newTargetX,
                    targetY: 780,
                    vx: Math.sin(spreadAngle) * speed + missile.vx * 0.8,
                    vy: Math.cos(spreadAngle) * speed + missile.vy * 0.8,
                    trail: [],
                    isSplitter: false,
                    splitAt: null,
                    isSeeker: false,
                    seekerBlinkTimer: 0,
                    seekerTargetX: newTargetX,
                    seekerTargetY: 780,
                    lastRetarget: 0,
                    isTargetingValid: missile.isTargetingValid,
                    sparkleTimer: 0,
                    lastThreatCheck: 0
                });
            }
            
            // Create small explosion when splitter divides
            createExplosion(missile.x, missile.y, false, 0, 'splitter');
            
            // Remove original splitter
            enemyMissiles.splice(i, 1);
            return;
        }
        
        // Frame-rate independent movement (normalized to 60 FPS)
        const frameMultiplier = deltaTime / 16.67;
        missile.x += missile.vx * frameMultiplier;
        missile.y += missile.vy * frameMultiplier;
    });
    
    // Update other entity systems
    updatePlanes(deltaTime, canvas);
    updateExplosions(deltaTime);
    updateParticles(deltaTime);
    updateUpgradeEffects(deltaTime);
}

// updateEntities function is already exported above
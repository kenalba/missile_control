import type { Explosion } from '@/types/gameTypes';
import { launcherUpgrades } from '@/core/upgrades';
import { audioSystem } from '@/systems/audio';
import { createParticle, createImpactFlash } from './particles';

export let explosions: Explosion[] = [];

export function createExplosion(
    x: number, 
    y: number, 
    isPlayer: boolean = false, 
    launcherIndex: number = 0, 
    explosionType: 'normal' | 'plane' | 'city' | 'splitter' = 'normal'
): void {
    let size = 40;
    if (isPlayer && launcherIndex !== undefined && launcherUpgrades[launcherIndex]) {
        const explosionLevel = launcherUpgrades[launcherIndex].explosion.level;
        size = 60 * Math.pow(1.2, explosionLevel - 1);
    }
    
    // Different explosion types
    let particleCount = 15;
    let shockwave = false;
    
    if (explosionType === 'plane') {
        size *= 1.5; // Bigger explosion for planes
        particleCount = 25;
        shockwave = true;
    } else if (explosionType === 'city') {
        size *= 2; // Massive explosion for city destruction
        particleCount = 40;
        shockwave = true;
    } else if (explosionType === 'splitter') {
        size *= 0.8; // Smaller splitter explosions
        particleCount = 10;
    }
    
    const explosion: Explosion = {
        x: x,
        y: y,
        radius: 0,
        maxRadius: size,
        growing: true,
        alpha: 1,
        isPlayer: isPlayer,
        type: explosionType,
        shockwave: shockwave,
        shockwaveRadius: 0,
        shockwaveAlpha: 0.8
    };
    
    explosions.push(explosion);
    
    // Play explosion sound
    audioSystem.playExplosion(isPlayer);
    
    // Create enhanced particles with variety
    for (let i = 0; i < particleCount; i++) {
        const speed = Math.random() * 12 + 3; // Variable speeds
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5; // Spread pattern
        
        createParticle({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 1,
            color: isPlayer ? '#0f0' : (explosionType === 'plane' ? '#0af' : '#f80'),
            size: Math.random() * 3 + 1, // Variable particle sizes
            decay: 0.02 + Math.random() * 0.01 // Variable decay rates
        });
    }
    
    // Add impact flash effect
    if (explosionType === 'city' || explosionType === 'plane') {
        createImpactFlash(x, y, explosionType === 'city' ? '#ff0' : '#0af');
    }
}

export function updateExplosions(deltaTime: number): void {
    explosions.forEach((explosion, i) => {
        // Frame-rate independent movement (normalized to 60 FPS)
        const frameMultiplier = deltaTime / 16.67;
        if (explosion.growing) {
            explosion.radius += 3 * frameMultiplier;
            if (explosion.radius >= explosion.maxRadius) {
                explosion.growing = false;
            }
        } else {
            explosion.alpha -= 0.02 * frameMultiplier;
            if (explosion.alpha <= 0) {
                explosions.splice(i, 1);
                return;
            }
        }
        
        // Update shockwave if present
        if (explosion.shockwave && explosion.shockwaveAlpha > 0) {
            explosion.shockwaveRadius += 8 * frameMultiplier;
            explosion.shockwaveAlpha -= 0.03 * frameMultiplier;
        }
    });
}

export function clearExplosions(): void {
    explosions.length = 0;
}

// explosions array is already exported above
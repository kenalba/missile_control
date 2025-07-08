import type { Particle, UpgradeEffect } from '@/types/gameTypes';

export let particles: Particle[] = [];
export let upgradeEffects: UpgradeEffect[] = [];

export function createParticle(config: Partial<Particle>): void {
    const particle: Particle = {
        x: config.x || 0,
        y: config.y || 0,
        vx: config.vx || 0,
        vy: config.vy || 0,
        life: config.life || 1,
        maxLife: config.maxLife || 1,
        color: config.color || '#fff',
        size: config.size || 2,
        decay: config.decay || 0.02,
        isFlash: config.isFlash || false
    };
    
    particles.push(particle);
}

export function createImpactFlash(x: number, y: number, color: string): void {
    createParticle({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        life: 0.3,
        maxLife: 0.3,
        color: color,
        size: 100,
        decay: 0.1,
        isFlash: true
    });
}

export function createUpgradeEffect(x: number, y: number, text: string, color: string = '#0f0'): void {
    const effect: UpgradeEffect = {
        x: x,
        y: y,
        text: text,
        alpha: 1,
        life: 120, // 2 seconds at 60fps
        vy: -1,
        color: color
    };
    
    upgradeEffects.push(effect);
}

export function updateParticles(deltaTime: number): void {
    particles.forEach((particle, i) => {
        // Frame-rate independent movement (normalized to 60 FPS)
        const frameMultiplier = deltaTime / 16.67;
        
        if (!particle.isFlash) {
            particle.x += particle.vx * frameMultiplier;
            particle.y += particle.vy * frameMultiplier;
            particle.vy += 0.2 * frameMultiplier; // gravity for normal particles
        }
        
        // Use custom decay rate if available
        const decayRate = particle.decay || 0.02;
        particle.life -= decayRate * frameMultiplier;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    });
}

export function updateUpgradeEffects(deltaTime: number): void {
    upgradeEffects.forEach((effect, i) => {
        // Frame-rate independent movement (normalized to 60 FPS)
        const frameMultiplier = deltaTime / 16.67;
        effect.y += effect.vy * frameMultiplier;
        effect.alpha -= 0.02 * frameMultiplier;
        effect.life -= frameMultiplier;
        
        if (effect.life <= 0 || effect.alpha <= 0) {
            upgradeEffects.splice(i, 1);
        }
    });
}

export function clearParticles(): void {
    particles.length = 0;
    upgradeEffects.length = 0;
}

// Arrays are already exported above
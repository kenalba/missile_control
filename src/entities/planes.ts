import type { Plane } from '@/types/gameTypes';
import { gameState } from '@/systems/observableState';
import { audioSystem } from '@/systems/audio';
import { enemyMissiles } from './missiles';

export let planes: Plane[] = [];

export function spawnPlane(canvas: HTMLCanvasElement): void {
    // Planes spawn from sides of screen starting at wave 5
    if (gameState.wave < 5) return;
    
    // 50% chance to spawn from left, 50% from right
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -50 : canvas.width + 50;
    
    // Random height between 100-300 pixels from top
    const y = 100 + Math.random() * 200;
    
    // Speed scales with wave like missiles
    const speed = 1.2 + (gameState.wave * 0.08) + (Math.min(gameState.wave, 15) * 0.02);
    
    const newPlane: Plane = {
        x: startX,
        y: y,
        vx: fromLeft ? speed : -speed,
        vy: 0,
        lastFire: 0,
        fireRate: 2000 + Math.random() * 1000, // Fire every 2-3 seconds
        trail: [],
        hp: 1, // Takes 1 hit to destroy
        fromLeft: fromLeft,
        engineSoundId: null // Will store audio ID for engine sound
    };
    
    planes.push(newPlane);
    
    // Play engine sound
    if (audioSystem && audioSystem.playPlaneEngine) {
        newPlane.engineSoundId = audioSystem.playPlaneEngine();
    }
    
    console.log("Debug: Spawned plane");
}

export function spawnTestPlane(canvas: HTMLCanvasElement): void {
    // 50% chance to spawn from left, 50% from right
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -50 : canvas.width + 50;
    
    // Random height between 100-300 pixels from top
    const y = 100 + Math.random() * 200;
    
    // Speed scales with wave like missiles
    const speed = 1.2 + (gameState.wave * 0.08) + (Math.min(gameState.wave, 15) * 0.02);
    
    const newPlane: Plane = {
        x: startX,
        y: y,
        vx: fromLeft ? speed : -speed,
        vy: 0,
        lastFire: 0,
        fireRate: 2000 + Math.random() * 1000, // Fire every 2-3 seconds
        trail: [],
        hp: 1, // Takes 1 hit to destroy
        fromLeft: fromLeft,
        engineSoundId: null // Will store audio ID for engine sound
    };
    
    planes.push(newPlane);
    
    // Play engine sound
    if (audioSystem && audioSystem.playPlaneEngine) {
        newPlane.engineSoundId = audioSystem.playPlaneEngine();
    }
    
    console.log("Debug: Spawned test plane");
}

export function updatePlanes(deltaTime: number, canvas: HTMLCanvasElement): void {
    planes.forEach((plane, i) => {
        plane.trail.push({x: plane.x, y: plane.y});
        
        // Keep trail length reasonable for planes (shorter trails)
        if (plane.trail.length > 30) {
            plane.trail.shift();
        }
        
        // Remove planes that go off screen
        if (plane.x < -100 || plane.x > canvas.width + 100) {
            // Stop engine sound if it exists
            if (plane.engineSoundId && audioSystem && audioSystem.stopSound) {
                audioSystem.stopSound(plane.engineSoundId);
            }
            planes.splice(i, 1);
            return;
        }
        
        // Plane firing logic
        if (Date.now() - plane.lastFire > plane.fireRate) {
            // Fire missile downward from plane
            const missileSpeed = 1.2;
            enemyMissiles.push({
                x: plane.x,
                y: plane.y + 10,
                targetX: plane.x,
                targetY: 780,
                vx: 0,
                vy: missileSpeed,
                trail: [],
                isSplitter: false,
                splitAt: null,
                isSeeker: false,
                seekerBlinkTimer: 0,
                seekerTargetX: plane.x,
                seekerTargetY: 780,
                lastRetarget: 0,
                isTargetingValid: false,
                sparkleTimer: 0,
                lastThreatCheck: 0,
                fromPlane: true // Mark as plane-fired missile
            });
            
            plane.lastFire = Date.now();
            
            // Play plane firing sound
            if (audioSystem && audioSystem.playPlaneFire) {
                audioSystem.playPlaneFire();
            }
        }
        
        // Frame-rate independent movement (normalized to 60 FPS)
        const frameMultiplier = deltaTime / 16.67;
        plane.x += plane.vx * frameMultiplier;
        plane.y += plane.vy * frameMultiplier;
    });
}

export function clearPlanes(): void {
    // Stop all engine sounds before clearing
    planes.forEach(plane => {
        if (plane.engineSoundId && audioSystem && audioSystem.stopSound) {
            audioSystem.stopSound(plane.engineSoundId);
        }
    });
    planes.length = 0;
}

// planes array is already exported above
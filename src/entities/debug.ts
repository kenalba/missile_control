// Debug functions for testing game features
import { enemyMissiles } from './missiles';
import { calculateMissileSpeed } from './missiles';
import { gameState } from '@/core/gameState';
import { cityPositions, destroyedCities } from './cities';
import { launchers } from './launchers';

// Debug function to spawn a test seeker
export function spawnTestSeeker(canvas: HTMLCanvasElement): void {
    const startX = Math.random() * canvas.width;
    const targets = [...cityPositions, ...launchers.map(l => l.x)];
    const validTargets = targets.filter((_, index) => {
        if (index < cityPositions.length) {
            return !destroyedCities.includes(index);
        }
        return true;
    });
    
    let targetX = canvas.width / 2; // Default center target
    if (validTargets.length > 0) {
        targetX = validTargets[Math.floor(Math.random() * validTargets.length)];
    }
    
    const speed = calculateMissileSpeed(gameState.wave) * 0.8; // Seekers are 20% slower
    
    const testSeeker = {
        x: startX,
        y: 0,
        targetX: targetX,
        targetY: 780,
        vx: (targetX - startX) * speed / 400,
        vy: speed,
        trail: [],
        isSplitter: false,
        splitAt: null,
        isSeeker: true,
        seekerBlinkTimer: 0,
        seekerTargetX: targetX,
        seekerTargetY: 780,
        lastRetarget: 0,
        isTargetingValid: false,
        sparkleTimer: 0,
        lastThreatCheck: 0
    };
    
    enemyMissiles.push(testSeeker);
    console.log("Debug: Spawned test seeker");
}

// spawnTestSeeker function is already exported above
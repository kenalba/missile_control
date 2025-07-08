// Achievements and Celebration System
import type { Achievements } from '@/types/gameTypes';

// Create celebration effect with floating text and particles
export function createCelebrationEffect(x: number, y: number, text: string, color = '#ffd700', size = 24): void {
    const particles = (window as any).particles;
    if (!particles) return;
    
    // Create floating text
    particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: -3,
        life: 3,
        maxLife: 3,
        color: color,
        size: size,
        text: text,
        isText: true,
        decay: 0.005
    });
    
    // Create sparkle particles around the text
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const speed = Math.random() * 4 + 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.5,
            maxLife: 1.5,
            color: color,
            size: Math.random() * 2 + 1,
            decay: 0.01,
            sparkle: true
        });
    }
}

// Create fireworks effect
export function createFireworks(x: number, y: number, color = '#ffd700'): void {
    const particles = (window as any).particles;
    if (!particles) return;
    
    // Create multiple bursts
    for (let burst = 0; burst < 3; burst++) {
        setTimeout(() => {
            for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 * i) / 20;
                const speed = Math.random() * 8 + 4;
                particles.push({
                    x: x + (Math.random() - 0.5) * 100,
                    y: y + (Math.random() - 0.5) * 50,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 2,
                    maxLife: 2,
                    color: Math.random() > 0.5 ? color : '#fff',
                    size: Math.random() * 3 + 1,
                    decay: 0.008,
                    firework: true
                });
            }
        }, burst * 200);
    }
}

// Check wave milestones and trigger celebrations
export function checkWaveMilestones(): void {
    const gameState = (window as any).gameState;
    const canvas = (window as any).canvas;
    const audioSystem = (window as any).audioSystem;
    const addScreenShake = (window as any).addScreenShake;
    
    if (!gameState || !canvas) return;
    
    const wave = gameState.wave;
    
    // Major milestones every 5 waves
    if (wave % 5 === 0 && wave > gameState.achievements.lastMilestoneWave) {
        gameState.achievements.lastMilestoneWave = wave;
        
        // Create celebration at center of screen
        createCelebrationEffect(canvas.width / 2, 200, `WAVE ${wave}!`, '#ffd700', 32);
        createFireworks(canvas.width / 2, 250);
        
        // Add screen shake for celebration
        if (addScreenShake) {
            addScreenShake(6, 500);
        }
        
        // Play celebration sound
        if (audioSystem?.playTone) {
            audioSystem.playTone(440, 0.3, 'sine', 0.08); // A note
            setTimeout(() => audioSystem.playTone(554, 0.3, 'sine', 0.08), 150); // C# note
            setTimeout(() => audioSystem.playTone(659, 0.5, 'sine', 0.08), 300); // E note
        }
    }
    
    // Special celebrations for major milestones
    if (wave === 10) {
        createCelebrationEffect(canvas.width / 2, 150, "FIRST DECAD!", '#ff6b6b', 28);
        createFireworks(canvas.width / 4, 200, '#ff6b6b');
        createFireworks(canvas.width * 3/4, 200, '#ff6b6b');
    } else if (wave === 25) {
        createCelebrationEffect(canvas.width / 2, 150, "QUARTER CENTURY!", '#4ecdc4', 28);
        createFireworks(canvas.width / 3, 200, '#4ecdc4');
        createFireworks(canvas.width * 2/3, 200, '#4ecdc4');
    } else if (wave === 50) {
        createCelebrationEffect(canvas.width / 2, 150, "HALF CENTURY!", '#ffe66d', 28);
        for (let i = 0; i < 5; i++) {
            createFireworks(canvas.width * (i + 1) / 6, 200, '#ffe66d');
        }
    }
}

// Check achievements and trigger appropriate celebrations
export function checkAchievements(): void {
    const gameState = (window as any).gameState;
    const canvas = (window as any).canvas;
    
    if (!gameState?.achievements || !canvas) return;
    
    const achievements = gameState.achievements;
    
    // Missile destroyer milestones
    if (achievements.missilesDestroyed === 100) {
        createCelebrationEffect(canvas.width / 2, 300, "100 MISSILES!", '#0ff', 20);
        createFireworks(canvas.width / 2, 350, '#0ff');
    } else if (achievements.missilesDestroyed === 500) {
        createCelebrationEffect(canvas.width / 2, 300, "500 MISSILES!", '#0ff', 24);
        createFireworks(canvas.width / 2, 350, '#0ff');
    } else if (achievements.missilesDestroyed === 1000) {
        createCelebrationEffect(canvas.width / 2, 300, "1000 MISSILES!", '#0ff', 28);
        createFireworks(canvas.width / 3, 350, '#0ff');
        createFireworks(canvas.width * 2/3, 350, '#0ff');
    }
    
    // Plane destroyer milestones
    if (achievements.planesDestroyed === 10) {
        createCelebrationEffect(canvas.width / 2, 400, "ACE PILOT!", '#ff9f43', 20);
    } else if (achievements.planesDestroyed === 50) {
        createCelebrationEffect(canvas.width / 2, 400, "SKY CLEANER!", '#ff9f43', 24);
        createFireworks(canvas.width / 2, 450, '#ff9f43');
    }
    
    // Seeker destroyer milestones
    if (achievements.seekersDestroyed === 25) {
        createCelebrationEffect(canvas.width / 2, 350, "SEEKER HUNTER!", '#ff6b6b', 20);
        createFireworks(canvas.width / 2, 400, '#ff6b6b');
    }
    
    // Scrap milestones
    if (achievements.totalScrapEarned === 1000) {
        createCelebrationEffect(canvas.width / 2, 250, "SCRAP MASTER!", '#ffd700', 20);
    } else if (achievements.totalScrapEarned === 5000) {
        createCelebrationEffect(canvas.width / 2, 250, "RESOURCE KING!", '#ffd700', 24);
        createFireworks(canvas.width / 2, 300, '#ffd700');
    }
}

// Award achievement progress
export function awardAchievement(type: keyof Achievements, amount = 1): void {
    const gameState = (window as any).gameState;
    if (!gameState?.achievements) return;
    
    const oldValue = gameState.achievements[type];
    gameState.achievements[type] += amount;
    
    // Check if we hit a milestone
    setTimeout(() => checkAchievements(), 100);
    
    console.log(`Achievement progress: ${type} ${oldValue} -> ${gameState.achievements[type]}`);
}

// Reset achievements
export function resetAchievements(): void {
    const gameState = (window as any).gameState;
    if (!gameState) return;
    
    gameState.achievements = {
        missilesDestroyed: 0,
        planesDestroyed: 0,
        wavesCompleted: 0,
        citiesLost: 0,
        seekersDestroyed: 0,
        totalScrapEarned: 0,
        lastMilestoneWave: 0
    };
}

// Get achievement statistics
export function getAchievementStats(): Achievements {
    const gameState = (window as any).gameState;
    return gameState?.achievements || {
        missilesDestroyed: 0,
        planesDestroyed: 0,
        wavesCompleted: 0,
        citiesLost: 0,
        seekersDestroyed: 0,
        totalScrapEarned: 0,
        lastMilestoneWave: 0
    };
}

// Make globally available for legacy compatibility
(window as any).createCelebrationEffect = createCelebrationEffect;
(window as any).createFireworks = createFireworks;
(window as any).checkWaveMilestones = checkWaveMilestones;
(window as any).checkAchievements = checkAchievements;
(window as any).awardAchievement = awardAchievement;
(window as any).resetAchievements = resetAchievements;
(window as any).getAchievementStats = getAchievementStats;
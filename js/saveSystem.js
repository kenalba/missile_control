// Save system for persistent data
const SAVE_KEY = 'missile_control_save';
const SAVE_VERSION = 1;

// Default save data structure
function getDefaultSaveData() {
    return {
        version: SAVE_VERSION,
        highScores: [], // Array of {score, wave, date}
        totalStats: {
            gamesPlayed: 0,
            totalScore: 0,
            totalMissilesDestroyed: 0,
            totalWavesCompleted: 0,
            highestWave: 0,
            totalPlayTime: 0 // in milliseconds
        },
        achievements: {
            // Wave milestones
            wave5: false,
            wave10: false,
            wave15: false,
            wave20: false,
            
            // Score milestones
            score10k: false,
            score50k: false,
            score100k: false,
            score500k: false,
            
            // Missile destruction milestones
            missiles100: false,
            missiles500: false,
            missiles1000: false,
            missiles5000: false,
            
            // Upgrade milestones
            firstUpgrade: false,
            allLaunchersMaxed: false,
            cityMaxed: false,
            economicUpgrades: false,
            
            // Survival milestones
            perfectWave: false, // Complete wave without losing cities
            allCitiesSaved: false, // Finish game with all 6 cities
            longGame: false // Play for 30+ minutes
        },
        preferences: {
            soundEnabled: true,
            showTutorial: true,
            lastSelectedMode: 'arcade' // Track the last selected game mode
        }
    };
}

// Load save data from localStorage
function loadSaveData() {
    try {
        const savedData = localStorage.getItem(SAVE_KEY);
        if (!savedData) {
            return getDefaultSaveData();
        }
        
        const parsed = JSON.parse(savedData);
        
        // Version migration if needed
        if (parsed.version !== SAVE_VERSION) {
            console.log('Save data version mismatch, migrating...');
            return migrateSaveData(parsed);
        }
        
        // Merge with defaults to ensure all fields exist
        return { ...getDefaultSaveData(), ...parsed };
    } catch (error) {
        console.error('Failed to load save data:', error);
        return getDefaultSaveData();
    }
}

// Migrate old save data to new version
function migrateSaveData(oldData) {
    const newData = getDefaultSaveData();
    
    // Copy over any existing data that's compatible
    if (oldData.highScores) newData.highScores = oldData.highScores;
    if (oldData.totalStats) newData.totalStats = { ...newData.totalStats, ...oldData.totalStats };
    if (oldData.achievements) newData.achievements = { ...newData.achievements, ...oldData.achievements };
    if (oldData.preferences) newData.preferences = { ...newData.preferences, ...oldData.preferences };
    
    return newData;
}

// Save data to localStorage
function saveSaveData(saveData) {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        return true;
    } catch (error) {
        console.error('Failed to save data:', error);
        return false;
    }
}

// Global save data instance
let saveData = loadSaveData();

// Save functions
function saveGame() {
    saveSaveData(saveData);
}

// Add a high score
function addHighScore(score, wave) {
    const newScore = {
        score: score,
        wave: wave,
        date: new Date().toISOString()
    };
    
    saveData.highScores.push(newScore);
    
    // Sort by score descending and keep top 10
    saveData.highScores.sort((a, b) => b.score - a.score);
    if (saveData.highScores.length > 10) {
        saveData.highScores = saveData.highScores.slice(0, 10);
    }
    
    saveGame();
    return newScore;
}

// Update total stats (but don't save immediately)
function updateStats(statsUpdate) {
    Object.keys(statsUpdate).forEach(key => {
        if (key in saveData.totalStats) {
            if (key === 'highestWave') {
                saveData.totalStats[key] = Math.max(saveData.totalStats[key], statsUpdate[key]);
            } else {
                saveData.totalStats[key] += statsUpdate[key];
            }
        }
    });
}

// Save at wave completion
function saveWaveCompletion(currentWave, currentScore) {
    // Calculate missiles destroyed from score (10 points per missile)
    const totalMissilesDestroyed = Math.floor(currentScore / 10);
    
    updateStats({
        totalWavesCompleted: 1,
        totalMissilesDestroyed: totalMissilesDestroyed - saveData.totalStats.totalMissilesDestroyed,
        highestWave: currentWave,
        totalScore: currentScore - saveData.totalStats.totalScore
    });
    
    const newAchievements = checkAchievements() || [];
    saveGame();
    
    // Show any new achievement notifications
    if (newAchievements && newAchievements.length > 0) {
        newAchievements.forEach(achievement => {
            setTimeout(() => showAchievementNotification(achievement), 500);
        });
    }
}

// Save at game over
function saveGameOver(finalScore, finalWave) {
    // Calculate missiles destroyed from score (10 points per missile)
    const totalMissilesDestroyed = Math.floor(finalScore / 10);
    
    updateStats({
        gamesPlayed: 1,
        totalMissilesDestroyed: totalMissilesDestroyed - saveData.totalStats.totalMissilesDestroyed,
        highestWave: finalWave
    });
    
    addHighScore(finalScore, finalWave);
    const newAchievements = checkAchievements() || [];
    
    // Show any new achievement notifications
    if (newAchievements && newAchievements.length > 0) {
        newAchievements.forEach(achievement => {
            setTimeout(() => showAchievementNotification(achievement), 500);
        });
    }
}

// Check and unlock achievements
function checkAchievements() {
    if (!saveData || !saveData.achievements || !saveData.totalStats) {
        return [];
    }
    
    const achievements = saveData.achievements;
    const stats = saveData.totalStats;
    let newAchievements = [];
    
    // Wave milestones
    if (!achievements.wave5 && stats.highestWave >= 5) {
        achievements.wave5 = true;
        newAchievements.push({ id: 'wave5', name: 'Wave Rider', description: 'Reach wave 5' });
    }
    if (!achievements.wave10 && stats.highestWave >= 10) {
        achievements.wave10 = true;
        newAchievements.push({ id: 'wave10', name: 'Veteran Defender', description: 'Reach wave 10' });
    }
    if (!achievements.wave15 && stats.highestWave >= 15) {
        achievements.wave15 = true;
        newAchievements.push({ id: 'wave15', name: 'Elite Guardian', description: 'Reach wave 15' });
    }
    if (!achievements.wave20 && stats.highestWave >= 20) {
        achievements.wave20 = true;
        newAchievements.push({ id: 'wave20', name: 'Legendary Commander', description: 'Reach wave 20' });
    }
    
    // Score milestones
    const highScore = saveData.highScores.length > 0 ? saveData.highScores[0].score : 0;
    if (!achievements.score10k && highScore >= 10000) {
        achievements.score10k = true;
        newAchievements.push({ id: 'score10k', name: 'Point Collector', description: 'Score 10,000 points' });
    }
    if (!achievements.score50k && highScore >= 50000) {
        achievements.score50k = true;
        newAchievements.push({ id: 'score50k', name: 'High Scorer', description: 'Score 50,000 points' });
    }
    if (!achievements.score100k && highScore >= 100000) {
        achievements.score100k = true;
        newAchievements.push({ id: 'score100k', name: 'Score Master', description: 'Score 100,000 points' });
    }
    if (!achievements.score500k && highScore >= 500000) {
        achievements.score500k = true;
        newAchievements.push({ id: 'score500k', name: 'Point Legend', description: 'Score 500,000 points' });
    }
    
    // Missile destruction milestones
    if (!achievements.missiles100 && stats.totalMissilesDestroyed >= 100) {
        achievements.missiles100 = true;
        newAchievements.push({ id: 'missiles100', name: 'Missile Hunter', description: 'Destroy 100 missiles' });
    }
    if (!achievements.missiles500 && stats.totalMissilesDestroyed >= 500) {
        achievements.missiles500 = true;
        newAchievements.push({ id: 'missiles500', name: 'Sky Sweeper', description: 'Destroy 500 missiles' });
    }
    if (!achievements.missiles1000 && stats.totalMissilesDestroyed >= 1000) {
        achievements.missiles1000 = true;
        newAchievements.push({ id: 'missiles1000', name: 'Defense Expert', description: 'Destroy 1,000 missiles' });
    }
    if (!achievements.missiles5000 && stats.totalMissilesDestroyed >= 5000) {
        achievements.missiles5000 = true;
        newAchievements.push({ id: 'missiles5000', name: 'Missile Annihilator', description: 'Destroy 5,000 missiles' });
    }
    
    if (newAchievements.length > 0) {
        saveGame();
        return newAchievements;
    }
    
    return [];
}

// Achievement notification system
function showAchievementNotification(achievement) {
    // Create achievement notification effect
    upgradeEffects.push({
        x: canvas.width / 2,
        y: 100,
        text: `🏆 ${achievement.name}`,
        alpha: 1,
        vy: -0.5,
        life: 200 // Longer display time for achievements
    });
    
    // Add sparkle particles
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: canvas.width / 2 + (Math.random() - 0.5) * 100,
            y: 100 + (Math.random() - 0.5) * 50,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 1.5,
            color: '#ffd700' // Gold color for achievements
        });
    }
}

// Clear all save data (for testing or reset)
function clearSaveData() {
    localStorage.removeItem(SAVE_KEY);
    saveData = getDefaultSaveData();
}

// Save mode preference
function saveMode(mode) {
    saveData.preferences.lastSelectedMode = mode;
    saveGame();
}

// Get last selected mode
function getLastSelectedMode() {
    return saveData.preferences.lastSelectedMode || 'arcade';
}

// Export functions for use in other files
window.saveSystem = {
    saveData,
    saveGame,
    saveWaveCompletion,
    saveGameOver,
    addHighScore,
    updateStats,
    checkAchievements,
    showAchievementNotification,
    clearSaveData,
    saveMode,
    getLastSelectedMode
};
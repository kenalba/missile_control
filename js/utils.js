// Utility functions and collision detection
function checkCollisions() {
    // Check player missiles reaching targets
    playerMissiles.forEach((missile, i) => {
        const distToTarget = Math.sqrt(
            Math.pow(missile.x - missile.targetX, 2) + 
            Math.pow(missile.y - missile.targetY, 2)
        );
        
        if (distToTarget < 10) {
            createExplosion(missile.x, missile.y, true, missile.launcherIndex);
            playerMissiles.splice(i, 1);
        }
    });
    
    // Check enemy missiles hitting ground
    enemyMissiles.forEach((missile, i) => {
        if (missile.y >= 800) {
            createExplosion(missile.x, missile.y, false);
            enemyMissiles.splice(i, 1);
            
            // Screen shake for ground impact
            addScreenShake(4, 300);
            
            // Check if city was hit (match visual city boundaries)
            cityPositions.forEach((cityX, cityIndex) => {
                if (!destroyedCities.includes(cityIndex) && 
                    Math.abs(missile.x - cityX) < 50 && missile.y >= 790) {
                    destroyedCities.push(cityIndex);
                    gameState.cities--;
                    gameState.achievements.citiesLost++;
                    // Wipe city upgrade when destroyed
                    cityUpgrades[cityIndex] = 0;
                    
                    // Create massive city destruction explosion
                    createExplosion(cityX, 780, false, 0, 'city');
                    
                    // Screen shake for city destruction
                    addScreenShake(8, 800);
                    
                    // Stronger vibration for city destruction
                    if (navigator.vibrate) {
                        navigator.vibrate([100, 50, 100]); // Pattern: vibrate-pause-vibrate
                    }
                }
            });
            
            // Check if launcher was hit
            launchers.forEach((launcher, launcherIndex) => {
                if (!destroyedLaunchers.includes(launcherIndex) && 
                    Math.abs(missile.x - launcher.x) < 40 && missile.y >= launcher.y - 20) {
                    destroyedLaunchers.push(launcherIndex);
                }
            });
        }
    });
    
    // Check explosions destroying enemy missiles
    explosions.forEach(explosion => {
        if (explosion.isPlayer) {
            enemyMissiles.forEach((missile, i) => {
                const dist = Math.sqrt(
                    Math.pow(missile.x - explosion.x, 2) + 
                    Math.pow(missile.y - explosion.y, 2)
                );
                
                if (dist < explosion.radius) {
                    // Higher rewards for destroying seekers
                    if (missile.isSeeker) {
                        gameState.score += 25; // 2.5x points for seekers
                        gameState.scrap += applyScrapBonus(5); // 2.5x scrap for seekers
                        gameState.achievements.seekersDestroyed++;
                    } else {
                        gameState.score += 10;
                        gameState.scrap += applyScrapBonus(2);
                    }
                    gameState.achievements.missilesDestroyed++;
                    gameState.achievements.totalScrapEarned += applyScrapBonus(missile.isSeeker ? 5 : 2);
                    
                    createExplosion(missile.x, missile.y, false);
                    enemyMissiles.splice(i, 1);
                    
                    // Check for achievements
                    checkAchievements();
                    
                    // Small screen shake for missile destruction
                    addScreenShake(2, 150);
                    
                    // Mobile vibration feedback
                    if (navigator.vibrate) {
                        navigator.vibrate(50); // Short vibration for hit
                    }
                }
            });
        }
        
        // Check explosions destroying planes
        if (explosion.isPlayer) {
            planes.forEach((plane, i) => {
                const dist = Math.sqrt(
                    Math.pow(plane.x - explosion.x, 2) + 
                    Math.pow(plane.y - explosion.y, 2)
                );
                
                if (dist < explosion.radius) {
                    plane.hp--;
                    if (plane.hp <= 0) {
                        gameState.score += 50; // More points for destroying plane
                        let planeScrap = 5;
                        if (globalUpgrades.salvage.level > 0) {
                            planeScrap += 3; // Salvage upgrade adds +3 scrap from planes
                        }
                        gameState.scrap += applyScrapBonus(planeScrap);
                        gameState.achievements.planesDestroyed++;
                        gameState.achievements.totalScrapEarned += applyScrapBonus(planeScrap);
                        
                        // Stop engine sound
                        if (plane.engineSoundId && audioSystem && audioSystem.stopSound) {
                            audioSystem.stopSound(plane.engineSoundId);
                        }
                        
                        createExplosion(plane.x, plane.y, false, 0, 'plane');
                        planes.splice(i, 1);
                        
                        // Check for achievements
                        checkAchievements();
                        
                        // Medium screen shake for plane destruction
                        addScreenShake(5, 400);
                        
                        // Create visual effect
                        upgradeEffects.push({
                            x: plane.x,
                            y: plane.y - 30,
                            text: `+50pts +${applyScrapBonus(planeScrap)}scrap`,
                            alpha: 1,
                            vy: -2,
                            life: 80
                        });
                        
                        // Mobile vibration feedback
                        if (navigator.vibrate) {
                            navigator.vibrate([50, 20, 50]); // Pattern for plane destruction
                        }
                    }
                }
            });
        }
    });
}
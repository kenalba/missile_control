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
        if (missile.y >= 760) {
            createExplosion(missile.x, missile.y, false);
            enemyMissiles.splice(i, 1);
            
            // Check if city was hit (check against city height, not just ground)
            cityPositions.forEach((cityX, cityIndex) => {
                if (!destroyedCities.includes(cityIndex) && 
                    Math.abs(missile.x - cityX) < 50 && missile.y >= 730) {
                    destroyedCities.push(cityIndex);
                    gameState.cities--;
                    // Wipe city upgrade when destroyed
                    cityUpgrades[cityIndex] = 0;
                    
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
                    gameState.score += 10;
                    gameState.scrap += 2;
                    createExplosion(missile.x, missile.y, false);
                    enemyMissiles.splice(i, 1);
                    
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
                        gameState.scrap += 5; // More scrap for destroying plane
                        
                        // Stop engine sound
                        if (plane.engineSoundId && audioSystem && audioSystem.stopSound) {
                            audioSystem.stopSound(plane.engineSoundId);
                        }
                        
                        createExplosion(plane.x, plane.y, false);
                        planes.splice(i, 1);
                        
                        // Create visual effect
                        upgradeEffects.push({
                            x: plane.x,
                            y: plane.y - 30,
                            text: '+50pts +5scrap',
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
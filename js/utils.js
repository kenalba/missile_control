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
        if (missile.y >= 780) {
            createExplosion(missile.x, missile.y, false);
            enemyMissiles.splice(i, 1);
            
            // Check if city was hit (check against city height, not just ground)
            cityPositions.forEach((cityX, cityIndex) => {
                if (!destroyedCities.includes(cityIndex) && 
                    Math.abs(missile.x - cityX) < 50 && missile.y >= 725) {
                    destroyedCities.push(cityIndex);
                    gameState.cities--;
                    // Wipe city upgrade when destroyed
                    cityUpgrades[cityIndex] = 0;
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
                }
            });
        }
    });
}
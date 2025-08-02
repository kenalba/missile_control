// Command Mode City Management System
import type { CityData, CityProductivityUpgrades } from '@/types/gameTypes';
import { gameState } from '@/systems/observableState';
import { launchers } from '@/entities/launchers';
import { destroyedCities, cityPositions } from '@/entities/cities';
import { createUpgradeEffect } from '@/entities/particles';
import { createAmmoTruck } from '@/entities/trucks';

// Command Mode city system
export let cityData: CityData[] = [
    // Each city has: population, maxPopulation, productionMode, baseProduction
    // Ammo stockpiles are added dynamically for backward compatibility
    { population: 100, maxPopulation: 100, productionMode: 'scrap', baseProduction: 1.5 } as any,
    { population: 100, maxPopulation: 100, productionMode: 'science', baseProduction: 1.5 } as any,
    { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.5 } as any,
    { population: 100, maxPopulation: 100, productionMode: 'scrap', baseProduction: 1.5 } as any,
    { population: 100, maxPopulation: 100, productionMode: 'science', baseProduction: 1.5 } as any,
    { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.5 } as any
];

// City upgrade levels (legacy system for Arcade Mode)
export let cityUpgrades: number[] = [0, 0, 0, 0, 0, 0];

// City population upgrades (Command Mode)
export let cityPopulationUpgrades: number[] = [0, 0, 0, 0, 0, 0];

// City productivity upgrades (Command Mode)
export let cityProductivityUpgrades: CityProductivityUpgrades = {
    scrap: [0, 0, 0, 0, 0, 0],
    science: [0, 0, 0, 0, 0, 0],
    ammo: [0, 0, 0, 0, 0, 0]
};

// Resource accumulators for precise fractional production
export let ammoAccumulator = 0;
export let scrapAccumulator = 0;
export let scienceAccumulator = 0;

// Calculate production rate per second for a specific city
export function calculateCityProductionRate(cityIndex: number): string {
    if (cityIndex < 0 || cityIndex >= cityData.length) return '0.0';
    
    if (destroyedCities.includes(cityIndex)) return '0.0';
    
    const city = cityData[cityIndex];
    if (city.population <= 0) return '0.0';
    
    // Use floating-point calculation for better precision
    const populationMultiplier = city.population / city.maxPopulation;
    const baseProduction = city.baseProduction * populationMultiplier;
    
    const productivityLevel = cityProductivityUpgrades[city.productionMode][cityIndex];
    const productivityMultiplier = 1 + (productivityLevel * 0.25);
    let finalProduction = baseProduction * productivityMultiplier;
    
    // Double science production rate to match actual generation
    if (city.productionMode === 'science') {
        finalProduction *= 2;
    }
    
    // Convert from per-3-seconds to per-second
    return (finalProduction / 3).toFixed(1);
}

// Ensure city has ammo stockpile and truck properties (backward compatibility)
function ensureAmmoStockpile(city: any): void {
    if (!city.ammoStockpile) {
        city.ammoStockpile = 0;
    }
    if (city.maxAmmoStockpile === undefined) {
        city.maxAmmoStockpile = 5;
    }
    if (city.maxTrucks === undefined) {
        city.maxTrucks = 1; // Each city starts with 1 truck
    }
}

// Generate resources from cities based on population and production mode
export function generateCityResources(): void {
    if (!gameState || !launchers || launchers.length === 0) {
        return;
    }
    
    for (let i = 0; i < cityData.length; i++) {
        if (destroyedCities.includes(i)) {
            continue;
        }
        
        const city = cityData[i];
        if (city.population <= 0) {
            continue;
        }
        
        // Only ensure ammo stockpile for ammo-producing cities
        if (city.productionMode === 'ammo') {
            ensureAmmoStockpile(city);
        }
        
        const populationMultiplier = city.population / city.maxPopulation;
        const baseProduction = city.baseProduction * populationMultiplier;
        
        const productivityLevel = cityProductivityUpgrades[city.productionMode][i];
        const productivityMultiplier = 1 + (productivityLevel * 0.25);
        const finalProduction = baseProduction * productivityMultiplier;
        
        switch (city.productionMode) {
            case 'scrap':
                // Accumulate fractional scrap production
                scrapAccumulator += finalProduction;
                
                // Convert to integer scrap when we have enough
                const scrapToAward = Math.floor(scrapAccumulator);
                if (scrapToAward > 0) {
                    scrapAccumulator -= scrapToAward;
                    
                    // Visual feedback for scrap production
                    const cityX = cityPositions[i];
                    createUpgradeEffect(cityX, 750, `+${scrapToAward} SCRAP`, '#0f0');
                    
                    if ((window as any).awardScrap) {
                        (window as any).awardScrap(scrapToAward, `city ${i}`);
                    } else {
                        gameState.scrap += scrapToAward;
                    }
                }
                break;
                
            case 'science':
                // Accumulate fractional science production (doubled rate for faster progression)
                scienceAccumulator += finalProduction * 2;
                
                // Convert to integer science when we have enough
                const scienceToAward = Math.floor(scienceAccumulator);
                if (scienceToAward > 0) {
                    scienceAccumulator -= scienceToAward;
                    
                    // Visual feedback for science production
                    const cityX = cityPositions[i];
                    createUpgradeEffect(cityX, 750, `+${scienceToAward} RESEARCH`, '#00f');
                    
                    if ((window as any).awardScience) {
                        (window as any).awardScience(scienceToAward);
                    } else {
                        gameState.science += scienceToAward;
                    }
                }
                break;
                
            case 'ammo':
                // Accumulate fractional ammo production
                ammoAccumulator += finalProduction;
                
                // Convert to integer ammo when we have enough
                const ammoToDistribute = Math.floor(ammoAccumulator);
                if (ammoToDistribute > 0) {
                    ammoAccumulator -= ammoToDistribute;
                    
                    // Add to city ammo stockpile
                    const stockpileSpace = (city as any).maxAmmoStockpile - (city as any).ammoStockpile;
                    const toStockpile = Math.min(ammoToDistribute, stockpileSpace);
                    
                    if (toStockpile > 0) {
                        (city as any).ammoStockpile += toStockpile;
                        const cityX = cityPositions[i];
                        createUpgradeEffect(cityX, 750, `+${toStockpile} AMMO (STORED)`, '#ff0');
                    }
                    
                    // Try to dispatch trucks if stockpile has ammo
                    if ((city as any).ammoStockpile > 0) {
                        // Find turrets that need ammo
                        const turretsNeedingAmmo = launchers
                            .map((launcher, index) => ({ launcher, index }))
                            .filter(({launcher}) => launcher.missiles < launcher.maxMissiles)
                            .sort((a, b) => a.launcher.missiles - b.launcher.missiles); // Prioritize emptiest turrets
                        
                        if (turretsNeedingAmmo.length > 0) {
                            // Dispatch truck to neediest turret (up to 2 ammo per truck)
                            const target = turretsNeedingAmmo[0];
                            const ammoNeeded = target.launcher.maxMissiles - target.launcher.missiles;
                            const ammoAvailable = Math.min((city as any).ammoStockpile, 2); // Trucks can carry up to 2 ammo
                            const ammoToSend = Math.min(ammoNeeded, ammoAvailable);
                            
                            if (ammoToSend > 0 && (city as any).ammoStockpile >= ammoToSend) {
                                const truck = createAmmoTruck(i, target.index, ammoToSend);
                                if (truck) {
                                    (city as any).ammoStockpile -= ammoToSend;
                                    
                                    const cityX = cityPositions[i];
                                    createUpgradeEffect(cityX, 720, `🚚 DISPATCHED`, '#ff8');
                                } else {
                                    // No trucks available - ammo stays in stockpile
                                    const cityX = cityPositions[i];
                                    createUpgradeEffect(cityX, 720, `⏳ WAITING FOR TRUCK`, '#f80');
                                }
                            }
                        } else {
                            // All turrets are full - check for ammo recycling upgrade
                            const globalUpgrades = (window as any).globalUpgrades;
                            if (globalUpgrades?.ammoRecycling?.level > 0) {
                                // Convert stockpiled ammo to scrap
                                const scrapFromRecycling = (city as any).ammoStockpile * 2; // 2 scrap per ammo
                                const cityX = cityPositions[i];
                                createUpgradeEffect(cityX, 720, `+${scrapFromRecycling} SCRAP (RECYCLED)`, '#f80');
                                gameState.scrap += scrapFromRecycling;
                                (city as any).ammoStockpile = 0;
                            }
                        }
                    }
                }
                break;
        }
    }
}

// Update city population (gradual growth)
export function updateCityPopulation(deltaTime: number): void {
    const growthRate = 0.1; // Population growth per second
    
    for (let i = 0; i < cityData.length; i++) {
        const city = cityData[i];
        if (city.population < city.maxPopulation) {
            city.population = Math.min(
                city.maxPopulation, 
                city.population + (growthRate * deltaTime / 1000)
            );
        }
    }
}

// Set city production mode
export function setCityProductionMode(cityIndex: number, mode: 'scrap' | 'science' | 'ammo'): boolean {
    if (cityIndex < 0 || cityIndex >= cityData.length) {
        return false;
    }
    
    if (destroyedCities.includes(cityIndex)) {
        return false;
    }
    
    cityData[cityIndex].productionMode = mode;
    console.log(`City ${cityIndex} production mode set to ${mode}`);
    return true;
}

// Upgrade city population capacity
export function upgradeCityPopulation(cityIndex: number): boolean {
    if (cityIndex < 0 || cityIndex >= cityData.length) {
        return false;
    }
    
    const cost = 50 + (cityPopulationUpgrades[cityIndex] * 25);
    
    if (!(window as any).canAfford?.(cost)) {
        return false;
    }
    
    if (!(window as any).spendCurrency?.(cost)) {
        return false;
    }
    
    cityPopulationUpgrades[cityIndex]++;
    cityData[cityIndex].maxPopulation += 50; // Increase max population
    
    console.log(`Upgraded city ${cityIndex} population capacity (level ${cityPopulationUpgrades[cityIndex]})`);
    return true;
}

// Upgrade city productivity for specific production type
export function upgradeCityProductivity(cityIndex: number, productionType: 'scrap' | 'science' | 'ammo'): boolean {
    if (cityIndex < 0 || cityIndex >= cityData.length) {
        return false;
    }
    
    const currentLevel = cityProductivityUpgrades[productionType][cityIndex];
    const cost = 30 + (currentLevel * 20);
    
    if (!(window as any).canAfford?.(cost)) {
        return false;
    }
    
    if (!(window as any).spendCurrency?.(cost)) {
        return false;
    }
    
    cityProductivityUpgrades[productionType][cityIndex]++;
    
    console.log(`Upgraded city ${cityIndex} ${productionType} productivity (level ${cityProductivityUpgrades[productionType][cityIndex]})`);
    return true;
}

// Repair a destroyed city
export function repairCity(cityIndex: number): boolean {
    if (!destroyedCities.includes(cityIndex)) {
        return false;
    }
    
    const cost = 50;
    
    if (!(window as any).canAfford?.(cost)) {
        return false;
    }
    
    if (!(window as any).spendCurrency?.(cost)) {
        return false;
    }
    
    // Remove from destroyed cities
    const cityIdx = destroyedCities.indexOf(cityIndex);
    if (cityIdx > -1) {
        destroyedCities.splice(cityIdx, 1);
    }
    
    // Restore population to 50%
    cityData[cityIndex].population = cityData[cityIndex].maxPopulation * 0.5;
    
    // Increase city count
    gameState.cities++;
    
    console.log(`Repaired city ${cityIndex}`);
    return true;
}

// Reset all city data
export function resetCityData(): void {
    cityData = [
        { population: 100, maxPopulation: 100, productionMode: 'scrap', baseProduction: 1.5 } as any,
        { population: 100, maxPopulation: 100, productionMode: 'science', baseProduction: 1.5 } as any,
        { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.5 } as any,
        { population: 100, maxPopulation: 100, productionMode: 'scrap', baseProduction: 1.5 } as any,
        { population: 100, maxPopulation: 100, productionMode: 'science', baseProduction: 1.5 } as any,
        { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.5 } as any
    ];
    
    cityUpgrades = [0, 0, 0, 0, 0, 0];
    cityPopulationUpgrades = [0, 0, 0, 0, 0, 0];
    cityProductivityUpgrades = {
        scrap: [0, 0, 0, 0, 0, 0],
        science: [0, 0, 0, 0, 0, 0],
        ammo: [0, 0, 0, 0, 0, 0]
    };
    ammoAccumulator = 0;
}

// Make globally available for legacy compatibility
(window as any).cityData = cityData;
(window as any).cityUpgrades = cityUpgrades;
(window as any).cityPopulationUpgrades = cityPopulationUpgrades;
(window as any).cityProductivityUpgrades = cityProductivityUpgrades;
(window as any).ammoAccumulator = ammoAccumulator;
(window as any).calculateCityProductionRate = calculateCityProductionRate;
(window as any).generateCityResources = generateCityResources;
(window as any).updateCityPopulation = updateCityPopulation;
(window as any).setCityProductionMode = setCityProductionMode;
(window as any).upgradeCityPopulation = upgradeCityPopulation;
(window as any).upgradeCityProductivity = upgradeCityProductivity;
(window as any).repairCity = repairCity;
(window as any).resetCityData = resetCityData;
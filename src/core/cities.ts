// Command Mode City Management System
import type { CityData, CityProductivityUpgrades } from '@/types/gameTypes';

// Command Mode city system
export let cityData: CityData[] = [
    // Each city has: population, maxPopulation, productionMode ('scrap', 'science', or 'ammo'), baseProduction
    { population: 100, maxPopulation: 100, productionMode: 'scrap', baseProduction: 1 },
    { population: 100, maxPopulation: 100, productionMode: 'science', baseProduction: 1 },
    { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1 },
    { population: 100, maxPopulation: 100, productionMode: 'scrap', baseProduction: 1 },
    { population: 100, maxPopulation: 100, productionMode: 'science', baseProduction: 1 },
    { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1 }
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

// Ammo accumulator for precise fractional ammo production
export let ammoAccumulator = 0;

// Calculate production rate per second for a specific city
export function calculateCityProductionRate(cityIndex: number): string {
    if (cityIndex < 0 || cityIndex >= cityData.length) return '0.0';
    
    const destroyedCities = (window as any).destroyedCities || [];
    if (destroyedCities.includes(cityIndex)) return '0.0';
    
    const city = cityData[cityIndex];
    if (city.population <= 0) return '0.0';
    
    // Use floating-point calculation for better precision
    const populationMultiplier = city.population / city.maxPopulation;
    const baseProduction = city.baseProduction * populationMultiplier;
    
    const productivityLevel = cityProductivityUpgrades[city.productionMode][cityIndex];
    const productivityMultiplier = 1 + (productivityLevel * 0.25);
    const finalProduction = baseProduction * productivityMultiplier;
    
    // Convert from per-3-seconds to per-second
    return (finalProduction / 3).toFixed(1);
}

// Generate resources from cities based on population and production mode
export function generateCityResources(): void {
    const gameState = (window as any).gameState;
    const launchers = (window as any).launchers;
    const destroyedCities = (window as any).destroyedCities || [];
    
    if (!gameState || !launchers) return;
    
    for (let i = 0; i < cityData.length; i++) {
        if (destroyedCities.includes(i)) continue;
        
        const city = cityData[i];
        if (city.population <= 0) continue;
        
        const populationMultiplier = city.population / city.maxPopulation;
        const baseProduction = city.baseProduction * populationMultiplier;
        
        const productivityLevel = cityProductivityUpgrades[city.productionMode][i];
        const productivityMultiplier = 1 + (productivityLevel * 0.25);
        const finalProduction = baseProduction * productivityMultiplier;
        
        switch (city.productionMode) {
            case 'scrap':
                const scrapProduced = Math.floor(finalProduction);
                if (scrapProduced > 0) {
                    if ((window as any).awardScrap) {
                        (window as any).awardScrap(scrapProduced, `city ${i}`);
                    } else {
                        gameState.scrap += scrapProduced;
                    }
                }
                break;
                
            case 'science':
                const scienceProduced = Math.floor(finalProduction);
                if (scienceProduced > 0) {
                    if ((window as any).awardScience) {
                        (window as any).awardScience(scienceProduced);
                    } else {
                        gameState.science += scienceProduced;
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
                    
                    // Distribute ammo to turrets that need it
                    let remainingAmmo = ammoToDistribute;
                    for (let j = 0; j < launchers.length && remainingAmmo > 0; j++) {
                        if (launchers[j].missiles < launchers[j].maxMissiles) {
                            const ammoNeeded = launchers[j].maxMissiles - launchers[j].missiles;
                            const ammoToGive = Math.min(remainingAmmo, ammoNeeded);
                            launchers[j].missiles += ammoToGive;
                            remainingAmmo -= ammoToGive;
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
    
    const destroyedCities = (window as any).destroyedCities || [];
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
    const destroyedCities = (window as any).destroyedCities || [];
    const gameState = (window as any).gameState;
    
    if (!destroyedCities.includes(cityIndex) || !gameState) {
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
        { population: 100, maxPopulation: 100, productionMode: 'scrap', baseProduction: 1 },
        { population: 100, maxPopulation: 100, productionMode: 'science', baseProduction: 1 },
        { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1 },
        { population: 100, maxPopulation: 100, productionMode: 'scrap', baseProduction: 1 },
        { population: 100, maxPopulation: 100, productionMode: 'science', baseProduction: 1 },
        { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1 }
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
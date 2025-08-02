// Command Mode City Management System
import type { CityData, CityProductivityUpgrades } from '@/types/gameTypes';
import { gameState } from '@/systems/observableState';
import { launchers } from '@/entities/launchers';
import { destroyedCities, cityPositions } from '@/entities/cities';
import { createUpgradeEffect } from '@/entities/particles';
import { createAmmoTruck } from '@/entities/trucks';

// Command Mode city system - default 6-city setup (gets resized by mode manager)
export let cityData: CityData[] = [
    // Each city has: population, maxPopulation, productionMode, baseProduction
    // All cities start with ammo production to match game design
    { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.0 } as any,
    { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.0 } as any,
    { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.0 } as any,
    { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.0 } as any,
    { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.0 } as any,
    { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.0 } as any
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

// Calculate city productivity upgrade cost
export function getCityProductivityUpgradeCost(cityIndex: number, productionType: 'scrap' | 'science' | 'ammo'): number {
    const currentLevel = cityProductivityUpgrades[productionType][cityIndex];
    const baseCost = 25;
    return baseCost + (currentLevel * 20);
}

// Resource accumulators for precise fractional production (per-city)
export let ammoAccumulators: number[] = [0, 0, 0, 0, 0, 0];
export let scrapAccumulators: number[] = [0, 0, 0, 0, 0, 0];
export let scienceAccumulators: number[] = [0, 0, 0, 0, 0, 0];

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
    const productivityMultiplier = 1 + (productivityLevel * 0.5); // +50% per level for more substantial impact
    const researchMultiplier = getResearchMultiplier(city.productionMode);
    let finalProduction = baseProduction * productivityMultiplier * researchMultiplier;
    
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

// Get research branch multiplier for production
function getResearchMultiplier(productionMode: 'scrap' | 'science' | 'ammo'): number {
    const globalUpgrades = (window as any).globalUpgrades;
    if (!globalUpgrades) return 1.0;
    
    switch (productionMode) {
        case 'ammo':
            // Ammo Research Level 1+ gives +50% per level
            return 1 + ((globalUpgrades.ammoResearch?.level || 0) * 0.5);
        case 'scrap':
            // Scrap Research Level 1+ gives +50% per level  
            return 1 + ((globalUpgrades.scrapResearch?.level || 0) * 0.5);
        case 'science':
            // Science Research Level 1+ gives +50% per level
            return 1 + ((globalUpgrades.scienceResearch?.level || 0) * 0.5);
        default:
            return 1.0;
    }
}

// Get maximum population based on research upgrades
function getMaxPopulationForCity(): number {
    const globalUpgrades = (window as any).globalUpgrades;
    if (!globalUpgrades) return 100;
    
    // Base population: 100
    let maxPop = 100;
    
    // Population Research Level 1: +25 (single unlock)
    if (globalUpgrades.populationResearch?.level > 0) {
        maxPop += 25; // Now 125
    }
    
    // Residential Efficiency can add more population bonus per level
    const residentialLevel = globalUpgrades.residentialEfficiency?.level || 0;
    maxPop += residentialLevel * 5; // +5 per residential efficiency level
    
    return maxPop;
}

// Apply research upgrades to all existing cities (called when research is purchased)
export function applyResearchUpgradesToCities(): void {
    const newMaxPopulation = getMaxPopulationForCity();
    
    for (let i = 0; i < cityData.length; i++) {
        const city = cityData[i];
        // Update max population if it's higher than current
        if (newMaxPopulation > city.maxPopulation) {
            city.maxPopulation = newMaxPopulation;
        }
    }
    
    console.log(`Applied research upgrades: max population updated to ${newMaxPopulation}`);
}

// Generate resources from cities based on population and production mode
export function generateCityResources(): void {
    if (!gameState || !launchers || launchers.length === 0) {
        return;
    }
    
    // Console logging for production tracking
    const productionLog: string[] = [];
    
    for (let i = 0; i < cityData.length; i++) {
        if (destroyedCities.includes(i)) {
            productionLog.push(`City ${i + 1}: DESTROYED`);
            continue;
        }
        
        const city = cityData[i];
        if (city.population <= 0) {
            productionLog.push(`City ${i + 1}: NO POPULATION`);
            continue;
        }
        
        // Only ensure ammo stockpile for ammo-producing cities
        if (city.productionMode === 'ammo') {
            ensureAmmoStockpile(city);
        }
        
        const populationMultiplier = city.population / city.maxPopulation;
        const baseProduction = city.baseProduction * populationMultiplier;
        
        const productivityLevel = cityProductivityUpgrades[city.productionMode][i];
        const productivityMultiplier = 1 + (productivityLevel * 0.5); // +50% per level for more substantial impact
        const researchMultiplier = getResearchMultiplier(city.productionMode);
        const finalProduction = baseProduction * productivityMultiplier * researchMultiplier;
        
        // Log production calculation for this city
        const accumulator = city.productionMode === 'ammo' ? ammoAccumulators[i] : 
                           city.productionMode === 'scrap' ? scrapAccumulators[i] : 
                           scienceAccumulators[i];
        productionLog.push(`City ${i + 1}: ${finalProduction.toFixed(2)} ${city.productionMode.toUpperCase()} (pop: ${city.population.toFixed(0)}/${city.maxPopulation}, mult: ${productivityMultiplier.toFixed(2)}, research: ${researchMultiplier.toFixed(2)}, acc: ${accumulator.toFixed(2)})`);
        
        switch (city.productionMode) {
            case 'scrap':
                // Accumulate fractional scrap production
                scrapAccumulators[i] += finalProduction;
                
                // Convert to integer scrap when we have enough
                const scrapToAward = Math.floor(scrapAccumulators[i]);
                if (scrapToAward > 0) {
                    scrapAccumulators[i] -= scrapToAward;
                    
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
                scienceAccumulators[i] += finalProduction * 2;
                
                // Convert to integer science when we have enough
                const scienceToAward = Math.floor(scienceAccumulators[i]);
                if (scienceToAward > 0) {
                    scienceAccumulators[i] -= scienceToAward;
                    
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
                ammoAccumulators[i] += finalProduction;
                
                // Convert to integer ammo when we have enough
                const ammoToDistribute = Math.floor(ammoAccumulators[i]);
                if (ammoToDistribute > 0) {
                    ammoAccumulators[i] -= ammoToDistribute;
                    
                    // Add to city ammo stockpile
                    const stockpileSpace = (city as any).maxAmmoStockpile - (city as any).ammoStockpile;
                    const toStockpile = Math.min(ammoToDistribute, stockpileSpace);
                    
                    console.log(`City ${i + 1}: Generated ${ammoToDistribute} ammo, stockpile space: ${stockpileSpace}, storing: ${toStockpile}, current stockpile: ${(city as any).ammoStockpile}`);
                    
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
                            // Dispatch truck to neediest turret (starts at 1 ammo per truck)
                            const target = turretsNeedingAmmo[0];
                            const ammoNeeded = target.launcher.maxMissiles - target.launcher.missiles;
                            const ammoAvailable = Math.min((city as any).ammoStockpile, 1); // Trucks start carrying 1 ammo
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
    
    // Output production log if any cities are producing
    if (productionLog.length > 0) {
        console.log(`PRODUCTION: ${productionLog.join(' \\ ')}`);
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
    
    const cost = getCityProductivityUpgradeCost(cityIndex, productionType);
    
    if (!(window as any).canAfford?.(cost)) {
        return false;
    }
    
    if (!(window as any).spendCurrency?.(cost)) {
        return false;
    }
    
    cityProductivityUpgrades[productionType][cityIndex]++;
    
    // Visual feedback
    const modeColors = { scrap: '#0f0', science: '#00f', ammo: '#ff0' };
    const modeIcons = { scrap: '💰', science: '🔬', ammo: '📦' };
    if ((window as any).createUpgradeEffect) {
        (window as any).createUpgradeEffect(cityPositions[cityIndex], 750, `${modeIcons[productionType]} +50% EFFICIENCY!`, modeColors[productionType]);
    }
    
    // Update UI
    if ((window as any).updateUI) {
        (window as any).updateUI();
    }
    if (gameState.currentMode === 'command' && (window as any).updateCommandPanel) {
        (window as any).updateCommandPanel();
    }
    
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
        { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.0 } as any,
        { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.0 } as any,
        { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.0 } as any,
        { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.0 } as any,
        { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.0 } as any,
        { population: 100, maxPopulation: 100, productionMode: 'ammo', baseProduction: 1.0 } as any
    ];
    
    cityUpgrades = [0, 0, 0, 0, 0, 0];
    cityPopulationUpgrades = [0, 0, 0, 0, 0, 0];
    cityProductivityUpgrades = {
        scrap: [0, 0, 0, 0, 0, 0],
        science: [0, 0, 0, 0, 0, 0],
        ammo: [0, 0, 0, 0, 0, 0]
    };
    ammoAccumulators = [0, 0, 0, 0, 0, 0];
    scrapAccumulators = [0, 0, 0, 0, 0, 0];
    scienceAccumulators = [0, 0, 0, 0, 0, 0];
}

// Make globally available for legacy compatibility
(window as any).cityData = cityData;
(window as any).cityUpgrades = cityUpgrades;
(window as any).cityPopulationUpgrades = cityPopulationUpgrades;
(window as any).cityProductivityUpgrades = cityProductivityUpgrades;
(window as any).ammoAccumulators = ammoAccumulators;
(window as any).scrapAccumulators = scrapAccumulators;
(window as any).scienceAccumulators = scienceAccumulators;
(window as any).calculateCityProductionRate = calculateCityProductionRate;
(window as any).generateCityResources = generateCityResources;
(window as any).updateCityPopulation = updateCityPopulation;
(window as any).setCityProductionMode = setCityProductionMode;
(window as any).upgradeCityPopulation = upgradeCityPopulation;
(window as any).upgradeCityProductivity = upgradeCityProductivity;
(window as any).getCityProductivityUpgradeCost = getCityProductivityUpgradeCost;
(window as any).repairCity = repairCity;
(window as any).resetCityData = resetCityData;
(window as any).applyResearchUpgradesToCities = applyResearchUpgradesToCities;
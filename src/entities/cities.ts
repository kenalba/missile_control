// City management system

export const cityPositions: number[] = [270, 390, 510, 690, 810, 930];
export let destroyedCities: number[] = [];

// Legacy compatibility for old city upgrade arrays
export let cityUpgrades: number[] = [0, 0, 0, 0, 0, 0]; // Legacy: kept for compatibility
export let cityPopulationUpgrades: number[] = [0, 0, 0, 0, 0, 0]; // Population capacity upgrades (increases max population)
export let cityBunkerUpgrades: number[] = [0, 0, 0, 0, 0, 0]; // Bunker upgrades (reduces damage from missile hits)
export let cityProductivityUpgrades = {
    scrap: [0, 0, 0, 0, 0, 0],    // Scrap production efficiency
    science: [0, 0, 0, 0, 0, 0],  // Science production efficiency  
    ammo: [0, 0, 0, 0, 0, 0]      // Ammo production efficiency
};

export function resetCities(): void {
    destroyedCities = [];
    cityUpgrades = [0, 0, 0, 0, 0, 0];
    cityPopulationUpgrades = [0, 0, 0, 0, 0, 0];
    cityBunkerUpgrades = [0, 0, 0, 0, 0, 0];
    cityProductivityUpgrades = {
        scrap: [0, 0, 0, 0, 0, 0],
        science: [0, 0, 0, 0, 0, 0],
        ammo: [0, 0, 0, 0, 0, 0]
    };
}

export function destroyCity(cityIndex: number): void {
    if (!destroyedCities.includes(cityIndex)) {
        destroyedCities.push(cityIndex);
    }
}

// repairCity moved to core/cities.ts for complete implementation with cost handling

export function isCityDestroyed(cityIndex: number): boolean {
    return destroyedCities.includes(cityIndex);
}

export function getAliveCityCount(): number {
    return cityPositions.length - destroyedCities.length;
}

export function getAlliveCities(): number[] {
    return cityPositions.map((_, index) => index).filter(index => !destroyedCities.includes(index));
}


// Arrays are already exported above
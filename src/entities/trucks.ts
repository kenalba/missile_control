// Ammo truck system for city-to-turret logistics
import type { AmmoTruck } from '@/types/gameTypes';
import { launchers } from '@/entities/launchers';
import { cityPositions } from '@/entities/cities';
import { gameState } from '@/systems/observableState';

// Active trucks delivering ammo
export let ammoTrucks: AmmoTruck[] = [];

// Get available truck count for a city
export function getAvailableTruckCount(cityIndex: number): number {
  const cityData = (window as any).cityData;
  if (!cityData || !cityData[cityIndex]) return 0;
  
  const city = cityData[cityIndex] as any;
  const globalUpgrades = (window as any).globalUpgrades;
  const baseTrucks = city.maxTrucks || 1; // Default to 1 truck per city
  const fleetUpgrade = globalUpgrades?.truckFleet?.level || 0;
  const maxTrucks = baseTrucks + fleetUpgrade; // Global upgrade adds trucks
  
  const busyTrucks = ammoTrucks.filter(truck => 
    truck.cityIndex === cityIndex && truck.status !== 'idle'
  ).length;
  
  return Math.max(0, maxTrucks - busyTrucks);
}

// Create a new ammo truck
export function createAmmoTruck(
  cityIndex: number,
  turretIndex: number,
  ammoAmount: number
): AmmoTruck | null {
  // Check if city has available trucks
  if (getAvailableTruckCount(cityIndex) <= 0) {
    console.log(`🚚 No available trucks in city ${cityIndex}`);
    return null;
  }
  
  const cityX = cityPositions[cityIndex];
  const cityY = 800; // Ground level
  const turretX = launchers[turretIndex].x;
  const turretY = 800; // Ground level (trucks travel on ground)
  
  // Calculate delivery time based on horizontal distance only (ground travel)
  const distance = Math.abs(turretX - cityX);
  const deliveryTime = distance * 3 + 1000; // Faster consistent speed: 3ms per pixel + 1 second base time
  
  const truck: AmmoTruck = {
    id: `truck-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    cityIndex,
    startX: cityX,
    startY: cityY,
    targetX: turretX,
    targetY: turretY,
    currentX: cityX,
    currentY: cityY,
    ammoAmount,
    targetTurretIndex: turretIndex,
    progress: 0,
    deliveryTime,
    startTime: Date.now(),
    status: 'delivering'
  };
  
  ammoTrucks.push(truck);
  console.log(`🚚 Truck dispatched: ${ammoAmount} ammo from city ${cityIndex} to turret ${turretIndex} (${deliveryTime}ms)`);
  return truck;
}

// Try to redispatch a truck that just returned to a city
function tryRedispatchTruck(cityIndex: number, returningTruck: AmmoTruck): boolean {
  const cityData = (window as any).cityData;
  if (!cityData || !cityData[cityIndex]) return false;
  
  const city = cityData[cityIndex] as any;
  
  // Check if city has ammo in stockpile
  if (!city.ammoStockpile || city.ammoStockpile <= 0) return false;
  
  // Find turrets that need ammo
  const turretsNeedingAmmo = launchers
    .map((launcher, index) => ({ launcher, index }))
    .filter(({launcher}) => launcher.missiles < launcher.maxMissiles)
    .sort((a, b) => a.launcher.missiles - b.launcher.missiles); // Prioritize emptiest turrets
  
  if (turretsNeedingAmmo.length === 0) return false;
  
  // Reuse the returning truck for immediate dispatch
  const target = turretsNeedingAmmo[0];
  const ammoNeeded = target.launcher.maxMissiles - target.launcher.missiles;
  const ammoAvailable = Math.min(city.ammoStockpile, 1); // Trucks start carrying 1 ammo
  const ammoToSend = Math.min(ammoNeeded, ammoAvailable);
  
  // Calculate delivery parameters
  const cityX = cityPositions[cityIndex];
  const turretX = launchers[target.index].x;
  const distance = Math.abs(turretX - cityX);
  const deliveryTime = distance * 3 + 1000; // Faster consistent speed: 3ms per pixel + 1 second base time
  
  // Reconfigure truck for new delivery
  returningTruck.startX = cityX;
  returningTruck.startY = 800;
  returningTruck.targetX = turretX;
  returningTruck.targetY = 800;
  returningTruck.currentX = cityX;
  returningTruck.currentY = 800;
  returningTruck.ammoAmount = ammoToSend;
  returningTruck.targetTurretIndex = target.index;
  returningTruck.progress = 0;
  returningTruck.deliveryTime = deliveryTime;
  returningTruck.startTime = Date.now();
  returningTruck.status = 'delivering';
  returningTruck.returnStartTime = undefined;
  returningTruck.returnTime = undefined;
  
  // Deduct ammo from stockpile
  city.ammoStockpile -= ammoToSend;
  console.log(`🔄 Auto-redispatch: ${ammoToSend} ammo from city ${cityIndex} to turret ${target.index}`);
  return true;
}

// Update all trucks
export function updateTrucks(): void {
  if (gameState.paused) return;
  
  const currentTime = Date.now();
  
  // First pass: identify trucks completing delivery this frame
  const completingDeliveries: number[] = [];
  ammoTrucks.forEach((truck, index) => {
    if (truck.status === 'delivering') {
      const elapsed = currentTime - truck.startTime;
      const progress = Math.min(1, elapsed / truck.deliveryTime);
      if (progress >= 1) {
        completingDeliveries.push(index);
      }
    }
  });
  
  // Process deliveries in order to avoid race conditions
  completingDeliveries.forEach(index => {
    const truck = ammoTrucks[index];
    if (truck && truck.status === 'delivering') {
      // Deliver ammo to turret (this updates the turret state immediately)
      const turret = launchers[truck.targetTurretIndex];
      let undeliveredAmmo = 0;
      
      if (turret) {
        const actualDelivery = Math.min(truck.ammoAmount, turret.maxMissiles - turret.missiles);
        turret.missiles += actualDelivery;
        undeliveredAmmo = truck.ammoAmount - actualDelivery;
        
        if (actualDelivery > 0) {
          console.log(`📦 Ammo delivered: ${actualDelivery} to turret ${truck.targetTurretIndex} (${turret.missiles}/${turret.maxMissiles})`);
        }
        if (undeliveredAmmo > 0) {
          console.log(`🔄 Returning ${undeliveredAmmo} undelivered ammo to city ${truck.cityIndex} (turret was full)`);
        }
      } else {
        // Turret doesn't exist - return all ammo
        undeliveredAmmo = truck.ammoAmount;
        console.log(`❌ Turret ${truck.targetTurretIndex} not found - returning ${undeliveredAmmo} ammo to city ${truck.cityIndex}`);
      }
      
      // Store undelivered ammo for return to city
      if (undeliveredAmmo > 0) {
        truck.returnAmmo = undeliveredAmmo;
      }
      
      // Start return journey
      truck.status = 'returning';
      truck.returnStartTime = currentTime;
      truck.returnTime = truck.deliveryTime; // Same time to return
      truck.progress = 0;
      
      // Swap start and target for return trip
      const tempX = truck.startX;
      truck.startX = truck.targetX;
      truck.targetX = tempX;
      truck.currentX = truck.startX;
    }
  });
  
  // Second pass: update all truck positions and handle other logic
  ammoTrucks.forEach((truck, index) => {
    if (truck.status === 'delivering') {
      // Calculate delivery progress
      const elapsed = currentTime - truck.startTime;
      truck.progress = Math.min(1, elapsed / truck.deliveryTime);
      
      // Interpolate position (ground travel only)
      truck.currentX = truck.startX + (truck.targetX - truck.startX) * truck.progress;
      truck.currentY = 800; // Always stay on ground
      
      // Delivery completion is handled in first pass to avoid race conditions
    } else if (truck.status === 'returning') {
      // Calculate return progress
      const elapsed = currentTime - (truck.returnStartTime || currentTime);
      truck.progress = Math.min(1, elapsed / (truck.returnTime || truck.deliveryTime));
      
      // Interpolate position back to city
      truck.currentX = truck.startX + (truck.targetX - truck.startX) * truck.progress;
      truck.currentY = 800; // Always stay on ground
      
      // Check if return is complete
      if (truck.progress >= 1) {
        // Truck is back at city
        const cityIndex = truck.cityIndex;
        const cityData = (window as any).cityData;
        
        // Return any undelivered ammo to city stockpile
        if (truck.returnAmmo && truck.returnAmmo > 0 && cityData && cityData[cityIndex]) {
          const city = cityData[cityIndex] as any;
          if (city.ammoStockpile !== undefined) {
            const stockpileSpace = city.maxAmmoStockpile - city.ammoStockpile;
            const ammoToReturn = Math.min(truck.returnAmmo, stockpileSpace);
            
            if (ammoToReturn > 0) {
              city.ammoStockpile += ammoToReturn;
              console.log(`🏠 Returned ${ammoToReturn} ammo to city ${cityIndex} stockpile`);
              
              // If we couldn't return all ammo due to stockpile limits, log it
              if (ammoToReturn < truck.returnAmmo) {
                console.log(`⚠️  City ${cityIndex} stockpile full - lost ${truck.returnAmmo - ammoToReturn} ammo`);
              }
            } else {
              console.log(`⚠️  City ${cityIndex} stockpile full - lost ${truck.returnAmmo} ammo`);
            }
          }
          truck.returnAmmo = 0; // Clear the return ammo
        }
        
        // Check for immediate redispatch
        const shouldRedispatch = tryRedispatchTruck(cityIndex, truck);
        
        if (shouldRedispatch) {
          // Truck gets immediately redispatched - don't remove it
          console.log(`🔄 Truck ${truck.id} immediately redispatched from city ${cityIndex}`);
        } else {
          // No immediate work - remove truck (it becomes available again)
          truck.status = 'idle';
          truck.currentX = truck.targetX; // Back at city
          truck.ammoAmount = 0; // Empty truck
          ammoTrucks.splice(index, 1);
          console.log(`🏠 Truck returned to city ${cityIndex} - no immediate work`);
        }
      }
    }
  });
}

// Get truck count for a specific turret (for UI display)
export function getTruckCountForTurret(turretIndex: number): number {
  return ammoTrucks.filter(truck => truck.targetTurretIndex === turretIndex).length;
}

// Get total ammo in transit for a specific turret
export function getAmmoInTransitForTurret(turretIndex: number): number {
  return ammoTrucks
    .filter(truck => truck.targetTurretIndex === turretIndex)
    .reduce((total, truck) => total + truck.ammoAmount, 0);
}

// Clear all trucks (for game reset)
export function clearAllTrucks(): void {
  ammoTrucks.length = 0;
}

// Make globally available for legacy compatibility
(window as any).ammoTrucks = ammoTrucks;
(window as any).createAmmoTruck = createAmmoTruck;
(window as any).updateTrucks = updateTrucks;
(window as any).getTruckCountForTurret = getTruckCountForTurret;
(window as any).getAmmoInTransitForTurret = getAmmoInTransitForTurret;
(window as any).clearAllTrucks = clearAllTrucks;
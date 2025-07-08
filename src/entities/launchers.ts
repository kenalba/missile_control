import type { Launcher } from '@/types/gameTypes';
import { audioSystem } from '@/systems/audio';

export let launchers: Launcher[] = [
    { x: 150, y: 770, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 },
    { x: 600, y: 770, missiles: 12, maxMissiles: 12, lastFire: 0, fireRate: 667 }, // Middle turret starts upgraded
    { x: 1050, y: 770, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 }
];

export let destroyedLaunchers: number[] = [];

export function resetLaunchers(): void {
    launchers = [
        { x: 150, y: 770, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 },
        { x: 600, y: 770, missiles: 12, maxMissiles: 12, lastFire: 0, fireRate: 667 },
        { x: 1050, y: 770, missiles: 10, maxMissiles: 10, lastFire: 0, fireRate: 1000 }
    ];
}

export function getLauncher(index: number): Launcher | undefined {
    return launchers[index];
}

export function updateLauncherMissiles(index: number, missiles: number): void {
    if (launchers[index]) {
        launchers[index].missiles = missiles;
    }
}

export function updateLauncherFireRate(index: number, fireRate: number): void {
    if (launchers[index]) {
        launchers[index].fireRate = fireRate;
    }
}

export function destroyLauncher(launcherIndex: number): void {
    if (!destroyedLaunchers.includes(launcherIndex)) {
        destroyedLaunchers.push(launcherIndex);
    }
}

export function isLauncherDestroyed(launcherIndex: number): boolean {
    return destroyedLaunchers.includes(launcherIndex);
}

export function canLauncherFire(launcher: Launcher): boolean {
    const now = Date.now();
    return launcher.missiles > 0 && (now - launcher.lastFire) >= launcher.fireRate;
}

export function fireLauncher(launcher: Launcher): void {
    if (launcher.missiles > 0) {
        launcher.missiles--;
        launcher.lastFire = Date.now();
        audioSystem.playMissileLaunch();
    }
}

// launchers array is already exported above
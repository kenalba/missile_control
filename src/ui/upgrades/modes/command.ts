// Command Mode Upgrade System - Entry Point for Floating Panel Content
import { getGlobalUpgradesHTML } from '../global';
import { getTurretsUpgradesHTML } from '../turrets';
import { getCitiesUpgradesHTML } from '../cities';
import { getScienceUpgradesHTML } from '../science';

// Main entry point for Command Mode upgrade content generation
export function getCommandUpgradeContent(tabType: string): string {
  switch (tabType) {
    case 'global':
      return getGlobalUpgradesHTML();
    case 'turrets':
      return getTurretsUpgradesHTML();
    case 'cities':
      return getCitiesUpgradesHTML();
    case 'science':
      return getScienceUpgradesHTML();
    default:
      return '<div>Unknown tab type</div>';
  }
}

// Make globally available for compatibility
(window as any).getCommandUpgradeContent = getCommandUpgradeContent;
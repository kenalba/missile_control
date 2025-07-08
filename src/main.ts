// Main TypeScript entry point for Missile Control

// Import styles first for Vite development server
import '../styles.css';

// Import TypeScript modules and type definitions
import './legacy';
import '@/core'; // Load all core game systems
import '@/entities'; // Load all entity systems
import { initializeInput } from '@/systems/input';
import { initGame, startGame } from '@/systems/gameLoop';
import { audioSystem } from '@/systems/audio';
import { saveSystem } from '@/systems/saveSystem';
import { modeManager } from '@/systems/modeManager';
import { initializeRenderer } from '@/systems/rendering';
import '@/systems/stubs'; // Temporary stub functions
import '@/systems/upgrades'; // Upgrade system
import '@/systems/upgradeLogic'; // Legacy upgrade support
import '@/ui/uiUtils'; // UI utilities
import '@/ui/panelManager'; // Panel management
import '@/ui/upgradeContent'; // Upgrade content generation
import { observableGameState, uiUpdateSystem } from '@/systems/observableState'; // Observable state system

// Initialize TypeScript systems
console.log('🚀 Initializing Missile Control TypeScript systems...');
console.log('🔊 Audio system state:', audioSystem.getState());
console.log('💾 Save system loaded:', saveSystem.hasHighScores() ? 'with existing data' : 'fresh start');

// Initialize input system
initializeInput();

// Initialize observable state system
uiUpdateSystem.initialize();

// Make our TypeScript systems globally available for any remaining legacy code
(window as any).audioSystem = audioSystem;
(window as any).saveSystem = saveSystem;
(window as any).modeManager = modeManager;
(window as any).initializeRenderer = initializeRenderer;
(window as any).startGame = startGame;
(window as any).observableGameState = observableGameState;
(window as any).gameState = observableGameState; // Make observable state the global gameState

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 DOM ready, initializing game...');
  initGame();
});

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

export { audioSystem, saveSystem };
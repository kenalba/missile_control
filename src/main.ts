// Main TypeScript entry point for Missile Control

// Import styles first for Vite development server
import '../styles.css';
import 'tippy.js/dist/tippy.css'; // Import Tippy.js CSS

// Import TypeScript modules and type definitions
import './legacy';
import '@/core'; // Load all core game systems
import '@/entities'; // Load all entity systems
import { initializeInput, selectEntity } from '@/systems/input';
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
import '@/ui/tooltipManager'; // Tippy.js tooltip system
import '@/ui/upgrades/modes/command'; // Command mode upgrade content
import '@/ui/upgrades/modes/arcade'; // Arcade mode upgrade content
import '@/ui/sidebarManager'; // Sidebar state management
import '@/ui/compactInfo'; // Compact information display system
import { observableGameState, uiUpdateSystem } from '@/systems/observableState'; // Observable state system
import { timeManager } from '@/systems/timeManager'; // Time management system

// Initialize TypeScript systems
console.log('🚀 Initializing Missile Control TypeScript systems...');
console.log('🔊 Audio system state:', audioSystem.getState());
console.log('💾 Save system loaded:', saveSystem.hasHighScores() ? 'with existing data' : 'fresh start');

// Initialize input system
initializeInput();

// Initialize observable state system
uiUpdateSystem.initialize();

// Make our TypeScript systems globally available immediately
(window as any).audioSystem = audioSystem;
(window as any).saveSystem = saveSystem;
(window as any).modeManager = modeManager;
(window as any).initializeRenderer = initializeRenderer;
(window as any).startGame = startGame;
(window as any).selectEntity = selectEntity;
(window as any).observableGameState = observableGameState;
(window as any).gameState = observableGameState; // Make observable state the global gameState
(window as any).timeManager = timeManager;

// Also export startGame directly for HTML onclick handlers
(window as any).startGame = startGame;

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 DOM ready, initializing game...');
  
  // Initialize sidebar manager after DOM is ready
  (window as any).initializeSidebar();
  
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
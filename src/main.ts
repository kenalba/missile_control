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

// Initialize TypeScript systems
console.log('🚀 Initializing Missile Control TypeScript systems...');
console.log('🔊 Audio system state:', audioSystem.getState());
console.log('💾 Save system loaded:', saveSystem.hasHighScores() ? 'with existing data' : 'fresh start');

// Initialize input system
initializeInput();

// Make our TypeScript systems globally available for any remaining legacy code
(window as any).audioSystem = audioSystem;
(window as any).saveSystem = saveSystem;
(window as any).modeManager = modeManager;
(window as any).initializeRenderer = initializeRenderer;
(window as any).startGame = startGame;

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
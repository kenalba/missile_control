// Main TypeScript entry point for Missile Control

// Import styles first for Vite development server
import '../styles.css';

// Import TypeScript modules and type definitions
import './legacy';
import { audioSystem } from '@/systems/audio';
import { saveSystem } from '@/systems/saveSystem';
// Import only what we use to avoid unused import warnings
// import { GAME_CONFIG } from '@/config/constants';

// Initialize TypeScript systems first
console.log('🚀 Initializing Missile Control TypeScript systems...');
console.log('🔊 Audio system state:', audioSystem.getState());
console.log('💾 Save system loaded:', saveSystem.hasHighScores() ? 'with existing data' : 'fresh start');

// Make our TypeScript systems globally available for legacy compatibility
(window as any).audioSystem = audioSystem;
(window as any).saveSystem = saveSystem;

// Load legacy JavaScript modules dynamically
// This ensures they load after our TypeScript systems are initialized
async function loadLegacyModules() {
  const legacyModules = [
    '/js/gameState.js',
    '/js/modeManager.js', 
    '/js/entities.js',
    '/js/input.js',
    '/js/rendering.js',
    '/js/upgradeLogic.js',
    '/js/upgrades.js',
    '/js/ui/uiUtils.js',
    '/js/ui/panelManager.js',
    '/js/ui/upgradeContent.js',
    '/js/utils.js',
    '/js/main.js'
  ];

  for (const module of legacyModules) {
    const script = document.createElement('script');
    script.src = module;
    script.type = 'text/javascript';
    
    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${module}`));
      document.head.appendChild(script);
    });
    
    console.log(`✅ Loaded legacy module: ${module}`);
  }
  
  console.log('🎮 All legacy modules loaded, game ready!');
}

// Load legacy modules and initialize game
loadLegacyModules().catch(error => {
  console.error('❌ Failed to load legacy modules:', error);
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
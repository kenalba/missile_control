# Missile Command - Upgrade Edition

A web-based Missile Command clone with an upgrade system where destroyed missiles earn scrap that can be spent on improvements.

## Game Overview

Defend your cities from incoming missiles using three missile launchers. Each destroyed enemy missile awards points and scrap. Use scrap to upgrade your defenses and survive increasingly difficult waves.

## Controls

- **Mouse**: Click to target and fire missiles (auto-selects closest available launcher)
- **Keyboard**: Q/W/E keys to fire from specific launchers (left/center/right)
- **Mouse tracking**: Crosshair follows mouse for targeting

## Game Mechanics

### Core Systems
- **3 Cities**: Game ends when all cities are destroyed
- **3 Missile Launchers**: Each starts with 10 missiles, positioned at 200px, 600px, and 1000px
- **Wave System**: Waves get progressively harder with more frequent enemy missiles
- **Scrap Economy**: Destroyed missiles give 2 scrap + 10 points each

### Upgrade System
- **Missile Speed** (10 scrap, 1.3x multiplier): Faster player missiles
- **Explosion Size** (15 scrap, 1.4x multiplier): Larger blast radius
- **Fire Rate** (20 scrap, 1.5x multiplier): Faster reload times
- **Missile Capacity** (25 scrap, 1.2x multiplier): More missiles per launcher
- **City Repair** (50 scrap): Restore one destroyed city

## Technical Details

### File Structure
- `index.html` - Main HTML structure and game layout
- `styles.css` - All CSS styling and visual design
- `game.js` - Core game logic and JavaScript functionality
- Canvas-based rendering (1200x800)
- Retro terminal aesthetic (green on black)

### Key Functions
- `fireMissile(launcher, targetX, targetY)`: Launches player missile
- `spawnEnemyMissile()`: Creates enemy missiles from random positions
- `createExplosion(x, y, isPlayer)`: Handles explosion effects and collision detection
- `checkCollisions()`: Manages all collision detection between missiles and explosions
- `upgrade(type)`: Handles upgrade purchases and applies effects

### Game State
- Score, scrap, wave, cities tracked in `gameState` object
- Upgrade levels and costs in `upgrades` object
- All game entities stored in arrays: `playerMissiles`, `enemyMissiles`, `explosions`, `particles`

## Current Issues & Improvements Needed

1. **Performance**: Stars redraw randomly each frame instead of being static
2. **Game Balance**: Upgrade costs may need tuning
3. **Visual Effects**: Could use more particle effects and animations
4. **Audio**: No sound effects or music
5. **Responsive Design**: Fixed canvas size may not work well on all screens
6. **Save System**: No persistence of upgrades between sessions
7. **Additional Features**: Could add more upgrade types, different enemy types, boss fights

## Browser Compatibility
- Requires modern browser with HTML5 Canvas support
- Uses ES6 features (arrow functions, const/let)
- No external dependencies
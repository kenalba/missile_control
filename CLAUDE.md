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
- `js/main.js` - Core game loop and initialization
- `js/gameState.js` - Game state management and UI updates
- `js/entities.js` - Game entities (missiles, launchers, planes)
- `js/input.js` - Input handling and canvas click detection
- `js/rendering.js` - Canvas rendering system
- `js/upgrades.js` - Upgrade system and effects
- `js/utils.js` - Utility functions and collision detection
- `js/audio.js` - Audio system (placeholder)
- Canvas-based rendering (1200x900)
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

## Recent Improvements (Latest Session)

### Visual Overhaul
- **Ground Redesign**: Moved ground higher to eliminate empty space, replaced boring gray with textured brown design
- **City Upgrade UI**: Moved upgrade buttons from HTML panel directly to canvas below cities for better UX
- **Canvas Click Detection**: Implemented sophisticated click detection for city upgrades and repairs
- **Turret Visualizations**: Created detailed visual representations for upgrades:
  - Speed: Exhaust flames behind turret
  - Explosion: Wider barrel with reinforcement rings
  - Fire Rate: Cooling vents on sides
  - Capacity: Ammo drums with belt connections
  - Autopilot: Radar dish with animated scanning beam
- **Button Polish**: Pixel-perfect positioning with 3D effects and proper contrast

### Gameplay Improvements
- **Wave Break Control**: Disabled missile launching between rounds for smoother gameplay
- **Modal Centering**: Wave break modal now centers on game canvas instead of full viewport
- **Middle Turret Balance**: Starts with level 2 in all stats except autopilot (matches original Missile Command)
- **Economic System**: Added scrap multiplier, salvage bonus, and efficiency discount upgrades
- **Targeted Repairs**: City repair buttons now repair the specific clicked city

### Technical Enhancements
- **Canvas-based UI**: City upgrades now rendered directly on canvas for consistent visuals
- **Coordinate Mapping**: Proper click detection accounting for canvas scaling
- **Scrap Bonus System**: Economic upgrades properly applied throughout reward calculations

## Priority Todo List

### High Priority
1. **Pause Functionality**: Spacebar to pause/unpause game
2. **Save System**: Persist upgrades and high scores between sessions  
3. **Achievement System**: Milestones like "reach wave 10", "destroy 500 missiles"
4. **High Score Tracking**: Local leaderboard with top 5 scores

### Medium Priority
5. **Screenshake Effects**: Subtle screen shake for explosions and impacts
6. **Visual Polish**: Better explosion variety, missile trail improvements, impact flashes
7. **Seekers**: Enemy missiles that actively track and follow player missiles
8. **Smart Bomb Improvements**: Make them evade nearby explosions, require direct hits

### Low Priority
9. **Celebration Effects**: Visual rewards for wave milestones and achievements
10. **Mobile Haptics**: Haptic feedback on explosions and firing

## Completed Issues
- ✅ **Audio**: Sound effects implemented and working well
- ✅ **Visual Layout**: Ground redesign and UI improvements completed
- ✅ **Game Balance**: Difficulty curve and upgrade progression refined

## Browser Compatibility
- Requires modern browser with HTML5 Canvas support
- Uses ES6 features (arrow functions, const/let)
- No external dependencies
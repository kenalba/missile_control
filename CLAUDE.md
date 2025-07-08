# Missile Command - Upgrade Edition

A modern web-based Missile Command clone with dual game modes, comprehensive upgrade systems, and space-efficient UI design.

## Game Overview

Defend your cities from incoming missiles using strategic turret placements and upgrades. Choose between Arcade Mode (classic 6 cities, 3 turrets) or Command Mode (strategic base building starting with 1 turret, 2 cities). Each destroyed enemy missile awards points and scrap for purchasing improvements.

## Game Modes

### Arcade Mode
- **Classic Experience**: 6 cities, 3 turrets, traditional upgrade table
- **Fast-Paced Action**: All turrets available from start, familiar Missile Command gameplay
- **Global Upgrades**: Economic and tactical bonuses displayed in sidebar sections

### Command Mode  
- **Strategic Building**: Start with 1 turret, 2 cities - expand your base over time
- **Floating Command Center**: Draggable upgrade panel with tabbed interface
- **Entity Selection**: Click turrets/cities in-game or use selection buttons
- **Space-Efficient UI**: Compact tooltip-based interface for maximum information density

## Controls

- **Mouse**: Click to target and fire missiles (auto-selects closest available launcher)
- **Keyboard**: Q/W/E keys to fire from specific launchers (left/center/right)
- **Mouse tracking**: Crosshair follows mouse for targeting
- **Command Mode**: Click entities to select, Escape to close panels

## Game Mechanics

### Core Systems
- **Cities**: Varies by mode (6 in Arcade, 2-6 in Command). Game ends when all destroyed
- **Turrets**: 3 in Arcade, 1-3 in Command. Each starts with 10 missiles at 200px, 600px, 1000px
- **Wave System**: Progressive difficulty with smart bombs (wave 3+), planes (wave 5+)
- **Scrap Economy**: 2 base scrap + 10 points per destroyed missile, enhanced by upgrades

### Upgrade System

#### Turret Upgrades (Per-Turret)
- **Missile Speed** (10 scrap, 1.3x multiplier): Faster projectile velocity
- **Explosion Size** (15 scrap, 1.4x multiplier): Larger blast radius  
- **Fire Rate** (20 scrap, 1.5x multiplier): Faster reload times
- **Missile Capacity** (25 scrap, 1.2x multiplier): More missiles per reload
- **Autopilot** (40 scrap): Smart targeting system for automatic interception

#### Economic Upgrades (Global)
- **Scrap Multiplier** (80 scrap): +25% scrap from all sources
- **Salvage Operations** (60 scrap): +3 bonus scrap from planes/bombers
- **Efficiency** (90 scrap): -15% discount on all turret upgrade costs

#### Tactical Upgrades
- **Threat Detection** (75 scrap): Highlight dangerous missiles with red glow
- **Emergency Ammo** (3 scrap): Purchase single ammo for first available turret
- **Science Unlock** (varies): Enable science production in cities (Command Mode)

#### City Management (Command Mode)
- **Production Modes**: Scrap, Ammo, Science (requires unlock)
- **City Efficiency Upgrades**: Increase resource production output
- **City Repair** (50 scrap): Restore destroyed cities

## Technical Details

### Architecture
- **Modular Design**: Separated UI, logic, and content generation into focused modules
- **Canvas Rendering**: 1200x900 internal resolution with responsive scaling
- **Mode System**: Dynamic game mode switching with different UI layouts
- **Save System**: Comprehensive localStorage persistence for progress and preferences
- **Mobile Optimization**: Landscape-forced layout with touch-friendly controls

### Architecture Overview

**Modern TypeScript + Vite Build System** with incremental migration from legacy JavaScript.

#### TypeScript Modules (Phase 1 ✅)
- `src/main.ts` - TypeScript entry point and system initialization
- `src/types/gameTypes.ts` - Comprehensive type definitions for all game entities
- `src/config/constants.ts` - Game constants and configuration with type safety
- `src/systems/audio.ts` - Type-safe Web Audio API sound generation
- `src/systems/saveSystem.ts` - Type-safe localStorage persistence system
- `src/utils/math.ts` - Mathematical utility functions with proper typing
- `src/utils/collision.ts` - Collision detection utilities with type safety
- `src/utils/index.ts` - Clean utility exports and convenience functions

#### Legacy JavaScript Modules (Phase 2 - Pending Migration)
- `js/main.js` - Core game loop and initialization
- `js/modeManager.js` - Game mode switching and configuration
- `js/gameState.js` - Game state management and UI updates
- `js/entities.js` - Game entities (missiles, launchers, planes)
- `js/input.js` - Input handling with entity selection support
- `js/rendering.js` - Canvas rendering system with visual effects
- `js/upgrades.js` - Main upgrade system controller
- `js/upgradeLogic.js` - Core upgrade mechanics and calculations
- `js/ui/uiUtils.js` - UI component utilities and styling constants
- `js/ui/panelManager.js` - Floating panel management with drag functionality
- `js/ui/upgradeContent.js` - HTML generation for upgrade interfaces
- `js/utils.js` - Legacy utility functions (being replaced by TypeScript versions)

#### Build & Deployment
- `vite.config.ts` - Modern build configuration with TypeScript support
- `tsconfig.json` - TypeScript compiler configuration with strict settings
- `.github/workflows/deploy.yml` - Automated CI/CD pipeline for GitHub Pages
- `package.json` - Node.js dependencies and build scripts

### Key Functions
- `fireMissile(launcher, targetX, targetY)`: Launches player missile
- `spawnEnemyMissile()`: Creates enemy missiles from random positions
- `createExplosion(x, y, isPlayer)`: Handles explosion effects and collision detection
- `checkCollisions()`: Manages all collision detection between missiles and explosions
- `upgrade(type, launcherIndex)`: Handles upgrade purchases and applies effects
- `selectEntity(type, index)`: Command Mode entity selection system
- `openCommandPanel()`: Shows floating upgrade panel with tabbed interface
- `createCompactUpgradeButton(config)`: Generates tooltip-enabled upgrade buttons

### Game State
- Score, scrap, science, wave, cities tracked in `gameState` object
- Mode-specific data in `gameState.currentMode` and `gameState.commandMode`
- Upgrade levels stored in `launcherUpgrades`, `globalUpgrades`, `cityUpgrades`
- All game entities in arrays: `playerMissiles`, `enemyMissiles`, `explosions`, `particles`

## Recent Improvements (Latest Session)

### UI Architecture Overhaul (Current)
- **Modular UI System**: Extracted upgrade generation into focused modules (`uiUtils.js`, `panelManager.js`, `upgradeContent.js`)
- **Space-Efficient Design**: Redesigned Command Center with compact grids (2-col, 3-col, 4-col layouts)
- **Comprehensive Tooltip System**: Hover-based descriptions replace verbose inline text
- **Floating Command Panel**: Draggable upgrade interface with tabbed organization (Global, Turrets, Cities)
- **Smart Positioning**: Tooltips automatically adjust position to prevent edge clipping
- **Streamlined Core**: Reduced main `upgrades.js` from 1000+ lines to focused controller

### Command Mode Implementation
- **Dual Game Modes**: Mode selection screen with Arcade (classic) and Command (strategic) options
- **Entity Selection**: Click turrets/cities in-game or use selection buttons in panel
- **Mode-Specific UI**: Different interfaces optimized for each gameplay style
- **Floating Panel Controls**: Minimize, close, and drag functionality for Command Center
- **Entity-Specific Tabs**: Dynamic content based on selected turret or city

### Visual & UX Polish
- **Ground Redesign**: Moved ground higher with textured brown design replacing gray
- **City Upgrade UI**: Canvas-rendered upgrade buttons with sophisticated click detection
- **Turret Visualizations**: Detailed upgrade representations (exhaust, vents, ammo drums, radar)
- **High Score Display**: Top 5 scores with dates on game over screen
- **Screenshake Effects**: Subtle feedback for explosions and impacts
- **Status Section Redesign**: Improved readability with organized stat displays

### Gameplay Balance
- **Wave Break Control**: Disabled missile launching between rounds for smoother transitions
- **Middle Turret Enhancement**: Starts at level 2 (matches original Missile Command balance)
- **Economic System**: Comprehensive scrap multipliers, salvage bonuses, efficiency discounts
- **Targeted City Repairs**: Click specific cities to repair them individually
- **Authentic Difficulty Curve**: Enemy missile speed follows original progression
- **Guaranteed Plane Spawning**: Fixed intervals (25%, 50%, 75% through wave)

## Priority Todo List

### Current Known Issues
1. **BUG: Tooltip Opacity Inheritance**: Tooltips on disabled buttons inherit 50% opacity making text hard to read

### Medium Priority
2. **Visual Polish**: Better explosion variety, missile trail improvements, impact flashes
3. **Seekers**: Enemy missiles that actively track and follow player missiles
4. **Smart Bomb AI**: Implement true smart bombs (seekers) that track player missiles and evade explosions
5. **Command Mode Expansion**: Add turret/city construction functionality

### Low Priority
6. **Celebration Effects**: Visual rewards for wave milestones and achievements
7. **Mobile Haptics**: Haptic feedback on explosions and firing
8. **Code Cleanup**: Remove old modal code and legacy upgrade system remnants

## Completed Issues
- ✅ **Modular UI Architecture**: Separated upgrade system into focused modules
- ✅ **Tooltip System**: Comprehensive hover-based descriptions with smart positioning
- ✅ **Command Mode**: Floating panel with tabbed interface and entity selection
- ✅ **Space-Efficient Design**: Compact grids and tooltip-based interface
- ✅ **Dual Game Modes**: Arcade and Command mode selection with different UI layouts
- ✅ **Audio**: Sound effects implemented and working well
- ✅ **Visual Layout**: Ground redesign and UI improvements completed
- ✅ **Game Balance**: Difficulty curve and upgrade progression refined
- ✅ **Pause Functionality**: Spacebar to pause/unpause game
- ✅ **Save System**: Persist upgrades and high scores between sessions
- ✅ **Achievement System**: Milestones like "reach wave 10", "destroy 500 missiles"
- ✅ **High Score Tracking**: Local leaderboard with top 5 scores
- ✅ **Screenshake Effects**: Subtle screen shake for explosions and impacts
- ✅ **Difficulty Curve**: Authentic Missile Command speed progression
- ✅ **Plane Spawning**: Guaranteed consistent plane timing per wave

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Modern browser with HTML5 Canvas support
- Git for version control

### Getting Started
```bash
# Clone the repository
git clone https://github.com/kenalba/missile_control.git
cd missile_control

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Type check without building
npm run type-check

# Preview production build
npm run preview
```

### Development Commands
- `npm run dev` - Start Vite development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run type-check` - Run TypeScript type checking
- `npm run preview` - Preview production build locally

### TypeScript Migration Status
- ✅ **Phase 1 Complete**: Build system, types, audio, save system, utilities
- 🚧 **Phase 2 Next**: Game state, entities, input system with event bus
- 📋 **Phase 3 Planned**: UI components, rendering system, main game loop

## Browser Compatibility
- Requires modern browser with HTML5 Canvas support
- Uses ES2020 features with TypeScript compilation
- Progressive Web App (PWA) with offline support
- Mobile-optimized with touch controls
# Missile Command - Upgrade Edition

A modern strategic defense game inspired by Missile Command, featuring comprehensive upgrade systems, resource management, and base building mechanics.

⚡ **[Play the Game](https://kenalba.github.io/missile_control)** | 📋 **[Development Status](CLAUDE.md)**

## Game Overview

**Command Mode** is the primary game experience - start with 1 turret and 2 cities, then expand your defensive network through research and strategic upgrades. Manage resources (scrap, science), unlock technology trees, and build the ultimate missile defense system.

*Arcade Mode (classic 6 cities, 3 turrets) is temporarily hidden while Command Mode is being refined as the core experience.*

![Missile Command Screenshot](https://via.placeholder.com/600x400/001122/00ff00?text=Missile+Command)

## Key Features

### Dual Game Modes
- **Arcade Mode**: Classic 6 cities, 3 turrets, traditional upgrade table - pure action
- **Command Mode**: Strategic gameplay with 1-3 turrets, 2-6 cities, floating Command Center

### Space-Efficient UI System
- **Modular Architecture**: Separated UI components into focused modules for maintainability
- **Tooltip-Based Interface**: Hover descriptions replace verbose inline text for maximum space efficiency
- **Floating Command Center**: Draggable upgrade panel with tabbed organization (Global, Turrets, Cities)
- **Smart Positioning**: Tooltips automatically adjust to prevent edge clipping
- **Compact Grids**: 2-column, 3-column, and 4-column layouts for optimal information density

### Advanced Upgrade System
- **Per-Turret Upgrades**: Speed, explosion size, fire rate, capacity, and autopilot for each turret
- **Economic Meta-Progression**: Scrap multipliers, salvage bonuses, and efficiency discounts
- **City Management**: Production modes (Scrap, Ammo, Science) with efficiency upgrades
- **Visual Upgrade Indicators**: Turret visualizations showing exhaust flames, cooling vents, ammo drums, and radar

### Enhanced Gameplay
- **Progressive Difficulty**: Smart bombs (wave 3+), planes (wave 5+), balanced enemy scaling
- **Entity Selection**: Click turrets/cities in-game for targeted upgrades and management
- **Mobile Optimized**: Landscape-forced layout with touch controls and slide-up panels
- **Visual Polish**: Textured ground, particle effects, screenshake, and upgrade animations

## Controls

### Desktop
- **Mouse Movement**: Crosshair follows mouse for targeting
- **Q/W/E Keys**: Fire missiles from left/center/right launchers
- **Mouse Click**: Fire from selected launcher at cursor position
- **Command Mode**: Click entities to select, Escape to close panels

### Mobile
- **Touch**: Tap to fire from selected launcher at touch position
- **Launcher Selection**: T1/T2/T3 buttons to select active launcher
- **Upgrade Panel**: Slide-up panel during wave breaks (tap gear icon)
- **Fullscreen**: Toggle fullscreen mode for better experience

## Game Mechanics

### Core Systems
- **Cities**: Varies by mode (6 in Arcade, 2-6 in Command). Game ends when all are destroyed
- **Turrets**: 3 in Arcade, 1-3 in Command. Each starts with 10 missiles
- **Wave Progression**: Planes join at wave 5, smart bombs at wave 3, balanced difficulty scaling
- **Scrap Economy**: 2 scrap + 10 points per destroyed enemy missile, bonuses from economic upgrades

### Upgrade Types

#### Turret Upgrades (Per-Turret)
- **Speed** (10 scrap): 1.3x missile velocity multiplier
- **Explosion** (15 scrap): 1.4x blast radius multiplier  
- **Fire Rate** (20 scrap): 1.5x faster reload times
- **Capacity** (25 scrap): 1.2x more missiles per launcher
- **Autopilot** (40 scrap): Smart targeting system for automatic interception

#### City Upgrades (Individual)
- **Level 1-3** (20/35/50 scrap): +50% scrap bonus per level
- Visual progression from basic buildings to glowing skyscrapers

#### Economic Upgrades (One-Time Purchases)
- **Scrap Multiplier** (80 scrap): +25% scrap from all sources
- **Salvage** (60 scrap): +3 bonus scrap from destroyed planes
- **Efficiency** (90 scrap): -15% discount on all launcher upgrades

#### Tactical Upgrades
- **Missile Highlight** (75 scrap): Highlights enemy missiles targeting cities/launchers
- **Emergency Ammo** (3 scrap): Purchase single ammo for first available turret
- **City Repair** (50 scrap): Restore destroyed cities (click specific city to repair)

## Technical Details

### Architecture
- **Full TypeScript Implementation**: Complete TypeScript codebase with strict typing and modern ES2020+ features
- **Vite Build System**: Lightning-fast development with hot reload and optimized production builds
- **HTML5 Canvas Rendering**: 1200x900 internal resolution with responsive scaling and visual effects
- **Dual Mode System**: Different UI layouts optimized for Arcade vs Command gameplay
- **Type-Safe Development**: Comprehensive TypeScript interfaces for all game entities and systems
- **Modular Design**: Separated systems into focused modules for maintainability and testing
- **Progressive Web App**: Service worker support with offline capabilities and mobile optimization
- **Responsive CSS**: Mobile-first design with orientation detection and advanced tooltip system
- **Web Audio API**: Type-safe procedural sound generation for missiles, explosions, and feedback

### File Structure
```
missile_control/
   index.html                    # Main game page with mode selection
   styles.css                    # Responsive styling with tooltip system
   
   # TypeScript Implementation (Complete ✅)
   src/
      main.ts                    # Entry point and system initialization
      types/gameTypes.ts         # Comprehensive type definitions
      config/constants.ts        # Game constants with type safety
      
      # Core Game Systems
      core/
         gameState.ts            # Game state management
         upgrades.ts             # Upgrade data and progression
         cities.ts               # City data management
         achievements.ts         # Achievement system
         economy.ts              # Resource management
         
      # Game Entities
      entities/
         launchers.ts            # Turret/launcher systems
         missiles.ts             # Player and enemy missiles
         explosions.ts           # Explosion effects and collision
         planes.ts               # Plane and bomber entities
         particles.ts            # Visual effects and particles
         cities.ts               # City positions and states
         
      # Core Systems
      systems/
         gameLoop.ts             # Main game loop and timing
         rendering.ts            # Canvas rendering and graphics
         input.ts                # Keyboard, mouse, and touch input
         audio.ts                # Web Audio API sound system
         saveSystem.ts           # localStorage persistence
         modeManager.ts          # Game mode switching
         upgrades.ts             # Upgrade purchase and effects
         ui.ts                   # UI state management
         
      # User Interface
      ui/
         uiUtils.ts              # UI component utilities
         panelManager.ts         # Floating panel management
         upgradeContent.ts       # HTML generation for interfaces
         
      # Utilities
      utils/
         math.ts                 # Mathematical utilities
         collision.ts            # Collision detection algorithms
         index.ts                # Clean exports
   
   # Build & Deployment
   vite.config.ts               # Modern build configuration
   tsconfig.json                # TypeScript compiler settings
   package.json                 # Dependencies and scripts
   .github/workflows/deploy.yml # Automated CI/CD pipeline
```

## Development

### Quick Start
```bash
# Clone and install dependencies
git clone https://github.com/kenalba/missile_control.git
cd missile_control
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build
```

### Available Scripts
- `npm run dev` - Start Vite development server with TypeScript compilation and hot reload
- `npm run build` - Build optimized production bundle with TypeScript compilation
- `npm run type-check` - Run TypeScript type checking without building
- `npm run preview` - Preview production build locally

### TypeScript Implementation Status
- ✅ **Complete Migration**: Full TypeScript codebase with comprehensive type safety
- ✅ **Modern Build System**: Vite with hot reload and optimized production builds
- ✅ **Modular Architecture**: Clean separation of concerns across core, entities, systems, and UI
- ✅ **Type-Safe APIs**: All game systems use strict TypeScript interfaces and type checking

### Browser Requirements
- Modern browser with HTML5 Canvas support
- ES2020+ features (compiled by TypeScript/Vite)
- Web Audio API (for sound)
- Touch events support (for mobile)
- Service Worker support (for PWA features)

### Recent Updates
- **Landing Page Redesign**: Command Mode now prominently featured as primary experience
- **Tooltip System**: Comprehensive Tippy.js integration with proper positioning and overflow handling
- **Science Research**: Three research branches (Ammo, Scrap, Science) with tiered upgrades
- **UI Polish**: Modular architecture with space-efficient design and visual improvements
- **Production Systems**: City-based resource generation with productivity upgrades

### Development Status

For current development priorities, active todo list, and technical implementation details, see **[CLAUDE.md](CLAUDE.md)**.

Key priorities:
- 🔴 **High Priority**: Research roadmap display, city production fixes
- 🟡 **Medium Priority**: Tech tree expansion, auto-fire systems, visual improvements  
- 🟢 **Low Priority**: Code organization, advanced features

## Contributing

Feel free to submit issues or pull requests. The codebase uses TypeScript with modern tooling and is well-documented for easy modification. See [CLAUDE.md](CLAUDE.md) for detailed development information.

## License

MIT License - Feel free to use and modify for your own projects.

---

*Missile Command - Upgrade Edition brings strategic depth to the classic arcade formula with meaningful progression systems and modern web technology.*
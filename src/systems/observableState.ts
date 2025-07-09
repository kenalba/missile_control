// Observable State Pattern for automatic UI updates
import type { GameState } from '@/types/gameTypes';
import { gameState as originalGameState } from '@/core/gameState';

// Type for observer callbacks
type StateObserver = (property: keyof GameState, newValue: any, oldValue: any) => void;

// Observable wrapper for game state
class GameStateObserver {
  private observers = new Set<StateObserver>();
  private _state: GameState;

  constructor(initialState: GameState) {
    this._state = { ...initialState };
    
    // Create proxy to intercept property access
    return new Proxy(this, {
      get(target, property: string | symbol) {
        if (typeof property === 'string' && property in target._state) {
          return target._state[property as keyof GameState];
        }
        return target[property as keyof GameStateObserver];
      },
      
      set(target, property: string | symbol, value) {
        if (typeof property === 'string' && property in target._state) {
          const oldValue = target._state[property as keyof GameState];
          if (oldValue !== value) {
            (target._state as any)[property] = value;
            target.notifyObservers(property as keyof GameState, value, oldValue);
          }
          return true;
        }
        (target as any)[property] = value;
        return true;
      }
    });
  }

  // Subscribe to state changes
  subscribe(observer: StateObserver): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  // Subscribe to specific property changes
  subscribeToProperty<K extends keyof GameState>(
    property: K,
    callback: (newValue: GameState[K], oldValue: GameState[K]) => void
  ): () => void {
    const observer: StateObserver = (prop, newValue, oldValue) => {
      if (prop === property) {
        callback(newValue, oldValue);
      }
    };
    return this.subscribe(observer);
  }

  // Batch updates (prevents multiple notifications)
  batch(updateFn: () => void): void {
    const originalNotify = this.notifyObservers;
    const pendingUpdates: Array<[keyof GameState, any, any]> = [];
    
    // Temporarily replace notify to collect updates
    this.notifyObservers = (property, newValue, oldValue) => {
      pendingUpdates.push([property, newValue, oldValue]);
    };
    
    try {
      updateFn();
    } finally {
      // Restore original notify and send all updates
      this.notifyObservers = originalNotify;
      pendingUpdates.forEach(([property, newValue, oldValue]) => {
        this.notifyObservers(property, newValue, oldValue);
      });
    }
  }

  private notifyObservers(property: keyof GameState, newValue: any, oldValue: any): void {
    this.observers.forEach(observer => {
      try {
        observer(property, newValue, oldValue);
      } catch (error) {
        console.error('Error in state observer:', error);
      }
    });
  }

  // Get raw state for serialization
  toJSON(): GameState {
    return { ...this._state };
  }

  // Update multiple properties at once
  update(updates: Partial<GameState>): void {
    this.batch(() => {
      Object.entries(updates).forEach(([key, value]) => {
        (this as any)[key] = value;
      });
    });
  }
}

// Create observable game state
export const observableGameState = new GameStateObserver(originalGameState) as GameStateObserver & GameState;

// Export observableGameState as gameState for compatibility
export const gameState = observableGameState;

// UI update system that responds to state changes
class UIUpdateSystem {
  private unsubscribers: Array<() => void> = [];

  initialize(): void {
    // Subscribe to scrap changes
    this.unsubscribers.push(
      observableGameState.subscribeToProperty('scrap', (newScrap) => {
        this.updateScrapDisplays(newScrap);
      })
    );

    // Subscribe to science changes
    this.unsubscribers.push(
      observableGameState.subscribeToProperty('science', (newScience) => {
        this.updateScienceDisplays(newScience);
      })
    );

    // Subscribe to wave changes
    this.unsubscribers.push(
      observableGameState.subscribeToProperty('wave', (newWave) => {
        this.updateWaveDisplay(newWave);
      })
    );

    // Subscribe to score changes
    this.unsubscribers.push(
      observableGameState.subscribeToProperty('score', (newScore) => {
        this.updateScoreDisplay(newScore);
      })
    );

    // Subscribe to cities count changes
    this.unsubscribers.push(
      observableGameState.subscribeToProperty('cities', (newCities) => {
        this.updateCitiesDisplay(newCities);
      })
    );

    // Subscribe to mode changes
    this.unsubscribers.push(
      observableGameState.subscribeToProperty('currentMode', (newMode) => {
        this.updateModeSpecificUI(newMode);
      })
    );
  }

  private updateScrapDisplays(scrap: number): void {
    // Update main scrap display
    const scrapElement = document.getElementById('scrap');
    if (scrapElement) {
      scrapElement.textContent = scrap.toString();
    }

    // Update mobile scrap display
    const mobileScrap = document.getElementById('mobile-scrap');
    if (mobileScrap) {
      mobileScrap.textContent = scrap.toString();
    }

    // Update command panel scrap display
    const panelScrap = document.getElementById('panel-scrap');
    if (panelScrap) {
      panelScrap.textContent = scrap.toString();
    }

    // Refresh command panel when scrap changes
    this.refreshCommandPanel();
  }

  private updateScienceDisplays(science: number): void {
    // Update main science display
    const scienceElement = document.getElementById('science');
    if (scienceElement) {
      scienceElement.textContent = science.toString();
    }

    // Update command panel science display
    const panelScience = document.getElementById('panel-science');
    if (panelScience) {
      panelScience.textContent = science.toString();
    }

    // Refresh command panel when science changes
    this.refreshCommandPanel();
  }

  private updateWaveDisplay(wave: number): void {
    const waveElement = document.getElementById('wave');
    if (waveElement) {
      waveElement.textContent = wave.toString();
    }
  }

  private updateScoreDisplay(score: number): void {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = score.toString();
    }
  }

  private updateCitiesDisplay(cities: number): void {
    const citiesElement = document.getElementById('cities');
    if (citiesElement) {
      citiesElement.textContent = cities.toString();
    }
  }

  private updateModeSpecificUI(mode: 'arcade' | 'command'): void {
    // Update mode-specific UI elements
    if (mode === 'command') {
      // Show command mode elements
      const commandElements = document.querySelectorAll('.command-mode-only');
      commandElements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
    } else {
      // Hide command mode elements
      const commandElements = document.querySelectorAll('.command-mode-only');
      commandElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    }
  }

  // Removed updateCommandPanelAffordability to prevent infinite loop
  // Panel updates should be called explicitly when needed

  private refreshCommandPanel(): void {
    // Only refresh if we're in command mode and panel is visible
    if (observableGameState.currentMode === 'command') {
      const updateSidebarContent = (window as any).updateSidebarContent;
      if (typeof updateSidebarContent === 'function') {
        updateSidebarContent();
      }
    }
  }

  destroy(): void {
    // Clean up all subscriptions
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers.length = 0;
  }
}

// Create global UI update system
export const uiUpdateSystem = new UIUpdateSystem();

// Make observable state globally available for compatibility
(window as any).observableGameState = observableGameState;
(window as any).uiUpdateSystem = uiUpdateSystem;
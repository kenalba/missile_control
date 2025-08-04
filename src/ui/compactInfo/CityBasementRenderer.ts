// City Basement Renderer - coordinates basement information display
import type { BasementBounds, RenderContext } from './types';
import { ProductionDisplay } from './ProductionDisplay';
import { StockpileDisplay } from './StockpileDisplay';

export class CityBasementRenderer {
  private productionDisplay: ProductionDisplay;
  private stockpileDisplay: StockpileDisplay;

  constructor() {
    this.productionDisplay = new ProductionDisplay();
    this.stockpileDisplay = new StockpileDisplay();
  }

  render(ctx: CanvasRenderingContext2D, cityIndex: number, centerX: number, destroyedCities: number[]): void {
    // Only render basements in Command Mode
    const gameState = (window as any).gameState;
    if (!gameState || gameState.currentMode !== 'command') {
      return;
    }

    // Check if city exists and is not destroyed
    const cityData = (window as any).cityData;
    
    if (!cityData || !cityData[cityIndex] || destroyedCities.includes(cityIndex)) {
      return;
    }

    // Calculate basement bounds
    const bounds = this.calculateBasementBounds(cityIndex, centerX);
    
    // Draw basement structure (keep existing visual style)
    this.drawBasementStructure(ctx, bounds);
    
    // Create render context for components
    const renderCtx: RenderContext = {
      ctx,
      cityIndex,
      centerX,
      bounds
    };
    
    // Render production indicator
    this.productionDisplay.render(renderCtx);
    
    // Render stockpile display
    this.stockpileDisplay.render(renderCtx);
  }

  private calculateBasementBounds(cityIndex: number, centerX: number): BasementBounds {
    // Get city upgrade level for basement width calculation
    const cityUpgrades = (window as any).cityUpgrades || [];
    const upgradeLevel = cityUpgrades[cityIndex] || 0;
    
    // Calculate basement width based on upgrade level (keep existing logic)
    let basementWidth: number;
    if (upgradeLevel === 0) basementWidth = 50; // Basic city
    else if (upgradeLevel === 1) basementWidth = 56; // Level 1
    else if (upgradeLevel === 2) basementWidth = 60; // Level 2
    else basementWidth = 64; // Level 3+
    
    const basementDepth = 30;
    const basementX = centerX - basementWidth / 2;
    const basementY = 800; // Start at ground level
    
    return {
      x: basementX,
      y: basementY,
      width: basementWidth,
      height: basementDepth, // Same as depth for now
      depth: basementDepth
    };
  }

  private drawBasementStructure(ctx: CanvasRenderingContext2D, bounds: BasementBounds): void {
    // Basement structure - keep existing visual style
    ctx.fillStyle = '#222'; // Darker gray basement walls
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.depth);
    
    // Basement walls - use city color for outline (yellow)
    ctx.strokeStyle = '#ff0'; // Yellow city color
    ctx.lineWidth = 1;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.depth);
  }

  // Public method to render all city basements (replaces drawCityBasements)
  renderAllBasements(ctx: CanvasRenderingContext2D, cityPositions: number[], destroyedCities: number[]): void {
    if (!cityPositions) {
      return;
    }
    
    cityPositions.forEach((centerX: number, cityIndex: number) => {
      this.render(ctx, cityIndex, centerX, destroyedCities);
    });
  }

  // Helper method to check if a city should have a basement rendered
  shouldRenderBasement(cityIndex: number): boolean {
    const gameState = (window as any).gameState;
    const cityData = (window as any).cityData;
    const destroyedCities = (window as any).destroyedCities;
    
    return gameState?.currentMode === 'command' &&
           cityData?.[cityIndex] &&
           !destroyedCities?.includes(cityIndex);
  }
}

// Create singleton instance for global use
export const cityBasementRenderer = new CityBasementRenderer();

// Make globally available for legacy compatibility
(window as any).cityBasementRenderer = cityBasementRenderer;
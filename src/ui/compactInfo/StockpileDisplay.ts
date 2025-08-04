// Stockpile Display Component - handles ammo stockpile visualization using unified ammo display
import type { RenderContext } from './types';
import { AmmoDisplay, ammoDisplay, type AmmoDisplayConfig } from './AmmoDisplay';

export class StockpileDisplay {
  render(renderCtx: RenderContext): void {
    const { ctx, cityIndex, bounds } = renderCtx;
    
    // Get city data for stockpile information
    const cityData = (window as any).cityData;
    if (!cityData || !cityData[cityIndex]) return;
    
    const city = cityData[cityIndex];
    const stockpiledAmmo = city.ammoStockpile || 0;
    const maxAmmoStockpile = city.maxAmmoStockpile || 5;
    
    if (stockpiledAmmo > 0 || maxAmmoStockpile > 0) {
      this.renderAmmoStockpile(ctx, stockpiledAmmo, maxAmmoStockpile, bounds);
    }
  }

  private renderAmmoStockpile(ctx: CanvasRenderingContext2D, current: number, max: number, bounds: any): void {
    // Calculate positioning within basement bounds (left side)
    const leftMargin = 6; // Margin from left wall
    const bottomMargin = 6; // Margin from bottom
    const availableWidth = Math.floor(bounds.width * 0.4); // Use 40% of basement width
    const availableHeight = bounds.depth - bottomMargin - 4; // Leave room at top
    
    // Position in left side of basement
    const displayX = bounds.x + leftMargin;
    const displayY = bounds.y + 2; // Small margin from top
    
    // Calculate optimal size for the display
    const { width, height } = AmmoDisplay.calculateOptimalSize(
      max, availableWidth, availableHeight, true // compact mode for cities
    );
    
    // Configure unified ammo display
    const config: AmmoDisplayConfig = {
      current,
      max,
      x: displayX,
      y: displayY,
      width,
      height,
      showNumeric: max > 15, // Show numbers for large stockpiles
      compact: true // Compact mode for basement display
    };
    
    // Render using unified ammo display system
    ammoDisplay.render(ctx, config);
  }

  // Helper method to check if ammo stockpile should be displayed
  shouldDisplay(cityIndex: number): boolean {
    const cityData = (window as any).cityData;
    if (!cityData || !cityData[cityIndex]) return false;
    
    const city = cityData[cityIndex];
    return (city.ammoStockpile || 0) > 0 || (city.maxAmmoStockpile || 0) > 0;
  }
}
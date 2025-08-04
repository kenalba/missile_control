// Production Display Component - handles production mode visualization
import type { RenderContext, ProductionIndicator } from './types';
import { COLORS } from '@/ui/uiUtils';

export class ProductionDisplay {
  private readonly productionConfigs: Record<string, ProductionIndicator> = {
    ammo: {
      character: '^',
      color: `rgb(${COLORS.ammo})`, // Green color for ammo (consistent with fired missiles and stockpiles)
      fontSize: 28,
      position: 'right'
    },
    scrap: {
      character: '$',
      color: `rgb(${COLORS.scrap})`, // Gold color for scrap
      fontSize: 28,
      position: 'right'  
    },
    science: {
      character: '◊',
      color: `rgb(${COLORS.science})`, // Blue color for science
      fontSize: 22, // Smaller size to fit better in basement
      position: 'right'
    }
  };

  render(renderCtx: RenderContext): void {
    const { cityIndex } = renderCtx;
    
    // Get city data and production information
    const cityData = (window as any).cityData;
    if (!cityData || !cityData[cityIndex]) return;
    
    const city = cityData[cityIndex];
    const productionMode = city.productionMode || 'ammo';
    
    // Get production progress for opacity calculation
    const productionProgress = this.getProductionProgress(cityIndex, productionMode);
    
    this.renderProductionIndicator(renderCtx, productionMode, productionProgress);
  }

  private renderProductionIndicator(renderCtx: RenderContext, productionMode: string, progress: number): void {
    const { ctx, bounds } = renderCtx;
    
    const config = this.productionConfigs[productionMode];
    if (!config) return;
    
    // Setup font and styling for production indicator
    ctx.font = `bold ${config.fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic'; // Default baseline
    
    // Calculate opacity based on production progress (0.3 to 1.0 range)
    const opacity = 0.3 + (progress * 0.7);
    ctx.fillStyle = this.addOpacity(config.color, opacity);
    
    // Position indicator safely within basement bounds - keep on right side as requested
    const horizontalMargin = 8; // Safe margin from walls
    
    // Position on right side of basement, with special adjustment for science diamond
    const indicatorX = bounds.x + bounds.width - 12;
    // Science diamond needs extra vertical adjustment due to its shape
    const verticalOffset = productionMode === 'science' ? 8 : 4;
    const indicatorY = bounds.y + bounds.depth - verticalOffset;
    
    // Ensure the indicator stays well within basement bounds
    const minX = bounds.x + horizontalMargin;
    const maxX = bounds.x + bounds.width - horizontalMargin;
    
    if (indicatorX >= minX && indicatorX <= maxX) {
      ctx.fillText(config.character, indicatorX, indicatorY);
    }
  }

  private getProductionProgress(cityIndex: number, productionMode: string): number {
    // Get production accumulators to calculate progress
    const accumulators = this.getAccumulators(productionMode);
    if (!accumulators || !accumulators[cityIndex]) return 0;
    
    // Return fractional part as progress (0-1)
    const accumulator = accumulators[cityIndex];
    return accumulator - Math.floor(accumulator);
  }

  private getAccumulators(productionMode: string): number[] | null {
    switch (productionMode) {
      case 'ammo':
        return (window as any).ammoAccumulators;
      case 'scrap':
        return (window as any).scrapAccumulators;
      case 'science':
        return (window as any).scienceAccumulators;
      default:
        return null;
    }
  }

  private addOpacity(color: string, opacity: number): string {
    // Handle rgb color format and convert to rgba with opacity
    if (color.startsWith('rgb(')) {
      // Extract RGB values from "rgb(r, g, b)" format
      const rgbValues = color.slice(4, -1); // Remove "rgb(" and ")"
      return `rgba(${rgbValues}, ${opacity})`;
    }
    
    // Fallback for hex colors (legacy support)
    if (color === '#0f0') return `rgba(0, 255, 0, ${opacity})`;
    if (color === '#64c8ff') return `rgba(100, 200, 255, ${opacity})`;
    return color; // Fallback to original color
  }

  // Helper method to get current production mode for a city
  getProductionMode(cityIndex: number): string {
    const cityData = (window as any).cityData;
    if (!cityData || !cityData[cityIndex]) return 'ammo';
    
    return cityData[cityIndex].productionMode || 'ammo';
  }
}
// Unified Ammunition Display Component - consistent visual language for turrets and cities

export interface AmmoDisplayConfig {
  current: number;
  max: number;
  x: number;
  y: number;
  width: number;
  height: number;
  showNumeric?: boolean;
  compact?: boolean; // For city stockpiles (more compact than turret displays)
}

export class AmmoDisplay {
  private readonly FILLED_COLOR = '#0f0'; // Green for available ammo
  private readonly EMPTY_COLOR = '#333';  // Dark gray for empty slots
  private readonly BORDER_COLOR = '#666'; // Border color for segments
  
  // Thresholds for different display modes
  private readonly INDIVIDUAL_THRESHOLD = 15; // ≤15 missiles: individual rectangles
  private readonly TURRET_INDIVIDUAL_THRESHOLD = 50; // Turrets can show more individual missiles

  render(ctx: CanvasRenderingContext2D, config: AmmoDisplayConfig): void {
    const threshold = config.compact ? this.INDIVIDUAL_THRESHOLD : this.TURRET_INDIVIDUAL_THRESHOLD;
    
    if (config.max <= threshold) {
      this.renderIndividualMissiles(ctx, config);
    } else {
      this.renderSegmentedBar(ctx, config);
    }
    
    // Always show numeric display for segmented bars or when requested
    if (config.max > threshold || config.showNumeric) {
      this.renderNumericDisplay(ctx, config);
    }
  }

  private renderIndividualMissiles(ctx: CanvasRenderingContext2D, config: AmmoDisplayConfig): void {
    const { current, max, x, y, width, height, compact } = config;
    
    // Calculate grid layout
    const maxIconsPerRow = compact ? Math.min(8, max) : Math.min(15, max);
    const totalRows = Math.ceil(max / maxIconsPerRow);
    
    const iconWidth = Math.max(2, Math.min(compact ? 3 : 4, width / maxIconsPerRow - 1));
    const iconHeight = Math.max(2, Math.min(compact ? 2 : 3, height / totalRows - 1));
    const iconSpacingX = width / maxIconsPerRow;
    const iconSpacingY = Math.max(3, height / totalRows);
    
    // Draw filled missiles (available ammo)
    ctx.fillStyle = this.FILLED_COLOR;
    for (let i = 0; i < current; i++) {
      const row = Math.floor(i / maxIconsPerRow);
      const col = i % maxIconsPerRow;
      const iconX = x + (col * iconSpacingX);
      const iconY = y + (row * iconSpacingY);
      ctx.fillRect(iconX, iconY, iconWidth, iconHeight);
    }
    
    // Draw empty slots
    ctx.fillStyle = this.EMPTY_COLOR;
    for (let i = current; i < max; i++) {
      const row = Math.floor(i / maxIconsPerRow);
      const col = i % maxIconsPerRow;
      const iconX = x + (col * iconSpacingX);
      const iconY = y + (row * iconSpacingY);
      ctx.fillRect(iconX, iconY, iconWidth, iconHeight);
    }
  }

  private renderSegmentedBar(ctx: CanvasRenderingContext2D, config: AmmoDisplayConfig): void {
    const { current, max, x, y, width, height } = config;
    
    const segments = Math.min(20, max);
    const segmentWidth = (width - segments + 1) / segments;
    const missilesPerSegment = max / segments;
    
    for (let i = 0; i < segments; i++) {
      const segmentX = x + (i * (segmentWidth + 1));
      const segmentY = y;
      
      const segmentStartMissile = i * missilesPerSegment;
      const segmentFillRatio = Math.max(0, Math.min(1, 
        (current - segmentStartMissile) / missilesPerSegment));
      
      // Background
      ctx.fillStyle = this.EMPTY_COLOR;
      ctx.fillRect(segmentX, segmentY, segmentWidth, height);
      
      // Fill
      if (segmentFillRatio > 0) {
        ctx.fillStyle = this.FILLED_COLOR;
        ctx.fillRect(segmentX, segmentY + (height * (1 - segmentFillRatio)), 
                   segmentWidth, height * segmentFillRatio);
      }
      
      // Border
      ctx.strokeStyle = this.BORDER_COLOR;
      ctx.lineWidth = 1;
      ctx.strokeRect(segmentX, segmentY, segmentWidth, height);
    }
  }

  private renderNumericDisplay(ctx: CanvasRenderingContext2D, config: AmmoDisplayConfig): void {
    const { current, max, x, y, width, compact } = config;
    
    // Position numeric display
    const fontSize = compact ? 10 : 12;
    const textY = compact ? y - 2 : y + 16; // Above the bar for compact, below for turrets
    
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = current > 0 ? this.FILLED_COLOR : '#f00'; // Red if empty
    
    const text = `${current}/${max}`;
    const textX = x + width / 2;
    
    ctx.fillText(text, textX, textY);
  }

  // Helper method to calculate optimal dimensions for a given space
  static calculateOptimalSize(maxMissiles: number, availableWidth: number, availableHeight: number, compact: boolean = false): { width: number; height: number } {
    const threshold = compact ? 15 : 50;
    
    if (maxMissiles <= threshold) {
      // Individual missiles - calculate based on grid
      const maxIconsPerRow = compact ? Math.min(8, maxMissiles) : Math.min(15, maxMissiles);
      const totalRows = Math.ceil(maxMissiles / maxIconsPerRow);
      
      return {
        width: Math.min(availableWidth, maxIconsPerRow * 4),
        height: Math.min(availableHeight, totalRows * 4)
      };
    } else {
      // Segmented bar - use available space
      return {
        width: availableWidth,
        height: compact ? 6 : 10
      };
    }
  }
}

// Export singleton instance
export const ammoDisplay = new AmmoDisplay();
// Types for compact city information display system

export interface BasementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

export interface ProductionIndicator {
  character: string;
  color: string;
  fontSize: number;
  position: 'left' | 'right' | 'center';
}

export interface StockpileItem {
  character: string;
  color: string;
  count: number;
  maxVisible: number;
}

export interface CityBasementInfo {
  cityIndex: number;
  bounds: BasementBounds;
  productionMode: 'ammo' | 'scrap' | 'science';
  productionProgress: number; // 0-1
  stockpile: {
    ammo: number;
  };
  isDestroyed: boolean;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  cityIndex: number;
  centerX: number;
  bounds: BasementBounds;
}
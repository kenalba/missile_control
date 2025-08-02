// Upgrade UI Types and Interfaces

export interface UpgradeButtonConfig {
  name: string;
  description: string;
  cost: number;
  canAfford: boolean;
  color: string;
  action: string;
  actionData?: string;
  currencyIcon?: string;
  isOwned?: boolean;
  additionalInfo?: string;
  onClick?: string;
}

export interface ResearchUpgradeConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costMultiplier?: number;
  color: string;
}

export interface ResearchBranch {
  id: string;
  name: string;
  icon: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  color: string;
}

export interface BranchUpgrade {
  id: string;
  name: string;
  description: string;
  isMultiLevel: boolean;
  maxLevel?: number;
  prerequisite?: string;
  prerequisiteLevel?: number;
}

export interface ProductionMode {
  id: 'scrap' | 'science' | 'ammo';
  name: string;
  icon: string;
  description: string;
}
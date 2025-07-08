// UI Utilities for consistent styling and component generation
import { gameState } from '@/core/gameState';

// Standardized button styles for consistency across all tabs
export const BUTTON_STYLES = {
  base: 'padding: 10px; border-radius: 3px; font-weight: bold; font-size: 14px; cursor: pointer; transition: all 0.2s ease;',
  available: (color: string) => `background: rgba(${color}, 0.2); color: ${color}; border: 1px solid ${color};`,
  disabled: 'background: rgba(128, 128, 128, 0.2); color: #888; border: 1px solid #888; cursor: not-allowed;',
  owned: (color: string) => `background: rgba(${color}, 0.1); color: ${color}; border: 1px solid ${color};`
};

export const COLORS = {
  green: '0, 255, 0',
  blue: '100, 200, 255', // Lighter blue for better readability
  yellow: '255, 255, 0',
  cyan: '0, 255, 255',
  orange: '255, 128, 0',
  red: '255, 0, 0'
};

// Configuration interface for upgrade buttons
interface UpgradeButtonConfig {
  id?: string;
  name: string;
  description: string;
  cost: number;
  isOwned?: boolean;
  canAfford?: boolean;
  color?: string;
  onClick?: string;
  action?: string;
  actionData?: string;
  additionalInfo?: string;
  compact?: boolean;
}

// Create a consistent upgrade button
export function createUpgradeButton(config: UpgradeButtonConfig): string {
  const {
    name,
    description,
    cost,
    isOwned = false,
    canAfford = true,
    color = COLORS.green,
    onClick,
    action,
    actionData,
    additionalInfo = null,
    compact = false
  } = config;

  if (isOwned) {
    const tooltip = compact ? `data-tooltip="${description}"` : '';
    return `
      <div class="${compact ? 'upgrade-btn-compact tooltip' : ''}" 
           style="${compact ? '' : BUTTON_STYLES.base + ' ' + BUTTON_STYLES.owned(color)} 
                  ${compact ? 'color: rgb(' + color + '); border-color: rgb(' + color + '); background: rgba(' + color + ', 0.1);' : 'text-align: center;'}"
           ${tooltip}>
          <strong style="color: rgb(${color});">${name}</strong>
          ${compact ? '' : '<br><small>Owned</small>'}
      </div>
    `;
  }

  const buttonStyle = canAfford ? BUTTON_STYLES.available(color) : BUTTON_STYLES.disabled;
  const disabled = canAfford ? '' : 'disabled';
  
  // Use new action system if provided, otherwise fall back to onClick
  const actionAttrs = action ? `data-action="${action}" data-action-data="${actionData || ''}"` : (onClick ? `onclick="${onClick}"` : '');
  
  let tooltipText = description;
  if (additionalInfo) tooltipText += '. ' + additionalInfo;
  const tooltip = compact ? `data-tooltip="${tooltipText}"` : '';

  if (compact) {
    return `
      <button ${actionAttrs} 
              class="upgrade-btn-compact tooltip"
              style="color: rgb(${color}); border-color: rgb(${color}); background: rgba(${color}, 0.2);"
              ${disabled}
              ${tooltip}>
          <strong>${name}</strong><br>
          <small>${cost}💰</small>
      </button>
    `;
  }

  return `
    <button ${actionAttrs} 
            style="${BUTTON_STYLES.base} ${buttonStyle}"
            ${disabled}>
        <strong>${name}</strong><br>
        <small>${description}</small><br>
        <small>${cost} scrap</small>
        ${additionalInfo ? `<br><small style="color: #aaa;">${additionalInfo}</small>` : ''}
    </button>
  `;
}

// Create a compact upgrade button with tooltip
export function createCompactUpgradeButton(config: UpgradeButtonConfig): string {
  return createUpgradeButton({ ...config, compact: true });
}

// Create a section header
export function createSectionHeader(title: string, color: string = '#0f0'): string {
  return `<h5 style="color: ${color}; margin: 0 0 10px 0;">${title}</h5>`;
}

// Create a grid container
export function createGridContainer(columns: string = '1fr 1fr', gap: string = '8px', maxWidth: string = '290px'): { open: string; close: string } {
  return {
    open: `<div style="display: grid; grid-template-columns: ${columns}; gap: ${gap}; max-width: ${maxWidth};">`,
    close: '</div>'
  };
}

// Tab information interface
interface TabInfo {
  id: string;
  label: string;
}

// Create tab button
export function createTabButton(tabInfo: TabInfo, currentTab: string, onClickHandler: (tab: string) => void): HTMLButtonElement {
  const isActive = currentTab === tabInfo.id;
  const button = document.createElement('button');
  button.textContent = tabInfo.label;
  button.style.cssText = `
    flex: 1; 
    padding: 12px; 
    background: ${isActive ? '#0f0' : 'transparent'}; 
    color: ${isActive ? '#000' : '#0f0'}; 
    border: none; 
    cursor: pointer;
    border-radius: 0;
    font-weight: bold; 
    font-size: 13px; 
    transition: all 0.2s ease;
    text-transform: uppercase;
  `;
  
  // Add hover effect for inactive tabs
  if (!isActive) {
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(0, 255, 0, 0.1)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = 'transparent';
    });
  }
  
  // Add click handler
  button.addEventListener('click', () => onClickHandler(tabInfo.id));
  
  return button;
}

// Export all functions for global compatibility
(window as any).createUpgradeButton = createUpgradeButton;
(window as any).createCompactUpgradeButton = createCompactUpgradeButton;
(window as any).createSectionHeader = createSectionHeader;
(window as any).createGridContainer = createGridContainer;
(window as any).createTabButton = createTabButton;
(window as any).BUTTON_STYLES = BUTTON_STYLES;
(window as any).COLORS = COLORS;
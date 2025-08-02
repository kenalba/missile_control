// Sidebar State Management for Fully Collapsible Sidebar
import { gameState } from '@/systems/observableState';

interface SidebarState {
  isExpanded: boolean;
  currentTab: string;
}

const sidebarState: SidebarState = {
  isExpanded: true, // Start expanded by default
  currentTab: 'cities', // Start with Cities tab for progressive disclosure
};


// Get game canvas element
function getCanvasElement(): HTMLElement | null {
  return document.getElementById('gameCanvas');
}

// Get game container element
function getGameContainerElement(): HTMLElement | null {
  return document.getElementById('gameContainer');
}

// Expand sidebar (show full sidebar)
export function expandSidebar(): void {
  console.log('🎮 Expanding sidebar...');
  
  sidebarState.isExpanded = true;
  
  // Update body class to show expanded state
  document.body.classList.add('sidebar-expanded');
  document.body.classList.remove('sidebar-collapsed');
  
  console.log('Sidebar expanded, updating content...');
  
  // Update sidebar content with small delay to ensure DOM is ready
  setTimeout(() => {
    updateSidebarContent();
  }, 10);
  
  // Adjust game layout
  adjustGameLayout();
  
  // Update button states
  updateExpandButton();
}

// Collapse sidebar (hide completely)
export function collapseSidebar(): void {
  console.log('🎮 Collapsing sidebar...');
  
  sidebarState.isExpanded = false;
  
  // Update body class to show collapsed state
  document.body.classList.add('sidebar-collapsed');
  document.body.classList.remove('sidebar-expanded');
  
  // Adjust game layout
  adjustGameLayout();
  
  // Update button states
  updateExpandButton();
}

// Toggle sidebar expansion
export function toggleSidebar(): void {
  if (sidebarState.isExpanded) {
    collapseSidebar();
  } else {
    expandSidebar();
  }
}

// Auto-expand sidebar when switching to Command mode
export function autoExpandForCommandMode(): void {
  // Only auto-expand on desktop
  if (window.innerWidth > 768 && gameState.currentMode === 'command' && !sidebarState.isExpanded) {
    expandSidebar();
  }
}

// Auto-collapse when switching to Arcade mode (optional)
export function autoCollapseForArcadeMode(): void {
  // Don't auto-collapse - let user control sidebar visibility
  // if (gameState.currentMode === 'arcade' && sidebarState.isExpanded) {
  //   collapseSidebar();
  // }
}

// Adjust game layout when sidebar expands/collapses
function adjustGameLayout(): void {
  // Skip layout adjustment on mobile
  if (window.innerWidth <= 768) return;
  
  const gameContainer = getGameContainerElement();
  const canvas = getCanvasElement();
  if (!gameContainer || !canvas) return;
  
  console.log('🎮 Adjusting game layout for new flexible layout');
  
  // With new layout, gameContainer is flex: 1 and handles its own sizing
  // We just need to ensure canvas maintains aspect ratio within the container
  const containerRect = gameContainer.getBoundingClientRect();
  const availableWidth = containerRect.width - 40; // Account for padding
  const availableHeight = containerRect.height - 40; // Account for padding
  
  // Calculate size based on 1200:900 aspect ratio
  const canvasAspectRatio = 1200 / 900;
  
  const widthConstrainedHeight = availableWidth / canvasAspectRatio;
  const heightConstrainedWidth = availableHeight * canvasAspectRatio;
  
  if (widthConstrainedHeight <= availableHeight) {
    // Width is the limiting factor
    canvas.style.width = `${availableWidth}px`;
    canvas.style.height = `${widthConstrainedHeight}px`;
  } else {
    // Height is the limiting factor
    canvas.style.width = `${heightConstrainedWidth}px`;
    canvas.style.height = `${availableHeight}px`;
  }
  
  console.log('🎮 Canvas resized to:', canvas.style.width, 'x', canvas.style.height);
}

// Update toggle button appearance
function updateExpandButton(): void {
  const toggleButton = document.getElementById('sidebar-toggle-btn');
  
  console.log('Updating toggle button. Expanded:', sidebarState.isExpanded);
  console.log('Toggle button element:', toggleButton);
  
  if (toggleButton) {
    if (sidebarState.isExpanded) {
      toggleButton.textContent = '▶'; // Point right to indicate "hide sidebar"
      toggleButton.title = 'Collapse sidebar';
    } else {
      toggleButton.textContent = '◀'; // Point left to indicate "show sidebar"
      toggleButton.title = 'Expand sidebar';
    }
    
    // Make sure button is visible
    toggleButton.style.display = 'flex';
    console.log('Toggle button updated successfully');
  } else {
    console.error('Toggle button not found in DOM!');
  }
}

// Get current sidebar state
export function getSidebarState(): SidebarState {
  return { ...sidebarState };
}

// Set current tab for Command mode
export function setSidebarTab(tab: string): void {
  sidebarState.currentTab = tab;
  updateSidebarContent();
}

// Get current tab
export function getSidebarTab(): string {
  return sidebarState.currentTab;
}

// Check which tabs should be visible based on unlock conditions
function getVisibleTabs(): Array<{id: string, label: string}> {
  const tabs = [
    { id: 'cities', label: 'CITIES' } // Always visible
  ];
  
  const globalUpgrades = (window as any).globalUpgrades;
  
  // Science tab unlocked by "research" upgrade (Unlock Science)
  if (globalUpgrades?.research?.level > 0) {
    tabs.push({ id: 'science', label: 'SCIENCE' });
  }
  
  // Turrets tab unlocked by "unlockTurretUpgrades" upgrade
  if (globalUpgrades?.unlockTurretUpgrades?.level > 0) {
    tabs.push({ id: 'turrets', label: 'TURRETS' });
  }
  
  return tabs;
}

// Update sidebar content - show tabbed interface only in Command Mode
export function updateSidebarContent(): void {
  console.log('🎮 Updating sidebar content...');
  
  const commandCenterContent = document.getElementById('commandCenterContent');
  if (!commandCenterContent) {
    console.error('Command center content element not found!');
    return;
  }
  
  console.log('Current mode:', gameState.currentMode, 'Expanded:', sidebarState.isExpanded);
  
  // Only show tabbed interface in Command Mode
  if (gameState.currentMode !== 'command') {
    commandCenterContent.innerHTML = ''; // Empty in Arcade Mode
    return;
  }
  
  // Generate tabbed interface for Command Mode only
  const currentTab = sidebarState.currentTab;
  const visibleTabs = getVisibleTabs();
  
  // If current tab is not visible anymore, switch to first visible tab
  if (!visibleTabs.find(tab => tab.id === currentTab)) {
    sidebarState.currentTab = visibleTabs[0]?.id || 'cities';
  }
  
  let contentHtml = '';
  
  // Only show tab buttons if there are multiple tabs
  if (visibleTabs.length > 1) {
    contentHtml += `
      <div class="sidebar-tab-buttons" style="display: flex; border-bottom: 1px solid #0f0; background: rgba(0, 255, 0, 0.05); margin-bottom: 15px;">
    `;
    
    // Create individual tab buttons for visible tabs only
    visibleTabs.forEach(tabInfo => {
      const isActive = sidebarState.currentTab === tabInfo.id;
      contentHtml += `
        <button 
          onclick="setSidebarTab('${tabInfo.id}')"
          style="
            flex: 1; 
            padding: 10px; 
            background: ${isActive ? '#0f0' : 'transparent'}; 
            color: ${isActive ? '#000' : '#0f0'}; 
            border: none; 
            cursor: pointer;
            border-radius: 0;
            font-weight: bold; 
            font-size: 12px; 
            transition: all 0.2s ease;
            text-transform: uppercase;
          "
          onmouseenter="if (this.style.background === 'transparent') this.style.background = 'rgba(0, 255, 0, 0.1)'"
          onmouseleave="if (this.style.color === 'rgb(0, 255, 0)') this.style.background = 'transparent'"
        >
          ${tabInfo.label}
        </button>
      `;
    });
    
    contentHtml += `</div>`;
  }
  
  // Add tab content directly without extra container
  if (sidebarState.currentTab === 'cities') {
    contentHtml += (window as any).getCitiesUpgradesHTML();
  } else if (sidebarState.currentTab === 'science') {
    contentHtml += (window as any).getScienceUpgradesHTML();
  } else if (sidebarState.currentTab === 'turrets') {
    contentHtml += (window as any).getTurretsUpgradesHTML();
  }
  
  // Set all content directly in command center
  commandCenterContent.innerHTML = contentHtml;
}

// Initialize sidebar state based on current mode
export function initializeSidebar(): void {
  // Set initial state - start expanded by default
  sidebarState.isExpanded = true;
  document.body.classList.add('sidebar-expanded');
  
  // Set initial state based on current mode
  if (gameState.currentMode === 'command') {
    autoExpandForCommandMode();
  }
  
  // Set up resize listener for responsive behavior
  window.addEventListener('resize', () => {
    adjustGameLayout();
    
    // Auto-collapse on mobile if expanded
    if (window.innerWidth <= 768 && sidebarState.isExpanded) {
      collapseSidebar();
    }
  });
  
  // Initialize button state
  updateExpandButton();
  
  // Initialize sidebar content
  updateSidebarContent();
  
  // Set initial layout with a slight delay to ensure DOM is ready
  setTimeout(() => {
    adjustGameLayout();
  }, 100);
}

// Handle mode change
export function handleModeChange(newMode: string): void {
  console.log('🎮 Handling mode change to:', newMode);
  
  if (newMode === 'command') {
    // Immediately set sidebar state for Command mode
    if (window.innerWidth > 768) {
      sidebarState.isExpanded = true;
      document.body.classList.add('sidebar-expanded');
      document.body.classList.remove('sidebar-collapsed');
      
      // Also set the command mode class immediately
      document.body.classList.add('command-mode');
      document.body.classList.remove('arcade-mode');
    }
    autoExpandForCommandMode();
  } else if (newMode === 'arcade') {
    // Set arcade mode class immediately
    document.body.classList.add('arcade-mode');
    document.body.classList.remove('command-mode');
    
    // Keep current sidebar state for Arcade mode
    // Don't auto-collapse, let user decide
    // autoCollapseForArcadeMode();
  }
  
  // Update button states immediately
  updateExpandButton();
  
  // Update sidebar content
  updateSidebarContent();
}

// Make functions globally accessible
(window as any).expandSidebar = expandSidebar;
(window as any).collapseSidebar = collapseSidebar;
(window as any).toggleSidebar = toggleSidebar;
(window as any).initializeSidebar = initializeSidebar;
(window as any).handleModeChange = handleModeChange;
(window as any).setSidebarTab = setSidebarTab;
(window as any).getSidebarTab = getSidebarTab;
(window as any).updateSidebarContent = updateSidebarContent;
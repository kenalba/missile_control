// Sidebar State Management for Fully Collapsible Sidebar
import { gameState } from '@/systems/observableState';

interface SidebarState {
  isExpanded: boolean;
  currentTab: string;
}

const sidebarState: SidebarState = {
  isExpanded: true, // Start expanded by default
  currentTab: 'global',
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
  
  // Create tab buttons directly in command center (no extra container)
  let contentHtml = `
    <div class="sidebar-tab-buttons" style="display: flex; border-bottom: 1px solid #0f0; background: rgba(0, 255, 0, 0.05); margin-bottom: 15px;">
  `;
  
  // Create individual tab buttons
  const tabs = [
    { id: 'global', label: 'GLOBAL' },
    { id: 'turrets', label: 'TURRETS' }, 
    { id: 'cities', label: 'CITIES' }
  ];
  
  tabs.forEach(tabInfo => {
    const isActive = currentTab === tabInfo.id;
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
  
  // Add tab content directly without extra container
  if (currentTab === 'global') {
    contentHtml += (window as any).getGlobalUpgradesHTML();
  } else if (currentTab === 'turrets') {
    contentHtml += (window as any).getTurretsUpgradesHTML();
  } else if (currentTab === 'cities') {
    contentHtml += (window as any).getCitiesUpgradesHTML();
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
// Tooltip manager using Tippy.js for better positioning and overflow handling
import tippy, { Instance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';

export class TooltipManager {
    private static instance: TooltipManager;
    private tippyInstances: Instance[] = [];
    
    static getInstance(): TooltipManager {
        if (!TooltipManager.instance) {
            TooltipManager.instance = new TooltipManager();
        }
        return TooltipManager.instance;
    }
    
    init(): void {
        // Initialize tooltips for existing elements
        this.initializeTooltips();
        
        // Set up mutation observer to handle dynamically added tooltips
        this.setupMutationObserver();
    }
    
    initializeTooltips(): void {
        const tooltipElements = document.querySelectorAll('.tooltip[data-tooltip]');
        
        tooltipElements.forEach((element) => {
            this.createTooltip(element as HTMLElement);
        });
    }
    
    createTooltip(element: HTMLElement): void {
        const tooltipText = element.dataset.tooltip;
        if (!tooltipText) return;
        
        // Destroy existing tippy instance if it exists
        const existingInstance = (element as any)._tippy;
        if (existingInstance) {
            existingInstance.destroy();
        }
        
        try {
            const instance = tippy(element, {
                content: tooltipText,
                theme: 'missile-command',
                placement: 'top',
                arrow: true,
                delay: [300, 100], // Standard delays
                duration: [200, 150], // Standard animations
                maxWidth: 280,
                allowHTML: false,
                appendTo: element.closest('#upgradePanel') || document.body, // Append to nearest container
                interactive: false,
                hideOnClick: true,
                trigger: 'mouseenter', // Only mouseenter to avoid focus conflicts
                zIndex: 10000,
                // Disable animations during creation to prevent flickering
                animation: 'fade',
                popperOptions: {
                    strategy: 'absolute',
                    modifiers: [
                        {
                            name: 'flip',
                            enabled: true,
                            options: {
                                fallbackPlacements: ['bottom', 'right', 'left'],
                            },
                        },
                        {
                            name: 'preventOverflow',
                            enabled: true,
                            options: {
                                boundary: 'clippingParents',
                                padding: 5,
                            },
                        },
                        {
                            name: 'offset',
                            options: {
                                offset: [0, 10],
                            },
                        },
                    ],
                },
                onCreate(instance) {
                    // Ensure clean initial state
                    instance.popper.style.visibility = 'hidden';
                },
                onMount(instance) {
                    // Show only after proper positioning
                    requestAnimationFrame(() => {
                        instance.popper.style.visibility = 'visible';
                    });
                },
                onShow(instance) {
                    // Hide all other tooltips when showing this one
                    TooltipManager.getInstance().hideAllExcept(instance);
                },
                onHidden(instance) {
                    // Clean up completely when hidden
                    instance.popper.style.visibility = 'hidden';
                    instance.popper.style.transform = '';
                }
            });
            
            this.tippyInstances.push(instance);
        } catch (error) {
            console.error('Error creating tooltip:', error);
        }
    }
    
    setupMutationObserver(): void {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // Check for added nodes
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as HTMLElement;
                        
                        // Check if the added node itself has tooltip
                        if (element.classList.contains('tooltip') && element.dataset.tooltip) {
                            this.createTooltip(element);
                        }
                        
                        // Check for tooltip elements within the added node
                        const tooltipElements = element.querySelectorAll('.tooltip[data-tooltip]');
                        tooltipElements.forEach((tooltipEl) => {
                            this.createTooltip(tooltipEl as HTMLElement);
                        });
                    }
                });
                
                // Handle attribute changes (like data-tooltip updates)
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'data-tooltip' &&
                    mutation.target instanceof HTMLElement) {
                    
                    const element = mutation.target;
                    if (element.classList.contains('tooltip')) {
                        this.createTooltip(element);
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-tooltip']
        });
    }
    
    // Hide all tooltips except the specified one
    hideAllExcept(exceptInstance: Instance): void {
        this.tippyInstances.forEach(instance => {
            if (instance !== exceptInstance && instance.state.isVisible) {
                instance.hide();
            }
        });
    }
    
    // Refresh all tooltips (useful when content changes)
    refreshTooltips(): void {
        // Throttle refresh to prevent excessive updates
        if (Date.now() - this.lastRefresh < 100) return;
        this.lastRefresh = Date.now();
        
        // Only refresh if we actually have tooltip elements
        const tooltipElements = document.querySelectorAll('.tooltip[data-tooltip]');
        if (tooltipElements.length === 0) {
            return; // No tooltips to refresh
        }
        
        // Don't destroy and recreate - just update existing tooltips
        this.updateExistingTooltips();
    }
    
    private lastRefresh = 0;
    
    // Update existing tooltips instead of destroying and recreating
    private updateExistingTooltips(): void {
        const tooltipElements = document.querySelectorAll('.tooltip[data-tooltip]');
        
        // First, mark all instances as potentially unused
        const usedInstances = new Set<Instance>();
        
        tooltipElements.forEach((element) => {
            const existingInstance = (element as any)._tippy;
            if (existingInstance) {
                // Update content if changed
                const newContent = (element as HTMLElement).dataset.tooltip;
                if (newContent && existingInstance.props.content !== newContent) {
                    existingInstance.setContent(newContent);
                }
                usedInstances.add(existingInstance);
            } else {
                // Create new tooltip for elements that don't have one
                this.createTooltip(element as HTMLElement);
            }
        });
        
        // Remove instances that are no longer needed
        this.tippyInstances = this.tippyInstances.filter(instance => {
            if (!usedInstances.has(instance)) {
                instance.destroy();
                return false;
            }
            return true;
        });
    }
    
    // Destroy all tooltip instances
    destroyAll(): void {
        this.tippyInstances.forEach(instance => {
            try {
                if (instance && !instance.state.isDestroyed) {
                    instance.destroy();
                }
            } catch (e) {
                // Instance already destroyed, ignore
            }
        });
        this.tippyInstances = [];
    }
}

// Custom theme for missile command tooltips
const style = document.createElement('style');
style.textContent = `
.tippy-box[data-theme~='missile-command'] {
    background: rgba(0, 0, 0, 0.95) !important;
    border: 2px solid #0f0 !important;
    border-radius: 6px !important;
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.4) !important;
    color: #0f0 !important;
    font-family: 'Courier New', monospace !important;
    font-size: 12px !important;
    line-height: 1.4 !important;
    padding: 10px 14px !important;
}

.tippy-box[data-theme~='missile-command'] .tippy-content {
    padding: 0 !important;
    color: #0f0 !important;
}

.tippy-box[data-theme~='missile-command'] .tippy-arrow {
    color: rgba(0, 0, 0, 0.95) !important;
}

.tippy-box[data-theme~='missile-command'] .tippy-arrow::before {
    border-top-color: #0f0 !important;
    border-bottom-color: #0f0 !important;
    border-left-color: #0f0 !important;
    border-right-color: #0f0 !important;
}
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        TooltipManager.getInstance().init();
    });
} else {
    TooltipManager.getInstance().init();
}

// Make globally available
(window as any).TooltipManager = TooltipManager;

// Global function to refresh tooltips after UI updates
(window as any).refreshTooltips = () => {
    TooltipManager.getInstance().refreshTooltips();
};

// Debug function to check tooltip elements
(window as any).debugTooltips = () => {
    const elements = document.querySelectorAll('.tooltip[data-tooltip]');
    console.log('🔧 Found', elements.length, 'tooltip elements:');
    elements.forEach((el, i) => {
        console.log(`  ${i + 1}: "${el.getAttribute('data-tooltip')}" on`, el);
    });
    return elements;
};

// Debug function to manually initialize tooltips
(window as any).manualInitTooltips = () => {
    console.log('🔧 Manually initializing tooltips...');
    TooltipManager.getInstance().initializeTooltips();
};

// Debug function to manually show a tooltip
(window as any).testTooltip = () => {
    const elements = document.querySelectorAll('.tooltip[data-tooltip]');
    if (elements.length > 0) {
        const firstElement = elements[0] as HTMLElement;
        const tippyInstance = (firstElement as any)._tippy;
        if (tippyInstance) {
            console.log('🔧 Manually showing tooltip for first element');
            tippyInstance.show();
        } else {
            console.log('🔧 No tippy instance found on first element');
        }
    }
};
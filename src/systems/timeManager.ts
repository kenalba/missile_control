// Time Management System - Handles pause-aware game time
import { gameState } from '@/systems/observableState';

class TimeManager {
    private startTime: number = 0;
    private totalPausedTime: number = 0;
    private pauseStartTime: number = 0;
    private lastUpdateTime: number = 0;

    initialize(): void {
        this.startTime = Date.now();
        this.totalPausedTime = 0;
        this.pauseStartTime = 0;
        this.lastUpdateTime = Date.now();
        gameState.gameTime = 0;
    }

    update(): void {
        const now = Date.now();
        
        if (gameState.paused) {
            // If we just paused, record the pause start time
            if (this.pauseStartTime === 0) {
                this.pauseStartTime = now;
            }
            // Don't update game time while paused
            return;
        } else {
            // If we just unpaused, add the pause duration to total paused time
            if (this.pauseStartTime > 0) {
                this.totalPausedTime += now - this.pauseStartTime;
                this.pauseStartTime = 0;
            }
        }

        // Update game time (real time minus paused time)
        gameState.gameTime = now - this.startTime - this.totalPausedTime;
        this.lastUpdateTime = now;
    }

    // Get current game time (pause-aware)
    getGameTime(): number {
        return gameState.gameTime;
    }

    // Check if enough time has passed since a timestamp (pause-aware)
    hasTimePassed(timestamp: number, duration: number): boolean {
        return this.getGameTime() - timestamp >= duration;
    }

    // Reset game time (for new games)
    reset(): void {
        this.initialize();
    }

    // Get time since a specific game time timestamp
    getTimeSince(timestamp: number): number {
        return this.getGameTime() - timestamp;
    }
}

export const timeManager = new TimeManager();

// Make available globally for legacy compatibility
(window as any).timeManager = timeManager;
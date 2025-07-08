// Save system for persistent data with TypeScript typing

import type { SaveData, HighScore, Achievements } from '@/types/gameTypes';

const SAVE_KEY = 'missile_control_save';
const SAVE_VERSION = 1;

// These interfaces may be used in future features
// interface AchievementDefinition {
//   id: string;
//   name: string;
//   description: string;
// }

// interface StatsUpdate {
//   gamesPlayed?: number;
//   totalScore?: number;
//   totalMissilesDestroyed?: number;
//   totalWavesCompleted?: number;
//   highestWave?: number;
//   totalPlayTime?: number;
// }

// Default save data structure
function getDefaultSaveData(): SaveData {
  return {
    highScores: [],
    lastSelectedMode: 'arcade',
    achievements: {
      missilesDestroyed: 0,
      planesDestroyed: 0,
      wavesCompleted: 0,
      citiesLost: 0,
      seekersDestroyed: 0,
      totalScrapEarned: 0,
      lastMilestoneWave: 0
    },
    totalPlayTime: 0,
    gamesPlayed: 0
  };
}

// Legacy achievement structure for migration
interface LegacyAchievements {
  wave5?: boolean;
  wave10?: boolean;
  wave15?: boolean;
  wave20?: boolean;
  score10k?: boolean;
  score50k?: boolean;
  score100k?: boolean;
  score500k?: boolean;
  missiles100?: boolean;
  missiles500?: boolean;
  missiles1000?: boolean;
  missiles5000?: boolean;
  firstUpgrade?: boolean;
  allLaunchersMaxed?: boolean;
  cityMaxed?: boolean;
  economicUpgrades?: boolean;
  perfectWave?: boolean;
  allCitiesSaved?: boolean;
  longGame?: boolean;
}

// Legacy save data structure for migration
interface LegacySaveData {
  version?: number;
  highScores?: Array<{
    score: number;
    wave: number;
    date: string;
  }>;
  totalStats?: {
    gamesPlayed?: number;
    totalScore?: number;
    totalMissilesDestroyed?: number;
    totalWavesCompleted?: number;
    highestWave?: number;
    totalPlayTime?: number;
  };
  achievements?: LegacyAchievements;
  preferences?: {
    soundEnabled?: boolean;
    showTutorial?: boolean;
    lastSelectedMode?: 'arcade' | 'command';
  };
}

// Load save data from localStorage
function loadSaveData(): SaveData {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (!savedData) {
      return getDefaultSaveData();
    }

    const parsed: LegacySaveData = JSON.parse(savedData);

    // Version migration if needed
    if (parsed.version !== SAVE_VERSION) {
      console.log('Save data version mismatch, migrating...');
      return migrateSaveData(parsed);
    }

    // Convert legacy format to new format
    return migrateSaveData(parsed);
  } catch (error) {
    console.error('Failed to load save data:', error);
    return getDefaultSaveData();
  }
}

// Migrate old save data to new version
function migrateSaveData(oldData: LegacySaveData): SaveData {
  const newData = getDefaultSaveData();

  // Migrate high scores
  if (oldData.highScores && Array.isArray(oldData.highScores)) {
    newData.highScores = oldData.highScores.map(score => ({
      score: score.score,
      wave: score.wave,
      date: new Date(score.date).getTime()
    }));
  }

  // Migrate last selected mode
  if (oldData.preferences?.lastSelectedMode) {
    newData.lastSelectedMode = oldData.preferences.lastSelectedMode;
  }

  // Migrate total stats to achievements
  if (oldData.totalStats) {
    newData.achievements.missilesDestroyed = oldData.totalStats.totalMissilesDestroyed || 0;
    newData.achievements.wavesCompleted = oldData.totalStats.totalWavesCompleted || 0;
    newData.totalPlayTime = oldData.totalStats.totalPlayTime || 0;
    newData.gamesPlayed = oldData.totalStats.gamesPlayed || 0;
  }

  return newData;
}

// Save data to localStorage
function saveSaveData(saveData: SaveData): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (error) {
    console.error('Failed to save data:', error);
    return false;
  }
}

export class SaveSystem {
  private saveData: SaveData;

  constructor() {
    this.saveData = loadSaveData();
  }

  // Get current save data (read-only)
  public getSaveData(): Readonly<SaveData> {
    return { ...this.saveData };
  }

  // Save current data to localStorage
  public save(): boolean {
    return saveSaveData(this.saveData);
  }

  // Add a high score
  public addHighScore(score: number, wave: number): HighScore {
    const newScore: HighScore = {
      score,
      wave,
      date: Date.now()
    };

    this.saveData.highScores.push(newScore);

    // Sort by score descending and keep top 10
    this.saveData.highScores.sort((a, b) => b.score - a.score);
    if (this.saveData.highScores.length > 10) {
      this.saveData.highScores = this.saveData.highScores.slice(0, 10);
    }

    this.save();
    return newScore;
  }

  // Update achievements
  public updateAchievements(achievementUpdate: Partial<Achievements>): void {
    Object.keys(achievementUpdate).forEach(key => {
      const typedKey = key as keyof Achievements;
      if (typedKey in this.saveData.achievements) {
        const currentValue = this.saveData.achievements[typedKey];
        const updateValue = achievementUpdate[typedKey];
        
        if (typeof currentValue === 'number' && typeof updateValue === 'number') {
          if (typedKey === 'lastMilestoneWave') {
            this.saveData.achievements[typedKey] = Math.max(currentValue, updateValue);
          } else {
            this.saveData.achievements[typedKey] = currentValue + updateValue;
          }
        }
      }
    });
  }

  // Save at wave completion
  public saveWaveCompletion(currentWave: number, _currentScore: number): void {
    this.updateAchievements({
      wavesCompleted: 1,
      lastMilestoneWave: currentWave
    });

    this.save();
  }

  // Save at game over
  public saveGameOver(finalScore: number, finalWave: number): void {
    this.saveData.gamesPlayed++;
    this.addHighScore(finalScore, finalWave);
  }

  // Save mode preference
  public saveMode(mode: 'arcade' | 'command'): void {
    this.saveData.lastSelectedMode = mode;
    this.save();
  }

  // Get last selected mode
  public getLastSelectedMode(): 'arcade' | 'command' {
    return this.saveData.lastSelectedMode;
  }

  // Get high scores
  public getHighScores(): readonly HighScore[] {
    return [...this.saveData.highScores];
  }

  // Clear all save data (for testing or reset)
  public clearSaveData(): void {
    localStorage.removeItem(SAVE_KEY);
    this.saveData = getDefaultSaveData();
  }

  // Check if there are any high scores
  public hasHighScores(): boolean {
    return this.saveData.highScores.length > 0;
  }

  // Get highest score
  public getHighestScore(): number {
    return this.saveData.highScores.length > 0 ? this.saveData.highScores[0].score : 0;
  }

  // Update total play time
  public updatePlayTime(additionalTime: number): void {
    this.saveData.totalPlayTime += additionalTime;
    this.save();
  }
}

// Create and export a singleton instance
export const saveSystem = new SaveSystem();

// Make save system globally available for legacy compatibility
if (typeof window !== 'undefined') {
  (window as any).saveSystem = saveSystem;
}
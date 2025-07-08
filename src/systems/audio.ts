// Audio system for sound effects with TypeScript typing

import type { AudioConfig, ToneConfig } from '@/types/gameTypes';
import { AUDIO_CONFIG } from '@/config/constants';

export interface SoundReference {
  oscillator: OscillatorNode;
  gainNode: GainNode;
}

export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private config: AudioConfig = {
    enabled: false,
    volume: AUDIO_CONFIG.defaultVolume,
    context: undefined
  };

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      // Use proper types for WebKit compatibility
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.config.enabled = true;
      this.config.context = this.audioContext;
    } catch (error) {
      console.log('Audio not supported:', error);
      this.config.enabled = false;
    }
  }

  // Get the current audio configuration
  public getConfig(): Readonly<AudioConfig> {
    return { ...this.config };
  }

  // Set global volume
  public setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  // Enable/disable audio
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  // Create a simple tone with typed parameters
  public playTone(
    frequency: number, 
    duration: number, 
    type: OscillatorType = 'sine', 
    volume: number = this.config.volume
  ): void {
    if (!this.config.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    const adjustedVolume = volume * this.config.volume;
    gainNode.gain.setValueAtTime(adjustedVolume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Play tone with configuration object
  public playToneConfig(config: ToneConfig): void {
    this.playTone(config.frequency, config.duration, config.type, config.volume);
  }

  // Missile launch sound - quick ascending tone
  public playMissileLaunch(): void {
    if (!this.config.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
    oscillator.type = 'square';

    const volume = 0.05 * this.config.volume;
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // Explosion sound - noise burst
  public playExplosion(isPlayer: boolean = false): void {
    if (!this.config.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const baseFreq = isPlayer ? 150 : 80;
    const endFreq = isPlayer ? 50 : 20;
    oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + 0.3);
    oscillator.type = 'sawtooth';

    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(isPlayer ? 800 : 400, this.audioContext.currentTime);
    filterNode.frequency.exponentialRampToValueAtTime(isPlayer ? 200 : 100, this.audioContext.currentTime + 0.3);

    const volume = (isPlayer ? 0.08 : 0.04) * this.config.volume;
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  // Empty ammo sound - descending tone indicating depletion
  public playEmptyAmmo(): void {
    if (!this.config.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.2);
    oscillator.type = 'triangle';

    const volume = 0.04 * this.config.volume;
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  // Cooldown sound - short blip indicating not ready
  public playCooldown(): void {
    if (!this.config.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime + 0.05);
    oscillator.type = 'sine';

    const volume = 0.03 * this.config.volume;
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // Plane engine sound - continuous low rumble
  public playPlaneEngine(): SoundReference | null {
    if (!this.config.enabled || !this.audioContext) return null;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
    oscillator.type = 'sawtooth';

    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(200, this.audioContext.currentTime);

    const volume = 0.02 * this.config.volume;
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

    oscillator.start(this.audioContext.currentTime);

    return {
      oscillator,
      gainNode
    };
  }

  // Plane firing sound - sharp downward sweep
  public playPlaneFire(): void {
    if (!this.config.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.15);
    oscillator.type = 'square';

    const volume = 0.06 * this.config.volume;
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  // Seeker warning sound - distinctive "bloo-bloo-bloo" pattern
  public playSeekerWarning(): void {
    if (!this.config.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(350, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(280, this.audioContext.currentTime + 0.05);
    oscillator.frequency.setValueAtTime(350, this.audioContext.currentTime + 0.1);

    const volume = 0.04 * this.config.volume;
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + 0.06);
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime + 0.07);
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime + 0.11);
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + 0.12);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  // Stop a sound (for continuous sounds like plane engines)
  public stopSound(soundRef: SoundReference | null): void {
    if (!this.config.enabled || !soundRef || !this.audioContext) return;

    try {
      soundRef.gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      soundRef.oscillator.stop(this.audioContext.currentTime + 0.1);
    } catch (error) {
      // Sound might already be stopped
      console.debug('Sound already stopped:', error);
    }
  }

  // Resume audio context (required for some browsers)
  public resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      return this.audioContext.resume();
    }
    return Promise.resolve();
  }

  // Get current audio context state
  public getState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  // Cleanup method for proper disposal
  public dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.config.enabled = false;
    }
  }
}

// Create and export a singleton instance
export const audioSystem = new AudioSystem();

// Auto-resume audio on first user interaction
const resumeAudio = (): void => {
  audioSystem.resume().catch(error => {
    console.debug('Failed to resume audio:', error);
  });
};

// Add event listeners for user interaction
if (typeof document !== 'undefined') {
  document.addEventListener('click', resumeAudio, { once: true });
  document.addEventListener('keydown', resumeAudio, { once: true });
  document.addEventListener('touchstart', resumeAudio, { once: true });
}

// Make audio system globally available for legacy compatibility
if (typeof window !== 'undefined') {
  (window as any).audioSystem = audioSystem;
}
// Audio system for sound effects
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = false;
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.enabled = true;
        } catch (e) {
            console.log('Audio not supported');
            this.enabled = false;
        }
    }
    
    // Create a simple tone
    playTone(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // Missile launch sound - quick ascending tone
    playMissileLaunch() {
        if (!this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    // Explosion sound - noise burst
    playExplosion(isPlayer = false) {
        if (!this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(isPlayer ? 150 : 80, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(isPlayer ? 50 : 20, this.audioContext.currentTime + 0.3);
        oscillator.type = 'sawtooth';
        
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(isPlayer ? 800 : 400, this.audioContext.currentTime);
        filterNode.frequency.exponentialRampToValueAtTime(isPlayer ? 200 : 100, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(isPlayer ? 0.08 : 0.04, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    // Empty ammo sound - descending tone indicating depletion
    playEmptyAmmo() {
        if (!this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.2);
        oscillator.type = 'triangle';
        
        gainNode.gain.setValueAtTime(0.04, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    // Cooldown sound - short blip indicating not ready
    playCooldown() {
        if (!this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime + 0.05);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.03, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    // Plane engine sound - continuous low rumble
    playPlaneEngine() {
        if (!this.enabled) return null;
        
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
        
        gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
        
        oscillator.start(this.audioContext.currentTime);
        
        // Return object with references to stop the sound
        return {
            oscillator: oscillator,
            gainNode: gainNode
        };
    }
    
    // Plane firing sound - sharp downward sweep
    playPlaneFire() {
        if (!this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.15);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.06, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }
    
    // Stop a sound (for continuous sounds like plane engines)
    stopSound(soundRef) {
        if (!this.enabled || !soundRef) return;
        
        try {
            if (soundRef.gainNode) {
                soundRef.gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            }
            if (soundRef.oscillator) {
                soundRef.oscillator.stop(this.audioContext.currentTime + 0.1);
            }
        } catch (e) {
            // Sound might already be stopped
        }
    }
    
    // Resume audio context (required for some browsers)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Global audio system instance
const audioSystem = new AudioSystem();

// Resume audio on first user interaction
document.addEventListener('click', () => {
    audioSystem.resume();
}, { once: true });

document.addEventListener('keydown', () => {
    audioSystem.resume();
}, { once: true });
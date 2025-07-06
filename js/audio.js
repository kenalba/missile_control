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
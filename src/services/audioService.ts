class AudioService {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn("AudioContext resume failed:", e));
    }
    return this.ctx;
  }

  // Play standard UI button click sound
  playSelect() {
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio failed to play", e);
    }
  }

  // Play correct guess chime (ascending)
  playSuccess() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.01);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + duration);
      };

      // Play C5 -> E5 -> G5 -> C6 arpeggio
      playNote(523.25, now, 0.08); 
      playNote(659.25, now + 0.08, 0.08); 
      playNote(783.99, now + 0.16, 0.08); 
      playNote(1046.50, now + 0.24, 0.2); 
    } catch (e) {
      console.warn("Audio failed to play", e);
    }
  }

  // Play breakout / incorrect guess sound (descending)
  playFailure() {
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.35);
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio failed to play", e);
    }
  }

  // Play ball throw sound (swoosh)
  playThrow() {
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.18);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.35);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio failed to play", e);
    }
  }

  // Play low-bass thud (ball shaking)
  playShake() {
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio failed to play", e);
    }
  }

  // Play dynamic retro catch victory fanfare!
  playCatch() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0.04, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.02);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + duration);
      };

      // Play C5 -> D5 -> E5 -> F5 -> G5 -> G5 -> A5 -> C6 melody
      playNote(523.25, now, 0.1); 
      playNote(587.33, now + 0.1, 0.1); 
      playNote(659.25, now + 0.2, 0.1); 
      playNote(698.46, now + 0.3, 0.1); 
      playNote(783.99, now + 0.4, 0.15); 
      playNote(783.99, now + 0.55, 0.15); 
      playNote(880.00, now + 0.7, 0.15); 
      playNote(1046.50, now + 0.85, 0.45); 
    } catch (e) {
      console.warn("Audio failed to play", e);
    }
  }
}

export const audio = new AudioService();
export default audio;

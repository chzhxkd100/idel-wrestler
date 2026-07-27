export class AudioManager {
  constructor() {
    this.currentBgm = null;
    this.currentMapId = null;
    this.isMuted = false;
    this.volume = 0.45;
    this.hasInteracted = false;

    // Define BGM tracks for each map
    this.bgmMap = {
      map4: '/audio/AmericanBeauty.mp3'
    };

    // Unlock browser audio policy on first user interaction
    const unlockAudio = () => {
      this.hasInteracted = true;
      if (this.currentMapId) {
        this.playMapBgm(this.currentMapId);
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
  }

  playMapBgm(mapId) {
    this.currentMapId = mapId;
    const trackSrc = this.bgmMap[mapId];

    if (!trackSrc) {
      this.stopBgm();
      return;
    }

    // Don't restart if already playing the same track
    if (this.currentBgm && this.currentBgm.src.endsWith(encodeURI(trackSrc))) {
      if (this.currentBgm.paused && this.hasInteracted && !this.isMuted) {
        this.currentBgm.play().catch(e => console.warn('BGM play caught:', e));
      }
      return;
    }

    this.stopBgm();

    if (!this.hasInteracted) return;

    this.currentBgm = new Audio(trackSrc);
    this.currentBgm.loop = true;
    this.currentBgm.volume = this.isMuted ? 0 : this.volume;
    this.currentBgm.play().catch(e => console.warn('BGM play caught:', e));
  }

  stopBgm() {
    if (this.currentBgm) {
      this.currentBgm.pause();
      this.currentBgm.currentTime = 0;
      this.currentBgm = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.currentBgm) {
      this.currentBgm.volume = this.isMuted ? 0 : this.volume;
    }
    return this.isMuted;
  }
}

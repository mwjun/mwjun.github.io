/**
 * AudioModel - Manages audio state and configuration
 * Single Responsibility: Handle audio-related data and state
 */
export class AudioModel {
    constructor() {
        this.config = {
            bgMusic: {
                initialVolume: 0.15,
                homeVolume: 0.10,
                awayVolume: 0.05
            },
            sfx: {
                aboutVolume: 0.25
            }
        };
        this.bgMusicMuted = false;
        this.sfxMuted = false;
    }

    getConfig() {
        return this.config;
    }

    isBgMusicMuted() {
        return this.bgMusicMuted;
    }

    setBgMusicMuted(muted) {
        this.bgMusicMuted = muted;
    }

    isSfxMuted() {
        return this.sfxMuted;
    }

    setSfxMuted(muted) {
        this.sfxMuted = muted;
    }

    getVolumeForSection(sectionId) {
        return sectionId === 'home' 
            ? this.config.bgMusic.homeVolume 
            : this.config.bgMusic.awayVolume;
    }
}


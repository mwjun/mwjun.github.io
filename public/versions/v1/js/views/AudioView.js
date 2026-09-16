/**
 * AudioView - Handles DOM updates for audio controls
 * Single Responsibility: Manipulate the DOM for audio-related UI
 */
export class AudioView {
    constructor() {
        this.volumePanel = document.getElementById('volume-panel');
        this.volumeSlider = document.getElementById('volume-range');
        this.muteBtn = document.getElementById('mute-toggle');
        this.sfxBtn = document.getElementById('sfx-toggle');
        this.musicBtn = document.getElementById('music-toggle');
    }

    initializeVolumeSlider(value) {
        if (this.volumeSlider) {
            this.volumeSlider.value = value;
        }
    }

    updateVolumeSlider(value) {
        if (this.volumeSlider) {
            this.volumeSlider.value = value;
        }
    }

    updateMuteButton(isMuted) {
        if (this.muteBtn) {
            this.muteBtn.innerHTML = isMuted
                ? '<i class="fas fa-volume-up"></i>'
                : '<i class="fas fa-volume-mute"></i>';
        }
    }

    updateSfxButton(isMuted) {
        if (this.sfxBtn) {
            this.sfxBtn.innerHTML = isMuted
                ? '<i class="fas fa-bell"></i>'
                : '<i class="fas fa-bell-slash"></i>';
        }
    }

    toggleVolumePanel() {
        if (this.volumePanel) {
            this.volumePanel.classList.toggle('open');
        }
    }

    closeVolumePanel() {
        if (this.volumePanel) {
            this.volumePanel.classList.remove('open');
        }
    }

    playSound(audioElement) {
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play().catch(e => console.warn('Audio playback failed:', e));
        }
    }

    fadeVolume(audioElement, targetVolume, duration = 1500) {
        if (!audioElement) return;

        const steps = 30;
        const stepTime = duration / steps;
        const startVol = audioElement.volume;
        const stepAmt = (targetVolume - startVol) / steps;
        let current = 0;

        const fadeInterval = setInterval(() => {
            current++;
            audioElement.volume = Math.max(0, Math.min(1, audioElement.volume + stepAmt));
            if (current >= steps) {
                clearInterval(fadeInterval);
            }
        }, stepTime);
    }
}


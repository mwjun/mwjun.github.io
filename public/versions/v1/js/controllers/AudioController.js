/**
 * AudioController - Coordinates audio functionality
 * Single Responsibility: Handle audio events and coordinate model-view interactions
 */
export class AudioController {
    constructor(audioModel, audioView) {
        this.model = audioModel;
        this.view = audioView;
        this.audioElements = this.initializeAudioElements();
        this.sfxAudios = [];
        this.init();
    }

    initializeAudioElements() {
        return {
            bgMusic: document.getElementById('bg-music'),
            navSound: document.getElementById('nav-sound'),
            themeSound: document.getElementById('theme-sound'),
            enterSound: document.getElementById('theme-sound'),
            cvSound: document.getElementById('cv-hover-sound'),
            cvClickSound: document.getElementById('cv-click-sound'),
            expandSound: document.getElementById('expand-sound'),
            aboutHoverSound: document.getElementById('about-hover-sound'),
            timelineSound: document.getElementById('timeline-icon-sound'),
            electricSound: document.getElementById('electric-hover-sound')
        };
    }

    init() {
        this.initializeBgMusic();
        this.initializeVolumeControls();
        this.initializeMusicToggle();
        this.initializeSfxToggle();
        this.initializeSoundEffects();
    }

    initializeBgMusic() {
        const bgMusic = this.audioElements.bgMusic;
        const config = this.model.getConfig();

        if (bgMusic && this.view.volumeSlider) {
            bgMusic.volume = config.bgMusic.initialVolume;
            this.view.initializeVolumeSlider(config.bgMusic.initialVolume);
        }
    }

    initializeVolumeControls() {
        const bgMusic = this.audioElements.bgMusic;
        
        // Volume slider
        if (this.view.volumeSlider) {
            this.view.volumeSlider.addEventListener('input', (e) => {
                if (bgMusic) {
                    bgMusic.volume = parseFloat(e.target.value);
                }
            });
        }

        // Mute button
        if (this.view.muteBtn && bgMusic) {
            this.view.muteBtn.addEventListener('click', () => {
                bgMusic.muted = !bgMusic.muted;
                this.view.updateMuteButton(bgMusic.muted);
            });
        }
    }

    initializeMusicToggle() {
        if (this.view.musicBtn && this.view.volumePanel) {
            this.view.musicBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.view.toggleVolumePanel();
            });

            document.addEventListener('click', (e) => {
                if (!this.view.volumePanel.contains(e.target) && 
                    !this.view.musicBtn.contains(e.target)) {
                    this.view.closeVolumePanel();
                }
            });
        }
    }

    initializeSfxToggle() {
        if (!this.view.sfxBtn) return;

        // Collect all SFX audios (everything except bg-music)
        this.sfxAudios = Array.from(document.querySelectorAll('audio'))
            .filter(a => a.id !== 'bg-music');

        this.view.sfxBtn.addEventListener('click', () => {
            const sfxMuted = this.model.isSfxMuted();
            const newState = !sfxMuted;
            
            this.model.setSfxMuted(newState);
            this.sfxAudios.forEach(a => a.muted = newState);
            this.view.updateSfxButton(newState);
        });
    }

    initializeSoundEffects() {
        this.initializeLightningSound();
        this.initializeButtonHoverSounds();
        this.initializeTimelineSounds();
        this.initializeAboutHoverSound();
        this.initializeWelcomeScreenSound();
    }

    initializeLightningSound() {
        const lightningName = document.getElementById('lightning-name');
        const electricSound = this.audioElements.electricSound;

        if (lightningName && electricSound) {
            lightningName.addEventListener('mouseenter', () => {
                if (!this.model.isSfxMuted()) {
                    this.view.playSound(electricSound);
                }
            });
        }

        const nameElement = document.querySelector('.name');
        if (nameElement && electricSound) {
            nameElement.addEventListener('mouseenter', () => {
                if (!this.model.isSfxMuted()) {
                    this.view.playSound(electricSound);
                }
            });
        }
    }

    initializeButtonHoverSounds() {
        const cvButton = document.querySelector('.about .btn-con .main-btn');
        const sendBtn = document.querySelector('#contactForm .main-btn');
        const cvSound = this.audioElements.cvSound;
        const cvClickSound = this.audioElements.cvClickSound;

        [cvButton, sendBtn].forEach(btn => {
            if (btn && cvSound && cvClickSound) {
                btn.addEventListener('mouseenter', () => {
                    if (!this.model.isSfxMuted()) {
                        this.view.playSound(cvSound);
                        btn.classList.add('flash-animate');
                        setTimeout(() => {
                            btn.classList.remove('flash-animate');
                        }, 800);
                    }
                });

                btn.addEventListener('click', () => {
                    if (!this.model.isSfxMuted()) {
                        this.view.playSound(cvClickSound);
                    }
                });
            }
        });
    }

    initializeTimelineSounds() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        const timelineSound = this.audioElements.timelineSound;

        timelineItems.forEach(item => {
            const icon = item.querySelector('.tl-icon');
            if (icon && timelineSound) {
                icon.addEventListener('click', () => {
                    if (!this.model.isSfxMuted()) {
                        this.view.playSound(timelineSound);
                    }
                });
            }
        });
    }

    initializeAboutHoverSound() {
        const aboutHoverSound = this.audioElements.aboutHoverSound;
        const aboutItems = document.querySelectorAll('.about-item');

        if (aboutHoverSound && aboutItems.length) {
            aboutHoverSound.volume = this.model.getConfig().sfx.aboutVolume;
            aboutItems.forEach(item => {
                item.addEventListener('mouseenter', () => {
                    if (!this.model.isSfxMuted()) {
                        this.view.playSound(aboutHoverSound);
                    }
                });
            });
        }
    }

    initializeWelcomeScreenSound() {
        const bgMusic = this.audioElements.bgMusic;
        const enterBtn = document.getElementById('enter-btn');
        const enterSound = this.audioElements.enterSound;

        if (enterBtn && enterSound) {
            enterBtn.addEventListener('click', () => {
                if (!this.model.isSfxMuted()) {
                    this.view.playSound(enterSound);
                }

                // Delayed background music
                if (bgMusic && this.view.volumeSlider) {
                    bgMusic.volume = this.model.getConfig().bgMusic.initialVolume;
                    this.view.volumeSlider.value = this.model.getConfig().bgMusic.initialVolume;
                    
                    setTimeout(() => {
                        if (bgMusic.paused) {
                            bgMusic.play().catch(() => console.warn('Autoplay blocked'));
                        }
                    }, 1000);
                }
            });
        }
    }

    playNavSound() {
        if (!this.model.isSfxMuted()) {
            this.view.playSound(this.audioElements.navSound);
        }
    }

    playThemeSound() {
        if (!this.model.isSfxMuted()) {
            this.view.playSound(this.audioElements.themeSound);
        }
    }

    playExpandSound() {
        if (!this.model.isSfxMuted()) {
            this.view.playSound(this.audioElements.expandSound);
        }
    }

    fadeVolumeToSection(sectionId) {
        const bgMusic = this.audioElements.bgMusic;
        if (bgMusic) {
            const targetVolume = this.model.getVolumeForSection(sectionId);
            this.view.fadeVolume(bgMusic, targetVolume);
        }
    }
}


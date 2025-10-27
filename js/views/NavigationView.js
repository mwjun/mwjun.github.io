/**
 * NavigationView - Handles DOM updates for navigation
 * Single Responsibility: Manipulate the DOM for navigation-related UI
 */
export class NavigationView {
    constructor() {
        this.containers = document.querySelectorAll('.container');
        this.controls = document.querySelectorAll('.control');
    }

    setActiveSection(sectionId) {
        const curtain = document.getElementById('page-curtain');
        
        // Start curtain animation
        if (curtain) {
            curtain.classList.add('active');
            
            // After curtain covers the screen, change the page
            setTimeout(() => {
                // Remove active class from all sections
                this.containers.forEach(section => {
                    section.classList.remove('active');
                });

                // Add active class to target section
                const target = document.getElementById(sectionId);
                if (target) {
                    target.classList.add('active');
                }

                this.updateScrollLock(sectionId);
                
                // Close the curtain to reveal new page
                curtain.classList.remove('active');
                curtain.classList.add('closing');
                
                // Reset curtain after animation
                setTimeout(() => {
                    curtain.classList.remove('closing');
                }, 800);
            }, 400);
        } else {
            // Fallback if curtain not available
            this.containers.forEach(section => {
                section.classList.remove('active');
            });
            const target = document.getElementById(sectionId);
            if (target) {
                target.classList.add('active');
            }
            this.updateScrollLock(sectionId);
        }
    }

    setActiveControl(button) {
        // Remove active class from all controls
        this.controls.forEach(control => {
            control.classList.remove('active-btn');
        });

        // Add active class to clicked button
        button.classList.add('active-btn');
    }

    updateScrollLock(sectionId) {
        const homeIsActive = sectionId === 'home';
        document.documentElement.classList.toggle('scroll-locked', homeIsActive);
        document.body.classList.toggle('scroll-locked', homeIsActive);
    }

    resetScrollPositions() {
        // Reset all section scroll positions
        this.containers.forEach(section => {
            section.scrollTop = 0;
        });
        
        // Also ensure window/body scroll is reset when switching sections
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }

    closeExpandedPortfolioItems() {
        document.querySelectorAll('.portfolio-item.expanded').forEach(item => {
            item.classList.remove('expanded');
        });
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


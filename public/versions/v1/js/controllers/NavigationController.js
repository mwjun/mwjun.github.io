/**
 * NavigationController - Coordinates navigation functionality
 * Single Responsibility: Handle navigation events and coordinate model-view interactions
 */
export class NavigationController {
    constructor(navigationModel, navigationView, audioController) {
        this.model = navigationModel;
        this.view = navigationView;
        this.audioController = audioController;
        this.init();
    }

    init() {
        this.initializeControls();
        this.initializePortfolioItems();
    }

    initializeControls() {
        const controls = document.querySelectorAll('.control');
        controls.forEach(button => {
            button.addEventListener('click', () => this.handleNavigation(button));
        });
    }

    handleNavigation(button) {
        const targetId = button.dataset.id;
        
        // Check if already on this section
        if (this.model.isActiveSection(targetId)) return;

        // Close expanded portfolio items
        this.view.closeExpandedPortfolioItems();

        // Play nav sound
        this.audioController.playNavSound();

        // Update UI
        this.view.setActiveControl(button);
        this.view.setActiveSection(targetId);

        // Update model
        this.model.setCurrentSection(targetId);

        // Reset scroll and fade audio
        this.view.resetScrollPositions();
        this.audioController.fadeVolumeToSection(targetId);
    }

    initializePortfolioItems() {
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        
        // Video speed control
        portfolioItems.forEach(item => {
            const video = item.querySelector('.hover-video');
            if (video) {
                video.playbackRate = 0.0;
                item.addEventListener('mouseenter', () => (video.playbackRate = 1));
                item.addEventListener('mouseleave', () => (video.playbackRate = 0.0));
            }
        });

        // Expandable portfolio items
        portfolioItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.icon')) return; // Ignore inner buttons

                // Remove expanded from others
                portfolioItems.forEach(el => {
                    if (el !== item) el.classList.remove('expanded');
                });

                const isExpanding = !item.classList.contains('expanded');
                item.classList.toggle('expanded');

                // Play sound on expand
                if (isExpanding) {
                    this.audioController.playExpandSound();
                    
                    // Smooth scroll into view
                    setTimeout(() => {
                        item.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 300);
                }
            });
        });
    }
}


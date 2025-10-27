/**
 * ThemeController - Coordinates theme functionality
 * Single Responsibility: Handle theme events and coordinate model-view interactions
 */
export class ThemeController {
    constructor(themeModel, themeView, audioController) {
        this.model = themeModel;
        this.view = themeView;
        this.audioController = audioController;
        this.init();
    }

    init() {
        const themeBtn = document.querySelector('.theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.handleThemeToggle());
        }
    }

    handleThemeToggle() {
        const isLight = this.model.toggleTheme();
        this.view.toggleTheme(isLight);
        
        // Play theme sound via audio controller
        this.audioController.playThemeSound();
    }
}


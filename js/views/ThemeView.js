/**
 * ThemeView - Handles DOM updates for theme changes
 * Single Responsibility: Manipulate the DOM for theme-related UI
 */
export class ThemeView {
    constructor() {
        this.body = document.body;
        this.lightningName = document.getElementById('lightning-name');
    }

    applyLightTheme() {
        this.body.classList.add('light-mode');
        if (this.lightningName) {
            this.lightningName.classList.add('flash-black');
            setTimeout(() => {
                this.lightningName.classList.remove('flash-black');
            }, 2100);
        }
    }

    applyDarkTheme() {
        this.body.classList.remove('light-mode');
        if (this.lightningName) {
            this.lightningName.classList.add('flash-white');
            setTimeout(() => {
                this.lightningName.classList.remove('flash-white');
            }, 2100);
        }
    }

    toggleTheme(isLight) {
        if (isLight) {
            this.applyLightTheme();
        } else {
            this.applyDarkTheme();
        }
    }

    getCurrentTheme() {
        return this.body.classList.contains('light-mode');
    }
}


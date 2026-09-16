/**
 * ThemeModel - Manages theme state and business logic
 * Single Responsibility: Handle theme-related data and state
 */
export class ThemeModel {
    constructor() {
        this.isLightMode = false;
    }

    getTheme() {
        return this.isLightMode;
    }

    toggleTheme() {
        this.isLightMode = !this.isLightMode;
        return this.isLightMode;
    }

    setTheme(isLight) {
        this.isLightMode = isLight;
    }
}


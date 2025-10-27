/**
 * NavigationModel - Manages navigation state
 * Single Responsibility: Handle navigation-related data and state
 */
export class NavigationModel {
    constructor() {
        this.currentSection = 'home';
        this.sections = ['home', 'about', 'portfolio', 'contact'];
    }

    getCurrentSection() {
        return this.currentSection;
    }

    setCurrentSection(sectionId) {
        if (this.sections.includes(sectionId)) {
            this.currentSection = sectionId;
            return true;
        }
        return false;
    }

    isActiveSection(sectionId) {
        return this.currentSection === sectionId;
    }

    getAllSections() {
        return this.sections;
    }
}


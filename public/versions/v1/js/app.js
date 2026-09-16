/**
 * Main Application Entry Point
 * Implements MVC Architecture with Dependency Injection
 * 
 * Architecture Pattern: MVC (Model-View-Controller)
 * Design Principles:
 * - Single Responsibility: Each class has one reason to change
 * - Separation of Concerns: Business logic (Models), UI logic (Views), Coordination (Controllers)
 * - Dependency Injection: Controllers receive dependencies through constructor
 * - Loose Coupling: Modules depend on abstractions, not concrete implementations
 * - High Cohesion: Related functionality grouped together
 */

// Import Models
import { ThemeModel } from './models/ThemeModel.js';
import { AudioModel } from './models/AudioModel.js';
import { NavigationModel } from './models/NavigationModel.js';
import { FormModel } from './models/FormModel.js';

// Import Views
import { ThemeView } from './views/ThemeView.js';
import { AudioView } from './views/AudioView.js';
import { NavigationView } from './views/NavigationView.js';
import { FormView } from './views/FormView.js';

// Import Controllers
import { ThemeController } from './controllers/ThemeController.js';
import { AudioController } from './controllers/AudioController.js';
import { NavigationController } from './controllers/NavigationController.js';
import { FormController } from './controllers/FormController.js';
import { WelcomeController } from './controllers/WelcomeController.js';
import { TimelineController } from './controllers/TimelineController.js';

/**
 * Application Class - Coordinates all components
 * Initializes and wires together Models, Views, and Controllers
 */
class App {
    constructor() {
        this.models = {};
        this.views = {};
        this.controllers = {};
    }

    /**
     * Initialize the application
     * Sets up all components in the correct order
     */
    init() {
        console.log('🚀 Initializing Portfolio Application...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    /**
     * Initialize Models, Views, and Controllers
     * Following Dependency Injection pattern
     */
    initializeApp() {
        // Step 1: Initialize Models
        this.models.theme = new ThemeModel();
        this.models.audio = new AudioModel();
        this.models.navigation = new NavigationModel();
        this.models.form = new FormModel();

        console.log('✅ Models initialized');

        // Step 2: Initialize Views
        this.views.theme = new ThemeView();
        this.views.audio = new AudioView();
        this.views.navigation = new NavigationView();
        this.views.form = new FormView();

        console.log('✅ Views initialized');

        // Step 3: Initialize Controllers with Dependency Injection
        // AudioController needs to be initialized first (no dependencies on other controllers)
        this.controllers.audio = new AudioController(
            this.models.audio,
            this.views.audio
        );

        // Other controllers depend on audioController for sound effects
        this.controllers.theme = new ThemeController(
            this.models.theme,
            this.views.theme,
            this.controllers.audio
        );

        this.controllers.navigation = new NavigationController(
            this.models.navigation,
            this.views.navigation,
            this.controllers.audio
        );

        this.controllers.form = new FormController(
            this.models.form,
            this.views.form,
            this.controllers.audio
        );

        this.controllers.welcome = new WelcomeController(
            this.controllers.audio
        );

        this.controllers.timeline = new TimelineController(
            this.controllers.audio
        );

        console.log('✅ Controllers initialized');
        console.log('🎉 Application ready!');
    }
}

// Initialize the application
const app = new App();
app.init();

// Export for potential testing or debugging
export default App;


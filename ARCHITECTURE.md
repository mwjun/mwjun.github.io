# Portfolio Architecture Documentation

## Overview
This portfolio application demonstrates modern software engineering principles including **MVC architecture**, **loose coupling**, **high cohesion**, and **separation of concerns**.

## Architecture Pattern: Model-View-Controller (MVC)

```
┌─────────────────────────────────────────────────────────┐
│                      User Actions                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                     CONTROLLERS                          │
│  (Event Handlers & Coordination Logic)                  │
│                                                          │
│  • ThemeController        • AudioController             │
│  • NavigationController   • FormController              │
│  • WelcomeController      • TimelineController          │
└────────┬──────────────────────────────┬─────────────────┘
         │                              │
         │ Updates                      │ Delegates to
         ▼                              ▼
┌─────────────────────┐    ┌──────────────────────────────┐
│       VIEWS         │    │          MODELS               │
│  (DOM Manipulation) │    │  (Business Logic & Data)     │
│                     │    │                              │
│  • ThemeView        │    │  • ThemeModel                │
│  • AudioView        │    │  • AudioModel                │
│  • NavigationView   │    │  • NavigationModel           │
│  • FormView         │    │  • FormModel                 │
└─────────────────────┘    └──────────────────────────────┘
```

## Directory Structure

```
mwjun.github.io/
├── js/
│   ├── models/              # Business logic and data management
│   │   ├── ThemeModel.js
│   │   ├── AudioModel.js
│   │   ├── NavigationModel.js
│   │   └── FormModel.js
│   ├── views/               # DOM manipulation and UI updates
│   │   ├── ThemeView.js
│   │   ├── AudioView.js
│   │   ├── NavigationView.js
│   │   └── FormView.js
│   ├── controllers/         # Event handling and coordination
│   │   ├── ThemeController.js
│   │   ├── AudioController.js
│   │   ├── NavigationController.js
│   │   ├── FormController.js
│   │   ├── WelcomeController.js
│   │   └── TimelineController.js
│   └── app.js              # Main entry point with DI
├── index.html
├── styles.css
└── ARCHITECTURE.md         # This file
```

## Design Principles Applied

### 1. **Single Responsibility Principle (SRP)**
Each class has one reason to change:
- **Models**: Handle data and business logic only
- **Views**: Handle DOM manipulation only
- **Controllers**: Handle event coordination only

### 2. **Separation of Concerns**
- Business logic is isolated in Models
- UI rendering logic is isolated in Views
- Event handling logic is isolated in Controllers

### 3. **Dependency Injection (DI)**
Controllers receive their dependencies through constructor parameters:
```javascript
this.controllers.theme = new ThemeController(
    this.models.theme,        // Injected dependency
    this.views.theme,         // Injected dependency
    this.controllers.audio    // Injected dependency
);
```

### 4. **Loose Coupling**
- Modules don't depend on concrete implementations
- Controllers use Model interfaces (public methods)
- Views are decoupled from business logic
- Easy to swap or modify individual components

### 5. **High Cohesion**
- Related functionality grouped together:
  - All theme-related code in ThemeModel, ThemeView, ThemeController
  - All audio-related code in AudioModel, AudioView, AudioController
- Clear boundaries between different features

## Component Responsibilities

### Models (Data & Business Logic)
- Store and manage application state
- Enforce business rules and validation
- Have no knowledge of the DOM
- Can be tested independently

### Views (Presentation Logic)
- Update the DOM
- Format and display data
- Handle user interface elements
- Have no business logic
- Communicate with Controllers, not Models directly

### Controllers (Coordination Logic)
- Handle user events
- Coordinate between Models and Views
- Initialize components
- Don't contain business logic or DOM manipulation
- Act as intermediaries

## Data Flow

### Example: Theme Toggle Flow
```
1. User clicks theme toggle button
   ↓
2. ThemeController.handleThemeToggle() receives event
   ↓
3. Controller calls Model: themeModel.toggleTheme()
   ↓ (Model updates internal state)
4. Controller calls View: themeView.toggleTheme(isLight)
   ↓ (View updates DOM)
5. Controller calls AudioController.playThemeSound()
   ↓ (Audio feedback)
6. UI updated, user sees theme change
```

## Benefits of This Architecture

1. **Maintainability**: Easy to locate and fix bugs
2. **Testability**: Each component can be tested independently
3. **Scalability**: Easy to add new features without breaking existing code
4. **Readability**: Clear structure makes code self-documenting
5. **Reusability**: Components can be reused in different contexts
6. **Team Collaboration**: Different developers can work on different components

## Example: Adding a New Feature

To add a new "Dark Mode Toggle" feature:

1. **Create Model**: `js/models/DarkModeModel.js`
   ```javascript
   export class DarkModeModel {
       constructor() {
           this.isDark = false;
       }
       toggle() { /* ... */ }
   }
   ```

2. **Create View**: `js/views/DarkModeView.js`
   ```javascript
   export class DarkModeView {
       applyDarkMode() { /* DOM updates */ }
   }
   ```

3. **Create Controller**: `js/controllers/DarkModeController.js`
   ```javascript
   export class DarkModeController {
       constructor(model, view) {
           this.model = model;
           this.view = view;
           this.init();
       }
       init() { /* event listeners */ }
   }
   ```

4. **Wire in app.js**:
   ```javascript
   this.models.darkMode = new DarkModeModel();
   this.views.darkMode = new DarkModeView();
   this.controllers.darkMode = new DarkModeController(
       this.models.darkMode,
       this.views.darkMode
   );
   ```

## Technologies Used
- **ES6 Modules**: For modular code organization
- **Classes**: For object-oriented design
- **Event Delegation**: For efficient event handling
- **Dependency Injection**: For loose coupling

## Running the Application
```bash
# Start local server
python3 -m http.server 8000

# Access in browser
http://localhost:8000
```

## Code Quality
- ✅ No global variables (except app instance)
- ✅ Proper encapsulation with classes
- ✅ Clear module boundaries
- ✅ Consistent naming conventions
- ✅ Comprehensive JSDoc comments
- ✅ Follows modern JavaScript best practices

---

**Note**: This architecture demonstrates enterprise-level code organization suitable for demonstrating to potential employers and scaling to larger applications.


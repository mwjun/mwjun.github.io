/**
 * FormController - Coordinates form functionality
 * Single Responsibility: Handle form events and coordinate model-view interactions
 */
export class FormController {
    constructor(formModel, formView, audioController) {
        this.model = formModel;
        this.view = formView;
        this.audioController = audioController;
        this.init();
    }

    init() {
        if (this.view.form) {
            this.view.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        this.view.hideMessages();

        const formData = this.view.getFormData();
        if (!formData) return;

        // Validate data
        const validation = this.model.validateFormData(
            formData.name,
            formData.email,
            formData.subject,
            formData.message
        );

        if (!validation.isValid) {
            console.error('Validation errors:', validation.errors);
            this.view.showError();
            return;
        }

        // Play sound
        this.audioController.playExpandSound(); // Reusing expand sound for form submit

        try {
            const result = await this.model.submitForm(formData);
            
            if (result.success) {
                this.view.showSuccess();
                this.view.resetForm();
            } else {
                this.view.showError();
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.view.showError();
        }
    }
}


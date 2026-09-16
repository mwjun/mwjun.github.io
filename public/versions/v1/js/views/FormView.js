/**
 * FormView - Handles DOM updates for form
 * Single Responsibility: Manipulate the DOM for form-related UI
 */
export class FormView {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.successMessage = document.getElementById('formSuccess');
        this.errorMessage = document.getElementById('formError');
    }

    showSuccess() {
        if (this.successMessage) {
            this.successMessage.style.display = 'block';
            this.errorMessage.style.display = 'none';
        }
    }

    showError() {
        if (this.errorMessage) {
            this.errorMessage.style.display = 'block';
            this.successMessage.style.display = 'none';
        }
    }

    hideMessages() {
        if (this.successMessage) this.successMessage.style.display = 'none';
        if (this.errorMessage) this.errorMessage.style.display = 'none';
    }

    resetForm() {
        if (this.form) {
            this.form.reset();
        }
    }

    getFormData() {
        if (!this.form) return null;

        return {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            subject: document.getElementById('contactSubject').value,
            message: document.getElementById('contactMessage').value
        };
    }
}


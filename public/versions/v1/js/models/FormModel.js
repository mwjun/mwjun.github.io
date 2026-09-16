/**
 * FormModel - Manages form data and submission logic
 * Single Responsibility: Handle form-related data and business logic
 */
export class FormModel {
    constructor() {
        this.endpoint = 'https://formspree.io/f/mldjdlop';
    }

    async submitForm(formData) {
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            return {
                success: response.ok,
                data: response.ok ? await response.json() : null,
                error: response.ok ? null : 'Form submission failed'
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error: error.message
            };
        }
    }

    validateFormData(name, email, subject, message) {
        const errors = [];

        if (!name || name.trim().length === 0) {
            errors.push('Name is required');
        }

        if (!email || !this.isValidEmail(email)) {
            errors.push('Valid email is required');
        }

        if (!subject || subject.trim().length === 0) {
            errors.push('Subject is required');
        }

        if (!message || message.trim().length === 0) {
            errors.push('Message is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}


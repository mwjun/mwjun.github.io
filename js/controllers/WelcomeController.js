/**
 * WelcomeController - Handles welcome screen functionality
 * Single Responsibility: Handle welcome screen events
 */
export class WelcomeController {
    constructor(audioController) {
        this.audioController = audioController;
        this.init();
    }

    init() {
        const welcomeScreen = document.getElementById('welcome-screen');
        const enterBtn = document.getElementById('enter-btn');
        const welcomeText = document.querySelector('.welcome-text');
        const cvDownloadLink = document.getElementById('cvDownloadLink');

        // Handle CV download with proper filename using fetch + blob
        if (cvDownloadLink) {
            cvDownloadLink.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const response = await fetch('img/Matt_Jun_Resume.pdf');
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'Matt_Jun_Resume.pdf';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Download failed:', error);
                    // Fallback to direct link
                    window.location.href = 'img/Matt_Jun_Resume.pdf';
                }
            });
        }

        if (enterBtn && welcomeScreen) {
            enterBtn.addEventListener('click', () => {
                // Play enter sound
                this.audioController.playExpandSound();

                // Fade out welcome text and button
                if (welcomeText) {
                    welcomeText.classList.add('fade-out');
                }
                enterBtn.classList.add('fade-out');

                setTimeout(() => {
                    enterBtn.style.display = 'none';
                }, 3000);

                // Start letterbox animation
                document.querySelectorAll('[class^="letterbox"]').forEach(el => {
                    el.style.animationPlayState = 'running';
                });

                enterBtn.disabled = true;

                // Hide welcome screen after animation
                setTimeout(() => {
                    welcomeScreen.style.display = 'none';
                }, 9300);
            });
        }
    }
}


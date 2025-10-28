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
        const venetianCurtain = document.getElementById('venetian-curtain');
        
        // Create 50 curtain pieces for venetian animation
        // PERFORMANCE: Use DocumentFragment to batch DOM operations (reduces reflows)
        if (venetianCurtain) {
            const fragment = document.createDocumentFragment();
            
            for (let i = 0; i < 50; i++) {
                const piece = document.createElement('div');
                piece.className = 'curtain-piece';
                piece.style.top = `${i * 2}%`;
                fragment.appendChild(piece);
            }
            
            // Single DOM insertion instead of 50 separate operations
            venetianCurtain.appendChild(fragment);
        }

        /**
         * CV Download Handler
         * BEST PRACTICE: Uses fetch + blob for reliable file downloads
         * MEMORY MANAGEMENT: Always revokes object URLs to prevent memory leaks
         * ERROR HANDLING: Graceful fallback to direct link if blob fails
         */
        if (cvDownloadLink) {
            cvDownloadLink.addEventListener('click', async (e) => {
                e.preventDefault();
                
                try {
                    const response = await fetch('img/Matt_Jun_Resume.pdf');
                    if (!response.ok) throw new Error('Network response was not ok');
                    
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    
                    link.href = url;
                    link.download = 'Matt_Jun_Resume.pdf';
                    link.style.display = 'none';
                    
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // CRITICAL: Always revoke object URLs to prevent memory leaks
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

                enterBtn.disabled = true;

                // Fade out welcome screen
                welcomeScreen.style.opacity = '0';
                welcomeScreen.style.transition = 'opacity 0.5s ease-out';
                
                setTimeout(() => {
                    welcomeScreen.style.display = 'none';
                    enterBtn.style.display = 'none';
                    
                    // Start venetian curtain animation
                    if (this.venetianCurtain) {
                        this.venetianCurtain.classList.add('open');
                    }
                }, 500);
            });
        }
        
        // Use venetianCurtain from outer scope
        this.venetianCurtain = venetianCurtain;
    }
}


/**
 * TimelineController - Handles timeline item interactions
 * Single Responsibility: Handle timeline item click events
 */
export class TimelineController {
    constructor(audioController) {
        this.audioController = audioController;
        this.timelineSound = document.getElementById('timeline-icon-sound');
        this.init();
    }

    init() {
        const timelineItems = document.querySelectorAll('.timeline-item');

        timelineItems.forEach(item => {
            const icon = item.querySelector('.tl-icon');
            const content = item.querySelector('p');

            if (icon && this.timelineSound) {
                icon.addEventListener('click', (e) => {
                    e.stopPropagation();

                    // Play sound via audio controller
                    this.audioController.playNavSound(); // Reusing nav sound for timeline

                    // Toggle active state
                    timelineItems.forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                });
            }

            if (content) {
                content.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.classList.remove('active');
                });
            }
        });

        // Collapse all if timeline background is clicked
        const timelineContainer = document.querySelector('.timeline');
        if (timelineContainer) {
            timelineContainer.addEventListener('click', () => {
                timelineItems.forEach(item => item.classList.remove('active'));
            });
        }
    }
}


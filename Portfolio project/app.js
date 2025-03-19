document.addEventListener("DOMContentLoaded", () => {
  // === 1) Nav & Theme Toggles ===
  [...document.querySelectorAll(".control")].forEach((button) => {
    button.addEventListener("click", function () {
      const activeBtn = document.querySelector(".active-btn");
      if (activeBtn) {
        activeBtn.classList.remove("active-btn");
      }
      this.classList.add("active-btn");

      const activeSection = document.querySelector(".active");
      if (activeSection) {
        activeSection.classList.remove("active");
      }
      const target = document.getElementById(button.dataset.id);
      if (target) {
        target.classList.add("active");
      }
    });
  });
  const themeBtn = document.querySelector(".theme-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      document.body.classList.toggle("light-mode");
    });
  }

  // === 2) Form Submission (Formspree) ===
  const FORM_ENDPOINT = "https://formspree.io/f/mldjdlop"; // Replace with your endpoint
  const contactForm = document.getElementById("contactForm");
  const formSuccess = document.getElementById("formSuccess");
  const formError = document.getElementById("formError");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      formSuccess.style.display = "none";
      formError.style.display = "none";
      const name = document.getElementById("contactName").value;
      const email = document.getElementById("contactEmail").value;
      const subject = document.getElementById("contactSubject").value;
      const message = document.getElementById("contactMessage").value;
      try {
        const response = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ name, email, subject, message }),
        });
        if (response.ok) {
          formSuccess.style.display = "block";
          contactForm.reset();
        } else {
          formError.style.display = "block";
        }
      } catch (error) {
        console.error(error);
        formError.style.display = "block";
      }
    });
  }

  // === 3) Advanced Timeline Toggle Interactivity ===
  // When a timeline icon is clicked, close all timeline items and open the clicked one.
  // When the content (p) is clicked, close that item.
  const timelineItems = document.querySelectorAll('.timeline-item');
  timelineItems.forEach(item => {
    const icon = item.querySelector('.tl-icon');
    const content = item.querySelector('p');

    if (icon) {
      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close all timeline items
        timelineItems.forEach(other => other.classList.remove('active'));
        // Open the clicked item
        item.classList.add('active');
      });
    }
    if (content) {
      content.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close this timeline item when content is clicked
        item.classList.remove('active');
      });
    }
  });
  // Optional: clicking anywhere in the timeline container closes any open item
  const timelineContainer = document.querySelector('.timeline');
  if (timelineContainer) {
    timelineContainer.addEventListener('click', () => {
      timelineItems.forEach(item => item.classList.remove('active'));
    });
  }

  // === 4) Portfolio Video Playback Rate Adjustment ===
  // Set the video playback rate to a slower speed by default, then normal on hover.
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  portfolioItems.forEach(item => {
    const video = item.querySelector('.hover-video');
    if (video) {
      // Set initial playback rate (0.5 means half speed; use 0.1 for 10% speed if preferred)
      video.playbackRate = 0.5;
      item.addEventListener('mouseenter', () => {
        video.playbackRate = 1;
      });
      item.addEventListener('mouseleave', () => {
        video.playbackRate = 0.5;
      });
    }
  });

  // === 5) Remove Welcome Screen After Animation ===
  const welcomeScreen = document.getElementById('welcome-screen');
  if (welcomeScreen) {
    setTimeout(() => {
      welcomeScreen.style.display = 'none';
    }, 9500); // Adjust delay to match your CSS animations
  }
});
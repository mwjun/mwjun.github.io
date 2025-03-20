document.addEventListener("DOMContentLoaded", () => {
  // === 1) Nav Controls ===
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

  // === 1.1) Theme Toggle (Light Mode Only) ===
  // When the theme button is clicked, toggle the light-mode class on the body.
  const themeBtn = document.querySelector(".theme-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      themeBtn.classList.toggle("active-btn");
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

  // === Advanced Timeline Toggle Interactivity ===
const timelineItems = document.querySelectorAll('.timeline-item');
timelineItems.forEach((item) => {
  const icon = item.querySelector('.tl-icon');
  const content = item.querySelector('p');

  // When the timeline icon is clicked:
  if (icon) {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close all timeline items
      timelineItems.forEach((other) => other.classList.remove('active'));
      // Open (activate) the clicked timeline item
      item.classList.add('active');
    });
  }

  // When the content (<p>) is clicked, close that timeline item:
  if (content) {
    content.addEventListener('click', (e) => {
      e.stopPropagation();
      item.classList.remove('active');
    });
  }
});

// Optional: Clicking anywhere in the timeline container closes all active items.
const timelineContainer = document.querySelector('.timeline');
if (timelineContainer) {
  timelineContainer.addEventListener('click', () => {
    timelineItems.forEach((item) => item.classList.remove('active'));
  });
}

  // === 4) Portfolio Video Playback Rate Adjustment ===
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  portfolioItems.forEach((item) => {
    const video = item.querySelector('.hover-video');
    if (video) {
      // Set initial playback rate (currently 0.5; change to 0.1 for 10% speed if desired)
      video.playbackRate = 0.0;
      item.addEventListener('mouseenter', () => {
        video.playbackRate = 1;
      });
      item.addEventListener('mouseleave', () => {
        video.playbackRate = 0.0;
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
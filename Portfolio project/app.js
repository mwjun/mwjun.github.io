document.addEventListener("DOMContentLoaded", () => {
  // === AUDIO ELEMENTS ===
  const bgMusic = document.getElementById("bg-music");
  const navSound = document.getElementById("nav-sound");
  const themeSound = document.getElementById("theme-sound");
  const enterSound = document.getElementById("enter-sound");
  // === 1) Nav Controls ===
  [...document.querySelectorAll(".control")].forEach((button) => {
    button.addEventListener("click", function () {
      if (navSound) {
        navSound.pause();
        navSound.currentTime = 0;
        navSound.play();
      }

      document.querySelector(".active-btn")?.classList.remove("active-btn");
      this.classList.add("active-btn");

      document.querySelector(".active")?.classList.remove("active");
      const target = document.getElementById(button.dataset.id);
      target?.classList.add("active");
    });
  });

  // === 2) Theme Toggle ===
  const themeBtn = document.querySelector(".theme-btn");
  const spanText = document.querySelector(".right-header .name span");

  if (themeBtn && spanText) {
    themeBtn.addEventListener("click", () => {
      const isLightMode = document.body.classList.contains("light-mode");

      spanText.classList.add(isLightMode ? "flash-black" : "flash-white");
      document.body.classList.toggle("light-mode");

      setTimeout(() => {
        spanText.classList.remove("flash-black", "flash-white");
      }, 100);

      if (themeSound) {
        themeSound.currentTime = 0;
        themeSound.play();
      }
    });
  }

  // === 3) Music Toggle + Volume Panel ===
  const musicBtn = document.getElementById("music-toggle");
  const volumePanel = document.getElementById("volume-panel");
  const volumeSlider = document.getElementById("volume-range");
  const muteBtn = document.getElementById("mute-toggle");

  if (bgMusic) {
    // Set initial volume
    bgMusic.volume = parseFloat(volumeSlider.value);

    // Live update volume
    volumeSlider.addEventListener("input", (e) => {
      bgMusic.volume = parseFloat(e.target.value);
    });

    // Mute/unmute logic
    muteBtn.addEventListener("click", () => {
      bgMusic.muted = !bgMusic.muted;
      muteBtn.innerHTML = bgMusic.muted
        ? '<i class="fas fa-volume-up"></i>'
        : '<i class="fas fa-volume-mute"></i>';
    });
  }

  // Toggle volume panel
  if (musicBtn && volumePanel) {
    musicBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent closing from document click
      volumePanel.classList.toggle("open");
    });

    // Close panel when clicking outside
    document.addEventListener("click", (e) => {
      if (!volumePanel.contains(e.target) && !musicBtn.contains(e.target)) {
        volumePanel.classList.remove("open");
      }
    });
  }

  // === 4) Form Submission (Formspree) ===
  const FORM_ENDPOINT = "https://formspree.io/f/mldjdlop";
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

  // === 5) Timeline Toggle ===
  const timelineItems = document.querySelectorAll(".timeline-item");
  timelineItems.forEach((item) => {
    const icon = item.querySelector(".tl-icon");
    const content = item.querySelector("p");

    icon?.addEventListener("click", (e) => {
      e.stopPropagation();
      timelineItems.forEach((el) => el.classList.remove("active"));
      item.classList.add("active");
    });

    content?.addEventListener("click", (e) => {
      e.stopPropagation();
      item.classList.remove("active");
    });
  });

  const timelineContainer = document.querySelector(".timeline");
  timelineContainer?.addEventListener("click", () => {
    timelineItems.forEach((item) => item.classList.remove("active"));
  });

  // === 6) Portfolio Hover Video Speed ===
  const portfolioItems = document.querySelectorAll(".portfolio-item");
  portfolioItems.forEach((item) => {
    const video = item.querySelector(".hover-video");
    if (video) {
      video.playbackRate = 0.0;
      item.addEventListener("mouseenter", () => (video.playbackRate = 1));
      item.addEventListener("mouseleave", () => (video.playbackRate = 0.0));
    }
  });

// === 7) Welcome Screen "Enter" Button to Start Animation and Music ===
const welcomeScreen = document.getElementById("welcome-screen");
const enterBtn = document.getElementById("enter-btn");
const welcomeText = document.querySelector(".welcome-text");

if (enterBtn && welcomeScreen) {
  enterBtn.addEventListener("click", () => {
    // Fade out the welcome text
    if (welcomeText) {
      welcomeText.classList.add("fade-out");
    }
  
    // Fade out the button itself
    enterBtn.classList.add("fade-out");
  
    // Optional: hide button after fade is done
    setTimeout(() => {
      enterBtn.style.display = "none";
    }, 3000);
  
    // Start background music
    if (bgMusic && bgMusic.paused) {
      bgMusic.play().catch(() => {
        console.warn("Autoplay blocked");
      });
    }
  
    // Start letterbox animations
    document.querySelectorAll("[class^='letterbox']").forEach((el) => {
      el.style.animationPlayState = "running";
    });
  
    enterBtn.disabled = true;
  
    setTimeout(() => {
      welcomeScreen.style.display = "none";
    }, 9300);
  });
}
});
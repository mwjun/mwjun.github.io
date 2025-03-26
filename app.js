document.addEventListener("DOMContentLoaded", () => {
  const bgMusic = document.getElementById("bg-music");
  const navSound = document.getElementById("nav-sound");
  const themeSound = document.getElementById("theme-sound");
  const enterSound = document.getElementById("theme-sound");
  const cvSound = document.getElementById("cv-hover-sound");
  const cvClickSound = document.getElementById("cv-click-sound");

  const lightningName = document.getElementById("lightning-name");
  const lightningSound = document.getElementById("electric-hover-sound");
  const themeBtn = document.querySelector(".theme-btn");
  const musicBtn = document.getElementById("music-toggle");
  const volumePanel = document.getElementById("volume-panel");
  const volumeSlider = document.getElementById("volume-range");
  const muteBtn = document.getElementById("mute-toggle");

  const welcomeScreen = document.getElementById("welcome-screen");
  const enterBtn = document.getElementById("enter-btn");
  const welcomeText = document.querySelector(".welcome-text");
  const rightHeader = document.querySelector(".right-header");

  const timelineItems = document.querySelectorAll(".timeline-item");
  const timelineSound = document.getElementById("timeline-icon-sound");
  const portfolioItems = document.querySelectorAll(".portfolio-item");

  // Navigation controls
  document.querySelectorAll(".control").forEach((btn) => {
    btn.addEventListener("click", () => {
      navSound?.play();
      document.querySelector(".active-btn")?.classList.remove("active-btn");
      btn.classList.add("active-btn");

      document.querySelector(".active")?.classList.remove("active");
      document.getElementById(btn.dataset.id)?.classList.add("active");

      // Fade background music
      if (bgMusic) {
        const targetVol = btn.dataset.id === "home" ? 0.1 : 0.05;
        const steps = 30;
        const step = (targetVol - bgMusic.volume) / steps;
        let currentStep = 0;
        const interval = setInterval(() => {
          currentStep++;
          bgMusic.volume = Math.min(1, Math.max(0, bgMusic.volume + step));
          if (currentStep >= steps) clearInterval(interval);
        }, 1500 / steps);
      }
    });
  });

  // Theme Toggle
  themeBtn?.addEventListener("click", () => {
    const isLight = document.body.classList.contains("light-mode");
    lightningName?.classList.add(isLight ? "flash-black" : "flash-white");
    document.body.classList.toggle("light-mode");
    setTimeout(() => lightningName?.classList.remove("flash-black", "flash-white"), 2100);
    themeSound?.play();
  });

  // Music toggle + volume slider
  if (bgMusic && volumeSlider) {
    bgMusic.volume = 0.15;
    volumeSlider.value = 0.15;

    volumeSlider.addEventListener("input", e => {
      bgMusic.volume = parseFloat(e.target.value);
    });

    muteBtn?.addEventListener("click", () => {
      bgMusic.muted = !bgMusic.muted;
      muteBtn.innerHTML = bgMusic.muted
        ? '<i class="fas fa-volume-up"></i>'
        : '<i class="fas fa-volume-mute"></i>';
    });
  }

  musicBtn?.addEventListener("click", e => {
    e.stopPropagation();
    volumePanel?.classList.toggle("open");
  });

  document.addEventListener("click", e => {
    if (!volumePanel?.contains(e.target) && !musicBtn?.contains(e.target)) {
      volumePanel?.classList.remove("open");
    }
  });

  // Timeline interaction
  timelineItems.forEach(item => {
    const icon = item.querySelector(".tl-icon");
    const content = item.querySelector("p");

    icon?.addEventListener("click", e => {
      e.stopPropagation();
      timelineSound?.play();
      timelineItems.forEach(el => el.classList.remove("active"));
      item.classList.add("active");
    });

    content?.addEventListener("click", e => {
      e.stopPropagation();
      item.classList.remove("active");
    });
  });

  document.querySelector(".timeline")?.addEventListener("click", () => {
    timelineItems.forEach(item => item.classList.remove("active"));
  });

  // Portfolio expand/collapse
  portfolioItems.forEach(item => {
    const video = item.querySelector(".hover-video");
    item.addEventListener("click", e => {
      if (e.target.closest(".icon")) return;
      portfolioItems.forEach(el => {
        if (el !== item) el.classList.remove("expanded");
      });
      item.classList.toggle("expanded");
    });

    if (video) {
      video.playbackRate = 0.0;
      item.addEventListener("mouseenter", () => (video.playbackRate = 1));
      item.addEventListener("mouseleave", () => (video.playbackRate = 0.0));
    }
  });

 // === WELCOME SCREEN ===
if (enterBtn && welcomeScreen) {
  enterBtn.addEventListener("click", () => {
    enterSound?.play();

    welcomeText?.classList.add("fade-out");
    enterBtn.classList.add("fade-out");
    enterBtn.disabled = true;

    // Hide Enter button after 3 seconds
    setTimeout(() => {
      enterBtn.style.display = "none";
    }, 3000);

    // Start background music
    if (bgMusic?.paused) {
      bgMusic.play().catch(() => console.warn("Autoplay blocked"));
    }

    // Trigger letterbox animation
    document.querySelectorAll("[class^='letterbox']").forEach((el) => {
      el.style.animationPlayState = "running";
    });

    // After full welcome animation (9.3s), remove screen and fade in header
    setTimeout(() => {
      welcomeScreen.style.display = "none";

      const rightHeader = document.getElementById("animated-header");
      if (rightHeader && !sessionStorage.getItem("hasAnimatedHeader")) {
        requestAnimationFrame(() => {
          rightHeader.classList.add("fade-in-once");
          sessionStorage.setItem("hasAnimatedHeader", "true");
        });
      }
    }, 9300);
  });
}
  // About hover sound
  const aboutHoverSound = document.getElementById("about-hover-sound");
  document.querySelectorAll(".about-item").forEach(item => {
    item.addEventListener("mouseenter", () => {
      if (aboutHoverSound) {
        aboutHoverSound.currentTime = 0;
        aboutHoverSound.volume = 0.25;
        aboutHoverSound.play();
      }
    });
  });

  // Download and Send buttons
  const cvButton = document.querySelector(".about .btn-con .main-btn");
  const sendBtn = document.querySelector("#contactForm .main-btn");
  [cvButton, sendBtn].forEach(btn => {
    if (btn && cvSound && cvClickSound) {
      btn.addEventListener("mouseenter", () => {
        cvSound.currentTime = 0;
        cvSound.play();
        btn.classList.add("flash-animate");
        setTimeout(() => btn.classList.remove("flash-animate"), 800);
      });
      btn.addEventListener("click", () => {
        cvClickSound.currentTime = 0;
        cvClickSound.play();
      });
    }
  });

  // Lightning hover sound
  lightningName?.addEventListener("mouseenter", () => {
    if (lightningSound) {
      lightningSound.currentTime = 0;
      lightningSound.play();
    }
  });
});
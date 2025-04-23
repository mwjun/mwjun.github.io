document.addEventListener("DOMContentLoaded", () => {
  // === AUDIO ELEMENTS ===
  const bgMusic = document.getElementById("bg-music");
  const navSound = document.getElementById("nav-sound");
  const themeSound = document.getElementById("theme-sound");
  const enterSound = document.getElementById("theme-sound");
  const cvSound = document.getElementById("cv-hover-sound");
  const cvClickSound = document.getElementById("cv-click-sound");

  // === 1) Nav Controls ===
  [...document.querySelectorAll(".control")].forEach((button) => {
    button.addEventListener("click", function () {
       // ------------------------------------------------------------------
  // 1. Short‑circuit if the section this button points to is ALREADY active
  // ------------------------------------------------------------------
  const target        = document.getElementById(button.dataset.id);
  const targetIsActive = target && target.classList.contains("active");
  if (targetIsActive) return;                     // ⬅ nothing to do

  // ------------------------------------------------------------------
  // 2. Play nav click sound (unchanged)
  // ------------------------------------------------------------------
  if (navSound) {
    navSound.pause();
    navSound.currentTime = 0;
    navSound.play();
  }

  // ------------------------------------------------------------------
  // 3. Switch the active button
  // ------------------------------------------------------------------
  document.querySelector(".active-btn")?.classList.remove("active-btn");
  this.classList.add("active-btn");

  // ------------------------------------------------------------------
  // 4. Deactivate **every** open section, then activate the new one
  // ------------------------------------------------------------------
  document
    .querySelectorAll(".container.active")        // header + all sections
    .forEach(sec => sec.classList.remove("active"));

  target?.classList.add("active");

  // ------------------------------------------------------------------
  // 5. Reset scroll & fade background‑music volume (your original logic)
  // ------------------------------------------------------------------
  document.querySelectorAll(".container")
          .forEach(sec => (sec.scrollTop = 0));

  if (bgMusic) {
    const fadeTo   = button.dataset.id === "home" ? 0.10 : 0.05;
    const steps    = 30;
    const fadeTime = 1500;
    const stepTime = fadeTime / steps;
    const startVol = bgMusic.volume;
    const stepAmt  = (fadeTo - startVol) / steps;
    let current    = 0;

    const fadeInterval = setInterval(() => {
      current++;
      bgMusic.volume = Math.max(0, Math.min(1, bgMusic.volume + stepAmt));
      if (current >= steps) clearInterval(fadeInterval);
    }, stepTime);
      }
    });
  });

  // === 2) Theme Toggle ===
  const themeBtn = document.querySelector(".theme-btn");
  const spanText = document.getElementById("lightning-name");

  if (themeBtn && spanText) {
    themeBtn.addEventListener("click", () => {
      const isLightMode = document.body.classList.contains("light-mode");

      spanText.classList.add(isLightMode ? "flash-black" : "flash-white");
      document.body.classList.toggle("light-mode");

      setTimeout(() => {
        spanText.classList.remove("flash-black", "flash-white");
      }, 2100); // slightly more than the 2s animation

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
  const lightningName = document.getElementById("lightning-name");
  const lightningSound = document.getElementById("electric-hover-sound");

if (lightningName && lightningSound) {
  lightningName.addEventListener("mouseenter", () => {
    lightningSound.currentTime = 0;
    lightningSound.play();
  });
}
  if (bgMusic && volumeSlider) {
    bgMusic.volume = 0.15;
    volumeSlider.value = 0.15;

    volumeSlider.addEventListener("input", (e) => {
      bgMusic.volume = parseFloat(e.target.value);
    });

    muteBtn.addEventListener("click", () => {
      bgMusic.muted = !bgMusic.muted;
      muteBtn.innerHTML = bgMusic.muted
        ? '<i class="fas fa-volume-up"></i>'
        : '<i class="fas fa-volume-mute"></i>';
    });
  }
  /* ---------- NEW: global SFX mute toggle ---------- */
const sfxToggle = document.getElementById("sfx-toggle");

// grab every <audio> except bg‑music
const sfxAudios = [...document.querySelectorAll("audio")]
                    .filter(a => a.id !== "bg-music");

let sfxMuted = false;

if (sfxToggle) {
  sfxToggle.addEventListener("click", () => {
    sfxMuted = !sfxMuted;
    sfxAudios.forEach(a => (a.muted = sfxMuted));

    sfxToggle.innerHTML = sfxMuted
      ? '<i class="fas fa-bell"></i>'          // un‑mute icon
      : '<i class="fas fa-bell-slash"></i>';   // mute icon
  });
}
/* ---------- end SFX toggle ---------- */
  if (musicBtn && volumePanel) {
    musicBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      volumePanel.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!volumePanel.contains(e.target) && !musicBtn.contains(e.target)) {
        volumePanel.classList.remove("open");
      }
    });
  }

  // === 4) Form Submission ===
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
 // === 5) Timeline Toggle ===
const timelineItems = document.querySelectorAll(".timeline-item");
const timelineSound = document.getElementById("timeline-icon-sound");

timelineItems.forEach((item) => {
  const icon = item.querySelector(".tl-icon");
  const content = item.querySelector("p");

  if (icon) {
    icon.addEventListener("click", (e) => {
      e.stopPropagation();

      // 🔊 Play sound on icon click
      if (timelineSound) {
        timelineSound.currentTime = 0;
        timelineSound.play();
      }

      timelineItems.forEach((el) => el.classList.remove("active"));
      item.classList.add("active");
    });
  }

  if (content) {
    content.addEventListener("click", (e) => {
      e.stopPropagation();
      item.classList.remove("active");
    });
  }
});

// Collapse all if timeline background is clicked
const timelineContainer = document.querySelector(".timeline");
timelineContainer?.addEventListener("click", () => {
  timelineItems.forEach((item) => item.classList.remove("active"));
});

  // === 6) Portfolio Video Speed ===
  const portfolioItems = document.querySelectorAll(".portfolio-item");
  portfolioItems.forEach((item) => {
    const video = item.querySelector(".hover-video");
    if (video) {
      video.playbackRate = 0.0;
      item.addEventListener("mouseenter", () => (video.playbackRate = 1));
      item.addEventListener("mouseleave", () => (video.playbackRate = 0.0));
    }
  });

  // === 7) Welcome Screen ===
  const welcomeScreen = document.getElementById("welcome-screen");
  const enterBtn = document.getElementById("enter-btn");
  const welcomeText = document.querySelector(".welcome-text");

  if (enterBtn && welcomeScreen) {
    enterBtn.addEventListener("click", () => {
      if (enterSound) {
        enterSound.pause();
        enterSound.currentTime = 0;
        enterSound.play();
      }

      if (welcomeText) {
        welcomeText.classList.add("fade-out");
      }

      enterBtn.classList.add("fade-out");

      setTimeout(() => {
        enterBtn.style.display = "none";
      }, 3000);

      if (bgMusic && volumeSlider) {
        bgMusic.volume = 0.15;
        volumeSlider.value = 0.15;
      }

      if (bgMusic && bgMusic.paused) {
        bgMusic.play().catch(() => console.warn("Autoplay blocked"));
      }

      document.querySelectorAll("[class^='letterbox']").forEach((el) => {
        el.style.animationPlayState = "running";
      });

      enterBtn.disabled = true;

      setTimeout(() => {
        welcomeScreen.style.display = "none";
      }, 9300);
    });
  }

  // === Hover Sound for About Items ===
  const aboutHoverSound = document.getElementById("about-hover-sound");
  const aboutItems = document.querySelectorAll(".about-item");

  if (aboutHoverSound && aboutItems.length) {
    aboutHoverSound.volume = 0.25;
    aboutItems.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        aboutHoverSound.currentTime = 0;
        aboutHoverSound.play();
      });
    });
  }

  // === Hover + Click Sound for Buttons ===
  const cvButton = document.querySelector(".about .btn-con .main-btn");
  const sendBtn = document.querySelector("#contactForm .main-btn");

  const buttonsWithSound = [cvButton, sendBtn];
  buttonsWithSound.forEach((btn) => {
    if (btn && cvSound && cvClickSound) {
      btn.addEventListener("mouseenter", () => {
        cvSound.currentTime = 0;
        cvSound.play();
      
        btn.classList.add("flash-animate");
        setTimeout(() => {
          btn.classList.remove("flash-animate");
        }, 800);
      });
      btn.addEventListener("click", () => {
        cvClickSound.currentTime = 0;
        cvClickSound.play();
      });
    }
  });
  const electricSound = document.getElementById('electric-hover-sound');
document.querySelector('.name').addEventListener('mouseenter', () => {
  electricSound.currentTime = 0;
  electricSound.play();
});

// === 8) Expandable Portfolio Items ===
portfolioItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    // Prevent clicks on inner buttons from triggering expand
    if (e.target.closest(".icon")) return;

    // Remove expanded from all others
    portfolioItems.forEach((el) => {
      if (el !== item) el.classList.remove("expanded");
    });

    // Toggle this one
    const isExpanding = !item.classList.contains("expanded");
    item.classList.toggle("expanded");

    // Smooth scroll to it if it's expanding
    if (isExpanding) {
      setTimeout(() => {
        item.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300); // slight delay for better effect
    }
  });
});
});

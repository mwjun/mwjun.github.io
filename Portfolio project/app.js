document.addEventListener("DOMContentLoaded", () => {
    // === 1) Nav & Theme Toggles ===
    (function () {
      [...document.querySelectorAll(".control")].forEach((button) => {
        button.addEventListener("click", function () {
          document.querySelector(".active-btn").classList.remove("active-btn");
          this.classList.add("active-btn");
          document.querySelector(".active").classList.remove("active");
          document.getElementById(button.dataset.id).classList.add("active");
        });
      });
  
      document.querySelector(".theme-btn").addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
      });
    })();
  
    // === 2) Form Submission (Formspree) ===
    const FORM_ENDPOINT = "https://formspree.io/f/mldjdlop"; // Replace with your real endpoint
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
            // success
            formSuccess.style.display = "block";
            contactForm.reset();
          } else {
            // fail
            formError.style.display = "block";
          }
        } catch (error) {
          console.error(error);
          formError.style.display = "block";
        }
      });
    }
  });
  
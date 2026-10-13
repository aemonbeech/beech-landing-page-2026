(function () {
  "use strict";

  // Sticky header shadow state
  var header = document.getElementById("siteHeader");
  function updateHeaderState() {
    if (window.scrollY > 8) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  // Mobile nav toggle
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");
  navToggle.addEventListener("click", function () {
    var isOpen = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  mainNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mainNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // FAQ accordion
  document.querySelectorAll(".accordion-trigger").forEach(function (trigger) {
    var panel = trigger.nextElementSibling;
    trigger.addEventListener("click", function () {
      var isOpen = trigger.getAttribute("aria-expanded") === "true";

      document.querySelectorAll(".accordion-trigger").forEach(function (other) {
        if (other !== trigger) {
          other.setAttribute("aria-expanded", "false");
          other.nextElementSibling.style.maxHeight = null;
        }
      });

      trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
      panel.style.maxHeight = isOpen ? null : panel.scrollHeight + "px";
    });
  });

  // Calendly popup: open the scheduler in a modal from any "Book a call"
  // button, falling back to the normal #book-a-call anchor scroll if the
  // Calendly script hasn't loaded yet
  var calendlyUrl = "https://calendly.com/beech-agency/chat-with-chelsea?hide_gdpr_banner=1&primary_color=406dff";
  document.querySelectorAll(".calendly-popup-trigger").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      if (window.Calendly) {
        e.preventDefault();
        window.Calendly.initPopupWidget({ url: calendlyUrl });
      }
    });
  });

  // Calendly: resize the widget to its actual content height so the
  // page scrolls as one continuous flow instead of an inner iframe scroll
  window.addEventListener("message", function (e) {
    if (e.data && e.data.event === "calendly.page_height") {
      var widget = document.querySelector(".calendly-inline-widget");
      if (widget) {
        widget.style.height = e.data.payload.height + "px";
      }
    }
  });

  // "What you get": while the stage is pinned, scroll progress picks the
  // active step. The steps track then slides in one motion so the active
  // step sits dead centre, and the scorecard's wedge emphasis follows.
  var scrollTrack = document.querySelector(".get-scroll-track");
  var stepsTrack = document.querySelector(".get-steps");
  var getSteps = document.querySelectorAll(".get-step");
  var radarCard = document.querySelector(".radar-card");
  var stageQuery = window.matchMedia("(min-width: 901px)");
  var currentStep = -1;

  function layoutSteps() {
    if (!scrollTrack || !stepsTrack || !getSteps.length) return;

    // Below the breakpoint the steps just stack in normal flow
    if (!stageQuery.matches) {
      stepsTrack.style.transform = "";
      getSteps.forEach(function (step) { step.classList.add("is-active"); });
      currentStep = -1;
      return;
    }

    var rect = scrollTrack.getBoundingClientRect();
    var travel = rect.height - window.innerHeight;
    var progress = travel > 0 ? -rect.top / travel : 0;
    progress = Math.max(0, Math.min(0.999999, progress));

    var index = Math.floor(progress * getSteps.length);
    index = Math.max(0, Math.min(getSteps.length - 1, index));
    if (index === currentStep) return;
    currentStep = index;

    var active = getSteps[index];
    getSteps.forEach(function (step) { step.classList.remove("is-active"); });
    active.classList.add("is-active");

    // Centre the active step: the track sits at top:50%, so shifting it up
    // by the step's own centre lines that step up with the stage's middle
    var offset = active.offsetTop + active.offsetHeight / 2;
    stepsTrack.style.transform = "translateY(" + -offset + "px)";

    if (radarCard) {
      radarCard.classList.remove("emphasize-0", "emphasize-1", "emphasize-2", "emphasize-3");
      if (index <= 3) radarCard.classList.add("emphasize-" + index);
    }
  }

  if (scrollTrack && stepsTrack && getSteps.length) {
    var stepsTicking = false;
    window.addEventListener("scroll", function () {
      if (stepsTicking) return;
      stepsTicking = true;
      window.requestAnimationFrame(function () {
        layoutSteps();
        stepsTicking = false;
      });
    }, { passive: true });

    window.addEventListener("resize", function () {
      currentStep = -1;
      layoutSteps();
    });

    layoutSteps();
  }

  // Scroll reveal
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }
})();

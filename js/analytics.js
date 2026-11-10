/*
  Analytics for the Website Effectiveness Audit page.

  Fill in the IDs below to switch tracking on. Until then this file
  does nothing beyond keeping UTM tags for the Calendly booking links.

  GTM_ID      Google Tag Manager container, looks like "GTM-XXXXXXX". Every event
              below is also pushed to the dataLayer as a GTM custom event.
  GA4_ID      Google Analytics 4 measurement ID, looks like "G-XXXXXXXXXX"
  CLARITY_ID  Microsoft Clarity project ID, looks like "abcd1234ef"

  Events sent (to GA4, Clarity and the GTM dataLayer):
    cta_click              any "Book a 20-minute call" button (location)
    booking_time_selected  someone picked a time in Calendly
    booking_complete       a call was actually booked  <- mark as key event in GA4
    section_view           each section the visitor reaches (section)
    scroll_depth           25 / 50 / 75 / 90 percent of the page (percent)
    faq_open               an FAQ question opened (question)
    question_open          one of the five audit question cards opened (question)
    client_preview         hover on a client link that shows the preview (client)
    outbound_click         click to a client site or social profile (url)
    contact_click          phone or email link clicked (method)

  Outreach tracking: add UTM tags to links you send, e.g.
    ?utm_source=linkedin&utm_medium=outreach&utm_campaign=audit-nov&utm_content=org-name
  The tags are kept for the visit, passed into Calendly so bookings show
  where they came from, and set as Clarity tags so you can filter
  recordings by prospect (utm_content).
*/
(function () {
  "use strict";

  var GTM_ID = "GTM-T2TL5SSK"; // Google Tag Manager container (for ad pixels etc. Do NOT add a GA4 tag in GTM, or visits count twice)
  var GA4_ID = "G-GQ521GDPV4";
  var CLARITY_ID = "";  // e.g. "abcd1234ef"

  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  // ---- Load the tools (only when IDs are set) ----------------------------
  window.dataLayer = window.dataLayer || [];
  if (GTM_ID) {
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var gtm = document.createElement("script");
    gtm.async = true;
    gtm.src = "https://www.googletagmanager.com/gtm.js?id=" + GTM_ID;
    document.head.appendChild(gtm);
  }
  if (GA4_ID) {
    var ga = document.createElement("script");
    ga.async = true;
    ga.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
    document.head.appendChild(ga);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA4_ID);
  }
  if (CLARITY_ID) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  function track(name, params) {
    params = params || {};
    if (window.gtag && GA4_ID) window.gtag("event", name, params);
    if (GTM_ID) {
      var push = { event: name };
      Object.keys(params).forEach(function (k) { push[k] = params[k]; });
      window.dataLayer.push(push);
    }
    if (window.clarity && CLARITY_ID) {
      window.clarity("event", name);
      if (name === "booking_complete") window.clarity("set", "booked", "yes");
    }
  }
  window.beechTrack = track;

  // ---- UTM capture -------------------------------------------------------
  var utm = {};
  try { utm = JSON.parse(sessionStorage.getItem("beech_utm") || "{}"); } catch (e) {}
  var qs = new URLSearchParams(window.location.search);
  var fresh = false;
  UTM_KEYS.forEach(function (k) {
    if (qs.get(k)) { if (!fresh) { utm = {}; fresh = true; } utm[k] = qs.get(k); }
  });
  if (fresh) { try { sessionStorage.setItem("beech_utm", JSON.stringify(utm)); } catch (e) {} }
  if (window.clarity && CLARITY_ID) {
    Object.keys(utm).forEach(function (k) { window.clarity("set", k, utm[k]); });
  }

  // Append stored UTM tags to a Calendly URL so bookings carry their source
  window.beechCalendlyUrl = function (url) {
    var keys = Object.keys(utm);
    if (!keys.length) return url;
    var extra = keys.map(function (k) { return k + "=" + encodeURIComponent(utm[k]); }).join("&");
    return url + (url.indexOf("?") === -1 ? "?" : "&") + extra;
  };
  // The inline widget reads data-url when Calendly's script runs, which is
  // after this file, so updating it here is enough
  var inline = document.querySelector(".calendly-inline-widget");
  if (inline) inline.setAttribute("data-url", window.beechCalendlyUrl(inline.getAttribute("data-url")));

  // ---- Event wiring ------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    // CTA buttons
    document.querySelectorAll(".calendly-popup-trigger").forEach(function (btn) {
      var section = btn.closest("[data-track-section]");
      var where = btn.closest(".site-header") ? "header" : (section ? section.getAttribute("data-track-section") : "other");
      btn.addEventListener("click", function () { track("cta_click", { location: where }); });
    });

    // FAQ opens (only when opening, not closing)
    document.querySelectorAll(".accordion-trigger").forEach(function (t) {
      t.addEventListener("click", function () {
        // script.js toggles aria-expanded on the same click; read it after
        setTimeout(function () {
          if (t.getAttribute("aria-expanded") === "true") {
            track("faq_open", { question: t.textContent.trim().slice(0, 100) });
          }
        }, 0);
      });
    });

    // Client link previews and outbound / contact links
    var previewed = {};
    document.querySelectorAll("a[data-preview]").forEach(function (a) {
      a.addEventListener("mouseenter", function () {
        var name = a.textContent.trim();
        if (!previewed[name]) { previewed[name] = true; track("client_preview", { client: name }); }
      });
    });
    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href.indexOf("tel:") === 0) {
        a.addEventListener("click", function () { track("contact_click", { method: "phone" }); });
      } else if (href.indexOf("mailto:") === 0) {
        a.addEventListener("click", function () { track("contact_click", { method: "email" }); });
      } else if (/^https?:\/\//.test(href) && href.indexOf(location.hostname) === -1) {
        a.addEventListener("click", function () { track("outbound_click", { url: href }); });
      }
    });

    // Sections reached (once each)
    if ("IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            track("section_view", { section: entry.target.getAttribute("data-track-section") });
            seen.unobserve(entry.target);
          }
        });
      }, { rootMargin: "-45% 0px -45% 0px" }); // counts once a section crosses the middle of the screen, works for very tall sections too
      document.querySelectorAll("[data-track-section]").forEach(function (s) { seen.observe(s); });
    }

    // Scroll depth
    var marks = [25, 50, 75, 90], hit = {};
    function depth() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      var pct = (window.scrollY / max) * 100;
      marks.forEach(function (m) {
        if (pct >= m && !hit[m]) { hit[m] = true; track("scroll_depth", { percent: m }); }
      });
    }
    window.addEventListener("scroll", depth, { passive: true });
  });

  // Calendly events (inline widget and popup both post these)
  var calendlyMap = {
    "calendly.date_and_time_selected": "booking_time_selected",
    "calendly.event_scheduled": "booking_complete"
  };
  window.addEventListener("message", function (e) {
    if (!/calendly\.com$/.test((e.origin || "").replace(/^https?:\/\//, "").split(":")[0])) return;
    var name = e.data && calendlyMap[e.data.event];
    if (!name) return;
    track(name);
  });
})();

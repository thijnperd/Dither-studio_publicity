/* Dither Studio publicity site.
   The page opens on the film. Scroll is the only control surface: no player, no
   timeline, no readout, and the film under the type is the app's own dither.
   Phones, reduced-motion and save-data get the poster and the captions in flow
   rather than a download they cannot scrub. */

(function () {
  'use strict';

  document.body.classList.remove('no-js');

  var $ = function (id) { return document.getElementById(id); };
  var DURATION = 40;          /* seconds of film */
  var STAGE_SCREENS = 4;      /* viewport-heights of scroll the film runs over */

  var hasGsap = typeof window.gsap !== 'undefined';
  var hasScroll = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  if (hasScroll) gsap.registerPlugin(ScrollTrigger);
  /* the stylesheet holds the type back only while .motion is set, so the class
     has to come off the moment we know we cannot animate */
  if (!hasScroll) document.documentElement.classList.remove('motion');

  var stage = $('stage');
  var video = $('scrubvideo');
  var hint = $('hint');
  var beats = Array.prototype.slice.call(document.querySelectorAll('.beat'));

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var narrow = window.matchMedia('(max-width: 900px)').matches;
  var thrifty = !!(navigator.connection && navigator.connection.saveData);
  var canScrub = hasScroll && !reduce && !coarse && !narrow && !thrifty;
  var mode = canScrub ? 'scrub' : 'still';

  if (stage) stage.setAttribute('data-mode', mode);

  /* ================= the film follows the scroll ================= */

  var want = null;    /* the time the scroll has asked for */
  var queued = 0;

  function flush() {
    queued = 0;
    if (!video || want === null) return;
    /* a seek asked for before the stream has data is dropped silently, so the
       request stays queued and loadeddata/seeked come back for it */
    if (video.readyState < 1) return;
    if (Math.abs(video.currentTime - want) > 0.04) {
      try { video.currentTime = want; } catch (error) { /* a refused seek is not fatal */ }
    }
  }

  function paintStage(progress) {
    want = Math.max(0, Math.min(DURATION, progress * DURATION));
    if (!queued) queued = window.requestAnimationFrame(flush);
  }

  if (canScrub && video) {
    /* the file is only asked for once we know this visitor can run it */
    video.preload = 'auto';
    video.src = video.getAttribute('data-src');
    video.addEventListener('loadeddata', flush);
    video.addEventListener('seeked', flush);
    video.pause();
  }

  /* ================= the hint stands down after the first scroll ================= */

  if (hint && canScrub) {
    var dismissHint = function () {
      if (window.scrollY > 40) hint.classList.add('is-gone');
    };
    window.addEventListener('scroll', dismissHint, { passive: true });
  }

  /* ================= captions ride the film ================= */

  var pinTrigger = null;

  if (canScrub) {
    var perSecond = 100 / DURATION;
    var life = function (seconds) { return seconds * perSecond; };
    var FADE = 0.9;             /* seconds of film a caption takes to come and go */

    /* [in, out] in seconds of film, each inside the shot it describes:
       hook 0–5.2, spark 5.2–9, turn 9–15, gods 15–22.2, press 22.2–30,
       many 30–35, and the mark from 35 with no caption over it */
    var CAPTIONS = [
      [2.6, 5.0],
      [5.6, 8.8],
      [9.6, 14.6],
      [15.8, 21.8],
      [23.0, 29.4],
      [30.8, 34.4]
    ];

    var timeline = gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: '+=' + (STAGE_SCREENS * 100) + '%',
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) { paintStage(self.progress); }
      }
    });
    pinTrigger = timeline.scrollTrigger;
    timeline.to({}, { duration: 100 });

    /* every beat shares one cell, so only one is ever in the frame */
    gsap.set(beats, { autoAlpha: 0, y: 18 });
    var title = beats[0];
    gsap.set(title, { autoAlpha: 1, y: 0 });
    timeline.to(title, { autoAlpha: 0, y: -14, duration: life(FADE) }, life(2.2));

    beats.slice(1).forEach(function (beat, index) {
      var span = CAPTIONS[index];
      if (!span) return;
      timeline.to(beat, { autoAlpha: 1, y: 0, duration: life(FADE) }, life(span[0]));
      timeline.to(beat, { autoAlpha: 0, y: -14, duration: life(FADE) }, life(span[1] - FADE));
    });
  }

  /* ================= the download button knows the platform ================= */

  var ua = navigator.userAgent;
  var platformLabel = /Mac/i.test(ua) ? 'Download for macOS'
    : /Windows/i.test(ua) ? 'Download for Windows'
    : 'See the releases';
  Array.prototype.forEach.call(document.querySelectorAll('.js-platform'), function (el) {
    el.textContent = platformLabel;
  });

  /* ================= which section are we in ================= */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.masthead__nav a'));

  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var hash = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          if (link.getAttribute('href') === hash) link.setAttribute('aria-current', 'page');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    ['stage', 'proofs', 'take'].forEach(function (id) {
      var section = $(id);
      if (section) seen.observe(section);
    });
  }

  /* ================= the page sets itself as it is read ================= */

  if (hasScroll && document.documentElement.classList.contains('motion')) {
    window.__motionReady = true;

    var RISE = 0.62;      /* seconds, a caption's length of breath */
    var WIPE = 0.95;
    var line = window.innerHeight * 0.88;

    function rise(el, delay) {
      gsap.fromTo(el, { y: 18 }, {
        opacity: 1, y: 0, duration: RISE, ease: 'power3.out',
        delay: delay || 0, overwrite: true
      });
    }

    /* a heading opens from its baseline, a plate from its top edge */
    function open(el, delay) {
      var plate = el.tagName === 'IMG';
      gsap.to(el, {
        clipPath: plate ? 'inset(0 0 0% 0)' : 'inset(0 0 -8% 0)',
        duration: plate ? 0.85 : WIPE,
        ease: 'power4.out',
        delay: delay || 0,
        overwrite: true
      });
    }

    function arm(list, play) {
      list.forEach(function (el, index) {
        var box = el.getBoundingClientRect();
        if (box.bottom < 0) {
          /* already read past (a reload halfway down): never hide it again */
          gsap.set(el, { opacity: 1, y: 0, clipPath: 'none' });
          return;
        }
        if (box.top < line) {
          /* on screen at arrival: set it, without waiting for a scroll */
          play(el, (index % 4) * 0.07);
          return;
        }
        ScrollTrigger.create({
          trigger: el,
          start: 'top 88%',
          once: true,
          onEnter: function () { play(el); }
        });
      });
    }

    arm(gsap.utils.toArray('[data-reveal]'), rise);
    arm(gsap.utils.toArray('[data-clip]'), open);
  }

  /* a hook for the checks */
  window.__publicity = {
    stageTo: paintStage,
    state: function () {
      var current = document.querySelector('.masthead__nav a[aria-current]');
      return {
        stageTime: video ? +video.currentTime.toFixed(2) : 0,
        beats: beats.length,
        mode: mode,
        pinned: !!pinTrigger,
        videosOnPage: document.querySelectorAll('video').length,
        film: video && video.currentSrc ? video.currentSrc.split('/').pop() : null,
        dims: video && video.videoWidth ? video.videoWidth + '×' + video.videoHeight : null,
        motion: document.documentElement.classList.contains('motion'),
        nav: current ? current.getAttribute('href') : null
      };
    }
  };
})();

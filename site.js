/* Dither Studio publicity site.
   The page opens on the film. Scroll is the only control surface: no player, no
   timeline, no readout, and the film under the type is the app's own dither.
   Reduced motion and save-data get the poster and the captions in flow; a phone
   gets the portrait encode and scrubs with the same scroll. */

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
  var thrifty = !!(navigator.connection && navigator.connection.saveData);
  /* a phone can hold this: the stage pins and the scroll is the playhead there
     too. Only a visitor who asked for less motion, or who is on a metered
     connection, still gets the poster. */
  var canScrub = hasScroll && !reduce && !thrifty;
  var mode = canScrub ? 'scrub' : 'still';

  if (stage) stage.setAttribute('data-mode', mode);

  /* ================= the encode for this shape of window =================
     A portrait window wants the portrait cut: a 16:9 film covering a 9:16 stage
     is cropped to a stripe, and the paintings in this one are the point. The
     file follows the landscape encode's name, with "phone" before "scrub"
     (assets/film-scrub.mp4 -> assets/film-phone-scrub.mp4), so the page still
     carries one source and the portrait encode is the only new film asset. */

  function filmSource() {
    var src = video.getAttribute('data-src');
    if (!src) return null;
    if (!window.matchMedia('(orientation: portrait)').matches) return src;
    return src.replace(/-scrub\./, '-phone-scrub.');
  }

  function filmPoster() {
    var poster = video.getAttribute('data-poster-phone');
    if (!poster || !window.matchMedia('(orientation: portrait)').matches) {
      return video.getAttribute('poster');
    }
    return poster;
  }

  /* ================= the film follows the scroll ================= */

  var want = null;    /* the time the scroll has asked for */
  var queued = 0;
  var pinTrigger = null;
  var degraded = false;
  var primed = false;
  var priming = false;

  function flush() {
    queued = 0;
    if (!video || want === null) return;
    /* a seek asked for before the stream has data is dropped silently, so the
       request stays queued and loadeddata/seeked come back for it */
    if (video.readyState < 1) return;
    /* one seek at a time: setting currentTime on every frame while the last
       seek is still open buries a phone decoder in requests, and the frame
       that finally settles can be an older one. seeked calls this again with
       the latest target, so a fast scroll still lands where it finished. */
    if (video.seeking) return;
    if (Math.abs(video.currentTime - want) > 0.04) {
      try { video.currentTime = want; } catch (error) { /* a refused seek is not fatal */ }
    }
  }

  function paintStage(progress) {
    want = Math.max(0, Math.min(DURATION, progress * DURATION));
    if (!queued) queued = window.requestAnimationFrame(flush);
  }

  /* iOS will not paint a frame from a paused, muted inline video until it has
     played once. Asking on the first touch gives the decoder a live first frame
     before the scroll sends it anywhere; it pauses immediately, and the seek
     that follows is the scroll's own. */
  function prime() {
    if (primed || priming || !video || !canScrub) return;
    priming = true;
    try {
      video.muted = true;
      var started = video.play();
      var settle = function () {
        video.pause();
        priming = false;
        primed = true;
        flush();
      };
      if (started && typeof started.then === 'function') {
        started.then(settle, function () {
          /* leave it armed: the next touch can try again if this one was refused */
          priming = false;
        });
      } else {
        settle();
      }
    } catch (error) { priming = false; /* priming is best effort */ }
  }

  /* an encode that is absent or refuses to load must not leave a black stage:
     the page falls back to the poster and the captions in flow, which is the
     cut a visitor without the file would otherwise have got anyway */
  function degrade() {
    if (degraded) return;
    degraded = true;
    mode = 'still';
    if (stage) stage.setAttribute('data-mode', mode);
    if (pinTrigger) { pinTrigger.kill(); pinTrigger = null; }
    if (hint) hint.classList.add('is-gone');
  }

  if (canScrub && video) {
    /* the file is only asked for once we know this visitor can run it */
    video.poster = filmPoster();
    video.preload = 'auto';
    video.src = filmSource();
    video.addEventListener('loadeddata', flush);
    video.addEventListener('seeked', flush);
    video.addEventListener('error', degrade);
    video.pause();

    window.addEventListener('touchstart', prime, { passive: true });
  }

  /* ================= the hint stands down after the first scroll ================= */

  if (hint && canScrub) {
    var dismissHint = function () {
      if (window.scrollY > 40) hint.classList.add('is-gone');
    };
    window.addEventListener('scroll', dismissHint, { passive: true });
  }

  /* ================= captions ride the film ================= */

  if (canScrub && !degraded) {
    var perSecond = 100 / DURATION;
    var life = function (seconds) { return seconds * perSecond; };
    var FADE = 0.9;             /* seconds of film a caption takes to come and go */

    /* [in, out] in seconds of film, each inside the shot it describes:
       hook 0-5.2, spark 5.2-9, turn 9-15, gods 15-22.2, press 22.2-30,
       many 30-35, and the mark from 35 with no caption over it */
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
        onUpdate: function (self) { paintStage(self.progress); },
        onLeaveBack: function () { paintStage(0); }
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
  var isMac = /Mac/i.test(ua);
  var platformLabel = isMac ? 'Download for macOS'
    : /Windows/i.test(ua) ? 'Download for Windows'
    : 'See the releases';
  Array.prototype.forEach.call(document.querySelectorAll('.js-platform'), function (el) {
    el.textContent = platformLabel;
  });

  /* the sizes are facts from the 0.2.5 release (bump with desktop/package.json):
     Windows 107 MB, macOS 124 MB on Apple silicon and 127 MB on Intel. The
     markup carries the Windows figure; only a Mac needs a different one. */
  if (isMac) {
    Array.prototype.forEach.call(document.querySelectorAll('.js-meta'), function (el) {
      el.textContent = 'Version 0.2.5 · 124–127 MB · free';
    });
  }

  /* ================= which section are we in ================= */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.masthead__nav a'));

  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var hash = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          /* 'location', not 'page': this marks the section being read, not the page */
          if (link.getAttribute('href') === hash) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    ['stage', 'press', 'proofs', 'take'].forEach(function (id) {
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

  /* ================= the web demo loads only when asked ================= */

  var demo = $('press');
  if (demo && demo.hasAttribute('data-demo')) {
    var demoStage = demo.querySelector('[data-demo-stage]');
    var demoStart = demo.querySelector('[data-demo-start]');
    var demoClose = demo.querySelector('[data-demo-close]');
    var demoStatus = demo.querySelector('[data-demo-status]');
    var demoLoading = demo.querySelector('[data-demo-loading]');
    var demoFrame = null;
    var demoWatchdog = 0;
    var demoUrl = demoStart.getAttribute('href');

    function demoSet(state) {
      demo.setAttribute('data-state', state);
      if (demoClose) demoClose.hidden = state === 'idle';
      if (demoLoading) demoLoading.hidden = state !== 'loading';
      if (demoStatus) {
        demoStatus.textContent = state === 'live' ? 'Web demo / live'
          : state === 'loading' ? 'Web demo / opening'
          : 'Web demo / ready';
      }
      if (state === 'loading') demoStage.setAttribute('aria-busy', 'true');
      else demoStage.removeAttribute('aria-busy');
    }

    function demoOpen() {
      if (demoFrame) return;
      demoSet('loading');
      demoFrame = document.createElement('iframe');
      demoFrame.title = 'Dither Studio web demo';
      // The embedded console drops its own masthead and splash; the window
      // around it already carries the title, and the start card was the wait.
      demoFrame.src = demoUrl + (demoUrl.indexOf('?') === -1 ? '?' : '&') + 'embed=1';
      demoFrame.loading = 'eager';
      demoFrame.setAttribute('allow', 'clipboard-read; clipboard-write');
      demoFrame.addEventListener('load', function () {
        if (!demoFrame || demoFrame.parentNode !== demoStage) return;
        window.clearTimeout(demoWatchdog);
        demoSet('live');
        demoFrame.focus();
      });
      demoStage.insertBefore(demoFrame, demo.querySelector('.demo__veil'));
      demoWatchdog = window.setTimeout(function () {
        if (!demoFrame || demoFrame.parentNode !== demoStage) return;
        demoStage.removeChild(demoFrame);
        demoFrame = null;
        demoSet('idle');
        demoStart.focus();
      }, 30000);
    }

    function demoShut() {
      if (!demoFrame) return;
      window.clearTimeout(demoWatchdog);
      demoStage.removeChild(demoFrame);
      demoFrame = null;
      demoSet('idle');
      demoStart.focus();
    }

    demoStart.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!window.matchMedia('(min-width: 900px)').matches) return;
      event.preventDefault();
      demoOpen();
    });
    if (demoClose) demoClose.addEventListener('click', demoShut);
    demoSet('idle');
  }

  /* ================= the proof loupe ================= */

  var proofRail = document.querySelector('.proofs__rail');
  var proofLoupe = document.querySelector('[data-proof-loupe]');
  if (proofRail && proofLoupe && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var hideLoupe = function () {
      proofLoupe.classList.remove('is-visible');
    };
    var trackLoupe = function (event) {
      var image = event.target.closest ? event.target.closest('.proof img') : null;
      if (!image) {
        hideLoupe();
        return;
      }
      var rect = image.getBoundingClientRect();
      var x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      var y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      proofLoupe.style.setProperty('--x', event.clientX + 'px');
      proofLoupe.style.setProperty('--y', event.clientY + 'px');
      proofLoupe.style.backgroundImage = 'url("' + (image.currentSrc || image.src) + '")';
      proofLoupe.style.backgroundPosition = (x * 100).toFixed(2) + '% ' + (y * 100).toFixed(2) + '%';
      proofLoupe.classList.add('is-visible');
    };
    proofRail.addEventListener('pointermove', trackLoupe, { passive: true });
    proofRail.addEventListener('pointerleave', hideLoupe);
    proofRail.addEventListener('scroll', hideLoupe, { passive: true });
  }

  /* ================= the proof rail: arrows and a count ================= */

  var railControls = document.querySelector('[data-rail-controls]');
  var railPrev = document.querySelector('[data-rail-prev]');
  var railNext = document.querySelector('[data-rail-next]');
  var railCount = document.querySelector('[data-rail-count]');
  var railProofs = proofRail ? Array.prototype.slice.call(proofRail.querySelectorAll('.proof')) : [];

  if (proofRail && railControls && railPrev && railNext && railCount && railProofs.length > 1) {
    var railIndex = 0;
    var railQueued = 0;
    var railPad = 0;
    var twoDigits = function (number) { return (number < 10 ? '0' : '') + number; };

    var measureRail = function () {
      railPad = parseFloat(window.getComputedStyle(proofRail).paddingLeft) || 0;
      var start = proofRail.getBoundingClientRect().left + railPad;
      var nearest = 0;
      var distance = Infinity;

      railProofs.forEach(function (proof, index) {
        var gap = Math.abs(proof.getBoundingClientRect().left - start);
        if (gap < distance) {
          distance = gap;
          nearest = index;
        }
      });

      railIndex = nearest;
      railPrev.disabled = nearest === 0;
      railNext.disabled = nearest === railProofs.length - 1;
      railCount.textContent = twoDigits(nearest + 1) + ' / ' + twoDigits(railProofs.length);
      railCount.setAttribute('aria-label', 'Proof ' + (nearest + 1) + ' of ' + railProofs.length);
    };

    var queueRailMeasure = function () {
      if (railQueued) return;
      railQueued = window.requestAnimationFrame(function () {
        railQueued = 0;
        measureRail();
      });
    };

    var moveRail = function (delta) {
      measureRail();
      var next = Math.max(0, Math.min(railProofs.length - 1, railIndex + delta));
      var left = proofRail.scrollLeft
        + railProofs[next].getBoundingClientRect().left
        - proofRail.getBoundingClientRect().left
        - railPad;

      proofRail.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
    };

    railControls.hidden = false;
    railPrev.addEventListener('click', function () { moveRail(-1); });
    railNext.addEventListener('click', function () { moveRail(1); });
    proofRail.addEventListener('scroll', queueRailMeasure, { passive: true });
    window.addEventListener('resize', queueRailMeasure);
    window.addEventListener('load', measureRail);
    measureRail();
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
        demo: demo ? demo.getAttribute('data-state') : null,
        demoFrame: !!(demo && demo.querySelector('iframe')),
        nav: current ? current.getAttribute('href') : null
      };
    }
  };
})();

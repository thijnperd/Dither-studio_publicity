/* Dither Studio publicity site.
   The film has one control surface: the scroll. Chapters move the scroll, the
   ghost pointer demonstrates that, and nothing on the page can restart the film.
   There is no readout: no timecode, no progress rule, no chapter timer. */

(function () {
  'use strict';

  document.body.classList.remove('no-js');

  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasScroll = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  if (hasScroll) gsap.registerPlugin(ScrollTrigger);

  var DURATION = 40;
  var CHAPTERS = [
    [0, 'The press'],
    [5, 'The source'],
    [11, 'The run'],
    [20, 'The type'],
    [26.6, 'Many readings'],
    [33.4, 'The mark']
  ];

  var stage = $('stage');
  var stageVideo = $('scrubvideo');
  var beats = Array.prototype.slice.call(document.querySelectorAll('.beat'));
  var pinTrigger = null;

  /* ================= the scroll stage ================= */

  function paintStage(progress) {
    if (!stageVideo) return;
    var time = Math.max(0, Math.min(DURATION, progress * DURATION));

    /* seeking is expensive: only ask the decoder when the target actually moved */
    if (stageVideo.readyState >= 1 && Math.abs(stageVideo.currentTime - time) > 0.04) {
      try { stageVideo.currentTime = time; } catch (error) { /* a refused seek is not fatal */ }
    }
  }

  if (stageVideo) {
    stageVideo.addEventListener('loadedmetadata', function () { paintStage(0); });
    stageVideo.pause();
  }

  /* ================= chapters move the scroll ================= */

  function jumpTo(seconds) {
    var ratio = Math.max(0, Math.min(1, seconds / DURATION));
    if (!pinTrigger) {
      /* no pin (reduced motion, or the script was cut short): just go there */
      var heading = stage.querySelector('.beat') || stage;
      heading.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    var destination = pinTrigger.start + (pinTrigger.end - pinTrigger.start) * ratio;
    if (!hasGsap || reduce) {
      window.scrollTo(0, destination);
      return;
    }
    /* tweened, so the film scrubs with the page instead of teleporting;
       600ms because this is navigation, not a scene */
    var proxy = { at: window.scrollY };
    gsap.to(proxy, {
      at: destination,
      duration: 0.6,
      ease: 'power2.inOut',
      overwrite: true,
      onUpdate: function () { window.scrollTo(0, proxy.at); }
    });
  }

  document.querySelectorAll('#chapterlist button').forEach(function (button) {
    button.addEventListener('click', function () { jumpTo(parseFloat(button.dataset.at)); });
  });

  var download = $('download');
  var downloadLabel = $('downloadLabel');
  var ua = navigator.userAgent;
  if (/Mac/i.test(ua)) downloadLabel.textContent = 'Download for macOS';
  else if (!/Windows/i.test(ua)) downloadLabel.textContent = 'See the releases';

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

    ['stage', 'chapters', 'proofs', 'take'].forEach(function (id) {
      var section = $(id);
      if (section) seen.observe(section);
    });
  }

  /* ================= the ghost pointer ================= */

  var ghost = $('ghost');
  var ghostNote = $('ghostnote');
  var hint = $('hint');
  var again = $('again');
  var demo = null;
  var takeOver = false;

  function centre(el) {
    var box = el.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  }

  function rippleAt(point) {
    var dot = document.createElement('span');
    dot.className = 'ripple';
    document.body.appendChild(dot);
    gsap.set(dot, { x: point.x, y: point.y });
    gsap.fromTo(dot, { scale: 0.35, opacity: 0.9 },
      { scale: 1.5, opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: function () { dot.remove(); } });
  }

  function say(text) { ghostNote.textContent = text; }

  function runDemo() {
    if (!hasGsap || reduce || takeOver || demo) return;
    var chapter = document.querySelectorAll('#chapterlist button')[1];

    demo = gsap.timeline({
      onStart: function () { ghost.style.opacity = 1; },
      onComplete: function () { endDemo(); }
    });

    demo.call(say, ['Jump to a chapter']);
    demo.to(ghost, { x: centre(chapter).x, y: centre(chapter).y, duration: 0.9, ease: 'power3.inOut' });
    demo.to(ghost, { scale: 0.88, duration: 0.1 });
    demo.call(function () {
      rippleAt(centre(chapter));
      chapter.click();
    });
    demo.to(ghost, { scale: 1, duration: 0.16 });
    demo.to({}, { duration: 2.6 });

    demo.call(say, ['Take it home']);
    demo.to(ghost, { x: centre(download).x, y: centre(download).y, duration: 0.9, ease: 'power3.inOut' });
    demo.to(download, { scale: 1.03, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1 });
    demo.to({}, { duration: 1.2 });
  }

  function endDemo() {
    if (!hasGsap) return;
    demo = null;
    gsap.to(ghost, { opacity: 0, duration: 0.3, ease: 'power2.in' });
  }

  function stopDemo(reason) {
    if (takeOver) return;
    takeOver = true;
    if (demo) { demo.kill(); demo = null; }
    if (hasGsap) gsap.to(ghost, { opacity: 0, duration: 0.2, ease: 'power2.in' });
    hint.textContent = reason;
    again.hidden = false;
  }

  again.addEventListener('click', function () {
    takeOver = false;
    again.hidden = true;
    hint.textContent = 'The arrow shows what a chapter does. Touch anything and it stands down.';
    if (!hasGsap) return;
    gsap.set(ghost, { x: 40, y: window.innerHeight * 0.7, scale: 1 });
    runDemo();
  });

  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (type) {
    window.addEventListener(type, function (event) {
      if (event.target.closest && event.target.closest('#again')) return;
      if (event.target.closest && event.target.closest('.masthead')) return;
      stopDemo('Your turn. A chapter button moves the page and the film together.');
    }, { passive: true });
  });

  /* ================= GSAP layer ================= */

  if (hasGsap && hasScroll) {
    var mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', function () {
      /* the stage: pinned for three and a half screens, the scroll is the playhead */
      var stageTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: '+=340%',
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) { paintStage(self.progress); }
        }
      });
      pinTrigger = stageTimeline.scrollTrigger;

      /* a ruler of 100 units; each caption owns the beats of its own scene */
      stageTimeline.to({}, { duration: 100 });

      /* One caption per montage beat, cleared before the next. The last one
         leaves before the close, because the film's end card is the payoff
         and two headlines in one frame is one too many. */
      beats.forEach(function (beat, index) {
        var at = (CHAPTERS[index][0] / DURATION) * 100;
        var next = CHAPTERS[index + 1] ? CHAPTERS[index + 1][0] : 33.4;
        var out = Math.min(100, (next / DURATION) * 100 - 4);
        gsap.set(beat, { autoAlpha: 0, y: 20 });
        stageTimeline.to(beat, { autoAlpha: 1, y: 0, duration: 3.5, ease: 'power2.out' }, at);
        stageTimeline.to(beat, { autoAlpha: 0, y: -14, duration: 3.5, ease: 'power2.in' }, Math.max(at + 4, out));
      });

      /* the aperture opens a little as the film runs */
      gsap.fromTo('.stage__video', { scale: 1.08 }, {
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: stage, start: 'top top', end: '+=340%', scrub: 0.5 }
      });

      /* the ghost only runs while the chapter strip is on screen */
      ScrollTrigger.create({
        trigger: '.chapters',
        start: 'top 60%',
        end: 'bottom 60%',
        onEnter: function () { if (!takeOver) runDemo(); },
        onEnterBack: function () { if (!takeOver) runDemo(); },
        onLeave: function () { if (demo) { demo.pause(); } },
        onLeaveBack: function () { if (demo) { demo.pause(); } }
      });

      return function () { if (demo) { demo.kill(); demo = null; } };
    });

    mm.add('(prefers-reduced-motion: reduce)', function () {
      gsap.set(ghost, { opacity: 0 });
      gsap.set('.beat', { autoAlpha: 1, y: 0 });
      paintStage(0);
    });
  } else {
    paintStage(0);
  }

  /* a hook for the checks */
  window.__publicity = {
    jumpTo: jumpTo,
    stageTo: paintStage,
    state: function () {
      var current = document.querySelector('.masthead__nav a[aria-current]');
      return {
        stageTime: stageVideo ? +stageVideo.currentTime.toFixed(2) : null,
        beats: beats.length,
        pinned: !!pinTrigger,
        videosOnPage: document.querySelectorAll('video').length,
        ghostVisible: Number(getComputedStyle(ghost).opacity) > 0.1,
        takenOver: takeOver,
        nav: current ? current.getAttribute('href') : null
      };
    }
  };
})();

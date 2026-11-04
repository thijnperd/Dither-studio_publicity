/* Dither Studio publicity site.
   Three layers: the scroll stage (the film answers to the scroll wheel), the
   watch section (the film answers to the visitor), and a ghost pointer that
   demonstrates the second one. Everything visual runs on GSAP's ticker. */

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

  /* ================= the scroll stage ================= */

  var stage = $('stage');
  var stageVideo = $('scrubvideo');
  var beats = Array.prototype.slice.call(document.querySelectorAll('.beat'));
  var stageChapter = $('stagechapter');
  var stageTime = $('stagetime');
  var stageRule = $('stagerule');

  var lastSeek = 0;

  function paintStage(progress) {
    if (!stageVideo) return;
    var time = Math.max(0, Math.min(DURATION, progress * DURATION));

    /* seeking is expensive: only ask the decoder when the target actually moved */
    if (stageVideo.readyState >= 1 && Math.abs(stageVideo.currentTime - time) > 0.04) {
      try { stageVideo.currentTime = time; } catch (error) { /* a refused seek is not fatal */ }
    }

    if (stageRule) stageRule.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
    if (stageTime) stageTime.textContent = '00:' + String(Math.floor(time)).padStart(2, '0');

    if (stageChapter) {
      var name = CHAPTERS[0][1];
      for (var i = 0; i < CHAPTERS.length; i++) {
        if (time >= CHAPTERS[i][0] - 0.12) name = CHAPTERS[i][1];
      }
      if (stageChapter.textContent !== name) stageChapter.textContent = name;
    }
  }

  /* the first frame is the poster, then the film's own first frame once it is ready */
  if (stageVideo) {
    stageVideo.addEventListener('loadedmetadata', function () { paintStage(0); });
    stageVideo.addEventListener('seeking', function () {
      lastSeek = performance.now();
    });
    stageVideo.pause();
  }

  /* ================= the watch section ================= */

  var video = $('video');
  var frame = $('frame');
  var play = $('play');
  var toggle = $('toggle');
  var toggleLabel = $('toggleLabel');
  var scrub = $('scrub');
  var fill = $('fill');
  var knob = $('knob');
  var nowLabel = $('now');
  var ghost = $('ghost');
  var ghostNote = $('ghostnote');
  var hint = $('hint');
  var again = $('again');

  var demo = null;
  var takeOver = false;

  function clock(seconds) {
    var s = Math.max(0, Math.min(DURATION, seconds || 0));
    return '00:' + String(Math.floor(s)).padStart(2, '0');
  }

  function paintProgress() {
    var t = video.currentTime || 0;
    var ratio = Math.min(1, t / DURATION);
    fill.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    knob.style.transform = 'translateX(' + (ratio * scrub.clientWidth).toFixed(1) + 'px)';
    nowLabel.textContent = clock(t);
    scrub.setAttribute('aria-valuenow', t.toFixed(1));
    scrub.setAttribute('aria-valuetext', Math.floor(t) + ' of 40 seconds');
  }

  function setPlaying(isPlaying) {
    document.body.classList.toggle('is-playing', isPlaying);
    toggleLabel.textContent = isPlaying ? 'Pause' : 'Play';
    play.hidden = isPlaying;
  }

  function start() {
    var attempt = video.play();
    if (attempt && attempt.catch) attempt.catch(function () { setPlaying(false); });
  }

  function stop() { video.pause(); setPlaying(false); }

  function togglePlay() { if (video.paused) start(); else stop(); }

  function seek(seconds) {
    video.currentTime = Math.max(0, Math.min(DURATION, seconds));
    paintProgress();
  }

  video.addEventListener('timeupdate', paintProgress);
  video.addEventListener('loadedmetadata', function () {
    if (video.duration && Math.abs(video.duration - DURATION) > 0.5) DURATION = video.duration;
    paintProgress();
    hideLoader();
  });
  video.addEventListener('play', function () { setPlaying(true); });
  video.addEventListener('pause', function () { setPlaying(false); });
  video.addEventListener('ended', function () { setPlaying(false); });

  play.addEventListener('click', start);
  toggle.addEventListener('click', togglePlay);
  frame.addEventListener('dblclick', start);

  var dragging = false;

  function scrubTo(clientX) {
    var box = scrub.getBoundingClientRect();
    var ratio = (clientX - box.left) / box.width;
    seek(Math.max(0, Math.min(1, ratio)) * DURATION);
  }

  scrub.addEventListener('pointerdown', function (event) {
    dragging = true;
    scrub.setPointerCapture(event.pointerId);
    scrubTo(event.clientX);
  });
  scrub.addEventListener('pointermove', function (event) {
    if (dragging) scrubTo(event.clientX);
  });
  scrub.addEventListener('pointerup', function (event) {
    dragging = false;
    if (scrub.hasPointerCapture(event.pointerId)) scrub.releasePointerCapture(event.pointerId);
  });
  scrub.addEventListener('keydown', function (event) {
    var step = event.shiftKey ? 5 : 1;
    if (event.key === 'ArrowRight') { seek(video.currentTime + step); event.preventDefault(); }
    if (event.key === 'ArrowLeft') { seek(video.currentTime - step); event.preventDefault(); }
    if (event.key === 'Home') { seek(0); event.preventDefault(); }
    if (event.key === 'End') { seek(DURATION - 0.1); event.preventDefault(); }
  });

  document.addEventListener('keydown', function (event) {
    if (event.target.closest('#scrub') || event.target.closest('a')) return;
    if (event.key === ' ') { togglePlay(); event.preventDefault(); }
  });

  var fs = $('fs');
  fs.addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (frame.requestFullscreen) frame.requestFullscreen();
  });

  document.querySelectorAll('#chapterlist button').forEach(function (button) {
    button.addEventListener('click', function () {
      seek(parseFloat(button.dataset.at));
      start();
      $('film').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  var download = $('download');
  var downloadLabel = $('downloadLabel');
  var ua = navigator.userAgent;
  if (/Mac/i.test(ua)) downloadLabel.textContent = 'Download for macOS';
  else if (!/Windows/i.test(ua)) downloadLabel.textContent = 'See the releases';

  /* ================= loader ================= */

  var loader = $('loader');
  var loadcount = $('loadcount');
  var loadDone = false;

  function hideLoader() {
    if (loadDone) return;
    loadDone = true;
    if (!hasGsap) { loader.remove(); return; }
    gsap.timeline()
      .to(loadcount, { duration: 0.35, innerText: 100, snap: { innerText: 1 }, ease: 'none' })
      .to(loader, { duration: 0.45, opacity: 0, ease: 'power2.inOut' })
      .set(loader, { display: 'none' });
  }

  if (hasGsap) {
    gsap.fromTo(loadcount, { innerText: 0 }, {
      duration: 1.1, innerText: 96, snap: { innerText: 1 }, ease: 'power1.out'
    });
  }
  setTimeout(hideLoader, 1900);

  /* ================= the ghost pointer ================= */

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
      { scale: 1.5, opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: function () { dot.remove(); } });
  }

  function say(text) { ghostNote.textContent = text; }

  function runDemo() {
    if (!hasGsap || reduce || takeOver || demo) return;
    var chapter = document.querySelectorAll('#chapterlist button')[3];

    demo = gsap.timeline({
      onStart: function () { ghost.style.opacity = 1; },
      onComplete: function () { endDemo(); }
    });

    demo.call(say, ['Press play']);
    demo.to(ghost, { x: centre(toggle).x, y: centre(toggle).y, duration: 0.1 });
    demo.to(ghost, { x: centre(play).x, y: centre(play).y, duration: 1.05, ease: 'power3.inOut' });
    demo.to(ghost, { scale: 0.88, duration: 0.1 });
    demo.call(function () { rippleAt(centre(play)); start(); });
    demo.to(ghost, { scale: 1, duration: 0.16 });
    demo.to({}, { duration: 2.4 });

    demo.call(say, ['Jump to a chapter']);
    demo.to(ghost, { x: centre(chapter).x, y: centre(chapter).y, duration: 1.0, ease: 'power3.inOut' });
    demo.to(ghost, { scale: 0.88, duration: 0.1 });
    demo.call(function () { rippleAt(centre(chapter)); seek(20); start(); });
    demo.to(ghost, { scale: 1, duration: 0.16 });
    demo.to({}, { duration: 2.0 });

    demo.call(say, ['Drag the print']);
    var track = scrub.getBoundingClientRect();
    demo.to(ghost, { x: track.left + track.width * 0.2, y: track.top + track.height / 2, duration: 0.9, ease: 'power3.inOut' });
    demo.to(ghost, {
      x: track.left + track.width * 0.74,
      duration: 2.2,
      ease: 'none',
      onUpdate: function () {
        var ratio = (ghost._gsap.x - track.left) / track.width;
        seek(Math.max(0, Math.min(1, ratio)) * DURATION);
      }
    });

    demo.call(say, ['Take it home']);
    demo.to(ghost, { x: centre(download).x, y: centre(download).y, duration: 1.1, ease: 'power3.inOut' });
    demo.to(download, { scale: 1.03, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1 });
    demo.to({}, { duration: 1.2 });
  }

  function endDemo() {
    if (!hasGsap) return;
    demo = null;
    gsap.to(ghost, { opacity: 0, duration: 0.4, ease: 'power2.in' });
  }

  function stopDemo(reason) {
    if (takeOver) return;
    takeOver = true;
    if (demo) { demo.kill(); demo = null; }
    if (hasGsap) gsap.to(ghost, { opacity: 0, duration: 0.25, ease: 'power2.in' });
    hint.textContent = reason;
    again.hidden = false;
  }

  again.addEventListener('click', function () {
    takeOver = false;
    again.hidden = true;
    hint.textContent = 'A ghost arrow is about to show you these controls. Touch anything and it steps aside.';
    if (!hasGsap) return;
    gsap.set(ghost, { x: 40, y: window.innerHeight * 0.7, scale: 1 });
    runDemo();
  });

  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (type) {
    window.addEventListener(type, function (event) {
      if (event.target.closest && event.target.closest('#again')) return;
      if (event.target.closest && event.target.closest('.masthead')) return;
      stopDemo('Your turn. The controls above do exactly what the arrow was doing.');
    }, { passive: true });
  });

  /* ================= GSAP layer ================= */

  if (hasGsap && hasScroll) {
    var mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', function () {
      var lastBeat = beats[beats.length - 1];

      /* the stage: pinned for three screens, the scroll position is the playhead */
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

      /* a ruler of 100 units; the beats sit at their real frame's position */
      stageTimeline.to({}, { duration: 100 });

      beats.forEach(function (beat, index) {
        var at = (CHAPTERS[index][0] / DURATION) * 100;
        var isLast = beat === lastBeat;
        gsap.set(beat, { autoAlpha: 0, y: 26 });
        stageTimeline.to(beat, { autoAlpha: 1, y: 0, duration: 3.5, ease: 'power2.out' }, at);
        if (!isLast) {
          var out = Math.min(100, (CHAPTERS[index + 1][0] / DURATION) * 100 - 4);
          stageTimeline.to(beat, { autoAlpha: 0, y: -20, duration: 3.5, ease: 'power2.in' }, Math.max(at + 4, out));
        }
      });

      /* the aperture opens as the film runs */
      gsap.fromTo('.stage__video', { scale: 1.12 }, {
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: stage, start: 'top top', end: '+=340%', scrub: 0.5 }
      });

      /* opening copy lifts away */
      gsap.to('.opening', {
        y: -40, opacity: 0.35, ease: 'none',
        scrollTrigger: { trigger: '.opening', start: 'top top', end: 'bottom top', scrub: 0.5 }
      });

      gsap.from('.opening h1, .opening__lede, .opening__cue', {
        y: 26, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out', delay: 0.15
      });

      /* scroll rule */
      gsap.to('#scrollbar', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.4 }
      });

      /* reveals, one treatment per role */
      document.querySelectorAll('.watch__head > *, .screen, .coach, .chapters__list li, .proof, .stats > div, .take > *, .colophon > *').forEach(function (el) {
        gsap.from(el, {
          y: 20, opacity: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true }
        });
      });

      /* the counts land on the catalogue's real numbers */
      document.querySelectorAll('.stats dd').forEach(function (dd) {
        var target = parseInt(dd.dataset.count, 10);
        var proxy = { value: 0 };
        gsap.to(proxy, {
          value: target, duration: 1.2, ease: 'power2.out',
          scrollTrigger: { trigger: dd, start: 'top 85%', once: true },
          onUpdate: function () { dd.textContent = Math.round(proxy.value); },
          onComplete: function () { dd.textContent = target; }
        });
      });

      /* the ghost only runs while the watch section is on screen */
      ScrollTrigger.create({
        trigger: '.watch',
        start: 'top 55%',
        end: 'bottom 40%',
        onEnter: function () { if (!takeOver) runDemo(); },
        onEnterBack: function () { if (!takeOver) runDemo(); },
        onLeave: function () { if (demo) { demo.pause(); } },
        onLeaveBack: function () { if (demo) { demo.pause(); } }
      });

      return function () {
        if (demo) { demo.kill(); demo = null; }
      };
    });

    mm.add('(prefers-reduced-motion: reduce)', function () {
      document.querySelectorAll('.stats dd').forEach(function (dd) {
        dd.textContent = dd.dataset.count;
      });
      gsap.set(ghost, { opacity: 0 });
      gsap.set('.beat', { autoAlpha: 1, y: 0 });
      paintStage(0);
    });
  } else if (reduce || !hasScroll) {
    paintStage(0);
  }

  paintProgress();
  window.addEventListener('resize', paintProgress);

  /* a hook for the checks */
  window.__publicity = {
    seek: seek,
    stageTo: paintStage,
    state: function () {
      return {
        time: video.currentTime,
        playing: !video.paused,
        duration: DURATION,
        ghostVisible: Number(getComputedStyle(ghost).opacity) > 0.1,
        chapters: document.querySelectorAll('#chapterlist button').length,
        beats: beats.length,
        stageTime: stageVideo ? stageVideo.currentTime : null,
        stagePinned: !!(hasScroll && ScrollTrigger.isScrolling()),
        pinSpacer: !!document.querySelector('.pin-spacer'),
        takenOver: takeOver
      };
    }
  };
})();

/* Dither Studio publicity site.
   Two jobs: drive the film honestly, and let a ghost pointer demonstrate the
   controls until the visitor takes over. Everything visual runs on GSAP's
   ticker; the only loops are the video's own time updates. */

(function () {
  'use strict';

  document.body.classList.remove('no-js');

  var $ = function (id) { return document.getElementById(id); };
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

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasScroll = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  if (hasScroll) gsap.registerPlugin(ScrollTrigger);

  var DURATION = 40;
  var demo = null;
  var takeOver = false;

  /* ---------------- the film ---------------- */

  function clock(seconds) {
    var s = Math.max(0, Math.min(DURATION, seconds || 0));
    var whole = Math.floor(s);
    return '00:' + String(whole).padStart(2, '0');
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

  function stop() {
    video.pause();
    setPlaying(false);
  }

  function togglePlay() {
    if (video.paused) start(); else stop();
  }

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

  frame.addEventListener('dblclick', function () { start(); });

  /* scrub: pointer, keyboard, and the ghost pointer's drag */
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

  /* chapters: jump the film to a real beat */
  document.querySelectorAll('#chapterlist button').forEach(function (button) {
    button.addEventListener('click', function () {
      seek(parseFloat(button.dataset.at));
      start();
      document.getElementById('film').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  });

  /* the download button: label follows the visitor's platform */
  var download = $('download');
  var downloadLabel = $('downloadLabel');
  var ua = navigator.userAgent;
  if (/Mac/i.test(ua)) downloadLabel.textContent = 'Download for macOS';
  else if (!/Windows/i.test(ua)) downloadLabel.textContent = 'See the releases';

  /* ---------------- loader ---------------- */

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

  /* ---------------- the ghost pointer ---------------- */

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
      onStart: function () { ghost.style.opacity = 1; setPlaying(false); },
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
    hint.textContent = 'A ghost arrow is about to show you the controls. Touch anything and it steps aside.';
    if (!hasGsap) return;
    gsap.set(ghost, { x: 40, y: window.innerHeight * 0.7, scale: 1 });
    runDemo();
  });

  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (type) {
    window.addEventListener(type, function (event) {
      if (event.target.closest && event.target.closest('#again')) return;
      stopDemo('Your turn. The film and the chapters above do exactly what the arrow was doing.');
    }, { once: false, passive: true });
  });

  /* ---------------- GSAP layer ---------------- */

  if (hasGsap && hasScroll) {
    var mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', function () {
      gsap.set(ghost, { x: 40, y: window.innerHeight * 0.7 });

      gsap.from('.hero h1, .hero__lede, .hero__spec > div', {
        y: 26, opacity: 0, duration: 1, stagger: 0.07, ease: 'power3.out', delay: 0.15
      });
      gsap.from('.screen', { y: 34, opacity: 0, duration: 1.1, ease: 'power3.out', delay: 0.25 });

      /* scroll rule */
      gsap.to('#scrollbar', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.4 }
      });

      /* the frame breathes out as it leaves, the way a plate lifts off the bed */
      gsap.to('.screen__frame', {
        scale: 1.025,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });

      /* reveals, one treatment per role */
      document.querySelectorAll('.chapters__list li, .proof, .stats > div, .take > *, .colophon > *').forEach(function (el) {
        gsap.from(el, {
          y: 20, opacity: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
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

      /* the ghost only runs while the film is on screen */
      ScrollTrigger.create({
        trigger: '.hero',
        start: 'top 60%',
        end: 'bottom 20%',
        onEnter: function () { if (!takeOver) runDemo(); },
        onEnterBack: function () { if (!takeOver) runDemo(); },
        onLeave: function () { if (demo) { demo.pause(); } },
        onLeaveBack: function () { if (demo) { demo.pause(); } }
      });

      return function () { if (demo) { demo.kill(); demo = null; } };
    });

    mm.add('(prefers-reduced-motion: reduce)', function () {
      document.querySelectorAll('.stats dd').forEach(function (dd) {
        dd.textContent = dd.dataset.count;
      });
      gsap.set(ghost, { opacity: 0 });
    });
  }

  /* paint the first state even if GSAP never loads */
  paintProgress();
  window.addEventListener('resize', paintProgress);

  /* a tiny hook for the smoke checks */
  window.__publicity = {
    seek: seek,
    state: function () {
      return {
        time: video.currentTime,
        playing: !video.paused,
        duration: DURATION,
        ghostVisible: Number(getComputedStyle(ghost).opacity) > 0.1,
        chapters: document.querySelectorAll('#chapterlist button').length,
        takenOver: takeOver
      };
    }
  };
})();

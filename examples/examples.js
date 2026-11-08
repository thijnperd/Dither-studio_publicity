/* The proof shelf, now part of the one-pager.
   It reads the examples folder through GitHub's contents API, so adding a file
   and pushing is still the whole workflow. The request waits until the shelf is
   near the viewport, and the files themselves are served from this site. */

(function () {
  'use strict';

  var REPO = 'thijnperd/Dither-studio_publicity';
  var DIR = 'examples';
  var IMAGE = /\.(avif|gif|jpe?g|png|webp)$/i;
  var VIDEO = /\.(mp4|mov|webm)$/i;
  var CACHE_KEY = 'dither:shelf:v2';
  var CACHE_MS = 60000;

  /* Curated display names for the files already in the folder. A new file
     still appears without editing this map; its file name becomes the title. */
  var TITLES = {
    'adam-line-dmg': 'The Creation, line-damaged',
    'adam-the-gap': 'The gap, in ice',
    'hoplite-cyan-study': 'Hoplite, cyan study',
    'hoplite-full-figure': 'Hoplite, full figure',
    'hoplite-ink-study': 'Hoplite, ink study',
    'oedipus-glitch-sort': 'Oedipus, signal decay',
    'oedipus-gold-leaf': 'Oedipus, gold leaf',
    'oedipus-line-gameboy': 'Oedipus, four greens',
    'oedipus-the-answer': 'The answer',
    'orator-cyanotype': 'The orator, cyanotype',
    'thor-the-strike': 'Thor, the strike',
    'thor-thermal-cam': 'Thor, thermal'
  };

  var section = document.getElementById('examples');
  var grid = document.getElementById('shelf-grid');
  var note = document.getElementById('shelf-status');
  var count = document.getElementById('shelf-count');
  var filters = Array.prototype.slice.call(document.querySelectorAll('.examples__filters [data-filter]'));
  if (!section || !grid || !note) return;

  var CAPTIONS = {};
  var currentFilter = 'all';
  var total = 0;
  var loaded = false;
  var loading = false;

  function weight(bytes) {
    if (!bytes) return '';
    return bytes >= 1048576
      ? (bytes / 1048576).toFixed(bytes >= 10485760 ? 0 : 1) + ' MB'
      : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }

  function extension(name) {
    var found = /\.([^.]+)$/.exec(name);
    return found ? found[1].toUpperCase() : '';
  }

  /* the file name is the caption: proof-thor-bayer-8.png reads "Proof thor bayer 8" */
  function caption(name) {
    var base = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return base ? base.charAt(0).toUpperCase() + base.slice(1) : name;
  }

  function displayTitle(name) {
    return TITLES[name.replace(/\.[^.]+$/, '')] || caption(name);
  }

  function fileCaption(name) {
    return CAPTIONS[name] || CAPTIONS[name.replace(/\.[^.]+$/, '')] || '';
  }

  function localURL(name) {
    return 'examples/' + encodeURIComponent(name);
  }

  function downloadURL(file) {
    return file.download_url || 'https://github.com/' + REPO + '/raw/main/' + DIR + '/' + encodeURIComponent(file.name);
  }

  function setBusy(isBusy) {
    if (isBusy) grid.setAttribute('aria-busy', 'true');
    else grid.removeAttribute('aria-busy');
  }

  function render(list) {
    total = list.length;
    loaded = true;
    loading = false;
    setBusy(false);

    if (!total) {
      grid.textContent = '';
      note.hidden = false;
      note.textContent = 'The shelf is empty. Drop a still or a clip into examples/ and push it.';
      if (count) count.textContent = '';
      return;
    }

    var hasMotion = list.some(function (file) { return VIDEO.test(file.name); });
    filters.forEach(function (button) {
      if (button.getAttribute('data-filter') === 'motion') button.hidden = !hasMotion;
    });
    if (!hasMotion && currentFilter === 'motion') {
      currentFilter = 'all';
      grid.setAttribute('data-filter', 'all');
      filters.forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-filter') === 'all'));
      });
    }

    grid.textContent = '';
    var shelf = document.createDocumentFragment();

    list.forEach(function (file) {
      var kind = VIDEO.test(file.name) ? 'motion' : 'still';
      var title = displayTitle(file.name);
      var src = localURL(file.name);
      var link = document.createElement('a');

      var item = document.createElement('li');
      item.className = 'shelf__item';
      item.setAttribute('data-kind', kind);

      link.className = 'shelf__link';
      link.href = downloadURL(file);
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('aria-label', title + ', open the full file');

      var plate = document.createElement('span');
      plate.className = 'shelf__plate';

      var media;
      if (kind === 'motion') {
        media = document.createElement('video');
        media.muted = true;
        media.playsInline = true;
        media.preload = 'metadata';
        media.setAttribute('aria-hidden', 'true');
      } else {
        media = document.createElement('img');
        media.alt = '';
        media.loading = 'lazy';
        media.decoding = 'async';
      }
      media.src = src;
      plate.appendChild(media);

      var tag = document.createElement('span');
      tag.className = 'shelf__tag';
      tag.textContent = kind === 'motion' ? 'Motion' : 'Still';
      plate.appendChild(tag);

      var meta = document.createElement('span');
      meta.className = 'shelf__meta';
      var name = document.createElement('b');
      name.textContent = title;
      var spec = document.createElement('span');
      spec.className = 'shelf__spec';
      spec.textContent = extension(file.name) + ' · ' + weight(file.size);
      meta.appendChild(name);
      meta.appendChild(spec);

      var line = fileCaption(file.name);
      if (line) {
        var noteLine = document.createElement('span');
        noteLine.className = 'shelf__note';
        noteLine.textContent = line;
        meta.appendChild(noteLine);
      }

      /* once the browser knows the pixels, the caption can say how many */
      media.addEventListener(kind === 'motion' ? 'loadedmetadata' : 'load', function () {
        var w = kind === 'motion' ? media.videoWidth : media.naturalWidth;
        var h = kind === 'motion' ? media.videoHeight : media.naturalHeight;
        if (w && h) spec.textContent = extension(file.name) + ' · ' + w + ' × ' + h + ' · ' + weight(file.size);
      }, { once: true });

      if (kind === 'still' && media.complete && media.naturalWidth) {
        spec.textContent = extension(file.name) + ' · ' + media.naturalWidth + ' × ' + media.naturalHeight + ' · ' + weight(file.size);
      }

      link.appendChild(plate);
      link.appendChild(meta);
      item.appendChild(link);
      shelf.appendChild(item);
    });

    grid.appendChild(shelf);
    note.textContent = '';
    note.hidden = true;
    updateCount();
  }

  function updateCount() {
    if (!count) return;
    var shown = currentFilter === 'all'
      ? total
      : grid.querySelectorAll('[data-kind="' + currentFilter + '"]').length;
    count.textContent = currentFilter === 'all'
      ? total + (total === 1 ? ' proof' : ' proofs') + ' on the shelf'
      : shown + ' of ' + total + ' shown';
  }

  function filter() {
    filters.forEach(function (button) {
      button.addEventListener('click', function () {
        currentFilter = button.getAttribute('data-filter');
        grid.setAttribute('data-filter', currentFilter);
        filters.forEach(function (other) {
          other.setAttribute('aria-pressed', String(other === button));
        });
        updateCount();
      });
    });
  }

  function cached() {
    try {
      var held = sessionStorage.getItem(CACHE_KEY);
      if (!held) return null;
      var copy = JSON.parse(held);
      return Date.now() - copy.at < CACHE_MS ? copy.files : null;
    } catch (error) {
      return null;
    }
  }

  function readCaptions() {
    return fetch(DIR + '/captions.json', { cache: 'no-store' })
      .then(function (response) { return response.ok ? response.json() : {}; })
      .catch(function () { return {}; });
  }

  function failed(error) {
    loading = false;
    setBusy(false);
    note.hidden = false;
    note.textContent = '';
    note.appendChild(document.createTextNode('The shelf could not be read (' + error.message + '). '));
    var link = document.createElement('a');
    link.href = 'https://github.com/' + REPO + '/tree/main/' + DIR;
    link.textContent = 'Open the folder on GitHub';
    note.appendChild(link);
  }

  function load() {
    if (loaded || loading) return;
    loading = true;
    setBusy(true);
    note.hidden = false;
    note.textContent = 'Reading the shelf…';

    readCaptions().then(function (map) {
      CAPTIONS = map && typeof map === 'object' ? map : {};
      var held = cached();
      if (held) {
        render(held);
        return;
      }

      return fetch('https://api.github.com/repos/' + REPO + '/contents/' + DIR + '?ref=main', {
        headers: { Accept: 'application/vnd.github+json' }
      })
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        })
        .then(function (entries) {
          if (!Array.isArray(entries)) throw new Error('unexpected listing');
          var files = entries
            .filter(function (entry) {
              return entry.type === 'file' && entry.name !== 'captions.json' && (IMAGE.test(entry.name) || VIDEO.test(entry.name));
            })
            .sort(function (a, b) {
              /* stills first, then clips; within each, the file name groups a
                 painting's proofs together and keeps 2 before 10 */
              var clipA = VIDEO.test(a.name) ? 1 : 0;
              var clipB = VIDEO.test(b.name) ? 1 : 0;
              return clipA - clipB || a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' });
            });
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), files: files }));
          } catch (error) { /* a browser that refuses storage still gets the shelf */ }
          render(files);
        })
        .catch(failed);
    });
  }

  filter();

  if (!('IntersectionObserver' in window)) {
    load();
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
    observer.disconnect();
    load();
  }, { rootMargin: '600px 0px' });
  observer.observe(section);
})();

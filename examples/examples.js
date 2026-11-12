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
  var CACHE_KEY = 'dither:shelf:v3';
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
    'thor-thermal-cam': 'Thor, thermal',
    'oedipus-sweetie-16': 'Oedipus, Sweetie 16',
    'thor-endesga-strike': 'Thor, Endesga strike',
    'oedipus-nord-riddle': 'Oedipus, Nord',
    'oedipus-nord-wing': 'The wing, Nord',
    'council-sweetie-16': 'The Council, Sweetie 16',
    'council-endesga-court': 'The Council, Endesga court',
    'thor-oxide-rust': 'Thor, oxide',
    'thor-kaleido-mask': 'Thor, kaleidoscope',
    'oedipus-starfield': 'Oedipus, starfield',
    'oedipus-selenium-wing': 'The wing, selenium',
    'oedipus-tape-touch': 'The touch, tape',
    'oedipus-channel-roll': 'The touch, channel roll',
    'council-ripple-swirl': 'The Council, swirl'
  };

  /* The 0.3.0 set leads the shelf. It is a curated order, not a date sort:
     GitHub returns the folder by name, so without this the new plates would be
     scattered through the older proofs. */
  var NEW_FILES = {
    'oedipus-sweetie-16': true,
    'thor-endesga-strike': true,
    'oedipus-nord-riddle': true,
    'oedipus-nord-wing': true,
    'council-sweetie-16': true,
    'council-endesga-court': true,
    'thor-oxide-rust': true,
    'thor-kaleido-mask': true,
    'oedipus-starfield': true,
    'oedipus-selenium-wing': true,
    'oedipus-tape-touch': true,
    'oedipus-channel-roll': true,
    'council-ripple-swirl': true
  };

  var NEW_ORDER = {
    'council-sweetie-16': 0,
    'thor-kaleido-mask': 1,
    'oedipus-sweetie-16': 2,
    'thor-endesga-strike': 3,
    'oedipus-nord-wing': 4,
    'council-ripple-swirl': 5,
    'oedipus-nord-riddle': 6,
    'council-endesga-court': 7,
    'oedipus-selenium-wing': 8,
    'oedipus-tape-touch': 9,
    'oedipus-channel-roll': 10,
    'oedipus-starfield': 11,
    'thor-oxide-rust': 12
  };

  var section = document.getElementById('examples');
  var grid = document.getElementById('shelf-grid');
  var note = document.getElementById('shelf-status');
  var count = document.getElementById('shelf-count');
  var countNote = document.getElementById('shelf-count-note');
  var controls = document.querySelector('[data-shelf-controls]');
  var railPrev = document.querySelector('[data-shelf-prev]');
  var railNext = document.querySelector('[data-shelf-next]');
  var railCount = document.querySelector('[data-shelf-count]');
  var filters = Array.prototype.slice.call(document.querySelectorAll('.examples__filters [data-filter]'));
  if (!section || !grid || !note) return;

  var CAPTIONS = {};
  var currentFilter = 'all';
  var total = 0;
  var loaded = false;
  var loading = false;

  function visibleItems() {
    return Array.prototype.slice.call(grid.children).filter(function (item) {
      return !item.hidden;
    });
  }

  function numberItems() {
    visibleItems().forEach(function (item, index) {
      var plateIndex = item.querySelector('.shelf__index');
      if (plateIndex) plateIndex.textContent = (index < 9 ? '0' : '') + (index + 1);
    });
  }

  function baseName(name) {
    return name.replace(/\.[^.]+$/, '');
  }

  function isNew(name) {
    return !!NEW_FILES[baseName(name)];
  }

  function newRank(name) {
    var key = baseName(name);
    return NEW_FILES[key] && Object.prototype.hasOwnProperty.call(NEW_ORDER, key)
      ? NEW_ORDER[key] : 99;
  }

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
      if (count) count.textContent = '…';
      if (countNote) countNote.textContent = 'the folder is empty';
      return;
    }

    var hasMotion = list.some(function (file) { return VIDEO.test(file.name); });
    filters.forEach(function (button) {
      if (button.getAttribute('data-filter') === 'motion') button.hidden = !hasMotion;
    });
    if (!hasMotion && currentFilter === 'motion') {
      show('all');
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
      tag.className = 'shelf__tag' + (isNew(file.name) ? ' is-new' : '');
      tag.textContent = isNew(file.name) ? '0.3.0' : (kind === 'motion' ? 'Motion' : 'Still');
      plate.appendChild(tag);

      var meta = document.createElement('span');
      meta.className = 'shelf__meta';

      var index = document.createElement('span');
      index.className = 'shelf__index';
      index.setAttribute('aria-hidden', 'true');

      var copy = document.createElement('span');
      copy.className = 'shelf__copy';

      var name = document.createElement('b');
      name.textContent = title;
      var spec = document.createElement('span');
      spec.className = 'shelf__spec';
      spec.textContent = extension(file.name) + ' · ' + weight(file.size);
      copy.appendChild(name);
      copy.appendChild(spec);

      var line = fileCaption(file.name);
      if (line) {
        var noteLine = document.createElement('span');
        noteLine.className = 'shelf__note';
        noteLine.textContent = line;
        copy.appendChild(noteLine);
      }

      meta.appendChild(index);
      meta.appendChild(copy);

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
    grid.scrollLeft = 0;
    numberItems();
    updateCount();
    updateRail();
    if (controls) controls.hidden = false;
    /* The images arrive after the cards do, and the browser can keep its own
       scroll anchor while the rail's height settles. Put the first plate back
       under the left edge once that frame has run, not just before it. */
    window.requestAnimationFrame(function () {
      grid.scrollLeft = 0;
      updateRail();
    });
  }

  function updateCount() {
    var shown = visibleItems().length;
    if (count) count.textContent = String(currentFilter === 'all' ? total : shown);
    if (countNote) {
      countNote.textContent = currentFilter === 'all'
        ? (total === 1 ? 'proof in the folder' : 'proofs in the folder')
        : 'of ' + total + ' proofs shown';
    }
  }

  /* The shelf is one row that snaps, not a wall that lengthens the page. These
     controls move the same scroll container the finger and trackpad move, and
     the count follows whichever card is nearest the left edge. */
  function updateRail() {
    if (!controls || !railPrev || !railNext || !railCount) return;
    var items = visibleItems();
    if (!items.length) {
      controls.hidden = true;
      return;
    }
    controls.hidden = false;
    var pad = parseFloat(window.getComputedStyle(grid).paddingLeft) || 0;
    var start = grid.getBoundingClientRect().left + pad;
    var nearest = 0;
    var best = Infinity;
    items.forEach(function (item, index) {
      var distance = Math.abs(item.getBoundingClientRect().left - start);
      if (distance < best) { best = distance; nearest = index; }
    });
    railPrev.disabled = nearest === 0;
    railNext.disabled = nearest === items.length - 1;
    railCount.textContent = (nearest < 9 ? '0' : '') + (nearest + 1) + ' / ' +
      (items.length < 10 ? '0' : '') + items.length;
    railCount.setAttribute('aria-label', 'Proof ' + (nearest + 1) + ' of ' + items.length);
  }

  function moveRail(delta) {
    var items = visibleItems();
    if (!items.length) return;
    var pad = parseFloat(window.getComputedStyle(grid).paddingLeft) || 0;
    var start = grid.getBoundingClientRect().left + pad;
    var nearest = 0;
    var best = Infinity;
    items.forEach(function (item, index) {
      var distance = Math.abs(item.getBoundingClientRect().left - start);
      if (distance < best) { best = distance; nearest = index; }
    });
    var target = items[Math.max(0, Math.min(items.length - 1, nearest + delta))];
    var left = grid.scrollLeft + target.getBoundingClientRect().left - grid.getBoundingClientRect().left - pad;
    var reduce = document.documentElement.getAttribute('data-motion') === 'reduce';
    grid.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
  }

  function show(filterName) {
    currentFilter = filterName;
    grid.setAttribute('data-filter', currentFilter);
    Array.prototype.forEach.call(grid.children, function (item) {
      item.hidden = currentFilter !== 'all' && item.getAttribute('data-kind') !== currentFilter;
    });
    grid.scrollLeft = 0;
    filters.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-filter') === currentFilter));
    });
    numberItems();
    updateCount();
    updateRail();
  }

  function filter() {
    filters.forEach(function (button) {
      button.addEventListener('click', function () {
        show(button.getAttribute('data-filter'));
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
    if (count) count.textContent = '…';
    if (countNote) countNote.textContent = 'the folder could not be read';
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
    if (count) count.textContent = '…';
    if (countNote) countNote.textContent = 'reading the folder';

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
              var newA = newRank(a.name);
              var newB = newRank(b.name);
              var clipA = VIDEO.test(a.name) ? 1 : 0;
              var clipB = VIDEO.test(b.name) ? 1 : 0;
              return newA - newB || clipA - clipB ||
                a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' });
            });
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), files: files }));
          } catch (error) { /* a browser that refuses storage still gets the shelf */ }
          render(files);
        })
        .catch(failed);
    });
  }

  if (controls && railPrev && railNext) {
    var railQueued = 0;
    railPrev.addEventListener('click', function () { moveRail(-1); });
    railNext.addEventListener('click', function () { moveRail(1); });
    grid.addEventListener('scroll', function () {
      if (railQueued) return;
      railQueued = window.requestAnimationFrame(function () {
        railQueued = 0;
        updateRail();
      });
    }, { passive: true });
    window.addEventListener('resize', function () {
      if (railQueued) return;
      railQueued = window.requestAnimationFrame(function () {
        railQueued = 0;
        updateRail();
      });
    }, { passive: true });
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

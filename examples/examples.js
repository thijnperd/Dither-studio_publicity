/* The examples shelf.
   It reads the folder it lives in through GitHub's contents API, so adding a
   file to examples/ and pushing is the whole workflow: no manifest to edit and
   no list that can fall out of step with the folder. */

(function () {
  'use strict';

  var REPO = 'thijnperd/Dither-studio_publicity';
  var DIR = 'examples';
  var IMAGE = /\.(avif|gif|jpe?g|png|webp)$/i;
  var VIDEO = /\.(mp4|mov|webm)$/i;
  var CACHE_KEY = 'dither:shelf:v1';
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

  var grid = document.getElementById('shelf-grid');
  var note = document.getElementById('shelf-status');
  var count = document.getElementById('shelf-count');
  var filters = Array.prototype.slice.call(document.querySelectorAll('.library__filters [data-filter]'));
  var feature = document.querySelector('[data-feature]');
  var featureImage = document.querySelector('[data-feature-image]');
  var featureVideo = document.querySelector('[data-feature-video]');
  var featureTitle = document.querySelector('[data-feature-title]');
  var featureNote = document.querySelector('[data-feature-note]');
  var featureSpec = document.querySelector('[data-feature-spec]');
  var featureKind = document.querySelector('[data-feature-kind]');
  var featureLinks = Array.prototype.slice.call(document.querySelectorAll('[data-feature-link]'));
  if (!grid || !note) return;

  var total = 0;
  var CAPTIONS = {};
  var currentFilter = 'all';
  var hasFeature = false;

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

  function featureCaption(file) {
    return CAPTIONS[file.name] || CAPTIONS[file.name.replace(/\.[^.]+$/, '')] || '';
  }

  function showFeature() {
    if (!feature) return;
    feature.hidden = !hasFeature || currentFilter === 'motion';
  }

  function setFeature(list) {
    if (!feature || !featureImage || !featureVideo) return;
    var file = list.filter(function (entry) { return !VIDEO.test(entry.name); })[0] || list[0];

    if (!file) {
      hasFeature = false;
      feature.hidden = true;
      return;
    }

    var kind = VIDEO.test(file.name) ? 'motion' : 'still';
    var name = displayTitle(file.name);
    var copy = featureCaption(file);

    hasFeature = true;
    showFeature();

    featureLinks.forEach(function (link) {
      link.href = file.download_url;
      link.setAttribute('aria-label', name + ', open the full file');
    });

    if (featureTitle) featureTitle.textContent = name;
    if (featureNote) {
      featureNote.textContent = copy || 'The first file in the folder, printed by the app’s own engine.';
    }
    if (featureKind) featureKind.textContent = kind === 'motion' ? 'Motion' : 'Still';
    if (featureSpec) {
      featureSpec.textContent = extension(file.name) + ' · ' + weight(file.size);
    }

    featureImage.hidden = kind === 'motion';
    featureVideo.hidden = kind !== 'motion';

    if (kind === 'motion') {
      featureVideo.src = file.download_url;
      featureVideo.setAttribute('aria-label', name + ', motion proof');
      var metadata = function () {
        if (featureSpec && featureVideo.videoWidth) {
          featureSpec.textContent = extension(file.name) + ' · ' + featureVideo.videoWidth + ' × ' + featureVideo.videoHeight + ' · ' + weight(file.size);
        }
      };
      featureVideo.addEventListener('loadedmetadata', metadata, { once: true });
      featureVideo.play().catch(function () { /* a browser that refuses autoplay still shows the first frame */ });
    } else {
      featureImage.hidden = false;
      featureImage.alt = name + ', a proof from the examples folder';
      featureImage.src = file.download_url;
      featureImage.addEventListener('load', function () {
        if (featureSpec && featureImage.naturalWidth) {
          featureSpec.textContent = extension(file.name) + ' · ' + featureImage.naturalWidth + ' × ' + featureImage.naturalHeight + ' · ' + weight(file.size);
        }
      }, { once: true });
    }
  }

  function render(list) {
    total = list.length;

    if (!total) {
      hasFeature = false;
      if (feature) feature.hidden = true;
      note.hidden = false;
      note.textContent = 'The shelf is empty. Drop a still or a clip into examples/ and push it.';
      count.textContent = '';
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

    setFeature(list);
    grid.textContent = '';

    var shelf = document.createDocumentFragment();

    list.forEach(function (file) {
      var kind = VIDEO.test(file.name) ? 'motion' : 'still';

      var item = document.createElement('li');
      item.className = 'shelf__item';
      item.setAttribute('data-kind', kind);

      var link = document.createElement('a');
      link.className = 'shelf__link';
      link.href = file.download_url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('aria-label', displayTitle(file.name) + ', open the full file');

      var plate = document.createElement('span');
      plate.className = 'shelf__plate';

      var media;
      if (kind === 'motion') {
        media = document.createElement('video');
        media.muted = true;
        media.playsInline = true;
        media.preload = 'metadata';
        media.setAttribute('aria-hidden', 'true');
        media.src = file.download_url;
      } else {
        media = document.createElement('img');
        media.alt = '';
        media.loading = 'lazy';
        media.decoding = 'async';
        media.src = file.download_url;
      }
      plate.appendChild(media);

      var tag = document.createElement('span');
      tag.className = 'shelf__tag';
      tag.textContent = kind === 'motion' ? 'Motion' : 'Still';
      plate.appendChild(tag);

      var meta = document.createElement('span');
      meta.className = 'shelf__meta';
      var name = document.createElement('b');
      name.textContent = displayTitle(file.name);
      var spec = document.createElement('span');
      spec.className = 'shelf__spec';
      spec.textContent = extension(file.name) + ' · ' + weight(file.size);
      meta.appendChild(name);
      meta.appendChild(spec);

      var captionLine = featureCaption(file);
      if (captionLine) {
        var noteLine = document.createElement('span');
        noteLine.className = 'shelf__note';
        noteLine.textContent = captionLine;
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
    note.hidden = true;
    count.textContent = total + (total === 1 ? ' proof' : ' proofs') + ' on the shelf';
  }

  function show(list) {
    render(list);
    filters.forEach(function (button) {
      button.addEventListener('click', function () {
        var want = button.getAttribute('data-filter');
        currentFilter = want;
        grid.setAttribute('data-filter', want);
        filters.forEach(function (other) {
          other.setAttribute('aria-pressed', String(other === button));
        });
        showFeature();
        var shown = want === 'all' ? total : grid.querySelectorAll('[data-kind="' + want + '"]').length;
        count.textContent = shown + ' of ' + total + ' shown';
        note.hidden = total > 0;
      });
    });
  }

  function failed(error) {
    note.hidden = false;
    note.textContent = '';
    note.appendChild(document.createTextNode('The shelf could not be read (' + error.message + '). '));
    var link = document.createElement('a');
    link.href = 'https://github.com/' + REPO + '/tree/main/' + DIR;
    link.textContent = 'Open the folder on GitHub';
    note.appendChild(link);
    if (feature) feature.hidden = true;
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
    return fetch('captions.json', { cache: 'no-store' })
      .then(function (response) { return response.ok ? response.json() : {}; })
      .catch(function () { return {}; });
  }

  readCaptions().then(function (map) {
    CAPTIONS = map && typeof map === 'object' ? map : {};

    var held = cached();
    if (held) {
      show(held);
      return;
    }

    fetch('https://api.github.com/repos/' + REPO + '/contents/' + DIR + '?ref=main', {
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
            return entry.type === 'file' && (IMAGE.test(entry.name) || VIDEO.test(entry.name));
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
        show(files);
      })
      .catch(failed);
  });
})();

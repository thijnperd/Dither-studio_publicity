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

  var grid = document.getElementById('shelf-grid');
  var note = document.getElementById('shelf-status');
  var count = document.getElementById('shelf-count');
  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  if (!grid || !note) return;

  var total = 0;

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

  function render(list) {
    total = list.length;

    if (!total) {
      note.hidden = false;
      note.textContent = 'The shelf is empty. Drop a still or a clip into examples/ and push it.';
      count.textContent = '';
      return;
    }

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
      link.setAttribute('aria-label', caption(file.name) + ', open the full file');

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
      name.textContent = caption(file.name);
      var spec = document.createElement('span');
      spec.className = 'shelf__spec';
      spec.textContent = extension(file.name) + ' · ' + weight(file.size);
      meta.appendChild(name);
      meta.appendChild(spec);

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
        grid.setAttribute('data-filter', want);
        filters.forEach(function (other) {
          other.setAttribute('aria-pressed', String(other === button));
        });
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
          return a.name.localeCompare(b.name, 'en', { numeric: true });
        });
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), files: files }));
      } catch (error) { /* a browser that refuses storage still gets the shelf */ }
      show(files);
    })
    .catch(failed);
})();

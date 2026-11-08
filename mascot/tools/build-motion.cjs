'use strict';

/* Build the animated Mote from the untouched master.
   The only difference the build may make is the <style> block. Every path,
   paint value and ID in the master has to survive it. */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const masterPath = path.join(root, 'mote-master.svg');
const outPath = path.join(root, 'mote.svg');
const master = fs.readFileSync(masterPath, 'utf8');

const motion = String.raw`
    #mote {
      animation: mote-arrive 900ms cubic-bezier(.23, 1, .32, 1) both;
      transform-box: view-box;
      transform-origin: 320px 560px;
    }
    #mote-body-group {
      animation: mote-breathe 5.2s cubic-bezier(.4, 0, .2, 1) infinite;
      transform-box: view-box;
      transform-origin: 320px 560px;
    }
    #mote-ground {
      animation: mote-ground 5.2s cubic-bezier(.4, 0, .2, 1) infinite;
    }
    #mote-eye {
      animation: mote-blink 4.8s cubic-bezier(.4, 0, .2, 1) 2.4s infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    #mote-loupe {
      animation: mote-loupe 6.4s cubic-bezier(.4, 0, .2, 1) infinite;
      transform-box: view-box;
      transform-origin: 407px 267px;
    }
    #mote-spark {
      animation: mote-pixel 3.6s cubic-bezier(.4, 0, .2, 1) infinite;
      transform-box: view-box;
      transform-origin: 184px 140px;
    }
    @keyframes mote-arrive {
      from { opacity: 0; transform: translateY(14px) scale(.985); }
      to   { opacity: 1; transform: none; }
    }
    @keyframes mote-breathe {
      0%, 100% { transform: scale(1); }
      48%      { transform: scale(1.004, 1.01); }
      70%      { transform: scale(.999, .997); }
    }
    @keyframes mote-ground {
      0%, 100% { opacity: .75; }
      48%      { opacity: .62; }
      70%      { opacity: .78; }
    }
    @keyframes mote-blink {
      0%, 91%, 100% { transform: scaleY(1); }
      93.5%, 96%    { transform: scaleY(.08); }
    }
    @keyframes mote-loupe {
      0%, 35%, 100% { transform: translate(0, 0) rotate(0); }
      48%           { transform: translate(-1px, -1px) rotate(-1.4deg); }
      61%           { transform: translate(1px, 1px) rotate(.7deg); }
      74%           { transform: translate(0, 0) rotate(0); }
    }
    @keyframes mote-pixel {
      0%, 100% { transform: translate(0, 0) rotate(-7deg); opacity: 1; }
      50%      { transform: translate(2px, -6px) rotate(-4deg); opacity: .82; }
    }
    @media (prefers-reduced-motion: reduce) {
      #mote, #mote-body-group, #mote-ground, #mote-eye,
      #mote-loupe, #mote-spark { animation: none !important; }
    }
`;

const style = `  <style>\n${motion}  </style>\n`;
const animated = master.replace('</svg>', `${style}</svg>`);
assert.notStrictEqual(animated, master, 'the style block was not injected');

function geometry(svg) {
  return [...svg.matchAll(/\sd="([^"]+)"/g)].map((match) => match[1]);
}
function paints(svg) {
  return [...svg.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g)].map((match) => match[1].toUpperCase());
}
function ids(svg) {
  return [...svg.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
}

assert.deepStrictEqual(geometry(animated), geometry(master), 'a path changed');
assert.deepStrictEqual(paints(animated), paints(master), 'a paint value changed');
assert.deepStrictEqual(ids(animated), ids(master), 'an ID changed');

fs.writeFileSync(outPath, animated);
console.log(`mote.svg written: ${geometry(master).length} paths, ${paints(master).length} paint values, ${ids(master).length} IDs preserved.`);

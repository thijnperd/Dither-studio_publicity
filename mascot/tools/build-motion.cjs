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
      transform-origin: 256px 450px;
    }
    #mote-core {
      animation: mote-breathe 5.2s cubic-bezier(.4, 0, .2, 1) infinite;
      transform-box: view-box;
      transform-origin: 256px 440px;
    }
    #mote-shadow {
      animation: mote-shadow 5.2s cubic-bezier(.4, 0, .2, 1) infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    #mote-eye-left,
    #mote-eye-right {
      animation: mote-blink 4.8s cubic-bezier(.4, 0, .2, 1) 2.4s infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    #mote-right-rig {
      animation: mote-loupe 6.4s cubic-bezier(.4, 0, .2, 1) infinite;
      transform-box: view-box;
      transform-origin: 354px 324px;
    }
    #mote-spark {
      animation: mote-pixel 3.6s cubic-bezier(.4, 0, .2, 1) infinite;
      transform-box: view-box;
      transform-origin: 365px 148px;
    }
    @keyframes mote-arrive {
      from { opacity: 0; transform: translateY(14px) scale(.985); }
      to   { opacity: 1; transform: none; }
    }
    @keyframes mote-breathe {
      0%, 100% { transform: scale(1); }
      48%      { transform: scale(1.006, 1.012); }
      70%      { transform: scale(.998, .996); }
    }
    @keyframes mote-shadow {
      0%, 100% { transform: scaleX(1); opacity: .42; }
      48%      { transform: scaleX(1.035); opacity: .36; }
      70%      { transform: scaleX(.99); opacity: .44; }
    }
    @keyframes mote-blink {
      0%, 91%, 100% { transform: scaleY(1); }
      93.5%, 96%    { transform: scaleY(.08); }
    }
    @keyframes mote-loupe {
      0%, 40%, 100% { transform: rotate(0) translateY(0); }
      50%           { transform: rotate(1.2deg) translateY(-2px); }
      62%           { transform: rotate(-.8deg) translateY(1px); }
      74%           { transform: rotate(.4deg) translateY(0); }
    }
    @keyframes mote-pixel {
      0%, 100% { transform: translateY(0); opacity: 1; }
      50%      { transform: translateY(-6px); opacity: .85; }
    }
    @media (prefers-reduced-motion: reduce) {
      #mote, #mote-core, #mote-shadow, #mote-eye-left, #mote-eye-right,
      #mote-right-rig, #mote-spark { animation: none !important; }
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

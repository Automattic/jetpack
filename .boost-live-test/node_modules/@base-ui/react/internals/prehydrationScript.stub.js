"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.script = void 0;
// Shared browser-bundle replacement for the per-component `prehydrationScript.min.ts` files,
// selected via the `browser` condition of every `#prehydration/*` entry in package.json
// `imports`. The real scripts only ever execute from server-rendered HTML, so client bundles
// don't need their contents. See `internals/PrehydrationScript.tsx` for why an empty script is
// still rendered during hydration.
const script = exports.script = '';
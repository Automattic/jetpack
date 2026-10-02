"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_SIDES = void 0;
const DEFAULT_SIDES = exports.DEFAULT_SIDES = {
  sideX: 'left',
  sideY: 'top'
};

// Self-contained stand-in for Floating UI's `Middleware` type. Referencing the real type in
// store state makes `tsc` declaration emit reference `Platform`/`detectOverflow` from
// `@floating-ui/core` internals, which fails as non-portable (TS2883) in consuming builds.
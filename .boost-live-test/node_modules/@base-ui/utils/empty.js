"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EMPTY_OBJECT = exports.EMPTY_ARRAY = void 0;
exports.NOOP = NOOP;
function NOOP() {}

// Typed as mutable `never[]` so it is assignable to any `T[]` fallback (for example
// `defaultValue ?? EMPTY_ARRAY` in `useControlled` callers) without widening `T`.
// Frozen so a write through a widened alias throws instead of mutating the shared singleton.
const EMPTY_ARRAY = exports.EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = exports.EMPTY_OBJECT = Object.freeze({});
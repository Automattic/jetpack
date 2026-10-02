"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IdleCallback = void 0;
exports.useIdleCallback = useIdleCallback;
var _useRefWithInit = require("./useRefWithInit");
var _useOnMount = require("./useOnMount");
const supportsIdleCallback = typeof requestIdleCallback === 'function';

// Macrotask fallback for environments without `requestIdleCallback` (e.g. older Safari).
// It runs after the current task (and thus the current commit), but — unlike
// `requestIdleCallback` — is not guaranteed to run after the next paint.
const requestCallback = supportsIdleCallback ? requestIdleCallback : fn => setTimeout(fn, 0);
const cancelCallback = supportsIdleCallback ? cancelIdleCallback : clearTimeout;
class IdleCallback {
  static create() {
    return new IdleCallback();
  }
  currentId = null;

  /**
   * Schedules `fn` to run asynchronously after the current task (and thus the current commit),
   * clearing any previously scheduled call. With native `requestIdleCallback` the callback runs
   * during idle time after the next paint; the `setTimeout(0)` fallback runs after the current task
   * but is not guaranteed to run after the next paint.
   */
  start(fn) {
    this.clear();
    this.currentId = requestCallback(() => {
      this.currentId = null;
      fn();
    });
  }
  clear = () => {
    if (this.currentId !== null) {
      cancelCallback(this.currentId);
      this.currentId = null;
    }
  };
  disposeEffect = () => {
    return this.clear;
  };
}

/**
 * A `requestIdleCallback` with automatic cleanup and guard, mirroring `useTimeout`.
 *
 * Returns an imperative scheduler that runs a callback during idle time, after the current commit
 * and paint. In environments without `requestIdleCallback` it falls back to a macrotask
 * (`setTimeout(0)`), which runs after the current commit but is not guaranteed to run after the
 * next paint.
 */
exports.IdleCallback = IdleCallback;
function useIdleCallback() {
  const idleCallback = (0, _useRefWithInit.useRefWithInit)(IdleCallback.create).current;
  (0, _useOnMount.useOnMount)(idleCallback.disposeEffect);
  return idleCallback;
}
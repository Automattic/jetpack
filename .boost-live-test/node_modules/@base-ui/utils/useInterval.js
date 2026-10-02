"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Interval = void 0;
exports.useInterval = useInterval;
var _useRefWithInit = require("./useRefWithInit");
var _useOnMount = require("./useOnMount");
var _useTimeout = require("./useTimeout");
const EMPTY = 0;
class Interval extends _useTimeout.Timeout {
  static create() {
    return new Interval();
  }

  /**
   * Executes `fn` at `delay` interval, clearing any previously scheduled call.
   */
  start(delay, fn) {
    this.clear();
    this.currentId = setInterval(() => {
      fn();
    }, delay);
  }
  clear = () => {
    if (this.currentId !== EMPTY) {
      clearInterval(this.currentId);
      this.currentId = EMPTY;
    }
  };
}

/**
 * A `setInterval` with automatic cleanup and guard.
 */
exports.Interval = Interval;
function useInterval() {
  const timeout = (0, _useRefWithInit.useRefWithInit)(Interval.create).current;
  (0, _useOnMount.useOnMount)(timeout.disposeEffect);
  return timeout;
}
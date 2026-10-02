"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Timeout = void 0;
exports.useTimeout = useTimeout;
var _useRefWithInit = require("./useRefWithInit");
var _useOnMount = require("./useOnMount");
const EMPTY = 0;
class Timeout {
  static create() {
    return new Timeout();
  }
  currentId = EMPTY;

  /**
   * Executes `fn` after `delay`, clearing any previously scheduled call.
   */
  start(delay, fn) {
    this.clear();
    this.currentId = setTimeout(() => {
      this.currentId = EMPTY;
      fn();
    }, delay); /* Node.js types are enabled in development */
  }
  isStarted() {
    return this.currentId !== EMPTY;
  }
  clear = () => {
    if (this.currentId !== EMPTY) {
      clearTimeout(this.currentId);
      this.currentId = EMPTY;
    }
  };
  disposeEffect = () => {
    return this.clear;
  };
}

/**
 * A `setTimeout` with automatic cleanup and guard.
 */
exports.Timeout = Timeout;
function useTimeout() {
  const timeout = (0, _useRefWithInit.useRefWithInit)(Timeout.create).current;
  (0, _useOnMount.useOnMount)(timeout.disposeEffect);
  return timeout;
}
'use client';

import { useRefWithInit } from "./useRefWithInit.mjs";
import { useOnMount } from "./useOnMount.mjs";
import { Timeout } from "./useTimeout.mjs";
const EMPTY = 0;
export class Interval extends Timeout {
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
export function useInterval() {
  const timeout = useRefWithInit(Interval.create).current;
  useOnMount(timeout.disposeEffect);
  return timeout;
}
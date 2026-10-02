"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mergeCleanups = mergeCleanups;
/**
 * Combines multiple cleanup functions into a single cleanup function.
 */
function mergeCleanups(...cleanups) {
  return () => {
    for (let i = 0; i < cleanups.length; i += 1) {
      const cleanup = cleanups[i];
      if (cleanup) {
        cleanup();
      }
    }
  };
}
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolvePromiseOptions = resolvePromiseOptions;
function resolvePromiseOptions(options, result) {
  if (typeof options === 'string') {
    return {
      description: options
    };
  }
  if (typeof options === 'function') {
    const resolvedOptions = options(result);
    return typeof resolvedOptions === 'string' ? {
      description: resolvedOptions
    } : resolvedOptions;
  }
  return options;
}
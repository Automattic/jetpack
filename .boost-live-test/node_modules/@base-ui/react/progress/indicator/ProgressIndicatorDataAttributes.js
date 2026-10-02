"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.progressing = exports.indeterminate = exports.complete = void 0;
/**
 * Present when the progress has completed.
 */
const complete = exports.complete = 'data-complete';
/**
 * Present when the progress is in indeterminate state.
 */
const indeterminate = exports.indeterminate = 'data-indeterminate';
/**
 * Present while the progress is progressing.
 */
const progressing = exports.progressing = 'data-progressing';
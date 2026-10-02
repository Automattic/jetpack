"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TYPEABLE_SELECTOR = exports.SELECTED_KEY = exports.FOCUSABLE_ATTRIBUTE = exports.ARROW_UP = exports.ARROW_RIGHT = exports.ARROW_LEFT = exports.ARROW_DOWN = exports.ACTIVE_KEY = void 0;
const FOCUSABLE_ATTRIBUTE = exports.FOCUSABLE_ATTRIBUTE = 'data-base-ui-focusable';
const ACTIVE_KEY = exports.ACTIVE_KEY = 'active';
const SELECTED_KEY = exports.SELECTED_KEY = 'selected';
const TYPEABLE_SELECTOR = exports.TYPEABLE_SELECTOR = "input:not([type='hidden']):not([disabled])," + "[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
const ARROW_LEFT = exports.ARROW_LEFT = 'ArrowLeft';
const ARROW_RIGHT = exports.ARROW_RIGHT = 'ArrowRight';
const ARROW_UP = exports.ARROW_UP = 'ArrowUp';
const ARROW_DOWN = exports.ARROW_DOWN = 'ArrowDown';
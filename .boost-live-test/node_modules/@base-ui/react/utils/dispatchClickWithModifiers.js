"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dispatchClickWithModifiers = dispatchClickWithModifiers;
var _owner = require("@base-ui/utils/owner");
/**
 * Dispatches a constructed click on the target so it carries the source event's
 * modifier state, which `click()` always reports as unpressed. Like `click()`,
 * the untrusted click still runs native activation behavior (form submission,
 * link navigation).
 * `detail` defaults to 0 (the native convention for keyboard-generated clicks);
 * pass `detail: 1` when the click represents a mouse gesture so consumers keying
 * off `detail === 0` don't classify it as a keyboard activation.
 */
function dispatchClickWithModifiers(target, sourceEvent, {
  detail = 0
} = {}) {
  target.dispatchEvent(new ((0, _owner.ownerWindow)(target).PointerEvent)('click', {
    bubbles: true,
    cancelable: true,
    composed: true,
    detail,
    shiftKey: sourceEvent.shiftKey,
    ctrlKey: sourceEvent.ctrlKey,
    altKey: sourceEvent.altKey,
    metaKey: sourceEvent.metaKey
  }));
}
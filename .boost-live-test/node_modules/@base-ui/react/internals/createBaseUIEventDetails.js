"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createChangeEventDetails = createChangeEventDetails;
exports.createGenericEventDetails = createGenericEventDetails;
var _empty = require("@base-ui/utils/empty");
var _reasons = require("./reasons");
/**
 * Maps a change `reason` string to the corresponding native event type.
 */

/**
 * Details of custom change events emitted by Base UI components.
 */

/**
 * Details of custom generic events emitted by Base UI components.
 */

/**
 * Creates a Base UI event details object with the given reason and utilities
 * for preventing Base UI's internal event handling.
 */
function createChangeEventDetails(reason, event, trigger, customProperties) {
  let canceled = false;
  let allowPropagation = false;
  const custom = customProperties ?? _empty.EMPTY_OBJECT;
  const details = {
    reason,
    event: event ?? new Event('base-ui'),
    cancel() {
      canceled = true;
    },
    allowPropagation() {
      allowPropagation = true;
    },
    get isCanceled() {
      return canceled;
    },
    get isPropagationAllowed() {
      return allowPropagation;
    },
    trigger,
    ...custom
  };
  return details;
}
function createGenericEventDetails(reason, event, customProperties) {
  const custom = customProperties ?? _empty.EMPTY_OBJECT;
  const details = {
    reason,
    event: event ?? new Event('base-ui'),
    ...custom
  };
  return details;
}
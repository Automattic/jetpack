"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startingStyle = exports.orientation = exports.index = exports.hidden = exports.endingStyle = exports.activationDirection = void 0;
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
/**
 * Indicates the index of the tab panel.
 */
const index = exports.index = 'data-index';
/**
 * Indicates the direction of the activation (based on the previous active tab).
 * @type {'left' | 'right' | 'up' | 'down' | 'none'}
 */
const activationDirection = exports.activationDirection = 'data-activation-direction';
/**
 * Indicates the orientation of the tabs.
 * @type {'horizontal' | 'vertical'}
 */
const orientation = exports.orientation = 'data-orientation';
/**
 * Present when the panel is hidden.
 */
const hidden = exports.hidden = 'data-hidden';
/**
 * Present when the panel begins animating in.
 */
const startingStyle = exports.startingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the panel is animating out.
 */
const endingStyle = exports.endingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.endingStyle;
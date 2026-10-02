"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startingStyle = exports.side = exports.open = exports.endingStyle = exports.closed = exports.anchorHidden = exports.align = void 0;
var TransitionStatusDataAttributes = _interopRequireWildcard(require("../internals/TransitionStatusDataAttributes"));
/**
 * Present when the popup is open.
 */
const open = exports.open = 'data-open';

/**
 * Present when the popup is closed.
 */
const closed = exports.closed = 'data-closed';

/**
 * Present when the popup begins animating in.
 */
const startingStyle = exports.startingStyle = TransitionStatusDataAttributes.startingStyle;

/**
 * Present when the popup is animating out.
 */
const endingStyle = exports.endingStyle = TransitionStatusDataAttributes.endingStyle;

/**
 * Present when the anchor is hidden.
 */
const anchorHidden = exports.anchorHidden = 'data-anchor-hidden';

/**
 * Indicates which side the popup is positioned relative to the trigger.
 * @type { 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
 */
const side = exports.side = 'data-side';

/**
 * Indicates how the popup is aligned relative to specified side.
 * @type {'start' | 'center' | 'end'}
 */
const align = exports.align = 'data-align';
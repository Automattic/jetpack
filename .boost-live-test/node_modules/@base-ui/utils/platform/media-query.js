"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.iOS = void 0;
// Check support status at:
// https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariCSSRef/Articles/StandardCSSProperties.html
/** CSS `@supports` query matching iOS/iPadOS WebKit browsers. */
const iOS = exports.iOS = '@supports (-webkit-touch-callout: none)';
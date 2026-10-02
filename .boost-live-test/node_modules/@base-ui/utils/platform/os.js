"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.windows = exports.mac = exports.linux = exports.ios = exports.apple = exports.android = void 0;
var _shared = require("./shared");
// iPadOS 13+ reports `MacIntel` for `navigator.platform`; disambiguated via
// `maxTouchPoints` so iPad is classified as iOS, not macOS.
// https://github.com/mui/base-ui/issues/1309
/** iPhone, iPad (including iPadOS 13+ reporting as macOS), iPod. */
const ios = exports.ios = /^i(os$|p)/.test(_shared.lowerPlatform) || _shared.lowerPlatform === 'macintel' && _shared.maxTouchPoints > 1;

/** Android phones, tablets, and embedded Android browsers. */
const ANDROID_STRING = 'android';
const android = exports.android = _shared.lowerPlatform === ANDROID_STRING || _shared.lowerUserAgent.includes(ANDROID_STRING);

/** macOS desktop. Excludes iPadOS, which reports as `MacIntel`. */
const mac = exports.mac = !ios && _shared.lowerPlatform.startsWith('mac');

/** Windows desktop. */
const windows = exports.windows = _shared.lowerPlatform.startsWith('win');

/** Linux desktop (including Chrome OS). */
const linux = exports.linux = !android && /^(linux|chrome os)/.test(_shared.lowerPlatform);

/** Any Apple OS (`mac || ios`). */
const apple = exports.apple = mac || ios;
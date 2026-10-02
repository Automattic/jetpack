"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.jsdom = void 0;
var _shared = require("./shared");
/** Running in jsdom or HappyDOM (used by unit tests). */
const jsdom = exports.jsdom = /jsdom|happydom/.test(_shared.lowerUserAgent);
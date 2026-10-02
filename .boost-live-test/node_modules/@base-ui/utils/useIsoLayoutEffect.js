"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useIsoLayoutEffect = void 0;
var React = _interopRequireWildcard(require("react"));
const noop = () => {};
const useIsoLayoutEffect = exports.useIsoLayoutEffect = typeof document !== 'undefined' ? React.useLayoutEffect : noop;
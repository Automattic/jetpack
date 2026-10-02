"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.visuallyHiddenInput = exports.visuallyHidden = void 0;
const visuallyHiddenBase = {
  clipPath: 'inset(50%)',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  border: 0,
  padding: 0,
  width: 1,
  height: 1,
  margin: -1
};
const visuallyHidden = exports.visuallyHidden = {
  ...visuallyHiddenBase,
  position: 'fixed',
  top: 0,
  left: 0
};
const visuallyHiddenInput = exports.visuallyHiddenInput = {
  ...visuallyHiddenBase,
  position: 'absolute'
};
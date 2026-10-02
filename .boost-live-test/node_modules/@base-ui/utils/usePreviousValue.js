"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.usePreviousValue = usePreviousValue;
var React = _interopRequireWildcard(require("react"));
/**
 * Returns a previous value of its argument.
 * @param value Current value.
 * @returns Previous value, or null if there is no previous value.
 */
function usePreviousValue(value) {
  const [state, setState] = React.useState({
    current: value,
    previous: null
  });
  if (!Object.is(value, state.current)) {
    setState({
      current: value,
      previous: state.current
    });
  }
  return state.previous;
}
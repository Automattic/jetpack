"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useValueAsRef = useValueAsRef;
var _useIsoLayoutEffect = require("./useIsoLayoutEffect");
var _useRefWithInit = require("./useRefWithInit");
/**
 * Untracks the provided value by turning it into a ref to remove its reactivity.
 *
 * Used to access the passed value inside `React.useEffect` without causing the effect to re-run when the value changes.
 */
function useValueAsRef(value) {
  const latest = (0, _useRefWithInit.useRefWithInit)(createLatestRef, value).current;
  latest.next = value;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(latest.effect);
  return latest;
}
function createLatestRef(value) {
  const latest = {
    current: value,
    next: value,
    effect: () => {
      latest.current = latest.next;
    }
  };
  return latest;
}
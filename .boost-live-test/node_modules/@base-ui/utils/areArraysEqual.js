"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.areArraysEqual = areArraysEqual;
// https://github.com/mui/mui-x/blob/master/packages/x-internals/src/fastArrayCompare/fastArrayCompare.ts

/**
 * Compares two arrays element-wise.
 *
 * The default comparison is `Object.is`, so `NaN` equals `NaN` and `0` does not equal `-0`.
 */
function areArraysEqual(array1, array2, itemComparer = Object.is) {
  const {
    length
  } = array1;
  if (length !== array2.length) {
    return false;
  }
  for (let i = 0; i < length; i += 1) {
    if (!itemComparer(array1[i], array2[i])) {
      return false;
    }
  }
  return true;
}
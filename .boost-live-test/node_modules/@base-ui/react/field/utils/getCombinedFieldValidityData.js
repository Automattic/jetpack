"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCombinedFieldValidityData = getCombinedFieldValidityData;
/**
 * Combines the field's client-side, stateful validity data with the external invalid state to
 * determine the field's true validity.
 */
function getCombinedFieldValidityData(validityData, invalid) {
  return {
    ...validityData,
    state: {
      ...validityData.state,
      valid: !invalid && validityData.state.valid
    }
  };
}
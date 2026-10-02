"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useBaseUiId = useBaseUiId;
var _useId = require("@base-ui/utils/useId");
/**
 * Wraps `useId` and prefixes generated `id`s with `base-ui-`
 * @param {string | undefined} idOverride overrides the generated id when provided
 * @returns {string | undefined}
 */
function useBaseUiId(idOverride) {
  return (0, _useId.useId)(idOverride, 'base-ui');
}
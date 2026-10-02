"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDefaultLabelId = getDefaultLabelId;
exports.resolveAriaLabelledBy = resolveAriaLabelledBy;
function getDefaultLabelId(id) {
  return id == null ? undefined : `${id}-label`;
}
function resolveAriaLabelledBy(fieldLabelId, localLabelId) {
  return fieldLabelId ?? localLabelId;
}
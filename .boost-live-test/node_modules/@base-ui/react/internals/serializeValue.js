"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.serializeValue = serializeValue;
function serializeValue(value) {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
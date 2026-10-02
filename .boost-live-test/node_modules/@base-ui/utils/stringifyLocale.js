"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stringifyLocale = stringifyLocale;
function stringifyLocale(locale) {
  if (Array.isArray(locale)) {
    return locale.map(value => stringifyLocale(value)).join(',');
  }
  if (locale == null) {
    return '';
  }
  return String(locale);
}
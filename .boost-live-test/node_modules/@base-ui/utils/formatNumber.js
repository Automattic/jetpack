"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatNumber = formatNumber;
exports.getFormatter = getFormatter;
var _stringifyLocale = require("./stringifyLocale");
const cache = new Map();
function getFormatter(locale, options) {
  const optionsString = JSON.stringify({
    locale: (0, _stringifyLocale.stringifyLocale)(locale),
    options
  });
  const cachedFormatter = cache.get(optionsString);
  if (cachedFormatter) {
    return cachedFormatter;
  }
  const formatter = new Intl.NumberFormat(locale, options);
  cache.set(optionsString, formatter);
  return formatter;
}
function formatNumber(value, locale, options) {
  if (value == null) {
    return '';
  }
  return getFormatter(locale, options).format(value);
}
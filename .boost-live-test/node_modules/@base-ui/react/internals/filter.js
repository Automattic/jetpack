"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFilter = getFilter;
var _stringifyLocale = require("@base-ui/utils/stringifyLocale");
var _resolveValueLabel = require("./resolveValueLabel");
const filterCache = new Map();
function getFilter(options = {}) {
  const mergedOptions = {
    usage: 'search',
    sensitivity: 'base',
    ignorePunctuation: true,
    ...options
  };
  const cacheKey = `${(0, _stringifyLocale.stringifyLocale)(options.locale)}|${JSON.stringify(mergedOptions)}`;
  const cachedFilter = filterCache.get(cacheKey);
  if (cachedFilter) {
    return cachedFilter;
  }
  const collator = new Intl.Collator(options.locale, mergedOptions);
  const filter = {
    contains(item, query, itemToString) {
      if (!query) {
        return true;
      }
      const itemString = (0, _resolveValueLabel.stringifyAsLabel)(item, itemToString);
      for (let i = 0; i <= itemString.length - query.length; i += 1) {
        if (collator.compare(itemString.slice(i, i + query.length), query) === 0) {
          return true;
        }
      }
      return false;
    },
    startsWith(item, query, itemToString) {
      if (!query) {
        return true;
      }
      const itemString = (0, _resolveValueLabel.stringifyAsLabel)(item, itemToString);
      return collator.compare(itemString.slice(0, query.length), query) === 0;
    },
    endsWith(item, query, itemToString) {
      if (!query) {
        return true;
      }
      const itemString = (0, _resolveValueLabel.stringifyAsLabel)(item, itemToString);
      const queryLength = query.length;
      return itemString.length >= queryLength && collator.compare(itemString.slice(itemString.length - queryLength), query) === 0;
    }
  };
  filterCache.set(cacheKey, filter);
  return filter;
}
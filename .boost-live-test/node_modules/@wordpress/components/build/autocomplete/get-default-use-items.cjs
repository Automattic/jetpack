"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/autocomplete/get-default-use-items.tsx
var get_default_use_items_exports = {};
__export(get_default_use_items_exports, {
  default: () => getDefaultUseItems
});
module.exports = __toCommonJS(get_default_use_items_exports);
var import_remove_accents = __toESM(require("remove-accents"));
var import_compose = require("@wordpress/compose");
var import_element = require("@wordpress/element");
var import_strings = require("../utils/strings.cjs");
function filterOptions(search, options = [], maxResults = 10) {
  const filtered = [];
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    let {
      keywords = []
    } = option;
    if ("string" === typeof option.label) {
      keywords = [...keywords, option.label];
    }
    const isMatch = keywords.some((keyword) => search.test((0, import_remove_accents.default)(keyword)));
    if (!isMatch) {
      continue;
    }
    filtered.push(option);
    if (filtered.length === maxResults) {
      break;
    }
  }
  return filtered;
}
function getDefaultUseItems(autocompleter) {
  return (filterValue) => {
    const [items, setItems] = (0, import_element.useState)([]);
    (0, import_element.useLayoutEffect)(() => {
      const {
        options,
        isDebounced
      } = autocompleter;
      const loadOptions = (0, import_compose.debounce)(() => {
        const promise2 = Promise.resolve(typeof options === "function" ? options(filterValue) : options).then((optionsData) => {
          if (promise2.canceled) {
            return;
          }
          const keyedOptions = optionsData.map((optionData, optionIndex) => ({
            key: `${autocompleter.name}-${optionIndex}`,
            value: optionData,
            label: autocompleter.getOptionLabel(optionData),
            keywords: autocompleter.getOptionKeywords ? autocompleter.getOptionKeywords(optionData) : [],
            isDisabled: autocompleter.isOptionDisabled ? autocompleter.isOptionDisabled(optionData) : false
          }));
          const search = new RegExp("(?:\\b|\\s|^)" + (0, import_strings.escapeRegExp)(filterValue), "i");
          setItems(filterOptions(search, keyedOptions));
        });
        return promise2;
      }, isDebounced ? 250 : 0);
      const promise = loadOptions();
      return () => {
        loadOptions.cancel();
        if (promise) {
          promise.canceled = true;
        }
      };
    }, [filterValue]);
    return [items];
  };
}
//# sourceMappingURL=get-default-use-items.cjs.map

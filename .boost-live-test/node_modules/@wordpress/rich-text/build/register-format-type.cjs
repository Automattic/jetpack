"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/rich-text/src/register-format-type.js
var register_format_type_exports = {};
__export(register_format_type_exports, {
  registerFormatType: () => registerFormatType
});
module.exports = __toCommonJS(register_format_type_exports);
var import_data = require("@wordpress/data");
var import_store = require("./store/index.cjs");
function registerFormatType(name, settings) {
  settings = {
    name,
    ...settings
  };
  if (typeof settings.name !== "string") {
    window.console.error("Format names must be strings.");
    return;
  }
  if (!/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test(settings.name)) {
    window.console.error(
      "Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format"
    );
    return;
  }
  if ((0, import_data.select)(import_store.store).getFormatType(settings.name)) {
    window.console.error(
      'Format "' + settings.name + '" is already registered.'
    );
    return;
  }
  if (typeof settings.tagName !== "string" || settings.tagName === "") {
    window.console.error("Format tag names must be a string.");
    return;
  }
  if ((typeof settings.className !== "string" || settings.className === "") && settings.className !== null) {
    window.console.error(
      "Format class names must be a string, or null to handle bare elements."
    );
    return;
  }
  if (!/^[_a-zA-Z]+[a-zA-Z0-9_-]*$/.test(settings.className)) {
    window.console.error(
      "A class name must begin with a letter, followed by any number of hyphens, underscores, letters, or numbers."
    );
    return;
  }
  if (settings.className === null) {
    const formatTypeForBareElement = (0, import_data.select)(
      import_store.store
    ).getFormatTypeForBareElement(settings.tagName);
    if (formatTypeForBareElement && formatTypeForBareElement.name !== "core/unknown") {
      window.console.error(
        `Format "${formatTypeForBareElement.name}" is already registered to handle bare tag name "${settings.tagName}".`
      );
      return;
    }
  } else {
    const formatTypeForClassName = (0, import_data.select)(
      import_store.store
    ).getFormatTypeForClassName(settings.className);
    if (formatTypeForClassName) {
      window.console.error(
        `Format "${formatTypeForClassName.name}" is already registered to handle class name "${settings.className}".`
      );
      return;
    }
  }
  if (!("title" in settings) || settings.title === "") {
    window.console.error(
      'The format "' + settings.name + '" must have a title.'
    );
    return;
  }
  if ("keywords" in settings && settings.keywords.length > 3) {
    window.console.error(
      'The format "' + settings.name + '" can have a maximum of 3 keywords.'
    );
    return;
  }
  if (typeof settings.title !== "string") {
    window.console.error("Format titles must be strings.");
    return;
  }
  (0, import_data.dispatch)(import_store.store).addFormatTypes(settings);
  return settings;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  registerFormatType
});
//# sourceMappingURL=register-format-type.cjs.map

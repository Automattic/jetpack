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

// packages/components/src/navigator/navigator-button/hook.ts
var hook_exports = {};
__export(hook_exports, {
  useNavigatorButton: () => useNavigatorButton
});
module.exports = __toCommonJS(hook_exports);
var import_element = require("@wordpress/element");
var import_escape_html = require("@wordpress/escape-html");
var import_context = require("../../context/index.cjs");
var import_button = __toESM(require("../../button/index.cjs"));
var import_use_navigator = require("../use-navigator.cjs");
var cssSelectorForAttribute = (attrName, attrValue) => `[${attrName}="${attrValue}"]`;
function useNavigatorButton(props) {
  const {
    path,
    onClick,
    as = import_button.default,
    attributeName = "id",
    ...otherProps
  } = (0, import_context.useContextSystem)(props, "Navigator.Button");
  const escapedPath = (0, import_escape_html.escapeAttribute)(path);
  const {
    goTo
  } = (0, import_use_navigator.useNavigator)();
  const handleClick = (0, import_element.useCallback)((e) => {
    e.preventDefault();
    goTo(escapedPath, {
      focusTargetSelector: cssSelectorForAttribute(attributeName, escapedPath)
    });
    onClick?.(e);
  }, [goTo, onClick, attributeName, escapedPath]);
  return {
    as,
    onClick: handleClick,
    ...otherProps,
    [attributeName]: escapedPath
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useNavigatorButton
});
//# sourceMappingURL=hook.cjs.map

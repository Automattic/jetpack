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

// packages/components/src/navigator/navigator-back-button/hook.ts
var hook_exports = {};
__export(hook_exports, {
  useNavigatorBackButton: () => useNavigatorBackButton
});
module.exports = __toCommonJS(hook_exports);
var import_element = require("@wordpress/element");
var import_context = require("../../context/index.cjs");
var import_button = __toESM(require("../../button/index.cjs"));
var import_use_navigator = require("../use-navigator.cjs");
function useNavigatorBackButton(props) {
  const {
    onClick,
    as = import_button.default,
    ...otherProps
  } = (0, import_context.useContextSystem)(props, "Navigator.BackButton");
  const {
    goBack
  } = (0, import_use_navigator.useNavigator)();
  const handleClick = (0, import_element.useCallback)((e) => {
    e.preventDefault();
    goBack();
    onClick?.(e);
  }, [goBack, onClick]);
  return {
    as,
    onClick: handleClick,
    ...otherProps
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useNavigatorBackButton
});
//# sourceMappingURL=hook.cjs.map

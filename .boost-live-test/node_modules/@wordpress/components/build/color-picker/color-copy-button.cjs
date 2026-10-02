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

// packages/components/src/color-picker/color-copy-button.tsx
var color_copy_button_exports = {};
__export(color_copy_button_exports, {
  ColorCopyButton: () => ColorCopyButton
});
module.exports = __toCommonJS(color_copy_button_exports);
var import_compose = require("@wordpress/compose");
var import_element = require("@wordpress/element");
var import_icons = require("@wordpress/icons");
var import_i18n = require("@wordpress/i18n");
var import_button = require("../button/index.cjs");
var import_tooltip = __toESM(require("../tooltip/index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
var ColorCopyButton = (props) => {
  const {
    color,
    colorType
  } = props;
  const [copiedColor, setCopiedColor] = (0, import_element.useState)(null);
  const copyTimerRef = (0, import_element.useRef)(void 0);
  const copyRef = (0, import_compose.useCopyToClipboard)(() => {
    switch (colorType) {
      case "hsl": {
        return color.toHslString();
      }
      case "rgb": {
        return color.toRgbString();
      }
      default:
      case "hex": {
        return color.toHex();
      }
    }
  }, () => {
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }
    setCopiedColor(color.toHex());
    copyTimerRef.current = setTimeout(() => {
      setCopiedColor(null);
      copyTimerRef.current = void 0;
    }, 3e3);
  });
  (0, import_element.useEffect)(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);
  const isCopied = copiedColor === color.toHex();
  const label = isCopied ? (0, import_i18n.__)("Copied!") : (0, import_i18n.__)("Copy");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_tooltip.default, {
    delay: 0,
    hideOnClick: false,
    text: label,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_button.Button, {
      size: "compact",
      "aria-label": label,
      ref: copyRef,
      icon: isCopied ? import_icons.check : import_icons.copy,
      showTooltip: false
    })
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ColorCopyButton
});
//# sourceMappingURL=color-copy-button.cjs.map

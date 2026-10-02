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

// packages/components/src/clipboard-button/index.tsx
var clipboard_button_exports = {};
__export(clipboard_button_exports, {
  default: () => ClipboardButton
});
module.exports = __toCommonJS(clipboard_button_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
var import_deprecated = __toESM(require("@wordpress/deprecated"));
var import_button = __toESM(require("../button/index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
var TIMEOUT = 4e3;
function ClipboardButton({
  className,
  children,
  onCopy,
  onFinishCopy,
  text,
  ...buttonProps
}) {
  (0, import_deprecated.default)("wp.components.ClipboardButton", {
    since: "5.8",
    alternative: "wp.compose.useCopyToClipboard"
  });
  const timeoutIdRef = (0, import_element.useRef)(void 0);
  const ref = (0, import_compose.useCopyToClipboard)(text, () => {
    onCopy();
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (onFinishCopy) {
      timeoutIdRef.current = setTimeout(() => onFinishCopy(), TIMEOUT);
    }
  });
  (0, import_element.useEffect)(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);
  const classes = (0, import_clsx.default)("components-clipboard-button", className);
  const focusOnCopyEventTarget = (event) => {
    event.target.focus();
  };
  return (
    // Disable reasons: the parent component takes care of the __next40pxDefaultSize prop.
    // eslint-disable-next-line @wordpress/components-no-missing-40px-size-prop
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_button.default, {
      ...buttonProps,
      className: classes,
      ref,
      onCopy: focusOnCopyEventTarget,
      children
    })
  );
}
//# sourceMappingURL=index.cjs.map

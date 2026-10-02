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

// packages/components/src/panel/body.tsx
var body_exports = {};
__export(body_exports, {
  PanelBody: () => PanelBody,
  UnforwardedPanelBody: () => UnforwardedPanelBody,
  default: () => body_default
});
module.exports = __toCommonJS(body_exports);
var import_clsx = __toESM(require("clsx"));
var import_compose = require("@wordpress/compose");
var import_element = require("@wordpress/element");
var import_icons = require("@wordpress/icons");
var import_button = __toESM(require("../button/index.cjs"));
var import_icon = __toESM(require("../icon/index.cjs"));
var import_utils = require("../utils/index.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var noop = () => {
};
function UnforwardedPanelBody(props, ref) {
  const {
    buttonProps = {},
    children,
    className,
    icon,
    initialOpen,
    onToggle = noop,
    opened,
    title,
    scrollAfterOpen = true
  } = props;
  const [isOpened, setIsOpened] = (0, import_utils.useControlledState)(opened, {
    initial: initialOpen === void 0 ? true : initialOpen,
    fallback: false
  });
  const nodeRef = (0, import_element.useRef)(null);
  const scrollBehavior = (0, import_compose.useReducedMotion)() ? "auto" : "smooth";
  const handleOnToggle = (event) => {
    event.preventDefault();
    const next = !isOpened;
    setIsOpened(next);
    onToggle(next);
  };
  const scrollAfterOpenRef = (0, import_element.useRef)(void 0);
  scrollAfterOpenRef.current = scrollAfterOpen;
  (0, import_utils.useUpdateEffect)(() => {
    if (isOpened && scrollAfterOpenRef.current && nodeRef.current?.scrollIntoView) {
      nodeRef.current.scrollIntoView({
        inline: "nearest",
        block: "nearest",
        behavior: scrollBehavior
      });
    }
  }, [isOpened, scrollBehavior]);
  const classes = (0, import_clsx.default)("components-panel__body", className, {
    "is-opened": isOpened
  });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
    className: classes,
    ref: (0, import_compose.useMergeRefs)([nodeRef, ref]),
    children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelBodyTitle, {
      icon,
      isOpened: Boolean(isOpened),
      onClick: handleOnToggle,
      title,
      ...buttonProps
    }), typeof children === "function" ? children({
      opened: Boolean(isOpened)
    }) : isOpened && children]
  });
}
var PanelBodyTitle = (0, import_element.forwardRef)(({
  isOpened,
  icon,
  title,
  ...props
}, ref) => {
  if (!title) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
    className: "components-panel__body-title",
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_button.default, {
      __next40pxDefaultSize: true,
      className: "components-panel__body-toggle",
      "aria-expanded": isOpened,
      ref,
      ...props,
      children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
        "aria-hidden": "true",
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_icon.default, {
          className: "components-panel__arrow",
          icon: isOpened ? import_icons.chevronUp : import_icons.chevronDown
        })
      }), title, icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_icon.default, {
        icon,
        className: "components-panel__icon",
        size: 20
      })]
    })
  });
});
var PanelBody = (0, import_element.forwardRef)(UnforwardedPanelBody);
PanelBody.displayName = "PanelBody";
var body_default = PanelBody;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PanelBody,
  UnforwardedPanelBody
});
//# sourceMappingURL=body.cjs.map

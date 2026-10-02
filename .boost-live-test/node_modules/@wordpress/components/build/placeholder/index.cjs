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

// packages/components/src/placeholder/index.tsx
var placeholder_exports = {};
__export(placeholder_exports, {
  Placeholder: () => Placeholder,
  default: () => placeholder_default
});
module.exports = __toCommonJS(placeholder_exports);
var import_clsx = __toESM(require("clsx"));
var import_compose = require("@wordpress/compose");
var import_primitives = require("@wordpress/primitives");
var import_element = require("@wordpress/element");
var import_a11y = require("@wordpress/a11y");
var import_icon = __toESM(require("../icon/index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
var PlaceholderIllustration = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_primitives.SVG, {
  className: "components-placeholder__illustration",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 60 60",
  preserveAspectRatio: "none",
  children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_primitives.Path, {
    vectorEffect: "non-scaling-stroke",
    d: "M60 60 0 0"
  })
});
function Placeholder(props) {
  const {
    icon,
    children,
    label,
    instructions,
    className,
    notices,
    preview,
    isColumnLayout,
    withIllustration,
    ...additionalProps
  } = props;
  const [resizeListener, {
    width
  }] = (0, import_compose.useResizeObserver)();
  let modifierClassNames;
  if (typeof width === "number") {
    modifierClassNames = {
      "is-large": width >= 480,
      "is-medium": width >= 160 && width < 480,
      "is-small": width < 160
    };
  }
  const classes = (0, import_clsx.default)("components-placeholder", className, modifierClassNames, withIllustration ? "has-illustration" : null);
  const fieldsetClasses = (0, import_clsx.default)("components-placeholder__fieldset", {
    "is-column-layout": isColumnLayout
  });
  (0, import_element.useEffect)(() => {
    if (instructions) {
      (0, import_a11y.speak)(instructions);
    }
  }, [instructions]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
    ...additionalProps,
    className: classes,
    children: [withIllustration ? PlaceholderIllustration : null, resizeListener, notices, preview && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
      className: "components-placeholder__preview",
      children: preview
    }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
      className: "components-placeholder__label",
      children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_icon.default, {
        icon
      }), label]
    }), !!instructions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
      className: "components-placeholder__instructions",
      children: instructions
    }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
      className: fieldsetClasses,
      children
    })]
  });
}
var placeholder_default = Placeholder;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Placeholder
});
//# sourceMappingURL=index.cjs.map

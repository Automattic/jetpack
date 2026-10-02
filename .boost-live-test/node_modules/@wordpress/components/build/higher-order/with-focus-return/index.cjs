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

// packages/components/src/higher-order/with-focus-return/index.tsx
var with_focus_return_exports = {};
__export(with_focus_return_exports, {
  Provider: () => Provider,
  default: () => with_focus_return_default
});
module.exports = __toCommonJS(with_focus_return_exports);
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
var import_deprecated = __toESM(require("@wordpress/deprecated"));
var import_jsx_runtime = require("react/jsx-runtime");
function isComponentLike(object) {
  return object instanceof import_element.Component || typeof object === "function";
}
var with_focus_return_default = (0, import_compose.createHigherOrderComponent)(
  // @ts-expect-error TODO: Reconcile with intended `createHigherOrderComponent` types
  (options) => {
    const HoC = ({
      onFocusReturn
    } = {}) => (WrappedComponent) => {
      const WithFocusReturn = (props) => {
        const ref = (0, import_compose.useFocusReturn)(onFocusReturn);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
          ref,
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WrappedComponent, {
            ...props
          })
        });
      };
      return WithFocusReturn;
    };
    if (isComponentLike(options)) {
      const WrappedComponent = options;
      return HoC()(WrappedComponent);
    }
    return HoC(options);
  },
  "withFocusReturn"
);
var Provider = ({
  children
}) => {
  (0, import_deprecated.default)("wp.components.FocusReturnProvider component", {
    since: "5.7",
    hint: "This provider is not used anymore. You can just remove it from your codebase"
  });
  return children;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Provider
});
//# sourceMappingURL=index.cjs.map

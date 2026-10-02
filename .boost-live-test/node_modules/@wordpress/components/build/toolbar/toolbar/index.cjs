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

// packages/components/src/toolbar/toolbar/index.tsx
var toolbar_exports = {};
__export(toolbar_exports, {
  Toolbar: () => Toolbar,
  default: () => toolbar_default
});
module.exports = __toCommonJS(toolbar_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_deprecated = __toESM(require("@wordpress/deprecated"));
var import_toolbar_group = __toESM(require("../toolbar-group/index.cjs"));
var import_toolbar_container = __toESM(require("./toolbar-container.cjs"));
var import_context = require("../../context/index.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function UnforwardedToolbar({
  className,
  label,
  variant,
  ...props
}, ref) {
  const isVariantDefined = variant !== void 0;
  const contextSystemValue = (0, import_element.useMemo)(() => {
    if (isVariantDefined) {
      return {};
    }
    return {
      DropdownMenu: {
        variant: "toolbar"
      },
      Dropdown: {
        variant: "toolbar"
      },
      Menu: {
        variant: "toolbar"
      }
    };
  }, [isVariantDefined]);
  if (!label) {
    (0, import_deprecated.default)("Using Toolbar without label prop", {
      since: "5.6",
      alternative: "ToolbarGroup component",
      link: "https://developer.wordpress.org/block-editor/components/toolbar/"
    });
    const {
      title: _title,
      ...restProps
    } = props;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_toolbar_group.default, {
      isCollapsed: false,
      ...restProps,
      className
    });
  }
  const finalClassName = (0, import_clsx.default)("components-accessible-toolbar", className, variant && `is-${variant}`);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_context.ContextSystemProvider, {
    value: contextSystemValue,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_toolbar_container.default, {
      className: finalClassName,
      label,
      ref,
      ...props
    })
  });
}
var Toolbar = (0, import_element.forwardRef)(UnforwardedToolbar);
Toolbar.displayName = "Toolbar";
var toolbar_default = Toolbar;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Toolbar
});
//# sourceMappingURL=index.cjs.map
